// src/components/supervisor/WorkflowAnalyticsDashboard.jsx
// Analytics Dashboard for Emergency Insertions and Template Learning

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { WorkflowAnalyticsService } from '../../services/WorkflowAnalyticsService';

const WorkflowAnalyticsDashboard = ({ onClose }) => {
  const { user } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [analytics, setAnalytics] = useState(null);
  const [templateSuggestions, setTemplateSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('last30days');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'suggestions', 'trends'

  useEffect(() => {
    loadAnalytics();
    loadTemplateSuggestions();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await WorkflowAnalyticsService.getInsertionAnalytics(timeRange);
      if (result.success) {
        setAnalytics(result.analytics);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      showNotification(
        isNepali ? 'एनालिटिक्स लोड गर्न समस्या भयो' : 'Failed to load analytics',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateSuggestions = async () => {
    try {
      const result = await WorkflowAnalyticsService.getTemplateSuggestions();
      if (result.success) {
        setTemplateSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error('Failed to load template suggestions:', error);
    }
  };

  const handleApplySuggestion = async (suggestion) => {
    try {
      const result = await WorkflowAnalyticsService.applyTemplateSuggestion(suggestion, user.id);
      if (result.success) {
        showNotification(
          isNepali 
            ? `✅ टेम्प्लेटमा "${suggestion.operationName}" थपियो`
            : `✅ Added "${suggestion.operationName}" to template`,
          'success'
        );
        // Reload suggestions
        loadTemplateSuggestions();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      showNotification(
        isNepali ? 'सुझाव लागू गर्न समस्या भयो' : 'Failed to apply suggestion',
        'error'
      );
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">{isNepali ? 'लोड गर्दै...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              📊 {isNepali ? 'वर्कफ्लो एनालिटिक्स' : 'Workflow Analytics'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center space-x-4 mt-4">
            <label className="text-blue-100">
              {isNepali ? 'समय अवधि:' : 'Time Range:'}
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-blue-500 text-white border border-blue-400 rounded px-3 py-1"
            >
              <option value="last7days">{isNepali ? 'पछिल्लो ७ दिन' : 'Last 7 Days'}</option>
              <option value="last30days">{isNepali ? 'पछिल्लो ३० दिन' : 'Last 30 Days'}</option>
              <option value="last3months">{isNepali ? 'पछिल्लो ३ महिना' : 'Last 3 Months'}</option>
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mt-4">
            {['overview', 'suggestions', 'trends'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded ${
                  activeTab === tab 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-500 text-blue-100 hover:bg-blue-400'
                }`}
              >
                {tab === 'overview' && (isNepali ? '🏠 सारांश' : '🏠 Overview')}
                {tab === 'suggestions' && (isNepali ? '💡 सुझावहरू' : '💡 Suggestions')}
                {tab === 'trends' && (isNepali ? '📈 ट्रेन्डहरू' : '📈 Trends')}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'overview' && analytics && (
            <>
              {/* Key Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-red-600 text-sm font-medium">
                    {isNepali ? 'कुल आपातकालीन काम' : 'Total Emergency Insertions'}
                  </div>
                  <div className="text-red-800 text-2xl font-bold">
                    {analytics.totalInsertions}
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-orange-600 text-sm font-medium">
                    {isNepali ? 'औसत देरी समय' : 'Average Delay Time'}
                  </div>
                  <div className="text-orange-800 text-2xl font-bold">
                    {analytics.costImpact.averageDelayMinutes}m
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-green-600 text-sm font-medium">
                    {isNepali ? 'टेम्प्लेट सुझावहरू' : 'Template Suggestions'}
                  </div>
                  <div className="text-green-800 text-2xl font-bold">
                    {templateSuggestions.length}
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-purple-600 text-sm font-medium">
                    {isNepali ? 'कुल लागत प्रभाव' : 'Total Cost Impact'}
                  </div>
                  <div className="text-purple-800 text-2xl font-bold">
                    Rs. {analytics.costImpact.totalCost.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Most Frequent Operations */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">
                  🔥 {isNepali ? 'सबैभन्दा बढी थपिने कामहरू' : 'Most Frequent Emergency Operations'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.mostFrequentOperations.slice(0, 6).map((operation, index) => (
                    <div key={index} className="border border-gray-200 rounded p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {operation.operationName}
                          </div>
                          <div className="text-sm text-gray-600">
                            ⚙️ {operation.machineType} • ⏱️ {operation.averageTime}m
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            {operation.count}x
                          </div>
                          <div className="text-xs text-gray-500">
                            {isNepali ? 'पटक' : 'times'}
                          </div>
                        </div>
                      </div>
                      {operation.reasons.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {isNepali ? 'कारणहरू: ' : 'Reasons: '}
                          {operation.reasons.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Machine Type Distribution */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">
                  ⚙️ {isNepali ? 'मेसिन प्रकार वितरण' : 'Machine Type Distribution'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analytics.machineTypeDistribution.map((machine, index) => (
                    <div key={index} className="text-center p-4 border border-gray-200 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {machine.count}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {machine.machine}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">
                  💡 {isNepali ? 'टेम्प्लेट सुधार सुझावहरू' : 'Template Improvement Suggestions'}
                </h3>
                <div className="text-sm text-gray-600">
                  {templateSuggestions.length} {isNepali ? 'सुझावहरू उपलब्ध' : 'suggestions available'}
                </div>
              </div>

              {templateSuggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">💡</div>
                  <p>{isNepali ? 'कुनै सुझावहरू छैनन्' : 'No suggestions available yet'}</p>
                  <p className="text-sm mt-2">
                    {isNepali ? 'थप डेटा संकलन पछि सुझावहरू देखा पर्नेछ' : 'Suggestions will appear as more data is collected'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {templateSuggestions.map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">
                              {suggestion.operationName}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              suggestion.confidence > 80 
                                ? 'bg-green-100 text-green-800'
                                : suggestion.confidence > 60 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {Math.round(suggestion.confidence)}% {isNepali ? 'विश्वास' : 'confidence'}
                            </span>
                          </div>
                          
                          <div className="mt-2 text-sm text-gray-600">
                            <div>{suggestion.recommendation}</div>
                            <div className="mt-1">
                              ⚙️ {suggestion.machineType} • 
                              ⏱️ {suggestion.averageTime}m • 
                              🔄 {suggestion.frequency} {isNepali ? 'पटक' : 'times'}
                            </div>
                            {suggestion.garmentType && (
                              <div className="mt-1">
                                👕 {suggestion.garmentType} specific
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                        >
                          {isNepali ? '✅ लागू गर्नुहोस्' : '✅ Apply'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && analytics && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">
                📈 {isNepali ? 'ट्रेन्ड विश्लेषण' : 'Trend Analysis'}
              </h3>

              {/* Cost Impact Details */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium mb-4">💰 {isNepali ? 'लागत प्रभाव विश्लेषण' : 'Cost Impact Analysis'}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-red-600 text-lg font-bold">
                      Rs. {analytics.costImpact.directCost.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-700">
                      {isNepali ? 'प्रत्यक्ष लागत' : 'Direct Cost'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-orange-600 text-lg font-bold">
                      Rs. {analytics.costImpact.indirectCost.toLocaleString()}
                    </div>
                    <div className="text-sm text-orange-700">
                      {isNepali ? 'अप्रत्यक्ष लागत' : 'Indirect Cost'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-blue-600 text-lg font-bold">
                      {analytics.costImpact.totalDelayHours}h
                    </div>
                    <div className="text-sm text-blue-700">
                      {isNepali ? 'कुल देरी समय' : 'Total Delay'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-purple-600 text-lg font-bold">
                      Rs. {analytics.costImpact.costPerInsertion.toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-700">
                      {isNepali ? 'प्रति इन्सर्सन लागत' : 'Cost Per Insertion'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Patterns */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium mb-4">⏰ {isNepali ? 'समय पेटर्न' : 'Time Patterns'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {isNepali ? 'पीक इन्सर्सन घण्टा' : 'Peak Insertion Hour'}
                    </h5>
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.timeDistribution.peakInsertionHour}:00
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {isNepali ? 'सबैभन्दा बढी आपातकालीन काम थपिने समय' : 'Most emergency work added'}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {isNepali ? 'पीक इन्सर्सन दिन' : 'Peak Insertion Day'}
                    </h5>
                    <div className="text-2xl font-bold text-green-600">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][analytics.timeDistribution.peakInsertionDay]}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {isNepali ? 'सबैभन्दा बढी आपातकालीन काम थपिने दिन' : 'Most emergency work added day'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Reasons */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium mb-4">❓ {isNepali ? 'मुख्य कारणहरू' : 'Common Reasons'}</h4>
                <div className="space-y-3">
                  {analytics.commonReasons.map((reason, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-900">{reason.reason}</span>
                      <span className="font-medium text-gray-700">{reason.count} {isNepali ? 'पटक' : 'times'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowAnalyticsDashboard;