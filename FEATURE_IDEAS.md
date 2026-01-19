# ScreenCapr - Feature Ideas & Roadmap 🚀

Bu doküman, ScreenCapr projesine eklenebilecek potansiyel özellikleri içerir. Her özellik için zorluk seviyesi, değer katkısı ve implementasyon notları eklenmiştir.

---

## 🎯 Kullanıcı Deneyimi & Esneklik

### 1. Dark Mode Detection & Auto-Switch
**Zorluk:** 🟢 Kolay  
**Değer:** ⭐⭐⭐⭐

- Bazı siteler dark mode desteği sunuyor. Kullanıcı `--dark-mode` bayrağı ile siteyi dark modda açabilir.
- Playwright'ta `prefers-color-scheme: dark` emülasyonu yapılabilir.

**Implementasyon:**
```typescript
await page.emulateMedia({ colorScheme: 'dark' });
```

**API Kullanımı:**
```json
{
  "url": "https://example.com",
  "options": {
    "darkMode": true
  }
}
```

---

### 2. Cookie/Auth Support
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐⭐⭐

- Login gerektiren sayfalar için cookie injection
- `--cookies='{"session":"xyz"}'` şeklinde kullanım
- Veya önceden kaydedilmiş session'lar

**Kullanım Senaryoları:**
- Dashboard screenshot'ları
- Private content
- Personalized pages

**Güvenlik Notu:** Cookie'ler hassas veri olduğu için encryption gerekebilir.

---

### 3. Custom CSS Injection
**Zorluk:** 🟢 Kolay  
**Değer:** ⭐⭐⭐⭐⭐

- Belirli elementleri gizlemek için (örn: cookie bannerları, chatbot'lar)
- `--hide-selectors=".cookie-banner,.chat-widget"`
- Veya tam tersi: sadece belirli bir elementi göster

**Implementasyon:**
```typescript
await page.addStyleTag({
  content: '.cookie-banner, .chat-widget { display: none !important; }'
});
```

**Popüler Kullanım:**
- Cookie consent bannerları
- Live chat widget'ları
- Reklam alanları
- Newsletter popup'ları

---

### 4. Element-Specific Screenshot ⭐ ÖNCELIK
**Zorluk:** 🟢 Kolay  
**Değer:** ⭐⭐⭐⭐⭐

- Tüm sayfa yerine sadece belirli bir elementi çek
- `--selector="#main-content"` 
- E-ticaret sitelerinde sadece ürün kartını çekmek gibi

**Implementasyon:**
```typescript
const element = await page.locator(selector);
const screenshot = await element.screenshot();
```

**Kullanım Örnekleri:**
- Ürün kartları
- Pricing tables
- Testimonial sections
- Header/Footer ayrı ayrı

---

## 📊 Analiz & Metadata

### 5. Performance Metrics
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐

- Screenshot ile birlikte sayfa yükleme süreleri, resource sayısı gibi metrikleri de döndür
- Lighthouse score entegrasyonu (opsiyonel)

**Dönecek Veriler:**
```json
{
  "screenshot": "base64...",
  "metrics": {
    "loadTime": 1234,
    "domContentLoaded": 890,
    "resourceCount": 45,
    "totalSize": "2.3MB"
  }
}
```

---

### 6. OCR (Text Extraction)
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐

- Screenshot'tan metni çıkar (Tesseract.js ile)
- Özellikle PDF'lere dönüştürülmüş metinler için kullanışlı

**Not:** Heavy dependency, opsiyonel feature olmalı.

---

### 7. Metadata Extraction ⭐ ÖNCELIK
**Zorluk:** 🟢 Kolay  
**Değer:** ⭐⭐⭐⭐

- Sayfa title, description, og:image gibi meta bilgileri
- ZIP içinde `metadata.json` olarak eklenebilir

**Implementasyon:**
```typescript
const metadata = await page.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
  canonical: document.querySelector('link[rel="canonical"]')?.href
}));
```

---

## 🎨 Görsel İyileştirmeler

### 8. Watermark/Logo Ekleme
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐

- Screenshot'lara otomatik watermark
- Branding için kullanışlı
- Sharp kütüphanesi ile composite işlemi

---

### 9. Annotation Support
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐⭐

- Belirli alanlara ok, kutu, vurgulama ekleme
- Bug report'lar için mükemmel
- Canvas API veya image processing library gerekir

---

### 10. Comparison Mode
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐⭐

- İki URL'i yan yana karşılaştırmalı screenshot
- Before/After senaryoları için
- Pixel-diff detection ile değişiklikleri highlight

---

## 🔄 Otomasyon & Scheduling

### 11. Scheduled Screenshots
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐⭐⭐

- Belirli URL'leri günlük/saatlik otomatik çek
- Webhook ile bildirim gönder
- Değişiklik algılama (diff detection)

**Gereksinimler:**
- Cron job scheduler (node-cron)
- Database (screenshot history)
- Notification system

---

### 12. Video Recording
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐⭐

- Screenshot yerine kısa video kayıt
- Playwright zaten destekliyor
- User interaction flow'ları için ideal

**Implementasyon:**
```typescript
await page.video(); // Playwright built-in
```

---

### 13. Interactive Element Testing
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐⭐

- Butona tıklama, form doldurma gibi aksiyonlar
- `--actions='[{"type":"click","selector":"#submit"}]'`

**Örnek Senaryo:**
```json
{
  "actions": [
    {"type": "click", "selector": "#cookie-accept"},
    {"type": "fill", "selector": "#search", "value": "test"},
    {"type": "click", "selector": "#search-button"},
    {"type": "wait", "duration": 2000}
  ]
}
```

---

## 🌐 Multi-Platform & Format

### 14. PDF Export ⭐ ÖNCELIK
**Zorluk:** 🟢 Kolay  
**Değer:** ⭐⭐⭐⭐⭐

- Screenshot'ları direkt PDF'e dönüştür
- Batch işlemlerde tüm sayfaları tek PDF'te birleştir

**Implementasyon:**
```typescript
await page.pdf({
  format: 'A4',
  printBackground: true
});
```

**Avantajlar:**
- Arşivleme için ideal
- Print-friendly
- Multi-page support

---

### 15. WebP Support
**Zorluk:** 🟢 Kolay  
**Değer:** ⭐⭐⭐

- PNG/JPEG'e ek olarak modern WebP formatı
- Daha küçük dosya boyutu
- Sharp kütüphanesi zaten destekliyor

---

### 16. Responsive Grid
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐⭐⭐

- Aynı sayfayı mobile, tablet, desktop'ta aynı anda çek
- Yan yana grid layout'ta birleştir

**Kullanım:**
```bash
/screenshot https://example.com --responsive-grid
```

**Çıktı:** Tek bir image'de 3 farklı viewport.

---

## 🔐 Güvenlik & Privacy

### 17. Proxy Support
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐

- Farklı coğrafyalardan screenshot
- Geo-restricted içerik için

**Implementasyon:**
```typescript
await browser.newContext({
  proxy: {
    server: 'http://proxy.example.com:8080'
  }
});
```

---

### 18. Sensitive Data Masking
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐⭐

- Kredi kartı numaraları, email'ler gibi hassas verileri otomatik blur
- Regex pattern'ler ile tespit
- GDPR compliance için önemli

---

## 💾 Storage & CDN

### 19. Cloud Storage Integration
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐⭐

- S3, Cloudflare R2, Google Cloud Storage'a otomatik upload
- URL döndür (şu an storage yok ama opsiyonel olabilir)

**Avantajlar:**
- Persistent storage
- CDN entegrasyonu
- Sharing kolaylığı

---

### 20. Caching Layer
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐⭐⭐

- Aynı URL için belirli süre içinde cache'den dön
- Redis ile TTL bazlı
- Rate limiting'i azaltır

**Implementasyon:**
```typescript
const cacheKey = `screenshot:${url}:${JSON.stringify(options)}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

---

## 🤖 AI & Smart Features

### 21. Smart Crop
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐

- AI ile önemli kısmı otomatik tespit edip crop et
- Gereksiz whitespace'leri temizle
- ML model gerektirir

---

### 22. Content Summarization
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐

- Screenshot + AI ile sayfa özeti
- "Bu sayfa ne hakkında?" sorusuna cevap
- OpenAI/Anthropic API entegrasyonu

---

### 23. Accessibility Check
**Zorluk:** 🟡 Orta  
**Değer:** ⭐⭐⭐⭐

- Contrast ratio, alt text varlığı gibi a11y kontrolleri
- Screenshot ile birlikte rapor
- axe-core kütüphanesi kullanılabilir

---

## 📈 Analytics & Monitoring

### 24. Usage Dashboard
**Zorluk:** 🔴 Zor  
**Değer:** ⭐⭐⭐⭐

- Hangi URL'ler en çok çekiliyor
- Başarı/hata oranları
- Ortalama işlem süreleri

**Gereksinimler:**
- Database (PostgreSQL/MongoDB)
- Analytics service
- Frontend dashboard

---

### 25. Webhook Notifications
**Zorluk:** 🟢 Kolay  
**Değer:** ⭐⭐⭐⭐

- Screenshot tamamlandığında webhook gönder
- Async işlemler için ideal

**Kullanım:**
```json
{
  "url": "https://example.com",
  "webhook": "https://myapp.com/webhook/screenshot-complete"
}
```

---

## 🎖️ Öncelik Sıralaması (Quick Wins)

### Phase 1 - Kolay & Değerli
1. ✅ **Element-Specific Screenshot** - En çok talep görecek
2. ✅ **Custom CSS Injection** - Cookie banner problemi çözümü
3. ✅ **Metadata Extraction** - Minimal effort, yüksek değer
4. ✅ **PDF Export** - Batch işlemler için harika
5. ✅ **Dark Mode Support** - Modern ve trendy

### Phase 2 - Orta Zorluk
6. **Responsive Grid** - Responsive testing için ideal
7. **Caching Layer** - Performance boost
8. **Webhook Notifications** - Async workflow'lar için
9. **Cloud Storage Integration** - Persistent storage
10. **Video Recording** - Playwright zaten destekliyor

### Phase 3 - Advanced Features
11. **Scheduled Screenshots** - Monitoring use case
12. **Interactive Element Testing** - E2E test senaryoları
13. **Comparison Mode** - Visual regression testing
14. **Accessibility Check** - Compliance için önemli

---

## 💡 Implementasyon Notları

### Hızlı Başlangıç İçin:
- **Element Screenshot** ve **CSS Injection** aynı anda yapılabilir (1-2 saat)
- **Metadata Extraction** çok basit, hemen eklenebilir (30 dakika)
- **PDF Export** Playwright'ın built-in özelliği (15 dakika)

### Mimari Değişiklik Gerektirenler:
- Scheduled Screenshots → Job queue sistemi (Bull/BullMQ)
- Cloud Storage → Storage adapter pattern
- Caching → Redis entegrasyonu

### Dikkat Edilmesi Gerekenler:
- **Cookie/Auth Support:** Güvenlik riski, encryption şart
- **AI Features:** Cost implications, API key management
- **Video Recording:** Dosya boyutu çok büyük olabilir

---

## 🔗 Faydalı Kaynaklar

- [Playwright Documentation](https://playwright.dev/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [axe-core Accessibility](https://github.com/dequelabs/axe-core)
- [Tesseract.js OCR](https://tesseract.projectnaptha.com/)

---

**Son Güncelleme:** 2026-01-19  
**Durum:** Brainstorming / Planning Phase
