import {
  AppointmentStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { stripe } from "../../helper/stripe";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../type/common";
import { v4 as uuidv4 } from "uuid";
import ApiError from "../../Errors/apiError";
import statusCode from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { IPaginationOptions } from "../../interfaces/pagination";
import { StatusCodes } from "http-status-codes";

const createAppointment = async (
  user: IAuthUser,
  payload: { doctorId: string; scheduleId: string }
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  await prisma.doctorSchedules.findFirstOrThrow({
    where: {
      doctorId: payload.doctorId,
      scheduleId: payload.scheduleId,
      isBooked: false,
    },
  });

  const videoCallingId = uuidv4();

  const result = await prisma.$transaction(async (tnx) => {
    const appointmentData = await tnx.appointment.create({
      data: {
        patientId: patientData.id,
        doctorId: doctorData.id,
        scheduleId: payload.scheduleId,
        videoCallingId,
      },
      include: {
        patient: true,
        doctor: true,
        schedule: true,
      },
    });

    await tnx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
        appointmentId: appointmentData.id,
      },
    });

    const today = new Date();

    const transactionId =
      "HealthCare" +
      today.getFullYear() +
      "-" +
      today.getMonth() +
      "-" +
      today.getDay() +
      "-" +
      today.getHours() +
      "-" +
      today.getMinutes();

    await tnx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    return appointmentData;

    // const paymentData = await tnx.payment.create({
    //   data: {
    //     appointmentId: appointmentData.id,
    //     amount: doctorData.appointmentFee,
    //     transactionId,
    //   },
    // });
    // const transactionId = uuidv4();
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ["card"],
    //   mode: "payment",
    //   customer_email: user?.email,
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: "bdt",
    //         product_data: {
    //           name: `Appointment with ${doctorData.name}`,
    //         },
    //         unit_amount: doctorData.appointmentFee * 100,
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   metadata: {
    //     appointmentId: appointmentData.id,
    //     paymentId: paymentData.id,
    //   },
    //   success_url: `https://www.programming-hero.com/`,
    //   cancel_url: `https://next.programming-hero.com/`,
    // });

    // return { paymentUrl: session.url };
  });

  return result;
};

const getMyAppointment = async (
  user: IAuthUser,
  filters: any,
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { ...filterData } = filters;

  const andConditions: Prisma.AppointmentWhereInput[] = [];

  if (user?.role === UserRole.PATIENT) {
    andConditions.push({
      patient: {
        email: user.email,
      },
    });
  } else if (user?.role === UserRole.DOCTOR) {
    andConditions.push({
      doctor: {
        email: user.email,
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.appointment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : { createdAt: "desc" },
    include:
      user?.role === UserRole.PATIENT
        ? { doctor: true, schedule: true, review: true, prescription: true }
        : {
            patient: {
              include: {
                medicalReport: true,
                patientHealthData: true,
              },
            },
            schedule: true,
            prescription: true,
            review: true,
          },
  });

  const total = await prisma.appointment.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      limit,
      page,
    },
    data: result,
  };
};

const updateAppointmentStatus = async (
  appointmentId: string,
  status: AppointmentStatus,
  user: IAuthUser
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
    },
  });

  if (user?.role === UserRole.DOCTOR) {
    if (!(user?.email === appointmentData.doctor.email))
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "This IS not Your Appointment"
      );
  }

  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status,
    },
  });
};

const cancelUnpaidAppointments = async () => {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  // Find unpaid appointments older than 30 minutes
  const unPaidAppointments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        lte: thirtyMinAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  const appointmentIdsToCancel = unPaidAppointments.map((a) => a.id);

  if (appointmentIdsToCancel.length === 0) return; // Nothing to cancel

  await prisma.$transaction(async (tx) => {
    // Delete dependent records first
    await tx.prescription.deleteMany({
      where: { appointmentId: { in: appointmentIdsToCancel } },
    });

    await tx.review.deleteMany({
      where: { appointmentId: { in: appointmentIdsToCancel } },
    });

    await tx.payment.deleteMany({
      where: { appointmentId: { in: appointmentIdsToCancel } },
    });

    // Delete appointments
    await tx.appointment.deleteMany({
      where: { id: { in: appointmentIdsToCancel } },
    });

    // Reset doctor schedules
    for (const appointment of unPaidAppointments) {
      await tx.doctorSchedules.updateMany({
        where: {
          doctorId: appointment.doctorId,
          scheduleId: appointment.scheduleId,
        },
        data: { isBooked: false },
      });
    }
  });
};

export const appointmentService = {
  createAppointment,
  getMyAppointment,
  updateAppointmentStatus,
  cancelUnpaidAppointments,
};
