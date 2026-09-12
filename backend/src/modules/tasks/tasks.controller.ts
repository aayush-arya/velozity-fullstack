import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as tasksService from "./tasks.service";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput, UpdateTaskStatusInput } from "./tasks.schema";

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const result = await tasksService.listTasks(req.user!, req.query as unknown as ListTasksQuery);
  res.json(result);
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.getTaskById(req.params.id, req.user!);
  res.json({ task });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.createTask(req.body as CreateTaskInput, req.user!);
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.updateTask(req.params.id, req.body as UpdateTaskInput, req.user!);
  res.json({ task });
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as UpdateTaskStatusInput;
  const task = await tasksService.updateTaskStatus(req.params.id, status, req.user!);
  res.json({ task });
});
