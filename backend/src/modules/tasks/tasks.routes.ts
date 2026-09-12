import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema, updateTaskStatusSchema } from "./tasks.schema";
import * as tasksController from "./tasks.controller";

const router = Router();

router.use(authenticate);

router.get("/", validate(listTasksQuerySchema, "query"), tasksController.listTasks);
router.get("/:id", tasksController.getTask);

router.post("/", authorize(Role.ADMIN, Role.PM), validate(createTaskSchema), tasksController.createTask);
router.patch("/:id", authorize(Role.ADMIN, Role.PM), validate(updateTaskSchema), tasksController.updateTask);

// No role gate: Admin, PM, and Developer can all move a task's status - the
// service layer restricts *which* tasks each of them may move.
router.patch("/:id/status", validate(updateTaskStatusSchema), tasksController.updateTaskStatus);

export default router;
