import { Request, Response } from "express";
import httpStatus from "http-status";
import { SpecialtiesService } from "./specialties.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";
import { userService } from "../user/user.service";
import { IAuthUser } from "../../interfaces/common";
import { StatusCodes } from "http-status-codes";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialtiesService.insertIntoDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialties created successfully!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await SpecialtiesService.getAllFromDB(options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialties data fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SpecialtiesService.deleteFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Specialty deleted successfully",
    data: result,
  });
});

export const SpecialtiesController = {
  insertIntoDB,
  getAllFromDB,
  deleteFromDB,
};
