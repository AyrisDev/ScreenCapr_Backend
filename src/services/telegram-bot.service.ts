import TelegramBot from 'node-telegram-bot-api';
import sharp from 'sharp';
import { ScreenshotService } from './screenshot.service';
import { ScreenshotOptions } from '../types/screenshot.types';
import { logger } from '../utils/logger';

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private screenshotService: ScreenshotService;
  private isEnabled: boolean;

  constructor(screenshotService: ScreenshotService) {
    this.screenshotService = screenshotService;
    this.isEnabled = process.env.TELEGRAM_BOT_ENABLED === 'true';

    if (this.isEnabled) {
      this.initializeBot();
    }
  }

  private initializeBot(): void {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token || token === 'your_bot_token_here') {
      console.warn('Telegram bot token not configured properly');
      this.isEnabled = false;
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.setupCommands();
      console.log('✅ Telegram bot initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
      this.isEnabled = false;
    }
  }

  private setupCommands(): void {
    if (!this.bot) return;

    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🤖 *Screenly Bot'a Hoş Geldiniz!*

Bu bot ile web sitelerinin ekran görüntüsünü alabilirsiniz.

*Komutlar:*
• \`/screenshot <URL> [seçenekler]\` - Website screenshot al
• \`/help\` - Yardım menüsü

*Örnek kullanım:*
\`/screenshot https://google.com\`
\`/screenshot https://google.com --full\`
\`/screenshot https://google.com --format=jpeg --mobile\`
      `;

      this.bot!.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
📖 *Yardım Menüsü*

*Komutlar:*
• \`/screenshot <URL> [seçenekler]\` - Belirtilen web sitesinin screenshot'ını alır
• \`/help\` - Bu yardım menüsünü gösterir

*Screenshot Seçenekleri:*
• \`--full\` - Tüm sayfa (varsayılan: viewport)
• \`--no-lazy\` - Lazy Load kapat (Otomatik açık)
• \`--delay=2000\` - Bekleme süresi (ms, varsayılan: 2000)
• \`--mobile\` - Mobil görünüm (375x667)
• \`--tablet\` - Tablet görünüm (768x1024)
• \`--desktop\` - Masaüstü görünüm (1920x1080) [varsayılan]
• \`--format=png\` - PNG formatı [varsayılan]
• \`--format=jpeg\` - JPEG formatı

*Örnek kullanım:*
\`/screenshot https://google.com\` (Lazy load + 2sn bekleme otomatik)
\`/screenshot https://google.com --no-lazy\`
\`/screenshot https://google.com --delay=5000\`

*Önemli Notlar:*
• Tüm sayfa screenshot'ları çok büyükse otomatik JPEG'e çevrilir
• Hala büyükse viewport screenshot'ı alınır
• Maksimum dosya boyutu: 5MB

*Limitler:*
• Maksimum işlem süresi: 30 saniye
• Eşzamanlı işlem limiti var
      `;

      this.bot!.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Screenshot command with options
    this.bot.onText(/\/screenshot (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const input = match?.[1];

      if (!input) {
        this.bot!.sendMessage(chatId, '❌ Lütfen geçerli bir URL girin.\nÖrnek: `/screenshot https://google.com`', { parse_mode: 'Markdown' });
        return;
      }

      // Parse URL and options
      const { url, options, error } = this.parseScreenshotCommand(input);

      if (error) {
        this.bot!.sendMessage(chatId, `❌ ${error}`, { parse_mode: 'Markdown' });
        return;
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        this.bot!.sendMessage(chatId, '❌ Geçersiz URL formatı. Lütfen http:// veya https:// ile başlayan geçerli bir URL girin.');
        return;
      }

      // Send loading message with options info
      const optionsText = this.getOptionsText(options);
      const loadingMsg = await this.bot!.sendMessage(chatId, `📸 Screenshot alınıyor...\n${optionsText}`);

      try {
        const screenshot = await this.screenshotService.takeScreenshot(options);

        let finalScreenshot = screenshot;
        let finalCaption = `📸 ${url}\n${optionsText}`;

        // Process screenshot with Sharp to check dimensions and optimize
        finalScreenshot = await this.processTelegramImage(screenshot, finalCaption);

        // Update caption if image was processed
        if (finalScreenshot.length !== screenshot.length) {
          finalCaption += '\n⚠️ Telegram için optimize edildi';
        }

        // Delete loading message
        try {
          await this.bot!.deleteMessage(chatId, loadingMsg.message_id);
        } catch (deleteError) {
          // Ignore delete errors
        }

        // Send screenshot
        await this.bot!.sendPhoto(chatId, finalScreenshot, {
          caption: finalCaption
        });

      } catch (error) {
        console.error('Screenshot error:', error);

        // Delete loading message (ignore errors)
        try {
          await this.bot!.deleteMessage(chatId, loadingMsg.message_id);
        } catch (deleteError) {
          // Ignore delete errors
        }

        // Send error message
        this.bot!.sendMessage(chatId, `❌ Screenshot alınamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      }
    });

    // Handle invalid commands
    this.bot.on('message', (msg) => {
      const text = msg.text;
      if (text && text.startsWith('/') && !text.match(/\/(start|help|screenshot)/)) {
        const chatId = msg.chat.id;
        this.bot!.sendMessage(chatId, '❌ Bilinmeyen komut. Kullanılabilir komutlar için `/help` yazın.');
      }
    });

    // Handle errors
    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });
  }

  public isRunning(): boolean {
    return this.isEnabled && this.bot !== null;
  }

  private parseScreenshotCommand(input: string): { url: string; options: ScreenshotOptions; error?: string } {
    const parts = input.split(' ');
    const url = parts[0] || '';
    const flags = parts.slice(1);

    const options: ScreenshotOptions = {
      url,
      format: 'png',
      fullPage: false,
      viewport: { width: 1920, height: 1080 }
    };

    for (const flag of flags) {
      if (flag === '--full') {
        options.fullPage = true;
      } else if (flag === '--mobile') {
        options.viewport = { width: 375, height: 667 };
      } else if (flag === '--tablet') {
        options.viewport = { width: 768, height: 1024 };
      } else if (flag === '--desktop') {
        options.viewport = { width: 1920, height: 1080 };
      } else if (flag === '--lazy') {
        options.lazyLoad = true;
      } else if (flag === '--no-lazy') {
        options.lazyLoad = false;
      } else if (flag.startsWith('--delay=')) {
        const delayStr = flag.split('=')[1];
        if (delayStr) {
          const delay = parseInt(delayStr);
          options.delay = isNaN(delay) ? 1000 : Math.min(delay, 10000);
        }
      } else if (flag.startsWith('--format=')) {
        const format = flag.split('=')[1];
        if (format === 'png' || format === 'jpeg') {
          options.format = format;
        } else {
          return { url, options, error: `Geçersiz format: ${format || 'boş'}. Sadece 'png' veya 'jpeg' desteklenir.` };
        }
      } else if (flag.startsWith('--')) {
        return { url, options, error: `Bilinmeyen seçenek: ${flag}` };
      }
    }

    return { url, options };
  }

  private async processTelegramImage(imageBuffer: Buffer, caption: string): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Could not read image dimensions');
      }

      // Telegram limits: 10000x10000 pixels, ~10MB file size
      const maxDimension = 8000; // Be conservative
      const maxFileSize = 5 * 1024 * 1024; // 5MB

      let needsResize = false;
      let newWidth = metadata.width;
      let newHeight = metadata.height;

      // Check if dimensions exceed limits
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        needsResize = true;
        const ratio = Math.min(maxDimension / metadata.width, maxDimension / metadata.height);
        newWidth = Math.round(metadata.width * ratio);
        newHeight = Math.round(metadata.height * ratio);
        logger.info(`Resizing image from ${metadata.width}x${metadata.height} to ${newWidth}x${newHeight}`);
      }

      let processedImage = image;

      if (needsResize) {
        processedImage = image.resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: true
        });
      }

      // Convert to JPEG with quality optimization if file is too large
      let result = await processedImage.jpeg({ quality: 85, progressive: true }).toBuffer();

      // If still too large, reduce quality further
      if (result.length > maxFileSize) {
        logger.info(`File still too large (${result.length} bytes), reducing quality`);
        result = await processedImage.jpeg({ quality: 60, progressive: true }).toBuffer();

        // Last resort: reduce quality to minimum acceptable
        if (result.length > maxFileSize) {
          result = await processedImage.jpeg({ quality: 40, progressive: true }).toBuffer();
        }
      }

      return result;

    } catch (error) {
      logger.error('Error processing image for Telegram:', error);
      // Return original if processing fails
      return imageBuffer;
    }
  }

  private getOptionsText(options: ScreenshotOptions): string {
    const parts: string[] = [];

    if (options.fullPage) {
      parts.push('📄 Tüm sayfa');
    } else {
      parts.push('🖼️ Viewport');
    }

    if (options.viewport) {
      const { width, height } = options.viewport;
      if (width === 375 && height === 667) {
        parts.push('📱 Mobil');
      } else if (width === 768 && height === 1024) {
        parts.push('📱 Tablet');
      } else if (width === 1920 && height === 1080) {
        parts.push('🖥️ Masaüstü');
      } else {
        parts.push(`📐 ${width}x${height}`);
      }
    }

    parts.push(`📋 ${options.format?.toUpperCase()}`);

    if (options.lazyLoad) {
      parts.push('⏳ Lazy Load');
    }

    if (options.delay && options.delay > 1000) {
      parts.push(`⏱️ ${options.delay}ms`);
    }

    return parts.join(' • ');
  }

  public async stop(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
      this.bot = null;
      console.log('🛑 Telegram bot stopped');
    }
  }
}