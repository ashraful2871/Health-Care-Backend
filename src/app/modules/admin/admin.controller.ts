import { Request, RequestHandler, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import pick from "../../helper/pick";
import { adminFilterableFields } from "./admin.constant";
import { adminService } from "./admin.service";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

const getAllFromDB: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, adminFilterableFields);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
    const result = await adminService.getAllFromDB(filters, options);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Admin data fetched!",
      meta: result.meta,
      data: result.data,
    });
  }
);

const updateIntoDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await adminService.updateIntoDb(id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin data updated!",
    data: result,
  });
});

export const adminController = {
  getAllFromDB,
  updateIntoDB,
};
