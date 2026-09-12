import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  clientId: z.string().min(1),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    description: z.string().max(2000).optional(),
    clientId: z.string().min(1).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field must be provided." });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
