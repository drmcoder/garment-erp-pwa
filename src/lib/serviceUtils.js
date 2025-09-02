// src/lib/serviceUtils.js
// Centralized service utilities and common service logic

import { API_CONFIG, CACHE_CONFIG, NOTIFICATION_TYPES } from '../constants/appConstants';

// HTTP Request utilities
export const httpUtils = {
  // Create request options with common headers
  createRequestOptions: (method = 'GET', body = null, headers = {}) => {
    const options = {
      method,
      headers: {
        ...API_CONFIG.BASE_HEADERS,
        ...headers
      }
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    return options;
  },

  // Retry mechanism for failed requests
  retryRequest: async (requestFn, maxRetries = API_CONFIG.RETRY_ATTEMPTS) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Request attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      }
    }
    
    throw lastError;
  },

  // Handle API responses consistently
  handleResponse: async (response) => {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.statusText = response.statusText;
      
      try {
        const errorData = await response.json();
        error.data = errorData;
        error.message = errorData.message || error.message;
      } catch {
        // Response might not be JSON
      }
      
      throw error;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  }
};

// Firebase service utilities
export const firebaseUtils = {
  // Create consistent error handling for Firebase operations
  handleFirebaseError: (error, operation = 'Firebase operation') => {
    console.error(`${operation} failed:`, error);
    
    const errorMessages = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested resource was not found',
      'already-exists': 'The resource already exists',
      'unauthenticated': 'Authentication required',
      'unavailable': 'Service is temporarily unavailable',
      'deadline-exceeded': 'Operation timed out'
    };
    
    const message = errorMessages[error.code] || error.message || 'An unexpected error occurred';
    
    return {
      success: false,
      error: message,
      code: error.code || 'unknown'
    };
  },

  // Batch operations helper
  createBatchOperation: (db, operations = []) => {
    const batch = db.batch();
    
    operations.forEach(({ type, ref, data }) => {
      switch (type) {
        case 'set':
          batch.set(ref, data);
          break;
        case 'update':
          batch.update(ref, data);
          break;
        case 'delete':
          batch.delete(ref);
          break;
        default:
          console.warn('Unknown batch operation type:', type);
      }
    });
    
    return batch;
  },

  // Format Firebase timestamp
  formatTimestamp: (timestamp) => {
    if (!timestamp) return null;
    
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    
    return new Date(timestamp);
  }
};

// Cache service utilities
export const cacheUtils = {
  // Generate cache keys consistently
  generateKey: (prefix, ...params) => {
    return `${prefix}:${params.join(':')}`;
  },

  // Check if cache entry is expired
  isExpired: (entry, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
    if (!entry || !entry.timestamp) return true;
    return Date.now() - entry.timestamp > ttl;
  },

  // Create cache entry with timestamp
  createEntry: (data, timestamp = Date.now()) => ({
    data,
    timestamp
  }),

  // Clean expired entries from cache object
  cleanExpiredEntries: (cache, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
    const now = Date.now();
    const cleaned = {};
    
    Object.entries(cache).forEach(([key, entry]) => {
      if (entry.timestamp && (now - entry.timestamp <= ttl)) {
        cleaned[key] = entry;
      }
    });
    
    return cleaned;
  }
};

// Notification service utilities
export const notificationUtils = {
  // Create notification objects with consistent structure
  createNotification: (type, message, data = {}) => ({
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type || NOTIFICATION_TYPES.INFO,
    message,
    data,
    timestamp: Date.now(),
    read: false
  }),

  // Filter notifications by type
  filterByType: (notifications, type) => {
    return notifications.filter(notification => notification.type === type);
  },

  // Mark notifications as read
  markAsRead: (notifications, notificationIds) => {
    return notifications.map(notification => ({
      ...notification,
      read: notificationIds.includes(notification.id) ? true : notification.read
    }));
  },

  // Get unread count
  getUnreadCount: (notifications) => {
    return notifications.filter(notification => !notification.read).length;
  }
};

// Queue service utilities
export const queueUtils = {
  // Create queue entry with priority
  createQueueEntry: (data, priority = 3) => ({
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    data,
    priority,
    timestamp: Date.now(),
    attempts: 0,
    status: 'pending'
  }),

  // Sort queue by priority and timestamp
  sortQueue: (queue) => {
    return [...queue].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower number = higher priority
      }
      return a.timestamp - b.timestamp; // Earlier timestamp first
    });
  },

  // Filter queue by status
  filterByStatus: (queue, status) => {
    return queue.filter(entry => entry.status === status);
  },

  // Update queue entry status
  updateStatus: (queue, entryId, status, error = null) => {
    return queue.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          status,
          error,
          lastUpdated: Date.now()
        };
      }
      return entry;
    });
  }
};

// Data transformation utilities
export const transformUtils = {
  // Transform Firestore document to plain object
  firestoreDocToObject: (doc) => {
    if (!doc.exists()) return null;
    
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Transform timestamps
      ...(data.createdAt && { createdAt: firebaseUtils.formatTimestamp(data.createdAt) }),
      ...(data.updatedAt && { updatedAt: firebaseUtils.formatTimestamp(data.updatedAt) })
    };
  },

  // Transform array of Firestore documents
  firestoreCollectionToArray: (querySnapshot) => {
    return querySnapshot.docs.map(transformUtils.firestoreDocToObject);
  },

  // Transform object for Firestore (remove undefined values)
  objectToFirestore: (obj) => {
    const cleaned = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof Date) {
          cleaned[key] = value; // Firestore handles Date objects
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          cleaned[key] = transformUtils.objectToFirestore(value);
        } else {
          cleaned[key] = value;
        }
      }
    });
    
    return cleaned;
  }
};

// Error handling utilities
export const errorUtils = {
  // Create standardized error response
  createError: (message, code = 'UNKNOWN_ERROR', data = null) => ({
    success: false,
    error: message,
    code,
    data,
    timestamp: Date.now()
  }),

  // Create success response
  createSuccess: (data = null, message = 'Operation successful') => ({
    success: true,
    data,
    message,
    timestamp: Date.now()
  }),

  // Log error with context
  logError: (error, context = {}) => {
    console.error('Service Error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  },

  // Check if error is retryable
  isRetryableError: (error) => {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'internal'
    ];
    
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    
    return retryableCodes.includes(error.code) || 
           retryableStatuses.includes(error.status);
  }
};

// Export all utilities
export default {
  httpUtils,
  firebaseUtils,
  cacheUtils,
  notificationUtils,
  queueUtils,
  transformUtils,
  errorUtils
};