import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as activityService from "./activity.service";
import type { FeedQueryInput } from "./activity.schema";

export const getFeed = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as FeedQueryInput;
  const result = await activityService.getActivityFeed(req.user!, query);
  res.json(result);
});
