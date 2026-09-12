import { api } from "./client";
import type { ActivityFeedEvent, Client, Role, TaskUserRef } from "../types";

export async function listClients(): Promise<Client[]> {
  const { data } = await api.get<{ clients: Client[] }>("/clients");
  return data.clients;
}

export async function createClient(name: string, contact?: string): Promise<Client> {
  const { data } = await api.post<{ client: Client }>("/clients", { name, contact });
  return data.client;
}

export async function listUsers(role?: Role): Promise<TaskUserRef[]> {
  const { data } = await api.get<{ users: TaskUserRef[] }>(`/users${role ? `?role=${role}` : ""}`);
  return data.users;
}

export interface ActivityFeedResponse {
  items: ActivityFeedEvent[];
  nextCursor: string | null;
}

export async function getActivityFeed(params: { limit?: number; cursor?: string; projectId?: string } = {}): Promise<ActivityFeedResponse> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.projectId) search.set("projectId", params.projectId);
  const qs = search.toString();
  const { data } = await api.get<ActivityFeedResponse>(`/activity${qs ? `?${qs}` : ""}`);
  return data;
}
