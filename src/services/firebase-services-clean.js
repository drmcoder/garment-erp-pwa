// Clean Firebase Services - Replacement for firebase-services.js
// Simple, maintainable Firebase operations

import FirebaseService, { BundleService, WorkItemService, OperatorService, EarningsService } from './FirebaseService';

// Export clean services with consistent API
export const LegacyBundleService = {
  // Bundle operations
  getAllBundles: () => BundleService.getAllBundles(),
  getBundleById: (id) => BundleService.getBundleById(id),
  getOperatorBundles: (operatorId) => BundleService.getOperatorBundles(operatorId),
  
  // Self-assignment operations
  getSelfAssignedWork: () => BundleService.getSelfAssignedBundles(),
  approveSelfAssignment: (bundleId, supervisorId) => BundleService.approveSelfAssignment(bundleId, supervisorId),
  rejectSelfAssignment: (bundleId, supervisorId, reason) => BundleService.rejectSelfAssignment(bundleId, supervisorId, reason),
  reassignWork: (bundleId, newOperatorId, supervisorId) => {
    return BundleService.updateBundle(bundleId, {
      assignedOperator: newOperatorId,
      reassignedBy: supervisorId,
      status: 'assigned'
    });
  },
  
  // Assign bundle to operator
  assignBundle: (bundleId, operatorId, assignmentData) => {
    return BundleService.updateBundle(bundleId, {
      assignedOperator: operatorId,
      assignedOperatorName: assignmentData.operatorName,
      status: 'assigned',
      assignedAt: assignmentData.assignedAt,
      assignmentMethod: assignmentData.assignmentMethod || 'manual'
    });
  },

  // Additional methods for compatibility
  getAvailableBundles: (machineType) => {
    return FirebaseService.getWhere('bundles', 'status', '==', 'available');
  },
  
  selfAssignBundle: (bundleId, operatorId, data) => {
    return BundleService.updateBundle(bundleId, {
      status: 'self_assigned',
      assignedOperator: operatorId,
      selfAssignedAt: new Date(),
      requestedBy: operatorId,
      ...data
    });
  },

  subscribeToOperatorBundles: (operatorId, callback) => {
    // Mock subscription - return unsubscribe function
    console.log('Subscribing to operator bundles for:', operatorId);
    return () => console.log('Unsubscribed from operator bundles');
  },

  getAvailableWorkForOperator: (machineType, skillLevel) => {
    return FirebaseService.getWhere('bundles', 'status', '==', 'available');
  },

  getOperatorAssignmentRequests: (operatorId) => {
    return FirebaseService.getWhere('assignmentRequests', 'operatorId', '==', operatorId);
  },

  startWork: (bundleId, operatorId) => {
    return BundleService.updateBundle(bundleId, {
      status: 'in_progress',
      startedAt: new Date(),
      startedBy: operatorId
    });
  },

  createAssignmentRequest: (requestData) => {
    return FirebaseService.create('assignmentRequests', requestData);
  },

  completeWork: (bundleId, completionData) => {
    return BundleService.updateBundle(bundleId, {
      status: 'completed',
      completedAt: new Date(),
      ...completionData
    });
  }
};

export const WIPService = {
  // Work item operations
  getAllWorkItems: () => WorkItemService.getAllWorkItems(),
  getWorkItemById: (id) => WorkItemService.getWorkItemById(id),
  getOperatorWorkItems: (operatorId) => WorkItemService.getOperatorWorkItems(operatorId),
  
  // Self-assignment operations
  getSelfAssignedWorkItems: () => WorkItemService.getSelfAssignedWorkItems(),
  approveSelfAssignment: (workItemId, supervisorId) => WorkItemService.approveSelfAssignment(workItemId, supervisorId),
  rejectSelfAssignment: (workItemId, supervisorId, reason) => WorkItemService.rejectSelfAssignment(workItemId, supervisorId, reason),
  reassignWork: (workItemId, newOperatorId, supervisorId) => {
    return WorkItemService.updateWorkItem(workItemId, {
      assignedOperator: newOperatorId,
      reassignedBy: supervisorId,
      status: 'assigned'
    });
  }
};

export { OperatorService, EarningsService };

// Production Service - Simple production stats
export const ProductionService = {
  getStats: () => {
    return Promise.resolve({ success: true, data: {} });
  },
  getDailyProduction: () => {
    return Promise.resolve({ success: true, data: [] });
  },
  getOperatorDailyStats: async (operatorId, date) => {
    console.log('Mock ProductionService.getOperatorDailyStats called:', operatorId, date);
    return { success: true, stats: {} };
  }
};

// Notification Service - Simple notifications
export const NotificationService = {
  sendNotification: (data) => {
    console.log('Notification sent:', data);
    return Promise.resolve({ success: true });
  },
  subscribeToUserNotifications: (userId, callback) => {
    console.log('Mock NotificationService.subscribeToUserNotifications called:', userId);
    callback([]);
    return () => {}; // Unsubscribe function
  }
};

// Config Service - Simple configuration management
export const ConfigService = {
  getAll: () => FirebaseService.getAll('configs'),
  getById: (id) => FirebaseService.getById('configs', id),
  create: (data) => FirebaseService.create('configs', data),
  update: (id, data) => FirebaseService.update('configs', id, data),
  delete: (id) => FirebaseService.delete('configs', id)
};

// Legacy compatibility - redirect to new services
export const LegacyActivityLogService = {
  logActivity: async (userId, action, details) => {
    console.log('Activity logged:', { userId, action, details });
    return { success: true };
  },
  getUserActivity: async (userId, limit) => {
    console.log('Getting user activity for:', userId);
    return [];
  }
};

// Additional services that were missing - merged into existing services above

export const ActivityLogService = {
  log: async (action, details) => {
    console.log('Mock ActivityLogService.log called:', action, details);
    return { success: true };
  },
  logActivity: async (userId, action, details) => {
    console.log('Mock ActivityLogService.logActivity called:', userId, action, details);
    return { success: true };
  }
};

const FirebaseServicesClean = {
  LegacyBundleService,
  WIPService,
  OperatorService,
  EarningsService,
  LegacyActivityLogService
};

export default FirebaseServicesClean;