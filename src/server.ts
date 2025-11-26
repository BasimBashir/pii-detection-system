/**
 * Express Server with PII Detection Integration
 * TypeScript implementation for chat application backend
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import multer, { Multer } from 'multer';
import { PIIDetectionService } from './services/PIIDetectionService';
import { ChatPIIMiddleware } from './middleware/ChatPIIMiddleware';
import { MessageRequestBody } from './types';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

function loadAPIKeys(): string[] {
  const keys: string[] = [];
  let keyIndex = 1;

  while (true) {
    const key = process.env[`GEMINI_API_KEY_${keyIndex}`];

    if (!key) {
      break;
    }

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

let piiService: PIIDetectionService;
let chatMiddleware: ChatPIIMiddleware;

try {
  piiService = new PIIDetectionService(GEMINI_API_KEYS, {
    model: 'gemini-2.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
    enableLogging: true,
    databaseUrl: process.env.DATABASE_URL,
    adminWebhook: process.env.ADMIN_WEBHOOK_URL
  });

  chatMiddleware = new ChatPIIMiddleware(piiService);

  chatMiddleware.updateConfig({
    blockOnDetection: false,
    forwardToReceiver: true,
    saveOriginalMessage: true
  });
} catch (error: any) {
  console.error('\n===========================================');
  console.error('❌ Failed to initialize PII Detection Service');
  console.error('===========================================');
  console.error(`Error: ${error.message}`);
  console.error('\nPlease check your API keys and try again.');
  console.error('===========================================\n');
  process.exit(1);
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PII Detection Chat Service',
    timestamp: new Date().toISOString(),
    apiKeysConfigured: GEMINI_API_KEYS.length
  });
});

app.get('/api/stats', (_req: Request, res: Response) => {
  const stats = piiService.getUsageStats();
  res.json({
    success: true,
    totalKeys: GEMINI_API_KEYS.length,
    stats
  });
});

app.post(
  '/api/chat/send-message',
  chatMiddleware.checkTextMessage,
  async (req: Request<{}, {}, MessageRequestBody>, res: Response) => {
    try {
      const { message, senderId, receiverId, conversationId, flagged, flagReason, detection } =
        req.body;

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

      if (flagged) {
        console.log('[Flagged Message]', {
          messageId: messageData.id,
          userId: senderId,
          reason: flagReason
        });
      }

      return res.json({
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
      return res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }
);

app.post(
  '/api/chat/send-image',
  upload.single('image'),
  chatMiddleware.checkImageMessage,
  async (req: Request<{}, {}, MessageRequestBody>, res: Response) => {
    try {
      const { senderId, receiverId, conversationId, flagged, flagReason, detection } = req.body;

      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

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

      if (flagged) {
        console.log('[Flagged Image]', {
          messageId: messageData.id,
          userId: senderId,
          reason: flagReason
        });
      }

      return res.json({
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
      return res.status(500).json({
        success: false,
        error: 'Failed to send image'
      });
    }
  }
);

app.get('/api/admin/flagged-messages', async (_req: Request, res: Response) => {
  try {
    return res.json({
      success: true,
      data: {
        flaggedMessages: [],
        totalCount: 0
      }
    });
  } catch (error) {
    console.error('[Get Flagged Messages Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch flagged messages'
    });
  }
});

app.post('/api/admin/review-message', async (req: Request, res: Response) => {
  try {
    const { messageId: _messageId, action: _action, adminNotes: _adminNotes } = req.body;

    return res.json({
      success: true,
      message: 'Message reviewed successfully'
    });
  } catch (error) {
    console.error('[Review Message Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to review message'
    });
  }
});

app.post('/api/test/detect-pii', async (req: Request, res: Response) => {
  try {
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const detection = await piiService.detectPIIInText(text, userId || 'test-user');

    return res.json({
      success: true,
      detection
    });
  } catch (error: any) {
    console.error('[Test Detection Error]', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

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

export { app, piiService, chatMiddleware };
