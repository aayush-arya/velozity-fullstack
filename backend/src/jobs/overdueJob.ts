import cron from "node-cron";
import { ActivityAction, TaskStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { buildOverdueMessage, recordActivity } from "../modules/activity/activity.service";
import { broadcastActivity } from "../realtime/events";
import { createNotification } from "../modules/notifications/notifications.service";

const taskInclude = {
  project: { select: { id: true, createdById: true } },
  assignedTo: { select: { id: true, name: true } },
} as const;

// This is the ONLY place `Task.isOverdue` is written. Keeping a single
// writer means the flag is always a fact set by the scheduler, never a
// value derived on the fly when a page happens to load - which is exactly
// what the spec calls for, and it also means a task's flag self-heals (goes
// back to false) if a due date is pushed out or the task is completed,
// without a second code path to keep in sync.
export async function runOverdueSweep(): Promise<{ flagged: number; cleared: number }> {
  const now = new Date();

  const toFlag = await prisma.task.findMany({
    where: { isOverdue: false, status: { not: TaskStatus.DONE }, dueDate: { lt: now } },
    include: taskInclude,
  });

  for (const task of toFlag) {
    const { activity } = await prisma.$transaction(async (tx) => {
      await tx.task.update({ where: { id: task.id }, data: { isOverdue: true } });
      const loggedActivity = await recordActivity(
        {
          taskId: task.id,
          projectId: task.projectId,
          userId: null,
          action: ActivityAction.TASK_OVERDUE,
          message: buildOverdueMessage(task.number, task.title),
        },
        tx
      );
      return { activity: loggedActivity };
    });

    broadcastActivity(activity, [task.project.createdById, task.assignedToId]);

    const recipients = new Set([task.project.createdById, task.assignedToId].filter((id): id is string => Boolean(id)));
    for (const userId of recipients) {
      await createNotification({
        userId,
        type: "TASK_OVERDUE",
        message: `Task #${task.number}: "${task.title}" is now overdue`,
        relatedTaskId: task.id,
      });
    }
  }

  const cleared = await prisma.task.updateMany({
    where: { isOverdue: true, OR: [{ status: TaskStatus.DONE }, { dueDate: { gte: now } }] },
    data: { isOverdue: false },
  });

  if (toFlag.length > 0 || cleared.count > 0) {
    logger.info({ flagged: toFlag.length, cleared: cleared.count }, "Overdue sweep completed");
  }

  return { flagged: toFlag.length, cleared: cleared.count };
}

export function startOverdueJob() {
  runOverdueSweep().catch((err) => logger.error({ err }, "Initial overdue sweep failed"));

  cron.schedule(env.OVERDUE_CRON_SCHEDULE, () => {
    runOverdueSweep().catch((err) => logger.error({ err }, "Scheduled overdue sweep failed"));
  });

  logger.info({ schedule: env.OVERDUE_CRON_SCHEDULE }, "Overdue task scheduler started");
}
