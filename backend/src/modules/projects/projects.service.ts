import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/AppError";
import type { AuthenticatedUser } from "../../middleware/auth";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schema";

const projectInclude = {
  client: true,
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectInclude;

export function listProjectsForUser(user: AuthenticatedUser) {
  const where: Prisma.ProjectWhereInput =
    user.role === Role.ADMIN
      ? {}
      : user.role === Role.PM
      ? { createdById: user.id }
      : { tasks: { some: { assignedToId: user.id } } };

  return prisma.project.findMany({ where, include: projectInclude, orderBy: { createdAt: "desc" } });
}

async function getRawProjectOrThrow(id: string) {
  const project = await prisma.project.findUnique({ where: { id }, include: projectInclude });
  if (!project) throw AppError.notFound("Project not found.");
  return project;
}

// Ownership check lives in one place so every route that touches a specific
// project - read or write - goes through the same rule instead of each
// controller re-implementing it slightly differently.
export async function ensureCanAccessProject(projectId: string, user: AuthenticatedUser) {
  const project = await getRawProjectOrThrow(projectId);

  if (user.role === Role.ADMIN) return project;

  if (user.role === Role.PM) {
    if (project.createdById !== user.id) {
      throw AppError.forbidden("You can only access projects you created.");
    }
    return project;
  }

  // DEVELOPER: allowed only as a read-only "context" view when they have at
  // least one task assigned to them inside this project.
  const hasAssignedTask = await prisma.task.count({ where: { projectId, assignedToId: user.id } });
  if (hasAssignedTask === 0) {
    throw AppError.forbidden("You do not have any tasks assigned in this project.");
  }
  return project;
}

export async function getProjectById(id: string, user: AuthenticatedUser) {
  return ensureCanAccessProject(id, user);
}

export function createProject(input: CreateProjectInput, user: AuthenticatedUser) {
  return prisma.project.create({
    data: { name: input.name, description: input.description, clientId: input.clientId, createdById: user.id },
    include: projectInclude,
  });
}

export async function updateProject(id: string, input: UpdateProjectInput, user: AuthenticatedUser) {
  // Admin or the owning PM only - ensureCanAccessProject already throws for
  // a PM who doesn't own this project, and this route is unreachable for
  // Developer accounts at all (blocked at the router with authorize()).
  await ensureCanAccessProject(id, user);
  return prisma.project.update({ where: { id }, data: input, include: projectInclude });
}
