import { useState, useRef, useMemo } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { useGlobalError } from '../../../common/GlobalErrorHandler';

// Nepali date utilities
const getNepaliDateTime = () => {
  const now = new Date();
  const nepaliMonths = [
    'बैशाख', 'जेठ', 'अषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
    'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत'
  ];
  
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

export const useDragDropAssignment = (workItems, operators, onAssignmentComplete) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  // State
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverOperator, setDragOverOperator] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [workItemSearch, setWorkItemSearch] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [operatorViewMode, setOperatorViewMode] = useState('grid');
  const [workItemViewMode, setWorkItemViewMode] = useState('detailed');
  const [localOperators, setLocalOperators] = useState(operators);
  const [currentWorkPage, setCurrentWorkPage] = useState(1);
  const [workItemsPerPage] = useState(50);
  const dragCounterRef = useRef(0);

  // Drag handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
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

    // Update local operator workload
    setLocalOperators(prevOps => 
      prevOps.map(op => 
        op.id === operatorId 
          ? { ...op, currentLoad: op.currentLoad + 1, todayCount: (op.todayCount || 0) + 1 }
          : op
      )
    );

    addError({
      message: currentLanguage === 'np'
        ? `${draggedItem.bundleNumber} ${operator.name}लाई असाइन गरियो`
        : `Bundle ${draggedItem.bundleNumber} assigned to ${operator.name}`,
      component: 'DragDropAssignment',
      action: 'Successful Assignment'
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  // Utility functions
  const isCompatibleOperator = (item, operatorId) => {
    const operator = operators.find(op => op.id === operatorId);
    return operator && (operator.machine === item.machineType || operator.machine === 'multi-skill');
  };

  // Assignment management
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

  // Memoized filtered and sorted data
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

  const paginatedWorkItems = useMemo(() => {
    const startIndex = (currentWorkPage - 1) * workItemsPerPage;
    const endIndex = startIndex + workItemsPerPage;
    return filteredWorkItems.slice(startIndex, endIndex);
  }, [filteredWorkItems, currentWorkPage, workItemsPerPage]);

  const filteredOperators = useMemo(() => {
    if (!operatorSearch.trim()) return localOperators;
    const search = operatorSearch.toLowerCase();
    return localOperators.filter(operator =>
      operator.name.toLowerCase().includes(search) ||
      operator.machine.toLowerCase().includes(search) ||
      operator.id.toString().includes(search)
    );
  }, [localOperators, operatorSearch]);

  const sortedOperators = useMemo(() => {
    if (!draggedItem) return filteredOperators;
    
    return [...filteredOperators].sort((a, b) => {
      const aCompatible = isCompatibleOperator(draggedItem, a.id);
      const bCompatible = isCompatibleOperator(draggedItem, b.id);
      
      if (aCompatible && !bCompatible) return -1;
      if (!aCompatible && bCompatible) return 1;
      
      const aLoad = (a.currentLoad / a.maxLoad) * 100;
      const bLoad = (b.currentLoad / b.maxLoad) * 100;
      return aLoad - bLoad;
    });
  }, [filteredOperators, draggedItem]);

  return {
    // State
    draggedItem,
    dragOverOperator,
    assignments,
    workItemSearch,
    operatorSearch,
    operatorViewMode,
    workItemViewMode,
    currentWorkPage,
    workItemsPerPage,
    
    // Data
    filteredWorkItems,
    paginatedWorkItems,
    sortedOperators,
    totalWorkPages: Math.ceil(filteredWorkItems.length / workItemsPerPage),
    availableItems: workItems.filter(item => item.status === 'ready' && !assignments[item.id]),
    
    // Handlers
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleBulkConfirm,
    handleRemoveAssignment,
    
    // Setters
    setWorkItemSearch,
    setOperatorSearch,
    setOperatorViewMode,
    setWorkItemViewMode,
    setCurrentWorkPage,
    
    // Utils
    isCompatibleOperator
  };
};