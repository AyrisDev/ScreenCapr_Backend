import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Rate limiting configuration
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const screenshotRateLimit = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    error: 'Too many screenshot requests from this IP, please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString(),
    retryAfter: Math.ceil(windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many screenshot requests from this IP, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
      retryAfter: Math.ceil(windowMs / 1000),
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  },
});

// More restrictive rate limit for batch operations
export const batchScreenshotRateLimit = rateLimit({
  windowMs,
  max: Math.floor(maxRequests / 5), // 1/5 of normal rate for batch operations
  message: {
    error: 'Too many batch screenshot requests from this IP, please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString(),
    retryAfter: Math.ceil(windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Batch rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many batch screenshot requests from this IP, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
      retryAfter: Math.ceil(windowMs / 1000),
    });
  },
});

// General API rate limit (more lenient)
export const generalRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: maxRequests * 2, // Double the screenshot limit for general API calls
  message: {
    error: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString(),
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`General rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
      timestamp: new Date().toISOString(),
      retryAfter: 60,
    });
  },
});