/**
 * PII Detection Service using Google Gemini API
 * Detects contact information in text and images with auto-scaling API key rotation
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  PIIDetectionConfig,
  KeyUsageStats,
  DetectionResult,
  DetectionData,
  ImageData,
  UsageStatsResponse,
  AdminWebhookPayload
} from '../types';

export class PIIDetectionService {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;
  private keyUsageStats: KeyUsageStats[];
  public config: Required<PIIDetectionConfig>;
  private rateLimitResetTimes: Map<number, number>;
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;

  constructor(apiKeys: string[] = [], config: PIIDetectionConfig = {}) {
    if (!Array.isArray(apiKeys) || apiKeys.length === 0) {
      throw new Error('At least one API key is required');
    }

    this.apiKeys = apiKeys;
    this.keyUsageStats = apiKeys.map(() => ({
      requests: 0,
      errors: 0,
      lastUsed: null,
      rateLimitHits: 0
    }));

    this.config = {
      model: config.model || 'gemini-2.5-flash',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableLogging: config.enableLogging !== false,
      databaseUrl: config.databaseUrl || null,
      adminWebhook: config.adminWebhook || null,
      ...config
    };

    this.rateLimitResetTimes = new Map();
    this.initializeClient();

    console.log(`[PII Detection] Service initialized with ${apiKeys.length} API keys`);
  }

  private initializeClient(): void {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    this.genAI = new GoogleGenerativeAI(currentKey);
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
  }

  private rotateAPIKey(): number {
    const previousIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;

    this.keyUsageStats[previousIndex].rateLimitHits++;
    this.rateLimitResetTimes.set(previousIndex, Date.now() + 60000);

    this.initializeClient();

    console.log(`[API Key Rotation] Switched from key ${previousIndex} to key ${this.currentKeyIndex}`);

    return this.currentKeyIndex;
  }

  private findAvailableKey(): boolean {
    const now = Date.now();

    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      const resetTime = this.rateLimitResetTimes.get(keyIndex);

      if (!resetTime || now > resetTime) {
        if (keyIndex !== this.currentKeyIndex) {
          this.currentKeyIndex = keyIndex;
          this.initializeClient();
          console.log(`[API Key Selection] Using key ${keyIndex}`);
        }
        return true;
      }
    }

    return false;
  }

  public async detectPIIInText(
    text: string,
    userId: string,
    metadata: Record<string, any> = {}
  ): Promise<DetectionResult> {
    if (!text || typeof text !== 'string') {
      throw new Error('Valid text string is required');
    }

    const prompt = this.buildTextDetectionPrompt(text);

    try {
      const result = await this.callGeminiWithRetry(prompt);
      const detection = this.parseDetectionResult(result);

      if (detection.hasPII) {
        await this.handleDetection({
          type: 'text',
          userId,
          content: text,
          detection,
          metadata,
          timestamp: new Date().toISOString()
        });
      }

      return detection;
    } catch (error) {
      console.error('[PII Detection Error]', error);
      throw error;
    }
  }

  public async detectPIIInImage(
    imageData: ImageData | string,
    userId: string,
    metadata: Record<string, any> = {}
  ): Promise<DetectionResult> {
    if (!imageData) {
      throw new Error('Image data is required');
    }

    const prompt = this.buildImageDetectionPrompt();

    try {
      const imagePart = {
        inlineData: {
          data: typeof imageData === 'string' ? imageData : imageData.base64,
          mimeType: typeof imageData === 'string' ? 'image/jpeg' : imageData.mimeType
        }
      };

      const result = await this.callGeminiWithRetry([prompt, imagePart]);
      const detection = this.parseDetectionResult(result);

      if (detection.hasPII) {
        await this.handleDetection({
          type: 'image',
          userId,
          imageMetadata: metadata,
          detection,
          timestamp: new Date().toISOString()
        });
      }

      return detection;
    } catch (error) {
      console.error('[PII Image Detection Error]', error);
      throw error;
    }
  }

  private async callGeminiWithRetry(content: any, attempt: number = 1): Promise<string> {
    try {
      this.keyUsageStats[this.currentKeyIndex].requests++;
      this.keyUsageStats[this.currentKeyIndex].lastUsed = new Date().toISOString();

      const result = await this.model.generateContent(content);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      this.keyUsageStats[this.currentKeyIndex].errors++;

      const isRateLimitError =
        error.message?.includes('429') ||
        error.message?.includes('rate limit') ||
        error.message?.includes('RESOURCE_EXHAUSTED') ||
        error.status === 429;

      if (isRateLimitError) {
        console.warn(`[Rate Limit] Key ${this.currentKeyIndex} hit rate limit`);

        const hasAvailableKey = this.findAvailableKey();

        if (hasAvailableKey && attempt <= this.config.maxRetries) {
          console.log(`[Retry] Attempt ${attempt}/${this.config.maxRetries} with different key`);
          await this.sleep(this.config.retryDelay);
          return this.callGeminiWithRetry(content, attempt + 1);
        } else if (!hasAvailableKey) {
          console.error('[Critical] All API keys are rate limited!');
          throw new Error('All API keys are currently rate limited. Please try again later.');
        }
      }

      if (attempt <= this.config.maxRetries) {
        const backoffDelay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(`[Retry] Attempt ${attempt}/${this.config.maxRetries} after ${backoffDelay}ms`);
        await this.sleep(backoffDelay);

        if (attempt > 1) {
          this.rotateAPIKey();
        }

        return this.callGeminiWithRetry(content, attempt + 1);
      }

      throw error;
    }
  }

  private buildTextDetectionPrompt(text: string): string {
    return `You are an advanced PII (Personally Identifiable Information) detection system.
Your task is to analyze the following text and detect ANY form of contact information or attempts to share it.

DETECTION RULES:
1. Phone Numbers (all formats):
   - Standard: 555-1234, (555) 123-4567, +1-555-123-4567
   - Obfuscated: 5 5 5-1 2 3 4, five five five one two three four
   - Leetspeak: 5five5-1234, ph0ne: 555one234
   - Spelled out: "my number is five five five twelve thirty four"
   - With spaces/dots: 5.5.5.1.2.3.4, 555 123 4567

2. Email Addresses (all formats):
   - Standard: user@domain.com, user.name@company.co.uk
   - Obfuscated: user[at]domain[dot]com, user AT domain DOT com
   - Leetspeak: us3r@d0m4in.c0m
   - Spelled out: "email me at user at domain dot com"
   - Hidden: user (at) domain (dot) com

3. Social Media Handles:
   - @username, insta: username, snap: username
   - Find me on [platform] as [username]

4. Messaging Apps:
   - WhatsApp numbers, Telegram usernames, Discord IDs
   - Signal numbers, WeChat IDs

5. Other Contact Methods:
   - Skype IDs, Zoom meeting links
   - Physical addresses
   - Website URLs meant for contact

6. Creative Evasion Techniques:
   - Unicode confusables (а vs a, е vs e)
   - Character insertion (c-o-n-t-a-c-t)
   - Emoji encoding (using emojis to represent numbers/letters)
   - Coded language or hints
   - QR code descriptions
   - "DM me", "text me", "call me" followed by any identifier

TEXT TO ANALYZE:
"""
${text}
"""

REQUIRED OUTPUT FORMAT (JSON only, no markdown):
{
  "hasPII": true/false,
  "confidence": 0-100,
  "detectedItems": [
    {
      "type": "phone|email|social|messaging|other",
      "value": "the detected contact info",
      "obfuscationType": "none|leetspeak|spelled|spaces|encoded|other",
      "location": "where in text",
      "severity": "high|medium|low"
    }
  ],
  "reasoning": "brief explanation of detection",
  "riskLevel": "critical|high|medium|low"
}

IMPORTANT: Be extremely thorough. Even subtle hints of contact sharing should be flagged.`;
  }

  private buildImageDetectionPrompt(): string {
    return `You are an advanced PII detection system analyzing an IMAGE for contact information.

SCAN FOR:
1. Text containing phone numbers (any format)
2. Email addresses (any format)
3. Social media handles or usernames
4. QR codes that might contain contact info
5. Screenshots of messaging apps
6. Handwritten contact information
7. Business cards
8. Signs or posters with contact details
9. Whiteboards/notes with phone numbers or emails
10. Chat screenshots containing contact sharing attempts

Check for obfuscation techniques:
- Numbers written as words
- Leetspeak (3 for E, 4 for A, etc.)
- Partially visible/blurred contact info
- Creative formatting or symbols

REQUIRED OUTPUT FORMAT (JSON only, no markdown):
{
  "hasPII": true/false,
  "confidence": 0-100,
  "detectedItems": [
    {
      "type": "phone|email|qrcode|social|screenshot|other",
      "description": "what was found",
      "location": "where in image",
      "severity": "high|medium|low"
    }
  ],
  "reasoning": "brief explanation",
  "riskLevel": "critical|high|medium|low",
  "imageContainsText": true/false
}`;
  }

  private parseDetectionResult(responseText: string): DetectionResult {
    try {
      let cleanedText = responseText.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '');
      cleanedText = cleanedText.replace(/```\n?/g, '');
      cleanedText = cleanedText.trim();

      const parsed = JSON.parse(cleanedText);

      return {
        hasPII: parsed.hasPII || false,
        confidence: parsed.confidence || 0,
        detectedItems: parsed.detectedItems || [],
        reasoning: parsed.reasoning || '',
        riskLevel: parsed.riskLevel || 'low',
        imageContainsText: parsed.imageContainsText
      };
    } catch (error) {
      console.error('[Parse Error]', error);
      console.error('[Response Text]', responseText);

      const hasPIIIndicators =
        responseText.toLowerCase().includes('detected') ||
        responseText.toLowerCase().includes('found') ||
        responseText.toLowerCase().includes('phone') ||
        responseText.toLowerCase().includes('email');

      return {
        hasPII: hasPIIIndicators,
        confidence: 50,
        detectedItems: [],
        reasoning: 'Failed to parse response, flagging as potential PII',
        riskLevel: 'medium',
        rawResponse: responseText
      };
    }
  }

  private async handleDetection(detectionData: DetectionData): Promise<DetectionData> {
    if (this.config.enableLogging) {
      console.log('[PII DETECTED]', {
        type: detectionData.type,
        userId: detectionData.userId,
        riskLevel: detectionData.detection.riskLevel,
        timestamp: detectionData.timestamp
      });
    }

    if (this.config.databaseUrl) {
      try {
        await this.saveToDatabase(detectionData);
      } catch (error) {
        console.error('[Database Save Error]', error);
      }
    }

    if (this.config.adminWebhook) {
      try {
        await this.notifyAdmin(detectionData);
      } catch (error) {
        console.error('[Admin Notification Error]', error);
      }
    }

    return detectionData;
  }

  private async saveToDatabase(detectionData: DetectionData): Promise<void> {
    console.log('[Database] Would save detection:', detectionData);
  }

  private async notifyAdmin(detectionData: DetectionData): Promise<void> {
    try {
      const payload: AdminWebhookPayload = {
        alert: 'PII_DETECTED',
        severity: detectionData.detection.riskLevel,
        userId: detectionData.userId,
        type: detectionData.type,
        detectedItems: detectionData.detection.detectedItems,
        timestamp: detectionData.timestamp
      };

      const response = await fetch(this.config.adminWebhook!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      console.log('[Admin Notified] Successfully sent alert');
    } catch (error) {
      console.error('[Webhook Error]', error);
    }
  }

  public getUsageStats(): UsageStatsResponse[] {
    return this.apiKeys.map((key, index) => ({
      keyIndex: index,
      keyPreview: `${key.substring(0, 8)}...`,
      isCurrent: index === this.currentKeyIndex,
      ...this.keyUsageStats[index]
    }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
