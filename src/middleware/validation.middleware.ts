import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';
import { ScreenshotRequest, BatchScreenshotRequest } from '../types/screenshot.types';

const screenshotOptionsSchema = Joi.object({
  width: Joi.number().integer().min(100).max(3840).optional(),
  height: Joi.number().integer().min(100).max(2160).optional(),
  fullPage: Joi.boolean().optional(),
  format: Joi.string().valid('png', 'jpeg').optional(),
  quality: Joi.number().integer().min(1).max(100).optional(),
  timeout: Joi.number().integer().min(5000).max(60000).optional(),
});

const screenshotRequestSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  options: screenshotOptionsSchema.optional(),
});

const batchScreenshotRequestSchema = Joi.object({
  urls: Joi.array()
    .items(Joi.string().uri({ scheme: ['http', 'https'] }))
    .min(1)
    .max(10)
    .required(),
  options: screenshotOptionsSchema.optional(),
});

export const validateScreenshotRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = screenshotRequestSchema.validate(req.body);
  
  if (error) {
    logger.warn('Screenshot request validation failed:', error.details[0]?.message);
    res.status(400).json({
      error: `Validation error: ${error.details[0]?.message || 'Unknown validation error'}`,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Attach validated data to request
  req.body = value as ScreenshotRequest;
  next();
};

export const validateBatchScreenshotRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = batchScreenshotRequestSchema.validate(req.body);
  
  if (error) {
    logger.warn('Batch screenshot request validation failed:', error.details[0]?.message);
    res.status(400).json({
      error: `Validation error: ${error.details[0]?.message || 'Unknown validation error'}`,
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Attach validated data to request
  req.body = value as BatchScreenshotRequest;
  next();
};

export const validateQueryParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      logger.warn('Query parameters validation failed:', error.details[0]?.message);
      res.status(400).json({
        error: `Query validation error: ${error.details[0]?.message || 'Unknown validation error'}`,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.query = value;
    next();
  };
};