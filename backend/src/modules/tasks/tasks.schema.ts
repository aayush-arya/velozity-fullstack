import { z } from "zod";
import { Priority, TaskStatus } from "@prisma/client";

export const listTasksQuerySchema = z.object({
  projectId: z.string().min(1).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedToId: z.string().min(1).optional(),
  overdue: z.coerce.boolean().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  assignedToId: z.string().min(1).optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.coerce.date(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    assignedToId: z.string().min(1).nullable().optional(),
    priority: z.nativeEnum(Priority).optional(),
    dueDate: z.coerce.date().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field must be provided." });

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
