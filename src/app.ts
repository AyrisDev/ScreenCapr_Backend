import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { logger } from './utils/logger';
import { browserPool } from './services/browser-pool.service';
import { screenshotService } from './services/screenshot.service';
import { TelegramBotService } from './services/telegram-bot.service';
import screenshotRoutes from './routes/screenshot.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { generalRateLimit } from './middleware/rateLimit.middleware';

class App {
  public app: express.Application;
  private telegramBot: TelegramBotService;

  constructor() {
    this.app = express();
    this.telegramBot = new TelegramBotService(screenshotService);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Trust proxy for rate limiting and IP detection
    this.app.set('trust proxy', 1);

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Request logging
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // General rate limiting
    this.app.use('/api', generalRateLimit);

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check route (before rate limiting)
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Screenly API - Website Screenshot Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });

    // API routes
    this.app.use('/api', screenshotRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize browser pool
      logger.info('Initializing browser pool...');
      await browserPool.initialize();

      // Start server
      this.app.listen(config.port, '0.0.0.0', () => {
        logger.info(`🚀 Server running on port ${config.port}`);
        logger.info(`📷 Screenshot API ready at http://localhost:${config.port}/api`);
        logger.info(`🏥 Health check available at http://localhost:${config.port}/api/health`);
        
        if (config.nodeEnv === 'development') {
          logger.info(`🧪 Test endpoint available at http://localhost:${config.port}/api/test`);
        }

        // Log Telegram bot status
        if (this.telegramBot.isRunning()) {
          logger.info('🤖 Telegram bot is running');
        } else {
          logger.info('🤖 Telegram bot is disabled');
        }
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down server...');
    
    try {
      await this.telegramBot.stop();
      await browserPool.cleanup();
      logger.info('Server shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

// Handle graceful shutdown
const app = new App();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  await app.stop();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  app.start();
}

export default app;