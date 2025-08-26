import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';

const WIPBundleViewAssignment = ({ workItems, operators, bundles = [], onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [viewMode, setViewMode] = useState('workflow'); // workflow, operations, summary
  const [filterStatus, setFilterStatus] = useState('all');

  // Group work items by bundle and process them
  const bundleGroups = useMemo(() => {
    const groups = {};
    
    workItems.forEach(item => {
      const bundleId = item.bundleId || `bundle-${item.bundleNumber}`;
      if (!groups[bundleId]) {
        groups[bundleId] = {
          id: bundleId,
          bundleNumber: item.bundleNumber,
          articleName: item.articleName,
          size: item.size,
          totalPieces: 0,
          operations: [],
          status: 'pending',
          priority: item.priority || 'medium',
          estimatedTime: 0,
          completedOperations: 0,
          progress: 0
        };
      }
      
      groups[bundleId].operations.push(item);
      groups[bundleId].totalPieces = Math.max(groups[bundleId].totalPieces, item.pieces || 0);
      groups[bundleId].estimatedTime += item.estimatedTime || 0;
      
      if (item.status === 'completed') {
        groups[bundleId].completedOperations += 1;
      }
    });
    
    // Calculate progress and status for each bundle
    Object.values(groups).forEach(bundle => {
      bundle.progress = Math.round((bundle.completedOperations / bundle.operations.length) * 100);
      
      if (bundle.completedOperations === bundle.operations.length) {
        bundle.status = 'completed';
      } else if (bundle.completedOperations > 0) {
        bundle.status = 'in-progress';
      } else {
        bundle.status = 'pending';
      }
      
      // Sort operations by sequence
      bundle.operations.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    });
    
    return Object.values(groups);
  }, [workItems]);

  const filteredBundles = useMemo(() => {
    return bundleGroups.filter(bundle => {
      if (filterStatus === 'all') return true;
      return bundle.status === filterStatus;
    });
  }, [bundleGroups, filterStatus]);

  const handleBundleSelect = (bundle) => {
    setSelectedBundle(bundle);
    setSelectedOperator(null);
  };

  const handleOperatorSelect = (operator) => {
    setSelectedOperator(operator);
  };

  const getCompatibleOperators = (operation) => {
    return operators.filter(op => 
      op.machine === operation.machineType || op.machine === 'multi-skill'
    );
  };

  const handleAssignOperation = async (operation) => {
    if (!selectedOperator) {
      addError({
        message: currentLanguage === 'np'
          ? 'कृपया पहिले अपरेटर छान्नुहोस्'
          : 'Please select an operator first',
        component: 'WIPBundleViewAssignment',
        action: 'Operation Assignment Validation'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    try {
      const assignment = {
        workItemId: operation.id,
        operatorId: selectedOperator.id,
        assignedAt: new Date(),
        method: 'wip-bundle-view'
      };

      await onAssignmentComplete([assignment]);
      
    } catch (error) {
      addError({
        message: 'Failed to assign operation',
        component: 'WIPBundleViewAssignment',
        action: 'Assign Operation',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleBulkAssignBundle = async () => {
    if (!selectedBundle || !selectedOperator) {
      addError({
        message: currentLanguage === 'np'
          ? 'बन्डल र अपरेटर दुबै छान्नुहोस्'
          : 'Select both bundle and operator',
        component: 'WIPBundleViewAssignment',
        action: 'Bulk Assignment Validation'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    try {
      const readyOperations = selectedBundle.operations.filter(op => op.status === 'ready');
      const compatibleOperations = readyOperations.filter(op => 
        selectedOperator.machine === op.machineType || selectedOperator.machine === 'multi-skill'
      );

      if (compatibleOperations.length === 0) {
        addError({
          message: currentLanguage === 'np'
            ? 'यो अपरेटरका लागि कुनै उपयुक्त अपरेशन छैन'
            : 'No compatible operations for this operator',
          component: 'WIPBundleViewAssignment',
          action: 'Compatibility Check'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
        return;
      }

      const assignments = compatibleOperations.map(op => ({
        workItemId: op.id,
        operatorId: selectedOperator.id,
        assignedAt: new Date(),
        method: 'wip-bundle-view-bulk'
      }));

      await onAssignmentComplete(assignments);
      
    } catch (error) {
      addError({
        message: 'Failed to assign bundle operations',
        component: 'WIPBundleViewAssignment',
        action: 'Bulk Assign Bundle',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMachineTypeIcon = (machineType) => {
    const icons = {
      'single-needle': '📍',
      'overlock': '🔗',
      'flatlock': '📎',
      'buttonhole': '🕳️',
      'cutting': '✂️',
      'pressing': '🔥',
      'finishing': '✨'
    };
    return icons[machineType] || '⚙️';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              📦 {currentLanguage === 'np' ? 'WIP बन्डल व्यू असाइनमेन्ट' : 'WIP Bundle View Assignment'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'बन्डलको वर्कफ़्लो हेरेर अपरेशनहरू असाइन गर्नुहोस्'
                : 'View bundle workflows and assign operations step by step'
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">{currentLanguage === 'np' ? 'सबै स्थिति' : 'All Status'}</option>
              <option value="pending">{currentLanguage === 'np' ? 'पेन्डिंग' : 'Pending'}</option>
              <option value="in-progress">{currentLanguage === 'np' ? 'चालू' : 'In Progress'}</option>
              <option value="completed">{currentLanguage === 'np' ? 'पूरा' : 'Completed'}</option>
            </select>
            
            <div className="flex space-x-1">
              {['workflow', 'operations', 'summary'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-sm rounded ${
                    viewMode === mode 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'workflow' && '🔄'}
                  {mode === 'operations' && '⚙️'}
                  {mode === 'summary' && '📊'}
                  {' '}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Bundles List */}
        <div className="xl:col-span-1 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {currentLanguage === 'np' ? 'WIP बन्डलहरू' : 'WIP Bundles'}
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              {filteredBundles.length}
            </span>
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredBundles.map((bundle) => (
              <div
                key={bundle.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedBundle?.id === bundle.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleBundleSelect(bundle)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">
                    Bundle #{bundle.bundleNumber}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(bundle.priority)}`}>
                    {bundle.priority}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{bundle.articleName} - {bundle.size}</div>
                  <div>🔢 {bundle.totalPieces} pieces</div>
                  <div>⚙️ {bundle.operations.length} operations</div>
                  <div>⏱️ {bundle.estimatedTime}min total</div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{currentLanguage === 'np' ? 'प्रगति' : 'Progress'}</span>
                    <span>{bundle.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        bundle.progress === 100 ? 'bg-green-500' :
                        bundle.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${bundle.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bundle Details and Operations */}
        <div className="xl:col-span-2 space-y-6">
          {selectedBundle ? (
            <>
              {/* Bundle Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Bundle #{selectedBundle.bundleNumber}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {selectedBundle.articleName} - {selectedBundle.size}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedBundle.totalPieces}
                    </div>
                    <div className="text-xs text-gray-600">pieces</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {selectedBundle.completedOperations}
                    </div>
                    <div className="text-xs text-gray-600">
                      {currentLanguage === 'np' ? 'पूरा भएको' : 'Completed'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {selectedBundle.operations.length - selectedBundle.completedOperations}
                    </div>
                    <div className="text-xs text-gray-600">
                      {currentLanguage === 'np' ? 'बाँकी' : 'Remaining'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {selectedBundle.estimatedTime}min
                    </div>
                    <div className="text-xs text-gray-600">
                      {currentLanguage === 'np' ? 'अनुमानित समय' : 'Est. Time'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Workflow */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-800">
                    {currentLanguage === 'np' ? 'अपरेशन वर्कफ़्लो' : 'Operations Workflow'}
                  </h4>
                  
                  {selectedOperator && (
                    <button
                      onClick={handleBulkAssignBundle}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <span>⚡</span>
                      <span>
                        {currentLanguage === 'np' ? 'बल्क असाइन' : 'Bulk Assign'}
                      </span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {selectedBundle.operations.map((operation, index) => (
                    <div key={operation.id} className="relative">
                      {/* Connection Line */}
                      {index < selectedBundle.operations.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300"></div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        {/* Step Number */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          operation.status === 'completed' ? 'bg-green-500' :
                          operation.status === 'assigned' ? 'bg-blue-500' :
                          operation.status === 'ready' ? 'bg-purple-500' : 'bg-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Operation Details */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getMachineTypeIcon(operation.machineType)}</span>
                              <div>
                                <div className="font-medium text-gray-800">{operation.operation}</div>
                                <div className="text-sm text-gray-600">
                                  {operation.machineType} | ⏱️ {operation.estimatedTime}min
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 text-sm font-medium rounded border ${getStatusColor(operation.status)}`}>
                                {operation.status}
                              </span>
                              
                              {operation.status === 'ready' && (
                                <button
                                  onClick={() => handleAssignOperation(operation)}
                                  disabled={!selectedOperator}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                                >
                                  {currentLanguage === 'np' ? 'असाइन' : 'Assign'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {currentLanguage === 'np' ? 'बन्डल छान्नुहोस्' : 'Select a Bundle'}
              </h3>
              <p className="text-gray-600">
                {currentLanguage === 'np'
                  ? 'वर्कफ़्लो र अपरेशनहरू हेर्न बन्डल छान्नुहोस्'
                  : 'Choose a bundle to view workflow and operations'
                }
              </p>
            </div>
          )}
        </div>

        {/* Operator Selection */}
        <div className="xl:col-span-1 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {currentLanguage === 'np' ? 'अपरेटर छान्नुहोस्' : 'Select Operator'}
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {operators.map((operator) => (
              <div
                key={operator.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  selectedOperator?.id === operator.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleOperatorSelect(operator)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={selectedOperator?.id === operator.id}
                    onChange={() => handleOperatorSelect(operator)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{operator.name}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <span>{getMachineTypeIcon(operator.machine)}</span>
                      <span>{operator.machine}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      ⚡ {operator.efficiency}% | 📊 {operator.currentLoad}/{operator.maxLoad}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WIPBundleViewAssignment;