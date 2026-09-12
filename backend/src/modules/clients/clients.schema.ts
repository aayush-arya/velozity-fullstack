import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1).max(160),
  contact: z.string().max(160).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
