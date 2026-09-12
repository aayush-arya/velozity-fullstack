import { ActivityAction, Prisma, Role, TaskStatus } from "@prisma/client";
import { prisma } from "../../db/prisma";
import type { AuthenticatedUser } from "../../middleware/auth";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

const activityInclude = {
  user: { select: { id: true, name: true } },
  task: { select: { id: true, number: true, title: true } },
} satisfies Prisma.ActivityLogInclude;

export type ActivityWithRelations = Prisma.ActivityLogGetPayload<{ include: typeof activityInclude }>;

interface RecordActivityInput {
  taskId: string;
  projectId: string;
  userId?: string | null;
  action: ActivityAction;
  message: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
}

// Accepts an optional transaction client so callers that touch the task and
// its activity log together (e.g. a status change) can commit both atomically.
export function recordActivity(
  input: RecordActivityInput,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<ActivityWithRelations> {
  return client.activityLog.create({
    data: {
      taskId: input.taskId,
      projectId: input.projectId,
      userId: input.userId ?? null,
      action: input.action,
      message: input.message,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
    },
    include: activityInclude,
  });
}

function scopeForUser(user: AuthenticatedUser): Prisma.ActivityLogWhereInput {
  switch (user.role) {
    case Role.ADMIN:
      return {};
    case Role.PM:
      return { project: { createdById: user.id } };
    case Role.DEVELOPER:
      return { task: { assignedToId: user.id } };
  }
}

export interface FeedQuery {
  limit: number;
  cursor?: string;
  projectId?: string;
}

// Powers both "give me the feed" on first load and "give me what I missed"
// on reconnect - both are the same query, just DB reads, never an in-memory
// buffer that would be empty after a server restart or a missed connection.
export async function getActivityFeed(user: AuthenticatedUser, query: FeedQuery) {
  const where: Prisma.ActivityLogWhereInput = {
    AND: [scopeForUser(user), query.projectId ? { projectId: query.projectId } : {}],
  };

  const items = await prisma.activityLog.findMany({
    where,
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: query.limit,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  return {
    items,
    nextCursor: items.length === query.limit ? items[items.length - 1].id : null,
  };
}

export function buildStatusChangeMessage(actorName: string, taskNumber: number, title: string, from: TaskStatus, to: TaskStatus) {
  return `${actorName} moved "Task #${taskNumber}: ${title}" from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}`;
}

export function buildCreatedMessage(actorName: string, taskNumber: number, title: string) {
  return `${actorName} created Task #${taskNumber}: "${title}"`;
}

export function buildAssignedMessage(actorName: string, taskNumber: number, title: string, assigneeName: string) {
  return `${actorName} assigned Task #${taskNumber}: "${title}" to ${assigneeName}`;
}

export function buildUpdatedMessage(actorName: string, taskNumber: number, title: string) {
  return `${actorName} updated Task #${taskNumber}: "${title}"`;
}

export function buildOverdueMessage(taskNumber: number, title: string) {
  return `Task #${taskNumber}: "${title}" is now overdue`;
}
