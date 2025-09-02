// src/lib/index.js
// Main utilities export - centralized access to all app utilities

// Import all utilities
export * from './appUtils';
export * from './serviceUtils';
export * from './businessLogic';
export * from './workflowManager';
export * from './dataProcessor';

// Import default exports with specific names
export { default as AppUtils } from './appUtils';
export { default as ServiceUtils } from './serviceUtils';
export { default as BusinessLogic } from './businessLogic';
export { default as WorkflowManager } from './workflowManager';
export { default as DataProcessor } from './dataProcessor';

// Re-export commonly used utilities for convenience
export {
  roleUtils,
  statusUtils,
  envUtils,
  arrayUtils,
  dateUtils,
  validationUtils,
  formatUtils,
  storageUtils
} from './appUtils';

export {
  httpUtils,
  firebaseUtils,
  cacheUtils,
  errorUtils,
  transformUtils
} from './serviceUtils';

export {
  paymentLogic,
  workAssignmentLogic,
  bundleLogic,
  qualityLogic,
  metricsLogic
} from './businessLogic';

export {
  workflowStateManager,
  wipManager,
  operationSequencer,
  bundleFlowManager
} from './workflowManager';

export {
  dataAggregator,
  dataFilter,
  dataTransformer,
  dataValidator
} from './dataProcessor';

// Common combinations that are frequently used together
export const commonUtils = {
  // User and role related
  user: {
    isOperator: (role) => role === 'operator',
    isSupervisor: (role) => role === 'supervisor',
    canManageWork: (role) => ['supervisor', 'manager', 'admin'].includes(role)
  },
  
  // Data validation and formatting
  format: {
    date: (date) => new Date(date).toLocaleDateString(),
    currency: (amount) => new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(amount),
    percentage: (value) => `${(value * 100).toFixed(1)}%`
  },
  
  // Common status checks
  status: {
    isActive: (status) => ['active', 'in_progress', 'ongoing'].includes(status),
    isCompleted: (status) => status === 'completed',
    isPending: (status) => ['pending', 'waiting', 'queued'].includes(status)
  }
};

// Helper for environment-based feature flags
export const featureFlags = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isFeatureEnabled: (featureName) => {
    const features = process.env.REACT_APP_FEATURES?.split(',') || [];
    return features.includes(featureName) || process.env.NODE_ENV === 'development';
  }
};

// Debug utilities for development
export const debugUtils = {
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  
  warn: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEBUG]', ...args);
    }
  },
  
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  
  time: (label) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[DEBUG] ${label}`);
    }
  },
  
  timeEnd: (label) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[DEBUG] ${label}`);
    }
  }
};