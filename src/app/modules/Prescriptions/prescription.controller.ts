import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../type/common";
import { prescriptionsService } from "./prescription.service";
import pick from "../../helper/pick";
import { StatusCodes } from "http-status-codes";

const createPrescription = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await prescriptionsService.createPrescription(
      user as IJWTPayload,
      req.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Prescription created Successfully",
      data: result,
    });
  }
);
const patientPrescription = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const result = await prescriptionsService.patientPrescription(
      user as IJWTPayload,
      options
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Prescription Retrieve Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

export const prescriptionController = {
  createPrescription,
  patientPrescription,
};
