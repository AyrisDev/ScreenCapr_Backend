# Screenly API - Proje Özet 📸

## 🎯 Proje Amacı
Website'lerin screenshot'larını alan ve direkt stream eden REST API backend. **Storage yok** - screenshot alındıktan sonra direkt client'a gönderiliyor.

## 🛠️ Teknoloji Stack
- **Node.js + TypeScript** - Backend framework
- **Express.js** - REST API server
- **Playwright** - Browser automation (Puppeteer yerine)
- **Joi** - Input validation
- **Express-rate-limit** - Rate limiting
- **Cors** - Cross-origin support
- **Morgan** - HTTP request logging
- **Archiver** - ZIP file creation

## 🚀 Ana Özellikler

### 1. **Single Screenshot API**
```bash
POST /api/screenshot
```
- Tek bir website'in screenshot'ını alır
- PNG/JPEG format desteği
- Custom viewport boyutları
- Full page screenshot seçeneği
- Quality ayarı (JPEG için)

### 2. **Batch Screenshot API**
```bash
POST /api/batch-screenshots
```
- Birden fazla URL'in screenshot'ını alır
- ZIP dosyası olarak indirir
- Maksimum 10 URL'e kadar
- Hatalı URL'ler için error dosyası ekler

### 3. **Health Monitoring**
```bash
GET /api/health
```
- Server durumu
- Memory kullanımı
- Uptime bilgisi
- Aktif browser sayısı

### 4. **Test Endpoint**
```bash
GET /api/test
```
- Development için test endpoint'i
- httpbin.org'dan örnek screenshot alır

## ⚙️ Teknik Detaylar

### Browser Pool Management
- **3 concurrent browser instance** (ayarlanabilir)
- Browser'lar pool'da tutulur ve yeniden kullanılır
- Memory leak prevention
- Otomatik browser replacement

### Rate Limiting
- **100 request/15 dakika** (normal screenshot)
- **20 request/15 dakika** (batch screenshot)
- IP bazlı sınırlama
- Configurable limits

### Input Validation
- URL format kontrolü
- Screenshot options validation
- Width: 100-3840px
- Height: 100-2160px
- Timeout: 5-60 saniye

### Error Handling
- Detailed error messages
- Proper HTTP status codes
- Timeout handling
- Network error handling
- Browser crash recovery

## 📝 API Kullanım Örnekleri

### Basit Screenshot
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://google.com"}' \
  --output screenshot.png
```

### Özelleştirilmiş Screenshot
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://example.com",
    "options": {
      "width": 1920,
      "height": 1080,
      "fullPage": true,
      "format": "jpeg",
      "quality": 90
    }
  }' \
  --output fullpage.jpg
```

### Batch Screenshots
```bash
curl -X POST http://localhost:3000/api/batch-screenshots \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://google.com",
      "https://github.com",
      "https://stackoverflow.com"
    ]
  }' \
  --output screenshots.zip
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Test Endpoint
```bash
curl http://localhost:3000/api/test --output test.png
```

## 🔧 Development Commands

```bash
npm run dev          # ts-node-dev ile development
npm run dev:nodemon  # nodemon ile development
npm run build        # Production build
npm run start        # Production server
npm run lint         # Code linting
npm run lint:fix     # Auto-fix linting issues
```

## 🎛️ Konfigürasyon (.env)

```env
PORT=3000                          # Server port
NODE_ENV=development               # Environment
MAX_CONCURRENT_SCREENSHOTS=3      # Browser pool size
PUPPETEER_TIMEOUT=30000           # Request timeout (ms)
RATE_LIMIT_MAX_REQUESTS=100       # Rate limit
RATE_LIMIT_WINDOW_MS=900000       # Rate limit window (15 min)
LOG_LEVEL=info                     # Logging level
CORS_ORIGIN=*                      # CORS policy
CORS_CREDENTIALS=false             # CORS credentials
```

## 📊 Performance Features

- **Memory Efficient**: No file storage, direct streaming
- **Concurrent Processing**: Multiple screenshots simultaneously
- **Browser Reuse**: Pool pattern prevents startup overhead
- **Rate Limiting**: Prevents abuse and overload
- **Graceful Shutdown**: Proper cleanup on exit

## 🔒 Security Features

- Input validation for all endpoints
- Rate limiting per IP
- CORS policy configuration
- Security headers
- Error message sanitization
- No sensitive information in logs

## 🎯 Şu An Yapabilecekleriniz

✅ **Single website screenshot** - Herhangi bir URL'in screenshot'ını al  
✅ **Batch processing** - Birden fazla site'in screenshot'ını ZIP olarak al  
✅ **Custom options** - Boyut, format, quality ayarları  
✅ **Full page screenshots** - Tüm sayfa scroll'u ile  
✅ **Health monitoring** - Server durumu takibi  
✅ **Rate limiting** - Abuse protection  
✅ **Error handling** - Detaylı hata yönetimi  
✅ **Memory management** - Automatic cleanup  
✅ **Cross-platform** - macOS ARM64'te çalışıyor  

## 📁 Proje Yapısı

```
src/
├── controllers/          # API endpoint handlers
│   └── screenshot.controller.ts
├── services/            # Business logic
│   ├── browser-pool.service.ts
│   └── screenshot.service.ts
├── middleware/          # Express middleware
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   └── rateLimit.middleware.ts
├── types/              # TypeScript type definitions
│   └── screenshot.types.ts
├── utils/              # Utility functions
│   └── logger.ts
├── routes/             # API routes
│   └── screenshot.routes.ts
├── config/             # Configuration
│   └── index.ts
└── app.ts              # Main application
```

## 🚀 Production Ready!

Proje tamamen functional ve production'a deploy edilebilir durumda. Docker support, monitoring ve scaling için hazır!

### Production Deployment Önerileri

1. **Docker containerization**
2. **Load balancer arkasında çalıştırma**
3. **Redis ile rate limiting**
4. **Monitoring ve alerting (Prometheus/Grafana)**
5. **Log aggregation (ELK Stack)**
6. **Auto-scaling configuration**

## 🎉 Test Edilmiş Özellikler

- ✅ Health check endpoint çalışıyor
- ✅ Single screenshot (Google, Example.com test edildi)
- ✅ Batch screenshot (ZIP dosyası oluşturuluyor)
- ✅ Browser pool management
- ✅ Error handling
- ✅ Rate limiting
- ✅ Input validation
- ✅ Memory management
- ✅ Graceful shutdown

Proje %100 çalışır durumda! 🎊