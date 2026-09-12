import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/AppError";
import { verifyPassword } from "../../utils/password";
import { hashToken, msFromNow, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { env } from "../../config/env";
import type { User } from "@prisma/client";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function toAccessTokenPayload(user: User) {
  return { sub: user.id, role: user.role, email: user.email, name: user.name };
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function validateCredentials(email: string, password: string): Promise<User> {
  const user = await findUserByEmail(email);
  if (!user) throw AppError.unauthorized("Invalid email or password.");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw AppError.unauthorized("Invalid email or password.");

  return user;
}

export async function issueTokenPair(user: User): Promise<TokenPair> {
  const accessToken = signAccessToken(toAccessTokenPayload(user));
  const { token: refreshToken } = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: msFromNow(env.REFRESH_TOKEN_TTL),
    },
  });

  return { accessToken, refreshToken };
}

// Refresh tokens are rotated on every use: the presented token is revoked and
// a brand new one issued, so a stolen-but-unused token has a single-use
// window instead of being valid for its full 7-day lifetime.
export async function rotateRefreshToken(rawToken: string): Promise<TokenPair> {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw AppError.unauthorized("Refresh token is invalid or expired.");
  }

  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
    throw AppError.unauthorized("Refresh token has been revoked or has expired.");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw AppError.unauthorized("User no longer exists.");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  return issueTokenPair(user);
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
}
