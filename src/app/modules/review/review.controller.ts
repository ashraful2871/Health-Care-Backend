import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { reviewService } from "./review.service";
import { StatusCodes } from "http-status-codes";
import { IJWTPayload } from "../../type/common";
import pick from "../../helper/pick";
import { reviewFilterableFields } from "./review.contant";

const insertToDb = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await reviewService.insertToDb(
      user as IJWTPayload,
      req.body
    );
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Review created successfully",
      data: result,
    });
  }
);

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, reviewFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await reviewService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Reviews retrieval successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const reviewController = {
  insertToDb,
  getAllFromDB,
};
