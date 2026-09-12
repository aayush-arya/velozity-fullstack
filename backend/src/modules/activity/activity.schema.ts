import { z } from "zod";

export const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
});

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
