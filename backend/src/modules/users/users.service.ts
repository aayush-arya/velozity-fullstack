import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/password";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./users.schema";

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export function listUsers(query: ListUsersQuery) {
  return prisma.user.findMany({
    where: query.role ? { role: query.role } : undefined,
    select: publicUserSelect,
    orderBy: { name: "asc" },
  });
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict("A user with that email already exists.");

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
    select: publicUserSelect,
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound("User not found.");

  return prisma.user.update({ where: { id }, data: input, select: publicUserSelect });
}
