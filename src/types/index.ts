/**
 * TypeScript Type Definitions for PII Detection Service
 */

export interface PIIDetectionConfig {
  model?: string;
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  databaseUrl?: string | null;
  adminWebhook?: string | null;
  [key: string]: any;
}

export interface KeyUsageStats {
  requests: number;
  errors: number;
  lastUsed: string | null;
  rateLimitHits: number;
}

export interface DetectedItem {
  type: 'phone' | 'email' | 'social' | 'messaging' | 'qrcode' | 'screenshot' | 'other';
  value?: string;
  description?: string;
  obfuscationType?: 'none' | 'leetspeak' | 'spelled' | 'spaces' | 'encoded' | 'other';
  location?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface DetectionResult {
  hasPII: boolean;
  confidence: number;
  detectedItems: DetectedItem[];
  reasoning: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  imageContainsText?: boolean;
  rawResponse?: string;
}

export interface DetectionData {
  type: 'text' | 'image';
  userId: string;
  content?: string;
  imageMetadata?: Record<string, any>;
  detection: DetectionResult;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface UsageStatsResponse {
  keyIndex: number;
  keyPreview: string;
  isCurrent: boolean;
  requests: number;
  errors: number;
  lastUsed: string | null;
  rateLimitHits: number;
}

export interface ChatMiddlewareConfig {
  blockOnDetection: boolean;
  forwardToReceiver: boolean;
  saveOriginalMessage: boolean;
}

export interface MessageRequestBody {
  message?: string;
  senderId?: string;
  receiverId?: string;
  conversationId?: string;
  imageData?: string | ImageData;
  flagged?: boolean;
  flagReason?: string;
  detection?: {
    hasPII: boolean;
    riskLevel: string;
    confidence: number;
  };
}

export interface AdminWebhookPayload {
  alert: string;
  severity: string;
  userId: string;
  type: string;
  detectedItems: DetectedItem[];
  timestamp: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    piiDetection?: DetectionResult;
  }
}
