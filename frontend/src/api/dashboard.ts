import { api } from "./client";
import type { AdminDashboardData, DeveloperDashboardData, PmDashboardData } from "../types";

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>("/dashboard/admin");
  return data;
}

export async function getPmDashboard(): Promise<PmDashboardData> {
  const { data } = await api.get<PmDashboardData>("/dashboard/pm");
  return data;
}

export async function getDeveloperDashboard(): Promise<DeveloperDashboardData> {
  const { data } = await api.get<DeveloperDashboardData>("/dashboard/developer");
  return data;
}
