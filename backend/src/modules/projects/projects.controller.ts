import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as projectsService from "./projects.service";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schema";

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectsService.listProjectsForUser(req.user!);
  res.json({ projects });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.getProjectById(req.params.id, req.user!);
  res.json({ project });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.createProject(req.body as CreateProjectInput, req.user!);
  res.status(201).json({ project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectsService.updateProject(req.params.id, req.body as UpdateProjectInput, req.user!);
  res.json({ project });
});
