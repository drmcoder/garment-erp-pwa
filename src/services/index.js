// Services Index
// Central export point for all application services

// Core Services
export { FirebaseBaseService, FirebaseUtils, COLLECTIONS } from './core/firebase-base';
export { default as ActivityLogService } from './core/activity-service';
export { default as AuthService } from './core/auth-service';

// Business Services
export { default as BundleService } from './business/bundle-service';

// Legacy Services (to be refactored)
export * from './firebase-services'; // Temporary until full migration

// Utility function to detect if we're using new modular services
export const isModularServicesEnabled = () => {
  return process.env.REACT_APP_USE_MODULAR_SERVICES === 'true';
};

// Migration helper - gradually replace old service calls
export const getService = (serviceName) => {
  const serviceMap = {
    'ActivityLogService': ActivityLogService,
    'AuthService': AuthService,
    'BundleService': BundleService,
  };

  return serviceMap[serviceName] || null;
};