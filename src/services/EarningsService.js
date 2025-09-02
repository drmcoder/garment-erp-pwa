import { db, collection, addDoc, updateDoc, doc, query, where, getDocs } from '../config/firebase';

class EarningsService {
  
  // Record earnings when work is completed
  static async recordEarnings(workCompletionData) {
    try {
      const {
        operatorId,
        operatorName,
        bundleNumber,
        articleNumber,
        operation,
        machineType,
        pieces,
        ratePerPiece,
        startTime,
        completedAt,
        qualityNotes,
        damageInfo
      } = workCompletionData;

      // Calculate base earnings
      let baseEarnings = pieces * ratePerPiece;
      let finalEarnings = baseEarnings;
      let damageDeduction = 0;
      let damageReason = '';

      // Apply damage deductions if any
      if (damageInfo && damageInfo.hasDamage) {
        damageDeduction = this.calculateDamageDeduction(damageInfo, baseEarnings);
        finalEarnings = baseEarnings - damageDeduction;
        damageReason = damageInfo.reason || 'Damage reported';
      }

      // Create earnings record
      const earningsRecord = {
        operatorId,
        operatorName,
        bundleNumber,
        articleNumber,
        operation,
        machineType,
        pieces,
        ratePerPiece,
        baseEarnings,
        damageDeduction,
        damageReason,
        earnings: finalEarnings,
        startTime: startTime || new Date(),
        completedAt: completedAt || new Date(),
        status: 'pending', // pending, confirmed, paid, held
        qualityNotes: qualityNotes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'operatorEarnings'), earningsRecord);
      
      console.log('✅ Earnings recorded:', {
        id: docRef.id,
        operator: operatorName,
        bundle: bundleNumber,
        earnings: finalEarnings
      });

      return {
        success: true,
        data: { id: docRef.id, ...earningsRecord }
      };
    } catch (error) {
      console.error('❌ Error recording earnings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calculate damage deduction based on damage type and severity
  static calculateDamageDeduction(damageInfo, baseEarnings) {
    const { damageType, severity, pieces, operatorFault } = damageInfo;
    
    // If not operator's fault, no deduction
    if (!operatorFault) {
      return 0;
    }

    let deductionPercentage = 0;

    // Deduction based on damage type
    switch (damageType) {
      case 'broken_stitch':
        deductionPercentage = severity === 'major' ? 0.15 : 0.05;
        break;
      case 'wrong_measurement':
        deductionPercentage = severity === 'major' ? 0.20 : 0.10;
        break;
      case 'fabric_damage':
        deductionPercentage = severity === 'major' ? 0.25 : 0.10;
        break;
      case 'missing_operation':
        deductionPercentage = 0.30; // Always major
        break;
      default:
        deductionPercentage = 0.05;
    }

    // Calculate piece-based deduction
    const piecesAffected = pieces || 1;
    const totalWorkPieces = damageInfo.totalPieces || 1;
    const affectedRatio = piecesAffected / totalWorkPieces;
    
    return Math.round(baseEarnings * deductionPercentage * affectedRatio);
  }

  // Confirm earnings (supervisor approval)
  static async confirmEarnings(earningsId, supervisorId) {
    try {
      await updateDoc(doc(db, 'operatorEarnings', earningsId), {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: supervisorId,
        updatedAt: new Date()
      });

      console.log('✅ Earnings confirmed:', earningsId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error confirming earnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Hold earnings (for quality issues)
  static async holdEarnings(earningsId, reason, supervisorId) {
    try {
      await updateDoc(doc(db, 'operatorEarnings', earningsId), {
        status: 'held',
        holdReason: reason,
        heldAt: new Date(),
        heldBy: supervisorId,
        updatedAt: new Date()
      });

      console.log('⏸️ Earnings held:', earningsId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error holding earnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark earnings as paid
  static async markAsPaid(earningsId, paymentDetails, adminId) {
    try {
      await updateDoc(doc(db, 'operatorEarnings', earningsId), {
        status: 'paid',
        paidAt: new Date(),
        paidBy: adminId,
        paymentDetails,
        updatedAt: new Date()
      });

      console.log('💰 Earnings marked as paid:', earningsId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking as paid:', error);
      return { success: false, error: error.message };
    }
  }

  // Get operator earnings summary
  static async getOperatorEarningsSummary(operatorId, dateRange = null) {
    try {
      let earningsQuery = query(
        collection(db, 'operatorEarnings'),
        where('operatorId', '==', operatorId)
      );

      // Add date range filter if provided
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        earningsQuery = query(
          earningsQuery,
          where('completedAt', '>=', dateRange.startDate),
          where('completedAt', '<=', dateRange.endDate)
        );
      }

      const snapshot = await getDocs(earningsQuery);
      const earnings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate summary
      const summary = {
        totalEarnings: 0,
        pendingEarnings: 0,
        confirmedEarnings: 0,
        paidEarnings: 0,
        heldEarnings: 0,
        totalPieces: 0,
        workCount: earnings.length,
        damageDeductions: 0,
        earnings
      };

      earnings.forEach(earning => {
        summary.totalEarnings += earning.earnings || 0;
        summary.totalPieces += earning.pieces || 0;
        summary.damageDeductions += earning.damageDeduction || 0;

        switch (earning.status) {
          case 'pending':
            summary.pendingEarnings += earning.earnings || 0;
            break;
          case 'confirmed':
            summary.confirmedEarnings += earning.earnings || 0;
            break;
          case 'paid':
            summary.paidEarnings += earning.earnings || 0;
            break;
          case 'held':
            summary.heldEarnings += earning.earnings || 0;
            break;
        }
      });

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      console.error('❌ Error getting earnings summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all operators earnings (for supervisor/admin)
  static async getAllOperatorsEarnings(dateRange = null) {
    try {
      let earningsQuery = query(collection(db, 'operatorEarnings'));

      if (dateRange && dateRange.startDate && dateRange.endDate) {
        earningsQuery = query(
          earningsQuery,
          where('completedAt', '>=', dateRange.startDate),
          where('completedAt', '<=', dateRange.endDate)
        );
      }

      const snapshot = await getDocs(earningsQuery);
      const earnings = {};

      snapshot.docs.forEach(doc => {
        const earning = { id: doc.id, ...doc.data() };
        const operatorId = earning.operatorId;

        if (!earnings[operatorId]) {
          earnings[operatorId] = {
            operatorId,
            operatorName: earning.operatorName,
            totalEarnings: 0,
            pendingEarnings: 0,
            confirmedEarnings: 0,
            paidEarnings: 0,
            heldEarnings: 0,
            totalPieces: 0,
            workCount: 0,
            damageDeductions: 0,
            earnings: []
          };
        }

        const operatorData = earnings[operatorId];
        operatorData.totalEarnings += earning.earnings || 0;
        operatorData.totalPieces += earning.pieces || 0;
        operatorData.workCount += 1;
        operatorData.damageDeductions += earning.damageDeduction || 0;
        operatorData.earnings.push(earning);

        switch (earning.status) {
          case 'pending':
            operatorData.pendingEarnings += earning.earnings || 0;
            break;
          case 'confirmed':
            operatorData.confirmedEarnings += earning.earnings || 0;
            break;
          case 'paid':
            operatorData.paidEarnings += earning.earnings || 0;
            break;
          case 'held':
            operatorData.heldEarnings += earning.earnings || 0;
            break;
        }
      });

      return {
        success: true,
        data: Object.values(earnings)
      };
    } catch (error) {
      console.error('❌ Error getting all operators earnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Auto-record earnings for work completion
  static async autoRecordFromWorkCompletion(workCompletionData, operatorRates) {
    try {
      // Get rate for this operation and machine type
      const rate = operatorRates.find(r => 
        r.operation === workCompletionData.operation && 
        r.machineType === workCompletionData.machineType
      );

      if (!rate) {
        console.warn('⚠️ No rate found for operation:', workCompletionData.operation);
        return { success: false, error: 'No rate configured for this operation' };
      }

      const earningsData = {
        ...workCompletionData,
        ratePerPiece: rate.ratePerPiece
      };

      return await this.recordEarnings(earningsData);
    } catch (error) {
      console.error('❌ Error auto-recording earnings:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EarningsService;