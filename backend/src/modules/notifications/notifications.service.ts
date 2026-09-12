import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/AppError";
import { pushNotification } from "../../realtime/events";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  relatedTaskId?: string;
}

export function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

// Creates the DB row (source of truth, survives restarts/offline periods)
// and then pushes it over the socket so an online user's badge updates
// without polling. An offline user simply sees it next time they call
// listNotifications / getUnreadCount.
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      relatedTaskId: input.relatedTaskId,
    },
  });

  const unreadCount = await getUnreadCount(input.userId);
  pushNotification(input.userId, notification, unreadCount);
  return notification;
}

export async function listNotifications(userId: string, page: number, limit: number) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    getUnreadCount(userId),
  ]);
  return { items, unreadCount };
}

export async function markAsRead(userId: string, notificationId: string) {
  const result: Prisma.BatchPayload = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  if (result.count === 0) throw AppError.notFound("Notification not found.");
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}
