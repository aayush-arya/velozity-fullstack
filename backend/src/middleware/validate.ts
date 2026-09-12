import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { AppError } from "../utils/AppError";

type RequestPart = "body" | "query" | "params";

// Validates and REPLACES req[part] with the parsed (and type-coerced) value,
// so controllers only ever see data that already matches the schema -
// frontend validation is a UX nicety, this is the actual boundary. Accepts
// any Zod schema (not just ZodObject) since some schemas add a `.refine()`
// for cross-field checks, which wraps them in a ZodEffects.
export function validate(schema: ZodTypeAny, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const flattened = (result.error as ZodError).flatten();
      return next(AppError.badRequest("Validation failed.", flattened.fieldErrors));
    }
    req[part] = result.data;
    next();
  };
}
