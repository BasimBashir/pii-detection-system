# PII Detection Service - TypeScript Edition

A production-ready TypeScript implementation of PII (Personally Identifiable Information) detection for chat applications using Google Gemini AI. **All old JavaScript files have been removed** - this is now a **100% TypeScript project**.

## 🚀 Features

- ✅ **Multi-modal Detection**: Detects PII in both text and images
- ✅ **Auto-scaling**: Automatic API key rotation on rate limits
- ✅ **TypeScript**: Full type safety and IntelliSense support
- ✅ **Modular**: Easy to integrate into existing Express/TypeScript servers
- ✅ **Smart Detection**: Detects obfuscated contact info (leetspeak, spelled out, etc.)
- ✅ **Rate Limit Handling**: Automatic failover between multiple API keys
- ✅ **Express Middleware**: Ready-to-use middleware for chat endpoints
- ✅ **Production Ready**: ~25KB, fully typed, battle-tested

---

## 📋 Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Project Structure](#project-structure)
3. [Files to Copy](#files-to-copy)
4. [Integration Examples](#integration-examples)
5. [API Reference](#api-reference)
6. [Configuration Options](#configuration-options)
7. [What Gets Detected](#what-gets-detected)
8. [Advanced Usage](#advanced-usage)
9. [Troubleshooting](#troubleshooting)
10. [Performance & Best Practices](#performance--best-practices)

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Copy Files to Your Project (2 minutes)

Copy these 5 files to your mobile app server:

```
your-mobile-app-server/
└── src/
    └── pii/                          # Create this folder
        ├── types/
        │   └── index.ts              # Copy from src/types/index.ts
        ├── services/
        │   └── PIIDetectionService.ts # Copy from src/services/
        ├── middleware/
        │   └── ChatPIIMiddleware.ts   # Copy from src/middleware/
        └── index.ts                   # Copy from src/index.ts
```

**Total size: ~25KB** (4 files)

### Step 2: Install Dependencies (1 minute)

```bash
npm install @google/generative-ai
npm install --save-dev @types/express @types/node
```

### Step 3: Add API Keys (1 minute)

Add to your `.env`:

```env
GEMINI_API_KEY_1=your-api-key-from-google-ai-studio
GEMINI_API_KEY_2=optional-second-key
GEMINI_API_KEY_3=optional-third-key
```

Get free keys from: **https://aistudio.google.com/app/apikey**

### Step 4: Integrate into Your Server (1 minute)

```typescript
// In your existing server.ts
import { PIIDetectionService, ChatPIIMiddleware } from './pii';

// Initialize
const apiKeys = [
  process.env.GEMINI_API_KEY_1!,
  process.env.GEMINI_API_KEY_2!,
  process.env.GEMINI_API_KEY_3!
].filter(k => k && k.length > 20);

const piiService = new PIIDetectionService(apiKeys, {
  model: 'gemini-2.5-flash',
  enableLogging: true
});

const piiMiddleware = new ChatPIIMiddleware(piiService);

// Add to your existing chat route
app.post('/api/chat/send',
  piiMiddleware.checkTextMessage,  // ← Add this line
  async (req, res) => {
    const { message, senderId, flagged, detection } = req.body;

    if (flagged) {
      console.log('⚠️ PII detected!', detection);
      // Handle accordingly (save to admin panel, etc.)
    }

    // Your existing logic...
    res.json({ success: true });
  }
);
```

### That's it! You're done! ✨

---

## 📁 Project Structure

```
pii-detection-system/
│
├── src/                                    # TypeScript source code
│   ├── types/
│   │   └── index.ts                       # All type definitions
│   │
│   ├── services/
│   │   └── PIIDetectionService.ts         # Core PII detection logic
│   │
│   ├── middleware/
│   │   └── ChatPIIMiddleware.ts           # Express middleware
│   │
│   ├── index.ts                           # Main export (import everything)
│   └── server.ts                          # Example standalone server
│
├── Configuration
│   ├── package.json                       # Dependencies & scripts
│   ├── tsconfig.json                      # TypeScript configuration
│   ├── .env.example                       # Environment variables template
│   └── .gitignore                         # Git ignore rules
│
├── Testing Tools
│   ├── test-all.bat                       # Automated test script (Windows)
│   ├── test-ui.html                       # Interactive web test UI
│   └── TEST_LOCALLY.md                    # Local testing guide
│
└── Documentation
    ├── README.md                          # This file
    ├── DEPLOYMENT.md                      # Deployment guide
    └── EXAMPLE_INTEGRATION.ts             # Complete before/after example
```

### Old JavaScript Files Removed ✅

- ❌ `server.js` → ✅ `src/server.ts`
- ❌ `pii-detection-service.js` → ✅ `src/services/PIIDetectionService.ts`
- ❌ `chat-pii-middleware.js` → ✅ `src/middleware/ChatPIIMiddleware.ts`
- ❌ `test-detection.js`, `validate-setup.js` (removed)

---

## 📦 Files to Copy

### Essential Files (Must Copy)

Copy these 4 files to your project:

```
src/
├── types/index.ts                  ← Type definitions (3KB)
├── services/PIIDetectionService.ts ← Core service (15KB)
├── middleware/ChatPIIMiddleware.ts ← Express middleware (7KB)
└── index.ts                        ← Main export (0.2KB)

Total: ~25KB
```

### Copy Commands (Windows)

```bash
# Create directory structure
mkdir src\pii\types src\pii\services src\pii\middleware

# Copy files
copy pii-detection-system\src\types\index.ts src\pii\types\
copy pii-detection-system\src\services\PIIDetectionService.ts src\pii\services\
copy pii-detection-system\src\middleware\ChatPIIMiddleware.ts src\pii\middleware\
copy pii-detection-system\src\index.ts src\pii\
```

### After Copying

Your project structure:

```
your-mobile-app-server/
├── src/
│   ├── pii/                    # PII detection module
│   │   ├── types/index.ts
│   │   ├── services/PIIDetectionService.ts
│   │   ├── middleware/ChatPIIMiddleware.ts
│   │   └── index.ts
│   │
│   ├── controllers/            # Your existing code
│   ├── models/                 # Your existing code
│   ├── routes/                 # Your existing code
│   └── server.ts               # Your main server (updated)
│
├── .env                        # Add Gemini API keys here
├── package.json                # Add dependencies
└── tsconfig.json               # Your existing config
```

---

## 💡 Integration Examples

### Example 1: Basic Text Check

```typescript
const detection = await piiService.detectPIIInText(
  "Call me at 555-1234",
  "user123"
);

console.log(detection.hasPII);      // true
console.log(detection.riskLevel);   // "high"
console.log(detection.confidence);  // 95
```

### Example 2: Express Middleware

**Before (your original code):**

```typescript
app.post('/api/messages', async (req, res) => {
  const { text, userId, recipientId } = req.body;
  await db.messages.create({ text, userId, recipientId });
  res.json({ success: true });
});
```

**After (with PII detection):**

```typescript
app.post('/api/messages',
  piiMiddleware.checkTextMessage,  // ← Add this line
  async (req, res) => {
    const { message, senderId, receiverId, flagged, detection } = req.body;

    // Save message to database
    await db.messages.create({
      text: message,
      userId: senderId,
      recipientId: receiverId,
      flagged,  // ← PII detected flag
      detection: flagged ? detection : null
    });

    if (flagged) {
      // Handle flagged message
      console.log('PII detected:', detection.riskLevel);
    }

    res.json({ success: true });
  }
);
```

### Example 3: Image Detection

```typescript
app.post('/api/chat/send-image',
  upload.single('image'),
  piiMiddleware.checkImageMessage,
  async (req, res) => {
    const { senderId, receiverId, flagged, detection } = req.body;
    const imageFile = req.file;

    if (flagged) {
      console.log('PII in image:', detection);
    }

    res.json({ success: true });
  }
);
```

### Example 4: Client-Side Validation API

```typescript
// Server endpoint for mobile app validation
app.post('/api/check-pii', async (req, res) => {
  const { text, userId } = req.body;
  const detection = await piiService.detectPIIInText(text, userId);

  res.json({
    canSend: !detection.hasPII,
    message: detection.hasPII
      ? 'Message contains personal information and cannot be sent.'
      : 'Message is safe to send.'
  });
});
```

```typescript
// React Native client
async function sendMessage(text: string) {
  const piiCheck = await fetch('https://api.yourapp.com/api/check-pii', {
    method: 'POST',
    body: JSON.stringify({ text, userId: currentUserId })
  }).then(r => r.json());

  if (!piiCheck.canSend) {
    Alert.alert('Cannot Send', piiCheck.message);
    return;
  }

  // Send message
  await sendToServer(text);
}
```

### Example 5: Background Processing

```typescript
// Check messages asynchronously
app.post('/api/messages', async (req, res) => {
  const { text, userId } = req.body;

  // Save message immediately
  const msg = await db.messages.create({ text, userId });

  // Check PII in background
  piiService.detectPIIInText(text, userId)
    .then(detection => {
      if (detection.hasPII) {
        db.messages.update(msg.id, { flagged: true });
      }
    });

  res.json({ success: true, id: msg.id });
});
```

---

## 📖 API Reference

### PIIDetectionService

```typescript
class PIIDetectionService {
  constructor(
    apiKeys: string[],
    config?: PIIDetectionConfig
  );

  detectPIIInText(
    text: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<DetectionResult>;

  detectPIIInImage(
    imageData: ImageData | string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<DetectionResult>;

  getUsageStats(): UsageStatsResponse[];
}
```

### ChatPIIMiddleware

```typescript
class ChatPIIMiddleware {
  constructor(piiService: PIIDetectionService);

  checkTextMessage: RequestHandler;
  checkImageMessage: RequestHandler;

  updateConfig(config: Partial<ChatMiddlewareConfig>): void;
}
```

### Type Definitions

```typescript
interface DetectionResult {
  hasPII: boolean;
  confidence: number;
  detectedItems: DetectedItem[];
  reasoning: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

interface DetectedItem {
  type: 'phone' | 'email' | 'social' | 'messaging' | 'other';
  value?: string;
  severity: 'high' | 'medium' | 'low';
}
```

**All types available in:** `src/types/index.ts`

---

## ⚙️ Configuration Options

### PIIDetectionService Config

```typescript
{
  model: 'gemini-2.5-flash',           // Gemini model to use
  maxRetries: 3,                        // Max retry attempts
  retryDelay: 1000,                     // Delay between retries (ms)
  enableLogging: true,                  // Enable console logs
  databaseUrl: 'postgres://...',        // Database connection (optional)
  adminWebhook: 'https://...'           // Webhook for alerts (optional)
}
```

### ChatPIIMiddleware Config

```typescript
{
  blockOnDetection: false,     // Block messages with PII
  forwardToReceiver: true,     // Forward flagged messages
  saveOriginalMessage: true    // Save original content
}
```

**Update config:**

```typescript
piiMiddleware.updateConfig({
  blockOnDetection: true  // Will return 403 if PII detected
});
```

---

## 🔍 What Gets Detected?

The service detects ALL forms of contact information:

### Phone Numbers
- **Standard**: `555-1234`, `(555) 123-4567`, `+1-555-123-4567`
- **Obfuscated**: `5 5 5-1 2 3 4`, `five five five one two three four`
- **Leetspeak**: `5five5-1234`, `ph0ne: 555one234`
- **Spelled out**: `"my number is five five five twelve thirty four"`
- **With spaces/dots**: `5.5.5.1.2.3.4`, `555 123 4567`

### Email Addresses
- **Standard**: `user@domain.com`, `user.name@company.co.uk`
- **Obfuscated**: `user[at]domain[dot]com`, `user AT domain DOT com`
- **Leetspeak**: `us3r@d0m4in.c0m`
- **Spelled out**: `"email me at user at domain dot com"`
- **Hidden**: `user (at) domain (dot) com`

### Social Media
- **Handles**: `@username`, `insta: username`, `snap: username`
- **Links**: `Find me on [platform] as [username]`

### Messaging Apps
- WhatsApp numbers, Telegram usernames, Discord IDs
- Signal numbers, WeChat IDs

### Other Contact Methods
- Skype IDs, Zoom meeting links
- Physical addresses
- Website URLs meant for contact

### Creative Evasion Techniques
- Unicode confusables (а vs a, е vs e)
- Character insertion (c-o-n-t-a-c-t)
- Emoji encoding
- Coded language or hints
- QR codes (in images)
- Screenshots of messaging apps (in images)

---

## 🚀 Advanced Usage

### Custom Detection Handler

```typescript
class CustomPIIService extends PIIDetectionService {
  async saveToDatabase(detectionData: DetectionData): Promise<void> {
    await db.piiDetections.insert({
      userId: detectionData.userId,
      type: detectionData.type,
      detectedAt: detectionData.timestamp,
      riskLevel: detectionData.detection.riskLevel
    });
  }

  async notifyAdmin(detectionData: DetectionData): Promise<void> {
    await sendSlackAlert({
      channel: '#security-alerts',
      message: `PII detected from user ${detectionData.userId}`
    });
  }
}
```

### Batch Checking

```typescript
async function checkMultipleMessages(messages: string[], userId: string) {
  const results = await Promise.all(
    messages.map(msg => piiService.detectPIIInText(msg, userId))
  );

  return results.map((detection, idx) => ({
    message: messages[idx],
    hasPII: detection.hasPII,
    riskLevel: detection.riskLevel
  }));
}
```

### Real-time Chat with WebSocket

```typescript
app.post('/api/chat/send', chatMiddleware.checkTextMessage, async (req, res) => {
  const { message, senderId, receiverId, flagged, detection } = req.body;

  const msg = await db.messages.create({
    content: message,
    senderId,
    receiverId,
    flagged
  });

  // Notify recipient via WebSocket if message is not flagged
  if (!flagged || chatMiddleware.config.forwardToReceiver) {
    io.to(receiverId).emit('new-message', msg);
  }

  // Alert admin if high risk
  if (flagged && detection.riskLevel === 'critical') {
    await notifyAdmin({ userId: senderId, message, detection });
  }

  res.json({ success: true, messageId: msg.id });
});
```

---

## 🧪 Testing Locally (Before Integration)

### Quick Setup for Testing

**Important:** Test the system standalone before integrating into your mobile app.

#### Step 1: Setup Environment

```bash
# 1. Copy environment file
copy .env.example .env

# 2. Edit .env and add your Gemini API keys
# GEMINI_API_KEY_1=your-actual-api-key-here
# GEMINI_API_KEY_2=your-second-key-optional

# 3. Install dependencies
npm install

# 4. Build TypeScript
npm run build
```

#### Step 2: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev
```

**Expected output:**
```
=====================================
🚀 PII Detection Chat Server Started
=====================================
Port: 3000
API Keys Loaded: 2
Model: gemini-2.5-flash
Mode: development
=====================================
```

### Testing Methods

#### Method 1: Automated Tests (Easiest) ⭐

Run the automated test suite:

```bash
test-all.bat
```

**Expected Results:**
```
[1/6] Testing Health Check...
{"status":"ok","service":"PII Detection Chat Service",...}

[2/6] Testing PII Detection - Phone Number (should detect)...
{"success":true,"detection":{"hasPII":true,"confidence":100,...}}

[3/6] Testing PII Detection - Email (should detect)...
{"success":true,"detection":{"hasPII":true,"confidence":100,...}}

[4/6] Testing PII Detection - Clean Message (should NOT detect)...
{"success":true,"detection":{"hasPII":false,...}}

[5/6] Testing Send Message - With PII (should flag)...
{"success":true,"message":"Message sent successfully","data":{"flagged":true,...}}

[6/6] Testing API Stats...
{"success":true,"totalKeys":2,"stats":[{"requests":4,"errors":0,...}]}
```

✅ **All tests should pass with:**
- Health check returns "ok"
- PII detected in phone/email tests
- Clean messages NOT flagged
- Messages with PII are flagged
- API stats show request counts

#### Method 2: Web UI (Visual Testing) 🎨

1. **Start the server** (npm run dev)

2. **Open test UI**:
   - Double-click `test-ui.html` in your browser
   - OR visit: `file:///C:/path/to/pii-detection-system/test-ui.html`

3. **Test features**:
   - ✅ Health Check - Verify server is running
   - ⚡ Quick Tests - One-click testing for common PII types
   - ✏️ Custom Test - Enter your own messages
   - 💬 Send Message - Test full message flow
   - 📊 API Stats - Monitor usage

**Features:**
- Real-time results with color coding
- JSON response viewer
- Pre-built test cases
- Visual feedback (green = clean, red = PII detected)

#### Method 3: Manual curl Commands

```bash
# Health Check
curl http://localhost:3000/health

# Test PII Detection - Phone Number
curl -X POST http://localhost:3000/api/test/detect-pii ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Call me at 555-1234\", \"userId\": \"test-user\"}"

# Test PII Detection - Email
curl -X POST http://localhost:3000/api/test/detect-pii ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Email me at john@example.com\", \"userId\": \"test-user\"}"

# Test Clean Message (should NOT detect)
curl -X POST http://localhost:3000/api/test/detect-pii ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Hello, how are you?\", \"userId\": \"test-user\"}"

# Send Message with PII
curl -X POST http://localhost:3000/api/chat/send-message ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Contact me at 555-9999\", \"senderId\": \"user123\", \"receiverId\": \"user456\"}"

# Check API Stats
curl http://localhost:3000/api/stats
```

### Test Cases to Try

#### Phone Numbers
```bash
# Standard format
"Call me at (555) 123-4567"

# Obfuscated
"My number is 5 5 5 - 1 2 3 4"

# Spelled out
"Call me at five five five one two three four"

# Leetspeak
"ph0ne: 555-1234"
```

#### Email Addresses
```bash
# Standard
"Email me at user@domain.com"

# Obfuscated
"Contact me at user[at]domain[dot]com"

# Spelled
"Email me at user at domain dot com"
```

#### Social Media
```bash
# Instagram
"Follow me on Instagram @username123"

# Multiple platforms
"Find me on insta: john_doe or snap: johndoe"
```

#### Clean Messages (Should NOT Detect)
```bash
"Hello! How are you doing today?"
"I love this app! Great job on the design."
"Can we meet tomorrow at 3 PM?"
```

### Success Criteria

Your system is working correctly if:

✅ Server starts without errors
✅ Health check returns `"status": "ok"`
✅ Phone numbers are detected with high confidence
✅ Emails are detected with high confidence
✅ Clean messages return `"hasPII": false`
✅ Messages with PII are flagged
✅ API stats show request counts
✅ No false positives on normal conversation

### Testing Documentation

For detailed testing instructions, see:
- **TEST_LOCALLY.md** - Complete testing guide
- **test-all.bat** - Automated test script
- **test-ui.html** - Interactive web interface

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build TypeScript
npm run build

# Type check (no build)
npm run type-check

# Run production build
npm start

# Clean build files
npm run clean
```

---

## 🛠️ Troubleshooting

### Server Won't Start

**Error:** `No valid Gemini API keys found`
- **Solution:** Add valid API keys to `.env` file
- Get keys from: https://aistudio.google.com/app/apikey
- Ensure keys are longer than 20 characters
- Remove placeholder text like "your-api-key-here"

**Error:** `Port 3000 already in use`
- **Solution:** Change PORT in `.env` or kill the process:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F

  # Or change port in .env
  PORT=3001
  ```

### TypeScript Compilation Errors

**Error:** `Unable to compile TypeScript` or `TS6133`, `TS7030`
- **Solution:** The code has been fixed for all TypeScript strict mode errors
- Run `npm run build` to verify
- If errors persist, check `tsconfig.json` settings

**Error:** `Cannot find module 'ts-node'`
- **Solution:**
  ```bash
  npm install --save-dev ts-node typescript
  ```

### "Cannot find module './pii'"
- Check file path and imports
- Ensure TypeScript is compiled: `npm run build`
- Verify files are copied to correct location
- Check that `src/index.ts` exports all modules

### "All API keys are rate limited"
- Add more API keys to `.env`
- Wait 60 seconds for rate limit reset
- Consider upgrading Gemini API tier
- Free tier: 5 requests/minute per key
- Add 3-5 keys for better rate limit handling

### Types not recognized
- Run: `npm install --save-dev @types/node @types/express`
- Check `tsconfig.json` includes `"types": ["node"]`
- Verify all dev dependencies are installed

### Middleware not working
- Check middleware order in Express
- Ensure `express.json()` is used before routes
- Verify API keys are loaded correctly
- Check console logs for middleware execution

### PII not being detected
- Check API keys are valid and active
- Enable logging: `enableLogging: true`
- Test with `/api/test/detect-pii` endpoint
- Verify Gemini API is accessible from your network
- Check internet connection and firewall settings

### Test Failures

**test-all.bat fails:**
- Ensure server is running: `npm run dev`
- Check server is on port 3000
- Verify curl is installed (Windows 10+ has it built-in)

**test-ui.html shows errors:**
- Check browser console for CORS errors
- Ensure server is running
- Use modern browser (Chrome, Firefox, Edge)
- Open browser DevTools (F12) to see detailed errors

---

## ⚡ Performance & Best Practices

### Performance

- **Text Detection**: ~500ms - 2s (depends on Gemini API)
- **Image Detection**: ~1s - 3s
- **Auto Key Rotation**: <10ms
- **Multiple API Keys**: Near-zero downtime

### Best Practices

1. **Multiple API Keys**: Use 3+ Gemini API keys for better rate limit handling
   - Each free key = 5 requests/minute
   - 5 keys = 25 requests/minute = 1,500 messages/hour

2. **Error Handling**: Don't block messages if PII check fails
   ```typescript
   try {
     const detection = await piiService.detectPIIInText(text, userId);
   } catch (error) {
     console.error('PII check failed:', error);
     // Continue without blocking
   }
   ```

3. **Logging**: Enable in development, consider disabling in production

4. **Database**: Save PII detections for audit and review

5. **Admin Review**: Implement admin panel to review flagged messages

6. **User Feedback**: Inform users when messages are blocked/flagged

7. **Privacy**: Don't log actual PII content, only detection metadata

8. **Caching**: Consider caching detection results for duplicate messages

---

## 📦 Dependencies

**Runtime (only 1 dependency):**
- `@google/generative-ai` - Gemini AI SDK

**Development:**
- `typescript` - TypeScript compiler
- `@types/express` - Express types
- `@types/cors` - CORS types
- `@types/multer` - Multer types
- `@types/node` - Node.js types
- `ts-node` - Run TypeScript directly
- `nodemon` - Auto-restart on changes
- `rimraf` - Clean build folder

---

## ✨ Why TypeScript?

- ✅ **Type Safety** - Catch errors at compile time
- ✅ **IntelliSense** - Auto-completion in VS Code
- ✅ **Better Refactoring** - Easier to maintain and update
- ✅ **Self-Documenting** - Types serve as inline documentation
- ✅ **Less Bugs** - TypeScript catches common errors
- ✅ **Modern** - Uses latest TypeScript features
- ✅ **Compatible** - Works with existing TypeScript projects

---

## 📊 Usage Stats

Monitor API usage:

```typescript
const stats = piiService.getUsageStats();
console.log(stats);
// [
//   {
//     keyIndex: 0,
//     keyPreview: "AIzaSyC1...",
//     isCurrent: true,
//     requests: 150,
//     errors: 2,
//     rateLimitHits: 1
//   }
// ]
```

---

## 🔐 Security & Privacy

- PII detection happens server-side
- Original messages can be saved or discarded (configurable)
- Detection metadata is logged (not actual PII content)
- Admin notifications via webhook (optional)
- Database storage for audit trail (optional)

---

## 📄 License

MIT

## 🙏 Credits

Built with:
- **Google Gemini AI** - AI-powered detection
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Node.js** - Runtime environment

---

## 🆘 Support

For issues or questions:
1. Check this README
2. Review `EXAMPLE_INTEGRATION.ts` for complete example
3. Check `src/server.ts` for working example
4. Test with `/api/test/detect-pii` endpoint

---

## 🎉 Ready to Go!

**You now have a production-ready PII detection system!**

- 📁 **Only 4 files** to copy (~25KB)
- ⏱️ **5 minutes** to integrate
- 🔑 **1 runtime dependency**
- ✅ **100% TypeScript**
- 🚀 **Production ready**

**Start integrating:** Copy the 4 files from `src/` and follow the Quick Start guide above!
