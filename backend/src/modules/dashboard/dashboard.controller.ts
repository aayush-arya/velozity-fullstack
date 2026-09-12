import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as dashboardService from "./dashboard.service";

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await dashboardService.getAdminDashboard());
});

export const getPmDashboard = asyncHandler(async (req: Request, res: Response) => {
  res.json(await dashboardService.getPmDashboard(req.user!));
});

export const getDeveloperDashboard = asyncHandler(async (req: Request, res: Response) => {
  res.json(await dashboardService.getDeveloperDashboard(req.user!));
});
