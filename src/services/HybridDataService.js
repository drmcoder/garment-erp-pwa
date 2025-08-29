// File: src/services/HybridDataService.js
// Hybrid data service that uses both Firestore and Realtime Database optimally

import { rtdb, RT_PATHS, realtimeHelpers } from '../config/realtime-firebase';
import { cacheService } from './CacheService';
import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  COLLECTIONS 
} from '../config/firebase';

class HybridDataService {
  constructor() {
    this.activeListeners = new Map();
    this.presenceService = null;
  }

  // ==== OPERATOR STATUS MANAGEMENT ====
  
  // Update operator status in Realtime Database (frequent updates)
  async updateOperatorStatus(operatorId, statusData) {
    const path = `${RT_PATHS.OPERATOR_STATUS}/${operatorId}`;
    
    const result = await realtimeHelpers.setWithTimestamp(path, {
      id: operatorId,
      status: statusData.status, // active, idle, working, break
      currentWork: statusData.currentWork || null,
      efficiency: statusData.efficiency || 0,
      lastActivity: new Date().toISOString(),
      stationId: statusData.stationId || null,
      machineType: statusData.machineType || null
    });

    if (result.success) {
      console.log(`🔄 Updated operator ${operatorId} status in Realtime DB`);
    }

    return result;
  }

  // Get operator status from Realtime Database
  async getOperatorStatus(operatorId) {
    const path = `${RT_PATHS.OPERATOR_STATUS}/${operatorId}`;
    return realtimeHelpers.getData(path);
  }

  // Get all operator statuses
  async getAllOperatorStatuses() {
    return realtimeHelpers.getData(RT_PATHS.OPERATOR_STATUS);
  }

  // Subscribe to operator status changes
  subscribeToOperatorStatus(operatorId, callback) {
    const path = operatorId 
      ? `${RT_PATHS.OPERATOR_STATUS}/${operatorId}`
      : RT_PATHS.OPERATOR_STATUS;
      
    const unsubscribe = realtimeHelpers.subscribe(path, callback);
    this.activeListeners.set(`operator_status_${operatorId || 'all'}`, unsubscribe);
    
    return unsubscribe;
  }

  // ==== WORK PROGRESS TRACKING ====
  
  // Update work progress in Realtime Database
  async updateWorkProgress(workId, progressData) {
    const path = `${RT_PATHS.WORK_PROGRESS}/${workId}`;
    
    return realtimeHelpers.setWithTimestamp(path, {
      workId,
      operatorId: progressData.operatorId,
      bundleId: progressData.bundleId,
      completedPieces: progressData.completedPieces || 0,
      totalPieces: progressData.totalPieces || 0,
      startTime: progressData.startTime,
      estimatedCompletion: progressData.estimatedCompletion,
      status: progressData.status // in-progress, completed, paused
    });
  }

  // Subscribe to work progress updates
  subscribeToWorkProgress(workId, callback) {
    const path = workId 
      ? `${RT_PATHS.WORK_PROGRESS}/${workId}`
      : RT_PATHS.WORK_PROGRESS;
      
    const unsubscribe = realtimeHelpers.subscribe(path, callback);
    this.activeListeners.set(`work_progress_${workId || 'all'}`, unsubscribe);
    
    return unsubscribe;
  }

  // ==== LIVE METRICS & COUNTERS ====
  
  // Update live production metrics
  async updateLiveMetrics(metricsData) {
    const path = RT_PATHS.LIVE_METRICS;
    
    return realtimeHelpers.setWithTimestamp(path, {
      totalProduction: metricsData.totalProduction || 0,
      activeOperators: metricsData.activeOperators || 0,
      averageEfficiency: metricsData.averageEfficiency || 0,
      completedBundles: metricsData.completedBundles || 0,
      qualityScore: metricsData.qualityScore || 0,
      hourlyRate: metricsData.hourlyRate || 0
    });
  }

  // Subscribe to live metrics
  subscribeToLiveMetrics(callback) {
    const unsubscribe = realtimeHelpers.subscribe(RT_PATHS.LIVE_METRICS, callback);
    this.activeListeners.set('live_metrics', unsubscribe);
    return unsubscribe;
  }

  // ==== STATION STATUS MONITORING ====
  
  // Update station status
  async updateStationStatus(stationId, statusData) {
    const path = `${RT_PATHS.STATION_STATUS}/${stationId}`;
    
    return realtimeHelpers.setWithTimestamp(path, {
      stationId,
      operatorId: statusData.operatorId || null,
      status: statusData.status, // active, idle, maintenance, offline
      currentWork: statusData.currentWork || null,
      efficiency: statusData.efficiency || 0,
      machineType: statusData.machineType,
      lastMaintenance: statusData.lastMaintenance
    });
  }

  // Subscribe to station status updates
  subscribeToStationStatus(stationId, callback) {
    const path = stationId 
      ? `${RT_PATHS.STATION_STATUS}/${stationId}`
      : RT_PATHS.STATION_STATUS;
      
    const unsubscribe = realtimeHelpers.subscribe(path, callback);
    this.activeListeners.set(`station_status_${stationId || 'all'}`, unsubscribe);
    
    return unsubscribe;
  }

  // ==== REAL-TIME NOTIFICATIONS ====
  
  // Send real-time notification
  async sendRealtimeNotification(notificationData) {
    const path = RT_PATHS.NOTIFICATIONS;
    
    return realtimeHelpers.pushData(path, {
      type: notificationData.type,
      message: notificationData.message,
      targetUser: notificationData.targetUser || null,
      targetRole: notificationData.targetRole || null,
      priority: notificationData.priority || 'normal',
      read: false,
      data: notificationData.data || {}
    });
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId, callback) {
    const unsubscribe = realtimeHelpers.subscribe(RT_PATHS.NOTIFICATIONS, (snapshot) => {
      if (snapshot.exists()) {
        const notifications = [];
        snapshot.forEach((child) => {
          const notif = child.val();
          // Filter notifications for this user
          if (!notif.targetUser || notif.targetUser === userId) {
            notifications.push({ id: child.key, ...notif });
          }
        });
        callback(notifications);
      }
    });
    
    this.activeListeners.set(`notifications_${userId}`, unsubscribe);
    return unsubscribe;
  }

  // ==== HYBRID DATA OPERATIONS ====
  
  // Get operator data (Firestore profile + Realtime status)
  async getHybridOperatorData(operatorId) {
    try {
      // Get profile from Firestore (cached)
      const profileResult = await cacheService.getOperators(true);
      const profile = profileResult.data?.find(op => op.id === operatorId);
      
      // Get live status from Realtime Database
      const statusResult = await this.getOperatorStatus(operatorId);
      const liveStatus = statusResult.data;
      
      return {
        success: true,
        data: {
          profile,
          liveStatus,
          hybrid: true
        }
      };
    } catch (error) {
      console.error('❌ Error getting hybrid operator data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get dashboard data (hybrid approach)
  async getHybridDashboardData() {
    try {
      const [
        operatorProfiles,
        operatorStatuses,
        liveMetrics,
        stationStatuses
      ] = await Promise.all([
        cacheService.getOperators(true), // Firestore cached
        this.getAllOperatorStatuses(), // Realtime DB
        realtimeHelpers.getData(RT_PATHS.LIVE_METRICS), // Realtime DB
        realtimeHelpers.getData(RT_PATHS.STATION_STATUS) // Realtime DB
      ]);

      return {
        success: true,
        data: {
          operatorProfiles: operatorProfiles.data || [],
          operatorStatuses: operatorStatuses.data || {},
          liveMetrics: liveMetrics.data || {},
          stationStatuses: stationStatuses.data || {},
          fromCache: operatorProfiles.fromCache
        }
      };
    } catch (error) {
      console.error('❌ Error getting hybrid dashboard data:', error);
      return { success: false, error: error.message };
    }
  }

  // ==== BACKGROUND SYNC OPERATIONS ====
  
  // Sync critical Realtime data to Firestore (for backup/history)
  async syncToFirestore(operatorId, workData) {
    try {
      // Only sync completed work to Firestore for historical records
      if (workData.status === 'completed') {
        const docRef = doc(db, 'production_history', `${operatorId}_${Date.now()}`);
        
        await setDoc(docRef, {
          operatorId,
          completedAt: new Date(),
          pieces: workData.completedPieces,
          efficiency: workData.efficiency,
          workDuration: workData.workDuration,
          bundleId: workData.bundleId
        });
        
        console.log('📚 Synced completed work to Firestore history');
      }
    } catch (error) {
      console.error('❌ Error syncing to Firestore:', error);
    }
  }

  // ==== CLEANUP METHODS ====
  
  // Unsubscribe from specific listener
  unsubscribe(listenerId) {
    const unsubscribe = this.activeListeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(listenerId);
      console.log(`🔇 Unsubscribed from ${listenerId}`);
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.activeListeners.forEach((unsubscribe, listenerId) => {
      unsubscribe();
      console.log(`🔇 Unsubscribed from ${listenerId}`);
    });
    this.activeListeners.clear();
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      activeListeners: this.activeListeners.size,
      listenerTypes: Array.from(this.activeListeners.keys())
    };
  }
}

// Export singleton instance
export const hybridDataService = new HybridDataService();
export default hybridDataService;