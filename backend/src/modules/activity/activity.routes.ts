import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { feedQuerySchema } from "./activity.schema";
import * as activityController from "./activity.controller";

const router = Router();

router.use(authenticate);
router.get("/", validate(feedQuerySchema, "query"), activityController.getFeed);

export default router;
