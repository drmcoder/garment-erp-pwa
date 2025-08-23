import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WIPUploadProgress = ({ 
  isVisible, 
  onClose, 
  onRetry,
  stages = [],
  errors = [],
  warnings = [],
  logs = [],
  currentStage = -1,
  progress = 0,
  isComplete = false,
  totalSteps = 0,
  completedSteps = 0
}) => {
  const { currentLanguage } = useLanguage();
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all'); // 'all', 'error', 'warning', 'info'

  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'all') return true;
    return log.level === filterLevel;
  });

  // Auto scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      const logsContainer = document.getElementById('logs-container');
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const getStageIcon = (stage, index) => {
    if (index < currentStage) return '✅';
    if (index === currentStage) return '⏳';
    return '⭕';
  };

  const getStageStatus = (stage, index) => {
    if (index < currentStage) return 'completed';
    if (index === currentStage) return 'in-progress';
    return 'pending';
  };

  // Removed unused function - colors are handled inline in the component

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {isComplete ? (errors.length > 0 ? '⚠️' : '✅') : '⏳'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentLanguage === 'np' ? 'WIP अपलोड प्रगति' : 'WIP Upload Progress'}
              </h2>
              <p className="text-sm text-gray-600">
                {isComplete ? 
                  (errors.length > 0 ? 
                    (currentLanguage === 'np' ? 'त्रुटिहरूसँग सम्पन्न' : 'Completed with errors') :
                    (currentLanguage === 'np' ? 'सफलतापूर्वक सम्पन्न' : 'Successfully completed')
                  ) :
                  (currentLanguage === 'np' ? 'प्रक्रिया भइरहेको छ...' : 'Processing...')
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Progress percentage */}
            <div className="text-sm font-medium text-gray-600">
              {Math.round(progress)}%
            </div>
            
            {isComplete && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              {currentLanguage === 'np' ? 'समग्र प्रगति' : 'Overall Progress'}
            </span>
            <span>
              {completedSteps}/{totalSteps} {currentLanguage === 'np' ? 'चरणहरू' : 'steps'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                errors.length > 0 ? 'bg-red-500' : 
                warnings.length > 0 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Stages */}
          <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">
              {currentLanguage === 'np' ? 'प्रक्रिया चरणहरू' : 'Process Stages'}
            </h3>
            
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const status = getStageStatus(stage, index);
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-lg">
                      {getStageIcon(stage, index)}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        status === 'completed' ? 'text-green-600' :
                        status === 'in-progress' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {stage.name}
                      </div>
                      {stage.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {stage.description}
                        </div>
                      )}
                      {stage.progress !== undefined && status === 'in-progress' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="h-1 rounded-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${stage.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(stage.progress)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Logs and Errors */}
          <div className="flex-1 flex flex-col">
            {/* Summary Stats */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-lg font-semibold ${errors.length > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {errors.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'np' ? 'त्रुटिहरू' : 'Errors'}
                  </div>
                </div>
                <div>
                  <div className={`text-lg font-semibold ${warnings.length > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {warnings.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'np' ? 'चेतावनीहरू' : 'Warnings'}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {logs.filter(log => log.level === 'success' || log.level === 'info').length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentLanguage === 'np' ? 'सूचनाहरू' : 'Info'}
                  </div>
                </div>
              </div>
            </div>

            {/* Log Controls */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600">
                    {currentLanguage === 'np' ? 'फिल्टर:' : 'Filter:'}
                  </label>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">{currentLanguage === 'np' ? 'सबै' : 'All'}</option>
                    <option value="error">{currentLanguage === 'np' ? 'त्रुटिहरू' : 'Errors'}</option>
                    <option value="warning">{currentLanguage === 'np' ? 'चेतावनीहरू' : 'Warnings'}</option>
                    <option value="info">{currentLanguage === 'np' ? 'सूचनाहरू' : 'Info'}</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="flex items-center text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="mr-1"
                    />
                    {currentLanguage === 'np' ? 'स्वचालित स्क्रोल' : 'Auto scroll'}
                  </label>
                  
                  <button
                    onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showDetailedLogs ? 
                      (currentLanguage === 'np' ? 'सरल दृश्य' : 'Simple view') :
                      (currentLanguage === 'np' ? 'विस्तृत दृश्य' : 'Detailed view')
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Logs Display */}
            <div 
              id="logs-container"
              className="flex-1 overflow-y-auto p-4 bg-gray-900 text-gray-100 font-mono text-sm"
            >
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {currentLanguage === 'np' ? 'कुनै लगहरू छैनन्' : 'No logs available'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-gray-500 text-xs flex-shrink-0 w-20">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      
                      <span className="flex-shrink-0">
                        {getLevelIcon(log.level)}
                      </span>
                      
                      <div className="flex-1">
                        <span className={`${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warning' ? 'text-yellow-400' :
                          log.level === 'success' ? 'text-green-400' :
                          'text-blue-400'
                        }`}>
                          {log.message}
                        </span>
                        
                        {showDetailedLogs && log.details && (
                          <div className="text-gray-400 text-xs mt-1 ml-4 border-l border-gray-700 pl-2">
                            {typeof log.details === 'object' ? 
                              JSON.stringify(log.details, null, 2) : 
                              log.details
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {logs.length} {currentLanguage === 'np' ? 'लग प्रविष्टिहरू' : 'log entries'}
              {filteredLogs.length !== logs.length && (
                <span className="ml-1">
                  ({filteredLogs.length} {currentLanguage === 'np' ? 'फिल्टर गरिएको' : 'filtered'})
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {errors.length > 0 && isComplete && onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {currentLanguage === 'np' ? 'पुनः प्रयास गर्नुहोस्' : 'Retry'}
                </button>
              )}
              
              {isComplete && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentLanguage === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WIPUploadProgress;