import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WIPErrorConsole = ({ 
  isVisible, 
  onClose, 
  errors = [], 
  warnings = [],
  debugInfo = {},
  onDownloadLogs,
  onRetry,
  onIgnoreWarnings,
  sourceData = null
}) => {
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('errors'); // 'errors', 'warnings', 'data', 'debug'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showStackTrace, setShowStackTrace] = useState(false);
  const consoleRef = useRef(null);

  const filteredErrors = errors.filter(error => 
    error.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.field?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWarnings = warnings.filter(warning => 
    warning.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warning.field?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const downloadDebugReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        hasSourceData: !!sourceData
      },
      errors: errors,
      warnings: warnings,
      debugInfo: debugInfo,
      sourceData: sourceData ? {
        type: sourceData.type,
        size: sourceData.size || 'unknown',
        preview: sourceData.preview || 'not available'
      } : null,
      userAgent: navigator.userAgent
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wip-debug-report-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getErrorSeverity = (error) => {
    if (error.severity) return error.severity;
    
    // Auto-detect severity based on error type
    if (error.code?.includes('FATAL') || error.message?.includes('Fatal')) return 'fatal';
    if (error.code?.includes('PARSE') || error.message?.includes('parse')) return 'high';
    if (error.code?.includes('VALIDATION')) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'fatal': return 'text-red-800 bg-red-100 border-red-300';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderErrorItem = (error, index) => {
    const itemId = `error-${index}`;
    const isExpanded = expandedItems.has(itemId);
    const severity = getErrorSeverity(error);

    return (
      <div key={index} className={`border rounded-lg mb-3 ${getSeverityColor(severity)}`}>
        <div 
          className="p-4 cursor-pointer hover:bg-opacity-75"
          onClick={() => toggleExpanded(itemId)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">
                  {severity === 'fatal' ? '🔴' : 
                   severity === 'high' ? '🔺' : 
                   severity === 'medium' ? '🟡' : '🟠'}
                </span>
                <span className="font-medium">{error.message || 'Unknown error'}</span>
                <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                  {severity.toUpperCase()}
                </span>
              </div>
              
              <div className="text-sm opacity-75 space-x-4">
                {error.field && <span>📍 Field: {error.field}</span>}
                {error.line && <span>📄 Line: {error.line}</span>}
                {error.column && <span>📍 Column: {error.column}</span>}
                {error.code && <span>🔍 Code: {error.code}</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(JSON.stringify(error, null, 2));
                }}
                className="p-1 hover:bg-white hover:bg-opacity-50 rounded text-xs"
                title={currentLanguage === 'np' ? 'प्रतिलिपि गर्नुहोस्' : 'Copy'}
              >
                📋
              </button>
              
              <span className="text-lg">
                {isExpanded ? '🔽' : '▶️'}
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-current border-opacity-20">
            <div className="mt-3 space-y-3">
              {error.description && (
                <div>
                  <div className="font-medium text-sm mb-1">
                    {currentLanguage === 'np' ? 'विवरण:' : 'Description:'}
                  </div>
                  <div className="text-sm bg-white bg-opacity-30 p-2 rounded">
                    {error.description}
                  </div>
                </div>
              )}

              {error.suggestion && (
                <div>
                  <div className="font-medium text-sm mb-1">
                    {currentLanguage === 'np' ? 'सुझाव:' : 'Suggestion:'}
                  </div>
                  <div className="text-sm bg-white bg-opacity-30 p-2 rounded">
                    {error.suggestion}
                  </div>
                </div>
              )}

              {error.context && (
                <div>
                  <div className="font-medium text-sm mb-1">
                    {currentLanguage === 'np' ? 'सन्दर्भ:' : 'Context:'}
                  </div>
                  <div className="text-sm bg-white bg-opacity-30 p-2 rounded font-mono">
                    <pre>{JSON.stringify(error.context, null, 2)}</pre>
                  </div>
                </div>
              )}

              {showStackTrace && error.stack && (
                <div>
                  <div className="font-medium text-sm mb-1">
                    {currentLanguage === 'np' ? 'स्ट्याक ट्रेस:' : 'Stack Trace:'}
                  </div>
                  <div className="text-xs bg-black bg-opacity-20 p-2 rounded font-mono overflow-x-auto">
                    <pre>{error.stack}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWarningItem = (warning, index) => {
    const itemId = `warning-${index}`;
    const isExpanded = expandedItems.has(itemId);

    return (
      <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg mb-3">
        <div 
          className="p-4 cursor-pointer hover:bg-yellow-100"
          onClick={() => toggleExpanded(itemId)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">⚠️</span>
                <span className="font-medium text-yellow-800">{warning.message}</span>
              </div>
              
              <div className="text-sm text-yellow-700 space-x-4">
                {warning.field && <span>📍 Field: {warning.field}</span>}
                {warning.value && <span>💾 Value: {warning.value}</span>}
                {warning.line && <span>📄 Line: {warning.line}</span>}
              </div>
            </div>
            
            <span className="text-lg text-yellow-600">
              {isExpanded ? '🔽' : '▶️'}
            </span>
          </div>
        </div>

        {isExpanded && warning.details && (
          <div className="px-4 pb-4 border-t border-yellow-200">
            <div className="mt-3 text-sm text-yellow-700 bg-white bg-opacity-50 p-2 rounded">
              {warning.details}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDataPreview = () => {
    if (!sourceData) {
      return (
        <div className="text-center py-8 text-gray-500">
          {currentLanguage === 'np' ? 'कुनै स्रोत डेटा उपलब्ध छैन' : 'No source data available'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">
            {currentLanguage === 'np' ? 'डेटा जानकारी' : 'Data Information'}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">{currentLanguage === 'np' ? 'प्रकार:' : 'Type:'}</span>
              <span className="ml-2 font-medium">{sourceData.type || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-600">{currentLanguage === 'np' ? 'आकार:' : 'Size:'}</span>
              <span className="ml-2 font-medium">{sourceData.size || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-600">{currentLanguage === 'np' ? 'पङक्तिहरू:' : 'Rows:'}</span>
              <span className="ml-2 font-medium">{sourceData.rows || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-gray-600">{currentLanguage === 'np' ? 'स्तम्भहरू:' : 'Columns:'}</span>
              <span className="ml-2 font-medium">{sourceData.columns || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {sourceData.preview && (
          <div>
            <h3 className="font-medium text-gray-800 mb-2">
              {currentLanguage === 'np' ? 'डेटा पूर्वावलोकन' : 'Data Preview'}
            </h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{JSON.stringify(sourceData.preview, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDebugInfo = () => {
    if (!debugInfo || Object.keys(debugInfo).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {currentLanguage === 'np' ? 'कुनै डिबग जानकारी उपलब्ध छैन' : 'No debug information available'}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(debugInfo).map(([key, value]) => (
          <div key={key} className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono overflow-x-auto">
              <pre>{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</pre>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🐛</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentLanguage === 'np' ? 'WIP आयात त्रुटि कन्सोल' : 'WIP Import Error Console'}
              </h2>
              <p className="text-sm text-gray-600">
                {errors.length} {currentLanguage === 'np' ? 'त्रुटिहरू' : 'errors'}, {' '}
                {warnings.length} {currentLanguage === 'np' ? 'चेतावनीहरू' : 'warnings'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadDebugReport}
              className="px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
            >
              📥 {currentLanguage === 'np' ? 'रिपोर्ट डाउनलोड' : 'Download Report'}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search and Options */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder={currentLanguage === 'np' ? 'त्रुटिहरू खोज्नुहोस्...' : 'Search errors...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showStackTrace}
                  onChange={(e) => setShowStackTrace(e.target.checked)}
                  className="mr-2"
                />
                {currentLanguage === 'np' ? 'स्ट्याक ट्रेस देखाउनुहोस्' : 'Show stack traces'}
              </label>
            </div>
            
            <div className="text-sm text-gray-600">
              {searchTerm && (
                <span>
                  {filteredErrors.length + filteredWarnings.length} {' '}
                  {currentLanguage === 'np' ? 'परिणामहरू' : 'results'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'errors', label: currentLanguage === 'np' ? 'त्रुटिहरू' : 'Errors', count: errors.length, color: 'red' },
            { id: 'warnings', label: currentLanguage === 'np' ? 'चेतावनीहरू' : 'Warnings', count: warnings.length, color: 'yellow' },
            { id: 'data', label: currentLanguage === 'np' ? 'डेटा' : 'Data', count: null, color: 'blue' },
            { id: 'debug', label: currentLanguage === 'np' ? 'डिबग' : 'Debug', count: null, color: 'gray' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? `border-${tab.color}-500 text-${tab.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  tab.color === 'red' ? 'bg-red-100 text-red-600' :
                  tab.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" ref={consoleRef}>
          {activeTab === 'errors' && (
            <div>
              {filteredErrors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 
                    (currentLanguage === 'np' ? 'कुनै मिल्दो त्रुटिहरू फेला परेनन्' : 'No matching errors found') :
                    (currentLanguage === 'np' ? 'कुनै त्रुटिहरू छैनन्! 🎉' : 'No errors! 🎉')
                  }
                </div>
              ) : (
                <div>
                  {filteredErrors.map((error, index) => renderErrorItem(error, index))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'warnings' && (
            <div>
              {filteredWarnings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 
                    (currentLanguage === 'np' ? 'कुनै मिल्दो चेतावनीहरू फेला परेनन्' : 'No matching warnings found') :
                    (currentLanguage === 'np' ? 'कुनै चेतावनीहरू छैनन्! 👍' : 'No warnings! 👍')
                  }
                </div>
              ) : (
                <div>
                  {filteredWarnings.map((warning, index) => renderWarningItem(warning, index))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && renderDataPreview()}
          {activeTab === 'debug' && renderDebugInfo()}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'कुल समस्याहरू:' : 'Total issues:'} {errors.length + warnings.length}
            </div>
            
            <div className="flex items-center space-x-3">
              {warnings.length > 0 && onIgnoreWarnings && (
                <button
                  onClick={onIgnoreWarnings}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  {currentLanguage === 'np' ? 'चेतावनीहरू बेवास्ता गर्नुहोस्' : 'Ignore Warnings'}
                </button>
              )}
              
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentLanguage === 'np' ? 'पुनः प्रयास गर्नुहोस्' : 'Retry Import'}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
              >
                {currentLanguage === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WIPErrorConsole;