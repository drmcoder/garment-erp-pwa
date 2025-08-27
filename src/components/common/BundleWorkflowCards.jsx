import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getMachineTypeIcon, getWorkStatus } from '../../constants';

const BundleWorkflowCards = ({ 
  bundle, 
  workItems = [], 
  onOperationClick, 
  onStatusUpdate,
  showProgress = true,
  compact = false 
}) => {
  const { currentLanguage } = useLanguage();
  const [expandedCard, setExpandedCard] = useState(null);
  
  // Get operations from template or work items
  const operations = workItems.length > 0 
    ? workItems.map(item => ({
        id: item.operationId || item.operation?.id,
        name: currentLanguage === 'np' 
          ? item.operation?.nameNp || item.operationName 
          : item.operation?.nameEn || item.operation?.name || item.operationName,
        icon: item.operation?.icon || item.icon || '🧵',
        status: item.status || 'pending',
        sequence: item.operation?.sequence || item.sequence || 1,
        machineType: item.machineType || item.operation?.machineType,
        estimatedTime: item.estimatedTime || item.operation?.estimatedTimePerPiece * bundle.pieces,
        assignedOperator: item.assignedOperator,
        completedPieces: item.completedPieces || 0,
        totalPieces: item.pieces || bundle.pieces,
        skillLevel: item.operation?.skillLevel || item.skillLevel,
        rate: item.operation?.rate || item.rate,
        dependencies: item.dependencies || []
      }))
    : [];

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'ready': '🟡',
      'in_progress': '🔄',
      'completed': '✅',
      'blocked': '🚫',
      'waiting': '⏸️'
    };
    return icons[status] || '⏳';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 text-gray-700 shadow-gray-200',
      'ready': 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400 text-yellow-800 shadow-yellow-200',
      'in_progress': 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 text-blue-800 shadow-blue-200',
      'completed': 'bg-gradient-to-br from-green-50 to-green-100 border-green-400 text-green-800 shadow-green-200',
      'blocked': 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 text-red-800 shadow-red-200',
      'waiting': 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-400 text-orange-800 shadow-orange-200'
    };
    return colors[status] || 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400 text-gray-700 shadow-gray-200';
  };

  const getMachineTypeColor = (machineType) => {
    const colors = {
      'cutting': 'bg-red-50 text-red-700 border-red-200',
      'overlock': 'bg-blue-50 text-blue-700 border-blue-200',
      'flatlock': 'bg-green-50 text-green-700 border-green-200',
      'single-needle': 'bg-purple-50 text-purple-700 border-purple-200',
      'double-needle': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'kansai': 'bg-teal-50 text-teal-700 border-teal-200',
      'buttonhole': 'bg-orange-50 text-orange-700 border-orange-200',
      'manual': 'bg-gray-50 text-gray-700 border-gray-200',
      'inspection': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'pressing': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    };
    return colors[machineType] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getProgressPercentage = () => {
    if (operations.length === 0) return 0;
    const completed = operations.filter(op => op.status === 'completed').length;
    return Math.round((completed / operations.length) * 100);
  };

  const sortedOperations = operations.sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="space-y-4">
      {/* Compact Bundle Header */}
      {showProgress && (
        <div className="bg-white rounded-lg shadow-sm border p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-gray-800">{bundle.bundleId}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {typeof bundle.articleNumber === 'string' 
                  ? bundle.articleNumber 
                  : bundle.articleNumber?.name || bundle.articleNumber?.en || bundle.articleNumber || 'Unknown'} • {bundle.color} • {bundle.size}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{getProgressPercentage()}%</div>
                <div className="text-xs text-gray-500">
                  {operations.filter(op => op.status === 'completed').length}/{operations.length}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                    <circle
                      cx="16" cy="16" r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-blue-200"
                    />
                    <circle
                      cx="16" cy="16" r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${getProgressPercentage()} 100`}
                      className="text-blue-600"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            {bundle.pieces} {currentLanguage === 'np' ? 'पिस' : 'pieces'} • {operations.length} {currentLanguage === 'np' ? 'चरणहरू' : 'steps'}
          </div>
        </div>
      )}

      {/* Operation Cards - Compact Flash Card Style */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' : 'grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10'}`}>
        {sortedOperations.map((operation, index) => {
          const isExpanded = expandedCard === operation.id;
          const canStart = index === 0 || sortedOperations[index - 1]?.status === 'completed';
          
          return (
            <div
              key={operation.id}
              className={`
                relative bg-white rounded-lg shadow-md border transition-all duration-200 cursor-pointer
                transform hover:scale-110 hover:shadow-lg hover:z-10
                ${getStatusColor(operation.status)}
                ${isExpanded ? 'ring-2 ring-blue-400 scale-110 shadow-xl z-20' : ''}
                ${!canStart && operation.status === 'pending' ? 'opacity-50' : ''}
                h-16 w-16 flex-shrink-0
                before:content-[''] before:absolute before:inset-0 before:rounded-lg 
                before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none
              `}
              onClick={() => {
                setExpandedCard(isExpanded ? null : operation.id);
                if (onOperationClick) onOperationClick(operation);
              }}
            >
              <div className="relative w-full h-full flex flex-col items-center justify-center p-1">
                {/* Compact Card Corner Number */}
                <div className="absolute top-0 left-0 w-4 h-4 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs font-bold">
                  {operation.sequence}
                </div>
                
                {/* Compact Status Icon */}
                <div className="absolute top-0 right-0 text-sm">
                  {getStatusIcon(operation.status)}
                  {operation.status === 'in_progress' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>

                {/* Compact Card Center */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-2xl mb-1">{operation.icon}</div>
                  <div className="text-xs font-medium text-gray-700 leading-tight">
                    {operation.name.length > 8 ? operation.name.substring(0, 6) + '..' : operation.name}
                  </div>
                </div>

                {/* Progress Bar for In-Progress Items - Compact */}
                {operation.status === 'in_progress' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg">
                    <div 
                      className="bg-blue-500 h-1 rounded-b-lg transition-all duration-300"
                      style={{ width: `${(operation.completedPieces / operation.totalPieces) * 100}%` }}
                    />
                  </div>
                )}

                {/* Operator Indicator - Compact */}
                {operation.assignedOperator && (
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-green-500 rounded-full" title={operation.assignedOperator.name || operation.assignedOperator} />
                )}

                {/* Expanded Details - Popup Style for Compact Cards */}
                {isExpanded && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">{operation.icon}</div>
                        <h4 className="font-bold text-xl text-gray-800 mb-2">
                          {operation.name}
                        </h4>
                        <div className="text-sm text-gray-600 mb-4">
                          {operation.totalPieces} pieces • {operation.machineType}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="text-xs text-blue-600 font-medium mb-1">
                              {currentLanguage === 'np' ? 'समय' : 'Time'}
                            </div>
                            <div className="text-lg font-bold text-blue-800">{operation.estimatedTime}min</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="text-xs text-green-600 font-medium mb-1">
                              {currentLanguage === 'np' ? 'दर' : 'Rate'}
                            </div>
                            <div className="text-lg font-bold text-green-800">₹{operation.rate}</div>
                          </div>
                        </div>

                        {operation.assignedOperator && (
                          <div className="bg-gray-50 rounded-lg p-2 mb-4">
                            <div className="text-sm text-gray-700">
                              👤 {operation.assignedOperator.name || operation.assignedOperator}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {operation.status === 'ready' && canStart && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onStatusUpdate) onStatusUpdate(operation.id, 'in_progress');
                              setExpandedCard(null);
                            }}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                          >
                            🚀 {currentLanguage === 'np' ? 'सुरु गर्नुहोस्' : 'START'}
                          </button>
                        )}
                        
                        {operation.status === 'in_progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onStatusUpdate) onStatusUpdate(operation.id, 'completed');
                              setExpandedCard(null);
                            }}
                            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                          >
                            ✅ {currentLanguage === 'np' ? 'समाप्त गर्नुहोस्' : 'COMPLETE'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => setExpandedCard(null)}
                          className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          {currentLanguage === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dependencies Warning - Compact */}
                {!canStart && operation.status === 'pending' && !isExpanded && (
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-orange-500 rounded-full" title={currentLanguage === 'np' ? 'अघिल्लो काम पूरा गर्नुहोस्' : 'Previous required'} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {!compact && operations.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-gray-800">
              {operations.filter(op => op.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'पूरा' : 'Completed'}
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {operations.filter(op => op.status === 'in_progress').length}
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'चालू' : 'Active'}
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {operations.filter(op => op.status === 'ready').length}
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'तयार' : 'Ready'}
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-500">
              {operations.filter(op => op.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'बाँकी' : 'Pending'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleWorkflowCards;