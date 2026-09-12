import { api, setAccessToken } from "./client";
import type { AuthUser } from "../types";

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  setAccessToken(null);
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function silentRefresh(): Promise<string> {
  const { data } = await api.post<{ accessToken: string }>("/auth/refresh");
  setAccessToken(data.accessToken);
  return data.accessToken;
}
