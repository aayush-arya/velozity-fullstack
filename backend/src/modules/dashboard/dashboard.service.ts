import { Priority, TaskStatus } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { getOnlineUserCount } from "../../realtime/socket";
import type { AuthenticatedUser } from "../../middleware/auth";

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000);
}

function zeroFilledCounts<T extends string>(allKeys: readonly T[], rows: { count: T; _count: number }[]) {
  const map = new Map(rows.map((row) => [row.count, row._count]));
  return Object.fromEntries(allKeys.map((key) => [key, map.get(key) ?? 0])) as Record<T, number>;
}

export async function getAdminDashboard() {
  const [totalProjects, statusGroups, overdueCount, onlineUsers] = await Promise.all([
    prisma.project.count(),
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.task.count({ where: { isOverdue: true } }),
    Promise.resolve(getOnlineUserCount()),
  ]);

  const tasksByStatus = zeroFilledCounts(
    Object.values(TaskStatus),
    statusGroups.map((g) => ({ count: g.status, _count: g._count }))
  );
  const totalTasks = Object.values(tasksByStatus).reduce((sum, n) => sum + n, 0);

  return { totalProjects, totalTasks, tasksByStatus, overdueCount, onlineUsers };
}

export async function getPmDashboard(user: AuthenticatedUser) {
  const projectWhere = { createdById: user.id };

  const [projects, priorityGroups, upcomingDueDates, overdueCount] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      include: { client: true, _count: { select: { tasks: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.groupBy({ by: ["priority"], where: { project: projectWhere }, _count: true }),
    prisma.task.findMany({
      where: { project: projectWhere, dueDate: { gte: new Date(), lte: daysFromNow(7) }, status: { not: TaskStatus.DONE } },
      include: { assignedTo: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.task.count({ where: { project: projectWhere, isOverdue: true } }),
  ]);

  const tasksByPriority = zeroFilledCounts(
    Object.values(Priority),
    priorityGroups.map((g) => ({ count: g.priority, _count: g._count }))
  );

  return { projects, tasksByPriority, upcomingDueDates, overdueCount };
}

export async function getDeveloperDashboard(user: AuthenticatedUser) {
  const where = { assignedToId: user.id };

  const [tasks, statusGroups] = await Promise.all([
    prisma.task.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    }),
    prisma.task.groupBy({ by: ["status"], where, _count: true }),
  ]);

  const tasksByStatus = zeroFilledCounts(
    Object.values(TaskStatus),
    statusGroups.map((g) => ({ count: g.status, _count: g._count }))
  );

  return { tasks, tasksByStatus };
}
