import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedUser {
  id: string;
  role: Role;
  email: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Verifies the signed access token on every protected request. Because the
// token is signed server-side, a client cannot forge or edit the `role` or
// `sub` (user id) claims without invalidating the signature - this is what
// makes it safe to trust req.user for authorization decisions below.
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or malformed Authorization header."));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  } catch {
    next(AppError.unauthorized("Access token is invalid or expired."));
  }
}

// Role check. This runs on the server for every route that uses it - the
// frontend hiding a button is never sufficient on its own.
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("Your role does not have access to this resource."));
    }
    next();
  };
}
