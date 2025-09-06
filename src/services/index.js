// Services Index
// Central export point for all application services

import ActivityLogService from './core/activity-service';
import AuthService from './core/auth-service';
import BundleService from './business/bundle-service';

// Core Services
export { FirebaseBaseService, FirebaseUtils, COLLECTIONS } from './core/firebase-base';

export { ActivityLogService, AuthService, BundleService };
export { default as WIPService } from './business/wip-service';

// Legacy Services (to be refactored)
export * from './firebase-services-clean'; // Clean Firebase services

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