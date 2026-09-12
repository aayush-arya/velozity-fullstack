import { api } from "./client";
import type { ProjectSummary } from "../types";

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data } = await api.get<{ projects: ProjectSummary[] }>("/projects");
  return data.projects;
}

export async function getProject(id: string): Promise<ProjectSummary> {
  const { data } = await api.get<{ project: ProjectSummary }>(`/projects/${id}`);
  return data.project;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  clientId: string;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectSummary> {
  const { data } = await api.post<{ project: ProjectSummary }>("/projects", input);
  return data.project;
}
