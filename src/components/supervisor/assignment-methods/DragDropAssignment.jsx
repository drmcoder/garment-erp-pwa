import React, { useState, useRef, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';
import { getMachineTypeIcon } from '../../../constants';
import { MachineCompatibilityValidator } from '../../../utils/machineCompatibility';
import OperatorAvatar from '../../common/OperatorAvatar';

// Nepali date utilities
const getNepaliDateTime = () => {
  const now = new Date();
  const nepaliMonths = [
    'बैशाख', 'जेठ', 'अषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
    'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत'
  ];
  
  // Simple Nepali date conversion (approximate)
  const nepaliYear = now.getFullYear() + 57;
  const nepaliMonth = nepaliMonths[now.getMonth()];
  const nepaliDay = now.getDate();
  const nepaliTime = now.toLocaleTimeString('ne-NP', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  return {
    date: `${nepaliYear} ${nepaliMonth} ${nepaliDay}`,
    time: nepaliTime,
    full: `${nepaliYear} ${nepaliMonth} ${nepaliDay}, ${nepaliTime}`,
    iso: now.toISOString()
  };
};

const DragDropAssignment = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverOperator, setDragOverOperator] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [workItemSearch, setWorkItemSearch] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [operatorViewMode, setOperatorViewMode] = useState('compact'); // 'grid' | 'list' | 'compact'
  const [workItemViewMode, setWorkItemViewMode] = useState('compact'); // 'detailed' | 'compact' | 'mini'
  const [localOperators, setLocalOperators] = useState(operators);
  const [currentWorkPage, setCurrentWorkPage] = useState(1);
  const [workItemsPerPage] = useState(50); // Pagination for large datasets
  const dragCounterRef = useRef(0);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Visual feedback for dragging
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverOperator(null);
    dragCounterRef.current = 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, operatorId) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    
    if (draggedItem && isCompatibleOperator(draggedItem, operatorId)) {
      setDragOverOperator(operatorId);
    }
  };

  const handleDragLeave = (e) => {
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setDragOverOperator(null);
    }
  };

  const handleDrop = (e, operatorId) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragOverOperator(null);

    if (!draggedItem) return;

    // Detailed validation with specific error messages
    const operator = operators.find(op => op.id === operatorId);
    const validation = MachineCompatibilityValidator.validateAssignment(operator, draggedItem, {
      checkWorkload: true,
      checkAvailability: true
    });

    if (!validation.valid) {
      const error = validation.errors[0]; // Get the first error
      let errorMessage;
      
      if (error.type === 'MACHINE_INCOMPATIBLE') {
        errorMessage = currentLanguage === 'np'
          ? `मेसिन बेमेल: ${operator.name} (${operator.machine}) ले ${draggedItem.machineType} काम गर्न सक्दैन`
          : `Machine mismatch: ${operator.name} (${operator.machine}) cannot handle ${draggedItem.machineType} work`;
      } else if (error.type === 'OPERATOR_UNAVAILABLE') {
        errorMessage = currentLanguage === 'np'
          ? `अपरेटर उपलब्ध छैन: ${operator.name}`
          : `Operator unavailable: ${operator.name}`;
      } else {
        errorMessage = currentLanguage === 'np'
          ? 'यो अपरेटर यस काम प्रकारको लागि उपयुक्त छैन'
          : 'This operator is not compatible with this work type';
      }

      addError({
        message: errorMessage,
        component: 'DragDropAssignment',
        action: 'Invalid Drop',
        data: { 
          operatorMachine: operator.machine,
          workMachine: draggedItem.machineType,
          validationErrors: validation.errors
        }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        let warningMessage = warning.message;
        if (warning.type === 'OPERATOR_OVERLOADED') {
          warningMessage = currentLanguage === 'np'
            ? `चेतावनी: ${operator.name} ले पहिले नै धेरै काम छ`
            : `Warning: ${operator.name} already has heavy workload`;
        }
        
        addError({
          message: warningMessage,
          component: 'DragDropAssignment',
          action: 'Assignment Warning'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      });
    }

    const dateTime = getNepaliDateTime();
    const newAssignment = {
      workItemId: draggedItem.id,
      operatorId: operatorId,
      assignedAt: dateTime.iso,
      assignedAtNepali: currentLanguage === 'np' ? dateTime.full : new Date().toLocaleString('en-US'),
      method: 'drag-drop',
      estimatedTime: draggedItem.estimatedTime || 0,
      pieces: draggedItem.pieces || 0
    };

    setAssignments(prev => ({
      ...prev,
      [draggedItem.id]: {
        ...newAssignment,
        operator: operator,
        workItem: draggedItem
      }
    }));

    // Update local operator workload immediately for UI feedback
    setLocalOperators(prevOps => 
      prevOps.map(op => 
        op.id === operatorId 
          ? { ...op, currentLoad: op.currentLoad + 1, todayCount: (op.todayCount || 0) + 1 }
          : op
      )
    );

    // Visual feedback for successful assignment
    addError({
      message: currentLanguage === 'np'
        ? `${draggedItem.bundleNumber} ${operator.name}लाई असाइन गरियो`
        : `Bundle ${draggedItem.bundleNumber} assigned to ${operator.name}`,
      component: 'DragDropAssignment',
      action: 'Successful Assignment'
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  const isCompatibleOperator = (item, operatorId) => {
    const operator = operators.find(op => op.id === operatorId);
    if (!operator || !item) return false;
    
    // Use centralized validation
    const compatibility = MachineCompatibilityValidator.isCompatible(operator, item);
    
    if (compatibility.compatible) {
      console.log('✅ Machine compatibility:', compatibility.reason);
    } else {
      console.log('❌ Machine incompatibility:', compatibility.reason);
    }
    
    return compatibility.compatible;
  };

  const handleBulkConfirm = async () => {
    if (Object.keys(assignments).length === 0) {
      addError({
        message: currentLanguage === 'np'
          ? 'कुनै काम असाइन गरिएको छैन'
          : 'No work items assigned',
        component: 'DragDropAssignment',
        action: 'Confirm Validation'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    try {
      const dateTime = getNepaliDateTime();
      const assignmentsList = Object.values(assignments).map(a => ({
        workItemId: a.workItemId,
        operatorId: a.operatorId,
        assignedAt: a.assignedAt || dateTime.iso,
        assignedAtNepali: a.assignedAtNepali || (currentLanguage === 'np' ? dateTime.full : new Date().toLocaleString('en-US')),
        method: a.method,
        estimatedTime: a.estimatedTime || 0,
        pieces: a.pieces || 0
      }));

      await onAssignmentComplete(assignmentsList);
      setAssignments({});
      
      // Success feedback
      addError({
        message: currentLanguage === 'np'
          ? `${assignmentsList.length} असाइनमेन्टहरू सफलतापूर्वक पूरा भयो`
          : `${assignmentsList.length} assignments completed successfully`,
        component: 'DragDropAssignment',
        action: 'Bulk Confirm Success'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      
    } catch (error) {
      console.error('Assignment error:', error);
      addError({
        message: currentLanguage === 'np'
          ? 'असाइनमेन्ट पूरा गर्न सफल भएन'
          : 'Failed to complete assignments',
        component: 'DragDropAssignment',
        action: 'Bulk Confirm Error',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleRemoveAssignment = (workItemId) => {
    const assignment = assignments[workItemId];
    if (assignment) {
      // Revert local operator workload
      setLocalOperators(prevOps => 
        prevOps.map(op => 
          op.id === assignment.operatorId 
            ? { ...op, currentLoad: Math.max(0, op.currentLoad - 1), todayCount: Math.max(0, (op.todayCount || 0) - 1) }
            : op
        )
      );
    }
    
    setAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[workItemId];
      return newAssignments;
    });
  };

  // Using centralized machine type icons

  const getOperatorLoadColor = (currentLoad, maxLoad) => {
    const percentage = (currentLoad / maxLoad) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Memoized search filter functions for performance
  const filteredWorkItems = useMemo(() => {
    const availableItems = workItems.filter(item => 
      item.status === 'ready' && !assignments[item.id]
    );
    
    if (!workItemSearch.trim()) return availableItems;
    const search = workItemSearch.toLowerCase();
    return availableItems.filter(item =>
      item.bundleNumber?.toString().toLowerCase().includes(search) ||
      item.articleName?.toLowerCase().includes(search) ||
      item.size?.toLowerCase().includes(search) ||
      item.color?.toLowerCase().includes(search) ||
      item.lotNumber?.toString().toLowerCase().includes(search) ||
      item.operation?.toLowerCase().includes(search) ||
      item.procedureName?.toLowerCase().includes(search) ||
      item.machineType?.toLowerCase().includes(search)
    );
  }, [workItems, assignments, workItemSearch]);

  // Paginated work items for better performance with 10k+ items
  const paginatedWorkItems = useMemo(() => {
    const startIndex = (currentWorkPage - 1) * workItemsPerPage;
    const endIndex = startIndex + workItemsPerPage;
    return filteredWorkItems.slice(startIndex, endIndex);
  }, [filteredWorkItems, currentWorkPage, workItemsPerPage]);

  const totalWorkPages = Math.ceil(filteredWorkItems.length / workItemsPerPage);

  const filteredOperators = useMemo(() => {
    if (!operatorSearch.trim()) return localOperators;
    const search = operatorSearch.toLowerCase();
    return localOperators.filter(operator =>
      operator.name.toLowerCase().includes(search) ||
      operator.machine.toLowerCase().includes(search) ||
      operator.id.toString().includes(search)
    );
  }, [localOperators, operatorSearch]);

  // Sort operators by compatibility and workload for better UX
  const sortedOperators = useMemo(() => {
    if (!draggedItem) return filteredOperators;
    
    return [...filteredOperators].sort((a, b) => {
      const aCompatible = isCompatibleOperator(draggedItem, a.id);
      const bCompatible = isCompatibleOperator(draggedItem, b.id);
      
      if (aCompatible && !bCompatible) return -1;
      if (!aCompatible && bCompatible) return 1;
      
      // If both compatible or both incompatible, sort by workload
      const aLoad = (a.currentLoad / a.maxLoad) * 100;
      const bLoad = (b.currentLoad / b.maxLoad) * 100;
      return aLoad - bLoad;
    });
  }, [filteredOperators, draggedItem]);

  const availableItems = workItems.filter(item => 
    item.status === 'ready' && !assignments[item.id]
  );

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      {Object.keys(assignments).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700 font-medium">
              {currentLanguage === 'np' 
                ? `${Object.keys(assignments).length} असाइनमेन्ट तयार`
                : `${Object.keys(assignments).length} assignments ready`
              }
            </span>
            <button
              onClick={handleBulkConfirm}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
            >
              <span>✅</span>
              <span>
                {currentLanguage === 'np' ? 'पुष्टि' : 'Confirm'}
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Work Items */}
        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800 flex items-center">
              📦 {currentLanguage === 'np' ? 'काम' : 'Available Work'}
              <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                {filteredWorkItems.length}
              </span>
            </h3>
            {filteredWorkItems.length > workItemsPerPage && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                {currentWorkPage}/{totalWorkPages}
              </span>
            )}
          </div>
          
          {/* Compact Search */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={workItemSearch}
                onChange={(e) => setWorkItemSearch(e.target.value)}
                placeholder={currentLanguage === 'np' ? 'खोज...' : 'Search...'}
                className="w-full pl-8 pr-4 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">🔍</span>
              </div>
              {workItemSearch && (
                <button
                  onClick={() => setWorkItemSearch('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xs">✕</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto">
            {filteredWorkItems.length === 0 && workItemSearch.trim() && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">🔍</span>
                <p className="mt-2">
                  {currentLanguage === 'np' 
                    ? 'कुनै काम आइटम भेटिएन'
                    : 'No work items found'
                  }
                </p>
                <p className="text-sm mt-1">
                  {currentLanguage === 'np' 
                    ? 'खोज शब्द बदल्नुहोस्'
                    : 'Try different search terms'
                  }
                </p>
              </div>
            )}

            {workItemViewMode === 'mini' ? (
              /* Mini View - Ultra compact for 10k+ items */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {paginatedWorkItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    className="border border-gray-200 rounded p-2 cursor-grab hover:border-blue-300 hover:shadow-sm transition-all duration-150 bg-white text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-sm">{getMachineTypeIcon(item.machineType)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-800 truncate">#{item.bundleNumber}</div>
                          <div className="text-xs text-gray-600 truncate">{item.articleName}</div>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-xs font-medium text-blue-600">{item.pieces}p</div>
                        <div className="text-xs text-gray-500">{item.estimatedTime}m</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : workItemViewMode === 'compact' ? (
              /* Compact View - Balanced for medium datasets */
              <div className="space-y-2">
                {paginatedWorkItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    className="border border-gray-200 rounded-lg p-3 cursor-grab hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-gradient-to-r from-white to-blue-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-800">#{item.bundleNumber}</div>
                            <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {item.lotNumber ? `L${item.lotNumber}` : 'No Lot'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {item.articleName} | {item.procedureName || item.operation || 'No Operation'}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span>📦 {item.pieces}pcs</span>
                            <span>⏱️ {item.estimatedTime}min</span>
                            <span>🎨 {item.color || 'No Color'}</span>
                            <span>📏 {item.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-xs text-gray-400">👆</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Detailed View - Full information */
              <div className="space-y-3">
                {paginatedWorkItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    className="border border-gray-200 rounded-lg p-4 cursor-grab hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-gradient-to-r from-white to-blue-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="font-semibold text-gray-800">Bundle #{item.bundleNumber}</div>
                            <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {item.lotNumber ? `Lot ${item.lotNumber}` : 'No Lot Number'}
                            </div>
                            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {item.machineType}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Article:</span>
                              <span className="ml-1 text-gray-600">{item.articleName}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Operation:</span>
                              <span className="ml-1 text-gray-600">{item.procedureName || item.operation || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Size:</span>
                              <span className="ml-1 text-gray-600">{item.size}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Color:</span>
                              <span className="ml-1 text-gray-600">{item.color || 'Not specified'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded">📦 {item.pieces} pieces</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">⏱️ {item.estimatedTime} min</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">🏭 {item.machineType}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-xs text-gray-400">
                          {currentLanguage === 'np' ? 'ड्र्याग गर्नुहोस्' : 'Drag me'}
                        </span>
                        <span className="text-lg">👆</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {paginatedWorkItems.length === 0 && !workItemSearch.trim() && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">📦</span>
                <p className="mt-2">
                  {currentLanguage === 'np' 
                    ? 'कुनै काम आइटम उपलब्ध छैन'
                    : 'No work items available'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Operators Drop Zones */}
        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-800 flex items-center">
              👥 {currentLanguage === 'np' ? 'अपरेटरहरू' : 'Operators'}
              <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                {sortedOperators.length}
              </span>
            </h3>
          </div>

          {/* Compact Search */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                placeholder={currentLanguage === 'np' ? 'अपरेटर खोज...' : 'Search operators...'}
                className="w-full pl-8 pr-4 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">🔍</span>
              </div>
              {operatorSearch && (
                <button
                  onClick={() => setOperatorSearch('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xs">✕</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto">
            {sortedOperators.length === 0 && operatorSearch.trim() && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">🔍</span>
                <p className="mt-2">
                  {currentLanguage === 'np' 
                    ? 'कुनै अपरेटर भेटिएन'
                    : 'No operators found'
                  }
                </p>
                <p className="text-sm mt-1">
                  {currentLanguage === 'np' 
                    ? 'खोज शब्द बदल्नुहोस्'
                    : 'Try different search terms'
                  }
                </p>
              </div>
            )}
            
            {operatorViewMode === 'compact' ? (
              /* Compact View - For 100+ operators */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortedOperators.map((operator) => {
                  const isCompatible = !draggedItem || isCompatibleOperator(draggedItem, operator.id);
                  const workloadPercent = (operator.currentLoad / operator.maxLoad) * 100;
                  
                  return (
                    <div
                      key={operator.id}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, operator.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, operator.id)}
                      className={`border rounded-md p-2 transition-all duration-150 text-xs ${
                        dragOverOperator === operator.id && isCompatible
                          ? 'border-green-400 bg-green-50'
                          : dragOverOperator === operator.id
                          ? 'border-red-400 bg-red-50'
                          : isCompatible
                          ? 'border-gray-300 hover:border-green-300 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <OperatorAvatar
                            operator={{
                              name: operator.name,
                              avatar: {
                                type: 'initials',
                                bgColor: operator.profileColor || '#3B82F6',
                                textColor: '#FFFFFF'
                              },
                              status: operator.status || 'available',
                              currentWorkload: operator.currentLoad || 0
                            }}
                            size="sm"
                            showStatus={true}
                            showWorkload={true}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-800 truncate">{operator.name}</div>
                            <div className="text-xs text-gray-500 truncate flex items-center space-x-1">
                              <span>{getMachineTypeIcon(operator.machine)}</span>
                              <span>{operator.machine}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className={`text-xs font-medium ${getOperatorLoadColor(operator.currentLoad, operator.maxLoad)}`}>
                            {operator.todayCount || 0}
                          </div>
                          <div className="w-8 h-1 bg-gray-200 rounded mt-1">
                            <div 
                              className={`h-full rounded ${
                                workloadPercent >= 90 ? 'bg-red-500' : 
                                workloadPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, workloadPercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Grid View - Traditional detailed view */
              <div className="space-y-3">
                {sortedOperators.map((operator) => {
                  const isCompatible = !draggedItem || isCompatibleOperator(draggedItem, operator.id);
                  
                  return (
                    <div
                      key={operator.id}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, operator.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, operator.id)}
                      className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                        dragOverOperator === operator.id && isCompatible
                          ? 'border-green-400 bg-green-50'
                          : dragOverOperator === operator.id
                          ? 'border-red-400 bg-red-50'
                          : isCompatible
                          ? 'border-gray-300 hover:border-gray-400'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <OperatorAvatar
                            operator={{
                              name: operator.name,
                              avatar: {
                                type: 'initials',
                                bgColor: operator.profileColor || '#3B82F6',
                                textColor: '#FFFFFF'
                              },
                              status: operator.status || 'available',
                              currentWorkload: operator.currentLoad || 0
                            }}
                            size="md"
                            showStatus={true}
                            showWorkload={true}
                          />
                          <div>
                            <div className="font-medium text-gray-800 flex items-center space-x-2">
                              <span>{operator.name}</span>
                              {!isCompatible && draggedItem && (
                                <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                                  {currentLanguage === 'np' ? 'मेल नखान्छ' : 'Incompatible'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center space-x-1">
                              <span>{getMachineTypeIcon(operator.machine)}</span>
                              <span>{operator.machine}</span>
                            </div>
                            <div className="flex items-center space-x-3 mt-1">
                              <div className={`text-xs ${getOperatorLoadColor(operator.currentLoad, operator.maxLoad)}`}>
                                📊 {operator.currentLoad}/{operator.maxLoad}
                              </div>
                              <div className="text-xs text-gray-500">
                                ⚡ {operator.efficiency}%
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                📅 {operator.todayCount || 0} {currentLanguage === 'np' ? 'आज' : 'today'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            {currentLanguage === 'np' ? 'यहाँ छोड्नुहोस्' : 'Drop here'}
                          </div>
                          {isCompatible && draggedItem && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ {currentLanguage === 'np' ? 'मेल खान्छ' : 'Compatible'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Preview */}
      {Object.keys(assignments).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            {currentLanguage === 'np' ? 'असाइनमेन्ट पूर्वावलोकन' : 'Assignment Preview'}
          </h3>
          
          <div className="space-y-2">
            {Object.values(assignments).map((assignment) => (
              <div
                key={assignment.workItemId}
                className="flex items-center justify-between bg-white rounded p-3"
              >
                <div className="flex items-center space-x-3">
                  <span>{getMachineTypeIcon(assignment.workItem.machineType)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Bundle #{assignment.workItem.bundleNumber}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-blue-600 font-medium">{assignment.operator.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      📅 {assignment.assignedAtNepali || new Date(assignment.assignedAt).toLocaleString(currentLanguage === 'np' ? 'ne-NP' : 'en-US')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAssignment(assignment.workItemId)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title={currentLanguage === 'np' ? 'हटाउनुहोस्' : 'Remove'}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropAssignment;