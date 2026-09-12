import { ActivityAction, Prisma, Role, TaskStatus } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/AppError";
import type { AuthenticatedUser } from "../../middleware/auth";
import { ensureCanAccessProject } from "../projects/projects.service";
import { broadcastActivity } from "../../realtime/events";
import { createNotification } from "../notifications/notifications.service";
import {
  buildAssignedMessage,
  buildCreatedMessage,
  buildStatusChangeMessage,
  buildUpdatedMessage,
  recordActivity,
} from "../activity/activity.service";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./tasks.schema";

const taskInclude = {
  project: { select: { id: true, name: true, createdById: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

async function getRawTaskOrThrow(id: string): Promise<TaskWithRelations> {
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) throw AppError.notFound("Task not found.");
  return task;
}

// The single rule that decides whether `user` may see/touch `task`, used by
// every read and write below. A Developer only ever satisfies the
// assignedToId branch, so there is no code path that lets them reach a task
// (or, by extension, a project) that isn't theirs - even with a well-formed,
// validly-signed token for their own account.
export async function ensureCanAccessTask(task: TaskWithRelations, user: AuthenticatedUser) {
  if (user.role === Role.ADMIN) return;
  if (user.role === Role.PM) {
    if (task.project.createdById !== user.id) {
      throw AppError.forbidden("You can only access tasks in projects you created.");
    }
    return;
  }
  if (task.assignedToId !== user.id) {
    throw AppError.forbidden("You can only access tasks assigned to you.");
  }
}

function buildTaskWhere(user: AuthenticatedUser, filters: ListTasksQuery): Prisma.TaskWhereInput {
  const scope: Prisma.TaskWhereInput =
    user.role === Role.ADMIN ? {} : user.role === Role.PM ? { project: { createdById: user.id } } : { assignedToId: user.id };

  const clientFilters: Prisma.TaskWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.projectId && { projectId: filters.projectId }),
    ...(filters.overdue !== undefined && { isOverdue: filters.overdue }),
    // A Developer's scope is fixed to their own id above; a client-supplied
    // assignedToId is only ever honored as an extra narrowing filter for
    // roles that already see multiple people's tasks (Admin/PM).
    ...(user.role !== Role.DEVELOPER && filters.assignedToId && { assignedToId: filters.assignedToId }),
    ...((filters.dueDateFrom || filters.dueDateTo) && {
      dueDate: {
        ...(filters.dueDateFrom && { gte: filters.dueDateFrom }),
        ...(filters.dueDateTo && { lte: filters.dueDateTo }),
      },
    }),
  };

  return { AND: [scope, clientFilters] };
}

export async function listTasks(user: AuthenticatedUser, filters: ListTasksQuery) {
  const where = buildTaskWhere(user, filters);
  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.task.count({ where }),
  ]);
  return { items, total, page: filters.page, limit: filters.limit };
}

export async function getTaskById(id: string, user: AuthenticatedUser) {
  const task = await getRawTaskOrThrow(id);
  await ensureCanAccessTask(task, user);
  const activityLog = await prisma.activityLog.findMany({
    where: { taskId: id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { ...task, activityLog };
}

export async function createTask(input: CreateTaskInput, user: AuthenticatedUser) {
  // Reuses the same ownership rule projects use: Admin can create anywhere,
  // a PM only inside a project they created.
  await ensureCanAccessProject(input.projectId, user);

  if (input.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: input.assignedToId } });
    if (!assignee || assignee.role !== Role.DEVELOPER) {
      throw AppError.badRequest("assignedToId must reference an existing Developer.");
    }
  }

  const { task, activity } = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        assignedToId: input.assignedToId,
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate,
        createdById: user.id,
      },
      include: taskInclude,
    });

    const loggedActivity = await recordActivity(
      {
        taskId: created.id,
        projectId: created.projectId,
        userId: user.id,
        action: ActivityAction.TASK_CREATED,
        message: buildCreatedMessage(user.name, created.number, created.title),
      },
      tx
    );

    return { task: created, activity: loggedActivity };
  });

  broadcastActivity(activity, [task.project.createdById, task.assignedToId]);

  if (task.assignedToId) {
    await createNotification({
      userId: task.assignedToId,
      type: "TASK_ASSIGNED",
      message: `You were assigned to Task #${task.number}: "${task.title}"`,
      relatedTaskId: task.id,
    });
  }

  return task;
}

export async function updateTaskStatus(id: string, newStatus: TaskStatus, user: AuthenticatedUser) {
  const task = await getRawTaskOrThrow(id);
  await ensureCanAccessTask(task, user);

  if (task.status === newStatus) {
    throw AppError.badRequest("Task is already in that status.");
  }

  const previousStatus = task.status;
  const { updated, activity } = await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({ where: { id }, data: { status: newStatus }, include: taskInclude });
    const loggedActivity = await recordActivity(
      {
        taskId: id,
        projectId: task.projectId,
        userId: user.id,
        action: ActivityAction.STATUS_CHANGED,
        fromStatus: previousStatus,
        toStatus: newStatus,
        message: buildStatusChangeMessage(user.name, task.number, task.title, previousStatus, newStatus),
      },
      tx
    );
    return { updated: updatedTask, activity: loggedActivity };
  });

  broadcastActivity(activity, [task.project.createdById, task.assignedToId]);

  // The PM who owns the project is notified when a task moves into review -
  // unless they are the one who just moved it themselves.
  if (newStatus === TaskStatus.IN_REVIEW && task.project.createdById !== user.id) {
    await createNotification({
      userId: task.project.createdById,
      type: "TASK_IN_REVIEW",
      message: `Task #${task.number}: "${task.title}" was moved to In Review by ${user.name}`,
      relatedTaskId: task.id,
    });
  }

  return updated;
}

export async function updateTask(id: string, input: UpdateTaskInput, user: AuthenticatedUser) {
  const task = await getRawTaskOrThrow(id);
  await ensureCanAccessProject(task.projectId, user); // Admin or the owning PM only

  const isReassignment = input.assignedToId !== undefined && input.assignedToId !== task.assignedToId;

  if (isReassignment && input.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: input.assignedToId } });
    if (!assignee || assignee.role !== Role.DEVELOPER) {
      throw AppError.badRequest("assignedToId must reference an existing Developer.");
    }
  }

  const { updated, activities } = await prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({ where: { id }, data: input, include: taskInclude });
    const loggedActivities = [];

    const hasOtherFieldChanges = (["title", "description", "priority", "dueDate"] as const).some((key) => key in input);
    if (hasOtherFieldChanges) {
      loggedActivities.push(
        await recordActivity(
          {
            taskId: id,
            projectId: task.projectId,
            userId: user.id,
            action: ActivityAction.TASK_UPDATED,
            message: buildUpdatedMessage(user.name, task.number, updatedTask.title),
          },
          tx
        )
      );
    }

    if (isReassignment) {
      const message = updatedTask.assignedTo
        ? buildAssignedMessage(user.name, task.number, updatedTask.title, updatedTask.assignedTo.name)
        : `${user.name} unassigned Task #${task.number}: "${updatedTask.title}"`;
      loggedActivities.push(
        await recordActivity(
          { taskId: id, projectId: task.projectId, userId: user.id, action: ActivityAction.TASK_ASSIGNED, message },
          tx
        )
      );
    }

    return { updated: updatedTask, activities: loggedActivities };
  });

  for (const activity of activities) {
    broadcastActivity(activity, [updated.project.createdById, task.assignedToId, updated.assignedToId]);
  }

  if (isReassignment && updated.assignedToId) {
    await createNotification({
      userId: updated.assignedToId,
      type: "TASK_ASSIGNED",
      message: `You were assigned to Task #${updated.number}: "${updated.title}"`,
      relatedTaskId: updated.id,
    });
  }

  return updated;
}
