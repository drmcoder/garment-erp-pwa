// Services Index - Export all services for easy importing
import {
  AuthService,
  BundleService,
  NotificationService,
  ProductionService,
  QualityService,
} from './firebase-services';

import FirebaseSetupService, { initializeIfNeeded } from './firebase-setup';

// Export all services
export {
  AuthService,
  BundleService,
  NotificationService,
  ProductionService,
  QualityService,
  FirebaseSetupService,
  initializeIfNeeded,
};

// Default export for convenience
export default {
  Auth: AuthService,
  Bundle: BundleService,
  Notification: NotificationService,
  Production: ProductionService,
  Quality: QualityService,
  Setup: FirebaseSetupService,
};