import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../types/screenshot.types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle operational errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.message.includes('timeout')) {
    statusCode = 408;
    message = 'Request timeout - page took too long to load';
  } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
    statusCode = 400;
    message = 'Invalid URL - domain not found';
  } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
    statusCode = 400;
    message = 'Connection refused - server not reachable';
  } else if (error.message.includes('Failed to load page')) {
    statusCode = 400;
    message = 'Failed to load the requested page';
  } else if (error.message.includes('No available browsers')) {
    statusCode = 503;
    message = 'Service temporarily unavailable - too many concurrent requests';
  }

  logger.error(`Error ${statusCode}: ${message}`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const errorResponse: ApiError = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};