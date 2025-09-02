// src/lib/businessLogic.js
// Centralized business logic for garment ERP operations

import { WORK_STATUSES, PRIORITIES, SKILL_LEVELS } from '../constants';
import { dateUtils, arrayUtils, validationUtils } from './appUtils';

// Payment Calculation Logic
export const paymentLogic = {
  // Base payment calculation
  calculateBasePayment: (rate, pieces) => {
    const baseRate = parseFloat(rate) || 0;
    const totalPieces = parseInt(pieces) || 0;
    return baseRate * totalPieces;
  },

  // Calculate payment with efficiency bonus
  calculateWithEfficiencyBonus: (basePayment, efficiency, bonusThreshold = 0.9) => {
    if (efficiency >= bonusThreshold) {
      const bonusRate = Math.min((efficiency - bonusThreshold) * 2, 0.5); // Max 50% bonus
      return basePayment * (1 + bonusRate);
    }
    return basePayment;
  },

  // Calculate skill-based rate adjustment
  applySkillMultiplier: (baseRate, skillLevel) => {
    const skill = SKILL_LEVELS[skillLevel];
    if (skill && skill.multiplier) {
      return baseRate * skill.multiplier;
    }
    return baseRate;
  },

  // Calculate damage-aware payment
  calculateDamageAwarePayment: (bundleData, completionData, damageReports = []) => {
    const basePayment = paymentLogic.calculateBasePayment(
      bundleData.rate, 
      completionData.piecesCompleted
    );

    // Categorize damage reports
    const operatorFaultDamages = damageReports.filter(report => 
      ['stitching_defect', 'needle_damage', 'tension_issue', 'alignment_error'].includes(report.damageType)
    );

    const nonOperatorFaultDamages = damageReports.filter(report =>
      ['fabric_hole', 'color_issue', 'cutting_pattern', 'size_issue', 'material_defect'].includes(report.damageType)
    );

    // Calculate penalties only for operator faults
    let totalPenalty = 0;
    operatorFaultDamages.forEach(damage => {
      const severity = damage.severity || 'minor';
      const penaltyRates = {
        minor: 0.1,   // 10% reduction per piece
        major: 0.25,  // 25% reduction per piece  
        severe: 0.5   // 50% reduction per piece
      };
      
      const penalty = basePayment * (penaltyRates[severity] || 0.1) * (damage.affectedPieces || 1);
      totalPenalty += penalty;
    });

    return {
      basePayment,
      penalties: totalPenalty,
      finalPayment: Math.max(0, basePayment - totalPenalty),
      operatorFaultDamages: operatorFaultDamages.length,
      nonOperatorFaultDamages: nonOperatorFaultDamages.length
    };
  }
};

// Work Assignment Logic
export const workAssignmentLogic = {
  // Calculate work priority score
  calculatePriorityScore: (workItem) => {
    const priority = PRIORITIES[workItem.priority];
    const urgencyScore = priority?.level || 3;
    
    // Factor in due date
    const dueDate = new Date(workItem.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    let dueDateScore = 0;
    if (daysUntilDue <= 1) dueDateScore = 10;
    else if (daysUntilDue <= 3) dueDateScore = 7;
    else if (daysUntilDue <= 7) dueDateScore = 5;
    else dueDateScore = 1;

    return urgencyScore * 2 + dueDateScore;
  },

  // Match operator to work based on skills and availability
  findBestOperatorMatch: (workItem, availableOperators) => {
    return availableOperators
      .map(operator => ({
        operator,
        score: workAssignmentLogic.calculateMatchScore(workItem, operator)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.operator);
  },

  // Calculate how well an operator matches a work item
  calculateMatchScore: (workItem, operator) => {
    let score = 0;

    // Machine type match
    if (operator.machineTypes?.includes(workItem.machineType)) {
      score += 50;
    }

    // Skill level compatibility
    const requiredSkill = workItem.requiredSkillLevel || 'beginner';
    const operatorSkill = operator.skillLevel || 'beginner';
    const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    const requiredIndex = skillLevels.indexOf(requiredSkill);
    const operatorIndex = skillLevels.indexOf(operatorSkill);
    
    if (operatorIndex >= requiredIndex) {
      score += 30;
      // Bonus for exact match to avoid overqualification
      if (operatorIndex === requiredIndex) score += 10;
    }

    // Workload consideration (prefer less busy operators)
    const currentWorkload = operator.currentAssignments?.length || 0;
    score += Math.max(0, 20 - (currentWorkload * 5));

    // Performance history bonus
    if (operator.averageEfficiency > 0.8) score += 10;
    if (operator.qualityScore > 0.9) score += 5;

    return score;
  },

  // Check if operator can be assigned more work
  canAcceptMoreWork: (operator, maxConcurrentWork = 3) => {
    const currentWork = operator.currentAssignments?.length || 0;
    return currentWork < maxConcurrentWork && operator.isActive;
  }
};

// Bundle Management Logic
export const bundleLogic = {
  // Generate bundle display name
  generateDisplayName: (bundleData) => {
    const parts = [
      bundleData.articleName || 'Unknown Article',
      bundleData.color || '',
      bundleData.size || '',
      `(${bundleData.pieces || 0} pcs)`
    ].filter(Boolean);
    
    return parts.join(' ');
  },

  // Calculate bundle completion percentage
  calculateCompletion: (bundleData) => {
    const totalPieces = parseInt(bundleData.pieces) || 0;
    const completedPieces = parseInt(bundleData.completedPieces) || 0;
    
    if (totalPieces === 0) return 0;
    return Math.min(100, Math.round((completedPieces / totalPieces) * 100));
  },

  // Estimate completion time based on operator efficiency
  estimateCompletionTime: (bundleData, operatorEfficiency = 1.0) => {
    const totalPieces = parseInt(bundleData.pieces) || 0;
    const timePerPiece = parseFloat(bundleData.standardTime) || 5; // minutes
    const remainingPieces = totalPieces - (parseInt(bundleData.completedPieces) || 0);
    
    const estimatedMinutes = (remainingPieces * timePerPiece) / operatorEfficiency;
    return Math.ceil(estimatedMinutes);
  },

  // Check if bundle needs urgent attention
  needsUrgentAttention: (bundleData) => {
    const dueDate = new Date(bundleData.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    
    const completion = bundleLogic.calculateCompletion(bundleData);
    const requiredCompletionRate = Math.max(0, 100 - ((hoursUntilDue / 24) * 10));
    
    return completion < requiredCompletionRate && hoursUntilDue > 0;
  }
};

// Quality Control Logic
export const qualityLogic = {
  // Calculate quality score based on damage reports
  calculateQualityScore: (completedPieces, damageReports = []) => {
    if (completedPieces === 0) return 1.0;
    
    const totalDamaged = damageReports.reduce((sum, report) => 
      sum + (report.affectedPieces || 1), 0
    );
    
    const qualityPieces = Math.max(0, completedPieces - totalDamaged);
    return qualityPieces / completedPieces;
  },

  // Determine if quality inspection is needed
  needsQualityInspection: (bundleData, operatorHistory) => {
    // Always inspect if operator is new
    if (!operatorHistory || operatorHistory.completedBundles < 10) {
      return true;
    }

    // Inspect if recent quality score is low
    if (operatorHistory.recentQualityScore < 0.95) {
      return true;
    }

    // Random inspection (10% of bundles)
    return Math.random() < 0.1;
  },

  // Calculate defect severity impact
  calculateDefectImpact: (damageType, affectedPieces, totalPieces) => {
    const severityWeights = {
      'fabric_hole': 0.8,
      'color_issue': 0.6,
      'stitching_defect': 1.0,
      'size_issue': 0.9,
      'alignment_error': 0.7
    };

    const weight = severityWeights[damageType] || 0.5;
    const affectedRatio = affectedPieces / totalPieces;
    
    return {
      impactScore: weight * affectedRatio,
      category: affectedRatio > 0.1 ? 'major' : affectedRatio > 0.05 ? 'minor' : 'minimal'
    };
  }
};

// Production Metrics Logic
export const metricsLogic = {
  // Calculate operator efficiency
  calculateEfficiency: (actualTime, standardTime) => {
    if (!actualTime || !standardTime) return 0;
    return Math.min(2.0, standardTime / actualTime); // Cap at 200%
  },

  // Calculate daily production metrics
  calculateDailyMetrics: (completedWork) => {
    const totalPieces = completedWork.reduce((sum, work) => 
      sum + (work.completedPieces || 0), 0
    );
    
    const totalTime = completedWork.reduce((sum, work) => 
      sum + (work.timeSpent || 0), 0
    );
    
    const averageEfficiency = completedWork.length > 0 ? 
      completedWork.reduce((sum, work) => sum + (work.efficiency || 0), 0) / completedWork.length : 0;

    return {
      totalPieces,
      totalTime,
      averageEfficiency,
      bundlesCompleted: completedWork.length,
      piecesPerHour: totalTime > 0 ? (totalPieces / (totalTime / 60)) : 0
    };
  },

  // Calculate line efficiency
  calculateLineEfficiency: (operatorMetrics) => {
    if (operatorMetrics.length === 0) return 0;
    
    const totalEfficiency = operatorMetrics.reduce((sum, operator) => 
      sum + (operator.efficiency || 0), 0
    );
    
    return totalEfficiency / operatorMetrics.length;
  }
};

// Workflow State Management
export const workflowLogic = {
  // Determine next workflow step
  getNextWorkflowStep: (currentStep, workflowDefinition) => {
    const steps = workflowDefinition.steps || [];
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      return steps[currentIndex + 1];
    }
    
    return null; // Workflow complete
  },

  // Check if workflow step can be started
  canStartStep: (stepId, completedSteps, workflowDefinition) => {
    const steps = workflowDefinition.steps || [];
    const step = steps.find(s => s.id === stepId);
    
    if (!step) return false;
    
    // Check if all dependencies are completed
    const dependencies = step.dependencies || [];
    return dependencies.every(dep => completedSteps.includes(dep));
  },

  // Calculate workflow completion percentage
  calculateWorkflowProgress: (completedSteps, workflowDefinition) => {
    const totalSteps = workflowDefinition.steps?.length || 0;
    if (totalSteps === 0) return 100;
    
    return Math.round((completedSteps.length / totalSteps) * 100);
  }
};

// Export all business logic modules
export default {
  paymentLogic,
  workAssignmentLogic,
  bundleLogic,
  qualityLogic,
  metricsLogic,
  workflowLogic
};