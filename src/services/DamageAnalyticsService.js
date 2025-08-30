// src/services/DamageAnalyticsService.js
// Advanced analytics service for damage reporting and rework efficiency

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  and
} from 'firebase/firestore';

import { db, COLLECTIONS } from '../config/firebase';
import { damageReportService } from './DamageReportService';
import { getDamageTypeById, isOperatorFault } from '../config/damageTypesConfig';

export class DamageAnalyticsService {
  constructor() {
    this.damageReportsCollection = 'damageReports';
    this.operatorsCollection = COLLECTIONS.OPERATORS;
    this.supervisorsCollection = COLLECTIONS.SUPERVISORS;
    this.wageRecordsCollection = COLLECTIONS.WAGE_RECORDS;
  }

  /**
   * Get comprehensive damage analytics for admin dashboard
   */
  async getComprehensiveDamageAnalytics(startDate, endDate, filters = {}) {
    try {
      console.log('🔍 Loading comprehensive damage analytics...');
      
      // Get base analytics from damage report service
      const baseAnalytics = await damageReportService.getDamageAnalytics(startDate, endDate, filters);
      if (!baseAnalytics.success) {
        throw new Error(baseAnalytics.error);
      }

      // Get detailed performance metrics
      const [
        supervisorEfficiency,
        operatorPerformance,
        reworkTrends,
        costAnalysis,
        qualityMetrics
      ] = await Promise.all([
        this.calculateSupervisorEfficiency(startDate, endDate),
        this.calculateOperatorPerformance(startDate, endDate),
        this.calculateReworkTrends(startDate, endDate),
        this.calculateCostAnalysis(startDate, endDate),
        this.calculateQualityMetrics(startDate, endDate)
      ]);

      // Combine all analytics
      const comprehensiveAnalytics = {
        ...baseAnalytics.data,
        supervisorEfficiency,
        operatorPerformance,
        reworkTrends,
        costAnalysis,
        qualityMetrics,
        kpis: this.calculateKPIs(baseAnalytics.data, supervisorEfficiency, operatorPerformance),
        insights: this.generateInsights(baseAnalytics.data, supervisorEfficiency, operatorPerformance),
        recommendations: this.generateRecommendations(baseAnalytics.data, supervisorEfficiency, operatorPerformance)
      };

      return {
        success: true,
        data: comprehensiveAnalytics
      };
    } catch (error) {
      console.error('❌ Error calculating comprehensive analytics:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Calculate supervisor efficiency metrics
   */
  async calculateSupervisorEfficiency(startDate, endDate) {
    try {
      // Get all supervisors
      const supervisorsSnapshot = await getDocs(collection(db, this.supervisorsCollection));
      const supervisors = supervisorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const supervisorMetrics = [];

      for (const supervisor of supervisors) {
        const reports = await this.getSupervisorReports(supervisor.id, startDate, endDate);
        
        if (reports.length === 0) {
          supervisorMetrics.push({
            supervisorId: supervisor.id,
            supervisorName: supervisor.name,
            totalReports: 0,
            avgResolutionTime: 0,
            completionRate: 0,
            qualityScore: 0,
            costEfficiency: 0,
            workload: 'low'
          });
          continue;
        }

        // Calculate metrics
        const completedReports = reports.filter(r => r.status === 'returned_completed' || r.status === 'final_completion');
        const totalResolutionTime = completedReports.reduce((sum, report) => {
          if (report.reworkCompletedAt && report.reportedAt) {
            return sum + (report.reworkCompletedAt - report.reportedAt) / (1000 * 60 * 60); // hours
          }
          return sum;
        }, 0);

        const avgResolutionTime = completedReports.length > 0 ? totalResolutionTime / completedReports.length : 0;
        const completionRate = (completedReports.length / reports.length) * 100;
        
        // Quality score based on rework success and operator satisfaction
        const reworkSuccessCount = reports.filter(r => 
          r.reworkDetails?.qualityCheckPassed && r.status === 'final_completion'
        ).length;
        const qualityScore = reports.length > 0 ? (reworkSuccessCount / reports.length) * 100 : 0;

        // Cost efficiency (lower cost per report is better)
        const totalCost = reports.reduce((sum, r) => sum + (r.reworkDetails?.costEstimate || 0), 0);
        const avgCostPerReport = reports.length > 0 ? totalCost / reports.length : 0;
        const costEfficiency = Math.max(0, 100 - (avgCostPerReport / 50) * 100); // Assuming ₹50 is benchmark

        // Workload assessment
        let workload = 'low';
        if (reports.length > 20) workload = 'high';
        else if (reports.length > 10) workload = 'medium';

        supervisorMetrics.push({
          supervisorId: supervisor.id,
          supervisorName: supervisor.name || supervisor.nameEn,
          totalReports: reports.length,
          avgResolutionTime,
          completionRate,
          qualityScore,
          costEfficiency,
          avgCostPerReport,
          workload,
          specializations: this.identifySpecializations(reports)
        });
      }

      // Calculate overall supervisor performance
      const overallMetrics = {
        totalSupervisors: supervisors.length,
        avgResolutionTime: supervisorMetrics.reduce((sum, s) => sum + s.avgResolutionTime, 0) / supervisorMetrics.length,
        avgCompletionRate: supervisorMetrics.reduce((sum, s) => sum + s.completionRate, 0) / supervisorMetrics.length,
        avgQualityScore: supervisorMetrics.reduce((sum, s) => sum + s.qualityScore, 0) / supervisorMetrics.length,
        avgCostEfficiency: supervisorMetrics.reduce((sum, s) => sum + s.costEfficiency, 0) / supervisorMetrics.length,
        topPerformers: supervisorMetrics
          .sort((a, b) => (b.qualityScore + b.completionRate + b.costEfficiency) - (a.qualityScore + a.completionRate + a.costEfficiency))
          .slice(0, 3),
        workloadDistribution: {
          high: supervisorMetrics.filter(s => s.workload === 'high').length,
          medium: supervisorMetrics.filter(s => s.workload === 'medium').length,
          low: supervisorMetrics.filter(s => s.workload === 'low').length
        }
      };

      return {
        individual: supervisorMetrics,
        overall: overallMetrics
      };
    } catch (error) {
      console.error('❌ Error calculating supervisor efficiency:', error);
      return { individual: [], overall: {} };
    }
  }

  /**
   * Calculate operator performance in damage reporting
   */
  async calculateOperatorPerformance(startDate, endDate) {
    try {
      // Get all operators
      const operatorsSnapshot = await getDocs(collection(db, this.operatorsCollection));
      const operators = operatorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const operatorMetrics = [];

      for (const operator of operators) {
        const reports = await this.getOperatorReports(operator.id, startDate, endDate);
        
        if (reports.length === 0) {
          operatorMetrics.push({
            operatorId: operator.id,
            operatorName: operator.name,
            totalReports: 0,
            reportingAccuracy: 100,
            falsePositiveRate: 0,
            atFaultRate: 0,
            avgReportsPerWeek: 0,
            reportingQuality: 'good'
          });
          continue;
        }

        // Calculate metrics
        const validReports = reports.filter(r => r.status !== 'rejected' && r.status !== 'false_positive');
        const falsePositives = reports.filter(r => r.status === 'false_positive' || r.status === 'rejected');
        const operatorFaultReports = reports.filter(r => isOperatorFault(r.damageType));

        const reportingAccuracy = reports.length > 0 ? (validReports.length / reports.length) * 100 : 100;
        const falsePositiveRate = reports.length > 0 ? (falsePositives.length / reports.length) * 100 : 0;
        const atFaultRate = reports.length > 0 ? (operatorFaultReports.length / reports.length) * 100 : 0;

        // Calculate reports per week
        const weeksDiff = Math.max(1, (endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
        const avgReportsPerWeek = reports.length / weeksDiff;

        // Reporting quality assessment
        let reportingQuality = 'excellent';
        if (falsePositiveRate > 20 || atFaultRate > 50) reportingQuality = 'needs_improvement';
        else if (falsePositiveRate > 10 || atFaultRate > 30) reportingQuality = 'good';

        operatorMetrics.push({
          operatorId: operator.id,
          operatorName: operator.name || operator.nameEn,
          machine: operator.machine,
          assignedLine: operator.assignedLine,
          totalReports: reports.length,
          reportingAccuracy,
          falsePositiveRate,
          atFaultRate,
          avgReportsPerWeek,
          reportingQuality,
          mostCommonDamageTypes: this.getMostCommonDamageTypes(reports),
          improvementNeeded: atFaultRate > 40
        });
      }

      // Calculate overall operator performance
      const overallMetrics = {
        totalOperators: operators.length,
        avgReportingAccuracy: operatorMetrics.reduce((sum, o) => sum + o.reportingAccuracy, 0) / operatorMetrics.length,
        avgFalsePositiveRate: operatorMetrics.reduce((sum, o) => sum + o.falsePositiveRate, 0) / operatorMetrics.length,
        avgAtFaultRate: operatorMetrics.reduce((sum, o) => sum + o.atFaultRate, 0) / operatorMetrics.length,
        totalReports: operatorMetrics.reduce((sum, o) => sum + o.totalReports, 0),
        topReporters: operatorMetrics
          .sort((a, b) => b.totalReports - a.totalReports)
          .slice(0, 5),
        mostAccurateReporters: operatorMetrics
          .sort((a, b) => b.reportingAccuracy - a.reportingAccuracy)
          .slice(0, 5),
        needsImprovement: operatorMetrics.filter(o => o.improvementNeeded)
      };

      return {
        individual: operatorMetrics,
        overall: overallMetrics
      };
    } catch (error) {
      console.error('❌ Error calculating operator performance:', error);
      return { individual: [], overall: {} };
    }
  }

  /**
   * Calculate rework trends and patterns
   */
  async calculateReworkTrends(startDate, endDate) {
    try {
      // Get reports grouped by time periods
      const reports = await this.getReportsInDateRange(startDate, endDate);
      
      // Weekly trends
      const weeklyTrends = this.groupReportsByWeek(reports, startDate, endDate);
      
      // Monthly trends (if data spans multiple months)
      const monthlyTrends = this.groupReportsByMonth(reports, startDate, endDate);
      
      // Damage category trends
      const categoryTrends = this.calculateCategoryTrends(reports);
      
      // Severity trends
      const severityTrends = this.calculateSeverityTrends(reports);
      
      // Resolution time trends
      const resolutionTimeTrends = this.calculateResolutionTimeTrends(reports);

      return {
        weekly: weeklyTrends,
        monthly: monthlyTrends,
        byCategory: categoryTrends,
        bySeverity: severityTrends,
        resolutionTime: resolutionTimeTrends,
        predictions: this.generateTrendPredictions(weeklyTrends, categoryTrends)
      };
    } catch (error) {
      console.error('❌ Error calculating rework trends:', error);
      return {};
    }
  }

  /**
   * Calculate cost analysis
   */
  async calculateCostAnalysis(startDate, endDate) {
    try {
      const reports = await this.getReportsInDateRange(startDate, endDate);
      
      const totalDirectCost = reports.reduce((sum, r) => sum + (r.reworkDetails?.costEstimate || 0), 0);
      const avgCostPerReport = reports.length > 0 ? totalDirectCost / reports.length : 0;
      
      // Calculate indirect costs (time, productivity loss)
      const totalTimeSpent = reports.reduce((sum, r) => sum + (r.reworkDetails?.timeSpentMinutes || 30), 0); // minutes
      const indirectCost = (totalTimeSpent / 60) * 50; // ₹50 per hour for lost productivity
      
      const costByCategory = this.groupCostsByCategory(reports);
      const costBySeverity = this.groupCostsBySeverity(reports);
      
      return {
        totalDirectCost,
        totalIndirectCost: indirectCost,
        totalCost: totalDirectCost + indirectCost,
        avgCostPerReport,
        costPerHour: totalTimeSpent > 0 ? (totalDirectCost + indirectCost) / (totalTimeSpent / 60) : 0,
        byCategory: costByCategory,
        bySeverity: costBySeverity,
        costTrends: this.calculateCostTrends(reports),
        savings: this.calculatePotentialSavings(reports)
      };
    } catch (error) {
      console.error('❌ Error calculating cost analysis:', error);
      return {};
    }
  }

  /**
   * Calculate quality metrics
   */
  async calculateQualityMetrics(startDate, endDate) {
    try {
      const reports = await this.getReportsInDateRange(startDate, endDate);
      
      const totalReports = reports.length;
      const completedReports = reports.filter(r => r.status === 'final_completion');
      const reworkSuccessRate = totalReports > 0 ? (completedReports.length / totalReports) * 100 : 0;
      
      // Quality scores from rework
      const qualityScores = reports
        .filter(r => r.reworkDetails?.qualityCheckPassed)
        .map(r => r.operatorCompletion?.qualityScore || 95);
      
      const avgQualityScore = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;

      // First-time fix rate
      const firstTimeFixRate = reports.filter(r => 
        !r.reworkDetails?.reworkAttempts || r.reworkDetails.reworkAttempts <= 1
      ).length / totalReports * 100;

      return {
        reworkSuccessRate,
        avgQualityScore,
        firstTimeFixRate,
        qualityDistribution: this.calculateQualityDistribution(qualityScores),
        qualityTrends: this.calculateQualityTrends(reports),
        qualityByCategory: this.groupQualityByCategory(reports),
        qualityBySupervisor: this.groupQualityBySupervisor(reports)
      };
    } catch (error) {
      console.error('❌ Error calculating quality metrics:', error);
      return {};
    }
  }

  /**
   * Helper method to get supervisor reports
   */
  async getSupervisorReports(supervisorId, startDate, endDate) {
    const q = query(
      collection(db, this.damageReportsCollection),
      and(
        where('supervisorId', '==', supervisorId),
        where('reportedAt', '>=', startDate),
        where('reportedAt', '<=', endDate)
      ),
      orderBy('reportedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      reportedAt: doc.data().reportedAt?.toDate?.() || doc.data().reportedAt,
      reworkCompletedAt: doc.data().reworkCompletedAt?.toDate?.() || doc.data().reworkCompletedAt
    }));
  }

  /**
   * Helper method to get operator reports
   */
  async getOperatorReports(operatorId, startDate, endDate) {
    const q = query(
      collection(db, this.damageReportsCollection),
      and(
        where('operatorId', '==', operatorId),
        where('reportedAt', '>=', startDate),
        where('reportedAt', '<=', endDate)
      ),
      orderBy('reportedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      reportedAt: doc.data().reportedAt?.toDate?.() || doc.data().reportedAt
    }));
  }

  /**
   * Get all reports in date range
   */
  async getReportsInDateRange(startDate, endDate) {
    const q = query(
      collection(db, this.damageReportsCollection),
      and(
        where('reportedAt', '>=', startDate),
        where('reportedAt', '<=', endDate)
      ),
      orderBy('reportedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      reportedAt: doc.data().reportedAt?.toDate?.() || doc.data().reportedAt,
      reworkCompletedAt: doc.data().reworkCompletedAt?.toDate?.() || doc.data().reworkCompletedAt
    }));
  }

  /**
   * Helper methods for calculations
   */
  identifySpecializations(reports) {
    const damageTypeCounts = {};
    reports.forEach(report => {
      damageTypeCounts[report.damageType] = (damageTypeCounts[report.damageType] || 0) + 1;
    });
    
    return Object.entries(damageTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  getMostCommonDamageTypes(reports) {
    const damageTypeCounts = {};
    reports.forEach(report => {
      damageTypeCounts[report.damageType] = (damageTypeCounts[report.damageType] || 0) + 1;
    });
    
    return Object.entries(damageTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));
  }

  groupReportsByWeek(reports, startDate, endDate) {
    const weeks = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekReports = reports.filter(r => 
        r.reportedAt >= current && r.reportedAt <= weekEnd
      );
      
      weeks.push({
        weekStart: new Date(current),
        weekEnd: new Date(weekEnd),
        reportCount: weekReports.length,
        resolvedCount: weekReports.filter(r => r.status === 'final_completion').length,
        avgResolutionTime: this.calculateAvgResolutionTime(weekReports)
      });
      
      current.setDate(current.getDate() + 7);
    }
    
    return weeks;
  }

  calculateAvgResolutionTime(reports) {
    const completedReports = reports.filter(r => r.reworkCompletedAt && r.reportedAt);
    if (completedReports.length === 0) return 0;
    
    const totalTime = completedReports.reduce((sum, r) => 
      sum + (r.reworkCompletedAt - r.reportedAt), 0
    );
    
    return totalTime / completedReports.length / (1000 * 60 * 60); // hours
  }

  calculateKPIs(baseData, supervisorData, operatorData) {
    return {
      operationalEfficiency: {
        avgResolutionTime: baseData.averageResolutionTime,
        completionRate: supervisorData.overall?.avgCompletionRate || 0,
        reworkSuccessRate: (baseData.totalReports - (baseData.reportsBySeverity?.failed || 0)) / baseData.totalReports * 100
      },
      qualityMetrics: {
        operatorFaultRate: baseData.operatorFaultRate,
        reportingAccuracy: operatorData.overall?.avgReportingAccuracy || 0,
        supervisorQualityScore: supervisorData.overall?.avgQualityScore || 0
      },
      costMetrics: {
        costPerReport: baseData.totalCost / (baseData.totalReports || 1),
        costEfficiency: supervisorData.overall?.avgCostEfficiency || 0
      }
    };
  }

  generateInsights(baseData, supervisorData, operatorData) {
    const insights = [];
    
    // Resolution time insights
    if (baseData.averageResolutionTime > 4) {
      insights.push({
        type: 'warning',
        category: 'resolution_time',
        message: 'Average resolution time is above 4 hours. Consider additional supervisor training or resource allocation.',
        priority: 'high'
      });
    }
    
    // Operator fault rate insights
    if (baseData.operatorFaultRate > 40) {
      insights.push({
        type: 'alert',
        category: 'training',
        message: 'High operator fault rate detected. Recommend focused training programs.',
        priority: 'high'
      });
    }
    
    // Cost insights
    const costPerReport = baseData.totalCost / (baseData.totalReports || 1);
    if (costPerReport > 100) {
      insights.push({
        type: 'warning',
        category: 'cost',
        message: 'Rework costs are exceeding ₹100 per report. Review process efficiency.',
        priority: 'medium'
      });
    }
    
    return insights;
  }

  generateRecommendations(baseData, supervisorData, operatorData) {
    const recommendations = [];
    
    recommendations.push({
      category: 'process_improvement',
      title: 'Preventive Quality Measures',
      description: 'Implement quality checkpoints before damage occurs',
      impact: 'high',
      effort: 'medium'
    });
    
    recommendations.push({
      category: 'training',
      title: 'Skill Development Programs', 
      description: 'Focus training on most common damage types',
      impact: 'high',
      effort: 'high'
    });
    
    recommendations.push({
      category: 'technology',
      title: 'Predictive Analytics',
      description: 'Use data to predict and prevent damage patterns',
      impact: 'medium',
      effort: 'high'
    });
    
    return recommendations;
  }

  // Additional helper methods would be implemented here...
  groupReportsByMonth(reports, startDate, endDate) { return []; }
  calculateCategoryTrends(reports) { return {}; }
  calculateSeverityTrends(reports) { return {}; }
  calculateResolutionTimeTrends(reports) { return {}; }
  generateTrendPredictions(weeklyTrends, categoryTrends) { return {}; }
  groupCostsByCategory(reports) { return {}; }
  groupCostsBySeverity(reports) { return {}; }
  calculateCostTrends(reports) { return {}; }
  calculatePotentialSavings(reports) { return {}; }
  calculateQualityDistribution(scores) { return {}; }
  calculateQualityTrends(reports) { return {}; }
  groupQualityByCategory(reports) { return {}; }
  groupQualityBySupervisor(reports) { return {}; }
}

// Export singleton instance
export const damageAnalyticsService = new DamageAnalyticsService();
export default damageAnalyticsService;