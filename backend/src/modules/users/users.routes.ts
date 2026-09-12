import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "./users.schema";
import * as usersController from "./users.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(Role.ADMIN, Role.PM), validate(listUsersQuerySchema, "query"), usersController.listUsers);
router.post("/", authorize(Role.ADMIN), validate(createUserSchema), usersController.createUser);
router.get("/:id", authorize(Role.ADMIN), usersController.getUser);
router.patch("/:id", authorize(Role.ADMIN), validate(updateUserSchema), usersController.updateUser);

export default router;
