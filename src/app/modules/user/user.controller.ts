import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { userService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";
import { userFilterableFields, userSearchAbleFields } from "./user.constain";
import { IJWTPayload } from "../../type/common";
import { StatusCodes } from "http-status-codes";
import { IAuthUser } from "../../interfaces/common";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createPatient(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
  });
});
const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createDoctor(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Doctor created successfully",
    data: result,
  });
});
const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createAdmin(req);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

const getAllFromDb = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const option = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  // const { page, limit, searchTerm, sortBy, sortOrder, role, status } =
  //   req?.query;
  const result = await userService.getAllFromDb(filters, option);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;

    const result = await userService.getMyProfile(user as IJWTPayload);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "My Profile Fetched successfully",
      data: result,
    });
  }
);
const changedProfileStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await userService.changedProfileStatus(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My Profile Fetched successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user;

    const result = await userService.updateMyProfile(user as IAuthUser, req);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "My profile updated!",
      data: result,
    });
  }
);

export const userController = {
  createPatient,
  createDoctor,
  getAllFromDb,
  createAdmin,
  getMyProfile,
  changedProfileStatus,
  updateMyProfile,
};
