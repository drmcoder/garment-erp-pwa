import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';

const UserProfileAssignment = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const handleOperatorSelect = (operator) => {
    setSelectedOperator(operator);
    setSelectedItems(new Set()); // Clear selected items when switching operators
  };

  const handleItemToggle = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const getCompatibleWorkItems = (operator) => {
    return workItems.filter(item => 
      item.status === 'ready' && 
      (operator.machine === item.machineType || operator.machine === 'multi-skill')
    );
  };

  const handleAssignToOperator = async () => {
    if (!selectedOperator || selectedItems.size === 0) {
      addError({
        message: currentLanguage === 'np'
          ? 'अपरेटर र कम से कम एक काम छान्नुहोस्'
          : 'Select operator and at least one work item',
        component: 'UserProfileAssignment',
        action: 'Assign Validation'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    try {
      const assignments = Array.from(selectedItems).map(itemId => ({
        workItemId: itemId,
        operatorId: selectedOperator.id,
        assignedAt: new Date(),
        method: 'user-profile-view'
      }));

      await onAssignmentComplete(assignments);
      setSelectedItems(new Set());
      
    } catch (error) {
      addError({
        message: 'Failed to assign work items',
        component: 'UserProfileAssignment',
        action: 'Assign Work',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const getOperatorStats = (operator) => {
    const compatibleWork = getCompatibleWorkItems(operator);
    const totalPieces = compatibleWork.reduce((sum, item) => sum + item.pieces, 0);
    const avgEfficiency = operator.efficiency || 0;
    const workloadPercentage = Math.round((operator.currentLoad / operator.maxLoad) * 100);
    
    return {
      compatibleWork: compatibleWork.length,
      totalPieces,
      avgEfficiency,
      workloadPercentage
    };
  };

  const getMachineTypeIcon = (machineType) => {
    const icons = {
      'single-needle': '📍',
      'overlock': '🔗',
      'flatlock': '📎',
      'buttonhole': '🕳️',
      'cutting': '✂️',
      'pressing': '🔥',
      'finishing': '✨',
      'multi-skill': '🎯'
    };
    return icons[machineType] || '⚙️';
  };

  const getWorkloadColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 50) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-blue-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              👤 {currentLanguage === 'np' ? 'यूजर प्रोफाइल असाइनमेन्ट व्यू' : 'User Profile Assignment View'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'अपरेटर प्रोफाइल हेर्नुहोस् र उपयुक्त काम असाइन गर्नुहोस्'
                : 'View operator profiles and assign suitable work'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm rounded ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📱 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm rounded ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Operators List/Grid */}
        <div className="xl:col-span-1 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {currentLanguage === 'np' ? 'अपरेटरहरू' : 'Operators'}
          </h3>
          
          <div className={viewMode === 'grid' ? 'space-y-3' : 'space-y-2'}>
            {operators.map((operator) => {
              const stats = getOperatorStats(operator);
              const isSelected = selectedOperator?.id === operator.id;
              
              return (
                <div
                  key={operator.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleOperatorSelect(operator)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {operator.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">{operator.name}</span>
                        {operator.status === 'active' && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <span>{getMachineTypeIcon(operator.machine)}</span>
                        <span>{operator.machine}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`text-xs font-medium ${getEfficiencyColor(stats.avgEfficiency)}`}>
                          ⚡ {stats.avgEfficiency}%
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getWorkloadColor(stats.workloadPercentage)}`}>
                          📊 {stats.workloadPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {currentLanguage === 'np' ? 'उपलब्ध काम:' : 'Available Work:'} {stats.compatibleWork}
                      </span>
                      <span>
                        {currentLanguage === 'np' ? 'जम्मा टुक्रा:' : 'Total Pieces:'} {stats.totalPieces}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Operator Profile & Work Assignment */}
        <div className="xl:col-span-2 space-y-6">
          {selectedOperator ? (
            <>
              {/* Operator Profile Detail */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6">
                <div className="flex items-start space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedOperator.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{selectedOperator.name}</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedOperator.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedOperator.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {getMachineTypeIcon(selectedOperator.machine)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{selectedOperator.machine}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getEfficiencyColor(selectedOperator.efficiency)}`}>
                          {selectedOperator.efficiency}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {currentLanguage === 'np' ? 'दक्षता' : 'Efficiency'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedOperator.currentLoad}/{selectedOperator.maxLoad}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {currentLanguage === 'np' ? 'वर्कलोड' : 'Workload'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {getCompatibleWorkItems(selectedOperator).length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {currentLanguage === 'np' ? 'उपलब्ध काम' : 'Available'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Assignment Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    {currentLanguage === 'np' ? 'उपयुक्त काम असाइन गर्नुहोस्' : 'Assign Compatible Work'}
                  </h3>
                  
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleAssignToOperator}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <span>✅</span>
                      <span>
                        {currentLanguage === 'np'
                          ? `${selectedItems.size} वटा असाइन गर्नुहोस्`
                          : `Assign ${selectedItems.size} Items`
                        }
                      </span>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {getCompatibleWorkItems(selectedOperator).map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedItems.has(item.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleItemToggle(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleItemToggle(item.id)}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <div>
                            <div className="font-medium text-gray-800">
                              Bundle #{item.bundleNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.articleName} - {item.size}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              🔢 {item.pieces} pieces | ⏱️ {item.estimatedTime}min
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {getCompatibleWorkItems(selectedOperator).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🤷‍♂️</div>
                    <p>
                      {currentLanguage === 'np'
                        ? 'यस अपरेटरका लागि कुनै उपयुक्त काम उपलब्ध छैन'
                        : 'No compatible work available for this operator'
                      }
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {currentLanguage === 'np' ? 'अपरेटर छान्नुहोस्' : 'Select an Operator'}
              </h3>
              <p className="text-gray-600">
                {currentLanguage === 'np'
                  ? 'विस्तृत प्रोफाइल र काम असाइनमेन्ट विकल्पहरू हेर्न अपरेटर छान्नुहोस्'
                  : 'Choose an operator to view detailed profile and work assignment options'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileAssignment;