import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const ProcessFlowChart = ({ 
  wipEntry, 
  onStepClick, 
  onStatusUpdate,
  showDetails = true,
  compact = false 
}) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';
  const [selectedStep, setSelectedStep] = useState(null);

  // Get process steps from work items
  const processSteps = (wipEntry?.workItems || [])
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map(item => ({
      id: item.id || `step-${item.sequence}`,
      sequence: item.sequence || 1,
      name: isNepali ? (item.operationNameNp || item.operationName) : item.operationName,
      icon: item.icon || '🧵',
      status: item.status || 'pending',
      pieces: item.pieces || wipEntry?.totalPieces || 0,
      completedPieces: item.completedPieces || 0,
      estimatedTime: item.estimatedTime || 0,
      actualTime: item.actualTime || 0,
      assignedOperator: item.assignedOperator,
      machineType: item.machineType,
      startTime: item.startTime,
      endTime: item.endTime,
      quality: item.quality || 'good',
      defects: item.defects || 0
    }));

  const getStatusColor = (status) => {
    const colors = {
      'pending': {
        bg: 'bg-gray-100',
        border: 'border-gray-300', 
        text: 'text-gray-700',
        ring: 'ring-gray-200'
      },
      'ready': {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        ring: 'ring-yellow-200'
      },
      'in_progress': {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-800',
        ring: 'ring-blue-200'
      },
      'completed': {
        bg: 'bg-green-50',
        border: 'border-green-300',
        text: 'text-green-800',
        ring: 'ring-green-200'
      },
      'blocked': {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-800',
        ring: 'ring-red-200'
      },
      'on_hold': {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-800',
        ring: 'ring-orange-200'
      }
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'ready': '🟡',
      'in_progress': '🔄',
      'completed': '✅',
      'blocked': '🚫',
      'on_hold': '⏸️'
    };
    return icons[status] || '⏳';
  };

  const getProgressPercentage = (step) => {
    if (step.pieces === 0) return 0;
    return Math.round((step.completedPieces / step.pieces) * 100);
  };

  const getConnectionColor = (fromStatus, toStatus) => {
    if (fromStatus === 'completed') return 'border-green-400';
    if (fromStatus === 'in_progress') return 'border-blue-400';
    return 'border-gray-300';
  };

  const formatTime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      {showDetails && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                🔄 {wipEntry?.lotNumber || 'Lot Process Flow'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {wipEntry?.fabricName || 'Manufacturing Process'} • 
                {wipEntry?.totalPieces || 0} {isNepali ? 'टुक्रा' : 'pieces'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(processSteps.filter(s => s.status === 'completed').length / processSteps.length * 100) || 0}%
              </div>
              <div className="text-sm text-gray-500">
                {isNepali ? 'सम्पूर्ण प्रगति' : 'Complete'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Flow Chart */}
      <div className={`relative ${compact ? 'py-4' : 'py-8'}`}>
        {/* Main Flow Container */}
        <div className="flex items-center justify-between space-x-4 overflow-x-auto min-w-full">
          {processSteps.map((step, index) => {
            const colors = getStatusColor(step.status);
            const isSelected = selectedStep === step.id;
            const progress = getProgressPercentage(step);
            
            return (
              <React.Fragment key={step.id}>
                {/* Process Step Node */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Step Circle */}
                  <div
                    className={`
                      relative w-${compact ? '20' : '24'} h-${compact ? '20' : '24'} rounded-full 
                      border-4 ${colors.border} ${colors.bg} 
                      flex items-center justify-center cursor-pointer
                      transition-all duration-300 hover:scale-110 hover:shadow-lg
                      ${isSelected ? `ring-4 ${colors.ring} scale-110` : ''}
                      ${step.status === 'in_progress' ? 'animate-pulse' : ''}
                    `}
                    onClick={() => {
                      setSelectedStep(isSelected ? null : step.id);
                      if (onStepClick) onStepClick(step);
                    }}
                  >
                    {/* Step Number */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-700 text-white text-xs font-bold flex items-center justify-center">
                      {step.sequence}
                    </div>
                    
                    {/* Status Icon */}
                    <div className="absolute -top-1 -right-1 text-lg">
                      {getStatusIcon(step.status)}
                    </div>

                    {/* Main Icon */}
                    <div className="text-3xl">{step.icon}</div>

                    {/* Progress Ring for In-Progress */}
                    {step.status === 'in_progress' && (
                      <div className="absolute inset-0 rounded-full">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50" cy="50" r="45"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="50" cy="50" r="45"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={`${progress * 2.827} 282.7`}
                            className="text-blue-500"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Step Details */}
                  <div className={`mt-3 text-center max-w-${compact ? '24' : '32'}`}>
                    <div className={`font-medium ${colors.text} text-sm ${compact ? 'truncate' : ''}`}>
                      {step.name}
                    </div>
                    {!compact && (
                      <>
                        <div className="text-xs text-gray-500 mt-1">
                          {step.pieces} {isNepali ? 'टुक्रा' : 'pieces'}
                        </div>
                        {step.status === 'in_progress' && (
                          <div className="text-xs text-blue-600 font-medium">
                            {progress}% {isNepali ? 'पूरा' : 'done'}
                          </div>
                        )}
                        {step.estimatedTime > 0 && (
                          <div className="text-xs text-gray-500">
                            ⏱️ {formatTime(step.estimatedTime)}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Operator Indicator */}
                  {step.assignedOperator && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-white">👤</span>
                      </div>
                    </div>
                  )}

                  {/* Quality Indicator */}
                  {step.status === 'completed' && step.defects > 0 && (
                    <div className="absolute -top-1 -left-1">
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        !
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow Connection */}
                {index < processSteps.length - 1 && (
                  <div className="flex items-center flex-shrink-0">
                    <div className={`
                      w-12 h-0.5 border-t-2 border-dashed
                      ${getConnectionColor(step.status, processSteps[index + 1].status)}
                      relative
                    `}>
                      {/* Arrow Head */}
                      <div className={`
                        absolute -right-1 -top-1 w-2 h-2 transform rotate-45 border-t-2 border-r-2
                        ${getConnectionColor(step.status, processSteps[index + 1].status)}
                      `}></div>
                      
                      {/* Flow Label */}
                      {step.status === 'completed' && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <div className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Detailed Step Info Panel */}
        {selectedStep && !compact && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6 border">
            {(() => {
              const step = processSteps.find(s => s.id === selectedStep);
              if (!step) return null;
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{step.icon}</div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{step.name}</h4>
                        <p className="text-sm text-gray-600">
                          {isNepali ? 'चरण' : 'Step'} {step.sequence} • {step.machineType || 'Manual'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStep(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{step.pieces}</div>
                      <div className="text-xs text-gray-500">{isNepali ? 'कुल टुक्रा' : 'Total Pieces'}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-600">{step.completedPieces}</div>
                      <div className="text-xs text-gray-500">{isNepali ? 'पूरा भएको' : 'Completed'}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-600">{getProgressPercentage(step)}%</div>
                      <div className="text-xs text-gray-500">{isNepali ? 'प्रगति' : 'Progress'}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-orange-600">{formatTime(step.estimatedTime)}</div>
                      <div className="text-xs text-gray-500">{isNepali ? 'अनुमानित समय' : 'Est. Time'}</div>
                    </div>
                  </div>

                  {step.assignedOperator && (
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">👤</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {typeof step.assignedOperator === 'string' ? step.assignedOperator : step.assignedOperator.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {isNepali ? 'नियुक्त अपरेटर' : 'Assigned Operator'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {step.status === 'ready' && (
                      <button
                        onClick={() => onStatusUpdate && onStatusUpdate(step.id, 'in_progress')}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🚀 {isNepali ? 'सुरु गर्नुहोस्' : 'Start'}
                      </button>
                    )}
                    {step.status === 'in_progress' && (
                      <button
                        onClick={() => onStatusUpdate && onStatusUpdate(step.id, 'completed')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✅ {isNepali ? 'पूरा गर्नुहोस्' : 'Complete'}
                      </button>
                    )}
                    {step.status === 'blocked' && (
                      <button
                        onClick={() => onStatusUpdate && onStatusUpdate(step.id, 'ready')}
                        className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        🔄 {isNepali ? 'पुनः सुरु गर्नुहोस्' : 'Resume'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {showDetails && !compact && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {processSteps.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-green-700">{isNepali ? 'सम्पन्न' : 'Completed'}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {processSteps.filter(s => s.status === 'in_progress').length}
            </div>
            <div className="text-sm text-blue-700">{isNepali ? 'चलिरहेको' : 'In Progress'}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {processSteps.filter(s => s.status === 'ready').length}
            </div>
            <div className="text-sm text-yellow-700">{isNepali ? 'तयार' : 'Ready'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {processSteps.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-700">{isNepali ? 'पेन्डिङ' : 'Pending'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessFlowChart;