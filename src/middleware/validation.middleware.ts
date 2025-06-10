import { AnyZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

import { createError } from "./error-handler.middleware";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        return next(
          createError("Validation error", 400, { errors: formattedErrors })
        );
      }
      return next(error);
    }
  };
