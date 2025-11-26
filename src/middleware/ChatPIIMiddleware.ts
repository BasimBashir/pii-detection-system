/**
 * Express Middleware for PII Detection in Chat Messages
 * Integrates seamlessly with React Native/React.js chat applications
 */

import { Request, Response, NextFunction } from 'express';
import { PIIDetectionService } from '../services/PIIDetectionService';
import { ChatMiddlewareConfig, MessageRequestBody } from '../types';

export class ChatPIIMiddleware {
  private piiService: PIIDetectionService;
  private config: ChatMiddlewareConfig;

  constructor(piiService: PIIDetectionService) {
    this.piiService = piiService;
    this.config = {
      blockOnDetection: false,
      forwardToReceiver: true,
      saveOriginalMessage: true
    };
  }

  public checkTextMessage = async (
    req: Request<{}, {}, MessageRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    try {
      const { message, senderId, receiverId, conversationId } = req.body;

      if (!message || !senderId) {
        return res.status(400).json({
          error: 'Message and senderId are required'
        });
      }

      const detection = await this.piiService.detectPIIInText(message, senderId, {
        receiverId,
        conversationId,
        messageType: 'text'
      });

      req.piiDetection = detection;

      if (detection.hasPII) {
        console.log(`[PII Middleware] Detected PII from user ${senderId}`);

        if (this.config.blockOnDetection) {
          return res.status(403).json({
            success: false,
            error: 'Message blocked: Contains contact information',
            message: 'Please avoid sharing personal contact information in chat.',
            detection: {
              hasPII: true,
              riskLevel: detection.riskLevel
            }
          });
        }

        req.body.flagged = true;
        req.body.flagReason = 'PII_DETECTED';
        req.body.detection = {
          hasPII: true,
          riskLevel: detection.riskLevel,
          confidence: detection.confidence
        };
      }

      next();
    } catch (error) {
      console.error('[PII Middleware Error]', error);

      req.body.flagged = true;
      req.body.flagReason = 'PII_CHECK_ERROR';
      next();
    }
  };

  public checkImageMessage = async (
    req: Request<{}, {}, MessageRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    try {
      const { imageData, senderId, receiverId, conversationId } = req.body;
      const imageFile = req.file;

      if (!imageData && !imageFile) {
        return res.status(400).json({
          error: 'Image data is required'
        });
      }

      let base64Data: string;
      let mimeType: string;

      if (imageFile) {
        base64Data = imageFile.buffer.toString('base64');
        mimeType = imageFile.mimetype;
      } else if (imageData) {
        if (typeof imageData === 'string') {
          const matches = imageData.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else {
            base64Data = imageData;
            mimeType = 'image/jpeg';
          }
        } else if ('base64' in imageData && 'mimeType' in imageData) {
          base64Data = imageData.base64;
          mimeType = imageData.mimeType;
        } else {
          base64Data = '';
          mimeType = 'image/jpeg';
        }
      } else {
        base64Data = '';
        mimeType = 'image/jpeg';
      }

      const detection = await this.piiService.detectPIIInImage(
        { base64: base64Data, mimeType },
        senderId || 'unknown',
        {
          receiverId,
          conversationId,
          messageType: 'image',
          fileName: imageFile?.originalname
        }
      );

      req.piiDetection = detection;

      if (detection.hasPII) {
        console.log(`[PII Middleware] Detected PII in image from user ${senderId}`);

        if (this.config.blockOnDetection) {
          return res.status(403).json({
            success: false,
            error: 'Image blocked: Contains contact information',
            message: 'Please avoid sharing images with personal contact information.',
            detection: {
              hasPII: true,
              riskLevel: detection.riskLevel
            }
          });
        }

        req.body.flagged = true;
        req.body.flagReason = 'PII_IN_IMAGE';
        req.body.detection = {
          hasPII: true,
          riskLevel: detection.riskLevel,
          confidence: detection.confidence
        };
      }

      next();
    } catch (error) {
      console.error('[PII Image Middleware Error]', error);
      req.body.flagged = true;
      req.body.flagReason = 'PII_CHECK_ERROR';
      next();
    }
  };

  public updateConfig(newConfig: Partial<ChatMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
