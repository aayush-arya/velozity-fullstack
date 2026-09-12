import { api } from "./client";
import type { NotificationItem } from "../types";

export async function listNotifications(page = 1, limit = 20): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const { data } = await api.get<{ items: NotificationItem[]; unreadCount: number }>(
    `/notifications?page=${page}&limit=${limit}`
  );
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
