import { Request, Response } from "express";
import { env } from "../../config/env";
import { parseDurationMs } from "../../utils/jwt";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import * as authService from "./auth.service";
import type { LoginInput } from "./auth.schema";

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/api/auth",
    maxAge: parseDurationMs(env.REFRESH_TOKEN_TTL),
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/api/auth",
  });
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const user = await authService.validateCredentials(email, password);
  const { accessToken, refreshToken } = await authService.issueTokenPair(user);

  setRefreshCookie(res, refreshToken);
  res.json({
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (!rawToken) throw AppError.unauthorized("No refresh token present.");

  const { accessToken, refreshToken } = await authService.rotateRefreshToken(rawToken);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (rawToken) {
    await authService.revokeRefreshToken(rawToken);
  }
  clearRefreshCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: req.user });
});
