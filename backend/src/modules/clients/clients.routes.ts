import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createClientSchema } from "./clients.schema";
import * as clientsController from "./clients.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(Role.ADMIN, Role.PM), clientsController.listClients);
router.post("/", authorize(Role.ADMIN, Role.PM), validate(createClientSchema), clientsController.createClient);

export default router;
