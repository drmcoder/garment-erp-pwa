// src/services/DamageReportService.js
// Firebase service for managing damage reports

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

import { db } from '../config/firebase';
import {
  FIRESTORE_COLLECTIONS,
  DAMAGE_STATUS,
  createDamageReportDocument,
  validateDamageReport,
  generateReportId
} from '../config/damageReportSchema';
import { getDamageTypeById, isOperatorFault, getDamagePenalty } from '../config/damageTypesConfig';

export class DamageReportService {
  constructor() {
    this.collectionName = FIRESTORE_COLLECTIONS.DAMAGE_REPORTS;
    this.notificationCollectionName = FIRESTORE_COLLECTIONS.DAMAGE_NOTIFICATIONS;
  }

  /**
   * Submit a new damage report
   */
  async submitDamageReport(reportData) {
    try {
      // Validate the report data
      const validation = validateDamageReport(reportData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Enhance report data with damage type information
      const damageType = getDamageTypeById(reportData.damageType);
      const enhancedData = {
        ...reportData,
        damageCategory: damageType?.category,
        severity: damageType?.severity || 'minor',
        operatorAtFault: isOperatorFault(reportData.damageType),
        pieceCount: reportData.pieceNumbers?.length || 0
      };

      // Create the document structure
      const reportDocument = createDamageReportDocument(enhancedData);
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, this.collectionName), reportDocument);
      
      // Create notifications for supervisor
      await this.createDamageNotification({
        type: 'damage_reported',
        recipientId: reportData.supervisorId,
        recipientRole: 'supervisor',
        damageReportId: docRef.id,
        bundleNumber: reportData.bundleNumber,
        operatorName: reportData.operatorName,
        priority: reportData.urgency,
        title: '🔧 New Damage Report',
        message: `${reportData.operatorName} reported ${reportData.pieceNumbers?.length} damaged pieces in ${reportData.bundleNumber}`
      });

      console.log('✅ Damage report submitted:', docRef.id);
      return {
        success: true,
        reportId: docRef.id,
        data: { ...reportDocument, id: docRef.id }
      };
    } catch (error) {
      console.error('❌ Error submitting damage report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get damage reports for a supervisor
   */
  async getSupervisorDamageQueue(supervisorId, statusFilter = null) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('supervisorId', '==', supervisorId),
        orderBy('reportedAt', 'desc'),
        limit(50)
      );

      // Add status filter if provided
      if (statusFilter) {
        q = query(
          collection(db, this.collectionName),
          where('supervisorId', '==', supervisorId),
          where('status', '==', statusFilter),
          orderBy('reportedAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const reports = [];

      snapshot.forEach(doc => {
        reports.push({
          id: doc.id,
          ...doc.data(),
          reportedAt: doc.data().reportedAt?.toDate?.() || doc.data().reportedAt
        });
      });

      return {
        success: true,
        data: reports
      };
    } catch (error) {
      console.error('❌ Error loading supervisor damage queue:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get damage reports for an operator
   */
  async getOperatorDamageReports(operatorId, limit_count = 20) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('operatorId', '==', operatorId),
        orderBy('reportedAt', 'desc'),
        limit(limit_count)
      );

      const snapshot = await getDocs(q);
      const reports = [];

      snapshot.forEach(doc => {
        reports.push({
          id: doc.id,
          ...doc.data(),
          reportedAt: doc.data().reportedAt?.toDate?.() || doc.data().reportedAt
        });
      });

      return {
        success: true,
        data: reports
      };
    } catch (error) {
      console.error('❌ Error loading operator damage reports:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Start rework on a damage report
   */
  async startRework(reportId, supervisorData) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      
      await updateDoc(reportRef, {
        status: DAMAGE_STATUS.REWORK_STARTED,
        acknowledgedAt: serverTimestamp(),
        reworkStartedAt: serverTimestamp(),
        'reworkDetails.supervisorNotes': supervisorData.notes || '',
        'systemInfo.updatedAt': serverTimestamp()
      });

      // Get the report data for notification
      const reportSnap = await getDoc(reportRef);
      const reportData = reportSnap.data();

      // Notify operator that rework has started
      await this.createDamageNotification({
        type: 'rework_started',
        recipientId: reportData.operatorId,
        recipientRole: 'operator',
        damageReportId: reportId,
        bundleNumber: reportData.bundleNumber,
        supervisorName: supervisorData.supervisorName,
        priority: 'normal',
        title: '🔧 Rework Started',
        message: `${supervisorData.supervisorName} started rework on your ${reportData.bundleNumber}`
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error starting rework:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete rework on a damage report
   */
  async completeRework(reportId, completionData) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      
      const updateData = {
        status: DAMAGE_STATUS.REWORK_COMPLETED,
        reworkCompletedAt: serverTimestamp(),
        'reworkDetails.supervisorNotes': completionData.notes || '',
        'reworkDetails.partsReplaced': completionData.partsReplaced || [],
        'reworkDetails.timeSpentMinutes': completionData.timeSpentMinutes || 0,
        'reworkDetails.qualityCheckPassed': completionData.qualityCheckPassed || false,
        'reworkDetails.costEstimate': completionData.costEstimate || 0,
        'systemInfo.updatedAt': serverTimestamp()
      };

      // Calculate payment impact
      const reportSnap = await getDoc(reportRef);
      const reportData = reportSnap.data();
      const operatorFault = isOperatorFault(reportData.damageType);
      const penalty = operatorFault ? getDamagePenalty(reportData.damageType, reportData.severity) : 0;

      updateData['paymentImpact.operatorAtFault'] = operatorFault;
      updateData['paymentImpact.paymentAdjustment'] = 0; // No penalty - payment held and released after completion
      updateData['paymentImpact.adjustmentReason'] = 'Payment held for rework - to be released after completion';
      updateData['paymentImpact.supervisorCompensation'] = (completionData.timeSpentMinutes || 0) * 0.5; // ₹0.5 per minute

      await updateDoc(reportRef, updateData);

      // Notify operator that rework is complete
      await this.createDamageNotification({
        type: 'rework_completed',
        recipientId: reportData.operatorId,
        recipientRole: 'operator',
        damageReportId: reportId,
        bundleNumber: reportData.bundleNumber,
        supervisorName: completionData.supervisorName,
        priority: 'normal',
        title: '✅ Rework Complete',
        message: `${completionData.supervisorName} completed rework on ${reportData.bundleNumber} - pieces ready!`
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error completing rework:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark pieces as returned to operator and create new work item
   */
  async returnToOperator(reportId, supervisorData) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      const reportSnap = await getDoc(reportRef);
      const reportData = reportSnap.data();
      
      // Use batch to ensure atomicity
      const batch = writeBatch(db);
      
      // Update the damage report status
      batch.update(reportRef, {
        status: DAMAGE_STATUS.RETURNED,
        returnedToOperatorAt: serverTimestamp(),
        'systemInfo.updatedAt': serverTimestamp()
      });

      // Create a new work assignment for the reworked pieces
      const workAssignmentRef = doc(collection(db, 'workAssignments'));
      const reworkWorkAssignment = {
        id: workAssignmentRef.id,
        bundleNumber: `${reportData.bundleNumber}-REWORK`,
        operatorId: reportData.operatorId,
        operatorName: reportData.operatorName,
        assignedLine: reportData.assignedLine,
        article: reportData.article,
        articleName: reportData.articleName,
        operation: reportData.operation,
        color: reportData.color,
        colorCode: reportData.colorCode,
        sizes: reportData.sizes,
        quantity: reportData.pieceCount,
        rate: reportData.rate,
        totalValue: reportData.rate * reportData.pieceCount,
        status: 'assigned',
        priority: 'high', // Rework has high priority
        machineType: reportData.machineType,
        estimatedTime: reportData.estimatedTime || 30,
        assignedAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        specialInstructions: `Rework pieces: ${reportData.pieceNumbers.join(', ')}. Original damage: ${reportData.damageType}`,
        isRework: true,
        originalDamageReportId: reportId,
        pieceNumbers: reportData.pieceNumbers,
        supervisorNotes: supervisorData.notes || 'Rework completed by supervisor'
      };

      batch.set(workAssignmentRef, reworkWorkAssignment);

      // Commit the batch
      await batch.commit();

      // Notify operator that reworked pieces are ready
      await this.createDamageNotification({
        type: 'pieces_returned',
        recipientId: reportData.operatorId,
        recipientRole: 'operator',
        damageReportId: reportId,
        bundleNumber: reportData.bundleNumber,
        supervisorName: supervisorData.supervisorName || 'Supervisor',
        priority: 'high',
        title: '🔄 Reworked Pieces Ready',
        message: `${reportData.pieceCount} reworked pieces from ${reportData.bundleNumber} are ready for completion. Check your work queue!`
      });

      return { 
        success: true, 
        workAssignmentId: workAssignmentRef.id,
        reworkData: reworkWorkAssignment
      };
    } catch (error) {
      console.error('❌ Error returning to operator:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark report as finally completed by operator and release held payment
   */
  async markFinalCompletion(reportId, operatorId, completionData = {}) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      const reportSnap = await getDoc(reportRef);
      const reportData = reportSnap.data();
      
      // Calculate the payment to be released
      const baseRate = parseFloat(reportData.rate) || 0;
      const pieceCount = reportData.pieceCount || 0;
      const operatorFault = isOperatorFault(reportData.damageType);
      
      // Always release full payment for reworked pieces after completion
      // Payment was held during damage report, now released after rework completion
      let paymentToRelease = pieceCount * baseRate;
      
      const updateData = {
        status: DAMAGE_STATUS.FINAL_COMPLETION,
        finalCompletionAt: serverTimestamp(),
        'operatorCompletion.completedAt': serverTimestamp(),
        'operatorCompletion.completionNotes': completionData.notes || '',
        'operatorCompletion.qualityScore': completionData.qualityScore || 100,
        'paymentImpact.paymentReleased': paymentToRelease,
        'paymentImpact.releasedAt': serverTimestamp(),
        'paymentImpact.finalPaymentStatus': 'released',
        'systemInfo.updatedAt': serverTimestamp()
      };

      await updateDoc(reportRef, updateData);

      // Create wage record for the released payment
      const wageRecord = {
        operatorId: operatorId,
        operatorName: reportData.operatorName,
        bundleNumber: `${reportData.bundleNumber}-REWORK`,
        operation: reportData.operation,
        pieces: pieceCount,
        rate: baseRate,
        amount: paymentToRelease,
        workType: 'rework_completion',
        date: new Date().toISOString().split('T')[0],
        isReworkPayment: true,
        originalDamageReportId: reportId,
        paymentNotes: `Rework completion payment - Original damage: ${reportData.damageType}`,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'wageRecords'), wageRecord);

      // Notify operator about payment release
      await this.createDamageNotification({
        type: 'payment_released',
        recipientId: operatorId,
        recipientRole: 'operator',
        damageReportId: reportId,
        bundleNumber: reportData.bundleNumber,
        priority: 'normal',
        title: '💰 Payment Released',
        message: `Payment of ₹${paymentToRelease.toFixed(2)} released for completing reworked pieces from ${reportData.bundleNumber}`
      });

      return { 
        success: true, 
        paymentReleased: paymentToRelease,
        wageRecord: wageRecord
      };
    } catch (error) {
      console.error('❌ Error marking final completion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a notification for damage report events
   */
  async createDamageNotification(notificationData) {
    try {
      const notification = {
        notificationId: generateReportId('NOTIF', new Date()),
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      await addDoc(collection(db, this.notificationCollectionName), notification);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, unreadOnly = false) {
    try {
      let q = query(
        collection(db, this.notificationCollectionName),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      if (unreadOnly) {
        q = query(
          collection(db, this.notificationCollectionName),
          where('recipientId', '==', userId),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      }

      const snapshot = await getDocs(q);
      const notifications = [];

      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        });
      });

      return {
        success: true,
        data: notifications
      };
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      const notifRef = doc(db, this.notificationCollectionName, notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Real-time subscription for supervisor damage queue
   */
  subscribeSupervisorQueue(supervisorId, callback) {
    const q = query(
      collection(db, this.collectionName),
      where('supervisorId', '==', supervisorId),
      where('status', 'in', [
        DAMAGE_STATUS.REPORTED,
        DAMAGE_STATUS.ACKNOWLEDGED,
        DAMAGE_STATUS.IN_QUEUE,
        DAMAGE_STATUS.REWORK_STARTED
      ]),
      orderBy('reportedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const reports = [];
      snapshot.forEach(doc => {
        reports.push({
          id: doc.id,
          ...doc.data(),
          reportedAt: doc.data().reportedAt?.toDate?.() || doc.data().reportedAt
        });
      });
      callback(reports);
    });
  }

  /**
   * Real-time subscription for operator notifications
   */
  subscribeOperatorNotifications(operatorId, callback) {
    const q = query(
      collection(db, this.notificationCollectionName),
      where('recipientId', '==', operatorId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        });
      });
      callback(notifications);
    });
  }

  /**
   * Get damage analytics for a date range
   */
  async getDamageAnalytics(startDate, endDate, filters = {}) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('reportedAt', '>=', startDate),
        where('reportedAt', '<=', endDate),
        orderBy('reportedAt', 'desc')
      );

      // Add filters if provided
      if (filters.operatorId) {
        q = query(q, where('operatorId', '==', filters.operatorId));
      }
      if (filters.damageCategory) {
        q = query(q, where('damageCategory', '==', filters.damageCategory));
      }

      const snapshot = await getDocs(q);
      const reports = [];

      snapshot.forEach(doc => {
        reports.push({
          id: doc.id,
          ...doc.data(),
          reportedAt: doc.data().reportedAt?.toDate?.() || doc.data().reportedAt
        });
      });

      // Process analytics
      const analytics = this.processAnalytics(reports);

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('❌ Error loading damage analytics:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Process raw damage reports into analytics
   */
  processAnalytics(reports) {
    const analytics = {
      totalReports: reports.length,
      reportsByCategory: {},
      reportsByOperator: {},
      reportsBySeverity: {},
      reportsByUrgency: {},
      averageResolutionTime: 0,
      operatorFaultRate: 0,
      totalCost: 0,
      mostCommonDamageTypes: []
    };

    let totalResolutionTime = 0;
    let resolvedReports = 0;
    let operatorFaultCount = 0;
    const damageTypeCounts = {};

    reports.forEach(report => {
      // Category counts
      analytics.reportsByCategory[report.damageCategory] = 
        (analytics.reportsByCategory[report.damageCategory] || 0) + 1;

      // Operator counts
      analytics.reportsByOperator[report.operatorId] = 
        (analytics.reportsByOperator[report.operatorId] || 0) + 1;

      // Severity counts
      analytics.reportsBySeverity[report.severity] = 
        (analytics.reportsBySeverity[report.severity] || 0) + 1;

      // Urgency counts
      analytics.reportsByUrgency[report.urgency] = 
        (analytics.reportsByUrgency[report.urgency] || 0) + 1;

      // Resolution time
      if (report.reworkCompletedAt && report.reportedAt) {
        const resolutionTime = (report.reworkCompletedAt - report.reportedAt) / (1000 * 60 * 60); // hours
        totalResolutionTime += resolutionTime;
        resolvedReports++;
      }

      // Operator fault rate
      if (report.paymentImpact?.operatorAtFault) {
        operatorFaultCount++;
      }

      // Total cost
      analytics.totalCost += report.reworkDetails?.costEstimate || 0;

      // Damage type counts
      damageTypeCounts[report.damageType] = (damageTypeCounts[report.damageType] || 0) + 1;
    });

    // Calculate averages
    analytics.averageResolutionTime = resolvedReports > 0 ? totalResolutionTime / resolvedReports : 0;
    analytics.operatorFaultRate = reports.length > 0 ? (operatorFaultCount / reports.length) * 100 : 0;

    // Most common damage types
    analytics.mostCommonDamageTypes = Object.entries(damageTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return analytics;
  }

  /**
   * Get pending rework pieces count for an operator
   */
  async getPendingReworkPieces(operatorId) {
    try {
      // Get damage reports that need operator action (both with supervisor and returned to operator)
      const q = query(
        collection(db, this.collectionName),
        where('operatorId', '==', operatorId),
        where('status', 'in', [
          DAMAGE_STATUS.REWORK_STARTED,
          DAMAGE_STATUS.IN_QUEUE,
          DAMAGE_STATUS.ACKNOWLEDGED,
          DAMAGE_STATUS.RETURNED  // Include pieces returned to operator for completion
        ])
      );

      const snapshot = await getDocs(q);
      let totalPendingPieces = 0;

      snapshot.forEach((doc) => {
        const reportData = doc.data();
        totalPendingPieces += reportData.pieceCount || reportData.pieceNumbers?.length || 1;
      });

      return {
        success: true,
        count: totalPendingPieces,
        reports: snapshot.docs.length,
        details: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };
    } catch (error) {
      console.error('❌ Error getting pending rework pieces:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }
}

// Export singleton instance
export const damageReportService = new DamageReportService();
export default damageReportService;