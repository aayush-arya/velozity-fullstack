import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import * as usersService from "./users.service";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./users.schema";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListUsersQuery;

  // A PM is only allowed to browse developers (to assign tasks) - never the
  // full roster. This is enforced here, server-side, regardless of what the
  // client requested in the query string.
  const scopedQuery: ListUsersQuery = req.user!.role === Role.PM ? { role: Role.DEVELOPER } : query;

  const users = await usersService.listUsers(scopedQuery);
  res.json({ users });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.createUser(req.body as CreateUserInput);
  res.status(201).json({ user });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id);
  if (!user) throw AppError.notFound("User not found.");
  res.json({ user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateUser(req.params.id, req.body as UpdateUserInput);
  res.json({ user });
});
