import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, jti } satisfies RefreshTokenPayload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
  return { token, jti };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
}

// Refresh tokens are stored hashed (never in plaintext) so a leaked database
// snapshot can't be replayed as a session, mirroring how we treat passwords.
// SHA-256 (not bcrypt) is used because refresh lookups need a deterministic
// hash to query by, not a per-call salted one.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function parseDurationMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "s" | "m" | "h" | "d"];
  return value * unitMs;
}

export function msFromNow(duration: string): Date {
  return new Date(Date.now() + parseDurationMs(duration));
}
