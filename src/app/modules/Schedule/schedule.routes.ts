import { Router } from "express";
import { scheduleController } from "./schedule.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.DOCTOR),
  scheduleController.schedulesForDoctor
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  scheduleController.getByIdFromDB
);

router.post("/", auth(UserRole.ADMIN), scheduleController.insertIntoDB);
router.delete(
  "/:id",
  auth(UserRole.ADMIN),
  scheduleController.deleteScheduleFromDb
);

export const scheduleRoutes = router;
