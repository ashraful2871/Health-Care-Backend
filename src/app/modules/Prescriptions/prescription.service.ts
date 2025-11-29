import {
  AppointmentStatus,
  PaymentStatus,
  Prescription,
  UserRole,
} from "@prisma/client";
import { IJWTPayload } from "../../type/common";
import { prisma } from "../../shared/prisma";
import ApiError from "../../Errors/apiError";
import { StatusCodes } from "http-status-codes";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { IAuthUser } from "../../interfaces/common";

const createPrescription = async (
  user: IAuthUser,
  payload: Partial<Prescription>
) => {
  const appointmentData = await prisma.appointment.findFirstOrThrow({
    where: {
      id: payload.appointmentId,
      status: AppointmentStatus.COMPLETED,
      // paymentStatus: PaymentStatus.PAID,
    },

    include: {
      doctor: true,
    },
  });

  if (!(user?.email === appointmentData.doctor.email))
    throw new ApiError(StatusCodes.BAD_REQUEST, "This is not your appointment");

  return await prisma.prescription.create({
    data: {
      appointmentId: appointmentData.id,
      doctorId: appointmentData.doctorId,
      patientId: appointmentData.patientId,
      instructions: payload.instructions as string,
      followUpDate: payload.followUpDate || null,
    },
    include: {
      patient: true,
    },
  });
};

const patientPrescription = async (user: IJWTPayload, options: IOptions) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const result = await prisma.prescription.findMany({
    where: {
      patient: {
        email: user.email,
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      doctor: true,
      patient: true,
      appointment: true,
    },
  });
  console.log(result);
  const total = await prisma.prescription.count({
    where: {
      patient: {
        email: user.email,
      },
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};
export const prescriptionsService = {
  createPrescription,
  patientPrescription,
};
