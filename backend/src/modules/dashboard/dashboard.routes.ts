import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import * as dashboardController from "./dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/admin", authorize(Role.ADMIN), dashboardController.getAdminDashboard);
router.get("/pm", authorize(Role.PM), dashboardController.getPmDashboard);
router.get("/developer", authorize(Role.DEVELOPER), dashboardController.getDeveloperDashboard);

export default router;
