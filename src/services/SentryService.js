// File: src/services/SentryService.js
// Sentry Error Reporting Service Integration

import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

class SentryService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize Sentry with configuration
  initialize() {
    if (this.isInitialized) return;

    try {
      Sentry.init({
        // Your actual Sentry DSN
        dsn: process.env.REACT_APP_SENTRY_DSN || "https://f7e72b6c5ed0349f8c2a94af38b489e4@o4509939948126208.ingest.us.sentry.io/4509939954614273",
        
        // App configuration
        environment: process.env.NODE_ENV,
        release: process.env.REACT_APP_VERSION || '1.0.0',
        
        // Integrations
        integrations: [
          new Integrations.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: false, // Be careful with sensitive data
            blockAllMedia: false,
          }),
        ],
        
        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        // Session replay (for debugging UX issues)
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        
        // Filter out noise
        beforeSend(event) {
          // Don't send errors in development unless explicitly enabled
          if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_SENTRY_DEV) {
            console.log('🔍 Sentry would send:', event);
            return null; // Don't send in dev
          }
          return event;
        },

        // Ignore common non-critical errors
        ignoreErrors: [
          'Non-Error promise rejection captured',
          'ResizeObserver loop limit exceeded',
          'Script error',
          'Network request failed',
          'Loading chunk',
          'ChunkLoadError',
        ],
      });

      this.isInitialized = true;
      console.log('✅ Sentry initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  // Report custom error
  reportError(error, context = {}) {
    if (!this.isInitialized) {
      console.warn('⚠️ Sentry not initialized, logging error:', error);
      return;
    }

    try {
      Sentry.withScope((scope) => {
        // Add context information
        if (context.user) {
          scope.setUser(context.user);
        }
        if (context.tags) {
          Object.keys(context.tags).forEach(key => {
            scope.setTag(key, context.tags[key]);
          });
        }
        if (context.extra) {
          scope.setContext('extra', context.extra);
        }
        if (context.level) {
          scope.setLevel(context.level);
        }

        // Report the error
        Sentry.captureException(error);
      });
      
      console.log('📤 Error reported to Sentry:', error.message);
    } catch (sentryError) {
      console.error('❌ Failed to report error to Sentry:', sentryError);
    }
  }

  // Report custom message/event
  reportMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) {
      console.log('📝 Sentry message (not sent):', message);
      return;
    }

    try {
      Sentry.withScope((scope) => {
        scope.setLevel(level);
        
        if (context.user) {
          scope.setUser(context.user);
        }
        if (context.tags) {
          Object.keys(context.tags).forEach(key => {
            scope.setTag(key, context.tags[key]);
          });
        }
        if (context.extra) {
          scope.setContext('extra', context.extra);
        }

        Sentry.captureMessage(message);
      });
      
      console.log(`📤 Message reported to Sentry: ${message}`);
    } catch (error) {
      console.error('❌ Failed to report message to Sentry:', error);
    }
  }

  // Set user context
  setUser(userInfo) {
    if (!this.isInitialized) return;
    
    try {
      Sentry.setUser({
        id: userInfo.id || userInfo.username,
        username: userInfo.username,
        name: userInfo.name || userInfo.nameEn,
        role: userInfo.role,
      });
      console.log('👤 Sentry user context set:', userInfo.username);
    } catch (error) {
      console.error('❌ Failed to set Sentry user context:', error);
    }
  }

  // Add breadcrumb (for debugging trail)
  addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
    if (!this.isInitialized) return;
    
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      console.error('❌ Failed to add Sentry breadcrumb:', error);
    }
  }

  // Start a transaction (for performance monitoring)
  startTransaction(name, op = 'navigation') {
    if (!this.isInitialized) return null;
    
    try {
      return Sentry.startTransaction({ name, op });
    } catch (error) {
      console.error('❌ Failed to start Sentry transaction:', error);
      return null;
    }
  }

  // Test error reporting
  testError() {
    this.reportError(new Error('Sentry Test Error - Integration Working!'), {
      tags: { test: true, component: 'SentryService' },
      extra: { timestamp: new Date().toISOString() }
    });
  }
}

// Export singleton instance
export const sentryService = new SentryService();
export default sentryService;