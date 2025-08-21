import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db, COLLECTIONS, handleFirebaseError } from '../config/firebase';
import authService from './authService';

// Data Service Class
class DataService {
  constructor() {
    this.listeners = new Map(); // Store real-time listeners
  }

  // Bundle Management
  async getBundles(filters = {}) {
    try {
      let q = collection(db, COLLECTIONS.BUNDLES);
      
      // Apply filters
      if (filters.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      
      // Add ordering
      q = query(q, orderBy('assignedTime', 'desc'));
      
      // Add limit if specified
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const snapshot = await getDocs(q);
      const bundles = [];
      
      snapshot.forEach((doc) => {
        bundles.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to JavaScript dates
          assignedTime: doc.data().assignedTime?.toDate(),
          startTime: doc.data().startTime?.toDate(),
          completedTime: doc.data().completedTime?.toDate()
        });
      });
      
      return { success: true, data: bundles };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Create notification
  async createNotification(notificationData) {
    try {
      const newNotification = {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
        urgent: notificationData.urgent || false
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), newNotification);
      
      return {
        success: true,
        data: { id: docRef.id, ...newNotification }
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Quality Issue Management
  async createQualityIssue(issueData) {
    try {
      const newIssue = {
        ...issueData,
        createdAt: serverTimestamp(),
        reportedBy: authService.getCurrentUser()?.uid,
        status: 'open'
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.QUALITY_ISSUES), newIssue);
      
      // Create notification for supervisor
      await this.createNotification({
        type: 'quality-issue',
        recipientId: 'supervisor', // You might want to determine this dynamically
        title: 'Quality Issue Reported',
        titleNepali: 'गुणस्तर समस्या रिपोर्ट',
        message: `Quality issue in Bundle #${issueData.bundleNumber}`,
        messageNepali: `बन्डल #${issueData.bundleNumber} मा गुणस्तर समस्या`,
        bundleId: issueData.bundleId,
        urgent: issueData.severity === 'major'
      });
      
      return {
        success: true,
        data: { id: docRef.id, ...newIssue }
      };
    } catch (error) {
      console.error('Error creating quality issue:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Production Statistics
  async getProductionStats(dateRange = 'today') {
    try {
      let startDate, endDate;
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      }
      
      // Get completed bundles in date range
      const bundlesQuery = query(
        collection(db, COLLECTIONS.BUNDLES),
        where('status', '==', 'completed'),
        where('completedTime', '>=', startDate),
        where('completedTime', '<', endDate)
      );
      
      const bundlesSnapshot = await getDocs(bundlesQuery);
      const completedBundles = [];
      
      bundlesSnapshot.forEach((doc) => {
        completedBundles.push({
          id: doc.id,
          ...doc.data(),
          completedTime: doc.data().completedTime?.toDate()
        });
      });
      
      // Calculate statistics
      const totalPieces = completedBundles.reduce((sum, bundle) => sum + bundle.completedPieces, 0);
      const totalEarnings = completedBundles.reduce((sum, bundle) => sum + (bundle.completedPieces * bundle.rate), 0);
      const totalDefects = completedBundles.reduce((sum, bundle) => sum + (bundle.defectivePieces || 0), 0);
      
      const stats = {
        dateRange,
        totalBundles: completedBundles.length,
        totalPieces,
        totalEarnings,
        totalDefects,
        qualityScore: totalPieces > 0 ? Math.round(((totalPieces - totalDefects) / totalPieces) * 100) : 100,
        averageTimePerPiece: this.calculateAverageTime(completedBundles),
        topPerformer: this.getTopPerformer(completedBundles),
        machineUtilization: this.calculateMachineUtilization(completedBundles)
      };
      
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting production stats:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Helper method to calculate average time
  calculateAverageTime(bundles) {
    if (bundles.length === 0) return 0;
    
    const totalTime = bundles.reduce((sum, bundle) => {
      return sum + (bundle.actualTimeSpent || 0);
    }, 0);
    
    const totalPieces = bundles.reduce((sum, bundle) => sum + bundle.completedPieces, 0);
    
    return totalPieces > 0 ? Math.round(totalTime / totalPieces) : 0;
  }

  // Helper method to get top performer
  getTopPerformer(bundles) {
    const operatorStats = {};
    
    bundles.forEach(bundle => {
      const operatorId = bundle.completedBy;
      if (!operatorStats[operatorId]) {
        operatorStats[operatorId] = {
          pieces: 0,
          earnings: 0,
          bundles: 0
        };
      }
      
      operatorStats[operatorId].pieces += bundle.completedPieces;
      operatorStats[operatorId].earnings += bundle.completedPieces * bundle.rate;
      operatorStats[operatorId].bundles += 1;
    });
    
    let topPerformer = null;
    let maxPieces = 0;
    
    Object.keys(operatorStats).forEach(operatorId => {
      if (operatorStats[operatorId].pieces > maxPieces) {
        maxPieces = operatorStats[operatorId].pieces;
        topPerformer = {
          operatorId,
          ...operatorStats[operatorId]
        };
      }
    });
    
    return topPerformer;
  }

  // Helper method to calculate machine utilization
  calculateMachineUtilization(bundles) {
    const machineStats = {};
    
    bundles.forEach(bundle => {
      const machine = bundle.machine;
      if (!machineStats[machine]) {
        machineStats[machine] = {
          bundles: 0,
          pieces: 0,
          totalTime: 0
        };
      }
      
      machineStats[machine].bundles += 1;
      machineStats[machine].pieces += bundle.completedPieces;
      machineStats[machine].totalTime += bundle.actualTimeSpent || 0;
    });
    
    // Calculate utilization percentage (simplified)
    Object.keys(machineStats).forEach(machine => {
      const stats = machineStats[machine];
      // Assuming 8-hour workday = 480 minutes
      const availableTime = 480;
      machineStats[machine].utilization = Math.round((stats.totalTime / availableTime) * 100);
    });
    
    return machineStats;
  }

  // Real-time listeners
  subscribeToUserBundles(userId, callback) {
    try {
      const q = query(
        collection(db, COLLECTIONS.BUNDLES),
        where('assignedTo', '==', userId),
        orderBy('assignedTime', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bundles = [];
        snapshot.forEach((doc) => {
          bundles.push({
            id: doc.id,
            ...doc.data(),
            assignedTime: doc.data().assignedTime?.toDate(),
            startTime: doc.data().startTime?.toDate(),
            completedTime: doc.data().completedTime?.toDate()
          });
        });
        
        callback({ success: true, data: bundles });
      }, (error) => {
        console.error('Error in bundles subscription:', error);
        callback({ success: false, error: handleFirebaseError(error) });
      });
      
      // Store listener for cleanup
      const listenerId = `bundles_${userId}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to bundles:', error);
      callback({ success: false, error: handleFirebaseError(error) });
      return null;
    }
  }

  subscribeToUserNotifications(userId, callback) {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data(),
            time: doc.data().createdAt?.toDate(),
            createdAt: doc.data().createdAt?.toDate()
          });
        });
        
        callback({ success: true, data: notifications });
      }, (error) => {
        console.error('Error in notifications subscription:', error);
        callback({ success: false, error: handleFirebaseError(error) });
      });
      
      const listenerId = `notifications_${userId}`;
      this.listeners.set(listenerId, unsubscribe);
      
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      callback({ success: false, error: handleFirebaseError(error) });
      return null;
    }
  }

  // Cleanup all listeners
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }

  // Wage Management
  async getWageRecords(operatorId, dateRange = 'month') {
    try {
      let startDate, endDate;
      const now = new Date();
      
      switch (dateRange) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
      }
      
      const q = query(
        collection(db, COLLECTIONS.WAGE_RECORDS),
        where('operatorId', '==', operatorId),
        where('date', '>=', startDate),
        where('date', '<', endDate),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const wageRecords = [];
      
      snapshot.forEach((doc) => {
        wageRecords.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate()
        });
      });
      
      const totalEarnings = wageRecords.reduce((sum, record) => sum + record.earnings, 0);
      const totalPieces = wageRecords.reduce((sum, record) => sum + record.pieces, 0);
      
      return {
        success: true,
        data: {
          records: wageRecords,
          summary: {
            totalEarnings,
            totalPieces,
            averageRate: totalPieces > 0 ? (totalEarnings / totalPieces) : 0,
            workingDays: new Set(wageRecords.map(r => r.date.toDateString())).size
          }
        }
      };
    } catch (error) {
      console.error('Error getting wage records:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Batch operations for efficiency
  async batchUpdateBundles(updates) {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ bundleId, updateData }) => {
        const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
        batch.update(bundleRef, {
          ...updateData,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error batch updating bundles:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;('Error getting bundles:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Get single bundle
  async getBundle(bundleId) {
    try {
      const bundleDoc = await getDoc(doc(db, COLLECTIONS.BUNDLES, bundleId));
      
      if (!bundleDoc.exists()) {
        return {
          success: false,
          error: 'Bundle not found'
        };
      }
      
      const bundleData = bundleDoc.data();
      return {
        success: true,
        data: {
          id: bundleDoc.id,
          ...bundleData,
          assignedTime: bundleData.assignedTime?.toDate(),
          startTime: bundleData.startTime?.toDate(),
          completedTime: bundleData.completedTime?.toDate()
        }
      };
    } catch (error) {
      console.error('Error getting bundle:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Create new bundle
  async createBundle(bundleData) {
    try {
      const newBundle = {
        ...bundleData,
        createdAt: serverTimestamp(),
        createdBy: authService.getCurrentUser()?.uid,
        status: 'pending'
      };
      
      const docRef = await addDoc(collection(db, COLLECTIONS.BUNDLES), newBundle);
      
      return {
        success: true,
        data: { id: docRef.id, ...newBundle }
      };
    } catch (error) {
      console.error('Error creating bundle:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Update bundle
  async updateBundle(bundleId, updates) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: authService.getCurrentUser()?.uid
      };
      
      await updateDoc(bundleRef, updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating bundle:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Start work on bundle
  async startWork(bundleId) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
      
      await updateDoc(bundleRef, {
        status: 'in-progress',
        startTime: serverTimestamp(),
        startedBy: authService.getCurrentUser()?.uid
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error starting work:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Complete work on bundle
  async completeWork(bundleId, completionData) {
    try {
      return await runTransaction(db, async (transaction) => {
        const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
        const bundleDoc = await transaction.get(bundleRef);
        
        if (!bundleDoc.exists()) {
          throw new Error('Bundle not found');
        }
        
        const bundleData = bundleDoc.data();
        const currentUser = authService.getCurrentUser();
        
        // Update bundle status
        transaction.update(bundleRef, {
          status: 'completed',
          completedTime: serverTimestamp(),
          completedBy: currentUser?.uid,
          completedPieces: completionData.completedPieces,
          defectivePieces: completionData.defectivePieces || 0,
          qualityNotes: completionData.qualityNotes || '',
          actualTimeSpent: completionData.actualTimeSpent
        });
        
        // Create wage record
        const wageRecord = {
          operatorId: currentUser?.uid,
          operatorName: currentUser?.name,
          bundleId: bundleId,
          bundleNumber: bundleData.bundleNumber,
          article: bundleData.article,
          operation: bundleData.operation,
          pieces: completionData.completedPieces,
          rate: bundleData.rate,
          earnings: completionData.completedPieces * bundleData.rate,
          date: serverTimestamp(),
          shift: currentUser?.shift || 'morning',
          qualityScore: completionData.qualityScore || 100
        };
        
        const wageRef = doc(collection(db, COLLECTIONS.WAGE_RECORDS));
        transaction.set(wageRef, wageRecord);
        
        return { success: true };
      });
    } catch (error) {
      console.error('Error completing work:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Assign bundle to operator
  async assignBundle(bundleId, operatorId, assignedBy) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
      
      await updateDoc(bundleRef, {
        assignedTo: operatorId,
        assignedBy: assignedBy,
        assignedTime: serverTimestamp(),
        status: 'assigned'
      });
      
      // Create notification for operator
      await this.createNotification({
        type: 'work-assigned',
        recipientId: operatorId,
        title: 'New Work Assigned',
        titleNepali: 'नयाँ काम तोकिएको',
        message: `Bundle #${bundleId} assigned to you`,
        messageNepali: `बन्डल #${bundleId} तपाईंलाई तोकिएको छ`,
        bundleId: bundleId,
        senderId: assignedBy,
        urgent: false
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error assigning bundle:', error);
      return {
        success: false,
        error: handleFirebaseError(error)
      };
    }
  }

  // Notification Management
  async getNotifications(userId, filters = {}) {
    try {
      let q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const snapshot = await getDocs(q);
      const notifications = [];
      
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          time: doc.data().createdAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });
      
      return { success: true, data: notifications };
    } catch (error) {
      console.error