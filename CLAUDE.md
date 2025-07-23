# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Screenly is a Node.js REST API for taking website screenshots using Playwright. Screenshots are streamed directly to clients without storage for optimal performance and memory efficiency.

## Commands

### Development
```bash
npm run dev          # Start development server with hot reload (ts-node-dev)
npm run dev:nodemon  # Alternative development server with nodemon  
npm run dev:watch    # Development server with custom nodemon config
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm run start:prod   # Start production server with NODE_ENV=production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Testing
```bash
# Test single screenshot
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' \
  --output test.png

# Test health endpoint
curl http://localhost:3000/api/health

# Test development endpoint
curl http://localhost:3000/api/test --output test.png
```

## Architecture

### Core Components

- **Browser Pool Service** (`src/services/browser-pool.service.ts`): Manages Playwright browser instances with connection pooling for optimal performance
- **Screenshot Service** (`src/services/screenshot.service.ts`): Handles screenshot capture logic, batch processing, and ZIP archive creation
- **Express App** (`src/app.ts`): Main application setup with middleware configuration and graceful shutdown handling

### Key Features

- **Memory Management**: Browser instances are pooled and reused to prevent memory leaks
- **Rate Limiting**: IP-based request throttling with separate limits for single and batch operations
- **Input Validation**: Joi schemas validate all incoming requests
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Streaming**: Direct file streaming without temporary storage

### Environment Configuration

Key environment variables in `.env`:
- `MAX_CONCURRENT_SCREENSHOTS`: Controls browser pool size (default: 5)
- `PUPPETEER_TIMEOUT`: Request timeout in milliseconds (default: 30000)
- `RATE_LIMIT_MAX_REQUESTS`: Requests per window (default: 100)
- `LOG_LEVEL`: Logging verbosity (info, debug, warn, error)

## API Endpoints

- `POST /api/screenshot`: Single screenshot with customizable options
- `POST /api/batch-screenshots`: Multiple screenshots as ZIP archive  
- `GET /api/health`: Health check with system metrics
- `GET /api/test`: Development test endpoint

## Important Notes

- Browser pool initialization happens on server startup
- Failed screenshots in batch operations include error text files
- Rate limiting is more restrictive for batch operations
- All screenshots support both PNG and JPEG formats
- Full page screenshots available via `fullPage` option