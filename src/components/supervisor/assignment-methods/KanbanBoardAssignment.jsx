import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';
import { getMachineTypeIcon } from '../../../constants';

const KanbanBoardAssignment = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverOperator, setDragOverOperator] = useState(null);
  const [columnView, setColumnView] = useState('operators'); // operators, status, machine
  const dragCounterRef = useRef({});

  const columns = {
    operators: operators.map(op => {
      const machineIcon = op.machine === 'single-needle' ? '📍' : 
                         op.machine === 'overlock' ? '🔗' : 
                         op.machine === 'flatlock' ? '📎' : 
                         op.machine === 'buttonhole' ? '🕳️' : '⚙️';
      return {
        id: op.id,
        title: `${machineIcon} ${op.name}`,
        subtitle: `${op.machine?.replace('-', ' ').toUpperCase()} | ${op.efficiency}% efficient`,
        items: workItems.filter(item => item.assignedTo === op.id),
        operator: op,
        color: getOperatorLoadColor(op.currentLoad, op.maxLoad)
      };
    }),
    status: [
      {
        id: 'ready',
        title: currentLanguage === 'np' ? 'तयार' : 'Ready',
        subtitle: currentLanguage === 'np' ? 'असाइनमेन्टको लागि तयार' : 'Ready for assignment',
        items: workItems.filter(item => item.status === 'ready'),
        color: 'bg-purple-100 border-purple-300'
      },
      {
        id: 'assigned',
        title: currentLanguage === 'np' ? 'असाइन गरिएको' : 'Assigned',
        subtitle: currentLanguage === 'np' ? 'अपरेटरलाई असाइन गरिएको' : 'Assigned to operators',
        items: workItems.filter(item => item.status === 'assigned'),
        color: 'bg-blue-100 border-blue-300'
      },
      {
        id: 'in-progress',
        title: currentLanguage === 'np' ? 'चालू' : 'In Progress',
        subtitle: currentLanguage === 'np' ? 'काम चालू छ' : 'Work in progress',
        items: workItems.filter(item => item.status === 'in-progress'),
        color: 'bg-yellow-100 border-yellow-300'
      },
      {
        id: 'completed',
        title: currentLanguage === 'np' ? 'पूरा' : 'Completed',
        subtitle: currentLanguage === 'np' ? 'काम पूरा भएको' : 'Work completed',
        items: workItems.filter(item => item.status === 'completed'),
        color: 'bg-green-100 border-green-300'
      }
    ],
    machine: [
      {
        id: 'single-needle',
        title: currentLanguage === 'np' ? 'सिंगल नीडल' : 'Single Needle',
        subtitle: '📍',
        items: workItems.filter(item => item.machineType === 'single-needle'),
        color: 'bg-red-100 border-red-300'
      },
      {
        id: 'overlock',
        title: currentLanguage === 'np' ? 'ओभरलक' : 'Overlock',
        subtitle: '🔗',
        items: workItems.filter(item => item.machineType === 'overlock'),
        color: 'bg-blue-100 border-blue-300'
      },
      {
        id: 'flatlock',
        title: currentLanguage === 'np' ? 'फ्ल्यालक' : 'Flatlock',
        subtitle: '📎',
        items: workItems.filter(item => item.machineType === 'flatlock'),
        color: 'bg-green-100 border-green-300'
      },
      {
        id: 'buttonhole',
        title: currentLanguage === 'np' ? 'बटनहोल' : 'Buttonhole',
        subtitle: '🕳️',
        items: workItems.filter(item => item.machineType === 'buttonhole'),
        color: 'bg-purple-100 border-purple-300'
      }
    ]
  };

  function getOperatorLoadColor(currentLoad, maxLoad) {
    const percentage = (currentLoad / maxLoad) * 100;
    if (percentage >= 90) return 'bg-red-100 border-red-300';
    if (percentage >= 70) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  }

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverOperator(null);
    dragCounterRef.current = {};
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, columnId) => {
    e.preventDefault();
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] || 0) + 1;
    
    if (columnView === 'operators' && draggedItem) {
      const operator = operators.find(op => op.id === columnId);
      if (operator && isCompatibleOperator(draggedItem, operator)) {
        setDragOverOperator(columnId);
      }
    }
  };

  const handleDragLeave = (e, columnId) => {
    dragCounterRef.current[columnId] = (dragCounterRef.current[columnId] || 1) - 1;
    if (dragCounterRef.current[columnId] === 0) {
      setDragOverOperator(null);
    }
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    dragCounterRef.current[columnId] = 0;
    setDragOverOperator(null);

    if (!draggedItem) return;

    try {
      if (columnView === 'operators') {
        const operator = operators.find(op => op.id === columnId);
        if (!operator || !isCompatibleOperator(draggedItem, operator)) {
          addError({
            message: currentLanguage === 'np'
              ? 'यो अपरेटर यस काम प्रकारको लागि उपयुक्त छैन'
              : 'This operator is not compatible with this work type',
            component: 'KanbanBoardAssignment',
            action: 'Invalid Drop'
          }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
          return;
        }

        const assignment = {
          workItemId: draggedItem.id,
          operatorId: operator.id,
          assignedAt: new Date(),
          method: 'kanban-board'
        };

        await onAssignmentComplete([assignment]);
        
        addError({
          message: currentLanguage === 'np'
            ? `${draggedItem.bundleNumber} ${operator.name}लाई असाइन गरियो`
            : `Bundle ${draggedItem.bundleNumber} assigned to ${operator.name}`,
          component: 'KanbanBoardAssignment',
          action: 'Successful Assignment'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      }
      
    } catch (error) {
      addError({
        message: 'Failed to assign work item',
        component: 'KanbanBoardAssignment',
        action: 'Drop Assignment',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const isCompatibleOperator = (item, operator) => {
    return operator.machine === item.machineType || operator.machine === 'multi-skill';
  };

  // Using centralized machine type icons

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-red-500';
      case 'high': return 'border-l-4 border-orange-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-500';
    }
  };

  const renderWorkItem = (item) => (
    <div
      key={item.id}
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
      className={`bg-white border border-gray-200 rounded-lg p-3 mb-3 cursor-grab hover:shadow-md transition-all duration-200 ${getPriorityColor(item.priority)}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
          <div className="font-medium text-gray-800 text-sm">
            Bundle #{item.bundleNumber}
          </div>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {item.priority}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div>{item.articleName} - {item.size}</div>
        <div className="flex items-center justify-between">
          <span>🔢 {item.pieces} pieces</span>
          <span>⏱️ {item.estimatedTime}min</span>
        </div>
        <div className="text-xs text-gray-500">{item.operation}</div>
      </div>
    </div>
  );

  const currentColumns = columns[columnView];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              📋 {currentLanguage === 'np' ? 'कान्बन बोर्ड असाइनमेन्ट' : 'Kanban Board Assignment'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'काम आइटमहरूलाई कान्बन बोर्डमा ड्र्याग गरेर व्यवस्थित गर्नुहोस्'
                : 'Organize work items by dragging them across the kanban board'
              }
            </p>
          </div>
          
          <div className="flex space-x-2">
            {['operators', 'status', 'machine'].map(view => (
              <button
                key={view}
                onClick={() => setColumnView(view)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  columnView === view
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {view === 'operators' && '👥'}
                {view === 'status' && '📊'}
                {view === 'machine' && '⚙️'}
                {' '}
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-x-auto">
          {currentColumns.map((column) => (
            <div
              key={column.id}
              className={`min-h-96 rounded-lg border-2 border-dashed p-4 transition-all duration-200 ${
                column.color || 'bg-gray-100 border-gray-300'
              } ${
                dragOverOperator === column.id && columnView === 'operators' && draggedItem && isCompatibleOperator(draggedItem, column.operator)
                  ? 'border-green-400 bg-green-50'
                  : dragOverOperator === column.id
                  ? 'border-red-400 bg-red-50'
                  : ''
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="mb-4 pb-3 border-b border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {column.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {column.subtitle}
                    </p>
                  </div>
                  <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                    {column.items.length}
                  </span>
                </div>
                
                {/* Operator specific info */}
                {column.operator && (
                  <div className="mt-2 text-xs text-gray-600">
                    <div>📊 {column.operator.currentLoad}/{column.operator.maxLoad} load</div>
                    <div>⚡ {column.operator.efficiency}% efficiency</div>
                  </div>
                )}
              </div>

              {/* Column Items */}
              <div className="space-y-3">
                {column.items.map(renderWorkItem)}
              </div>

              {/* Drop Zone Indicator */}
              {column.items.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-2xl mb-2">📦</div>
                  <p className="text-xs">
                    {currentLanguage === 'np' 
                      ? 'यहाँ काम आइटम ड्रप गर्नुहोस्'
                      : 'Drop work items here'
                    }
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-medium text-gray-800 mb-3">
          {currentLanguage === 'np' ? 'लेजेन्ड' : 'Legend'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'प्राथमिकता' : 'Priority'}
            </p>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Urgent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Low</span>
              </div>
            </div>
          </div>
          
          <div>
            <p className="font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'मेसिन प्रकार' : 'Machine Types'}
            </p>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span>📍</span>
                <span>Single Needle</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🔗</span>
                <span>Overlock</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📎</span>
                <span>Flatlock</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🕳️</span>
                <span>Buttonhole</span>
              </div>
            </div>
          </div>
          
          <div>
            <p className="font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'निर्देशन' : 'Instructions'}
            </p>
            <div className="space-y-1 text-gray-600">
              <div>• {currentLanguage === 'np' ? 'काम ड्र्याग गर्नुहोस्' : 'Drag work items'}</div>
              <div>• {currentLanguage === 'np' ? 'उपयुक्त कलममा छोड्नुहोस्' : 'Drop in compatible columns'}</div>
              <div>• {currentLanguage === 'np' ? 'रंगले संगतता देखाउँछ' : 'Colors show compatibility'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoardAssignment;