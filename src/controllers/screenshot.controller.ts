import { Request, Response } from 'express';
import { screenshotService } from '../services/screenshot.service';
import { browserPool } from '../services/browser-pool.service';
import { logger } from '../utils/logger';
import { ScreenshotRequest, BatchScreenshotRequest, HealthResponse, ValidatedScreenshotRequest } from '../types/screenshot.types';

export class ScreenshotController {
  async takeScreenshot(req: Request, res: Response): Promise<void> {
    const screenshotRequest = req.body as ScreenshotRequest;
    
    try {
      // Merge with defaults
      const options = screenshotService.mergeWithDefaults(screenshotRequest.options);
      
      const validatedRequest: ValidatedScreenshotRequest = {
        ...screenshotRequest,
        options,
      };

      logger.info(`Screenshot request for: ${screenshotRequest.url}`);
      
      const screenshotBuffer = await screenshotService.takeScreenshot(validatedRequest);
      
      // Generate filename for download
      const url = new URL(screenshotRequest.url);
      const domain = url.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const filename = `screenshot_${domain}_${timestamp}.${options.format}`;
      
      // Set response headers
      res.setHeader('Content-Type', `image/${options.format}`);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', screenshotBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      logger.info(`Screenshot completed for: ${screenshotRequest.url}, size: ${screenshotBuffer.length} bytes`);
      res.end(screenshotBuffer);
      
    } catch (error) {
      logger.error(`Screenshot failed for ${screenshotRequest.url}:`, error);
      throw error; // Let error middleware handle it
    }
  }

  async takeBatchScreenshots(req: Request, res: Response): Promise<void> {
    const batchRequest = req.body as BatchScreenshotRequest;
    
    try {
      logger.info(`Batch screenshot request for ${batchRequest.urls.length} URLs`);
      
      const archiveStream = await screenshotService.takeBatchScreenshots(batchRequest);
      
      // Generate filename for ZIP
      const timestamp = Date.now();
      const filename = `screenshots_batch_${timestamp}.zip`;
      
      // Set response headers for ZIP download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Pipe the archive stream to response
      archiveStream.pipe(res);
      
      archiveStream.on('end', () => {
        logger.info(`Batch screenshots completed: ${filename}`);
      });
      
      archiveStream.on('error', (error) => {
        logger.error('Archive stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to create archive',
            statusCode: 500,
            timestamp: new Date().toISOString(),
          });
        }
      });
      
    } catch (error) {
      logger.error('Batch screenshot failed:', error);
      throw error; // Let error middleware handle it
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
      const usedMemory = memoryUsage.heapUsed;
      
      const browserStats = browserPool.getStats();
      
      const healthResponse: HealthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round((usedMemory / totalMemory) * 100),
        },
        activeBrowsers: browserStats.busy,
      };
      
      logger.debug('Health check requested', {
        uptime: healthResponse.uptime,
        memory: healthResponse.memory,
        browsers: browserStats,
      });
      
      res.status(200).json(healthResponse);
      
    } catch (error) {
      logger.error('Health check failed:', error);
      
      const errorResponse: HealthResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: 0,
        memory: {
          used: 0,
          total: 0,
          percentage: 0,
        },
      };
      
      res.status(503).json(errorResponse);
    }
  }

  async testEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const testUrl = 'https://httpbin.org/html';
      const testRequest: ValidatedScreenshotRequest = {
        url: testUrl,
        options: screenshotService.mergeWithDefaults({
          width: 800,
          height: 600,
          format: 'png',
        }),
      };

      logger.info('Test endpoint called');
      
      const screenshotBuffer = await screenshotService.takeScreenshot(testRequest);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="test_screenshot.png"');
      res.setHeader('Content-Length', screenshotBuffer.length);
      
      logger.info(`Test screenshot completed, size: ${screenshotBuffer.length} bytes`);
      res.end(screenshotBuffer);
      
    } catch (error) {
      logger.error('Test endpoint failed:', error);
      throw error;
    }
  }
}

export const screenshotController = new ScreenshotController();