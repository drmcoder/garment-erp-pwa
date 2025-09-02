import { db, collection, addDoc, updateDoc, doc, query, where, getDocs, onSnapshot, orderBy } from '../config/firebase';
import EarningsService from './EarningsService';

class BundlePaymentHoldService {
  
  // Hold bundle payment when damage is reported
  static async holdBundlePayment(bundleData) {
    try {
      const {
        bundleNumber,
        operatorId,
        operatorName,
        totalPieces,
        completedPieces,
        damageCount,
        damageType,
        damageDescription,
        supervisorNotified = true
      } = bundleData;

      // Create bundle hold record
      const holdRecord = {
        bundleNumber,
        operatorId,
        operatorName,
        totalPieces,
        completedPieces,
        remainingPieces: totalPieces - completedPieces,
        damageCount,
        damageType,
        damageDescription,
        status: 'damage_reported', // damage_reported -> rework_assigned -> rework_completed -> payment_released
        paymentHeld: true,
        reportedAt: new Date(),
        supervisorNotified,
        reworkHistory: [],
        notifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const holdDoc = await addDoc(collection(db, 'bundlePaymentHolds'), holdRecord);

      // Update operator earnings to 'held' status for this bundle
      await this.holdOperatorEarnings(bundleNumber, operatorId, holdDoc.id);

      console.log('✅ Bundle payment held:', bundleNumber);
      
      return {
        success: true,
        holdId: holdDoc.id,
        data: holdRecord
      };
    } catch (error) {
      console.error('❌ Error holding bundle payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Hold related operator earnings
  static async holdOperatorEarnings(bundleNumber, operatorId, holdReason) {
    try {
      const earningsQuery = query(
        collection(db, 'operatorEarnings'),
        where('bundleNumber', '==', bundleNumber),
        where('operatorId', '==', operatorId)
      );

      const snapshot = await getDocs(earningsQuery);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'held',
          holdReason: `Bundle payment hold: ${holdReason}`,
          heldAt: new Date(),
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);
      
      console.log(`💰 Held ${snapshot.docs.length} earnings records for bundle ${bundleNumber}`);
      
      return { success: true, count: snapshot.docs.length };
    } catch (error) {
      console.error('❌ Error holding operator earnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Supervisor assigns rework for damaged pieces
  static async assignRework(holdId, reworkData) {
    try {
      const {
        supervisorId,
        supervisorName,
        replacementPieces,
        reworkInstructions,
        dueDate,
        assignedTo, // can be same operator or different
        assignedOperatorName
      } = reworkData;

      const reworkRecord = {
        id: Date.now(),
        supervisorId,
        supervisorName,
        replacementPieces,
        reworkInstructions,
        dueDate: dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 1 day
        assignedTo,
        assignedOperatorName,
        status: 'assigned', // assigned -> in_progress -> completed
        assignedAt: new Date()
      };

      // Update hold record
      await updateDoc(doc(db, 'bundlePaymentHolds', holdId), {
        status: 'rework_assigned',
        reworkHistory: [{...reworkRecord}], // Using array to support multiple rework rounds
        reworkAssignedAt: new Date(),
        updatedAt: new Date()
      });

      // Create work assignment for rework
      await this.createReworkAssignment(holdId, reworkRecord);

      console.log('✅ Rework assigned for hold:', holdId);
      
      return {
        success: true,
        data: reworkRecord
      };
    } catch (error) {
      console.error('❌ Error assigning rework:', error);
      return { success: false, error: error.message };
    }
  }

  // Create work assignment for rework pieces
  static async createReworkAssignment(holdId, reworkRecord) {
    try {
      const reworkAssignment = {
        type: 'rework',
        holdId,
        bundleNumber: `${reworkRecord.originalBundle}-REWORK`,
        operation: 'damage_rework',
        operatorId: reworkRecord.assignedTo,
        operatorName: reworkRecord.assignedOperatorName,
        pieces: reworkRecord.replacementPieces,
        instructions: reworkRecord.reworkInstructions,
        priority: 'high',
        status: 'assigned',
        dueDate: reworkRecord.dueDate,
        assignedAt: new Date(),
        assignedBy: reworkRecord.supervisorId
      };

      await addDoc(collection(db, 'workAssignments'), reworkAssignment);
      
      console.log('📋 Rework assignment created');
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating rework assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete rework and check if bundle can be released
  static async completeRework(holdId, completionData) {
    try {
      const {
        operatorId,
        operatorName,
        completedPieces,
        qualityNotes,
        completedAt = new Date()
      } = completionData;

      // Get hold record
      const holdDoc = await getDocs(query(
        collection(db, 'bundlePaymentHolds'),
        where('__name__', '==', holdId)
      ));

      if (holdDoc.empty) {
        throw new Error('Hold record not found');
      }

      const holdData = holdDoc.docs[0].data();
      
      // Update rework completion
      const updatedReworkHistory = holdData.reworkHistory.map(rework => ({
        ...rework,
        status: 'completed',
        completedPieces,
        completedAt,
        completedBy: operatorId,
        completedByName: operatorName,
        qualityNotes
      }));

      // Check if all rework is complete and bundle can be released
      const canRelease = this.checkBundleCompletionStatus(holdData, completedPieces);

      const newStatus = canRelease ? 'payment_released' : 'rework_completed';

      await updateDoc(doc(db, 'bundlePaymentHolds', holdId), {
        status: newStatus,
        reworkHistory: updatedReworkHistory,
        reworkCompletedAt: completedAt,
        ...(canRelease && { paymentReleasedAt: new Date() }),
        updatedAt: new Date()
      });

      // If bundle is complete, release the payment
      if (canRelease) {
        await this.releasePayment(holdId, holdData);
      }

      console.log(`✅ Rework completed for hold: ${holdId}, Payment ${canRelease ? 'released' : 'still held'}`);
      
      return {
        success: true,
        paymentReleased: canRelease,
        data: {
          holdId,
          status: newStatus,
          completedPieces,
          totalComplete: canRelease
        }
      };
    } catch (error) {
      console.error('❌ Error completing rework:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if bundle is fully complete (original work + rework)
  static checkBundleCompletionStatus(holdData, reworkCompletedPieces) {
    const totalPieces = holdData.totalPieces;
    const originalCompleted = holdData.completedPieces;
    const damageCount = holdData.damageCount;
    
    // Total should be: original completed pieces + rework pieces to replace damaged ones
    const expectedTotal = originalCompleted + reworkCompletedPieces;
    
    return expectedTotal >= totalPieces;
  }

  // Release payment when bundle is fully complete
  static async releasePayment(holdId, holdData) {
    try {
      // Update held earnings to confirmed status
      const earningsQuery = query(
        collection(db, 'operatorEarnings'),
        where('bundleNumber', '==', holdData.bundleNumber),
        where('operatorId', '==', holdData.operatorId),
        where('status', '==', 'held')
      );

      const snapshot = await getDocs(earningsQuery);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'confirmed',
          holdReleased: true,
          holdReleasedAt: new Date(),
          updatedAt: new Date()
        })
      );

      await Promise.all(updatePromises);

      // Record payment release
      await addDoc(collection(db, 'paymentReleases'), {
        holdId,
        bundleNumber: holdData.bundleNumber,
        operatorId: holdData.operatorId,
        operatorName: holdData.operatorName,
        releasedAt: new Date(),
        releasedBy: 'system', // Could be supervisor ID
        earningsCount: snapshot.docs.length,
        reason: 'Bundle work completed including rework'
      });

      console.log(`💰 Payment released for bundle: ${holdData.bundleNumber}`);
      
      return { success: true, earningsReleased: snapshot.docs.length };
    } catch (error) {
      console.error('❌ Error releasing payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all held bundles (for supervisor dashboard)
  static async getHeldBundles() {
    try {
      const query = query(
        collection(db, 'bundlePaymentHolds'),
        where('paymentHeld', '==', true),
        orderBy('reportedAt', 'desc')
      );

      const snapshot = await getDocs(query);
      const heldBundles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: heldBundles
      };
    } catch (error) {
      console.error('❌ Error getting held bundles:', error);
      return { success: false, error: error.message };
    }
  }

  // Get operator's pending work (including held bundles)
  static async getOperatorPendingWork(operatorId) {
    try {
      const [heldBundles, regularWork] = await Promise.all([
        // Get held bundles for this operator
        getDocs(query(
          collection(db, 'bundlePaymentHolds'),
          where('operatorId', '==', operatorId),
          where('paymentHeld', '==', true)
        )),
        
        // Get regular assigned work
        getDocs(query(
          collection(db, 'workAssignments'),
          where('operatorId', '==', operatorId),
          where('status', '==', 'assigned')
        ))
      ]);

      const pendingWork = {
        heldBundles: heldBundles.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        regularWork: regularWork.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        totalPending: heldBundles.docs.length + regularWork.docs.length
      };

      return {
        success: true,
        data: pendingWork
      };
    } catch (error) {
      console.error('❌ Error getting operator pending work:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscription for held bundles changes
  static subscribeToHeldBundles(callback) {
    const q = query(
      collection(db, 'bundlePaymentHolds'),
      where('paymentHeld', '==', true),
      orderBy('reportedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const heldBundles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(heldBundles);
    });
  }

  // Supervisor force release payment (emergency)
  static async forceReleasePayment(holdId, supervisorId, reason) {
    try {
      const holdDoc = await getDocs(query(
        collection(db, 'bundlePaymentHolds'),
        where('__name__', '==', holdId)
      ));

      if (holdDoc.empty) {
        throw new Error('Hold record not found');
      }

      const holdData = holdDoc.docs[0].data();

      // Update hold record
      await updateDoc(doc(db, 'bundlePaymentHolds', holdId), {
        status: 'force_released',
        paymentHeld: false,
        forceReleasedBy: supervisorId,
        forceReleaseReason: reason,
        forceReleasedAt: new Date(),
        updatedAt: new Date()
      });

      // Release the earnings
      await this.releasePayment(holdId, holdData);

      console.log(`⚠️ Payment force released for hold: ${holdId}`);
      
      return { success: true, message: 'Payment force released' };
    } catch (error) {
      console.error('❌ Error force releasing payment:', error);
      return { success: false, error: error.message };
    }
  }
}

export default BundlePaymentHoldService;