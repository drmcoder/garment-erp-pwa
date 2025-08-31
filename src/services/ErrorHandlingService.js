// Centralized Error Handling Service
// Provides consistent error handling, logging, and user notification

import React from 'react';
import { ActivityLogService } from './firebase-services';
import { sentryService } from './SentryService';

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  BUSINESS_LOGIC: 'business_logic',
  SYSTEM: 'system',
  USER_INPUT: 'user_input'
};

class ErrorHandlingService {
  constructor() {
    this.errorQueue = [];
    this.notificationService = null;
    this.userId = null;
    this.isNepali = false;
  }

  // Initialize with notification service and user context
  initialize(notificationService, userId, isNepali = false) {
    this.notificationService = notificationService;
    this.userId = userId;
    this.isNepali = isNepali;
    console.log('✅ Error Handling Service initialized');
  }

  // Main error handling method
  async handleError(error, context = {}) {
    const errorInfo = this.processError(error, context);
    
    // Log error
    await this.logError(errorInfo);
    
    // Report to Sentry
    this.reportToSentry(error, errorInfo, context);
    
    // Queue for batch processing
    this.queueError(errorInfo);
    
    // Show user notification
    this.showUserNotification(errorInfo);
    
    // Handle critical errors
    if (errorInfo.severity === ERROR_SEVERITY.CRITICAL) {
      this.handleCriticalError(errorInfo);
    }
    
    return errorInfo;
  }

  // Process raw error into structured error info
  processError(error, context) {
    const errorInfo = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      message: this.extractErrorMessage(error),
      originalError: error,
      context: {
        component: context.component || 'unknown',
        action: context.action || 'unknown',
        userId: this.userId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      category: this.categorizeError(error),
      severity: this.determineSeverity(error, context),
      stack: error?.stack,
      isRetryable: this.isErrorRetryable(error),
      userMessage: this.generateUserMessage(error),
      technicalDetails: this.extractTechnicalDetails(error)
    };

    return errorInfo;
  }

  // Extract clean error message from various error types
  extractErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    if (error?.data?.message) return error.data.message;
    return 'An unknown error occurred';
  }

  // Categorize error for better handling
  categorizeError(error) {
    const message = this.extractErrorMessage(error).toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ERROR_CATEGORIES.NETWORK;
    }
    if (message.includes('auth') || message.includes('login') || message.includes('permission')) {
      return ERROR_CATEGORIES.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('unauthorized')) {
      return ERROR_CATEGORIES.AUTHORIZATION;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ERROR_CATEGORIES.VALIDATION;
    }
    if (message.includes('not found') || message.includes('missing')) {
      return ERROR_CATEGORIES.USER_INPUT;
    }
    
    return ERROR_CATEGORIES.SYSTEM;
  }

  // Determine error severity
  determineSeverity(error, context) {
    const category = this.categorizeError(error);
    const message = this.extractErrorMessage(error).toLowerCase();
    
    // Critical errors
    if (category === ERROR_CATEGORIES.AUTHENTICATION && context.action === 'login') {
      return ERROR_SEVERITY.CRITICAL;
    }
    if (message.includes('database') || message.includes('firebase')) {
      return ERROR_SEVERITY.HIGH;
    }
    
    // High priority errors
    if (category === ERROR_CATEGORIES.NETWORK) {
      return ERROR_SEVERITY.HIGH;
    }
    if (category === ERROR_CATEGORIES.AUTHORIZATION) {
      return ERROR_SEVERITY.HIGH;
    }
    
    // Medium priority errors
    if (category === ERROR_CATEGORIES.BUSINESS_LOGIC) {
      return ERROR_SEVERITY.MEDIUM;
    }
    if (category === ERROR_CATEGORIES.VALIDATION) {
      return ERROR_SEVERITY.MEDIUM;
    }
    
    // Default to low
    return ERROR_SEVERITY.LOW;
  }

  // Check if error is retryable
  isErrorRetryable(error) {
    const category = this.categorizeError(error);
    const message = this.extractErrorMessage(error).toLowerCase();
    
    // Retryable errors
    if (category === ERROR_CATEGORIES.NETWORK) return true;
    if (message.includes('timeout')) return true;
    if (message.includes('rate limit')) return true;
    
    // Non-retryable errors
    if (category === ERROR_CATEGORIES.AUTHENTICATION) return false;
    if (category === ERROR_CATEGORIES.AUTHORIZATION) return false;
    if (category === ERROR_CATEGORIES.VALIDATION) return false;
    
    return false;
  }

  // Generate user-friendly message
  generateUserMessage(error) {
    const category = this.categorizeError(error);
    const message = this.extractErrorMessage(error).toLowerCase();
    
    const messages = {
      [ERROR_CATEGORIES.NETWORK]: {
        english: 'Network connection problem. Please check your internet connection.',
        nepali: 'नेटवर्क जडान समस्या। कृपया आफ्नो इन्टरनेट जडान जाँच गर्नुहोस्।'
      },
      [ERROR_CATEGORIES.AUTHENTICATION]: {
        english: 'Authentication failed. Please log in again.',
        nepali: 'प्रमाणीकरण असफल। कृपया फेरि लग इन गर्नुहोस्।'
      },
      [ERROR_CATEGORIES.AUTHORIZATION]: {
        english: 'You do not have permission to perform this action.',
        nepali: 'तपाईंसँग यो कार्य गर्ने अनुमति छैन।'
      },
      [ERROR_CATEGORIES.VALIDATION]: {
        english: 'Please check your input and try again.',
        nepali: 'कृपया आफ्नो इनपुट जाँच गर्नुहोस् र फेरि प्रयास गर्नुहोस्।'
      },
      [ERROR_CATEGORIES.USER_INPUT]: {
        english: 'The requested item was not found.',
        nepali: 'अनुरोध गरिएको वस्तु फेला परेन।'
      }
    };

    const categoryMessage = messages[category];
    if (categoryMessage) {
      return this.isNepali ? categoryMessage.nepali : categoryMessage.english;
    }

    // Generic fallback
    return this.isNepali 
      ? 'केहि गलत भयो। कृपया फेरि प्रयास गर्नुहोस्।'
      : 'Something went wrong. Please try again.';
  }

  // Extract technical details for developers
  extractTechnicalDetails(error) {
    return {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      statusText: error?.statusText,
      response: error?.response?.data,
      config: error?.config ? {
        method: error.config.method,
        url: error.config.url,
        data: error.config.data
      } : null
    };
  }

  // Log error to various destinations
  async logError(errorInfo) {
    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error:', errorInfo);
    }

    // Log to Firebase activity logs
    try {
      if (this.userId) {
        await ActivityLogService.logActivity(this.userId, 'error_occurred', {
          errorId: errorInfo.id,
          category: errorInfo.category,
          severity: errorInfo.severity,
          message: errorInfo.message,
          component: errorInfo.context.component,
          action: errorInfo.context.action
        });
      }
    } catch (loggingError) {
      console.error('Failed to log error to Firebase:', loggingError);
    }

    // Could add other logging destinations here (Sentry, LogRocket, etc.)
  }

  // Report error to Sentry
  reportToSentry(error, errorInfo, context) {
    try {
      // Map severity to Sentry levels
      const sentryLevel = {
        [ERROR_SEVERITY.LOW]: 'info',
        [ERROR_SEVERITY.MEDIUM]: 'warning', 
        [ERROR_SEVERITY.HIGH]: 'error',
        [ERROR_SEVERITY.CRITICAL]: 'fatal'
      }[errorInfo.severity] || 'error';

      // Prepare context for Sentry
      const sentryContext = {
        level: sentryLevel,
        tags: {
          category: errorInfo.category,
          severity: errorInfo.severity,
          component: context.component || 'unknown',
          action: context.action || 'unknown'
        },
        extra: {
          errorId: errorInfo.id,
          timestamp: errorInfo.timestamp,
          userId: this.userId,
          url: window.location.href,
          userAgent: navigator.userAgent,
          context: context
        }
      };

      // Set user context if available
      if (this.userId) {
        sentryContext.user = {
          id: this.userId,
          username: context.username,
          name: context.userName,
          role: context.userRole
        };
      }

      // Report to Sentry
      sentryService.reportError(error, sentryContext);
      
      // Add breadcrumb for debugging trail
      sentryService.addBreadcrumb(
        `Error in ${context.component || 'unknown'}: ${errorInfo.message}`,
        'error',
        sentryLevel,
        {
          category: errorInfo.category,
          action: context.action
        }
      );

    } catch (sentryError) {
      console.error('Failed to report error to Sentry:', sentryError);
    }
  }

  // Queue error for batch processing
  queueError(errorInfo) {
    this.errorQueue.push(errorInfo);
    
    // Keep queue size manageable
    if (this.errorQueue.length > 100) {
      this.errorQueue = this.errorQueue.slice(-50);
    }
  }

  // Show notification to user
  showUserNotification(errorInfo) {
    if (!this.notificationService) return;

    const notificationType = this.getNotificationType(errorInfo.severity);
    
    this.notificationService.showNotification(
      errorInfo.userMessage,
      notificationType
    );
  }

  // Map severity to notification type
  getNotificationType(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        return 'error';
      case ERROR_SEVERITY.MEDIUM:
        return 'warning';
      default:
        return 'info';
    }
  }

  // Handle critical errors
  handleCriticalError(errorInfo) {
    console.error('🚨 CRITICAL ERROR:', errorInfo);
    
    // Could trigger additional actions like:
    // - Force logout for auth errors
    // - Show maintenance message
    // - Redirect to error page
    // - Send alerts to administrators
    
    if (errorInfo.category === ERROR_CATEGORIES.AUTHENTICATION) {
      // Force re-authentication
      window.location.href = '/login';
    }
  }

  // Retry mechanism for retryable errors
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return { success: true, data: result };
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isErrorRetryable(error)) {
          break;
        }
        
        if (attempt < maxRetries) {
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
    
    // All retries failed
    await this.handleError(lastError, { 
      action: 'retry_operation',
      maxRetries,
      finalAttempt: true
    });
    
    return { success: false, error: lastError };
  }

  // Get error statistics
  getErrorStatistics() {
    const total = this.errorQueue.length;
    const categories = {};
    const severities = {};
    
    this.errorQueue.forEach(error => {
      categories[error.category] = (categories[error.category] || 0) + 1;
      severities[error.severity] = (severities[error.severity] || 0) + 1;
    });
    
    return {
      total,
      categories,
      severities,
      recent: this.errorQueue.slice(-10)
    };
  }

  // Clear error queue
  clearErrorQueue() {
    this.errorQueue = [];
  }

  // Create error boundary handler
  createErrorBoundaryHandler(component) {
    return (error, errorInfo) => {
      this.handleError(error, {
        component,
        action: 'render_error',
        errorInfo: errorInfo.componentStack
      });
    };
  }
}

// Create singleton instance
export const errorHandlingService = new ErrorHandlingService();

// Convenience functions for common error patterns
export const handleAsyncError = async (operation, context) => {
  try {
    return await operation();
  } catch (error) {
    await errorHandlingService.handleError(error, context);
    throw error; // Re-throw so calling code can handle as needed
  }
};

export const handleAsyncErrorWithRetry = async (operation, context, maxRetries = 3) => {
  return await errorHandlingService.retryOperation(operation, maxRetries);
};

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, context = {}) => {
    return errorHandlingService.handleError(error, context);
  }, []);

  const retryOperation = React.useCallback((operation, maxRetries = 3) => {
    return errorHandlingService.retryOperation(operation, maxRetries);
  }, []);

  return {
    handleError,
    retryOperation,
    getErrorStatistics: () => errorHandlingService.getErrorStatistics(),
    clearErrors: () => errorHandlingService.clearErrorQueue()
  };
};

export default errorHandlingService;