/**
 * EXAMPLE: How to Integrate PII Detection into Your Existing TypeScript Server
 *
 * This shows a complete before/after example of integrating PII detection
 * into a typical mobile app server with chat functionality.
 */

// ============================================================================
// BEFORE: Your Original Server (Without PII Detection)
// ============================================================================

/*
import express from 'express';
import { db } from './database';

const app = express();
app.use(express.json());

// Simple message sending endpoint
app.post('/api/chat/send', async (req, res) => {
  const { text, senderId, receiverId } = req.body;

  // Save message to database
  const message = await db.messages.create({
    content: text,
    senderId,
    receiverId,
    timestamp: new Date()
  });

  // Send notification to receiver
  await sendPushNotification(receiverId, 'New message');

  res.json({ success: true, messageId: message.id });
});

app.listen(3000);
*/

// ============================================================================
// AFTER: Server WITH PII Detection (Complete Integration)
// ============================================================================

import express, { Request, Response } from 'express';
import multer from 'multer';
// Import PII detection components
import { PIIDetectionService, ChatPIIMiddleware } from './pii';

const app = express();
app.use(express.json());

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============================================================================
// STEP 1: Initialize PII Detection Service
// ============================================================================

function loadGeminiAPIKeys(): string[] {
  const keys: string[] = [];
  let index = 1;

  while (true) {
    const key = process.env[`GEMINI_API_KEY_${index}`];
    if (!key) break;

    if (key.trim().length > 20) {
      keys.push(key);
      console.log(`✓ Loaded API Key ${index}`);
    }
    index++;
  }

  if (keys.length === 0) {
    throw new Error('No Gemini API keys found. Add GEMINI_API_KEY_1 to .env');
  }

  return keys;
}

const geminiKeys = loadGeminiAPIKeys();

const piiService = new PIIDetectionService(geminiKeys, {
  model: 'gemini-2.5-flash',
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: true,
  databaseUrl: process.env.DATABASE_URL,
  adminWebhook: process.env.ADMIN_WEBHOOK_URL
});

const piiMiddleware = new ChatPIIMiddleware(piiService);

// Configure middleware behavior
piiMiddleware.updateConfig({
  blockOnDetection: false,  // Change to true to block messages with PII
  forwardToReceiver: true,
  saveOriginalMessage: true
});

console.log('✓ PII Detection Service initialized');

// ============================================================================
// STEP 2: Add PII Detection to Your Routes
// ============================================================================

// EXAMPLE 1: Text Messages with PII Detection
app.post('/api/chat/send',
  piiMiddleware.checkTextMessage,  // ← Add this middleware
  async (req, res) => {
    const {
      message,        // Your original message field
      senderId,
      receiverId,
      flagged,        // ← Added by middleware if PII detected
      flagReason,     // ← Reason for flagging
      detection       // ← Detection details
    } = req.body;

    // Your existing database logic
    const msg = await db.messages.create({
      content: message,
      senderId,
      receiverId,
      timestamp: new Date(),
      flagged: flagged || false,
      flagReason: flagReason || null
    });

    // If PII detected, save to admin panel for review
    if (flagged) {
      console.log(`⚠️ PII Detected in message ${msg.id}`, {
        userId: senderId,
        riskLevel: detection?.riskLevel,
        confidence: detection?.confidence
      });

      // Save to admin review queue
      await db.flaggedMessages.create({
        messageId: msg.id,
        userId: senderId,
        detectionData: detection,
        reviewStatus: 'pending',
        timestamp: new Date()
      });

      // Optionally notify admin team
      await notifyAdminTeam({
        type: 'PII_DETECTED',
        userId: senderId,
        messageId: msg.id,
        severity: detection?.riskLevel
      });
    }

    // Your existing notification logic
    if (!flagged || piiMiddleware.config.forwardToReceiver) {
      await sendPushNotification(receiverId, 'New message');
    }

    res.json({
      success: true,
      messageId: msg.id,
      flagged: flagged || false
    });
  }
);

// EXAMPLE 2: Image Messages with PII Detection
app.post('/api/chat/send-image',
  upload.single('image'),              // ← Your existing multer middleware
  piiMiddleware.checkImageMessage,     // ← Add PII detection
  async (req, res) => {
    const { senderId, receiverId, flagged, detection } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Upload image to storage (your existing logic)
    const imageUrl = await uploadToS3(imageFile);

    // Save to database
    const msg = await db.messages.create({
      type: 'image',
      imageUrl,
      senderId,
      receiverId,
      flagged: flagged || false,
      timestamp: new Date()
    });

    // Handle PII in image
    if (flagged) {
      console.log(`⚠️ PII Detected in image ${msg.id}`);

      await db.flaggedMessages.create({
        messageId: msg.id,
        userId: senderId,
        type: 'image',
        imageUrl,
        detectionData: detection,
        reviewStatus: 'pending'
      });
    }

    res.json({
      success: true,
      messageId: msg.id,
      imageUrl,
      flagged: flagged || false
    });
  }
);

// ============================================================================
// EXAMPLE 3: Client-Side Validation API (Optional)
// ============================================================================

// Let your mobile app check messages BEFORE sending
app.post('/api/chat/validate-message', async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Check for PII
    const detection = await piiService.detectPIIInText(text, userId);

    if (detection.hasPII) {
      return res.json({
        canSend: false,
        message: 'Your message contains personal information and cannot be sent.',
        details: {
          riskLevel: detection.riskLevel,
          confidence: detection.confidence
        }
      });
    }

    res.json({
      canSend: true,
      message: 'Message is safe to send'
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.json({
      canSend: true,  // Don't block on error
      message: 'Validation check failed, proceeding anyway'
    });
  }
});

// ============================================================================
// EXAMPLE 4: Admin Panel Endpoints
// ============================================================================

// Get all flagged messages for admin review
app.get('/api/admin/flagged-messages', async (req, res) => {
  const flaggedMessages = await db.flaggedMessages.find({
    reviewStatus: 'pending'
  }).sort({ timestamp: -1 }).limit(50);

  res.json({
    success: true,
    messages: flaggedMessages,
    count: flaggedMessages.length
  });
});

// Review a flagged message
app.post('/api/admin/review-message', async (req, res) => {
  const { messageId, action, adminId, notes } = req.body;
  // action: 'approve', 'delete', 'warn_user', 'block_user'

  await db.flaggedMessages.update(
    { messageId },
    {
      reviewStatus: 'reviewed',
      reviewAction: action,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminNotes: notes
    }
  );

  // Take action based on admin decision
  if (action === 'delete') {
    await db.messages.delete({ id: messageId });
  } else if (action === 'block_user') {
    const message = await db.messages.findOne({ id: messageId });
    await db.users.update(
      { id: message.senderId },
      { status: 'blocked' }
    );
  }

  res.json({ success: true });
});

// ============================================================================
// EXAMPLE 5: Batch Processing (For Existing Messages)
// ============================================================================

// Check existing messages for PII (run once or as background job)
app.post('/api/admin/scan-existing-messages', async (req, res) => {
  try {
    const messages = await db.messages.find({
      flagged: { $ne: true },
      type: 'text'
    }).limit(100);

    let flaggedCount = 0;

    for (const msg of messages) {
      const detection = await piiService.detectPIIInText(
        msg.content,
        msg.senderId
      );

      if (detection.hasPII) {
        await db.messages.update(
          { id: msg.id },
          { flagged: true, detection }
        );
        flaggedCount++;
      }
    }

    res.json({
      success: true,
      scanned: messages.length,
      flagged: flaggedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Scan failed' });
  }
});

// ============================================================================
// EXAMPLE 6: Stats and Monitoring
// ============================================================================

app.get('/api/stats/pii-detection', (req, res) => {
  const stats = piiService.getUsageStats();

  res.json({
    success: true,
    apiKeys: stats.length,
    currentKey: stats.find(s => s.isCurrent)?.keyIndex,
    totalRequests: stats.reduce((sum, s) => sum + s.requests, 0),
    totalErrors: stats.reduce((sum, s) => sum + s.errors, 0),
    rateLimitHits: stats.reduce((sum, s) => sum + s.rateLimitHits, 0)
  });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Server Started with PII Detection    ║
╚════════════════════════════════════════╝
Port: ${PORT}
Gemini API Keys: ${geminiKeys.length}
PII Blocking: ${piiMiddleware.config.blockOnDetection ? 'ON' : 'OFF'}
Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

// ============================================================================
// Helper Functions (Your existing code)
// ============================================================================

async function sendPushNotification(userId: string, message: string) {
  // Your push notification logic
  console.log(`📱 Push notification to ${userId}: ${message}`);
}

async function notifyAdminTeam(data: any) {
  // Your admin notification logic
  console.log('🚨 Admin notification:', data);
}

async function uploadToS3(file: Express.Multer.File): Promise<string> {
  // Your S3/Cloud storage upload logic
  return `https://storage.example.com/${Date.now()}_${file.originalname}`;
}

// Mock database (replace with your actual DB)
const db = {
  messages: {
    create: async (data: any) => ({ id: 'msg_123', ...data }),
    update: async (query: any, data: any) => {},
    delete: async (query: any) => {},
    findOne: async (query: any) => ({ id: 'msg_123', senderId: 'user_1' }),
    find: async (query: any) => []
  },
  flaggedMessages: {
    create: async (data: any) => ({ id: 'flag_123', ...data }),
    update: async (query: any, data: any) => {},
    find: async (query: any) => ({ sort: () => ({ limit: () => [] }) })
  },
  users: {
    update: async (query: any, data: any) => {}
  }
};

export default app;

// ============================================================================
// MOBILE APP CLIENT EXAMPLE (React Native)
// ============================================================================

/*
// In your React Native app:

async function sendMessage(text: string) {
  try {
    // Optional: Validate before sending
    const validation = await fetch('https://api.yourapp.com/api/chat/validate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId: currentUserId })
    }).then(r => r.json());

    if (!validation.canSend) {
      Alert.alert(
        'Cannot Send Message',
        validation.message,
        [{ text: 'OK' }]
      );
      return;
    }

    // Send message
    const response = await fetch('https://api.yourapp.com/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        senderId: currentUserId,
        receiverId: recipientId
      })
    }).then(r => r.json());

    if (response.flagged) {
      // Optionally notify user that message was flagged
      console.log('Message flagged for review');
    }

    console.log('Message sent:', response.messageId);
  } catch (error) {
    console.error('Send failed:', error);
  }
}
*/
