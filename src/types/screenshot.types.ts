export interface ScreenshotOptions {
  url?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  format?: 'png' | 'jpeg';
  quality?: number;
  timeout?: number;
  delay?: number;
  lazyLoad?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface ScreenshotRequest {
  url: string;
  options?: ScreenshotOptions;
}

export interface BatchScreenshotRequest {
  urls: string[];
  options?: ScreenshotOptions;
}

export interface ApiError {
  error: string;
  statusCode: number;
  timestamp: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  activeBrowsers?: number;
}

export interface BrowserPoolOptions {
  maxConcurrent: number;
  timeout: number;
}

export interface ValidatedScreenshotRequest extends ScreenshotRequest {
  options: Required<ScreenshotOptions>;
}