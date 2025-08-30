// src/components/management/DamageSystemReport.jsx
// Comprehensive damage system performance report for management

import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { damageAnalyticsService } from '../../services/DamageAnalyticsService';
import { damageReportService } from '../../services/DamageReportService';

const DamageSystemReport = () => {
  const { currentLanguage } = useContext(LanguageContext);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    generateReport();
  }, [dateRange]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      const analyticsResult = await damageAnalyticsService.getComprehensiveDamageAnalytics(
        startDate, 
        endDate
      );

      if (analyticsResult.success) {
        const enhancedReport = {
          ...analyticsResult.data,
          reportGenerated: new Date(),
          periodDays: Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)),
          executiveSummary: generateExecutiveSummary(analyticsResult.data)
        };
        setReportData(enhancedReport);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
    setLoading(false);
  };

  const generateExecutiveSummary = (data) => {
    const totalReports = data.totalReports || 0;
    const avgResolution = data.averageResolutionTime || 0;
    const operatorFaultRate = data.operatorFaultRate || 0;
    const totalCost = data.totalCost || 0;

    let systemHealth = 'excellent';
    let priority = 'low';
    let keyActions = [];

    // Determine system health
    if (operatorFaultRate > 40 || avgResolution > 6 || totalCost > 5000) {
      systemHealth = 'needs_attention';
      priority = 'high';
    } else if (operatorFaultRate > 25 || avgResolution > 4 || totalCost > 3000) {
      systemHealth = 'good';
      priority = 'medium';
    }

    // Generate key actions
    if (avgResolution > 4) {
      keyActions.push({
        action: 'Supervisor Training',
        reason: `Average resolution time is ${avgResolution.toFixed(1)} hours`,
        impact: 'high',
        urgency: 'medium'
      });
    }

    if (operatorFaultRate > 30) {
      keyActions.push({
        action: 'Operator Skill Development',
        reason: `${operatorFaultRate.toFixed(1)}% of damages are operator fault`,
        impact: 'high',
        urgency: 'high'
      });
    }

    if (totalCost > 3000) {
      keyActions.push({
        action: 'Cost Optimization Review',
        reason: `Total rework cost is ₹${totalCost.toFixed(2)}`,
        impact: 'medium',
        urgency: 'medium'
      });
    }

    return {
      systemHealth,
      priority,
      keyActions,
      insights: [
        `${totalReports} damage reports processed in the selected period`,
        `Average resolution time: ${avgResolution.toFixed(1)} hours`,
        `Operator fault rate: ${operatorFaultRate.toFixed(1)}%`,
        `Total rework cost: ₹${totalCost.toFixed(2)}`
      ]
    };
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-yellow-600 bg-yellow-100';
      case 'needs_attention': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;
  const formatPercentage = (value) => `${(value || 0).toFixed(1)}%`;
  const formatHours = (hours) => `${(hours || 0).toFixed(1)}h`;

  const texts = {
    en: {
      title: 'Damage System Performance Report',
      executiveSummary: 'Executive Summary',
      systemHealth: 'System Health',
      keyMetrics: 'Key Metrics',
      performanceInsights: 'Performance Insights',
      supervisorAnalysis: 'Supervisor Analysis',
      operatorAnalysis: 'Operator Analysis',
      recommendedActions: 'Recommended Actions',
      costAnalysis: 'Cost Analysis',
      qualityMetrics: 'Quality Metrics',
      trendAnalysis: 'Trend Analysis',
      generateReport: 'Generate Report',
      exportPDF: 'Export PDF',
      dateRange: 'Date Range',
      excellent: 'Excellent',
      good: 'Good',
      needs_attention: 'Needs Attention',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      totalReports: 'Total Reports',
      avgResolutionTime: 'Avg Resolution Time',
      operatorFaultRate: 'Operator Fault Rate',
      totalCost: 'Total Cost',
      reworkSuccessRate: 'Rework Success Rate',
      topPerformers: 'Top Performers',
      improvementNeeded: 'Improvement Needed',
      costPerReport: 'Cost per Report',
      action: 'Action',
      reason: 'Reason',
      impact: 'Impact',
      urgency: 'Urgency'
    },
    np: {
      title: 'क्षति प्रणाली प्रदर्शन रिपोर्ट',
      executiveSummary: 'कार्यकारी सारांश',
      systemHealth: 'प्रणाली स्वास्थ्य',
      keyMetrics: 'मुख्य मेट्रिक्स',
      performanceInsights: 'प्रदर्शन अंतर्दृष्टि',
      supervisorAnalysis: 'पर्यवेक्षक विश्लेषण',
      operatorAnalysis: 'अपरेटर विश्लेषण',
      recommendedActions: 'सिफारिसित कार्यहरू',
      costAnalysis: 'लागत विश्लेषण',
      qualityMetrics: 'गुणस्तर मेट्रिक्स',
      trendAnalysis: 'प्रवृत्ति विश्लेषण',
      generateReport: 'रिपोर्ट उत्पन्न गर्नुहोस्',
      exportPDF: 'PDF निर्यात गर्नुहोस्',
      dateRange: 'मिति दायरा',
      excellent: 'उत्कृष्ट',
      good: 'राम्रो',
      needs_attention: 'ध्यान चाहिन्छ',
      high: 'उच्च',
      medium: 'मध्यम',
      low: 'कम',
      totalReports: 'कुल रिपोर्टहरू',
      avgResolutionTime: 'औसत समाधान समय',
      operatorFaultRate: 'अपरेटर गल्ती दर',
      totalCost: 'कुल लागत',
      reworkSuccessRate: 'पुन: कार्य सफलता दर',
      topPerformers: 'शीर्ष कार्यकर्ताहरू',
      improvementNeeded: 'सुधार आवश्यक',
      costPerReport: 'प्रति रिपोर्ट लागत',
      action: 'कार्य',
      reason: 'कारण',
      impact: 'प्रभाव',
      urgency: 'आकस्मिकता'
    }
  };

  const t = texts[currentLanguage] || texts.en;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Generating report...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Unable to generate report</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="border-b pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600">
              Period: {dateRange.startDate} to {dateRange.endDate} 
              ({reportData.periodDays} days)
            </p>
            <p className="text-sm text-gray-500">
              Generated on {reportData.reportGenerated.toLocaleString()}
            </p>
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">{t.dateRange}:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1 border rounded-md text-sm"
              />
              <span>-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1 border rounded-md text-sm"
              />
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              📄 {t.exportPDF}
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 {t.executiveSummary}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">{t.systemHealth}</h3>
            <div className={`inline-block px-4 py-2 rounded-full ${getHealthColor(reportData.executiveSummary.systemHealth)}`}>
              <span className="font-medium">
                {t[reportData.executiveSummary.systemHealth]}
              </span>
            </div>
            <p className={`mt-3 text-sm ${getPriorityColor(reportData.executiveSummary.priority)}`}>
              Priority: {t[reportData.executiveSummary.priority]}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">{t.keyMetrics}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t.totalReports}:</span>
                <span className="font-medium">{reportData.totalReports}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t.avgResolutionTime}:</span>
                <span className="font-medium">{formatHours(reportData.averageResolutionTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t.operatorFaultRate}:</span>
                <span className="font-medium">{formatPercentage(reportData.operatorFaultRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t.totalCost}:</span>
                <span className="font-medium">{formatCurrency(reportData.totalCost)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">{t.performanceInsights}</h3>
            <ul className="space-y-2">
              {reportData.executiveSummary.insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      {reportData.executiveSummary.keyActions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 {t.recommendedActions}</h2>
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
            <div className="grid grid-cols-1 gap-4">
              {reportData.executiveSummary.keyActions.map((action, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{action.action}</h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        action.impact === 'high' ? 'bg-red-100 text-red-800' :
                        action.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {t.impact}: {t[action.impact]}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        action.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        action.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {t.urgency}: {t[action.urgency]}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{action.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Performance */}
      {reportData.supervisorEfficiency && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">👨‍💼 {t.supervisorAnalysis}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t.topPerformers}</h3>
              {reportData.supervisorEfficiency.overall?.topPerformers?.map((supervisor, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{supervisor.supervisorName}</p>
                    <p className="text-sm text-gray-600">{supervisor.totalReports} reports</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">
                      {formatPercentage(supervisor.qualityScore)} quality
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatHours(supervisor.avgResolutionTime)} avg time
                    </p>
                  </div>
                </div>
              )) || <p className="text-gray-500">No data available</p>}
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Overall Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Average Resolution Time:</span>
                  <span className="font-medium">
                    {formatHours(reportData.supervisorEfficiency.overall?.avgResolutionTime || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Quality Score:</span>
                  <span className="font-medium">
                    {formatPercentage(reportData.supervisorEfficiency.overall?.avgQualityScore || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate:</span>
                  <span className="font-medium">
                    {formatPercentage(reportData.supervisorEfficiency.overall?.avgCompletionRate || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operator Performance */}
      {reportData.operatorPerformance && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">👷‍♂️ {t.operatorAnalysis}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Reporters</h3>
              {reportData.operatorPerformance.overall?.topReporters?.slice(0, 5).map((operator, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{operator.operatorName}</p>
                    <p className="text-sm text-gray-600">{operator.totalReports} reports</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">
                      {formatPercentage(operator.reportingAccuracy)} accuracy
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatPercentage(operator.atFaultRate)} at fault
                    </p>
                  </div>
                </div>
              )) || <p className="text-gray-500">No data available</p>}
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t.improvementNeeded}</h3>
              {reportData.operatorPerformance.overall?.needsImprovement?.slice(0, 5).map((operator, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-red-600">{operator.operatorName}</p>
                    <p className="text-sm text-gray-600">{operator.totalReports} reports</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600">
                      {formatPercentage(operator.atFaultRate)} at fault
                    </p>
                    <p className="text-xs text-gray-600">Training needed</p>
                  </div>
                </div>
              )) || <p className="text-green-500">All operators performing well</p>}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-6 mt-8">
        <div className="text-center text-gray-500 text-sm">
          <p>This report was automatically generated by the Garment ERP Damage Analytics System</p>
          <p>For questions or support, contact the system administrator</p>
        </div>
      </div>
    </div>
  );
};

export default DamageSystemReport;