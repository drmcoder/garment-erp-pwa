// Centralized Business Logic Service
// Contains all business rules and calculations

import { dataService } from './DataService';

export class BusinessLogicService {
  
  // Work Assignment Business Logic
  static async canAssignWork(operatorId, workData) {
    try {
      // Get operator data
      const usersResult = await dataService.getAllUsers();
      if (!usersResult.success) {
        return { canAssign: false, reason: 'Failed to load operator data' };
      }
      
      const operator = usersResult.data.find(u => u.id === operatorId);
      if (!operator) {
        return { canAssign: false, reason: 'Operator not found' };
      }
      
      // Check if operator is active
      if (!operator.active || operator.status === 'inactive') {
        return { canAssign: false, reason: 'Operator is inactive' };
      }
      
      // Check machine compatibility
      const requiredMachine = workData.machineType || workData.requiredMachine;
      if (requiredMachine && operator.machine !== requiredMachine && operator.speciality !== requiredMachine) {
        return { canAssign: false, reason: `Operator machine (${operator.machine}) not compatible with required machine (${requiredMachine})` };
      }
      
      // Check skill level
      const requiredSkill = workData.skillLevel || 'basic';
      const operatorSkill = operator.skillLevel || 'basic';
      const skillLevels = { 'basic': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
      
      if (skillLevels[operatorSkill] < skillLevels[requiredSkill]) {
        return { canAssign: false, reason: `Operator skill level (${operatorSkill}) insufficient for required level (${requiredSkill})` };
      }
      
      // Check current workload
      const activeAssignments = await dataService.getActiveAssignments(operatorId);
      if (activeAssignments.success) {
        const maxConcurrentWork = operator.maxConcurrentWork || 1;
        if (activeAssignments.data.length >= maxConcurrentWork) {
          return { canAssign: false, reason: `Operator already has maximum concurrent work (${maxConcurrentWork})` };
        }
      }
      
      return { canAssign: true };
    } catch (error) {
      return { canAssign: false, reason: `Error checking assignment eligibility: ${error.message}` };
    }
  }
  
  // Calculate work completion earnings
  static calculateEarnings(workData, completionData) {
    const baseRate = workData.rate || 0;
    const pieces = completionData.pieces || 0;
    const quality = completionData.quality || 100;
    
    // Base calculation
    let earnings = baseRate * pieces;
    
    // Quality bonus/penalty
    if (quality >= 98) {
      earnings *= 1.1; // 10% bonus for excellent quality
    } else if (quality >= 95) {
      earnings *= 1.05; // 5% bonus for good quality
    } else if (quality < 90) {
      earnings *= 0.9; // 10% penalty for poor quality
    }
    
    // Efficiency bonus (if completed faster than expected)
    const expectedDuration = workData.expectedDuration || 60; // minutes
    const actualDuration = completionData.duration || expectedDuration;
    
    if (actualDuration < expectedDuration * 0.8) {
      earnings *= 1.15; // 15% bonus for high efficiency
    } else if (actualDuration < expectedDuration * 0.9) {
      earnings *= 1.08; // 8% bonus for good efficiency
    }
    
    return Math.round(earnings * 100) / 100; // Round to 2 decimal places
  }
  
  // Production efficiency calculations
  static calculateProductionEfficiency(completions, timeFrame = 'daily') {
    if (!completions || completions.length === 0) {
      return { efficiency: 0, details: {} };
    }
    
    const now = new Date();
    let startDate;
    
    switch (timeFrame) {
      case 'hourly':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    const filteredCompletions = completions.filter(c => {
      const completedAt = new Date(c.completedAt);
      return completedAt >= startDate;
    });
    
    if (filteredCompletions.length === 0) {
      return { efficiency: 0, details: {} };
    }
    
    const totalPieces = filteredCompletions.reduce((sum, c) => sum + (c.pieces || 0), 0);
    const totalTime = filteredCompletions.reduce((sum, c) => sum + (c.duration || 60), 0); // minutes
    const averageQuality = filteredCompletions.reduce((sum, c) => sum + (c.quality || 100), 0) / filteredCompletions.length;
    
    // Calculate efficiency score (pieces per hour weighted by quality)
    const piecesPerHour = totalTime > 0 ? (totalPieces / totalTime) * 60 : 0;
    const efficiency = (piecesPerHour * (averageQuality / 100)) * 100;
    
    return {
      efficiency: Math.round(efficiency),
      details: {
        totalPieces,
        totalTime,
        averageQuality,
        piecesPerHour,
        completions: filteredCompletions.length
      }
    };
  }
  
  // Quality analysis
  static analyzeQuality(completions, threshold = 95) {
    if (!completions || completions.length === 0) {
      return { averageQuality: 100, issues: [], recommendations: [] };
    }
    
    const qualities = completions.map(c => c.quality || 100);
    const averageQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
    
    const issues = [];
    const recommendations = [];
    
    // Identify quality issues
    const belowThreshold = completions.filter(c => (c.quality || 100) < threshold);
    if (belowThreshold.length > 0) {
      issues.push({
        type: 'quality_below_threshold',
        count: belowThreshold.length,
        percentage: (belowThreshold.length / completions.length) * 100,
        threshold
      });
    }
    
    // Check for declining quality trend
    const recentCompletions = completions.slice(-10); // Last 10 completions
    if (recentCompletions.length >= 5) {
      const recentAverage = recentCompletions.reduce((sum, c) => sum + (c.quality || 100), 0) / recentCompletions.length;
      const overallAverage = averageQuality;
      
      if (recentAverage < overallAverage - 5) {
        issues.push({
          type: 'declining_trend',
          recentAverage,
          overallAverage,
          decline: overallAverage - recentAverage
        });
        
        recommendations.push({
          type: 'quality_training',
          message: 'Consider additional quality training or machine maintenance'
        });
      }
    }
    
    // Generate recommendations based on issues
    if (issues.length > 0) {
      recommendations.push({
        type: 'quality_review',
        message: 'Review quality control procedures and provide feedback'
      });
    }
    
    return {
      averageQuality: Math.round(averageQuality * 100) / 100,
      issues,
      recommendations
    };
  }
  
  // Workload balancing
  static balanceWorkload(operators, workItems) {
    if (!operators || !workItems || operators.length === 0 || workItems.length === 0) {
      return [];
    }
    
    // Calculate current workload for each operator
    const operatorWorkloads = operators.map(operator => {
      const assignedWork = workItems.filter(w => 
        w.operatorId === operator.id && 
        ['assigned', 'in_progress'].includes(w.status)
      );
      
      const totalPieces = assignedWork.reduce((sum, w) => sum + (w.pieces || w.targetPieces || 0), 0);
      const estimatedHours = assignedWork.reduce((sum, w) => sum + (w.estimatedHours || 1), 0);
      
      return {
        ...operator,
        currentWorkload: {
          assignments: assignedWork.length,
          pieces: totalPieces,
          estimatedHours
        }
      };
    });
    
    // Sort by workload (ascending) to find least loaded operators first
    operatorWorkloads.sort((a, b) => {
      const aLoad = a.currentWorkload.assignments * 10 + a.currentWorkload.estimatedHours;
      const bLoad = b.currentWorkload.assignments * 10 + b.currentWorkload.estimatedHours;
      return aLoad - bLoad;
    });
    
    return operatorWorkloads;
  }
  
  // Dependency resolution for work items
  static async resolveDependencies(bundleId) {
    try {
      const bundleWorkResult = await dataService.fetchCollection('work_items', {
        where: [['bundleId', '==', bundleId]]
      });
      
      if (!bundleWorkResult.success) {
        return { resolved: [], waiting: [] };
      }
      
      const workItems = bundleWorkResult.data;
      const resolved = [];
      const waiting = [];
      
      for (const workItem of workItems) {
        if (!workItem.dependencies || workItem.dependencies.length === 0) {
          // No dependencies, can be started immediately
          if (workItem.status === 'waiting') {
            resolved.push(workItem);
          }
        } else {
          // Check if all dependencies are completed
          const allDependenciesCompleted = workItem.dependencies.every(depId => {
            const dependency = workItems.find(w => 
              w.operationId === depId && 
              ['completed', 'operator_completed'].includes(w.status)
            );
            return !!dependency;
          });
          
          if (allDependenciesCompleted && workItem.status === 'waiting') {
            resolved.push(workItem);
          } else if (!allDependenciesCompleted) {
            waiting.push(workItem);
          }
        }
      }
      
      return { resolved, waiting };
    } catch (error) {
      console.error('Error resolving dependencies:', error);
      return { resolved: [], waiting: [] };
    }
  }
  
  // Generate production reports
  static async generateProductionReport(dateRange, operators = null) {
    try {
      const completionsResult = await dataService.getWorkCompletions({
        where: [
          ['completedAt', '>=', dateRange.start],
          ['completedAt', '<=', dateRange.end]
        ]
      });
      
      if (!completionsResult.success) {
        return { success: false, error: 'Failed to fetch completion data' };
      }
      
      const completions = completionsResult.data;
      let filteredCompletions = completions;
      
      // Filter by operators if specified
      if (operators && operators.length > 0) {
        const operatorIds = operators.map(op => op.id || op);
        filteredCompletions = completions.filter(c => operatorIds.includes(c.operatorId));
      }
      
      // Calculate metrics
      const totalPieces = filteredCompletions.reduce((sum, c) => sum + (c.pieces || 0), 0);
      const totalEarnings = filteredCompletions.reduce((sum, c) => sum + (c.earnings || 0), 0);
      const averageQuality = filteredCompletions.length > 0 
        ? filteredCompletions.reduce((sum, c) => sum + (c.quality || 100), 0) / filteredCompletions.length 
        : 100;
      
      // Group by operator
      const operatorStats = {};
      filteredCompletions.forEach(completion => {
        const operatorId = completion.operatorId;
        if (!operatorStats[operatorId]) {
          operatorStats[operatorId] = {
            operatorId,
            completions: 0,
            pieces: 0,
            earnings: 0,
            qualityTotal: 0
          };
        }
        
        operatorStats[operatorId].completions++;
        operatorStats[operatorId].pieces += completion.pieces || 0;
        operatorStats[operatorId].earnings += completion.earnings || 0;
        operatorStats[operatorId].qualityTotal += completion.quality || 100;
      });
      
      // Calculate averages for operators
      Object.values(operatorStats).forEach(stats => {
        stats.averageQuality = stats.completions > 0 ? stats.qualityTotal / stats.completions : 100;
      });
      
      return {
        success: true,
        data: {
          dateRange,
          summary: {
            totalCompletions: filteredCompletions.length,
            totalPieces,
            totalEarnings,
            averageQuality: Math.round(averageQuality * 100) / 100
          },
          operatorStats: Object.values(operatorStats),
          rawData: filteredCompletions
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Workflow notifications
  static async sendWorkflowNotifications(completedWork, notificationService) {
    try {
      const { resolved } = await this.resolveDependencies(completedWork.bundleId);
      
      if (resolved.length > 0) {
        // Find operators who can work on the newly available operations
        const usersResult = await dataService.getAllUsers();
        if (usersResult.success) {
          const operators = usersResult.data.filter(u => u.role === 'operator');
          
          for (const workItem of resolved) {
            const compatibleOperators = operators.filter(op => 
              op.machine === workItem.machineType || 
              op.speciality === workItem.operation
            );
            
            // Send notifications to compatible operators
            if (notificationService) {
              await notificationService.sendWorkflowNotification(completedWork, compatibleOperators);
            }
          }
        }
      }
      
      return { success: true, notificationsSent: resolved.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default BusinessLogicService;