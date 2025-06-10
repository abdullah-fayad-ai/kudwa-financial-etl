import { Request, Response, NextFunction } from "express";

import logger from "../utils/logger.util";

export interface AppError extends Error {
  statusCode?: number;
  data?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    error: err.stack,
  });

  const response: any = {
    error: message,
  };

  if (err.data) {
    response.data = err.data;
  }

  res.status(statusCode).json(response);
};

export function createError(
  message: string,
  statusCode = 500,
  data?: any
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (data) {
    error.data = data;
  }
  return error;
}
