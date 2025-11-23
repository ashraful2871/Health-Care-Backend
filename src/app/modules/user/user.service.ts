import { Request } from "express";
import { prisma } from "../../shared/prisma";
import { createPatientInput } from "./user.interface";
import bcrypt from "bcryptjs";
import { fileUploader } from "../../helper/fileUploader";
import { Admin, Prisma, UserRole, UserStatus } from "@prisma/client";
import { userSearchAbleFields } from "./user.constain";
import { paginationHelper } from "../../helper/paginationHelper";
import { IJWTPayload } from "../../type/common";
import { IAuthUser } from "../../interfaces/common";

const createPatient = async (req: Request) => {
  if (req.file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(req.file);
    req.body.patient.profilePhoto = uploadedResult?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const result = await prisma.$transaction(async (tnx) => {
    await tnx.user.create({
      data: {
        email: req.body.patient.email,
        password: hashedPassword,
      },
    });

    return await tnx.patient.create({
      data: req.body.patient,
    });
  });

  return result;
};

const createDoctor = async (req: Request) => {
  const file = req.file;
  if (file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(file);
    req.body.doctor.profilePhoto = uploadedResult?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const userData = {
    email: req.body.doctor.email,
    password: hashedPassword,
    role: UserRole.DOCTOR,
  };

  const { specialties, ...doctorData } = req.body.doctor;

  const result = await prisma.$transaction(async (tnx) => {
    await tnx.user.create({
      data: userData,
    });

    const createdDoctorData = await tnx.doctor.create({
      data: doctorData,
    });

    if (specialties && Array.isArray(specialties) && specialties.length > 0) {
      const existingSpecialties = await tnx.specialties.findMany({
        where: {
          id: {
            in: specialties,
          },
        },
        select: {
          id: true,
        },
      });
      const existingSpecialtyIds = existingSpecialties.map((s) => s.id);
      const invalidSpecialties = specialties.filter(
        (id) => !existingSpecialtyIds.includes(id)
      );
      if (invalidSpecialties.length > 0) {
        throw new Error(
          `Invalid specialty IDs: ${invalidSpecialties.join(", ")}`
        );
      }
      const doctorSpecialtyData = specialties.map((specialtyId) => ({
        doctorId: createdDoctorData.id,
        specialitiesId: specialtyId,
      }));
      await tnx.doctorSpecialties.createMany({
        data: doctorSpecialtyData,
      });
    }

    const doctorWithSpecialties = await tnx.doctor.findUnique({
      where: {
        id: createdDoctorData.id,
      },
      include: {
        doctorSpecialties: {
          include: {
            specialities: true,
          },
        },
      },
    });

    return doctorWithSpecialties!;
  });

  return result;
};

const createAdmin = async (req: Request): Promise<Admin> => {
  const file = req.file;
  if (file) {
    const uploadedResult = await fileUploader.uploadToCloudinary(file);
    req.body.admin.profilePhoto = uploadedResult?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const userData = {
    email: req.body.admin.email,
    password: hashedPassword,
    role: UserRole.ADMIN,
  };

  const result = await prisma.$transaction(async (tnx) => {
    await tnx.user.create({
      data: userData,
    });

    return await tnx.admin.create({
      data: req.body.admin,
    });
  });

  return result;
};

const getAllFromDb = async (params: any, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = params;
  const adnConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    adnConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    adnConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereCOnditions: Prisma.UserWhereInput =
    adnConditions.length > 0 ? { AND: adnConditions } : {};

  const result = await prisma.user.findMany({
    skip,
    take: limit,
    where: {
      AND: adnConditions,
    },
    orderBy:
      sortBy && sortOrder
        ? {
            [sortBy]: sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.user.count({
    where: whereCOnditions,
  });
  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getMyProfile = async (user: IJWTPayload) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      needPasswordChange: true,
      role: true,
      status: true,
    },
  });

  let profileData;
  if (userInfo.role === UserRole.PATIENT) {
    profileData = await prisma.patient.findUnique({
      where: {
        email: userInfo.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        address: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        patientHealthData: true,
        medicalReport: {
          select: {
            id: true,
            patientId: true,
            reportName: true,
            reportLink: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  } else if (userInfo.role === UserRole.DOCTOR) {
    profileData = await prisma.doctor.findUnique({
      where: {
        email: userInfo.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        address: true,
        registrationNumber: true,
        experience: true,
        gender: true,
        appointmentFee: true,
        qualification: true,
        currentWorkingPlace: true,
        designation: true,
        averageRating: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        doctorSpecialties: {
          include: {
            specialities: true,
          },
        },
      },
    });
  } else if (userInfo.role === UserRole.ADMIN) {
    profileData = await prisma.admin.findUnique({
      where: {
        email: userInfo.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  return {
    ...userInfo,
    ...profileData,
  };
};

const changedProfileStatus = async (
  id: string,
  payload: { status: UserStatus }
) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const updateUserStatus = await prisma.user.update({
    where: { id },
    data: payload,
  });

  return updateUserStatus;
};

const updateMyProfile = async (user: IAuthUser, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const file = req.file;
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.profilePhoto = uploadToCloudinary?.secure_url;
  }

  let profileInfo;

  if (userInfo.role === UserRole.ADMIN) {
    profileInfo = await prisma.admin.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  } else if (userInfo.role === UserRole.DOCTOR) {
    profileInfo = await prisma.doctor.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  } else if (userInfo.role === UserRole.PATIENT) {
    profileInfo = await prisma.patient.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  }

  return { ...profileInfo };
};

export const userService = {
  createPatient,
  createDoctor,
  createAdmin,
  getAllFromDb,
  getMyProfile,
  changedProfileStatus,
  updateMyProfile,
};
