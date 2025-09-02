// src/services/DamageReportService.js
// Firebase service for managing damage reports

import {
  collection,
  doc,
  addDoc,
  updateDoc,
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
   * Submit a new damage report and hold bundle payment
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

      // Use batch transaction to ensure atomicity
      const batch = writeBatch(db);
      
      // Create the damage report document
      const reportDocument = createDamageReportDocument(enhancedData);
      const reportRef = doc(collection(db, this.collectionName));
      batch.set(reportRef, reportDocument);
      
      // Hold bundle payment - Update work item/bundle status
      await this.holdBundlePayment(batch, reportData.bundleId || reportData.workItemId, reportData.operatorId, {
        reason: 'DAMAGE_REPORTED',
        damageReportId: reportRef.id,
        heldAmount: reportData.pieces * reportData.rate,
        heldPieces: reportData.pieces || reportData.pieceNumbers?.length,
        reportedAt: new Date()
      });

      // Commit the batch transaction
      await batch.commit();
      
      // Create notifications for supervisor
      await this.createDamageNotification({
        type: 'damage_reported',
        recipientId: reportData.supervisorId,
        recipientRole: 'supervisor',
        damageReportId: reportRef.id,
        bundleNumber: reportData.bundleNumber,
        operatorName: reportData.operatorName,
        priority: reportData.urgency,
        title: '🔧 New Damage Report',
        message: `${reportData.operatorName} reported ${reportData.pieceNumbers?.length} damaged pieces in ${reportData.bundleNumber}. Payment held pending rework completion.`
      });

      // Notify operator about payment hold
      await this.createDamageNotification({
        type: 'payment_held',
        recipientId: reportData.operatorId,
        recipientRole: 'operator',
        damageReportId: reportRef.id,
        bundleNumber: reportData.bundleNumber,
        priority: 'normal',
        title: '⏳ Bundle Payment On Hold',
        message: `Payment for ${reportData.bundleNumber} is held until damage is resolved. You can continue working on other bundles.`
      });

      console.log('✅ Damage report submitted and payment held:', reportRef.id);
      return {
        success: true,
        reportId: reportRef.id,
        data: { ...reportDocument, id: reportRef.id }
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
   * Hold bundle payment when damage is reported
   */
  async holdBundlePayment(batch, bundleId, operatorId, holdData) {
    try {
      // Update work item/bundle with payment hold status
      const bundleRef = doc(db, 'workItems', bundleId);
      batch.update(bundleRef, {
        paymentStatus: 'HELD_FOR_DAMAGE',
        paymentHoldReason: holdData.reason,
        heldAmount: holdData.heldAmount,
        heldPieces: holdData.heldPieces,
        damageReportId: holdData.damageReportId,
        paymentHeldAt: serverTimestamp(),
        canWithdraw: false,
        'systemInfo.updatedAt': serverTimestamp()
      });

      // Update operator's wallet/earnings to show held amount
      const operatorWalletRef = doc(db, 'operatorWallets', operatorId);
      const walletSnap = await getDoc(operatorWalletRef);
      
      if (walletSnap.exists()) {
        batch.update(operatorWalletRef, {
          heldAmount: (walletSnap.data().heldAmount || 0) + holdData.heldAmount,
          heldBundles: [...(walletSnap.data().heldBundles || []), bundleId],
          lastUpdated: serverTimestamp()
        });
      } else {
        batch.set(operatorWalletRef, {
          operatorId: operatorId,
          availableAmount: 0,
          heldAmount: holdData.heldAmount,
          totalEarned: 0,
          heldBundles: [bundleId],
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }

      console.log(`💰 Bundle payment held: ${holdData.heldAmount} for bundle ${bundleId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error holding bundle payment:', error);
      throw error;
    }
  }

  /**
   * Release held bundle payment when all work is completed
   */
  async releaseBundlePayment(bundleId, operatorId, releaseData = {}) {
    try {
      const batch = writeBatch(db);
      
      // Get current bundle data
      const bundleRef = doc(db, 'workItems', bundleId);
      const bundleSnap = await getDoc(bundleRef);
      const bundleData = bundleSnap.data();
      
      if (!bundleData || bundleData.paymentStatus !== 'HELD_FOR_DAMAGE') {
        throw new Error('Bundle payment is not held or bundle not found');
      }

      // Release payment - Update bundle status
      batch.update(bundleRef, {
        paymentStatus: 'RELEASED',
        paymentReleasedAt: serverTimestamp(),
        canWithdraw: true,
        finalCompletionStatus: 'COMPLETED',
        'systemInfo.updatedAt': serverTimestamp()
      });

      // Update operator wallet - move from held to available
      const operatorWalletRef = doc(db, 'operatorWallets', operatorId);
      const walletSnap = await getDoc(operatorWalletRef);
      const currentWallet = walletSnap.data();
      
      batch.update(operatorWalletRef, {
        availableAmount: (currentWallet.availableAmount || 0) + bundleData.heldAmount,
        heldAmount: Math.max(0, (currentWallet.heldAmount || 0) - bundleData.heldAmount),
        totalEarned: (currentWallet.totalEarned || 0) + bundleData.heldAmount,
        heldBundles: currentWallet.heldBundles.filter(id => id !== bundleId),
        lastUpdated: serverTimestamp()
      });

      // Create wage record for released payment
      const wageRecordRef = doc(collection(db, 'wageRecords'));
      batch.set(wageRecordRef, {
        operatorId: operatorId,
        bundleId: bundleId,
        bundleNumber: bundleData.bundleNumber || bundleId,
        operation: bundleData.operation || 'N/A',
        pieces: bundleData.heldPieces || bundleData.pieces,
        rate: bundleData.rate || 0,
        amount: bundleData.heldAmount,
        workType: 'bundle_completion_with_damage',
        date: new Date().toISOString().split('T')[0],
        paymentType: 'released_after_damage',
        damageReportId: bundleData.damageReportId,
        paymentNotes: `Bundle completed after damage rework - Payment released: ₹${bundleData.heldAmount}`,
        createdAt: serverTimestamp()
      });

      await batch.commit();

      // Notify operator about payment release
      await this.createDamageNotification({
        type: 'payment_released',
        recipientId: operatorId,
        recipientRole: 'operator',
        damageReportId: bundleData.damageReportId,
        bundleNumber: bundleData.bundleNumber || bundleId,
        priority: 'normal',
        title: '💰 Bundle Payment Released!',
        message: `Payment of ₹${bundleData.heldAmount} released for ${bundleData.bundleNumber}. Amount added to your wallet.`
      });

      console.log(`✅ Bundle payment released: ₹${bundleData.heldAmount} for ${bundleId}`);
      return { 
        success: true, 
        releasedAmount: bundleData.heldAmount,
        bundleId: bundleId
      };
    } catch (error) {
      console.error('❌ Error releasing bundle payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark report as finally completed by operator and release held bundle payment
   */
  async markFinalCompletion(reportId, operatorId, completionData = {}) {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      const reportSnap = await getDoc(reportRef);
      const reportData = reportSnap.data();
      
      if (!reportData) {
        throw new Error('Damage report not found');
      }

      // Update damage report status
      const updateData = {
        status: DAMAGE_STATUS.FINAL_COMPLETION,
        finalCompletionAt: serverTimestamp(),
        'operatorCompletion.completedAt': serverTimestamp(),
        'operatorCompletion.completionNotes': completionData.notes || '',
        'operatorCompletion.qualityScore': completionData.qualityScore || 100,
        'systemInfo.updatedAt': serverTimestamp()
      };

      await updateDoc(reportRef, updateData);

      // Release the entire bundle payment since all work is now complete
      const bundleId = reportData.bundleId || reportData.workItemId;
      const releaseResult = await this.releaseBundlePayment(bundleId, operatorId, {
        completionType: 'damage_rework_final',
        damageReportId: reportId,
        qualityScore: completionData.qualityScore || 100
      });

      if (!releaseResult.success) {
        console.warn('⚠️ Could not release bundle payment:', releaseResult.error);
        // Continue with completion even if payment release fails
      }

      console.log(`✅ Final completion marked for ${reportId}, bundle payment: ${releaseResult.success ? 'released' : 'failed'}`);
      
      return { 
        success: true, 
        paymentReleased: releaseResult.success ? releaseResult.releasedAmount : 0,
        bundleId: bundleId,
        paymentReleaseStatus: releaseResult.success ? 'released' : 'failed'
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
   * Check for overdue damage reports and escalate to admin
   */
  async checkAndEscalateOverdueReports() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      // Get reports that might be overdue
      const q = query(
        collection(db, this.collectionName),
        where('status', 'in', ['reported_to_supervisor', 'acknowledged', 'in_supervisor_queue']),
        where('reportedAt', '<=', oneDayAgo),
        orderBy('reportedAt', 'asc')
      );

      const snapshot = await getDocs(q);
      const overdueReports = [];

      snapshot.forEach(doc => {
        const report = { id: doc.id, ...doc.data() };
        const reportTime = report.reportedAt?.toDate?.() || new Date(report.reportedAt);
        const hoursSinceReport = (now - reportTime) / (1000 * 60 * 60);
        
        // Check if report is overdue based on urgency
        const urgencyLevel = report.urgency || 'normal';
        let maxHours = 24; // Default
        
        switch (urgencyLevel) {
          case 'urgent': maxHours = 1; break;
          case 'high': maxHours = 4; break;
          case 'normal': maxHours = 24; break;
          case 'low': maxHours = 72; break;
        }
        
        if (hoursSinceReport > maxHours) {
          overdueReports.push({
            ...report,
            hoursSinceReport: Math.round(hoursSinceReport),
            maxHours,
            overdueBy: Math.round(hoursSinceReport - maxHours)
          });
        }
      });

      // Escalate overdue reports to admin
      for (const overdueReport of overdueReports) {
        await this.escalateToAdmin(overdueReport);
      }

      console.log(`📈 Checked ${snapshot.docs.length} reports, escalated ${overdueReports.length} overdue reports to admin`);
      
      return {
        success: true,
        totalChecked: snapshot.docs.length,
        escalatedCount: overdueReports.length,
        overdueReports: overdueReports
      };
    } catch (error) {
      console.error('❌ Error checking overdue reports:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Escalate damage report to admin/management
   */
  async escalateToAdmin(overdueReport) {
    try {
      const reportRef = doc(db, this.collectionName, overdueReport.id);
      
      // Update report status to escalated
      await updateDoc(reportRef, {
        status: 'escalated_to_admin',
        escalatedAt: serverTimestamp(),
        escalationReason: `Supervisor response overdue by ${overdueReport.overdueBy} hours (${overdueReport.urgency} priority)`,
        originalSupervisorId: overdueReport.supervisorId,
        'systemInfo.updatedAt': serverTimestamp()
      });

      // Send notification to admin/management
      await this.createDamageNotification({
        type: 'damage_escalated',
        recipientId: 'admin', // Or get from management roles
        recipientRole: 'management',
        damageReportId: overdueReport.id,
        bundleNumber: overdueReport.bundleNumber,
        operatorName: overdueReport.operatorName,
        supervisorId: overdueReport.supervisorId,
        priority: 'urgent',
        title: '🚨 Damage Report Escalated',
        message: `URGENT: Damage report for ${overdueReport.bundleNumber} overdue by ${overdueReport.overdueBy}hrs. Supervisor ${overdueReport.supervisorId} unresponsive.`
      });

      // Send notification to supervisor about escalation
      await this.createDamageNotification({
        type: 'escalation_warning',
        recipientId: overdueReport.supervisorId,
        recipientRole: 'supervisor',
        damageReportId: overdueReport.id,
        bundleNumber: overdueReport.bundleNumber,
        priority: 'urgent',
        title: '⚠️ Report Escalated to Admin',
        message: `Damage report ${overdueReport.bundleNumber} escalated to management due to delayed response (${overdueReport.overdueBy}hrs overdue)`
      });

      // Send notification to operator about escalation
      await this.createDamageNotification({
        type: 'escalation_update',
        recipientId: overdueReport.operatorId,
        recipientRole: 'operator',
        damageReportId: overdueReport.id,
        bundleNumber: overdueReport.bundleNumber,
        priority: 'normal',
        title: '📈 Report Escalated',
        message: `Your damage report for ${overdueReport.bundleNumber} has been escalated to management for faster resolution.`
      });

      console.log(`🚨 Escalated overdue damage report ${overdueReport.id} to admin`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error escalating to admin:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get escalated damage reports for admin dashboard
   */
  async getEscalatedReports(limit_count = 20) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'escalated_to_admin'),
        orderBy('escalatedAt', 'desc'),
        limit(limit_count)
      );

      const snapshot = await getDocs(q);
      const reports = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          ...data,
          reportedAt: data.reportedAt?.toDate?.() || data.reportedAt,
          escalatedAt: data.escalatedAt?.toDate?.() || data.escalatedAt
        });
      });

      return {
        success: true,
        data: reports
      };
    } catch (error) {
      console.error('❌ Error getting escalated reports:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
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