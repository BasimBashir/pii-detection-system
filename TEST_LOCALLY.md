# Testing PII Detection System Locally

Quick guide to test the TypeScript PII detection system on your local machine.

## Step 1: Setup Environment (2 minutes)

### 1.1 Copy environment file

```bash
copy .env.example .env
```

### 1.2 Add your Gemini API keys

Open `.env` and add your API keys:

```env
GEMINI_API_KEY_1=your-actual-api-key-here
GEMINI_API_KEY_2=your-second-key-optional
```

**Get API keys:** https://aistudio.google.com/app/apikey (free, no credit card needed)

## Step 2: Install & Build (1 minute)

```bash
# Install dependencies (if not already done)
npm install

# Build TypeScript
npm run build
```

## Step 3: Start Server (10 seconds)

```bash
# Development mode (with auto-reload)
npm run dev

# OR production mode
npm start
```

You should see:

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

## Step 4: Test Endpoints

Keep the server running and open a **new terminal** for testing.

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "PII Detection Chat Service",
  "timestamp": "2025-11-26T...",
  "apiKeysConfigured": 2
}
```

### Test 2: Detect PII in Text (Should detect)

```bash
curl -X POST http://localhost:3000/api/test/detect-pii ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Call me at 555-1234\", \"userId\": \"test-user\"}"
```

**Expected response:**
```json
{
  "success": true,
  "detection": {
    "hasPII": true,
    "confidence": 95,
    "detectedItems": [
      {
        "type": "phone",
        "value": "555-1234",
        "severity": "high"
      }
    ],
    "reasoning": "Detected phone number",
    "riskLevel": "high"
  }
}
```

### Test 3: Detect PII in Text (Should NOT detect)

```bash
curl -X POST http://localhost:3000/api/test/detect-pii ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Hello, how are you?\", \"userId\": \"test-user\"}"
```

**Expected response:**
```json
{
  "success": true,
  "detection": {
    "hasPII": false,
    "confidence": 0,
    "detectedItems": [],
    "reasoning": "No PII detected",
    "riskLevel": "low"
  }
}
```

### Test 4: Send Message (with PII)

```bash
curl -X POST http://localhost:3000/api/chat/send-message ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Email me at john@example.com\", \"senderId\": \"user123\", \"receiverId\": \"user456\"}"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "msg_...",
    "flagged": true,
    "timestamp": "2025-11-26T..."
  }
}
```

### Test 5: Send Message (without PII)

```bash
curl -X POST http://localhost:3000/api/chat/send-message ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Hey, what's up?\", \"senderId\": \"user123\", \"receiverId\": \"user456\"}"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "msg_...",
    "flagged": false,
    "timestamp": "2025-11-26T..."
  }
}
```

### Test 6: Check API Stats

```bash
curl http://localhost:3000/api/stats
```

**Expected response:**
```json
{
  "success": true,
  "totalKeys": 2,
  "stats": [
    {
      "keyIndex": 0,
      "keyPreview": "AIzaSyC1...",
      "isCurrent": true,
      "requests": 5,
      "errors": 0,
      "rateLimitHits": 0,
      "lastUsed": "2025-11-26T..."
    }
  ]
}
```

## Test Cases to Try

### Phone Numbers

```bash
# Standard format
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Call me at (555) 123-4567\", \"userId\": \"test\"}"

# Obfuscated
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"My number is 5 5 5 - 1 2 3 4\", \"userId\": \"test\"}"

# Spelled out
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Call me at five five five one two three four\", \"userId\": \"test\"}"
```

### Email Addresses

```bash
# Standard
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Email me at user@domain.com\", \"userId\": \"test\"}"

# Obfuscated
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Contact me at user[at]domain[dot]com\", \"userId\": \"test\"}"

# Spelled
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Email me at user at domain dot com\", \"userId\": \"test\"}"
```

### Social Media

```bash
# Instagram
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Follow me on Instagram @username123\", \"userId\": \"test\"}"

# Multiple platforms
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Find me on insta: john_doe or snap: johndoe\", \"userId\": \"test\"}"
```

### Clean Messages (Should NOT detect)

```bash
curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"Hello! How are you doing today?\", \"userId\": \"test\"}"

curl -X POST http://localhost:3000/api/test/detect-pii -H "Content-Type: application/json" -d "{\"text\": \"I love this app! Great job on the design.\", \"userId\": \"test\"}"
```

## Alternative: Test with Postman

If you prefer a GUI:

1. **Open Postman** (or download from https://www.postman.com/downloads/)

2. **Import Collection:**
   - Click "Import"
   - Create new request
   - Set method to `POST`
   - URL: `http://localhost:3000/api/test/detect-pii`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "text": "Call me at 555-1234",
       "userId": "test-user"
     }
     ```

3. **Click Send** and see the response!

## Troubleshooting

### Server won't start

**Error:** `No valid Gemini API keys found`
- **Solution:** Add valid API keys to `.env` file

**Error:** `Port 3000 already in use`
- **Solution:** Change PORT in `.env` or kill the process using port 3000:
  ```bash
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### TypeScript errors

```bash
# Clean and rebuild
npm run clean
npm run build
```

### API key rate limits

**Error:** `All API keys are rate limited`
- **Solution:** Add more API keys to `.env` or wait 60 seconds

### Types not found

```bash
npm install --save-dev @types/node @types/express
```

## Expected Console Output

When testing, your server console should show:

```
[PII Detection] Service initialized with 2 API keys
[Config] Loaded GEMINI_API_KEY_1
[Config] Loaded GEMINI_API_KEY_2
✓ PII Detection Service initialized

[PII Middleware] Detected PII from user test-user
[PII DETECTED] {
  type: 'text',
  userId: 'test-user',
  riskLevel: 'high',
  timestamp: '2025-11-26T...'
}
```

## Success Criteria

✅ Server starts without errors
✅ Health check returns `"status": "ok"`
✅ PII detection works (detects phone numbers, emails, etc.)
✅ Clean messages are not flagged
✅ API stats show request counts
✅ Multiple API keys rotate automatically

## Next Steps

Once local testing is complete:
1. Share API endpoint with mobile app team
2. They integrate using the endpoints you've tested
3. Monitor `/api/stats` for usage
4. Review flagged messages via `/api/admin/flagged-messages`

---

**All tests passing? You're ready for production!** 🚀
