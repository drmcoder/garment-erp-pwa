// Activity Logging Service
// Handles user activity tracking and logging

import { FirebaseBaseService, FirebaseUtils, COLLECTIONS } from './firebase-base';
import { auth } from "../../config/firebase";

export class ActivityLogService extends FirebaseBaseService {
  constructor() {
    super('activity_logs');
  }

  /**
   * Log user activity
   */
  static async logActivity(userId, action, details = {}) {
    try {
      console.log('🔍 Attempting to log activity:', { userId, action, details });
      const currentUser = auth.currentUser;
      console.log('🔍 Current auth user:', currentUser?.uid);
      
      const service = new ActivityLogService();
      const result = await service.create({
        userId,
        action,
        details,
        ip: await this.getClientIP(),
      });

      if (result.success) {
        console.log('✅ Activity logged successfully');
      } else {
        console.error('❌ Failed to log activity:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error logging activity:', {
        code: error.code,
        message: error.message,
        userId,
        action,
        isAuthenticated: !!auth.currentUser
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client IP (privacy-compliant local network info)
   */
  static async getClientIP() {
    try {
      // Use local network information instead of external service to comply with CSP
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const networkInfo = connection ? `${connection.effectiveType}-${connection.downlink}mbps` : 'unknown';
      return `local-${networkInfo}`;
    } catch {
      return 'local-unknown';
    }
  }

  /**
   * Get user activity history
   */
  static async getUserActivity(userId, limitCount = 50) {
    try {
      const service = new ActivityLogService();
      const result = await service.getAll([
        FirebaseUtils.whereEqual('userId', userId),
        FirebaseUtils.orderDesc('createdAt'),
        FirebaseUtils.limitResults(limitCount)
      ]);

      return result;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Get activity summary for a user
   */
  static async getActivitySummary(userId, days = 30) {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      
      const service = new ActivityLogService();
      const result = await service.getAll([
        FirebaseUtils.whereEqual('userId', userId),
        FirebaseUtils.whereGreater('createdAt', daysAgo),
        FirebaseUtils.orderDesc('createdAt')
      ]);

      if (result.success) {
        // Aggregate activity by action type
        const summary = result.data.reduce((acc, activity) => {
          const action = activity.action;
          acc[action] = (acc[action] || 0) + 1;
          return acc;
        }, {});

        return { success: true, summary, totalActivities: result.data.length };
      }

      return result;
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear old activity logs (for data retention)
   */
  static async clearOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const service = new ActivityLogService();
      const result = await service.getAll([
        FirebaseUtils.whereLess('createdAt', cutoffDate)
      ]);

      if (result.success && result.data.length > 0) {
        const batchOperations = result.data.map(log => ({
          type: 'delete',
          docId: log.id
        }));

        const batchResult = await service.batchWrite(batchOperations);
        
        if (batchResult.success) {
          console.log(`🧹 Cleaned up ${result.data.length} old activity logs`);
        }

        return batchResult;
      }

      return { success: true, message: 'No old logs to clean up' };
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return { success: false, error: error.message };
    }
  }
}

export default ActivityLogService;