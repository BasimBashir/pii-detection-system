/**
 * Express Server with PII Detection Integration
 * Example implementation for chat application backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const PIIDetectionService = require('./pii-detection-service');
const ChatPIIMiddleware = require('./chat-pii-middleware');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// ==========================================
// LOAD AND VALIDATE API KEYS
// ==========================================

function loadAPIKeys() {
  const keys = [];
  let keyIndex = 1;
  
  // Load all GEMINI_API_KEY_* from environment
  while (true) {
    const key = process.env[`GEMINI_API_KEY_${keyIndex}`];
    
    if (!key) {
      break; // No more keys
    }
    
    // Skip placeholder/invalid keys
    if (key.includes('your-api-key') || key.includes('your-key') || key.trim().length < 20) {
      console.warn(`[Warning] GEMINI_API_KEY_${keyIndex} appears to be a placeholder. Skipping.`);
      keyIndex++;
      continue;
    }
    
    keys.push(key);
    console.log(`[Config] Loaded GEMINI_API_KEY_${keyIndex}`);
    keyIndex++;
  }
  
  return keys;
}

const GEMINI_API_KEYS = loadAPIKeys();

if (GEMINI_API_KEYS.length === 0) {
  console.error('\n===========================================');
  console.error('❌ ERROR: No valid Gemini API keys found!');
  console.error('===========================================');
  console.error('\nPlease follow these steps:');
  console.error('1. Visit: https://aistudio.google.com/app/apikey');
  console.error('2. Sign in with your Google account');
  console.error('3. Click "Create API Key"');
  console.error('4. Copy the generated key');
  console.error('5. Add to your .env file:');
  console.error('   GEMINI_API_KEY_1=your-actual-key-here');
  console.error('\nFor better rate limit handling, add multiple keys:');
  console.error('   GEMINI_API_KEY_2=your-second-key');
  console.error('   GEMINI_API_KEY_3=your-third-key');
  console.error('\n===========================================\n');
  process.exit(1);
}

// Initialize PII Detection Service
let piiService;
let chatMiddleware;

try {
  piiService = new PIIDetectionService(GEMINI_API_KEYS, {
    model: 'gemini-2.5-flash', // Latest fast model
    maxRetries: 3,
    retryDelay: 1000,
    enableLogging: true,
    databaseUrl: process.env.DATABASE_URL,
    adminWebhook: process.env.ADMIN_WEBHOOK_URL
  });

  // Initialize Middleware
  chatMiddleware = new ChatPIIMiddleware(piiService);

  // Update middleware configuration as needed
  chatMiddleware.updateConfig({
    blockOnDetection: false,  // Set to true to block messages
    forwardToReceiver: true,  // Forward flagged messages
    saveOriginalMessage: true
  });

} catch (error) {
  console.error('\n===========================================');
  console.error('❌ Failed to initialize PII Detection Service');
  console.error('===========================================');
  console.error(`Error: ${error.message}`);
  console.error('\nPlease check your API keys and try again.');
  console.error('===========================================\n');
  process.exit(1);
}

// ==========================================
// ROUTES
// ==========================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PII Detection Chat Service',
    timestamp: new Date().toISOString(),
    apiKeysConfigured: GEMINI_API_KEYS.length
  });
});

/**
 * Get API usage statistics
 */
app.get('/api/stats', (req, res) => {
  const stats = piiService.getUsageStats();
  res.json({
    success: true,
    totalKeys: GEMINI_API_KEYS.length,
    stats
  });
});

/**
 * Send text message (with PII detection)
 */
app.post('/api/chat/send-message', 
  chatMiddleware.checkTextMessage, 
  async (req, res) => {
    try {
      const { 
        message, 
        senderId, 
        receiverId, 
        conversationId,
        flagged,
        flagReason,
        detection
      } = req.body;

      // Here you would normally save to your database
      // For this example, we'll simulate the response
      
      const messageData = {
        id: generateMessageId(),
        message,
        senderId,
        receiverId,
        conversationId,
        timestamp: new Date().toISOString(),
        flagged: flagged || false,
        flagReason: flagReason || null,
        detection: detection || null
      };

      // Save to database here
      // await db.messages.insert(messageData);

      // If flagged, save to admin panel
      if (flagged) {
        // await db.flaggedMessages.insert({
        //   ...messageData,
        //   reviewStatus: 'pending',
        //   piiDetection: req.piiDetection
        // });
        
        console.log('[Flagged Message]', {
          messageId: messageData.id,
          userId: senderId,
          reason: flagReason
        });
      }

      // Send response
      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: messageData.id,
          flagged: messageData.flagged,
          timestamp: messageData.timestamp
        }
      });

    } catch (error) {
      console.error('[Send Message Error]', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }
);

/**
 * Send image message (with PII detection)
 */
app.post('/api/chat/send-image',
  upload.single('image'),
  chatMiddleware.checkImageMessage,
  async (req, res) => {
    try {
      const {
        senderId,
        receiverId,
        conversationId,
        flagged,
        flagReason,
        detection
      } = req.body;

      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      // In production, upload to S3/CloudStorage
      const imageUrl = `https://your-storage.com/images/${Date.now()}_${imageFile.originalname}`;

      const messageData = {
        id: generateMessageId(),
        type: 'image',
        imageUrl,
        senderId,
        receiverId,
        conversationId,
        timestamp: new Date().toISOString(),
        flagged: flagged || false,
        flagReason: flagReason || null,
        detection: detection || null
      };

      // Save to database
      // await db.messages.insert(messageData);

      if (flagged) {
        console.log('[Flagged Image]', {
          messageId: messageData.id,
          userId: senderId,
          reason: flagReason
        });
      }

      res.json({
        success: true,
        message: 'Image sent successfully',
        data: {
          messageId: messageData.id,
          imageUrl: messageData.imageUrl,
          flagged: messageData.flagged,
          timestamp: messageData.timestamp
        }
      });

    } catch (error) {
      console.error('[Send Image Error]', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send image'
      });
    }
  }
);

/**
 * Admin endpoint - Get flagged messages
 */
app.get('/api/admin/flagged-messages', async (req, res) => {
  try {
    // In production, fetch from database with pagination
    // const flaggedMessages = await db.flaggedMessages
    //   .find({ reviewStatus: 'pending' })
    //   .sort({ timestamp: -1 })
    //   .limit(50);

    res.json({
      success: true,
      data: {
        flaggedMessages: [], // Replace with actual data
        totalCount: 0
      }
    });

  } catch (error) {
    console.error('[Get Flagged Messages Error]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flagged messages'
    });
  }
});

/**
 * Admin endpoint - Review flagged message
 */
app.post('/api/admin/review-message', async (req, res) => {
  try {
    const { messageId, action, adminNotes } = req.body;

    // action: 'approve', 'block_user', 'delete_message', 'warn_user'
    
    // Update in database
    // await db.flaggedMessages.update(
    //   { id: messageId },
    //   { 
    //     reviewStatus: 'reviewed',
    //     reviewAction: action,
    //     reviewedBy: req.adminId,
    //     reviewedAt: new Date(),
    //     adminNotes
    //   }
    // );

    res.json({
      success: true,
      message: 'Message reviewed successfully'
    });

  } catch (error) {
    console.error('[Review Message Error]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review message'
    });
  }
});

/**
 * Test endpoint - Directly test PII detection
 */
app.post('/api/test/detect-pii', async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const detection = await piiService.detectPIIInText(
      text,
      userId || 'test-user'
    );

    res.json({
      success: true,
      detection
    });

  } catch (error) {
    console.error('[Test Detection Error]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
=====================================
🚀 PII Detection Chat Server Started
=====================================
Port: ${PORT}
API Keys Loaded: ${GEMINI_API_KEYS.length}
Model: ${piiService.config.model}
Mode: ${process.env.NODE_ENV || 'development'}
=====================================
  `);
});

module.exports = app;