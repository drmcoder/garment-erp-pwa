// File: src/services/WorkQueueService.js
// Queue-based work assignment for handling high contention periods

import { rtdb, RT_PATHS, realtimeHelpers } from '../config/realtime-firebase';
import { ref, push, onValue, query, orderByChild, remove } from 'firebase/database';

class WorkQueueService {
  constructor() {
    this.processingQueues = new Map();
    this.queueProcessors = new Map();
  }

  // Add assignment request to queue
  async addToAssignmentQueue(workId, operatorId, operatorInfo, priority = 1) {
    const queuePath = `${RT_PATHS.ASSIGNMENT_QUEUE}/${workId}`;
    
    const queueData = {
      workId,
      operatorId,
      operatorName: operatorInfo.name,
      operatorMachine: operatorInfo.machineType,
      requestTime: Date.now(),
      priority, // 1 = highest, 5 = lowest
      status: 'pending'
    };

    try {
      const result = await realtimeHelpers.pushData(queuePath, queueData);
      
      if (result.success) {
        console.log(`📥 Added to assignment queue: ${workId} → ${operatorId} (${result.key})`);
        
        // Start processing this queue if not already running
        this.startQueueProcessor(workId);
        
        return { success: true, queueId: result.key };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to add to assignment queue:', error);
      return { success: false, error: error.message };
    }
  }

  // Process assignment queue for a specific work item
  startQueueProcessor(workId) {
    if (this.queueProcessors.has(workId)) {
      return; // Already processing
    }

    const queueRef = ref(rtdb, `${RT_PATHS.ASSIGNMENT_QUEUE}/${workId}`);
    const orderedQuery = query(queueRef, orderByChild('requestTime'));

    console.log(`🔄 Starting queue processor for work: ${workId}`);

    const unsubscribe = onValue(orderedQuery, async (snapshot) => {
      if (!snapshot.exists()) {
        // No more requests, stop processor
        this.stopQueueProcessor(workId);
        return;
      }

      const requests = [];
      snapshot.forEach((child) => {
        const request = { id: child.key, ...child.val() };
        if (request.status === 'pending') {
          requests.push(request);
        }
      });

      if (requests.length === 0) return;

      // Sort by priority then by time
      requests.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower number = higher priority
        }
        return a.requestTime - b.requestTime; // Earlier request wins
      });

      const winnerRequest = requests[0];
      console.log(`🏆 Processing winner: ${winnerRequest.operatorId} for work: ${workId}`);

      // Attempt to assign work to winner
      const { WorkAssignmentService } = await import('./WorkAssignmentService');
      const result = await WorkAssignmentService.atomicSelfAssign(
        workId,
        winnerRequest.operatorId,
        {
          name: winnerRequest.operatorName,
          machineType: winnerRequest.operatorMachine
        }
      );

      if (result.success) {
        console.log(`✅ Queue assignment successful: ${workId} → ${winnerRequest.operatorId}`);
        
        // Notify winner
        await this.notifyAssignmentResult(winnerRequest, 'success', 'Work assigned successfully!');
        
        // Notify losers
        for (const loser of requests.slice(1)) {
          await this.notifyAssignmentResult(loser, 'failed', 'Someone else got the work');
        }
        
        // Clear entire queue for this work
        await remove(queueRef);
        this.stopQueueProcessor(workId);
        
      } else {
        console.log(`❌ Queue assignment failed: ${result.error}`);
        
        // Work might already be assigned outside queue, notify everyone
        for (const request of requests) {
          await this.notifyAssignmentResult(request, 'failed', result.message);
        }
        
        await remove(queueRef);
        this.stopQueueProcessor(workId);
      }
    });

    this.queueProcessors.set(workId, unsubscribe);
  }

  // Stop queue processor
  stopQueueProcessor(workId) {
    const unsubscribe = this.queueProcessors.get(workId);
    if (unsubscribe) {
      unsubscribe();
      this.queueProcessors.delete(workId);
      console.log(`🛑 Stopped queue processor for work: ${workId}`);
    }
  }

  // Notify operator about assignment result
  async notifyAssignmentResult(request, result, message) {
    const notificationPath = `${RT_PATHS.OPERATOR_NOTIFICATIONS}/${request.operatorId}`;
    
    await realtimeHelpers.pushData(notificationPath, {
      type: 'work_assignment',
      workId: request.workId,
      result, // 'success' or 'failed'
      message,
      timestamp: Date.now()
    });
  }

  // Subscribe to operator notifications
  subscribeToNotifications(operatorId, callback) {
    const notificationRef = ref(rtdb, `${RT_PATHS.OPERATOR_NOTIFICATIONS}/${operatorId}`);
    
    return onValue(notificationRef, (snapshot) => {
      const notifications = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          notifications.push({ id: child.key, ...child.val() });
        });
        
        // Sort by timestamp (newest first)
        notifications.sort((a, b) => b.timestamp - a.timestamp);
      }
      
      callback(notifications);
    });
  }

  // Clear old notifications
  async clearNotification(operatorId, notificationId) {
    const notificationRef = ref(rtdb, `${RT_PATHS.OPERATOR_NOTIFICATIONS}/${operatorId}/${notificationId}`);
    await remove(notificationRef);
  }

  // Get queue statistics
  async getQueueStats(workId) {
    const queueRef = ref(rtdb, `${RT_PATHS.ASSIGNMENT_QUEUE}/${workId}`);
    const result = await realtimeHelpers.getData(`${RT_PATHS.ASSIGNMENT_QUEUE}/${workId}`);
    
    if (result.success && result.data) {
      const requests = Object.values(result.data);
      return {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        oldestRequest: Math.min(...requests.map(r => r.requestTime)),
        averageWaitTime: this.calculateAverageWaitTime(requests)
      };
    }
    
    return { totalRequests: 0, pendingRequests: 0 };
  }

  calculateAverageWaitTime(requests) {
    const now = Date.now();
    const waitTimes = requests
      .filter(r => r.status === 'pending')
      .map(r => now - r.requestTime);
    
    if (waitTimes.length === 0) return 0;
    return waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
  }

  // Cleanup old queues (call periodically)
  async cleanupOldQueues(maxAge = 5 * 60 * 1000) { // 5 minutes
    const now = Date.now();
    const queuesRef = ref(rtdb, RT_PATHS.ASSIGNMENT_QUEUE);
    
    const snapshot = await get(queuesRef);
    if (!snapshot.exists()) return;

    const cleanupPromises = [];
    
    snapshot.forEach((workChild) => {
      const workId = workChild.key;
      const requests = workChild.val();
      
      // Check if all requests are old
      const allRequestsOld = Object.values(requests).every(
        request => (now - request.requestTime) > maxAge
      );
      
      if (allRequestsOld) {
        console.log(`🧹 Cleaning up old queue for work: ${workId}`);
        cleanupPromises.push(remove(ref(rtdb, `${RT_PATHS.ASSIGNMENT_QUEUE}/${workId}`)));
        this.stopQueueProcessor(workId);
      }
    });

    await Promise.all(cleanupPromises);
  }
}

// Update RT_PATHS to include queue paths
export const QUEUE_PATHS = {
  ASSIGNMENT_QUEUE: 'assignment_queue',
  OPERATOR_NOTIFICATIONS: 'operator_notifications'
};

export const workQueueService = new WorkQueueService();
export default workQueueService;