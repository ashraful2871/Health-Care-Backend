import { UserRole } from "@prisma/client";
import { adminController } from "./admin.controller";
import auth from "../../middlewares/auth";
import { Router } from "express";
import { adminValidationSchemas } from "./admin.validations";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router.get("/", auth(UserRole.ADMIN), adminController.getAllFromDB);

router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(adminValidationSchemas.update),
  adminController.updateIntoDB
);

export const adminRoutes = router;
