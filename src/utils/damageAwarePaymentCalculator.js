// src/utils/damageAwarePaymentCalculator.js
// Enhanced payment calculation system that handles rework pieces fairly

/**
 * Calculate fair payment for bundles with damaged/reworked pieces
 * Key principle: Operators should NOT be penalized for fabric/material defects beyond their control
 */

export class DamageAwarePaymentCalculator {
  constructor() {
    this.reworkPolicies = {
      // Operator gets full payment for these damage types (not their fault)
      NOT_OPERATOR_FAULT: [
        'fabric_hole',      // Fabric defects
        'color_issue',      // Color mismatches  
        'cutting_pattern',  // Cutting issues
        'size_issue',       // Size problems
        'material_defect'   // Material quality issues
      ],
      
      // Reduced payment for operator errors
      OPERATOR_ERROR: [
        'stitching_defect', // Stitching mistakes
        'needle_damage',    // Needle-related damage
        'tension_issue',    // Machine tension problems
        'alignment_error'   // Alignment mistakes
      ],
      
      // Payment reduction percentages
      PENALTY_RATES: {
        minor_operator_error: 0.1,    // 10% reduction
        major_operator_error: 0.25,   // 25% reduction
        severe_operator_error: 0.5    // 50% reduction
      }
    };
  }

  /**
   * Calculate payment for bundle with damage-aware hold/release logic
   * @param {Object} bundleData - Bundle information
   * @param {Object} completionData - Completion details
   * @param {Array} damageReports - Active damage reports
   * @returns {Object} Payment breakdown with hold/release logic
   */
  calculateBundlePayment(bundleData, completionData, damageReports = []) {
    const baseRate = parseFloat(bundleData.rate) || 0;
    const totalPieces = parseInt(bundleData.pieces) || 0;
    const completedPieces = parseInt(completionData.piecesCompleted) || 0;
    
    // Separate pieces into categories
    const damagedPieces = this.getDamagedPieces(damageReports);
    const reworkCompletedPieces = this.getReworkCompletedPieces(damageReports);
    const pendingReworkPieces = this.getPendingReworkPieces(damageReports);
    
    // Calculate payments by category
    const completedGoodPieces = completedPieces - damagedPieces.length;
    const basePayment = completedGoodPieces * baseRate; // Only for good pieces
    const reworkPayment = this.calculateReworkPayment(bundleData, reworkCompletedPieces, baseRate);
    const heldPayment = this.calculateHeldPayment(pendingReworkPieces, baseRate);
    
    // Quality adjustments
    const qualityAdjustment = this.calculateQualityAdjustment(
      bundleData, 
      completionData, 
      baseRate
    );

    // Calculate current releasable payment
    const currentPayment = basePayment + reworkPayment - qualityAdjustment;
    
    // Efficiency bonus for completing work despite damage
    const efficiencyBonus = this.calculateEfficiencyBonus(bundleData, completionData, baseRate);

    return {
      breakdown: {
        goodPieces: completedGoodPieces,
        goodPiecesPayment: basePayment,
        reworkCompletedPieces: reworkCompletedPieces.length,
        reworkCompletedPayment: reworkPayment,
        pendingReworkPieces: pendingReworkPieces.length,
        heldPayment: heldPayment,
        qualityPenalty: qualityAdjustment,
        efficiencyBonus: efficiencyBonus,
        currentPayment: currentPayment + efficiencyBonus,
        totalPotentialPayment: basePayment + reworkPayment + heldPayment + efficiencyBonus
      },
      paymentStatus: {
        canRelease: currentPayment + efficiencyBonus,
        held: heldPayment,
        pendingRework: pendingReworkPieces.length,
        status: pendingReworkPieces.length > 0 ? 'partial_hold' : 'full_release'
      },
      summary: {
        operator: bundleData.assignedTo || bundleData.operatorName,
        bundleId: bundleData.bundleNumber || bundleData.id,
        operation: bundleData.operation,
        rate: baseRate,
        currentEarned: currentPayment + efficiencyBonus,
        heldEarnings: heldPayment,
        piecesCompleted: completedPieces,
        pendingPieces: pendingReworkPieces.length
      },
      damageDetails: {
        completed: reworkCompletedPieces.map(piece => ({
          pieceNumber: piece.pieceNumber,
          damageType: piece.damageType,
          paymentReleased: this.shouldPayForRework(piece.damageType)
        })),
        pending: pendingReworkPieces.map(piece => ({
          pieceNumber: piece.pieceNumber,
          damageType: piece.damageType,
          paymentHeld: this.shouldPayForRework(piece.damageType) ? baseRate : baseRate * 0.5,
          status: piece.status
        }))
      }
    };
  }

  /**
   * Get all damaged pieces from damage reports
   */
  getDamagedPieces(damageReports) {
    const damagedPieces = [];
    damageReports.forEach(report => {
      report.pieceNumbers.forEach(pieceNum => {
        damagedPieces.push({
          pieceNumber: pieceNum,
          damageType: report.damageType,
          status: report.status,
          reportId: report.id
        });
      });
    });
    return damagedPieces;
  }

  /**
   * Get damaged pieces that have been reworked and returned completed
   */
  getReworkCompletedPieces(damageReports) {
    return this.getDamagedPieces(damageReports)
      .filter(piece => piece.status === 'returned_completed');
  }

  /**
   * Get damaged pieces still pending rework
   */
  getPendingReworkPieces(damageReports) {
    return this.getDamagedPieces(damageReports)
      .filter(piece => ['reported', 'supervisor_received', 'in_rework'].includes(piece.status));
  }

  /**
   * Calculate payment held for pending rework pieces
   */
  calculateHeldPayment(pendingPieces, baseRate) {
    let heldAmount = 0;
    pendingPieces.forEach(piece => {
      if (this.shouldPayForRework(piece.damageType)) {
        heldAmount += baseRate; // Full payment held for non-operator fault
      } else {
        heldAmount += baseRate * 0.5; // Partial payment held for operator errors
      }
    });
    return heldAmount;
  }

  /**
   * Get reworked pieces from bundle damage log (legacy method for compatibility)
   */
  getReworkedPieces(bundleData) {
    return bundleData.damageLog || [];
  }

  /**
   * Calculate payment for reworked pieces
   */
  calculateReworkPayment(bundleData, reworkedPieces, baseRate) {
    let reworkPayment = 0;
    
    reworkedPieces.forEach(rework => {
      if (this.shouldPayForRework(rework.damageType)) {
        // Full payment for non-operator fault damage
        reworkPayment += baseRate;
      } else {
        // Reduced payment for operator errors
        const penalty = this.getPenaltyRate(rework.damageType, rework.severity);
        reworkPayment += baseRate * (1 - penalty);
      }
    });

    return reworkPayment;
  }

  /**
   * Determine if operator should get paid for rework
   */
  shouldPayForRework(damageType) {
    return this.reworkPolicies.NOT_OPERATOR_FAULT.includes(damageType);
  }

  /**
   * Get penalty rate for operator errors
   */
  getPenaltyRate(damageType, severity = 'minor') {
    if (this.reworkPolicies.NOT_OPERATOR_FAULT.includes(damageType)) {
      return 0; // No penalty for non-operator fault
    }
    
    const severityKey = `${severity}_operator_error`;
    return this.reworkPolicies.PENALTY_RATES[severityKey] || 0.1;
  }

  /**
   * Get human-readable reason for payment decision
   */
  getPaymentReason(damageType) {
    if (this.shouldPayForRework(damageType)) {
      return 'Material/cutting defect - not operator fault';
    } else {
      return 'Operator error - reduced payment applied';
    }
  }

  /**
   * Calculate quality-based adjustments
   */
  calculateQualityAdjustment(bundleData, completionData, baseRate) {
    const qualityScore = completionData.qualityScore || 100;
    const defectivePieces = parseInt(completionData.defectivePieces) || 0;
    
    let adjustment = 0;
    
    // Penalty for permanently defective pieces (operator fault)
    adjustment += defectivePieces * baseRate * 0.5; // 50% penalty for defective pieces
    
    // Quality score adjustment (only if very poor quality)
    if (qualityScore < 80) {
      const totalPieces = parseInt(bundleData.pieces) || 0;
      const qualityPenalty = (80 - qualityScore) / 100;
      adjustment += (totalPieces * baseRate * qualityPenalty * 0.1);
    }

    return Math.max(0, adjustment);
  }

  /**
   * Calculate efficiency bonus for handling damaged work well
   */
  calculateEfficiencyBonus(bundleData, completionData, baseRate) {
    const reworkedPieces = this.getReworkedPieces(bundleData);
    
    // Bonus for completing work despite damage complications
    if (reworkedPieces.length > 0 && completionData.qualityScore >= 95) {
      const totalPieces = parseInt(bundleData.pieces) || 0;
      return totalPieces * baseRate * 0.05; // 5% bonus for excellent work with complications
    }
    
    return 0;
  }

  /**
   * Generate payment summary for display
   */
  generatePaymentSummary(paymentResult, language = 'en') {
    const { breakdown, summary } = paymentResult;
    
    const messages = {
      en: {
        title: `💰 Payment Summary - ${summary.bundleId}`,
        basePay: `Base Payment: ${breakdown.basePieces} pieces × ${summary.rate} = ${breakdown.basePayment.toFixed(2)}`,
        reworkPay: `Rework Payment: ${breakdown.reworkPieces} pieces = ${breakdown.reworkPayment.toFixed(2)}`,
        bonus: `Efficiency Bonus: ${breakdown.efficiencyBonus.toFixed(2)}`,
        penalty: `Quality Penalty: -${breakdown.qualityPenalty.toFixed(2)}`,
        total: `Total Earned: ${summary.totalEarned.toFixed(2)}`,
        note: breakdown.reworkPieces > 0 ? `✅ Rework pieces included in payment (not operator fault)` : ''
      },
      np: {
        title: `💰 भुक्तानी सारांश - ${summary.bundleId}`,
        basePay: `आधार भुक्तानी: ${breakdown.basePieces} टुक्रा × ${summary.rate} = ${breakdown.basePayment.toFixed(2)}`,
        reworkPay: `मर्मत भुक्तानी: ${breakdown.reworkPieces} टुक्रा = ${breakdown.reworkPayment.toFixed(2)}`,
        bonus: `दक्षता बोनस: ${breakdown.efficiencyBonus.toFixed(2)}`,
        penalty: `गुणस्तर जरिवाना: -${breakdown.qualityPenalty.toFixed(2)}`,
        total: `कुल कमाइ: ${summary.totalEarned.toFixed(2)}`,
        note: breakdown.reworkPieces > 0 ? `✅ मर्मत टुक्राहरू भुक्तानीमा समावेश (अपरेटरको गल्ती होइन)` : ''
      }
    };

    return messages[language] || messages.en;
  }

  /**
   * Validate payment calculation
   */
  validatePayment(bundleData, completionData, paymentResult) {
    const errors = [];
    const warnings = [];
    
    // Check if all pieces are accounted for
    const totalPieces = parseInt(bundleData.pieces) || 0;
    const accountedPieces = paymentResult.breakdown.totalPieces + 
                           parseInt(completionData.defectivePieces || 0);
    
    if (accountedPieces !== totalPieces) {
      errors.push(`Piece count mismatch: Expected ${totalPieces}, got ${accountedPieces}`);
    }
    
    // Check for unusual payment amounts
    const expectedMin = totalPieces * (bundleData.rate || 0) * 0.5; // 50% minimum
    const expectedMax = totalPieces * (bundleData.rate || 0) * 1.2; // 120% maximum
    
    if (paymentResult.summary.totalEarned < expectedMin) {
      warnings.push('Payment is unusually low - please review quality penalties');
    }
    
    if (paymentResult.summary.totalEarned > expectedMax) {
      warnings.push('Payment is unusually high - please review bonuses');
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }
}

// Export singleton instance
export const damageAwareCalculator = new DamageAwarePaymentCalculator();

// Utility functions for common use cases
export const calculateFairPayment = (bundleData, completionData, damageReports = []) => {
  return damageAwareCalculator.calculateBundlePayment(bundleData, completionData, damageReports);
};

export const shouldPayForDamage = (damageType) => {
  return damageAwareCalculator.shouldPayForRework(damageType);
};

export const generatePaymentReport = (bundleData, completionData, language = 'en') => {
  const payment = calculateFairPayment(bundleData, completionData);
  return damageAwareCalculator.generatePaymentSummary(payment, language);
};

// Example usage for Ashika's scenario:
/*
const ashikaBundleData = {
  bundleNumber: 'B001-85-BL-XL',
  pieces: 22,
  rate: 2.50,
  operation: 'Sleeve Join',
  damageLog: [
    {
      pieceNumber: 15,
      damageType: 'fabric_hole', // Not operator fault
      reportedBy: 'ashika_operator',
      status: 'returned_fixed'
    }
  ]
};

const completion = {
  piecesCompleted: 22, // All pieces completed including reworked one
  defectivePieces: 0,
  qualityScore: 96
};

const payment = calculateFairPayment(ashikaBundleData, completion);
// Result: Ashika gets paid for all 22 pieces = 22 × 2.50 = 55.00
// Plus possible efficiency bonus for handling complications well
*/