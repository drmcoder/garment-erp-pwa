import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';

const DragDropAssignment = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverOperator, setDragOverOperator] = useState(null);
  const [assignments, setAssignments] = useState({});
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

    if (!draggedItem || !isCompatibleOperator(draggedItem, operatorId)) {
      addError({
        message: currentLanguage === 'np'
          ? 'यो अपरेटर यस काम प्रकारको लागि उपयुक्त छैन'
          : 'This operator is not compatible with this work type',
        component: 'DragDropAssignment',
        action: 'Invalid Drop'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    const operator = operators.find(op => op.id === operatorId);
    const newAssignment = {
      workItemId: draggedItem.id,
      operatorId: operatorId,
      assignedAt: new Date(),
      method: 'drag-drop'
    };

    setAssignments(prev => ({
      ...prev,
      [draggedItem.id]: {
        ...newAssignment,
        operator: operator,
        workItem: draggedItem
      }
    }));

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
    return operator && (operator.machine === item.machineType || operator.machine === 'multi-skill');
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
      const assignmentsList = Object.values(assignments).map(a => ({
        workItemId: a.workItemId,
        operatorId: a.operatorId,
        assignedAt: a.assignedAt,
        method: a.method
      }));

      await onAssignmentComplete(assignmentsList);
      setAssignments({});
      
    } catch (error) {
      addError({
        message: 'Failed to confirm assignments',
        component: 'DragDropAssignment',
        action: 'Bulk Confirm',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleRemoveAssignment = (workItemId) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[workItemId];
      return newAssignments;
    });
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

  const getOperatorLoadColor = (currentLoad, maxLoad) => {
    const percentage = (currentLoad / maxLoad) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const availableItems = workItems.filter(item => 
    item.status === 'ready' && !assignments[item.id]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              🎯 {currentLanguage === 'np' ? 'ड्र्याग एन्ड ड्रप असाइनमेन्ट' : 'Drag & Drop Assignment'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'काम आइटमहरू अपरेटरहरूमा ड्र्याग गर्नुहोस्'
                : 'Drag work items to operators for assignment'
              }
            </p>
          </div>
          
          {Object.keys(assignments).length > 0 && (
            <button
              onClick={handleBulkConfirm}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>✅</span>
              <span>
                {currentLanguage === 'np' 
                  ? `${Object.keys(assignments).length} असाइनमेन्ट पुष्टि गर्नुहोस्`
                  : `Confirm ${Object.keys(assignments).length} Assignments`
                }
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Work Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📦</span>
            {currentLanguage === 'np' ? 'उपलब्ध काम आइटमहरू' : 'Available Work Items'}
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              {availableItems.length}
            </span>
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableItems.map((item) => (
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
                    <div>
                      <div className="font-medium text-gray-800">
                        Bundle #{item.bundleNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.articleName} - {item.size}
                      </div>
                      <div className="text-xs text-gray-500">
                        🔢 {item.pieces} pieces | ⏱️ {item.estimatedTime}min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {currentLanguage === 'np' ? 'ड्र्याग गर्नुहोस्' : 'Drag me'}
                    </span>
                    <span className="text-lg">👆</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operators Drop Zones */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👥</span>
            {currentLanguage === 'np' ? 'अपरेटरहरू' : 'Operators'}
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {operators.map((operator) => (
              <div
                key={operator.id}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, operator.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, operator.id)}
                className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                  dragOverOperator === operator.id && draggedItem && isCompatibleOperator(draggedItem, operator.id)
                    ? 'border-green-400 bg-green-50'
                    : dragOverOperator === operator.id
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getMachineTypeIcon(operator.machine)}</span>
                    <div>
                      <div className="font-medium text-gray-800">{operator.name}</div>
                      <div className="text-sm text-gray-600">{operator.machine}</div>
                      <div className={`text-xs ${getOperatorLoadColor(operator.currentLoad, operator.maxLoad)}`}>
                        📊 {operator.currentLoad}/{operator.maxLoad} | ⚡ {operator.efficiency}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {currentLanguage === 'np' ? 'यहाँ छोड्नुहोस्' : 'Drop here'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  <span className="font-medium">Bundle #{assignment.workItem.bundleNumber}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-blue-600 font-medium">{assignment.operator.name}</span>
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