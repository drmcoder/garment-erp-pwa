// Optimized Firebase Services - Only actively used services
// Reduced from ~2900 lines to essential services only

import {
  db,
  auth,
  COLLECTIONS,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "../config/firebase";

// User Activity Logging Service
export class ActivityLogService {
  static async logActivity(userId, action, details = {}) {
    try {
      console.log('🔍 Attempting to log activity:', { userId, action, details });
      const currentUser = auth.currentUser;
      console.log('🔍 Current auth user:', currentUser?.uid);
      
      await addDoc(collection(db, 'activity_logs'), {
        userId,
        action,
        details,
        timestamp: serverTimestamp(),
        ip: await this.getClientIP()
      });
      console.log('✅ Activity logged successfully');
    } catch (error) {
      console.error('❌ Error logging activity:', {
        code: error.code,
        message: error.message,
        userId,
        action,
        isAuthenticated: !!auth.currentUser
      });
    }
  }

  static async getClientIP() {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const networkInfo = connection ? `${connection.effectiveType}-${connection.downlink}mbps` : 'unknown';
      return `local-${networkInfo}`;
    } catch {
      return 'local-unknown';
    }
  }

  static async getUserActivity(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'activity_logs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }
}

// Bundle Service - Essential bundle operations
export class BundleService {
  static async getAllBundles() {
    try {
      const bundlesRef = collection(db, COLLECTIONS.BUNDLES);
      const snapshot = await getDocs(query(bundlesRef, orderBy('createdAt', 'desc')));
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        firebaseId: doc.id
      }));
    } catch (error) {
      console.error('Error fetching bundles:', error);
      return [];
    }
  }

  static async getBundleById(bundleId) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
      const bundleSnap = await getDoc(bundleRef);
      
      if (bundleSnap.exists()) {
        return { id: bundleSnap.id, ...bundleSnap.data() };
      } else {
        console.log('No bundle found with ID:', bundleId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching bundle:', error);
      return null;
    }
  }

  static async updateBundle(bundleId, updates) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
      await updateDoc(bundleRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Bundle updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating bundle:', error);
      return { success: false, error: error.message };
    }
  }

  static async createBundle(bundleData) {
    try {
      const bundlesRef = collection(db, COLLECTIONS.BUNDLES);
      const docRef = await addDoc(bundlesRef, {
        ...bundleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Bundle created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating bundle:', error);
      return { success: false, error: error.message };
    }
  }
}

// Operator Service - Essential operator operations
export class OperatorService {
  static async getAllOperators() {
    try {
      const operatorsRef = collection(db, COLLECTIONS.OPERATORS);
      const snapshot = await getDocs(operatorsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        firebaseId: doc.id
      }));
    } catch (error) {
      console.error('Error fetching operators:', error);
      return [];
    }
  }

  static async getOperatorById(operatorId) {
    try {
      const operatorRef = doc(db, COLLECTIONS.OPERATORS, operatorId);
      const operatorSnap = await getDoc(operatorRef);
      
      if (operatorSnap.exists()) {
        return { id: operatorSnap.id, ...operatorSnap.data() };
      } else {
        console.log('No operator found with ID:', operatorId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching operator:', error);
      return null;
    }
  }

  static async updateOperator(operatorId, updates) {
    try {
      const operatorRef = doc(db, COLLECTIONS.OPERATORS, operatorId);
      await updateDoc(operatorRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Operator updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating operator:', error);
      return { success: false, error: error.message };
    }
  }

  static async createOperator(operatorData) {
    try {
      const operatorsRef = collection(db, COLLECTIONS.OPERATORS);
      const docRef = await addDoc(operatorsRef, {
        ...operatorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Operator created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating operator:', error);
      return { success: false, error: error.message };
    }
  }
}

// WIP Service - Work In Progress management
export class WIPService {
  static async getAllWorkItems() {
    try {
      const workItemsRef = collection(db, COLLECTIONS.WORK_ITEMS);
      const snapshot = await getDocs(query(workItemsRef, orderBy('createdAt', 'desc')));
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        firebaseId: doc.id
      }));
    } catch (error) {
      console.error('Error fetching work items:', error);
      return [];
    }
  }

  static async getWorkItemsByOperator(operatorId) {
    try {
      const workItemsRef = collection(db, COLLECTIONS.WORK_ITEMS);
      const q = query(workItemsRef, where('operatorId', '==', operatorId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching operator work items:', error);
      return [];
    }
  }

  static async updateWorkItem(workItemId, updates) {
    try {
      const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
      await updateDoc(workItemRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Work item updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating work item:', error);
      return { success: false, error: error.message };
    }
  }

  static async createWorkItem(workItemData) {
    try {
      const workItemsRef = collection(db, COLLECTIONS.WORK_ITEMS);
      const docRef = await addDoc(workItemsRef, {
        ...workItemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Work item created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating work item:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteWorkItem(workItemId) {
    try {
      const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
      await deleteDoc(workItemRef);
      console.log('Work item deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting work item:', error);
      return { success: false, error: error.message };
    }
  }
}

// Configuration Service - System settings
export class ConfigService {
  static async getConfig(configKey) {
    try {
      const configRef = doc(db, 'system_config', configKey);
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        return { success: true, data: configSnap.data() };
      } else {
        console.log('No config found with key:', configKey);
        return { success: false, error: 'Config not found' };
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      return { success: false, error: error.message };
    }
  }

  static async setConfig(configKey, configData) {
    try {
      const configRef = doc(db, 'system_config', configKey);
      await updateDoc(configRef, {
        ...configData,
        updatedAt: serverTimestamp()
      });
      console.log('Config updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating config:', error);
      return { success: false, error: error.message };
    }
  }
}

// Production Service - Production metrics and reporting
export class ProductionService {
  static async getProductionStats(dateRange = null) {
    try {
      let q = collection(db, 'work_completions');
      
      if (dateRange) {
        q = query(q, 
          where('completedAt', '>=', dateRange.start),
          where('completedAt', '<=', dateRange.end),
          orderBy('completedAt', 'desc')
        );
      } else {
        q = query(q, orderBy('completedAt', 'desc'), limit(100));
      }
      
      const snapshot = await getDocs(q);
      const completions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate basic stats
      const totalPieces = completions.reduce((sum, c) => sum + (c.pieces || 0), 0);
      const totalEarnings = completions.reduce((sum, c) => sum + (c.earnings || 0), 0);
      const averageQuality = completions.length > 0 
        ? completions.reduce((sum, c) => sum + (c.quality || 100), 0) / completions.length 
        : 100;
      
      return {
        success: true,
        data: {
          completions,
          summary: {
            totalCompletions: completions.length,
            totalPieces,
            totalEarnings,
            averageQuality: Math.round(averageQuality * 100) / 100
          }
        }
      };
    } catch (error) {
      console.error('Error fetching production stats:', error);
      return { success: false, error: error.message };
    }
  }

  static async recordWorkCompletion(completionData) {
    try {
      const completionsRef = collection(db, 'work_completions');
      const docRef = await addDoc(completionsRef, {
        ...completionData,
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      console.log('Work completion recorded with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error recording work completion:', error);
      return { success: false, error: error.message };
    }
  }
}

// Work Assignment Service - Simplified assignment operations
export class WorkAssignmentService {
  static async assignWork(operatorId, workData) {
    try {
      const assignmentsRef = collection(db, 'work_assignments');
      const assignmentData = {
        operatorId,
        workData,
        assignedAt: serverTimestamp(),
        status: 'assigned',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(assignmentsRef, assignmentData);
      console.log('Work assigned with ID:', docRef.id);
      
      return { success: true, id: docRef.id, data: assignmentData };
    } catch (error) {
      console.error('Error assigning work:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAssignmentsByOperator(operatorId) {
    try {
      const assignmentsRef = collection(db, 'work_assignments');
      const q = query(
        assignmentsRef, 
        where('operatorId', '==', operatorId),
        orderBy('assignedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  }

  static async updateAssignmentStatus(assignmentId, status, updates = {}) {
    try {
      const assignmentRef = doc(db, 'work_assignments', assignmentId);
      await updateDoc(assignmentRef, {
        status,
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      console.log('Assignment status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating assignment:', error);
      return { success: false, error: error.message };
    }
  }
}

// Notification Service - Simplified notifications
export class NotificationService {
  static async createNotification(notificationData) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false
      });
      
      console.log('Notification created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUserNotifications(userId) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
}

// All services are already exported individually above
// No need for re-export as they're already exported as classes