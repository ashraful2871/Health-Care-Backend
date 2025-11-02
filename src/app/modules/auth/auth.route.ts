import { Router } from "express";
import { authController } from "./auth.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/login", authController.login);
router.get("/me", authController.getMe);
router.post("/refresh-token", authController.refreshToken);

router.post(
  "/change-password",
  auth(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  authController.changePassword
);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);

export const authRoutes = router;
