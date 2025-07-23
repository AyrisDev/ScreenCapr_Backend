import { Page, devices } from 'playwright';
import archiver from 'archiver';
import { Readable } from 'stream';
import { browserPool } from './browser-pool.service';
import { logger } from '../utils/logger';
import { ValidatedScreenshotRequest, BatchScreenshotRequest, ScreenshotOptions } from '../types/screenshot.types';

export class ScreenshotService {
  private readonly defaultOptions: Required<ScreenshotOptions> = {
    url: '',
    width: 1920,
    height: 1080,
    fullPage: false,
    format: 'png',
    quality: 80,
    timeout: 30000,
    viewport: { width: 1920, height: 1080 },
  };

  async takeScreenshot(request: ValidatedScreenshotRequest | ScreenshotOptions): Promise<Buffer> {
    const browser = await browserPool.getBrowser();
    let page: Page | null = null;

    try {
      // Handle both request types
      const url = 'url' in request ? request.url : (request.url || '');
      const options = 'options' in request ? request.options : { ...this.defaultOptions, ...request };
      
      if (!url) {
        throw new Error('URL is required for screenshot');
      }
      
      // Determine device type for emulation
      const viewportWidth = options.viewport?.width || options.width || 1920;
      const viewportHeight = options.viewport?.height || options.height || 1080;
      
      let deviceName: string | undefined;
      if (viewportWidth === 375 && viewportHeight === 667) {
        deviceName = 'iPhone 13';
      } else if (viewportWidth === 768 && viewportHeight === 1024) {
        deviceName = 'iPad Pro';
      }
      
      // Create page with appropriate device emulation
      page = await browserPool.createPage(browser, deviceName);
      
      // If not using device emulation, set custom viewport
      if (!deviceName) {
        await page.setViewportSize({
          width: viewportWidth,
          height: viewportHeight,
        });
      }

      logger.info(`Taking screenshot of: ${url}`);
      
      // Navigate to the page
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000,
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
      }

      // Wait a bit for dynamic content
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: options.fullPage,
        type: options.format,
        quality: options.format === 'jpeg' ? options.quality : undefined,
      });

      logger.info(`Screenshot taken successfully for: ${url}`);
      return screenshotBuffer as Buffer;
      
    } catch (error) {
      const url = 'url' in request ? request.url : (request.url || 'unknown');
      logger.error(`Error taking screenshot for ${url}:`, error);
      throw error;
    } finally {
      if (page) {
        await browserPool.closePage(page);
      }
      await browserPool.releaseBrowser(browser);
    }
  }

  async takeBatchScreenshots(request: BatchScreenshotRequest): Promise<Readable> {
    const options: Required<ScreenshotOptions> = {
      ...this.defaultOptions,
      ...request.options,
    };

    logger.info(`Taking batch screenshots for ${request.urls.length} URLs`);

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Handle archive errors
    archive.on('error', (err) => {
      logger.error('Archive error:', err);
      throw err;
    });

    // Process screenshots concurrently with limit
    const concurrencyLimit = Math.min(request.urls.length, 3); // Limit concurrent screenshots
    const urlChunks = this.chunkArray(request.urls, concurrencyLimit);

    let successCount = 0;
    let errorCount = 0;

    for (const chunk of urlChunks) {
      const promises = chunk.map(async (url, index) => {
        try {
          const screenshotRequest: ValidatedScreenshotRequest = {
            url,
            options,
          };

          const buffer = await this.takeScreenshot(screenshotRequest);
          const filename = this.generateFilename(url, index, options.format);
          
          archive.append(buffer, { name: filename });
          successCount++;
          logger.debug(`Added ${filename} to archive`);
          
        } catch (error) {
          errorCount++;
          logger.error(`Failed to screenshot ${url}:`, error);
          
          // Add error file to archive
          const errorFilename = this.generateFilename(url, index, 'txt');
          const errorContent = `Error taking screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
          archive.append(errorContent, { name: errorFilename });
        }
      });

      await Promise.all(promises);
    }

    logger.info(`Batch screenshots completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    // Finalize the archive
    archive.finalize();
    
    return archive;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private generateFilename(url: string, index: number, format: string): string {
    // Clean URL for filename
    const cleanUrl = url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);
    
    const timestamp = Date.now();
    return `screenshot_${index + 1}_${cleanUrl}_${timestamp}.${format}`;
  }

  validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  mergeWithDefaults(options?: ScreenshotOptions): Required<ScreenshotOptions> {
    return {
      ...this.defaultOptions,
      ...options,
    };
  }
}

export const screenshotService = new ScreenshotService();