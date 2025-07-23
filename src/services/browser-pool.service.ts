import { chromium, Browser, Page, devices } from 'playwright';
import { logger } from '../utils/logger';
import { BrowserPoolOptions } from '../types/screenshot.types';

export class BrowserPool {
  private browsers: Browser[] = [];
  private availableBrowsers: Browser[] = [];
  private busyBrowsers: Set<Browser> = new Set();
  private readonly maxConcurrent: number;
  private readonly timeout: number;
  private isInitialized = false;

  constructor(options: BrowserPoolOptions) {
    this.maxConcurrent = options.maxConcurrent;
    this.timeout = options.timeout;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info(`Initializing browser pool with ${this.maxConcurrent} browsers`);
    
    try {
      const launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      };

      logger.debug('Playwright launch options:', launchOptions);

      const browserPromises = Array.from({ length: this.maxConcurrent }, async (_, index) => {
        try {
          logger.debug(`Launching browser ${index + 1}/${this.maxConcurrent}`);
          const browser = await chromium.launch(launchOptions);
          logger.debug(`Browser ${index + 1} launched successfully`);
          return browser;
        } catch (error) {
          logger.error(`Failed to launch browser ${index + 1}:`, error);
          throw error;
        }
      });

      this.browsers = await Promise.all(browserPromises);
      this.availableBrowsers = [...this.browsers];
      this.isInitialized = true;
      
      logger.info(`Browser pool initialized with ${this.browsers.length} browsers`);
    } catch (error) {
      logger.error('Failed to initialize browser pool:', error);
      logger.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to initialize browser pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBrowser(): Promise<Browser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.availableBrowsers.length === 0) {
      throw new Error('No available browsers in pool');
    }

    const browser = this.availableBrowsers.pop()!;
    this.busyBrowsers.add(browser);
    
    logger.debug(`Browser acquired. Available: ${this.availableBrowsers.length}, Busy: ${this.busyBrowsers.size}`);
    return browser;
  }

  async releaseBrowser(browser: Browser): Promise<void> {
    if (this.busyBrowsers.has(browser)) {
      this.busyBrowsers.delete(browser);
      
      // Check if browser is still connected
      if (browser.isConnected()) {
        this.availableBrowsers.push(browser);
        logger.debug(`Browser released. Available: ${this.availableBrowsers.length}, Busy: ${this.busyBrowsers.size}`);
      } else {
        // Browser is disconnected, create a new one
        logger.warn('Browser disconnected, creating new one');
        await this.replaceBrowser(browser);
      }
    }
  }

  private async replaceBrowser(oldBrowser: Browser): Promise<void> {
    try {
      const newBrowser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
        ],
      });

      // Replace in browsers array
      const index = this.browsers.indexOf(oldBrowser);
      if (index !== -1) {
        this.browsers[index] = newBrowser;
      }
      
      this.availableBrowsers.push(newBrowser);
      logger.info('Browser replaced successfully');
    } catch (error) {
      logger.error('Failed to replace browser:', error);
    }
  }

  async createPage(browser: Browser, deviceName?: string): Promise<Page> {
    let page: Page;
    
    if (deviceName) {
      // Use device emulation
      const context = await browser.newContext(devices[deviceName]);
      page = await context.newPage();
    } else {
      // Default page
      page = await browser.newPage();
      
      // Set default viewport
      await page.setViewportSize({
        width: 1920,
        height: 1080,
      });

      // Set user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
    }

    // Set timeout
    page.setDefaultTimeout(this.timeout);
    page.setDefaultNavigationTimeout(this.timeout);

    return page;
  }

  async closePage(page: Page): Promise<void> {
    try {
      if (!page.isClosed()) {
        await page.close();
      }
    } catch (error) {
      logger.warn('Error closing page:', error);
    }
  }

  getStats() {
    return {
      total: this.browsers.length,
      available: this.availableBrowsers.length,
      busy: this.busyBrowsers.size,
    };
  }

  async cleanup(): Promise<void> {
    logger.info('Cleaning up browser pool');
    
    const closePromises = this.browsers.map(browser => 
      browser.close().catch(error => 
        logger.warn('Error closing browser:', error)
      )
    );

    await Promise.all(closePromises);
    
    this.browsers = [];
    this.availableBrowsers = [];
    this.busyBrowsers.clear();
    this.isInitialized = false;
    
    logger.info('Browser pool cleanup completed');
  }
}

export const browserPool = new BrowserPool({
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCREENSHOTS || '5'),
  timeout: parseInt(process.env.PUPPETEER_TIMEOUT || '30000'),
});