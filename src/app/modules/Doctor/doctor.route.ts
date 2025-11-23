import { Router } from "express";
import { doctorController } from "./doctor.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { DoctorValidation } from "./doctor.validation";

const router = Router();

router.get("/", doctorController.getAllFromDb);

router.post("/suggestion", doctorController.getAiSuggestions);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.DOCTOR),
  validateRequest(DoctorValidation.update),
  doctorController.updateDoctorInfoDb
);

router.get("/:id", doctorController.getByIdFromDB);

router.delete("/:id", auth(UserRole.ADMIN), doctorController.deleteFromDB);

router.delete("/soft/:id", auth(UserRole.ADMIN), doctorController.softDelete);

export const doctorRoutes = router;
