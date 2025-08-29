// File: src/components/admin/CacheMonitor.jsx
// Cache performance monitoring component for admin dashboard

import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, TrendingUp, Clock, Trash2 } from 'lucide-react';
import { cacheService } from '../../services/CacheService';
import { useLanguage } from '../../context/LanguageContext';

const CacheMonitor = () => {
  const { t, currentLanguage } = useLanguage();
  const [cacheStats, setCacheStats] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const loadCacheStats = () => {
    const stats = cacheService.getCacheStats();
    setCacheStats(stats);
    setRefreshCount(prev => prev + 1);
  };

  useEffect(() => {
    loadCacheStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    cacheService.clearAllCache();
    loadCacheStats();
  };

  const handleClearSpecific = (key) => {
    cacheService.clearCache(key);
    loadCacheStats();
  };

  const formatAge = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (!cacheStats) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Loading cache statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            📋 {currentLanguage === 'np' ? 'क्यासे मनिटरिङ्ग' : 'Cache Monitoring'}
          </h2>
          <p className="text-gray-600">
            {currentLanguage === 'np' 
              ? 'फायरस्टोर रिड्स बचाउन क्यास प्रदर्शन ट्र्याक गर्नुहोस्'
              : 'Track cache performance to save Firestore reads'
            }
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadCacheStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {currentLanguage === 'np' ? 'रिफ्रेस' : 'Refresh'}
          </button>
          
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {currentLanguage === 'np' ? 'सफा गर्नुहोस्' : 'Clear All'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                {currentLanguage === 'np' ? 'कुल क्यासे इन्ट्रीज' : 'Total Cache Entries'}
              </h3>
              <div className="text-3xl font-bold text-blue-600">
                {cacheStats.totalEntries}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                {currentLanguage === 'np' ? 'वैध इन्ट्रीज' : 'Valid Entries'}
              </h3>
              <div className="text-3xl font-bold text-green-600">
                {cacheStats.entries.filter(e => e.isValid).length}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">
                {currentLanguage === 'np' ? 'कुल आइटमहरू' : 'Total Items'}
              </h3>
              <div className="text-3xl font-bold text-purple-600">
                {cacheStats.entries.reduce((sum, entry) => sum + entry.size, 0)}
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Cache Savings Estimate */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          💰 {currentLanguage === 'np' ? 'फायरस्टोर सेभिङ्ग्स' : 'Firestore Savings'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(cacheStats.entries.filter(e => e.isValid).length * 1.5)}
            </div>
            <div className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'अनुमानित बचत रिड्स' : 'Estimated Saved Reads'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ~$0.{Math.round(cacheStats.entries.filter(e => e.isValid).length * 0.036)}
            </div>
            <div className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'लागत बचत' : 'Cost Savings'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((cacheStats.entries.filter(e => e.isValid).length / Math.max(cacheStats.totalEntries, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'हिट रेट' : 'Hit Rate'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {refreshCount}
            </div>
            <div className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'मनिटर रिफ्रेसहरू' : 'Monitor Refreshes'}
            </div>
          </div>
        </div>
      </div>

      {/* Cache Entries Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            📊 {currentLanguage === 'np' ? 'क्यास विवरणहरू' : 'Cache Details'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'np' ? 'क्यास की' : 'Cache Key'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'np' ? 'साइज' : 'Size'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'np' ? 'उमेर' : 'Age'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'np' ? 'स्थिति' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {currentLanguage === 'np' ? 'कार्यहरू' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cacheStats.entries.map((entry, index) => (
                <tr key={index} className={entry.isValid ? '' : 'bg-red-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.size} {currentLanguage === 'np' ? 'आइटमहरू' : 'items'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatAge(entry.ageSeconds)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.isValid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.isValid 
                        ? (currentLanguage === 'np' ? 'वैध' : 'Valid')
                        : (currentLanguage === 'np' ? 'पुरानो' : 'Expired')
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleClearSpecific(entry.key)}
                      className="text-red-600 hover:text-red-900 text-xs"
                    >
                      {currentLanguage === 'np' ? 'सफा गर्नुहोस्' : 'Clear'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          💡 {currentLanguage === 'np' ? 'प्रदर्शन सुझावहरू' : 'Performance Tips'}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• {currentLanguage === 'np' 
            ? 'हाई हिट रेट (८०%+) राम्रो क्यास प्रदर्शन देखाउँछ'
            : 'High hit rate (80%+) indicates good cache performance'
          }</li>
          <li>• {currentLanguage === 'np'
            ? 'पुराना इन्ट्रीहरू स्वचालित रूपमा ५ मिनेट पछि हटाइन्छ'
            : 'Expired entries are automatically cleared after 5 minutes'
          }</li>
          <li>• {currentLanguage === 'np'
            ? 'धेरै क्यास मिसहरूले डेटा पुनः लोड गरिरहेको सङ्केत गर्छ'
            : 'High cache misses may indicate data is being reloaded frequently'
          }</li>
        </ul>
      </div>
    </div>
  );
};

export default CacheMonitor;