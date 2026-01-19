import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  puppeteer: {
    timeout: number;
    maxConcurrent: number;
  };
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
  };
}

const getConfig = (): Config => {
  const config: Config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    puppeteer: {
      timeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000', 10),
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCREENSHOTS || '5', 10),
    },
    cors: {
      origin: (process.env.NODE_ENV || 'development') === 'development'
        ? true  // Allow all origins in development
        : (process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(',') || false),
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  };

  // Validate configuration
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Invalid PORT: must be between 1 and 65535');
  }

  if (config.puppeteer.maxConcurrent < 1 || config.puppeteer.maxConcurrent > 20) {
    throw new Error('Invalid MAX_CONCURRENT_SCREENSHOTS: must be between 1 and 20');
  }

  if (config.puppeteer.timeout < 5000 || config.puppeteer.timeout > 300000) {
    throw new Error('Invalid PUPPETEER_TIMEOUT: must be between 5000 and 300000ms');
  }

  logger.info('Configuration loaded:', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    maxConcurrent: config.puppeteer.maxConcurrent,
    timeout: config.puppeteer.timeout,
    rateLimitWindow: config.rateLimit.windowMs,
    rateLimitMax: config.rateLimit.maxRequests,
  });

  return config;
};

export const config = getConfig();