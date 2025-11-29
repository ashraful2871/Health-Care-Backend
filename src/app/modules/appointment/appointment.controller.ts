import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import status from "http-status";
import sendResponse from "../../shared/sendResponse";

import { IJWTPayload } from "../../type/common";
import { appointmentService } from "./appointment.service";
import pick from "../../helper/pick";
import { StatusCodes } from "http-status-codes";

const createAppointment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await appointmentService.createAppointment(
      user as IJWTPayload,
      req.body
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Appointment create successfully",

      data: result,
    });
  }
);
const getMyAppointment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const filters = pick(req.query, ["status", "paymentStatus"]);

    const user = req.user;
    const result = await appointmentService.getMyAppointment(
      user as IJWTPayload,
      filters,
      options
    );
    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Appointment Fetch successfully",

      data: result.data,
      meta: result.meta,
    });
  }
);
const updateAppointmentStatus = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    const result = await appointmentService.updateAppointmentStatus(
      id,
      status,
      user as IJWTPayload
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Appointment Updated successfully",

      data: result,
    });
  }
);

export const appointmentController = {
  createAppointment,
  getMyAppointment,
  updateAppointmentStatus,
};
