import { Doctor, Prisma, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../helper/paginationHelper";
import { doctorSearchableFields } from "./doctor.constaint";
import { prisma } from "../../shared/prisma";
import { IDoctorFilterRequest, IDoctorUpdate } from "./doctor.interface";
import { openai } from "../../helper/open-router";
import { extractJsonFromMessage } from "../../helper/extractJsonFromMessage";
import { IPaginationOptions } from "../../interfaces/pagination";

const getAllFromDB = async (
  filters: IDoctorFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, specialties, ...filterDate } = filters;

  const andConditions: Prisma.DoctorWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: doctorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (specialties && specialties.length > 0) {
    const specialtiesArray = Array.isArray(specialties)
      ? specialties
      : [specialties];
    andConditions.push({
      doctorSpecialties: {
        some: {
          specialities: {
            title: {
              in: specialtiesArray,
              mode: "insensitive",
            },
          },
        },
      },
    });
  }

  if (Object.keys(filterDate).length > 0) {
    const filterCondition = Object.keys(filterDate).map((key) => ({
      [key]: {
        equals: (filterDate as any)[key],
      },
    }));

    andConditions.push(...filterCondition);
  }
  const whereConditions: Prisma.DoctorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const result = await prisma.doctor.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { averageRating: "desc" },
    include: {
      doctorSpecialties: {
        include: {
          specialities: {
            select: {
              title: true,
            },
          },
        },
      },
      doctorSchedule: {
        include: {
          schedule: true,
        },
      },
      review: {
        select: {
          rating: true,
        },
      },
    },
  });

  const total = await prisma.doctor.count({
    where: whereConditions,
  });
  return {
    meta: { page, limit, total },
    data: result,
  };
};

const updateDoctorInfoDb = async (id: string, payload: IDoctorUpdate) => {
  const { specialties, removeSpecialties, ...doctorData } = payload;

  const doctorInfo = await prisma.doctor.findFirstOrThrow({
    where: {
      id,
      isDeleted: false,
    },
  });

  await prisma.$transaction(async (tnx) => {
    if (Object.keys(doctorData).length > 0) {
      await tnx.doctor.update({
        where: {
          id,
        },
        data: doctorData,
      });

      if (
        removeSpecialties &&
        Array.isArray(removeSpecialties) &&
        removeSpecialties.length > 0
      ) {
        const existingDoctorSpecialties = await tnx.doctorSpecialties.findMany({
          where: {
            doctorId: doctorInfo.id,
            specialitiesId: {
              in: removeSpecialties,
            },
          },
        });

        if (existingDoctorSpecialties.length !== removeSpecialties.length) {
          const foundIds = existingDoctorSpecialties.map(
            (ds) => ds.specialitiesId
          );
          const notFound = removeSpecialties.filter(
            (id) => !foundIds.includes(id)
          );
          throw new Error(
            `Cannot remove non-existent specialties: ${notFound.join(", ")}`
          );
        }
        await tnx.doctorSpecialties.deleteMany({
          where: {
            doctorId: doctorInfo.id,
            specialitiesId: {
              in: removeSpecialties,
            },
          },
        });
      }
    }

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
      const invalidSpecialtyIds = specialties.filter(
        (id) => !existingSpecialtyIds.includes(id)
      );
      if (invalidSpecialtyIds.length > 0) {
        throw new Error(
          `Invalid specialty IDs: ${invalidSpecialtyIds.join(", ")}`
        );
      }
      const currentDoctorSpecialties = await tnx.doctorSpecialties.findMany({
        where: {
          doctorId: doctorInfo.id,
          specialitiesId: {
            in: specialties,
          },
        },
        select: {
          specialitiesId: true,
        },
      });

      const currentSpecialtyIds = currentDoctorSpecialties.map(
        (ds) => ds.specialitiesId
      );
      const newSpecialties = specialties.filter(
        (id) => !currentSpecialtyIds.includes(id)
      );
      if (newSpecialties.length > 0) {
        const doctorSpecialtiesData = newSpecialties.map((specialtyId) => ({
          doctorId: doctorInfo.id,
          specialitiesId: specialtyId,
        }));

        await tnx.doctorSpecialties.createMany({
          data: doctorSpecialtiesData,
        });
      }
    }
  });

  const result = await prisma.doctor.findUnique({
    where: {
      id: doctorInfo.id,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
    },
  });
  return result;
};

const getByIdFromDB = async (id: string): Promise<Doctor | null> => {
  const result = await prisma.doctor.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
      doctorSchedule: {
        include: {
          schedule: true,
        },
      },
      review: true,
    },
  });
  return result;
};

const deleteFromDB = async (id: string): Promise<Doctor> => {
  return await prisma.$transaction(async (transactionClient) => {
    const deleteDoctor = await transactionClient.doctor.delete({
      where: {
        id,
      },
    });

    await transactionClient.user.delete({
      where: {
        email: deleteDoctor.email,
      },
    });

    return deleteDoctor;
  });
};

const softDelete = async (id: string): Promise<Doctor> => {
  return await prisma.$transaction(async (transactionClient) => {
    const deleteDoctor = await transactionClient.doctor.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    await transactionClient.user.update({
      where: {
        email: deleteDoctor.email,
      },
      data: {
        status: UserStatus.DELETED,
      },
    });

    return deleteDoctor;
  });
};

const getAiSuggestions = async (payload: { symptoms: string }) => {
  const doctors = await prisma.doctor.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
    },
  });
  console.log("doctors data loaded.......\n");
  const prompt = `
You are a medical assistant AI. Based on the patient's symptoms, suggest the top 3 most suitable doctors.
Each doctor has specialties and years of experience.
Only suggest doctors who are relevant to the given symptoms.

Symptoms: ${payload.symptoms}

Here is the doctor list (in JSON):
${JSON.stringify(doctors, null, 2)}

Return your response in JSON format with full individual doctor data. 
`;
  console.log("analyzing......\n");
  const completion = await openai.chat.completions.create({
    model: "tngtech/deepseek-r1t2-chimera:free",
    messages: [
      {
        role: "user",
        content:
          "You are a helpful AI medical assistant that provides doctor suggestions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const result = await extractJsonFromMessage(completion.choices[0].message);
  // console.log(completion.choices[0].message);
  return result;
};

export const doctorService = {
  getAllFromDB,
  updateDoctorInfoDb,
  getByIdFromDB,
  deleteFromDB,
  softDelete,
  getAiSuggestions,
};
