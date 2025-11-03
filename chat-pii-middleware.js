/**
 * Express Middleware for PII Detection in Chat Messages
 * Integrates seamlessly with React Native/React.js chat applications
 */

const PIIDetectionService = require('./pii-detection-service');

class ChatPIIMiddleware {
  constructor(piiService) {
    this.piiService = piiService;
    this.config = {
      blockOnDetection: false,  // Set to true to block messages with PII
      forwardToReceiver: true,  // Forward flagged messages to receiver
      saveOriginalMessage: true // Save original message even if blocked
    };
  }

  /**
   * Middleware for text messages
   */
  checkTextMessage = async (req, res, next) => {
    try {
      const { message, senderId, receiverId, conversationId } = req.body;

      if (!message || !senderId) {
        return res.status(400).json({ 
          error: 'Message and senderId are required' 
        });
      }

      // Detect PII in message
      const detection = await this.piiService.detectPIIInText(
        message,
        senderId,
        {
          receiverId,
          conversationId,
          messageType: 'text'
        }
      );

      // Add detection result to request
      req.piiDetection = detection;

      // Handle based on configuration
      if (detection.hasPII) {
        console.log(`[PII Middleware] Detected PII from user ${senderId}`);

        if (this.config.blockOnDetection) {
          // Block the message
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

        // Flag but forward
        req.body.flagged = true;
        req.body.flagReason = 'PII_DETECTED';
        req.body.detection = {
          hasPII: true,
          riskLevel: detection.riskLevel,
          confidence: detection.confidence
        };
      }

      // Continue to next middleware/handler
      next();

    } catch (error) {
      console.error('[PII Middleware Error]', error);
      
      // Don't block message on error, but log it
      req.body.flagged = true;
      req.body.flagReason = 'PII_CHECK_ERROR';
      next();
    }
  };

  /**
   * Middleware for image messages
   */
  checkImageMessage = async (req, res, next) => {
    try {
      const { imageData, senderId, receiverId, conversationId } = req.body;
      const imageFile = req.file; // If using multer

      if (!imageData && !imageFile) {
        return res.status(400).json({ 
          error: 'Image data is required' 
        });
      }

      let base64Data, mimeType;

      // Handle different image input formats
      if (imageFile) {
        base64Data = imageFile.buffer.toString('base64');
        mimeType = imageFile.mimetype;
      } else if (imageData) {
        // Assume imageData is already base64 or includes format info
        if (typeof imageData === 'string') {
          // Extract base64 data from data URL if present
          const matches = imageData.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else {
            base64Data = imageData;
            mimeType = 'image/jpeg';
          }
        } else if (imageData.base64 && imageData.mimeType) {
          base64Data = imageData.base64;
          mimeType = imageData.mimeType;
        }
      }

      // Detect PII in image
      const detection = await this.piiService.detectPIIInImage(
        { base64: base64Data, mimeType },
        senderId,
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

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

module.exports = ChatPIIMiddleware;