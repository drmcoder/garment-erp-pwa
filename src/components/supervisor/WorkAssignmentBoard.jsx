import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';

const WorkAssignmentBoard = ({ workItems, operators, onAssignmentComplete, onCancel }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [availableOperators, setAvailableOperators] = useState([]);
  const [selectedWorkItems, setSelectedWorkItems] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [filterMachine, setFilterMachine] = useState('all');
  const [filterStatus, setFilterStatus] = useState('ready');
  const [assignments, setAssignments] = useState([]);

  // Mock operators data - would come from props or API
  const mockOperators = [
    {
      id: '001',
      name: 'राम बहादुर',
      nameEn: 'Ram Bahadur',
      machine: 'overlock',
      skillLevel: 'expert',
      currentLoad: 2,
      maxLoad: 5,
      efficiency: 95,
      photo: '👨‍🏭',
      status: 'available'
    },
    {
      id: '002', 
      name: 'सीता देवी',
      nameEn: 'Sita Devi',
      machine: 'flatlock',
      skillLevel: 'intermediate',
      currentLoad: 1,
      maxLoad: 4,
      efficiency: 88,
      photo: '👩‍🏭',
      status: 'available'
    },
    {
      id: '003',
      name: 'कृष्ण राई',
      nameEn: 'Krishna Rai', 
      machine: 'singleNeedle',
      skillLevel: 'expert',
      currentLoad: 3,
      maxLoad: 5,
      efficiency: 92,
      photo: '👨‍🔧',
      status: 'busy'
    },
    {
      id: '004',
      name: 'माया तामाङ',
      nameEn: 'Maya Tamang',
      machine: 'overlock',
      skillLevel: 'beginner', 
      currentLoad: 0,
      maxLoad: 3,
      efficiency: 75,
      photo: '👩‍🔧',
      status: 'available'
    }
  ];

  useEffect(() => {
    setAvailableOperators(operators || mockOperators);
  }, [operators]);

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
      // Auto-assign based on machine type and operator availability
      const autoAssignments = [];
      
      const readyItems = workItems.filter(item => item.status === 'ready');
      
      readyItems.forEach(item => {
        const compatibleOps = getCompatibleOperators(item.machineType)
          .filter(op => op.status === 'available' && op.currentLoad < op.maxLoad)
          .sort((a, b) => {
            // Sort by efficiency and current load
            const scoreA = a.efficiency - (a.currentLoad * 10);
            const scoreB = b.efficiency - (b.currentLoad * 10);
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🤖 {currentLanguage === 'np' ? 'स्वत: असाइन' : 'Auto Assign'}
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
                
                {/* Filters */}
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

              {selectedWorkItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="text-blue-800 font-semibold">
                    {selectedWorkItems.length} {currentLanguage === 'np' ? 'काम चयनित' : 'work items selected'}
                  </div>
                </div>
              )}

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
                      <div className="text-2xl">{item.icon}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-800">
                            {item.bundleId}
                          </span>
                          <span className="text-sm text-gray-500">→</span>
                          <span className="font-medium text-gray-700">
                            {item.operationName}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {item.articleNumber} • {item.color} • {item.size} • {item.pieces} pcs
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded border text-xs font-semibold ${getMachineTypeColor(item.machineType)}`}>
                            {item.machineType}
                          </span>
                          <span className="text-xs text-gray-500">
                            रु. {item.totalEarnings} • {item.estimatedTime} min
                          </span>
                        </div>
                      </div>
                      
                      {selectedWorkItems.some(selected => selected.id === item.id) && (
                        <div className="text-blue-600 text-xl">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                {availableOperators.map(operator => {
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
                            ID: {operator.id} • {operator.machine}
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