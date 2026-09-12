import { ActivityAction, TaskStatus } from "@prisma/client";
import { ADMIN_ROOM, getIO, userRoom } from "./socket";

export interface ActivityFeedEvent {
  id: string;
  taskId: string;
  projectId: string;
  action: ActivityAction;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  message: string;
  createdAt: Date;
  user: { id: string; name: string } | null;
}

// Fan-out for one activity event: the project owner (PM/Admin) and the
// task's assignee each get it pushed to their personal room, and the global
// admin room always gets it too - this is what makes the feed "correct and
// role-filtered" without every client having to filter a firehose itself.
export function broadcastActivity(event: ActivityFeedEvent, recipientUserIds: (string | null | undefined)[]) {
  const io = getIO();
  const rooms = Array.from(new Set(recipientUserIds.filter((id): id is string => Boolean(id)))).map(userRoom);
  if (rooms.length > 0) {
    io.to(rooms).emit("activity:new", event);
  }
  io.to(ADMIN_ROOM).emit("activity:new", event);
}

export interface NotificationEvent {
  id: string;
  type: string;
  message: string;
  relatedTaskId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function pushNotification(userId: string, notification: NotificationEvent, unreadCount: number) {
  getIO().to(userRoom(userId)).emit("notification:new", { notification, unreadCount });
}
