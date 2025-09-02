// src/services/WorkflowAnalyticsService.js
// Analytics and Template Learning Service for Dynamic Work Insertion

import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from '../config/firebase';

export class WorkflowAnalyticsService {
  
  // Track emergency insertion for analytics
  static async trackEmergencyInsertion(insertionData) {
    try {
      const trackingRecord = {
        lotNumber: insertionData.lotNumber,
        operationType: insertionData.operationType,
        operationName: insertionData.operationName,
        machineType: insertionData.machineType,
        insertionPoint: insertionData.insertionPoint,
        reason: insertionData.reason,
        estimatedTime: insertionData.estimatedTime,
        insertedBy: insertionData.insertedBy,
        insertedAt: serverTimestamp(),
        garmentType: insertionData.garmentType || 'unknown',
        styleNumber: insertionData.styleNumber || null,
        frequency: 1, // Will be updated by aggregation
        urgencyLevel: insertionData.priority || 'medium'
      };

      await addDoc(collection(db, 'emergencyInsertions'), trackingRecord);
      console.log('📊 Emergency insertion tracked for analytics');
      
      // Update real-time analytics
      await this.updateInsertionFrequency(insertionData.operationType, insertionData.garmentType);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to track emergency insertion:', error);
      return { success: false, error: error.message };
    }
  }

  // Get insertion analytics and trends
  static async getInsertionAnalytics(timeRange = 'last30days') {
    try {
      let startDate = new Date();
      
      switch (timeRange) {
        case 'last7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'last3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const analyticsQuery = query(
        collection(db, 'emergencyInsertions'),
        where("insertedAt", ">=", startDate),
        orderBy("insertedAt", "desc")
      );

      const snapshot = await getDocs(analyticsQuery);
      const insertions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Analyze patterns
      const analytics = {
        totalInsertions: insertions.length,
        mostFrequentOperations: this.calculateOperationFrequency(insertions),
        mostAffectedGarments: this.calculateGarmentFrequency(insertions),
        commonReasons: this.calculateReasonFrequency(insertions),
        timeDistribution: this.calculateTimeDistribution(insertions),
        machineTypeDistribution: this.calculateMachineDistribution(insertions),
        templateSuggestions: await this.generateTemplateSuggestions(insertions),
        trendAnalysis: this.analyzeTrends(insertions),
        costImpact: this.calculateCostImpact(insertions)
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('Failed to get insertion analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate operation frequency for template suggestions
  static calculateOperationFrequency(insertions) {
    const operationCounts = {};
    
    insertions.forEach(insertion => {
      const key = `${insertion.operationType}_${insertion.operationName}`;
      if (!operationCounts[key]) {
        operationCounts[key] = {
          operationType: insertion.operationType,
          operationName: insertion.operationName,
          count: 0,
          machineType: insertion.machineType,
          averageTime: 0,
          reasons: []
        };
      }
      operationCounts[key].count++;
      operationCounts[key].averageTime = 
        (operationCounts[key].averageTime + insertion.estimatedTime) / 2;
      
      if (insertion.reason && !operationCounts[key].reasons.includes(insertion.reason)) {
        operationCounts[key].reasons.push(insertion.reason);
      }
    });

    return Object.values(operationCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most frequent
  }

  // Calculate garment type frequency
  static calculateGarmentFrequency(insertions) {
    const garmentCounts = {};
    
    insertions.forEach(insertion => {
      const garmentType = insertion.garmentType || 'unknown';
      if (!garmentCounts[garmentType]) {
        garmentCounts[garmentType] = { garmentType, count: 0, operations: [] };
      }
      garmentCounts[garmentType].count++;
      
      if (!garmentCounts[garmentType].operations.find(op => 
          op.operationType === insertion.operationType)) {
        garmentCounts[garmentType].operations.push({
          operationType: insertion.operationType,
          operationName: insertion.operationName,
          frequency: 1
        });
      } else {
        const existingOp = garmentCounts[garmentType].operations.find(op => 
          op.operationType === insertion.operationType);
        existingOp.frequency++;
      }
    });

    return Object.values(garmentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  // Calculate reason frequency
  static calculateReasonFrequency(insertions) {
    const reasonCounts = {};
    
    insertions.forEach(insertion => {
      const reason = insertion.reason || 'No reason provided';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Calculate time distribution patterns
  static calculateTimeDistribution(insertions) {
    const hourCounts = {};
    const dayOfWeekCounts = {};
    
    insertions.forEach(insertion => {
      if (insertion.insertedAt && insertion.insertedAt.toDate) {
        const date = insertion.insertedAt.toDate();
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
      }
    });

    return {
      hourlyDistribution: hourCounts,
      dailyDistribution: dayOfWeekCounts,
      peakInsertionHour: Object.keys(hourCounts).reduce((a, b) => 
        hourCounts[a] > hourCounts[b] ? a : b, '0'),
      peakInsertionDay: Object.keys(dayOfWeekCounts).reduce((a, b) => 
        dayOfWeekCounts[a] > dayOfWeekCounts[b] ? a : b, '0')
    };
  }

  // Calculate machine type distribution
  static calculateMachineDistribution(insertions) {
    const machineCounts = {};
    
    insertions.forEach(insertion => {
      const machine = insertion.machineType || 'unknown';
      machineCounts[machine] = (machineCounts[machine] || 0) + 1;
    });

    return Object.entries(machineCounts)
      .map(([machine, count]) => ({ machine, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Generate template suggestions based on patterns
  static async generateTemplateSuggestions(insertions) {
    const suggestions = [];
    const frequentOperations = this.calculateOperationFrequency(insertions);
    
    // Operations that occur frequently (more than 3 times) should be in templates
    frequentOperations.forEach(operation => {
      if (operation.count >= 3) {
        suggestions.push({
          type: 'add_to_template',
          operationType: operation.operationType,
          operationName: operation.operationName,
          machineType: operation.machineType,
          frequency: operation.count,
          averageTime: Math.round(operation.averageTime),
          confidence: this.calculateConfidence(operation.count, insertions.length),
          reasons: operation.reasons.slice(0, 3), // Top 3 reasons
          recommendation: `Add "${operation.operationName}" to standard template - occurs ${operation.count} times`
        });
      }
    });

    // Garment-specific suggestions
    const garmentFrequencies = this.calculateGarmentFrequency(insertions);
    garmentFrequencies.forEach(garment => {
      if (garment.count >= 2) {
        garment.operations.forEach(op => {
          if (op.frequency >= 2) {
            suggestions.push({
              type: 'garment_specific_template',
              garmentType: garment.garmentType,
              operationType: op.operationType,
              operationName: op.operationName,
              frequency: op.frequency,
              confidence: this.calculateConfidence(op.frequency, garment.count),
              recommendation: `Add "${op.operationName}" to ${garment.garmentType} template - occurs ${op.frequency}/${garment.count} times`
            });
          }
        });
      }
    });

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  // Calculate confidence score for suggestions
  static calculateConfidence(frequency, totalCount) {
    const baseConfidence = (frequency / totalCount) * 100;
    const frequencyBonus = Math.min(frequency * 5, 25); // Max 25% bonus
    return Math.min(baseConfidence + frequencyBonus, 95); // Max 95% confidence
  }

  // Analyze trends over time
  static analyzeTrends(insertions) {
    const trends = {
      increasingOperations: [],
      decreasingOperations: [],
      seasonalPatterns: {},
      urgencyTrends: {}
    };

    // Simple trend analysis - compare first half vs second half of data
    const midPoint = Math.floor(insertions.length / 2);
    const firstHalf = insertions.slice(midPoint); // More recent (since sorted desc)
    const secondHalf = insertions.slice(0, midPoint); // Older

    const firstHalfOps = this.calculateOperationFrequency(firstHalf);
    const secondHalfOps = this.calculateOperationFrequency(secondHalf);

    firstHalfOps.forEach(op1 => {
      const op2 = secondHalfOps.find(op => op.operationType === op1.operationType);
      if (op2) {
        const change = ((op1.count - op2.count) / op2.count) * 100;
        if (change > 20) {
          trends.increasingOperations.push({
            operation: op1.operationName,
            change: `+${Math.round(change)}%`
          });
        } else if (change < -20) {
          trends.decreasingOperations.push({
            operation: op1.operationName,
            change: `${Math.round(change)}%`
          });
        }
      }
    });

    return trends;
  }

  // Calculate cost impact of insertions
  static calculateCostImpact(insertions) {
    const totalInsertions = insertions.length;
    const averageDelayTime = insertions.reduce((sum, ins) => 
      sum + (ins.estimatedTime || 0), 0) / totalInsertions;
    
    // Rough cost estimates (would be configurable in real system)
    const hourlyOperatorCost = 500; // NPR per hour
    const workflowDisruptionCost = 200; // NPR per disruption
    
    const totalDelayHours = (averageDelayTime * totalInsertions) / 60;
    const directCost = totalDelayHours * hourlyOperatorCost;
    const indirectCost = totalInsertions * workflowDisruptionCost;
    
    return {
      totalInsertions,
      averageDelayMinutes: Math.round(averageDelayTime),
      totalDelayHours: Math.round(totalDelayHours * 10) / 10,
      directCost: Math.round(directCost),
      indirectCost: Math.round(indirectCost),
      totalCost: Math.round(directCost + indirectCost),
      costPerInsertion: Math.round((directCost + indirectCost) / totalInsertions)
    };
  }

  // Update insertion frequency counters
  static async updateInsertionFrequency(operationType, garmentType) {
    try {
      const frequencyDocId = `${operationType}_${garmentType || 'unknown'}`;
      const frequencyRef = doc(db, 'insertionFrequency', frequencyDocId);
      
      const frequencyDoc = await getDoc(frequencyRef);
      
      if (frequencyDoc.exists()) {
        await updateDoc(frequencyRef, {
          count: (frequencyDoc.data().count || 0) + 1,
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(frequencyRef, {
          operationType,
          garmentType: garmentType || 'unknown',
          count: 1,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update insertion frequency:', error);
      return { success: false, error: error.message };
    }
  }

  // Get template suggestions for supervisors
  static async getTemplateSuggestions() {
    try {
      const analytics = await this.getInsertionAnalytics('last3months');
      
      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const suggestions = analytics.analytics.templateSuggestions;
      
      return {
        success: true,
        suggestions: suggestions.filter(s => s.confidence > 50), // Only high-confidence suggestions
        summary: {
          totalSuggestions: suggestions.length,
          highConfidenceSuggestions: suggestions.filter(s => s.confidence > 70).length,
          averageConfidence: suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
        }
      };
    } catch (error) {
      console.error('Failed to get template suggestions:', error);
      return { success: false, error: error.message };
    }
  }

  // Apply template suggestion (add to standard workflow)
  static async applyTemplateSuggestion(suggestion, approvedBy) {
    try {
      const templateUpdate = {
        operationType: suggestion.operationType,
        operationName: suggestion.operationName,
        machineType: suggestion.machineType,
        estimatedTime: suggestion.averageTime,
        addedFromAnalytics: true,
        confidence: suggestion.confidence,
        approvedBy: approvedBy,
        appliedAt: serverTimestamp(),
        originalFrequency: suggestion.frequency
      };

      if (suggestion.type === 'garment_specific_template') {
        templateUpdate.garmentType = suggestion.garmentType;
        await addDoc(collection(db, 'garmentSpecificTemplates'), templateUpdate);
      } else {
        await addDoc(collection(db, 'standardOperationTemplates'), templateUpdate);
      }

      console.log(`✅ Template suggestion applied: ${suggestion.operationName}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to apply template suggestion:', error);
      return { success: false, error: error.message };
    }
  }
}