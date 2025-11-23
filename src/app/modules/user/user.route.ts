import { NextFunction, Request, Response, Router } from "express";
import { userController } from "./user.controller";
import { fileUploader } from "../../helper/fileUploader";
import { userValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.get("/", auth(UserRole.ADMIN), userController.getAllFromDb);

router.get(
  "/me",
  auth(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN),
  userController.getMyProfile
);

router.post(
  "/:id/status",
  auth(UserRole.ADMIN),
  userController.changedProfileStatus
);

router.post(
  "/create-patient",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createPatientValidationSchema.parse(
      JSON.parse(req.body.data)
    );

    return userController.createPatient(req, res, next);
  }
);
router.post(
  "/create-doctor",
  auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createDoctorValidationSchema.parse(
      JSON.parse(req.body.data)
    );
    console.log(req.body.data);

    return userController.createDoctor(req, res, next);
  }
);
router.post(
  "/create-admin",
  auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createAdminValidationSchema.parse(
      JSON.parse(req.body.data)
    );

    return userController.createAdmin(req, res, next);
  }
);

router.patch(
  "/update-my-profile",
  auth(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    return userController.updateMyProfile(req, res, next);
  }
);

export const userRoutes = router;
