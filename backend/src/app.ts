import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import clientRoutes from "./modules/clients/clients.routes";
import projectRoutes from "./modules/projects/projects.routes";
import taskRoutes from "./modules/tasks/tasks.routes";
import activityRoutes from "./modules/activity/activity.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: !env.isProduction ? { ignore: (req) => req.url === "/health" } : true }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/activity", activityRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
