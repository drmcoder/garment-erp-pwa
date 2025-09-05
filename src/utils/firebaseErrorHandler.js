// Firebase Error Handler Utility
// Provides centralized error handling for Firebase operations

export class FirebaseErrorHandler {
  static handleFirestoreError(error, operation = 'Firebase operation') {
    console.error(`❌ ${operation} failed:`, {
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    // Handle specific Firebase error codes
    switch (error.code) {
      case 'failed-precondition':
        if (error.message.includes('index')) {
          console.warn('⚠️ Composite index required. Using fallback query strategy.');
          return {
            type: 'INDEX_ERROR',
            message: 'Database index required - using fallback method',
            canRetry: true,
            fallbackStrategy: true
          };
        }
        break;
        
      case 'permission-denied':
        return {
          type: 'PERMISSION_ERROR',
          message: 'Access denied - check authentication and security rules',
          canRetry: false,
          fallbackStrategy: false
        };
        
      case 'unavailable':
        return {
          type: 'NETWORK_ERROR',
          message: 'Firebase service unavailable - check network connection',
          canRetry: true,
          fallbackStrategy: true
        };
        
      case 'quota-exceeded':
        return {
          type: 'QUOTA_ERROR',
          message: 'Firebase quota exceeded - operation throttled',
          canRetry: true,
          fallbackStrategy: true
        };
        
      case 'not-found':
        return {
          type: 'NOT_FOUND_ERROR',
          message: 'Requested document or collection not found',
          canRetry: false,
          fallbackStrategy: true
        };
        
      default:
        return {
          type: 'UNKNOWN_ERROR',
          message: error.message || 'Unknown Firebase error occurred',
          canRetry: true,
          fallbackStrategy: true
        };
    }
  }

  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return { success: true, data: result };
      } catch (error) {
        const errorInfo = this.handleFirestoreError(error, `Attempt ${attempt}`);
        
        if (!errorInfo.canRetry || attempt === maxRetries) {
          return { 
            success: false, 
            error: errorInfo.message,
            errorType: errorInfo.type,
            fallbackAvailable: errorInfo.fallbackStrategy
          };
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  static logPerformanceIssue(operation, duration, threshold = 5000) {
    if (duration > threshold) {
      console.warn(`⏱️ Slow Firebase operation detected:`, {
        operation,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        suggestion: 'Consider optimizing query or implementing caching'
      });
    }
  }

  static createFallbackData(collection, defaultData = {}) {
    console.log(`📦 Creating fallback data for ${collection}`);
    
    const fallbacks = {
      workCompletions: [],
      operatorEarnings: [],
      bundles: [],
      operators: [],
      notifications: []
    };
    
    return {
      success: true,
      data: fallbacks[collection] || defaultData,
      isFallback: true,
      message: `Using fallback data for ${collection} due to Firebase error`
    };
  }
}

export default FirebaseErrorHandler;