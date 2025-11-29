import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { doctorScheduleService } from "./doctorSchedule.service";
import { IJWTPayload } from "../../type/common";
import { IAuthUser } from "../../interfaces/common";
import pick from "../../helper/pick";
import { StatusCodes } from "http-status-codes";

const insertIntoDB = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;

    const result = await doctorScheduleService.insertIntoDB(
      user as IJWTPayload,
      req.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor Schedule Created successfully!",

      data: result,
    });
  }
);

const getMySchedule = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const filters = pick(req.query, ["startDate", "endDate", "isBooked"]);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

    const user = req.user;
    const result = await doctorScheduleService.getMySchedule(
      filters,
      options,
      user as IAuthUser
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "My Schedule fetched successfully!",
      data: result,
    });
  }
);

export const doctorScheduleController = {
  insertIntoDB,
  getMySchedule,
};
