import React, { useMemo } from 'react';
import OperatorAvatar from '../common/OperatorAvatar';

const QuickAssignmentPanel = ({ 
  operators, 
  workItems, 
  onQuickAssign, 
  selectedWorkItems = [],
  currentLanguage = 'en' 
}) => {
  
  // Get favorite operators (top performers)
  const favoriteOperators = useMemo(() => {
    return operators
      .filter(op => op.favoriteOperator || op.qualityScore >= 95)
      .slice(0, 6);
  }, [operators]);

  // Get smart suggestions based on workload and machine compatibility
  const getSmartSuggestions = (workItem) => {
    return operators
      .filter(op => {
        // Check machine compatibility
        const hasCompatibleMachine = op.machineTypes?.includes(workItem.operation?.machine) || 
                                   op.machine === workItem.operation?.machine;
        // Check availability
        const isAvailable = op.status === 'available' && op.currentWorkload < 5;
        return hasCompatibleMachine && isAvailable;
      })
      .sort((a, b) => {
        // Sort by workload (lower is better) then by efficiency (higher is better)
        if (a.currentWorkload !== b.currentWorkload) {
          return a.currentWorkload - b.currentWorkload;
        }
        return b.currentEfficiency - a.currentEfficiency;
      })
      .slice(0, 3);
  };

  const getMachineTypeIcon = (machineType) => {
    const icons = {
      'overlock': '🔧',
      'flatlock': '⚙️', 
      'coverStitch': '🪡',
      'lockstitch': '📌'
    };
    return icons[machineType] || '🔧';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
        <span>⚡</span>
        <span>{currentLanguage === 'np' ? 'द्रुत असाइनमेन्ट' : 'Quick Assignment'}</span>
      </h3>

      {/* Favorite Operators */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
          <span>⭐</span>
          <span>{currentLanguage === 'np' ? 'मनपर्ने ऑपरेटरहरू' : 'Favorite Operators'}</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {favoriteOperators.map((operator) => (
            <div 
              key={operator.id}
              className="group relative"
            >
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: `${operator.profileColor}20`,
                  borderColor: operator.profileColor,
                  color: operator.profileColor 
                }}
                onClick={() => onQuickAssign(operator.id, selectedWorkItems)}
                disabled={operator.status !== 'available'}
              >
                <OperatorAvatar operator={operator} size="xs" />
                <span className="hidden sm:block">
                  {currentLanguage === 'np' ? operator.nameNepali : operator.name}
                </span>
                <span className="text-xs">({operator.currentWorkload})</span>
              </button>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {getMachineTypeIcon(operator.machine)} {operator.machine} • {operator.currentEfficiency}% eff
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Suggestions */}
      {selectedWorkItems.length === 1 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <span>🎯</span>
            <span>{currentLanguage === 'np' ? 'स्मार्ट सुझावहरू' : 'Smart Suggestions'}</span>
          </h4>
          
          {(() => {
            const workItem = selectedWorkItems[0];
            const suggestions = getSmartSuggestions(workItem);
            
            if (suggestions.length === 0) {
              return (
                <p className="text-sm text-gray-500">
                  {currentLanguage === 'np' 
                    ? 'यो काम को लागि कुनै उपयुक्त ऑपरेटर उपलब्ध छैन'
                    : 'No suitable operators available for this work'
                  }
                </p>
              );
            }
            
            return (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((operator, index) => (
                  <button
                    key={operator.id}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border-2 border-transparent hover:border-gray-300"
                    onClick={() => onQuickAssign(operator.id, [workItem])}
                  >
                    <OperatorAvatar operator={operator} size="xs" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {currentLanguage === 'np' ? operator.nameNepali : operator.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        Load: {operator.currentWorkload}/5 • {operator.currentEfficiency}%
                      </span>
                    </div>
                    {index === 0 && (
                      <span className="text-green-600 text-xs font-bold">BEST</span>
                    )}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Machine Type Quick Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
          <span>🔧</span>
          <span>{currentLanguage === 'np' ? 'मेसिन प्रकार द्वारा' : 'By Machine Type'}</span>
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {['overlock', 'flatlock', 'coverStitch'].map((machineType) => {
            const machineOperators = operators.filter(op => 
              op.machineTypes?.includes(machineType) && op.status === 'available'
            );
            
            return (
              <div key={machineType} className="group relative">
                <button
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm border border-blue-200 transition-colors"
                  disabled={machineOperators.length === 0}
                >
                  <span className="text-lg">{getMachineTypeIcon(machineType)}</span>
                  <span className="capitalize">{machineType}</span>
                  <span className="text-xs bg-blue-200 px-1 rounded">
                    {machineOperators.length}
                  </span>
                </button>
                
                {/* Machine operators dropdown preview */}
                {machineOperators.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg min-w-[200px]">
                      <div className="space-y-1">
                        {machineOperators.slice(0, 3).map((op) => (
                          <div key={op.id} className="flex items-center space-x-2 text-xs">
                            <OperatorAvatar operator={op} size="xs" />
                            <span>{currentLanguage === 'np' ? op.nameNepali : op.name}</span>
                            <span className="text-gray-500">({op.currentWorkload})</span>
                          </div>
                        ))}
                        {machineOperators.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{machineOperators.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickAssignmentPanel;