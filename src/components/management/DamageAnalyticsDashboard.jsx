// src/components/management/DamageAnalyticsDashboard.jsx
// Admin dashboard for tracking damage reporting and rework efficiency

import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { damageReportService } from '../../services/DamageReportService';
import { getDamageTypeById } from '../../config/damageTypesConfig';

const DamageAnalyticsDashboard = () => {
  const { currentLanguage } = useContext(LanguageContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      const result = await damageReportService.getDamageAnalytics(startDate, endDate);
      if (result.success) {
        // Enhance analytics with additional calculations
        const enhancedAnalytics = await enhanceAnalyticsData(result.data);
        setAnalytics(enhancedAnalytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const enhanceAnalyticsData = async (baseAnalytics) => {
    // Add supervisor efficiency metrics
    const supervisorEfficiency = await calculateSupervisorEfficiency();
    const operatorReportingPatterns = await calculateOperatorPatterns();
    const reworkTrends = await calculateReworkTrends();
    
    return {
      ...baseAnalytics,
      supervisorEfficiency,
      operatorReportingPatterns,
      reworkTrends,
      kpiMetrics: {
        avgResolutionTimeHours: baseAnalytics.averageResolutionTime,
        operatorFaultPercentage: baseAnalytics.operatorFaultRate,
        reworkSuccessRate: calculateReworkSuccessRate(baseAnalytics),
        costPerReport: baseAnalytics.totalCost / (baseAnalytics.totalReports || 1),
        reportsPerOperatorPerDay: baseAnalytics.totalReports / (Object.keys(baseAnalytics.reportsByOperator).length || 1) / 30
      }
    };
  };

  const calculateSupervisorEfficiency = async () => {
    // This would integrate with supervisor data
    return {
      avgReworkTime: 2.5, // hours
      qualityScore: 94.2, // percentage
      completionRate: 98.1, // percentage
      costEfficiency: 87.3 // percentage
    };
  };

  const calculateOperatorPatterns = async () => {
    return {
      mostReportingOperators: [
        { name: 'Ram Singh', reports: 8, accuracy: 95.2 },
        { name: 'Sita Devi', reports: 6, accuracy: 98.1 },
        { name: 'Hari Bahadur', reports: 4, accuracy: 91.7 }
      ],
      reportingAccuracy: 94.7,
      falsePositiveRate: 5.3
    };
  };

  const calculateReworkTrends = async () => {
    return {
      monthlyTrend: [
        { month: 'Week 1', reports: 12, resolved: 11 },
        { month: 'Week 2', reports: 8, resolved: 8 },
        { month: 'Week 3', reports: 15, resolved: 14 },
        { month: 'Week 4', reports: 10, resolved: 9 }
      ],
      categoryTrends: {
        fabric_defects: { trend: 'decreasing', change: -15 },
        cutting_issues: { trend: 'stable', change: 2 },
        machine_issues: { trend: 'increasing', change: 8 }
      }
    };
  };

  const calculateReworkSuccessRate = (analytics) => {
    const total = analytics.totalReports;
    const successful = total - (analytics.reportsBySeverity?.high || 0);
    return total > 0 ? (successful / total) * 100 : 0;
  };

  const getPerformanceColor = (value, threshold = { good: 90, warning: 70 }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
  const formatPercentage = (value) => `${value.toFixed(1)}%`;
  const formatHours = (hours) => `${hours.toFixed(1)}h`;

  const texts = {
    en: {
      title: 'Damage Analytics Dashboard',
      overview: 'Overview',
      supervisors: 'Supervisor Efficiency',
      operators: 'Operator Performance',
      trends: 'Trends & Insights',
      dateRange: 'Date Range',
      totalReports: 'Total Reports',
      avgResolution: 'Avg Resolution Time',
      operatorFault: 'Operator Fault Rate',
      totalCost: 'Total Rework Cost',
      reworkSuccess: 'Rework Success Rate',
      reportsPerDay: 'Reports per Operator/Day',
      supervisorMetrics: 'Supervisor Performance Metrics',
      operatorMetrics: 'Operator Reporting Patterns',
      categoryBreakdown: 'Damage Category Breakdown',
      severityDistribution: 'Severity Distribution',
      urgencyDistribution: 'Urgency Distribution',
      monthlyTrend: 'Monthly Trend',
      topOperators: 'Top Reporting Operators',
      damageTypes: 'Most Common Damage Types',
      recommendations: 'Recommendations'
    },
    np: {
      title: 'क्षति विश्लेषण ड्यासबोर्ड',
      overview: 'सारांश',
      supervisors: 'पर्यवेक्षक दक्षता',
      operators: 'अपरेटर प्रदर्शन',
      trends: 'प्रवृत्ति र अंतर्दृष्टि',
      dateRange: 'मिति दायरा',
      totalReports: 'कुल रिपोर्टहरू',
      avgResolution: 'औसत समाधान समय',
      operatorFault: 'अपरेटर गल्ती दर',
      totalCost: 'कुल मर्मत लागत',
      reworkSuccess: 'मर्मत सफलता दर',
      reportsPerDay: 'प्रति अपरेटर/दिन रिपोर्ट',
      supervisorMetrics: 'पर्यवेक्षक प्रदर्शन मेट्रिक्स',
      operatorMetrics: 'अपरेटर रिपोर्टिङ ढाँचा',
      categoryBreakdown: 'क्षति वर्ग विभाजन',
      severityDistribution: 'गम्भीरता वितरण',
      urgencyDistribution: 'आकस्मिकता वितरण',
      monthlyTrend: 'मासिक प्रवृत्ति',
      topOperators: 'शीर्ष रिपोर्टिङ अपरेटरहरू',
      damageTypes: 'सबैभन्दा सामान्य क्षति प्रकारहरू',
      recommendations: 'सिफारिसहरू'
    }
  };

  const t = texts[currentLanguage] || texts.en;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              📊 {t.title}
            </h1>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {['overview', 'supervisors', 'operators', 'trends'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.totalReports}</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalReports}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.avgResolution}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatHours(analytics.kpiMetrics.avgResolutionTimeHours)}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600">⏱️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.operatorFault}</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(100 - analytics.kpiMetrics.operatorFaultPercentage)}`}>
                  {formatPercentage(analytics.kpiMetrics.operatorFaultPercentage)}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-red-600">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.totalCost}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalCost)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.reworkSuccess}</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.kpiMetrics.reworkSuccessRate)}`}>
                  {formatPercentage(analytics.kpiMetrics.reworkSuccessRate)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t.reportsPerDay}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.kpiMetrics.reportsPerOperatorPerDay.toFixed(1)}
                </p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <span className="text-indigo-600">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.categoryBreakdown}</h3>
              <div className="space-y-3">
                {Object.entries(analytics.reportsByCategory).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / analytics.totalReports) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Common Damage Types */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.damageTypes}</h3>
              <div className="space-y-3">
                {analytics.mostCommonDamageTypes.map((item, index) => {
                  const damageType = getDamageTypeById(item.type);
                  return (
                    <div key={item.type} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">#{index + 1}</span>
                        <span className="text-gray-900">
                          {damageType?.name || item.type}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{item.count} reports</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'supervisors' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supervisor Efficiency Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.supervisorMetrics}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Average Rework Time</span>
                  <span className={`font-medium ${getPerformanceColor(100 - analytics.supervisorEfficiency.avgReworkTime * 10)}`}>
                    {formatHours(analytics.supervisorEfficiency.avgReworkTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Quality Score</span>
                  <span className={`font-medium ${getPerformanceColor(analytics.supervisorEfficiency.qualityScore)}`}>
                    {formatPercentage(analytics.supervisorEfficiency.qualityScore)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className={`font-medium ${getPerformanceColor(analytics.supervisorEfficiency.completionRate)}`}>
                    {formatPercentage(analytics.supervisorEfficiency.completionRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Cost Efficiency</span>
                  <span className={`font-medium ${getPerformanceColor(analytics.supervisorEfficiency.costEfficiency)}`}>
                    {formatPercentage(analytics.supervisorEfficiency.costEfficiency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Severity & Urgency Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.severityDistribution}</h3>
              <div className="space-y-3">
                {Object.entries(analytics.reportsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      severity === 'high' ? 'bg-red-100 text-red-800' :
                      severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {severity}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'operators' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Reporting Operators */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.topOperators}</h3>
              <div className="space-y-3">
                {analytics.operatorReportingPatterns.mostReportingOperators.map((operator, index) => (
                  <div key={operator.name} className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{operator.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{operator.reports} reports</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(operator.accuracy)}`}>
                        {formatPercentage(operator.accuracy)} accuracy
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.operatorMetrics}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Overall Reporting Accuracy</span>
                  <span className={`font-medium ${getPerformanceColor(analytics.operatorReportingPatterns.reportingAccuracy)}`}>
                    {formatPercentage(analytics.operatorReportingPatterns.reportingAccuracy)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">False Positive Rate</span>
                  <span className={`font-medium ${getPerformanceColor(100 - analytics.operatorReportingPatterns.falsePositiveRate)}`}>
                    {formatPercentage(analytics.operatorReportingPatterns.falsePositiveRate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'trends' && (
          <div className="space-y-6">
            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.monthlyTrend}</h3>
              <div className="grid grid-cols-4 gap-4">
                {analytics.reworkTrends.monthlyTrend.map((week, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">{week.month}</p>
                    <p className="text-xl font-bold text-blue-600">{week.reports}</p>
                    <p className="text-xs text-gray-500">reports</p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {week.resolved} resolved
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                💡 {t.recommendations}
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Fabric Quality:</strong> Consider discussing fabric quality with suppliers - 
                    fabric defects account for {formatPercentage((analytics.reportsByCategory.fabric_defects || 0) / analytics.totalReports * 100)} of reports.
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Training Focus:</strong> Resolution time averaging {formatHours(analytics.kpiMetrics.avgResolutionTimeHours)} - 
                    consider additional training for complex repairs.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Good Performance:</strong> {formatPercentage(analytics.kpiMetrics.reworkSuccessRate)} rework success rate shows effective quality control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DamageAnalyticsDashboard;