import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { scheduleRoutes } from "../modules/Schedule/schedule.routes";
import { doctorScheduleRoutes } from "../modules/DoctorSchedule/doctorSchedule.route";
import { specialtiesRoutes } from "../modules/specialties/specialties.routes";
import { doctorRoutes } from "../modules/Doctor/doctor.route";
import { appointmentRoute } from "../modules/appointment/appointment.route";
import { prescriptionRoute } from "../modules/Prescriptions/prescription.route";
import { reviewRoutes } from "../modules/review/review.route";
import { patientRoutes } from "../modules/patient/paitent.route";
import { metaRoute } from "../modules/meta-data/meta.route";
import path from "path";
import { adminRoutes } from "../modules/admin/admin.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/schedule",
    route: scheduleRoutes,
  },
  {
    path: "/doctor-schedule",
    route: doctorScheduleRoutes,
  },
  {
    path: "/specialties",
    route: specialtiesRoutes,
  },
  {
    path: "/doctor",
    route: doctorRoutes,
  },
  {
    path: "/appointment",
    route: appointmentRoute,
  },
  {
    path: "/prescription",
    route: prescriptionRoute,
  },
  {
    path: "/review",
    route: reviewRoutes,
  },
  {
    path: "/patient",
    route: patientRoutes,
  },
  {
    path: "/meta-data",
    route: metaRoute,
  },
  {
    path: "/admin",
    route: adminRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
