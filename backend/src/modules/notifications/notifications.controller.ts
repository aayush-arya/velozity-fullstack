import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as notificationsService from "./notifications.service";
import type { ListNotificationsQuery } from "./notifications.schema";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as ListNotificationsQuery;
  const result = await notificationsService.listNotifications(req.user!.id, page, limit);
  res.json(result);
});

export const markOneRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAsRead(req.user!.id, req.params.id);
  res.status(204).send();
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllAsRead(req.user!.id);
  res.status(204).send();
});
