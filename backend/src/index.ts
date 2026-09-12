import http from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { initSocket } from "./realtime/socket";
import { startOverdueJob } from "./jobs/overdueJob";
import { prisma } from "./db/prisma";

async function main() {
  const app = createApp();
  const httpServer = http.createServer(app);

  initSocket(httpServer);
  startOverdueJob();

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${env.PORT} is already in use - set a different PORT in .env.`);
    } else {
      logger.error({ err }, "HTTP server error");
    }
    process.exit(1);
  });

  httpServer.listen(env.PORT, () => {
    logger.info(`API + WebSocket server listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down");
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal error during startup");
  process.exit(1);
});
