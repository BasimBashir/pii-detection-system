# PII Detection System - Team Documentation

> **AI-Powered Contact Information Detection** for preventing users from sharing personal contact information in chat applications. Uses Google Gemini 2.5 Flash with auto-scaling API key rotation.

---

## 📋 Table of Contents

1. [Overview](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#overview)
2. [Quick Setup](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#quick-setup)
3. [Detailed Setup Instructions](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#detailed-setup-instructions)
4. [API Endpoints](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#api-endpoints)
5. [Code Architecture](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#code-architecture)
6. [Integration Guide](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#integration-guide)
7. [Testing](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#testing)
8. [Configuration](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#configuration)
9. [Troubleshooting](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#troubleshooting)
10. [Production Deployment](https://claude.ai/chat/d3083e52-3bad-47a2-bcd8-29ed6c0927f4#production-deployment)

---

## 🎯 Overview

### What This System Does

This PII (Personally Identifiable Information) detection system prevents customers and service providers from exchanging contact information outside your platform. It uses Google's Gemini AI to detect:

**In Text Messages:**

* Phone numbers (all formats, including obfuscated)
* Email addresses (including creative variations)
* Social media handles
* Messaging app usernames
* Creative evasion attempts (leetspeak, spelled-out numbers, etc.)

**In Images:**

* Text in photos (OCR)
* Business cards
* Screenshots of messaging apps
* Handwritten contact information
* QR codes for contact sharing
* Signs/posters with contact details

### How It Works

```
User sends message/image
        ↓
Your Express backend
        ↓
PII Detection Middleware
        ↓
Gemini AI analyzes content
        ↓
If PII detected:
  - Flag the message
  - Save sender info to database
  - Notify admin team
  - Still forward to receiver (configurable)
Else:
  - Forward normally
```

### Key Features

✅ **Multi-modal Detection** - Both text and images

✅ **Auto-scaling** - Unlimited API keys with automatic rotation

✅ **Non-blocking** - Messages forwarded while flagged for review

✅ **Admin Dashboard Ready** - Complete review system

✅ **MVP Ready** - Free tier sufficient for testing

---

## 🚀 Quick Setup

### Prerequisites

* Node.js >= 16.0.0
* npm or yarn
* MongoDB or PostgreSQL (optional for MVP)
* Google account for Gemini API keys

### 5-Minute Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Add your Gemini API keys to .env
# (See "Getting API Keys" section below)

# 4. Validate setup
npm run validate

# 5. Start server
npm start
```

---

## 📖 Detailed Setup Instructions

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd pii-detection-system

# Install all required packages
npm install
```

**Dependencies installed:**

* `@google/generative-ai` - Gemini API client
* `express` - Web server framework
* `cors` - Cross-origin support
* `multer` - File upload handling
* `dotenv` - Environment variable management

### Step 2: Create Environment File

**⚠️ IMPORTANT: You must create `.env` from `.env.example`**

```bash
# Copy the example file
cp .env.example .env
```

Or manually create `.env` file:

```env
PORT=3000
NODE_ENV=development

# ==========================================
# GEMINI API KEYS (REQUIRED)
# ==========================================
# Get from: https://aistudio.google.com/app/apikey

GEMINI_API_KEY_1=your-first-key-here
GEMINI_API_KEY_2=your-second-key-here
GEMINI_API_KEY_3=your-third-key-here
# Add more keys for better scaling

# ==========================================
# DATABASE (OPTIONAL - for production)
# ==========================================
DATABASE_URL=mongodb://localhost:27017/chat-app

# ==========================================
# ADMIN NOTIFICATIONS (OPTIONAL)
# ==========================================
ADMIN_WEBHOOK_URL=https://your-webhook.com/alerts
```

### Step 3: Get Gemini API Keys

**Why Multiple Keys?**

* Each free API key: 5 requests/minute
* 5 keys = 25 requests/minute = 1,500 messages/hour
* System auto-rotates when rate limits hit

**How to Get Keys:**

1. **Visit Google AI Studio**
   ```
   https://aistudio.google.com/app/apikey
   ```
2. **Sign in with Google Account**
3. **Create API Key**
   * Click "Create API Key"
   * Choose "Create API key in new project"
   * Copy the generated key (starts with `AIza`)
4. **Repeat for More Keys**
   * Use different Google accounts
   * Create 3-5 keys for MVP
   * More keys = better rate limit handling
5. **Add to .env File**
   ```env
   GEMINI_API_KEY_1=AIzaSyC_first_real_key_here
   GEMINI_API_KEY_2=AIzaSyD_second_real_key_here
   GEMINI_API_KEY_3=AIzaSyE_third_real_key_here
   ```

### Step 4: Validate Setup

**⚠️ ALWAYS run validation before starting the server!**

```bash
npm run validate
```

**What it checks:**

* ✅ `.env` file exists
* ✅ API keys are valid format
* ✅ Dependencies installed
* ✅ Required files present

**Expected Output:**

```
✅ .env file exists
✅ GEMINI_API_KEY_1 configured (AIzaSyC...)
✅ GEMINI_API_KEY_2 configured (AIzaSyD...)
✅ Found 2 valid API key(s)
✅ All checks passed!

🚀 Ready to start:
   - Start server: npm start
   - Run tests: npm test
```

### Step 5: Start the Server

```bash
# Production mode
npm start

# Development mode (auto-reload on changes)
npm run dev
```

**Expected Output:**

```
[Config] Loaded GEMINI_API_KEY_1
[Config] Loaded GEMINI_API_KEY_2
[PII Detection] Service initialized with 2 valid API key(s)
=====================================
🚀 PII Detection Chat Server Started
=====================================
Port: 3000
API Keys Loaded: 2
Model: gemini-2.5-flash
Mode: development
=====================================
```

### Step 6: Test the System

```bash
# Test text detection
npm test

# Test image detection
npm run test-image

# Check API statistics
curl http://localhost:3000/api/stats
```

---

## 🔌 API Endpoints

### Overview

Your backend now has these endpoints for integration:

| Endpoint                        | Method | Purpose                              |
| ------------------------------- | ------ | ------------------------------------ |
| `/api/chat/send-message`      | POST   | Send text message with PII detection |
| `/api/chat/send-image`        | POST   | Send image with PII detection        |
| `/api/admin/flagged-messages` | GET    | Get all flagged messages             |
| `/api/admin/review-message`   | POST   | Review and take action               |
| `/api/test/detect-pii`        | POST   | Test detection directly              |
| `/api/stats`                  | GET    | View API usage statistics            |
| `/health`                     | GET    | Health check                         |

---

### 1. Send Text Message

**Endpoint:** `POST /api/chat/send-message`

**Purpose:** Send a text message with automatic PII detection

**Request:**

```javascript
// Content-Type: application/json

{
  "message": "Can we meet at the location?",
  "senderId": "customer_123",
  "receiverId": "technician_456",
  "conversationId": "conv_789"
}
```

**Response (Normal Message):**

```javascript
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "msg_1699887654321_abc123",
    "flagged": false,
    "timestamp": "2025-11-03T12:00:00Z"
  }
}
```

**Response (Flagged Message):**

```javascript
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "msg_1699887654321_abc123",
    "flagged": true,
    "timestamp": "2025-11-03T12:00:00Z"
  }
}
```

**Response (Blocked Message - if blocking enabled):**

```javascript
{
  "success": false,
  "error": "Message blocked: Contains contact information",
  "message": "Please avoid sharing personal contact information in chat.",
  "detection": {
    "hasPII": true,
    "riskLevel": "high"
  }
}
```

**Integration Example:**

```javascript
// Your existing chat function
async function sendMessage(message, senderId, receiverId, conversationId) {
  try {
    const response = await axios.post('http://your-server.com/api/chat/send-message', {
      message: message,
      senderId: senderId,
      receiverId: receiverId,
      conversationId: conversationId
    });

    if (response.data.success) {
      // Message sent successfully
      const messageId = response.data.data.messageId;
      const isFlagged = response.data.data.flagged;
    
      if (isFlagged) {
        // Optional: Show warning to user
        showWarning('Your message has been flagged for review');
      }
    
      // Save to your database, update UI, etc.
      return messageId;
    }
  } catch (error) {
    if (error.response?.status === 403) {
      // Message was blocked
      showError(error.response.data.message);
    } else {
      // Other error
      showError('Failed to send message');
    }
  }
}
```

---

### 2. Send Image Message

**Endpoint:** `POST /api/chat/send-image`

**Purpose:** Send an image with automatic PII detection

**Request:**

```javascript
// Content-Type: multipart/form-data

const formData = new FormData();
formData.append('image', imageFile);  // File object
formData.append('senderId', 'customer_123');
formData.append('receiverId', 'technician_456');
formData.append('conversationId', 'conv_789');
```

**Response (Normal Image):**

```javascript
{
  "success": true,
  "message": "Image sent successfully",
  "data": {
    "messageId": "msg_1699887654321_abc123",
    "imageUrl": "https://your-storage.com/images/img_123.jpg",
    "flagged": false,
    "timestamp": "2025-11-03T12:00:00Z"
  }
}
```

**Response (Flagged Image):**

```javascript
{
  "success": true,
  "message": "Image sent successfully",
  "data": {
    "messageId": "msg_1699887654321_abc123",
    "imageUrl": "https://your-storage.com/images/img_123.jpg",
    "flagged": true,
    "timestamp": "2025-11-03T12:00:00Z"
  }
}
```

**Integration Example (React Native):**

```javascript
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

async function sendImageMessage(senderId, receiverId, conversationId) {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true
  });

  if (!result.canceled) {
    // Create FormData
    const formData = new FormData();
    formData.append('image', {
      uri: result.assets[0].uri,
      type: result.assets[0].mimeType || 'image/jpeg',
      name: `image_${Date.now()}.jpg`
    });
    formData.append('senderId', senderId);
    formData.append('receiverId', receiverId);
    formData.append('conversationId', conversationId);

    try {
      const response = await axios.post(
        'http://your-server.com/api/chat/send-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const messageId = response.data.data.messageId;
        const imageUrl = response.data.data.imageUrl;
        const isFlagged = response.data.data.flagged;

        if (isFlagged) {
          Alert.alert(
            'Image Flagged',
            'Your image has been flagged as it may contain contact information.'
          );
        }

        // Update UI, save to local state, etc.
        return { messageId, imageUrl };
      }
    } catch (error) {
      if (error.response?.status === 403) {
        Alert.alert('Image Blocked', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to send image');
      }
    }
  }
}
```

**Integration Example (React.js Web):**

```javascript
async function sendImageMessage(imageFile, senderId, receiverId, conversationId) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('senderId', senderId);
  formData.append('receiverId', receiverId);
  formData.append('conversationId', conversationId);

  try {
    const response = await fetch('http://your-server.com/api/chat/send-image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      if (data.data.flagged) {
        showToast('⚠️ Image flagged for review');
      }
      return data.data;
    }
  } catch (error) {
    console.error('Failed to send image:', error);
    throw error;
  }
}
```

---

### 3. Get Flagged Messages (Admin)

**Endpoint:** `GET /api/admin/flagged-messages`

**Purpose:** Retrieve all flagged messages for admin review

**Query Parameters:**

```
?filter=all|pending|reviewed
```

**Response:**

```javascript
{
  "success": true,
  "data": {
    "flaggedMessages": [
      {
        "id": "msg_123",
        "type": "text",
        "senderId": "customer_123",
        "receiverId": "technician_456",
        "content": "Call me at 555-1234",
        "timestamp": "2025-11-03T12:00:00Z",
        "reviewStatus": "pending",
        "detection": {
          "hasPII": true,
          "confidence": 95,
          "riskLevel": "high",
          "detectedItems": [
            {
              "type": "phone",
              "value": "555-1234",
              "severity": "high"
            }
          ]
        }
      }
    ],
    "totalCount": 15
  }
}
```

---

### 4. Review Message (Admin)

**Endpoint:** `POST /api/admin/review-message`

**Purpose:** Take action on flagged message

**Request:**

```javascript
{
  "messageId": "msg_123",
  "action": "approve|warn_user|delete_message|block_user",
  "adminNotes": "False positive - street address"
}
```

**Response:**

```javascript
{
  "success": true,
  "message": "Message reviewed successfully"
}
```

---

### 5. Test Detection (Development)

**Endpoint:** `POST /api/test/detect-pii`

**Purpose:** Directly test PII detection without saving

**Request:**

```javascript
{
  "text": "Call me at 555-1234",
  "userId": "test-user"
}
```

**Response:**

```javascript
{
  "success": true,
  "detection": {
    "hasPII": true,
    "confidence": 95,
    "riskLevel": "high",
    "detectedItems": [
      {
        "type": "phone",
        "value": "555-1234",
        "obfuscationType": "none",
        "location": "End of message",
        "severity": "high"
      }
    ],
    "reasoning": "Message contains a phone number in standard format"
  }
}
```

---

### 6. API Usage Statistics

**Endpoint:** `GET /api/stats`

**Purpose:** View API key usage and performance metrics

**Response:**

```javascript
{
  "success": true,
  "totalKeys": 3,
  "stats": [
    {
      "keyName": "GEMINI_API_KEY_1",
      "keyIndex": 0,
      "keyPreview": "AIzaSyC...",
      "isCurrent": true,
      "keyNumber": 1,
      "requests": 145,
      "errors": 2,
      "lastUsed": "2025-11-03T12:00:00Z",
      "rateLimitHits": 5
    },
    {
      "keyName": "GEMINI_API_KEY_2",
      "keyIndex": 1,
      "keyPreview": "AIzaSyD...",
      "isCurrent": false,
      "keyNumber": 2,
      "requests": 98,
      "errors": 1,
      "lastUsed": "2025-11-03T11:55:00Z",
      "rateLimitHits": 3
    }
  ]
}
```

---

### 7. Health Check

**Endpoint:** `GET /health`

**Purpose:** Check if server is running

**Response:**

```javascript
{
  "status": "ok",
  "service": "PII Detection Chat Service",
  "timestamp": "2025-11-03T12:00:00Z",
  "apiKeysConfigured": 3
}
```

---

## 🏗️ Code Architecture

### Project Structure

```
pii-detection-system/
├── server.js                    # Express server (main entry)
├── pii-detection-service.js     # Core AI detection logic
├── chat-pii-middleware.js       # Express middleware
├── test-detection.js            # Text detection tests
├── validate-setup.js            # Setup validation script
├── package.json                 # Dependencies
├── .env                         # Environment config (create this!)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
│
├── README.md                    # This file
├── DEPLOYMENT.md                # AWS deployment help (MLOPS)
```

---

### Core Components Explained

#### 1. **pii-detection-service.js**

**Purpose:** Core AI detection engine using Google Gemini API

**Key Methods:**

```javascript
class PIIDetectionService {
  constructor(apiKeys, config)
  // Initialize service with API keys and configuration
  
  async detectPIIInText(text, userId, metadata)
  // Analyze text for contact information
  // Returns: { hasPII, confidence, detectedItems, riskLevel }
  
  async detectPIIInImage(imageData, userId, metadata)
  // Analyze image for contact information
  // Returns: { hasPII, confidence, detectedItems, riskLevel }
  
  rotateAPIKey()
  // Switch to next available API key on rate limit
  
  getUsageStats()
  // Get statistics for all API keys
}
```

**How it Works:**

1. **Initialization:**
   ```javascript
   const piiService = new PIIDetectionService([key1, key2, key3], {
     model: 'gemini-2.0-flash-exp',
     maxRetries: 3,
     enableLogging: true
   });
   ```
2. **Text Detection:**
   * Takes text input
   * Builds comprehensive prompt with detection rules
   * Sends to Gemini AI
   * Parses JSON response
   * Returns detection result
3. **Image Detection:**
   * Takes base64 image data
   * Builds image analysis prompt
   * Sends image + prompt to Gemini Vision AI
   * Extracts text from image (OCR)
   * Detects contact information
   * Returns detection result
4. **Auto-Scaling:**
   * Tracks usage per API key
   * Detects rate limit errors (429)
   * Automatically rotates to next available key
   * Logs all rotations for monitoring

**Detection Prompt Engineering:**

The service uses advanced prompt engineering to catch:

* Standard formats (555-1234, user@email.com)
* Obfuscated formats (5 5 5-1234, user[at]email[dot]com)
* Leetspeak (5five5-1234, em4il@d0m4in.c0m)
* Spelled out ("five five five one two three four")
* Creative evasion ("DM me", "text me", emojis)
* Context clues ("share your contact privately")

---

#### 2. **chat-pii-middleware.js**

**Purpose:** Express middleware for seamless integration

**Key Methods:**

```javascript
class ChatPIIMiddleware {
  constructor(piiService)
  // Initialize with PII detection service
  
  checkTextMessage(req, res, next)
  // Middleware for text message endpoint
  // Checks req.body.message for PII
  
  checkImageMessage(req, res, next)
  // Middleware for image upload endpoint
  // Checks uploaded image for PII
  
  updateConfig(newConfig)
  // Update middleware configuration
}
```

**How it Works:**

1. **Text Middleware:**
   ```javascript
   app.post('/api/chat/send-message',
     chatMiddleware.checkTextMessage,  // <- Middleware
     (req, res) => {
       // req.body.flagged - true if PII detected
       // req.body.detection - full detection details
       // req.piiDetection - raw detection object
     }
   );
   ```
2. **Image Middleware:**
   ```javascript
   app.post('/api/chat/send-image',
     upload.single('image'),            // <- Multer first
     chatMiddleware.checkImageMessage,  // <- Then PII check
     (req, res) => {
       // req.body.flagged - true if PII detected
       // req.file - uploaded file info
     }
   );
   ```
3. **Configuration:**
   ```javascript
   chatMiddleware.updateConfig({
     blockOnDetection: false,   // false = flag, true = block
     forwardToReceiver: true,   // forward even if flagged
     saveOriginalMessage: true  // save for admin review
   });
   ```

**Middleware Flow:**

```
Request arrives
     ↓
Middleware executes
     ↓
Calls piiService.detectPII*()
     ↓
Gets detection result
     ↓
Adds to req.body:
  - flagged: true/false
  - flagReason: 'PII_DETECTED'
  - detection: {...}
     ↓
If blockOnDetection = true and PII found:
  - Return 403 error
  - Don't call next()
Else:
  - Call next()
  - Continue to route handler
```

---

#### 3. **server.js**

**Purpose:** Express.js backend server with all endpoints

**Key Sections:**

1. **Configuration Loading:**
   ```javascript
   // Load API keys from environment
   function loadAPIKeys() {
     // Reads GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
     // Filters out placeholders
     // Returns array of valid keys
   }
   ```
2. **Service Initialization:**
   ```javascript
   const piiService = new PIIDetectionService(apiKeys, config);
   const chatMiddleware = new ChatPIIMiddleware(piiService);
   ```
3. **Route Handlers:**
   * `/api/chat/send-message` - Text messages
   * `/api/chat/send-image` - Image messages
   * `/api/admin/*` - Admin endpoints
   * `/api/test/*` - Testing endpoints
4. **Error Handling:**
   ```javascript
   // Global error handler
   app.use((err, req, res, next) => {
     console.error('[Server Error]', err);
     res.status(err.status || 500).json({
       success: false,
       error: err.message
     });
   });
   ```

---

#### 4. **Integration Components**

##### ChatScreen.jsx (React Native)

**What it does:**

* Chat UI for mobile app
* Image picker integration
* Sends messages to backend
* Handles flagged responses
* Shows user warnings

**Key Features:**

```javascript
// Send text message
const sendTextMessage = async () => {
  const response = await axios.post(API_URL + '/send-message', {
    message: inputText,
    senderId: userId,
    receiverId: receiverId
  });
  
  if (response.data.data.flagged) {
    Alert.alert('Message Flagged', '...');
  }
};

// Send image
const pickAndSendImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({...});
  
  const formData = new FormData();
  formData.append('image', {...});
  
  const response = await axios.post(API_URL + '/send-image', formData);
};
```

##### AdminDashboard.jsx (React.js)

**What it does:**

* Admin panel for reviewing flagged content
* Statistics display
* Message review interface
* Action buttons (approve/block/delete)

**Key Features:**

```javascript
// Load flagged messages
const loadFlaggedMessages = async () => {
  const response = await axios.get(API_URL + '/admin/flagged-messages');
  setFlaggedMessages(response.data.data.flaggedMessages);
};

// Review message
const handleReview = async (messageId, action, notes) => {
  await axios.post(API_URL + '/admin/review-message', {
    messageId, action, adminNotes: notes
  });
};
```

---

## 🔗 Integration Guide

### Step 1: Update Backend URLs

In your frontend code, update the API base URL:

```javascript
// For React Native (ChatScreen.jsx)
const API_BASE_URL = 'http://your-server.com/api';  // Replace this!

// For React.js Admin (AdminDashboard.jsx)
const API_BASE_URL = 'http://your-server.com/api';  // Replace this!
```

**Development:**

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Production:**

```javascript
const API_BASE_URL = 'https://api.yourapp.com/api';
```

---

### Step 2: Replace Existing Chat Endpoints

**Before (Your old code):**

```javascript
app.post('/api/chat/send-message', async (req, res) => {
  // Your existing message handling
  const { message, senderId, receiverId } = req.body;
  
  // Save to database
  await db.messages.insert({...});
  
  res.json({ success: true });
});
```

**After (With PII detection):**

```javascript
app.post('/api/chat/send-message',
  chatMiddleware.checkTextMessage,  // Add this middleware
  async (req, res) => {
    const { message, senderId, receiverId, flagged, detection } = req.body;
  
    // Save to database
    const messageData = {
      message,
      senderId,
      receiverId,
      flagged: flagged || false,
      detection: detection || null,
      timestamp: new Date()
    };
  
    await db.messages.insert(messageData);
  
    // If flagged, save to admin review queue
    if (flagged) {
      await db.flaggedMessages.insert({
        ...messageData,
        reviewStatus: 'pending',
        flaggedAt: new Date()
      });
    }
  
    res.json({
      success: true,
      data: {
        messageId: messageData.id,
        flagged: flagged
      }
    });
  }
);
```

---

### Step 3: Add Image Endpoint

**If you don't have image support yet:**

```javascript
const multer = require('multer');

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// Image upload endpoint
app.post('/api/chat/send-image',
  upload.single('image'),
  chatMiddleware.checkImageMessage,
  async (req, res) => {
    const { senderId, receiverId, flagged, detection } = req.body;
    const imageFile = req.file;
  
    // Upload to your storage (S3, Cloudinary, etc.)
    const imageUrl = await uploadToStorage(imageFile.buffer);
  
    // Save to database
    const messageData = {
      type: 'image',
      imageUrl,
      senderId,
      receiverId,
      flagged: flagged || false,
      detection: detection || null,
      timestamp: new Date()
    };
  
    await db.messages.insert(messageData);
  
    if (flagged) {
      await db.flaggedMessages.insert({
        ...messageData,
        reviewStatus: 'pending'
      });
    }
  
    res.json({
      success: true,
      data: {
        messageId: messageData.id,
        imageUrl: imageUrl,
        flagged: flagged
      }
    });
  }
);
```

---

### Step 4: Update Frontend to Handle Flags

**React Native - Add Warning Alert:**

```javascript
// In your sendMessage function
if (response.data.data.flagged) {
  Alert.alert(
    'Message Flagged',
    'Your message has been flagged for review as it may contain contact information.',
    [{ text: 'OK' }]
  );
}
```

**React.js - Add Toast Notification:**

```javascript
// In your sendMessage function
if (response.data.data.flagged) {
  toast.warning('⚠️ Message flagged for review');
}
```

---

### Step 5: Add Admin Dashboard (Optional)

1. **Copy admin components:**
   ```bash
   cp AdminDashboard.jsx src/components/
   cp AdminDashboard.css src/components/
   ```
2. **Add route:**
   ```javascript
   import AdminDashboard from './components/AdminDashboard';

   <Route path="/admin" component={AdminDashboard} />
   ```
3. **Update API URL in AdminDashboard.jsx:**
   ```javascript
   const API_BASE_URL = 'http://your-server.com/api';
   ```

---

## 🧪 Testing

### 1. Validate Setup

**Always run before starting:**

```bash
npm run validate
```

This checks:

* ✅ .env file exists
* ✅ API keys valid
* ✅ Dependencies installed
* ✅ Files present

---

### 2. Test Text Detection

```bash
# Run full test suite (25+ test cases)
npm test
```

**Expected output:**

```
🧪 PII DETECTION TEST SUITE
============================================================

📝 Test 1/25: Standard Phone Number
   Input: "Call me at 555-123-4567"
   Expected: DETECT PII
   ✅ PASSED
   📊 Confidence: 95%
   ⚠️  Risk Level: high
   🔍 Items: 1
      1. phone: 555-123-4567
...

📊 TEST SUMMARY
Total Tests: 25
✅ Passed: 23
❌ Failed: 2
Success Rate: 92.00%
```

---

### 3. Test Image Detection

```bash
# Run image detection demo
npm run test-image
```

**Or test with your own image:**

```bash
# 1. Place test image
cp /path/to/business-card.jpg ./test-image.jpg

# 2. Run test
node test-image-detection.js
```

---

### 4. Test via API

**Text detection:**

```bash
curl -X POST http://localhost:3000/api/test/detect-pii \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Call me at 555-1234",
    "userId": "test-user"
  }'
```

**Image detection:**

```bash
curl -X POST http://localhost:3000/api/chat/send-image \
  -F "image=@./test-image.jpg" \
  -F "senderId=test-user" \
  -F "receiverId=receiver-id" \
  -F "conversationId=conv-123"
```

**Check statistics:**

```bash
curl http://localhost:3000/api/stats
```

---

### 5. Test Cases Included

The test suite covers:

**Text Detection:**

* ✅ Standard formats (555-1234, user@email.com)
* ✅ Obfuscated (5 5 5-1234, user[at]email[dot]com)
* ✅ Leetspeak (5five5-1234, em4il@d0m4in.c0m)
* ✅ Spelled out (five five five one two three four)
* ✅ Social media (@username, insta: john)
* ✅ Messaging apps (WhatsApp: 555-1234)
* ✅ Creative evasion (DM me, text me)
* ✅ Safe messages (should NOT detect)

**Image Detection:**

* ✅ Business cards
* ✅ Screenshots
* ✅ Handwritten notes
* ✅ QR codes
* ✅ Signs/posters
* ✅ Safe images (no PII)

---

## ⚙️ Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development|production

# Gemini API Keys (REQUIRED)
GEMINI_API_KEY_1=your-key-1
GEMINI_API_KEY_2=your-key-2
GEMINI_API_KEY_3=your-key-3
# Add as many as needed

# Database (Optional - for saving flagged messages)
DATABASE_URL=mongodb://localhost:27017/chat-app
# Or PostgreSQL:
# DATABASE_URL=postgresql://user:pass@localhost:5432/chat-app

# Admin Webhooks (Optional - for notifications)
ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

### Middleware Configuration

```javascript
// In server.js, after initializing middleware

chatMiddleware.updateConfig({
  // Block messages vs flag only
  blockOnDetection: false,     // false = flag + forward (recommended)
                               // true = block completely
  
  // Forward to receiver even if flagged
  forwardToReceiver: true,     // true = forward anyway (recommended)
                               // false = hold for admin review
  
  // Save original message content
  saveOriginalMessage: true    // true = save for review
                               // false = discard
});
```

**Recommended Settings:**

**For MVP/Testing:**

```javascript
{
  blockOnDetection: false,   // Don't block, just flag
  forwardToReceiver: true,   // Forward normally
  saveOriginalMessage: true  // Save for review
}
```

**For Production (Strict):**

```javascript
{
  blockOnDetection: true,    // Block messages with PII
  forwardToReceiver: false,  // Don't forward flagged messages
  saveOriginalMessage: true  // Save for evidence
}
```

---

### Service Configuration

```javascript
// In server.js, when initializing PIIDetectionService

const piiService = new PIIDetectionService(apiKeys, {
  // AI Model to use
  model: 'gemini-2.0-flash-exp',  // Fastest, best for MVP
  
  // Retry configuration
  maxRetries: 3,                   // Retry attempts on error
  retryDelay: 1000,                // Initial delay (ms)
  
  // Logging
  enableLogging: true,             // Console logs
  
  // Database (optional)
  databaseUrl: process.env.DATABASE_URL,
  
  // Webhooks (optional)
  adminWebhook: process.env.ADMIN_WEBHOOK_URL
});
```

---

### Rate Limits

| Tier           | Per Key      | Combined (5 keys) | Good For    |
| -------------- | ------------ | ----------------- | ----------- |
| **Free** | 5 req/min    | 25 req/min        | MVP Testing |
|                |              | 1,500 msg/hour    |             |
| **Paid** | 1000 req/min | 5000 req/min      | Production  |
|                |              | 300,000 msg/hour  |             |

**Cost (Paid Tier):**

* $0.075 per 1M input tokens
* ~$0.00001 per message
* ~$0.01 per 1,000 messages

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "No valid API keys found"

**Problem:** `.env` file missing or has placeholder keys

**Solution:**

```bash
# Check .env exists
ls -la .env

# Check contents
cat .env

# If missing, create from example
cp .env.example .env

# Add real API keys from:
# https://aistudio.google.com/app/apikey
```

---

#### 2. "API key not valid"

**Problem:** API key is expired, revoked, or incorrect format

**Solution:**

```bash
# 1. Visit Google AI Studio
# https://aistudio.google.com/app/apikey

# 2. Check if your keys are listed and active

# 3. Create new keys if needed

# 4. Update .env with new keys
GEMINI_API_KEY_1=AIzaSy_new_key_here

# 5. Restart server
npm start
```

---

#### 3. "Switched from key 0 to key 0"

**Problem:** Only 1 API key configured

**Solution:**

```bash
# Add more keys to .env
GEMINI_API_KEY_2=your-second-key
GEMINI_API_KEY_3=your-third-key

# Restart server
npm start
```

**Note:** This warning won't break functionality, but limits scalability.

---

#### 4. "All API keys are rate limited"

**Problem:** Hit rate limits on all configured keys

**Solutions:**

**Short-term:**

```bash
# Wait 60 seconds for reset
sleep 60

# Retry request
```

**Long-term:**

```bash
# Add more API keys
GEMINI_API_KEY_4=another-key
GEMINI_API_KEY_5=another-key

# Or upgrade to paid tier:
# https://ai.google.dev/gemini-api/docs/pricing
```

---

#### 5. Image upload fails

**Problem:** Image too large or wrong format

**Solution:**

```javascript
// Check image size
console.log('Image size:', imageFile.size / 1024 / 1024, 'MB');

// Resize before upload (React Native)
import * as ImageManipulator from 'expo-image-manipulator';

const resized = await ImageManipulator.manipulateAsync(
  image.uri,
  [{ resize: { width: 1280 } }],
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);
```

**Supported formats:**

* ✅ JPEG/JPG
* ✅ PNG
* ✅ WEBP
* ✅ GIF
* ✅ BMP
* ✅ HEIC

**Max size:** 10MB (configured in server.js)

---

#### 6. Detection not working

**Problem:** AI not detecting obvious PII

**Check:**

1. **API keys valid:**
   ```bash
   npm run validate
   ```
2. **Model correct:**
   ```javascript
   // In server.js
   model: 'gemini-2.0-flash-exp'  // Check this
   ```
3. **Test directly:**
   ```bash
   curl -X POST http://localhost:3000/api/test/detect-pii \
     -H "Content-Type: application/json" \
     -d '{"text": "Call 555-1234", "userId": "test"}'
   ```
4. **Check logs:**
   ```bash
   # Look for errors in console
   [PII Detection Error] ...
   ```

---

#### 7. Server won't start

**Problem:** Port in use or missing dependencies

**Solutions:**

```bash
# Check if port 3000 in use
lsof -i :3000

# Kill process using port
kill -9 <PID>

# Or use different port
PORT=3001 npm start

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm start
```

---

### Debug Mode

Enable detailed logging:

```javascript
// In server.js
const piiService = new PIIDetectionService(apiKeys, {
  enableLogging: true,  // Enable console logs
  ...
});
```

**Logs to watch:**

```
[Config] Loaded GEMINI_API_KEY_1
[PII Detection] Service initialized with N keys
[API Call] Using GEMINI_API_KEY_1 (Attempt 1/3)
[Rate Limit] GEMINI_API_KEY_1 hit rate limit
[API Key Rotation] Switched from KEY_1 to KEY_2
[PII DETECTED] { userId: ..., riskLevel: ... }
```

---

### Get Help

1. **Run validation:**
   ```bash
   npm run validate
   ```
2. **Check setup guide:**
   ```bash
   cat SETUP_GUIDE.md
   ```
3. **Test components:**
   ```bash
   npm test
   npm run test-image
   ```
4. **Check API stats:**
   ```bash
   curl http://localhost:3000/api/stats
   ```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

* [ ] **API Keys:** Upgrade to paid tier for production
* [ ] **Environment:** Set `NODE_ENV=production`
* [ ] **Database:** Configure MongoDB/PostgreSQL
* [ ] **Storage:** Set up S3/Cloudinary for images
* [ ] **Monitoring:** Add error tracking (Sentry, etc.)
* [ ] **Rate Limits:** Configure based on traffic
* [ ] **Webhooks:** Set up admin notifications
* [ ] **SSL/TLS:** Enable HTTPS
* [ ] **Load Testing:** Test with expected traffic
* [ ] **Backup:** Database backup strategy

---

### AWS Deployment

See `DEPLOYMENT.md` for complete AWS deployment guide.

**Quick Deploy to AWS Elastic Beanstalk:**

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js pii-detection-service

# Create environment
eb create production-env

# Set environment variables
eb setenv \
  GEMINI_API_KEY_1=your-key-1 \
  GEMINI_API_KEY_2=your-key-2 \
  DATABASE_URL=your-mongodb-url

# Deploy
eb deploy

# Open application
eb open
```

---

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000

# Paid tier API keys (multiple for redundancy)
GEMINI_API_KEY_1=your-production-key-1
GEMINI_API_KEY_2=your-production-key-2
GEMINI_API_KEY_3=your-production-key-3

# Production database
DATABASE_URL=mongodb://user:pass@production-cluster.mongodb.net/chatapp

# Admin notifications
ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Optional: Error tracking
SENTRY_DSN=https://your-sentry-dsn
```

---

### Monitoring

**Key Metrics to Monitor:**

1. **API Usage:**
   ```bash
   # Check via endpoint
   curl https://api.yourapp.com/api/stats
   ```
2. **Detection Rate:**
   * How many messages flagged
   * False positive rate
   * False negative rate
3. **Response Times:**
   * Text detection: target < 2 seconds
   * Image detection: target < 5 seconds
4. **Error Rates:**
   * API key errors
   * Rate limit hits
   * Service failures

**Set Up Alerts:**

* Rate limit hits > 10/hour
* Error rate > 1%
* Response time > 10 seconds

---

## 📚 Additional Resources

### Documentation

* **Main README:** Complete system overview
* **SETUP_GUIDE.md:** Detailed setup with troubleshooting
* **IMAGE_DETECTION_GUIDE.md:** Image detection specifics
* **DEPLOYMENT.md:** AWS deployment guide
* **FIXES_SUMMARY.md:** Bug fixes and improvements

### External Links

* **Get API Keys:** https://aistudio.google.com/app/apikey
* **Gemini Docs:** https://ai.google.dev/gemini-api/docs
* **Rate Limits:** https://ai.google.dev/gemini-api/docs/rate-limits
* **Pricing:** https://ai.google.dev/gemini-api/docs/pricing

---

## 🎉 Quick Reference

### Commands

```bash
# Setup
cp .env.example .env         # Create environment file
npm install                  # Install dependencies
npm run validate             # Validate setup

# Running
npm start                    # Start production server
npm run dev                  # Start with auto-reload

# Testing
npm test                     # Test text detection
npm run test-image           # Test image detection

# Monitoring
curl localhost:3000/health   # Health check
curl localhost:3000/api/stats # Usage statistics
```

---

### API Endpoints Quick Reference

| Endpoint                        | Method | Purpose                   |
| ------------------------------- | ------ | ------------------------- |
| `/api/chat/send-message`      | POST   | Send text with PII check  |
| `/api/chat/send-image`        | POST   | Send image with PII check |
| `/api/admin/flagged-messages` | GET    | Get flagged messages      |
| `/api/test/detect-pii`        | POST   | Test detection            |
| `/api/stats`                  | GET    | View statistics           |

---

### Configuration Quick Reference

```javascript
// Middleware
chatMiddleware.updateConfig({
  blockOnDetection: false,    // false = flag only
  forwardToReceiver: true,    // true = forward anyway
  saveOriginalMessage: true   // true = save for review
});

// Service
const piiService = new PIIDetectionService(keys, {
  model: 'gemini-2.0-flash-exp',
  maxRetries: 3,
  enableLogging: true
});
```

---

## 💡 Best Practices

### For MVP Testing

1. **Start with 3-5 free API keys**
2. **Use flag-only mode** (don't block messages)
3. **Monitor false positives** via admin dashboard
4. **Test with real user scenarios**
5. **Check `/api/stats` regularly**

### For Production

1. **Upgrade to paid tier** ($0.075 per 1M tokens)
2. **Use 3-5 paid keys** for redundancy
3. **Enable database storage** for flagged messages
4. **Set up admin webhooks** for real-time alerts
5. **Implement monitoring** and error tracking
6. **Regular key rotation** (every 3-6 months)
7. **Load testing** before launch
8. **Have rollback plan** ready

---

## 📞 Support

### Team Support

* **Technical Lead:** [Your name]
* **Slack Channel:** #pii-detection
* **Email:** tech-team@yourcompany.com

### Quick Help

1. **Run validation:** `npm run validate`
2. **Check logs:** Look for `[PII Detection Error]`
3. **Test directly:** `npm test`
4. **Review docs:** `SETUP_GUIDE.md`

---

## ✅ Team Checklist

### Initial Setup

* [ ] Clone repository
* [ ] Run `npm install`
* [ ] Copy `.env.example` to `.env`
* [ ] Get Gemini API keys from Google
* [ ] Add keys to `.env`
* [ ] Run `npm run validate`
* [ ] Start server with `npm start`
* [ ] Run tests: `npm test` and `npm run test-image`

### Integration

* [ ] Update API_BASE_URL in frontend
* [ ] Add middleware to existing routes
* [ ] Update message sending functions
* [ ] Add image upload endpoint
* [ ] Handle flagged responses in UI
* [ ] Test end-to-end flow
* [ ] Set up admin dashboard (optional)

### Production

* [ ] Upgrade to paid API keys
* [ ] Configure production database
* [ ] Set up image storage (S3/Cloudinary)
* [ ] Enable monitoring and alerts
* [ ] Deploy to AWS/cloud
* [ ] Load test with expected traffic
* [ ] Document any custom changes

---

**🚀 You're all set! The system is production-ready with valid API keys.**

For questions, check the documentation files or contact the technical AI lead @ [Basim Bashir](basim.bashir0968@gmail.com "basim.bashir0968@gmail.com").
