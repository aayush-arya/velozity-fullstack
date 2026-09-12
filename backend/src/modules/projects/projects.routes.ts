import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createProjectSchema, updateProjectSchema } from "./projects.schema";
import * as projectsController from "./projects.controller";

const router = Router();

router.use(authenticate);

// Every role can list/view - the service layer scopes what comes back.
router.get("/", projectsController.listProjects);
router.get("/:id", projectsController.getProject);

// Only Admin and PM may create or edit projects at all.
router.post("/", authorize(Role.ADMIN, Role.PM), validate(createProjectSchema), projectsController.createProject);
router.patch("/:id", authorize(Role.ADMIN, Role.PM), validate(updateProjectSchema), projectsController.updateProject);

export default router;
