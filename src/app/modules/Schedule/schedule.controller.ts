import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { scheduleService } from "./schedule.service";
import pick from "../../helper/pick";
import { IJWTPayload } from "../../type/common";
import { IAuthUser } from "../../interfaces/common";
import { StatusCodes } from "http-status-codes";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await scheduleService.insertIntoDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Schedule created successfully!",
    data: result,
  });
});

const schedulesForDoctor = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const option = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const filters = pick(req.query, ["startDateTime", "endDateTime"]);

    const user = req.user;
    const result = await scheduleService.schedulesForDoctor(
      user as IJWTPayload,
      filters,
      option
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Schedule Retrieved successfully!",
      meta: result.meta,
      data: result.data,
    });
  }
);
const deleteScheduleFromDb = catchAsync(async (req: Request, res: Response) => {
  const result = await scheduleService.deleteScheduleFromDb(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Schedule Deleted successfully!",
    data: result,
  });
});

export const scheduleController = {
  insertIntoDB,
  schedulesForDoctor,
  deleteScheduleFromDb,
};
