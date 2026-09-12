import { Request, Response } from "express";
import { prisma } from "../../db/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import type { CreateClientInput } from "./clients.schema";

export const listClients = asyncHandler(async (_req: Request, res: Response) => {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  res.json({ clients });
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.create({ data: req.body as CreateClientInput });
  res.status(201).json({ client });
});
