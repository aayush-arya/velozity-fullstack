import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// Centralized error responder: every endpoint - whatever throws - ends up
// here, so the client always gets the same { error: { code, message } }
// shape and a stack trace never reaches the response body.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err, path: req.path }, err.message);
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: { code: "CONFLICT", message: "A record with those unique fields already exists." },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "The requested resource was not found." },
      });
    }
  }

  logger.error({ err, path: req.path }, "Unhandled error");
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
}
