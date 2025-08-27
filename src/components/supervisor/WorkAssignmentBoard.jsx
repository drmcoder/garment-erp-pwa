import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import { useWipFeatures } from '../../hooks/useWipFeatures';
import MultiMethodWorkAssignment from './MultiMethodWorkAssignment';

const WorkAssignmentBoard = ({ workItems, operators, bundles = [], onAssignmentComplete, onCancel }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const wipFeatures = useWipFeatures();
  
  // All hooks must be declared before any conditional returns
  const [availableOperators, setAvailableOperators] = useState([]);
  const [selectedWorkItems, setSelectedWorkItems] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [filterMachine, setFilterMachine] = useState('all');
  const [filteredOperators, setFilteredOperators] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ready');
  const [assignments, setAssignments] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'workflow'

  // Load operators from props or API - no mock data

  useEffect(() => {
    console.log('🔍 WorkAssignmentBoard received operators:', operators?.length || 0);
    if (operators && operators.length > 0) {
      console.log('🔍 Sample operator structure in Board:', operators[0]);
    }
    setAvailableOperators(operators || []);
    setFilteredOperators(operators || []);
  }, [operators]);

  // Dynamic operator filtering based on selected machine type
  useEffect(() => {
    if (filterMachine === 'all') {
      setFilteredOperators(availableOperators);
    } else {
      const filtered = availableOperators.filter(op => op.machine === filterMachine);
      setFilteredOperators(filtered);
    }
  }, [filterMachine, availableOperators]);

  // Suppress excessive console logging and dialogs
  useEffect(() => {
    // Reduce console noise in production
    if (process.env.NODE_ENV === 'production') {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args) => {
        // Only log important messages, not repetitive ones
        const message = args.join(' ');
        if (!message.includes('Success') && !message.includes('Loaded')) {
          originalLog.apply(console, args);
        }
      };
      
      console.error = (...args) => {
        // Still log errors but without popups
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        // Suppress repetitive warnings
        const message = args.join(' ');
        if (!message.includes('dialog') && !message.includes('Success')) {
          originalWarn.apply(console, args);
        }
      };
    }
  }, []);

  // Use MultiMethodWorkAssignment if enabled (for trial phase)
  if (wipFeatures.isEnabled('assignment.bundleCard') || wipFeatures.isEnabled('assignment.dragDrop')) {
    return (
      <MultiMethodWorkAssignment
        workItems={workItems}
        operators={operators}
        bundles={bundles}
        onAssignmentComplete={onAssignmentComplete}
        onCancel={onCancel}
      />
    );
  }

  const filteredWorkItems = workItems.filter(item => {
    const machineMatch = filterMachine === 'all' || item.machineType === filterMachine;
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    return machineMatch && statusMatch;
  });

  const getCompatibleOperators = (machineType) => {
    return availableOperators.filter(op => op.machine === machineType);
  };

  const handleWorkItemSelect = (workItem) => {
    setSelectedWorkItems(prev => {
      const isSelected = prev.some(item => item.id === workItem.id);
      if (isSelected) {
        return prev.filter(item => item.id !== workItem.id);
      } else {
        return [...prev, workItem];
      }
    });
  };

  const handleOperatorSelect = (operator) => {
    setSelectedOperator(operator);
  };

  const handleAssignWork = () => {
    try {
      if (!selectedOperator || selectedWorkItems.length === 0) {
        addError({
          message: currentLanguage === 'np' ? 'अपरेटर र काम दुवै छनोट गर्नुहोस्' : 'Please select both operator and work items',
          component: 'WorkAssignmentBoard',
          action: 'Assign Work',
          data: { operatorId: selectedOperator?.id, workItemCount: selectedWorkItems.length }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      // Check operator capacity
      const totalLoad = selectedOperator.currentLoad + selectedWorkItems.length;
      if (totalLoad > selectedOperator.maxLoad) {
        addError({
          message: currentLanguage === 'np' 
            ? `अपरेटरको क्षमता पुग्यो। अधिकतम: ${selectedOperator.maxLoad}`
            : `Operator capacity exceeded. Max: ${selectedOperator.maxLoad}`,
          component: 'WorkAssignmentBoard',
          action: 'Assign Work',
          data: { operatorId: selectedOperator.id, currentLoad: selectedOperator.currentLoad, maxLoad: selectedOperator.maxLoad }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      // Create assignments
      const newAssignments = selectedWorkItems.map(item => ({
        id: `assign-${Date.now()}-${item.id}`,
        workItemId: item.id,
        workItem: item,
        operatorId: selectedOperator.id,
        operator: selectedOperator,
        assignedAt: new Date(),
        assignedBy: 'supervisor', // Would be actual supervisor ID
        status: 'assigned',
        estimatedCompletion: new Date(Date.now() + item.estimatedTime * 60 * 1000)
      }));

      setAssignments(prev => [...prev, ...newAssignments]);

      // Update operator load
      setAvailableOperators(prev => prev.map(op => 
        op.id === selectedOperator.id 
          ? { ...op, currentLoad: op.currentLoad + selectedWorkItems.length }
          : op
      ));

      // Clear selections
      setSelectedWorkItems([]);
      setSelectedOperator(null);

      addError({
        message: currentLanguage === 'np' 
          ? `${selectedWorkItems.length} काम ${selectedOperator.name}लाई असाइन गरियो`
          : `${selectedWorkItems.length} work items assigned to ${selectedOperator.name}`,
        component: 'WorkAssignmentBoard',
        action: 'Assign Work Success',
        data: { assignments: newAssignments }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

    } catch (error) {
      addError({
        message: 'Failed to assign work',
        component: 'WorkAssignmentBoard',
        action: 'Assign Work',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleBulkAssign = () => {
    try {
      // Smart auto-assign based on priority, machine type, and operator workload
      const autoAssignments = [];
      
      const readyItems = workItems.filter(item => item.status === 'ready');
      
      // Sort items by priority (urgency, piece count, estimated time)
      const sortedItems = readyItems.sort((a, b) => {
        // Priority calculation: higher piece count + shorter time = higher priority
        const priorityA = (a.pieces || 0) - (a.estimatedTime || 0) / 60; // pieces minus hours
        const priorityB = (b.pieces || 0) - (b.estimatedTime || 0) / 60;
        return priorityB - priorityA;
      });
      
      sortedItems.forEach(item => {
        const compatibleOps = getCompatibleOperators(item.machineType)
          .filter(op => op.status === 'available' && op.currentLoad < op.maxLoad)
          .sort((a, b) => {
            // Smart scoring: efficiency, low workload, and experience
            const workloadPenaltyA = (a.currentLoad / a.maxLoad) * 30; // up to 30% penalty for high workload
            const workloadPenaltyB = (b.currentLoad / b.maxLoad) * 30;
            
            const scoreA = (a.efficiency || 70) - workloadPenaltyA;
            const scoreB = (b.efficiency || 70) - workloadPenaltyB;
            
            return scoreB - scoreA;
          });

        if (compatibleOps.length > 0) {
          const bestOperator = compatibleOps[0];
          autoAssignments.push({
            id: `auto-assign-${Date.now()}-${item.id}`,
            workItemId: item.id,
            workItem: item,
            operatorId: bestOperator.id,
            operator: bestOperator,
            assignedAt: new Date(),
            assignedBy: 'auto-supervisor',
            status: 'assigned',
            estimatedCompletion: new Date(Date.now() + item.estimatedTime * 60 * 1000)
          });

          // Update operator load
          bestOperator.currentLoad += 1;
        }
      });

      setAssignments(prev => [...prev, ...autoAssignments]);

      addError({
        message: currentLanguage === 'np' 
          ? `${autoAssignments.length} काम स्वचालित रूपमा असाइन गरियो`
          : `${autoAssignments.length} work items auto-assigned`,
        component: 'WorkAssignmentBoard',
        action: 'Bulk Assign',
        data: { assignmentCount: autoAssignments.length }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

    } catch (error) {
      addError({
        message: 'Failed to auto-assign work',
        component: 'WorkAssignmentBoard',
        action: 'Bulk Assign',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const getMachineTypeColor = (machineType) => {
    const colors = {
      'cutting': 'bg-red-100 text-red-800 border-red-200',
      'overlock': 'bg-blue-100 text-blue-800 border-blue-200',
      'flatlock': 'bg-green-100 text-green-800 border-green-200',
      'singleNeedle': 'bg-purple-100 text-purple-800 border-purple-200',
      'buttonhole': 'bg-orange-100 text-orange-800 border-orange-200',
      'manual': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[machineType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getOperatorLoadColor = (currentLoad, maxLoad) => {
    const percentage = (currentLoad / maxLoad) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
              title={currentLanguage === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">
                {currentLanguage === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
              </span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                👥 {currentLanguage === 'np' ? 'काम असाइनमेन्ट बोर्ड' : 'Work Assignment Board'}
              </h1>
              <p className="text-gray-600">
                {currentLanguage === 'np' ? 'अपरेटरहरूलाई काम असाइन गर्नुहोस्' : 'Assign work to operators'}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleBulkAssign}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                title={currentLanguage === 'np' ? 'स्मार्ट प्राथमिकता र कार्यभारको आधारमा काम असाइन गर्नुहोस्' : 'Smart assign based on priority and workload'}
              >
                <span>🧠</span>
                <span>{currentLanguage === 'np' ? 'स्मार्ट असाइन' : 'Smart Assign'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Work Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  📋 {currentLanguage === 'np' ? 'काम आइटमहरू' : 'Work Items'}
                </h2>
                
                {/* View Toggle & Filters */}
                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      📋 {currentLanguage === 'np' ? 'सूची' : 'List'}
                    </button>
                    <button
                      onClick={() => setViewMode('workflow')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'workflow'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      🔄 {currentLanguage === 'np' ? 'वर्कफ्लो' : 'Workflow'}
                    </button>
                  </div>
                
                <div className="flex space-x-3">
                  <select
                    value={filterMachine}
                    onChange={(e) => setFilterMachine(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">{currentLanguage === 'np' ? 'सबै मेसिन' : 'All Machines'}</option>
                    <option value="cutting">{currentLanguage === 'np' ? 'काटना' : 'Cutting'}</option>
                    <option value="overlock">{currentLanguage === 'np' ? 'ओभरलक' : 'Overlock'}</option>
                    <option value="flatlock">{currentLanguage === 'np' ? 'फ्ल्यालक' : 'Flatlock'}</option>
                    <option value="singleNeedle">{currentLanguage === 'np' ? 'एकल सुई' : 'Single Needle'}</option>
                    <option value="buttonhole">{currentLanguage === 'np' ? 'बटनहोल' : 'Buttonhole'}</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="ready">{currentLanguage === 'np' ? 'तयार' : 'Ready'}</option>
                    <option value="waiting">{currentLanguage === 'np' ? 'प्रतीक्षामा' : 'Waiting'}</option>
                    <option value="all">{currentLanguage === 'np' ? 'सबै' : 'All'}</option>
                  </select>
                  </div>
                </div>
              </div>

              {selectedWorkItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="text-blue-800 font-semibold">
                    {selectedWorkItems.length} {currentLanguage === 'np' ? 'काम चयनित' : 'work items selected'}
                  </div>
                </div>
              )}

              {/* Conditional Rendering: List vs Workflow View */}
              {viewMode === 'list' ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredWorkItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleWorkItemSelect(item)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedWorkItems.some(selected => selected.id === item.id)
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{item.icon || '🧵'}</div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-800">
                              {item.bundleNumber || item.bundleId || item.id}
                            </span>
                            <span className="text-sm text-gray-500">→</span>
                            <span className="font-medium text-gray-700">
                              {typeof item.operation === 'string' 
                                ? item.operation 
                                : item.operation?.nameEn || item.operation?.name || item.operationName || 'Proceed'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            {item.articleNumber} • {item.color} • {item.size} • {item.pieces} pcs
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded border text-xs font-semibold ${getMachineTypeColor(item.machineType)}`}>
                              {item.machineType}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                              ⏱️ {item.estimatedTime || item.time || 0} min
                            </span>
                            {item.totalEarnings && (
                              <span className="text-xs text-gray-500">
                                रु. {item.totalEarnings}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {selectedWorkItems.some(selected => selected.id === item.id) && (
                          <div className="text-blue-600 text-xl">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="text-center py-8 text-gray-500">
                    🔄 {currentLanguage === 'np' ? 'वर्कफ्लो दृश्य' : 'Workflow View'}
                    <div className="text-sm mt-2">
                      {filteredWorkItems.length === 0 
                        ? (currentLanguage === 'np' ? 'कुनै काम आइटम फेला परेन' : 'No work items found')
                        : `${filteredWorkItems.length} work items available`
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Operators */}
          <div className="space-y-6">
            
            {/* Operators List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                👨‍🏭 {currentLanguage === 'np' ? 'अपरेटरहरू' : 'Operators'}
              </h3>
              
              <div className="space-y-3">
                {filteredOperators.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-lg font-medium mb-2">
                      {currentLanguage === 'np' ? 'कुनै अपरेटर फेला परेन' : 'No operators found'}
                    </p>
                    <p className="text-sm">
                      {currentLanguage === 'np' 
                        ? 'पहिले User Management मा गएर अपरेटर बनाउनुहोस्।'
                        : 'Please create operators in User Management first.'
                      }
                    </p>
                  </div>
                ) : filteredOperators.map(operator => {
                  const isCompatible = selectedWorkItems.length === 0 || 
                    selectedWorkItems.every(item => item.machineType === operator.machine);
                  
                  return (
                    <div
                      key={operator.id}
                      onClick={() => isCompatible && handleOperatorSelect(operator)}
                      className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                        !isCompatible 
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : selectedOperator?.id === operator.id
                            ? 'border-green-400 bg-green-50 cursor-pointer'
                            : 'border-gray-200 hover:border-green-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{operator.photo}</div>
                        
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {currentLanguage === 'np' ? operator.name : operator.nameEn}
                          </div>
                          <div className="text-sm text-gray-600">
                            {currentLanguage === 'np' ? 'मेसिन:' : 'Machine:'} {operator.machine}
                          </div>
                          <div className="text-sm text-gray-600">
                            {currentLanguage === 'np' ? 'दक्षता:' : 'Efficiency:'} {operator.efficiency}%
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${getOperatorLoadColor(operator.currentLoad, operator.maxLoad)}`}>
                            {operator.currentLoad}/{operator.maxLoad}
                          </div>
                          <div className="text-xs text-gray-500">
                            {currentLanguage === 'np' ? 'कार्यभार' : 'Load'}
                          </div>
                        </div>
                      </div>
                      
                      {selectedOperator?.id === operator.id && (
                        <div className="mt-2 text-center">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ✓ {currentLanguage === 'np' ? 'चयनित' : 'Selected'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assignment Action */}
            {selectedWorkItems.length > 0 && selectedOperator && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold text-gray-800 mb-3">
                  ✅ {currentLanguage === 'np' ? 'असाइनमेन्ट पुष्टि' : 'Assignment Confirmation'}
                </h4>
                
                <div className="text-sm text-gray-600 mb-4">
                  <p><strong>{selectedWorkItems.length}</strong> {currentLanguage === 'np' ? 'काम आइटमहरू' : 'work items'}</p>
                  <p><strong>{selectedOperator.name}</strong> लाई असाइन गर्ने</p>
                  <p>
                    {currentLanguage === 'np' ? 'कुल समय:' : 'Total time:'} {' '}
                    <strong>{selectedWorkItems.reduce((sum, item) => sum + item.estimatedTime, 0)} min</strong>
                  </p>
                </div>
                
                <button
                  onClick={handleAssignWork}
                  className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  🎯 {currentLanguage === 'np' ? 'काम असाइन गर्नुहोस्' : 'Assign Work'}
                </button>
              </div>
            )}

            {/* Recent Assignments */}
            {assignments.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold text-gray-800 mb-3">
                  📝 {currentLanguage === 'np' ? 'हालैका असाइनमेन्टहरू' : 'Recent Assignments'}
                </h4>
                
                <div className="space-y-2 text-sm">
                  {assignments.slice(-5).map(assignment => (
                    <div key={assignment.id} className="bg-gray-50 rounded p-2">
                      <div className="font-medium">{assignment.operator.name}</div>
                      <div className="text-gray-600">{assignment.workItem.bundleId}</div>
                      <div className="text-xs text-gray-500">
                        {assignment.assignedAt.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkAssignmentBoard;