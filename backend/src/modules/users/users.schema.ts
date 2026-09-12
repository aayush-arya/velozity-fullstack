import { z } from "zod";
import { Role } from "@prisma/client";

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.nativeEnum(Role).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
