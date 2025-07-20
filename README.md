# WhatsApp AI Bot - Enhanced Version

Advanced WhatsApp bot dengan integrasi Rasa AI yang dilengkapi fitur lengkap untuk production use.

## 🚀 Fitur Utama

### Core Features
- ✅ **Integrasi Rasa AI** - Koneksi dengan Rasa server untuk AI responses
- ✅ **Session Management** - Pengelolaan session user yang konsisten
- ✅ **Rate Limiting** - Perlindungan dari spam dan abuse
- ✅ **Auto Retry** - Retry otomatis untuk request yang gagal
- ✅ **Typing Simulation** - Simulasi mengetik yang natural

### Advanced Features
- 📊 **Analytics & Statistics** - Tracking penggunaan dan performa bot
- 🛡️ **Content Security** - Filter konten berbahaya dan spam
- 🔧 **Maintenance Mode** - Mode pemeliharaan untuk update
- 🏥 **Health Monitoring** - Endpoint untuk monitoring kesehatan bot
- 📝 **Comprehensive Logging** - System logging dengan berbagai level
- 🔄 **Auto Recovery** - Recovery otomatis dari crash dan error
- ⚡ **Performance Optimization** - Optimasi memory dan response time

## 📦 Installation

### Requirements
- Node.js >= 22.14.0
- Rasa Server running on port 5005
- WhatsApp account for bot

### Setup Steps

1. **Clone & Install**
```bash
git clone <repository-url>
cd whatsapp-ai-bot
npm run setup
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env file with your configurations
```

3. **Start Bot**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RASA_URL` | `http://localhost:5005/webhooks/rest/webhook` | Rasa server endpoint |
| `BOT_NAME` | `AI Assistant` | Bot display name |
| `MAX_SESSIONS` | `1000` | Maximum concurrent sessions |
| `SESSION_TIMEOUT` | `1800000` | Session timeout (30 minutes) |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warn/error) |
| `ENABLE_ANALYTICS` | `true` | Enable usage analytics |
| `BLOCKED_KEYWORDS` | `spam,scam` | Comma-separated blocked keywords |

### Rate Limiting
- **Default**: 10 messages per minute per user
- **Customizable** via environment variables
- **Automatic cleanup** of rate limit data

### Security Features
- Content filtering for blocked keywords
- Session isolation and encryption
- Automatic cleanup of sensitive data
- Protection against memory leaks

## 🔧 API Integration

### Rasa Integration
Bot sends structured payload to Rasa:
```json
{
  "sender": "wa_uniqueid",
  "message": "user message",
  "metadata": {
    "source": "whatsapp",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "2.0"
  }
}
```

### Response Processing
Supports all Rasa response types:
- Text responses
- Quick replies (converted to numbered list)
- Buttons (converted to numbered list)
- Custom responses
- Images and attachments

## 📊 Monitoring & Analytics

### Health Check Endpoint
```bash
curl http://localhost:3001/health
```

Response includes:
- Bot status and uptime
- Memory usage
- Active sessions count
- Rasa server connectivity

### Logging System
- **File-based logging** in `logs/bot.log`
- **Console output** with timestamps
- **Configurable log levels**
- **Automatic log rotation**

### Statistics Tracking
- User message counts
- Response times
- Session duration
- System performance metrics

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
```bash
export NODE_ENV=production
export LOG_LEVEL=warn
export ENABLE_HEALTH_CHECK=true
```

2. **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start bot.js --name whatsapp-bot
pm2 save
pm2 startup
```

3. **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p logs data
EXPOSE 3001
CMD ["npm", "start"]
```

### Scaling Considerations
- Use Redis for session storage in multi-instance setup
- Implement load balancing for Rasa servers
- Monitor memory usage and implement restart policies
- Use external logging service for centralized logs

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Development with nodemon
npm run test     # Run tests
npm run lint     # ESLint checking
npm run format   # Code formatting
npm run logs     # View real-time logs
npm run health   # Check bot health
npm run clean    # Clean logs and data
```

### Code Structure
```
├── bot.js              # Main bot application
├── package.json        # Dependencies and scripts
├── .env               # Environment configuration
├── logs/              # Application logs
├── data/              # Session and statistics data
└── README.md          # Documentation
```

### Testing
```bash
# Run unit tests
npm test

# Test specific functionality
npm test -- --grep "SessionManager"
```

## 🔍 Troubleshooting

### Common Issues

**Bot not connecting to WhatsApp**
- Check if Chrome/Chromium is installed
- Verify QR code scanning
- Check firewall and network connectivity

**Rasa server unreachable**
- Verify Rasa server is running on correct port
- Check network connectivity to Rasa server
- Validate Rasa webhook configuration

**High memory usage**
- Reduce `MAX_SESSIONS` value
- Lower `SESSION_TIMEOUT`
- Enable more aggressive cleanup

**Rate limiting issues**
- Adjust rate limit parameters
- Check for user abuse patterns
- Verify cleanup intervals

### Debug Mode
```bash
export LOG_LEVEL=debug
npm start
```

### Health Check
```bash
# Check bot status
npm run health

# View real-time logs
npm run logs

# Monitor system resources
htop
```

## 📈 Performance Optimization

### Memory Management
- Automatic session cleanup
- Configurable memory limits
- Garbage collection optimization
- Memory leak detection

### Response Time
- Connection pooling for Rasa requests
- Async/await optimization
- Efficient message processing
- Caching for repeated requests

### Scalability
- Horizontal scaling support
- Load balancing capabilities
- Database integration ready
- Microservice architecture compatible

## 🔐 Security Best Practices

### Data Protection
- Encrypted session storage
- Sensitive data sanitization
- Automatic cleanup of logs
- Privacy-compliant user tracking

### Access Control
- IP-based rate limiting
- Content filtering
- Abuse detection and prevention
- Audit logging for security events

## 📚 Advanced Usage

### Custom Message Processing
```javascript
// Extend MessageProcessor class
class CustomMessageProcessor extends MessageProcessor {
  static processCustomResponse(data) {
    // Your custom logic here
    return super.processRasaResponse(data);
  }
}
```

### Analytics Integration
```javascript
// Custom analytics tracking
sessionManager.updateStats(chatId, messageLength, responseTime, {
  customField: 'value',
  userType: 'premium'
});
```

### Webhook Extensions
```javascript
// Add custom webhooks
app.post('/webhook/custom', (req, res) => {
  // Process custom webhook
  bot.handleCustomWebhook(req.body);
  res.status(200).send('OK');
});
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and community support

## 🙏 Acknowledgments

- [@open-wa/wa-automate](https://github.com/open-wa/wa-automate-nodejs) for WhatsApp integration
- [Rasa](https://rasa.com/) for AI conversation management
- Community contributors and testers

---

# WhatsApp Bot - Installation & Troubleshooting Guide

## Quick Fix untuk Error "Failed to launch the browser"

### 1. **Install Dependencies yang Diperlukan**
```bash
npm install @open-wa/wa-automate
npm install puppeteer  # Ini akan install Chromium otomatis
```

### 2. **Install Google Chrome**

#### Windows:
```bash
# Download manual dari https://www.google.com/chrome/
# Atau menggunakan Chocolatey:
choco install googlechrome
```

#### macOS:
```bash
# Download manual dari https://www.google.com/chrome/
# Atau menggunakan Homebrew:
brew install --cask google-chrome
```

#### Linux (Ubuntu/Debian):
```bash
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install google-chrome-stable
```

#### Linux (CentOS/RHEL):
```bash
sudo yum install google-chrome-stable
```

### 3. **Jalankan dengan Konfigurasi Khusus**

Jika masih error, coba jalankan dengan:
```bash
node --max-old-space-size=4096 bot.js
```

## Solusi Alternatif

### Option 1: Gunakan Puppeteer Chromium
Jika Chrome sulit diinstall, gunakan Chromium dari Puppeteer:
```bash
npm install puppeteer
```

Lalu ubah konfigurasi bot menjadi:
```javascript
const client = await create({
  sessionId: 'wa-bot-session',
  headless: true,
  useChrome: false,  // Gunakan Chromium dari Puppeteer
  // ... konfigurasi lainnya
});
```

### Option 2: Mode Non-Headless (untuk Debug)
```javascript
const client = await create({
  sessionId: 'wa-bot-session',
  headless: false,  // Browser akan terlihat
  // ... konfigurasi lainnya
});
```

### Option 3: Minimal Configuration
```javascript
const client = await create({
  sessionId: 'wa-bot-session',
  chromiumArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});
```

## Troubleshooting Common Issues

### Error: ENOENT atau Chrome not found
**Solusi:**
1. Pastikan Chrome terinstall
2. Check path Chrome di system
3. Install puppeteer sebagai backup

### Error: Permission denied
**Solusi (Linux/macOS):**
```bash
sudo chmod +x /usr/bin/google-chrome-stable
```

### Error: Failed to create browser session
**Solusi:**
1. Restart bot
2. Clear browser cache
3. Delete session folder
4. Jalankan dengan user privileges yang tepat

### Error: Cannot connect to WhatsApp
**Solusi:**
1. Check koneksi internet
2. Scan QR code dengan benar
3. Pastikan WhatsApp tidak login di device lain
4. Tunggu beberapa menit sebelum retry

## Environment Requirements

### Minimum Requirements:
- **Node.js**: v14.x atau lebih baru
- **RAM**: Minimal 2GB free
- **Storage**: 500MB free space
- **OS**: Windows 10, macOS 10.14+, Ubuntu 18.04+

### Recommended:
- **Node.js**: v18.x atau v20.x
- **RAM**: 4GB+ free
- **Storage**: 1GB+ free space
- **CPU**: 2 cores+

## Security Tips

1. **Jangan share session files**
2. **Gunakan environment variables untuk sensitive data**
3. **Enable 2FA pada WhatsApp**
4. **Monitor bot activity secara regular**
5. **Update dependencies secara berkala**

## Performance Optimization

### 1. Memory Management
```bash
node --max-old-space-size=4096 --optimize-for-size bot.js
```

### 2. Process Monitoring
```bash
npm install pm2 -g
pm2 start bot.js --name "whatsapp-bot"
pm2 monitor
```

### 3. Auto Restart on Crash
```javascript
// Sudah included dalam bot code
restartOnCrash: true
```

## Production Deployment

### Using PM2:
```bash
# Install PM2
npm install pm2 -g

# Start bot with PM2
pm2 start bot.js --name "wa-bot" --max-memory-restart 1000M

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker:
```dockerfile
FROM node:18-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
CMD ["node", "bot.js"]
```

### Using systemd (Linux):
```ini
[Unit]
Description=WhatsApp Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/bot
ExecStart=/usr/bin/node bot.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Monitoring & Logging

### Log Files
Bot akan membuat file log otomatis:
- `error.log` - Error logs
- Console output untuk activity logs

### Health Check Endpoint
Tambahkan health check untuk monitoring:
```javascript
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(3000);
```

## FAQ

**Q: Bot tiba-tiba disconnect?**
A: Normal, WhatsApp Web memiliki session timeout. Bot akan auto-reconnect.

**Q: QR Code tidak muncul?**
A: Set `headless: false` untuk melihat browser window.

**Q: Bot tidak merespon di grup?**
A: Pastikan bot di-mention atau reply pesan bot.

**Q: Cara backup session?**
A: Copy folder session yang dibuat otomatis oleh bot.

**Q: Bot slow atau memory leak?**
A: Restart bot secara berkala atau gunakan PM2 dengan memory limit.

## Support

Jika masih mengalami masalah:
1. Check GitHub issues: [@open-wa/wa-automate](https://github.com/open-wa/wa-automate)
2. Update ke versi terbaru
3. Coba minimal configuration
4. Check system requirements

## Update Guide

```bash
# Update dependencies
npm update

# Check for breaking changes
npm audit

# Test bot in development mode first
NODE_ENV=development node bot.js
```

---

**Note**: Selalu test bot di environment development sebelum deploy ke production.

---

**Made with ❤️ for the developer community**