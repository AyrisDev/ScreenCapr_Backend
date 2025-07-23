# Screenly API

A high-performance Node.js REST API for taking website screenshots using Playwright. Screenshots are streamed directly to clients without storage, making it fast and memory-efficient.

## Features

- 🚀 **Fast & Efficient**: Direct streaming without file storage
- 🌐 **Multiple Formats**: PNG and JPEG support
- 📦 **Batch Processing**: Take multiple screenshots as ZIP archive
- 🛡️ **Rate Limiting**: IP-based request throttling
- 🔄 **Browser Pool**: Efficient browser instance management
- ⚡ **Memory Management**: Automatic cleanup and leak prevention
- 🎯 **Input Validation**: Comprehensive request validation
- 📊 **Health Monitoring**: Built-in health check endpoint
- 🚦 **Error Handling**: Detailed error responses with proper HTTP codes

## Quick Start

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd screenly

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Development Scripts

```bash
npm run dev          # Start development server with hot reload (ts-node-dev)
npm run dev:nodemon  # Alternative development server with nodemon
npm run dev:watch    # Development server with custom nodemon config
npm run build        # Build for production
npm start            # Start production server
npm run start:prod   # Start production server with NODE_ENV=production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### 1. Single Screenshot

**POST** `/api/screenshot`

Take a screenshot of a single website.

**Request Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "width": 1920,
    "height": 1080,
    "fullPage": false,
    "format": "png",
    "quality": 80,
    "timeout": 30000
  }
}
```

**Parameters:**
- `url` (required): Website URL to screenshot
- `options` (optional): Screenshot configuration
  - `width`: Viewport width (100-3840, default: 1920)
  - `height`: Viewport height (100-2160, default: 1080)
  - `fullPage`: Capture full page scroll (default: false)
  - `format`: Image format "png" or "jpeg" (default: "png")
  - `quality`: JPEG quality 1-100 (default: 80)
  - `timeout`: Request timeout in ms (5000-60000, default: 30000)

**Response:**
- Direct image file download
- Content-Type: `image/png` or `image/jpeg`
- Content-Disposition: `attachment; filename="screenshot_*.png"`

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  --output screenshot.png
```

### 2. Batch Screenshots

**POST** `/api/batch-screenshots`

Take screenshots of multiple websites and download as ZIP.

**Request Body:**
```json
{
  "urls": [
    "https://example.com",
    "https://google.com",
    "https://github.com"
  ],
  "options": {
    "width": 1920,
    "height": 1080,
    "format": "png"
  }
}
```

**Parameters:**
- `urls` (required): Array of URLs (1-10 URLs)
- `options` (optional): Same as single screenshot

**Response:**
- ZIP file containing all screenshots
- Content-Type: `application/zip`
- Failed screenshots will have error text files

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/batch-screenshots \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com","https://google.com"]}' \
  --output screenshots.zip
```

### 3. Health Check

**GET** `/api/health`

Check API health and status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-22T10:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": 125,
    "total": 256,
    "percentage": 49
  },
  "activeBrowsers": 2
}
```

### 4. Test Endpoint

**GET** `/api/test` (Development only)

Test screenshot functionality with a sample page.

## Rate Limiting

- **General requests**: 200 requests per 15 minutes
- **Screenshots**: 100 requests per 15 minutes  
- **Batch screenshots**: 20 requests per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## Error Responses

All errors return JSON with this format:

```json
{
  "error": "Error description",
  "statusCode": 400,
  "timestamp": "2025-06-22T10:00:00.000Z"
}
```

**Common Error Codes:**
- `400`: Invalid URL or parameters
- `408`: Request timeout
- `429`: Rate limit exceeded
- `503`: Service unavailable (too many concurrent requests)

## Environment Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
PUPPETEER_TIMEOUT=30000
MAX_CONCURRENT_SCREENSHOTS=5
LOG_LEVEL=info
CORS_ORIGIN=*
CORS_CREDENTIALS=false
```

## Testing Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');
const fs = require('fs');

// Single screenshot
async function takeScreenshot() {
  try {
    const response = await axios.post('http://localhost:3000/api/screenshot', {
      url: 'https://example.com',
      options: {
        width: 1920,
        height: 1080,
        format: 'png'
      }
    }, {
      responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream('screenshot.png'));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Batch screenshots
async function takeBatchScreenshots() {
  try {
    const response = await axios.post('http://localhost:3000/api/batch-screenshots', {
      urls: ['https://example.com', 'https://google.com'],
      options: { format: 'png' }
    }, {
      responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream('screenshots.zip'));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Python

```python
import requests

# Single screenshot
def take_screenshot():
    response = requests.post('http://localhost:3000/api/screenshot', 
        json={
            'url': 'https://example.com',
            'options': {
                'width': 1920,
                'height': 1080,
                'format': 'png'
            }
        }
    )
    
    if response.status_code == 200:
        with open('screenshot.png', 'wb') as f:
            f.write(response.content)
    else:
        print('Error:', response.json())

# Batch screenshots
def take_batch_screenshots():
    response = requests.post('http://localhost:3000/api/batch-screenshots',
        json={
            'urls': ['https://example.com', 'https://google.com'],
            'options': {'format': 'png'}
        }
    )
    
    if response.status_code == 200:
        with open('screenshots.zip', 'wb') as f:
            f.write(response.content)
    else:
        print('Error:', response.json())
```

## Production Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MAX_CONCURRENT_SCREENSHOTS=3
PUPPETEER_TIMEOUT=45000
RATE_LIMIT_MAX_REQUESTS=50
LOG_LEVEL=warn
CORS_ORIGIN=https://yourdomain.com
```

## Architecture

The application uses a modular architecture:

- **Browser Pool**: Maintains reusable Puppeteer browser instances
- **Screenshot Service**: Handles screenshot logic and image processing
- **Rate Limiting**: IP-based request throttling with configurable limits
- **Validation**: Joi-based input validation for all endpoints
- **Error Handling**: Centralized error handling with proper HTTP codes
- **Logging**: Structured logging with configurable levels

## Performance Tips

1. **Concurrent Limits**: Adjust `MAX_CONCURRENT_SCREENSHOTS` based on server resources
2. **Memory Management**: Monitor memory usage with `/api/health`
3. **Timeouts**: Set appropriate timeouts for slow-loading pages
4. **Rate Limits**: Configure limits based on expected traffic
5. **Full Page**: Use `fullPage: false` for better performance

## License

MIT License - see LICENSE file for details