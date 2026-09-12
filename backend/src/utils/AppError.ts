export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication is required.") {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have permission to do that.") {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "The requested resource was not found.") {
    return new AppError(404, "NOT_FOUND", message);
  }

  static conflict(message: string) {
    return new AppError(409, "CONFLICT", message);
  }

  static internal(message = "Something went wrong.") {
    return new AppError(500, "INTERNAL_ERROR", message);
  }
}
