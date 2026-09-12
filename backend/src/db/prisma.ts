import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

// Reuse a single PrismaClient across tsx watch-mode reloads in dev so we
// don't exhaust the Postgres connection pool with every file save.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: env.isProduction ? ["error", "warn"] : ["error", "warn"],
  });

if (!env.isProduction) {
  global.__prisma__ = prisma;
}
