import { api } from "./client";
import type { PaginatedTasks, Priority, Task, TaskFilters, TaskStatus, TaskWithHistory } from "../types";

function toQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listTasks(filters: TaskFilters = {}): Promise<PaginatedTasks> {
  const { data } = await api.get<PaginatedTasks>(`/tasks${toQueryString(filters)}`);
  return data;
}

export async function getTask(id: string): Promise<TaskWithHistory> {
  const { data } = await api.get<{ task: TaskWithHistory }>(`/tasks/${id}`);
  return data.task;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  assignedToId?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate: string;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await api.post<{ task: Task }>("/tasks", input);
  return data.task;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedToId?: string | null;
  priority?: Priority;
  dueDate?: string;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data } = await api.patch<{ task: Task }>(`/tasks/${id}`, input);
  return data.task;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data } = await api.patch<{ task: Task }>(`/tasks/${id}/status`, { status });
  return data.task;
}
