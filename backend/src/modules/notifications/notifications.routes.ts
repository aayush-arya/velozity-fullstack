import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { listNotificationsQuerySchema } from "./notifications.schema";
import * as notificationsController from "./notifications.controller";

const router = Router();

router.use(authenticate);
router.get("/", validate(listNotificationsQuerySchema, "query"), notificationsController.list);
router.patch("/read-all", notificationsController.markAllRead);
router.patch("/:id/read", notificationsController.markOneRead);

export default router;
