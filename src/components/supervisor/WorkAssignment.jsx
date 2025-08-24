// src/components/supervisor/WorkAssignment.jsx
// Drag & drop work assignment interface for supervisors

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { BundleService, OperatorService, WorkAssignmentService } from '../../services/firebase-services';
import { assignWorkItemToOperator, startWorkItem, completeWorkItem } from '../../utils/progressManager';

const WorkAssignment = () => {
  const { user } = useContext(AuthContext);
  const { isNepali, formatCurrency } = useContext(LanguageContext);
  const { showNotification, sendWorkCompleted } = useContext(NotificationContext);
  
  const [availableBundles, setAvailableBundles] = useState([]);
  const [operators, setOperators] = useState([]);
  const [draggedBundle, setDraggedBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [filter, setFilter] = useState({
    machineType: 'all',
    priority: 'all',
    status: 'pending'
  });
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [activeWork, setActiveWork] = useState([]);

  useEffect(() => {
    loadAvailableBundles();
    loadOperators();
    loadAssignmentHistory();
    loadActiveWork();
  }, [filter]);

  const loadAvailableBundles = async () => {
    setLoading(true);
    try {
      const result = await BundleService.getAvailableBundles();
      
      if (result.success) {
        // Apply filters
        let filteredBundles = result.bundles.map(bundle => ({
          ...bundle,
          articleNumber: bundle.article?.toString() || bundle.articleNumber,
          articleName: bundle.articleName || `Article ${bundle.article}`,
          operation: bundle.currentOperation || 'Operation',
          pieces: bundle.quantity || bundle.pieces || 0,
          priority: bundle.priority || 'Normal',
          deadline: bundle.dueDate || new Date(Date.now() + 86400000).toISOString(),
          estimatedTime: bundle.estimatedTime || 30,
          lotNumber: bundle.bundleNumber || bundle.id,
        }));
        
        if (filter.machineType !== 'all') {
          filteredBundles = filteredBundles.filter(bundle => 
            bundle.machineType === filter.machineType
          );
        }
        
        if (filter.priority !== 'all') {
          filteredBundles = filteredBundles.filter(bundle => 
            bundle.priority === filter.priority
          );
        }

        if (filter.status !== 'all') {
          filteredBundles = filteredBundles.filter(bundle => 
            bundle.status === filter.status
          );
        }

        // Sort by priority and deadline
        filteredBundles.sort((a, b) => {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          const aPriority = priorityOrder[a.priority?.toLowerCase()] || 2;
          const bPriority = priorityOrder[b.priority?.toLowerCase()] || 2;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });

        setAvailableBundles(filteredBundles);
      } else {
        throw new Error(result.error || 'Failed to load bundles');
      }

    } catch (error) {
      console.error('Load bundles error:', error);
      showNotification(
        isNepali ? 'बन्डल लोड गर्न समस्या भयो' : 'Failed to load bundles',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOperators = async () => {
    try {
      // Try Firebase first
      const result = await OperatorService.getActiveOperators();
      let operators = [];
      
      if (result.success && result.operators.length > 0) {
        operators = result.operators;
        console.log('Loaded operators from Firebase:', operators.length);
      } else {
        // Fallback to localStorage if Firebase is empty
        const localOperators = JSON.parse(localStorage.getItem('operators') || '[]');
        operators = localOperators.filter(op => op.status === 'active');
        console.log('Loaded operators from localStorage:', operators.length);
      }

      // Map data to component format
      const mappedOperators = operators.map(operator => ({
        ...operator,
        name: isNepali ? operator.name : operator.nameEn || operator.name,
        speciality: operator.assignedMachines?.[0] || operator.machine || operator.speciality || 'General',
        specialityNepali: operator.assignedMachines?.[0] || operator.machine || 'सामान्य',
        status: operator.currentBundle ? 'working' : 'available',
        efficiency: operator.efficiency || operator.productivity?.averageTime || 85,
        qualityScore: operator.qualityScore || operator.productivity?.qualityScore || 95,
        currentWorkload: operator.currentWorkload || 0,
        maxWorkload: operator.maxWorkload || 3,
        skills: operator.skills || [],
        todayPieces: operator.todayStats?.piecesCompleted || operator.productivity?.completedBundles || 0,
        estimatedFinishTime: operator.estimatedFinishTime || null,
        station: operator.station || `Station-${operator.id?.slice(-2) || '01'}`
      }));

      setOperators(mappedOperators);
      console.log('Final mapped operators:', mappedOperators.length);

    } catch (error) {
      console.error('Failed to load operators:', error);
      // Try localStorage as final fallback
      try {
        const localOperators = JSON.parse(localStorage.getItem('operators') || '[]');
        const activeOperators = localOperators.filter(op => op.status === 'active');
        
        const mappedOperators = activeOperators.map(operator => ({
          ...operator,
          name: operator.name,
          speciality: operator.assignedMachines?.[0] || 'General',
          specialityNepali: operator.assignedMachines?.[0] || 'सामान्य',
          status: 'available',
          efficiency: 85,
          qualityScore: 95,
          currentWorkload: 0,
          maxWorkload: 3,
          skills: [],
          todayPieces: 0,
          estimatedFinishTime: null,
          station: `Station-${operator.id?.slice(-2) || '01'}`
        }));
        
        setOperators(mappedOperators);
        console.log('Loaded from localStorage fallback:', mappedOperators.length);
      } catch (localError) {
        console.error('LocalStorage fallback also failed:', localError);
        showNotification(
          isNepali ? 'ऑपरेटर लोड गर्न समस्या भयो' : 'Failed to load operators',
          'error'
        );
      }
    }
  };

  const loadAssignmentHistory = async () => {
    try {
      const result = await WorkAssignmentService.getAssignmentHistory(user?.id);
      
      if (result.success) {
        setAssignmentHistory(result.assignments || []);
      } else {
        console.error('Failed to load assignment history:', result.error);
      }
    } catch (error) {
      console.error('Failed to load assignment history:', error);
    }
  };

  const loadActiveWork = async () => {
    try {
      const result = await WorkAssignmentService.getActiveWorkAssignments();
      
      if (result.success) {
        // Map Firebase data to component format
        const mappedActiveWork = result.activeWork.map(work => ({
          id: work.id,
          bundleId: work.id,
          articleNumber: work.article?.toString() || work.articleNumber,
          articleName: work.articleName || `Article ${work.article}`,
          operation: work.currentOperation || 'Operation',
          operatorId: work.assignedOperator || work.currentOperatorId,
          operatorName: work.operatorName || 'Unknown Operator',
          pieces: work.quantity || work.pieces || 0,
          completedPieces: work.completedPieces || 0,
          rate: work.rate || 0,
          startedAt: work.startedAt || work.assignedAt,
          estimatedFinish: work.estimatedFinish,
          status: work.status === 'assigned' ? 'in_progress' : work.status
        }));

        setActiveWork(mappedActiveWork);
      } else {
        console.error('Failed to load active work:', result.error);
      }
    } catch (error) {
      console.error('Failed to load active work:', error);
    }
  };

  const markWorkComplete = async (workItem) => {
    setLoading(true);
    try {
      const earnings = workItem.completedPieces * workItem.rate;

      // Mark work as completed using Firebase service
      const completionData = {
        completedPieces: workItem.completedPieces,
        actualTime: Math.floor((new Date() - new Date(workItem.startedAt)) / (1000 * 60)),
        earnings: earnings
      };

      const completeResult = await WorkAssignmentService.markWorkAsCompleted(workItem.bundleId, completionData);
      
      if (!completeResult.success) {
        throw new Error(completeResult.error || 'Failed to mark as complete');
      }

      // Update operator workload
      await OperatorService.updateOperatorWorkload(workItem.operatorId, -1);

      // Send completion notification
      sendWorkCompleted(
        workItem.articleNumber,
        workItem.operation,
        workItem.completedPieces,
        formatCurrency(earnings)
      );

      // Remove from active work
      setActiveWork(prev => prev.filter(w => w.id !== workItem.id));

      // Update operator status
      setOperators(prev => prev.map(op => 
        op.id === workItem.operatorId 
          ? { 
              ...op, 
              currentWorkload: Math.max(0, op.currentWorkload - 1),
              todayPieces: op.todayPieces + workItem.completedPieces,
              status: op.currentWorkload <= 1 ? 'available' : 'working'
            }
          : op
      ));

      // Reload assignment history
      loadAssignmentHistory();

      showNotification(
        isNepali 
          ? `${workItem.articleNumber} सम्पन्न भयो। ${workItem.operatorName} - ${formatCurrency(earnings)} कमाई`
          : `${workItem.articleNumber} completed by ${workItem.operatorName} - ${formatCurrency(earnings)} earned`,
        'success'
      );

    } catch (error) {
      console.error('Work completion error:', error);
      showNotification(
        isNepali ? 'काम सम्पन्न गर्न समस्या भयो' : 'Failed to mark work as complete',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, bundle) => {
    setDraggedBundle(bundle);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, operator) => {
    e.preventDefault();
    
    if (!draggedBundle || !operator) {
      return;
    }

    // Check if operator can handle this work
    if (!canOperatorHandleWork(operator, draggedBundle)) {
      showNotification(
        isNepali 
          ? `${operator.name} यो काम गर्न सक्दैन - मेसिन मिल्दैन`
          : `${operator.name} cannot handle this work - machine mismatch`,
        'error'
      );
      setDraggedBundle(null);
      return;
    }

    // Check workload
    if (operator.currentWorkload >= operator.maxWorkload) {
      showNotification(
        isNepali 
          ? `${operator.name} को कामको बोझ भरिएको छ`
          : `${operator.name} is at maximum workload`,
        'warning'
      );
      setDraggedBundle(null);
      return;
    }

    await assignWorkToOperator(draggedBundle, operator);
    setDraggedBundle(null);
  };

  const canOperatorHandleWork = (operator, bundle) => {
    // Check machine compatibility with comprehensive matching
    const machineMatches = {
      'overlock': ['ओभरलक', 'Overlock', 'overlock'],
      'flatlock': ['फ्ल्यालक', 'Flatlock', 'flatlock'], 
      'single_needle': ['एकल सुई', 'Single Needle', 'singleNeedle', 'single_needle'],
      'singleNeedle': ['एकल सुई', 'Single Needle', 'singleNeedle', 'single_needle'],
      'buttonhole': ['बटनहोल', 'Buttonhole', 'buttonhole']
    };

    const operatorMachine = operator.speciality || operator.machine;
    const bundleMachine = bundle.machineType;
    
    // Direct match first
    if (operatorMachine === bundleMachine) return true;
    
    // Use mapping for cross-language matching
    const allowedMachines = machineMatches[operatorMachine] || [];
    return allowedMachines.includes(bundleMachine);
  };

  const assignWorkToOperator = async (bundle, operator) => {
    setLoading(true);
    try {
      // Check if this is a localStorage-based work item or Firebase bundle
      const isWorkItem = bundle.operationName && bundle.bundleId;
      
      if (isWorkItem) {
        // Handle work item assignment using progress manager
        console.log('Assigning work item:', bundle.id, 'to operator:', operator.id);
        
        const assignResult = assignWorkItemToOperator(bundle.id, operator.id, operator.name);
        
        if (!assignResult.success) {
          throw new Error(assignResult.error || 'Failed to assign work item');
        }
        
        // Update local state
        setOperators(prev => prev.map(op => 
          op.id === operator.id 
            ? { ...op, currentWorkload: op.currentWorkload + 1, status: 'working' }
            : op
        ));

        // Remove work item from available list
        setAvailableBundles(prev => prev.filter(b => b.id !== bundle.id));

        showNotification(
          isNepali 
            ? `${bundle.operationName} ${operator.name} लाई तोकियो`
            : `${bundle.operationName} assigned to ${operator.name}`,
          'success'
        );
        
      } else {
        // Handle traditional bundle assignment (Firebase)
        const assignResult = await BundleService.assignBundle(bundle.id, operator.id, user?.id || 'supervisor_01');
        
        if (!assignResult.success) {
          throw new Error(assignResult.error || 'Assignment failed');
        }

        // Create assignment record
        const assignmentData = {
          bundleId: bundle.id,
          operatorId: operator.id,
          operatorName: operator.name,
          articleNumber: bundle.articleNumber,
          operation: bundle.operation,
          assignedBy: user?.id || 'supervisor_01'
        };

        await WorkAssignmentService.createAssignmentRecord(assignmentData);

        // Update operator workload
        await OperatorService.updateOperatorWorkload(operator.id, 1);

        // Update local state
        setOperators(prev => prev.map(op => 
          op.id === operator.id 
            ? { ...op, currentWorkload: op.currentWorkload + 1, status: 'working' }
            : op
        ));

        // Remove bundle from available list
        setAvailableBundles(prev => prev.filter(b => b.id !== bundle.id));

        // Reload assignment history
        loadAssignmentHistory();

        showNotification(
          isNepali 
            ? `${bundle.articleNumber} ${operator.name} लाई तोकियो`
            : `${bundle.articleNumber} assigned to ${operator.name}`,
          'success'
        );
      }

    } catch (error) {
      console.error('Assignment error:', error);
      showNotification(
        isNepali ? 'काम असाइन गर्न समस्या भयो' : 'Failed to assign work',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedBundle || !selectedOperator) {
      showNotification(
        isNepali ? 'बन्डल र ऑपरेटर छनोट गर्नुहोस्' : 'Please select bundle and operator',
        'warning'
      );
      return;
    }

    await assignWorkToOperator(selectedBundle, selectedOperator);
    setSelectedBundle(null);
    setSelectedOperator(null);
  };

  const handleBulkAssign = async (assignments) => {
    setLoading(true);
    try {
      for (const assignment of assignments) {
        await assignWorkToOperator(assignment.bundle, assignment.operator);
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between assignments
      }

      showNotification(
        isNepali 
          ? `${assignments.length} काम सफलतापूर्वक असाइन गरियो`
          : `${assignments.length} work items assigned successfully`,
        'success'
      );

      setShowBulkAssign(false);
    } catch (error) {
      showNotification(
        isNepali ? 'बल्क असाइनमेन्ट असफल भयो' : 'Bulk assignment failed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const generateSmartAssignments = () => {
    const assignments = [];
    const availableOps = operators.filter(op => 
      op.status !== 'break' && op.currentWorkload < op.maxWorkload
    );

    availableBundles.forEach(bundle => {
      // Find best operator for this bundle
      const compatibleOps = availableOps.filter(op => canOperatorHandleWork(op, bundle));
      
      if (compatibleOps.length > 0) {
        // Sort by efficiency and current workload
        const bestOp = compatibleOps.sort((a, b) => {
          const aScore = a.efficiency - (a.currentWorkload * 10);
          const bScore = b.efficiency - (b.currentWorkload * 10);
          return bScore - aScore;
        })[0];

        assignments.push({ bundle, operator: bestOp });
        
        // Update temporary workload for next assignment
        bestOp.currentWorkload += 1;
      }
    });

    return assignments;
  };

  const getOperatorStatusColor = (status) => {
    const colors = {
      'available': 'bg-green-100 text-green-800 border-green-200',
      'working': 'bg-blue-100 text-blue-800 border-blue-200',
      'break': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'busy': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getOperatorStatusText = (status) => {
    const texts = {
      'available': isNepali ? 'उपलब्ध' : 'Available',
      'working': isNepali ? 'काम गर्दै' : 'Working',
      'break': isNepali ? 'विश्राम' : 'Break',
      'busy': isNepali ? 'व्यस्त' : 'Busy'
    };
    return texts[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'उच्च': 'bg-red-100 text-red-800 border-red-200',
      'High': 'bg-red-100 text-red-800 border-red-200',
      'सामान्य': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Normal': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'कम': 'bg-green-100 text-green-800 border-green-200',
      'Low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const SmartAssignModal = ({ show, onClose, onAssign }) => {
    const [smartAssignments, setSmartAssignments] = useState([]);
    
    useEffect(() => {
      if (show) {
        setSmartAssignments(generateSmartAssignments());
      }
    }, [show]);

    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isNepali ? '🤖 स्मार्ट असाइनमेन्ट' : '🤖 Smart Assignment'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {smartAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isNepali ? 'कुनै उपयुक्त असाइनमेन्ट फेला परेन' : 'No suitable assignments found'}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {isNepali 
                    ? `${smartAssignments.length} वटा स्मार्ट असाइनमेन्ट सुझाव दिइएको छ`
                    : `${smartAssignments.length} smart assignments suggested`}
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                {smartAssignments.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 px-3 py-1 rounded text-sm font-medium">
                          {assignment.bundle.articleNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          {assignment.bundle.operation} ({assignment.bundle.pieces} {isNepali ? 'पिस' : 'pcs'})
                        </div>
                        <div className="text-lg">→</div>
                        <div className="bg-green-100 px-3 py-1 rounded text-sm font-medium">
                          {assignment.operator.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.operator.efficiency}% {isNepali ? 'दक्षता' : 'efficiency'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
                <button
                  onClick={() => onAssign(smartAssignments)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {isNepali ? 'सबै असाइन गर्नुहोस्' : 'Assign All'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? '🎯 काम असाइनमेन्ट' : '🎯 Work Assignment'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNepali ? 'ड्र्याग एण्ड ड्रप वा म्यानुअल असाइनमेन्ट' : 'Drag & drop or manual assignment'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBulkAssign(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              {isNepali ? '🤖 स्मार्ट असाइन' : '🤖 Smart Assign'}
            </button>
            <button
              onClick={loadAvailableBundles}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄' : '↻'} {isNepali ? 'रिफ्रेस' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 text-sm">{isNepali ? 'उपलब्ध काम:' : 'Available Work:'}</div>
            <div className="text-blue-800 text-xl font-bold">{availableBundles.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm">{isNepali ? 'उपलब्ध ऑपरेटर:' : 'Available Operators:'}</div>
            <div className="text-green-800 text-xl font-bold">
              {operators.filter(op => op.status === 'available').length}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 text-sm">{isNepali ? 'काम गर्दै:' : 'Working:'}</div>
            <div className="text-yellow-800 text-xl font-bold">
              {operators.filter(op => op.status === 'working').length}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 text-sm">{isNepali ? 'आजको टोटल:' : 'Today Total:'}</div>
            <div className="text-purple-800 text-xl font-bold">
              {operators.reduce((sum, op) => sum + op.todayPieces, 0)}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-orange-600 text-sm">{isNepali ? 'औसत दक्षता:' : 'Avg Efficiency:'}</div>
            <div className="text-orange-800 text-xl font-bold">
              {operators.length > 0 ? Math.round(operators.reduce((sum, op) => sum + op.efficiency, 0) / operators.length) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              {isNepali ? 'मेसिन:' : 'Machine:'}
            </label>
            <select
              value={filter.machineType}
              onChange={(e) => setFilter(prev => ({ ...prev, machineType: e.target.value }))}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">{isNepali ? 'सबै' : 'All'}</option>
              <option value="ओभरलक">Overlock</option>
              <option value="फ्ल्यालक">Flatlock</option>
              <option value="एकल सुई">Single Needle</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              {isNepali ? 'प्राथमिकता:' : 'Priority:'}
            </label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">{isNepali ? 'सबै' : 'All'}</option>
              <option value={isNepali ? 'उच्च' : 'High'}>{isNepali ? 'उच्च' : 'High'}</option>
              <option value={isNepali ? 'सामान्य' : 'Normal'}>{isNepali ? 'सामान्य' : 'Normal'}</option>
              <option value={isNepali ? 'कम' : 'Low'}>{isNepali ? 'कम' : 'Low'}</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              {isNepali ? 'स्थिति:' : 'Status:'}
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="pending">{isNepali ? 'पेन्डिङ' : 'Pending'}</option>
              <option value="all">{isNepali ? 'सबै' : 'All'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Work Bundles */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {isNepali ? '📦 उपलब्ध काम' : '📦 Available Work'}
            </h2>
            <p className="text-sm text-gray-600">
              {isNepali ? 'ड्र्याग गरेर ऑपरेटरमा ड्रप गर्नुहोस्' : 'Drag bundles to operators'}
            </p>
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : availableBundles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isNepali ? 'कुनै काम उपलब्ध छैन' : 'No work available'}
              </div>
            ) : (
              <div className="space-y-3">
                {availableBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, bundle)}
                    onClick={() => setSelectedBundle(bundle)}
                    className={`p-4 border rounded-lg cursor-grab hover:shadow-md transition-shadow
                      ${selectedBundle?.id === bundle.id ? 'ring-2 ring-blue-500 border-blue-300' : ''}
                      ${draggedBundle?.id === bundle.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          {bundle.articleNumber}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(bundle.priority)}`}>
                          {bundle.priority}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{formatCurrency(bundle.rate)}/pc</div>
                        <div className="text-xs text-gray-500">~{bundle.estimatedTime}min</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-900 font-medium mb-1">
                      {bundle.articleName}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>{bundle.operation}</span>
                      <span>{bundle.pieces} {isNepali ? 'पिस' : 'pcs'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <span>{bundle.machineType}</span>
                      <span>{bundle.color} - {bundle.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Operators */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {isNepali ? '👥 ऑपरेटर' : '👥 Operators'}
            </h2>
            <p className="text-sm text-gray-600">
              {isNepali ? 'यहाँ काम ड्रप गर्नुहोस्' : 'Drop work here'}
            </p>
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {operators.map((operator) => (
                <div
                  key={operator.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, operator)}
                  onClick={() => setSelectedOperator(operator)}
                  className={`p-4 border rounded-lg transition-all
                    ${selectedOperator?.id === operator.id ? 'ring-2 ring-green-500 border-green-300' : ''}
                    ${draggedBundle && canOperatorHandleWork(operator, draggedBundle) 
                      ? 'border-green-300 bg-green-50' 
                      : draggedBundle 
                        ? 'border-red-300 bg-red-50' 
                        : 'hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{operator.name}</span>
                      <span className={`px-2 py-1 rounded text-xs border ${getOperatorStatusColor(operator.status)}`}>
                        {getOperatorStatusText(operator.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {operator.currentWorkload}/{operator.maxWorkload}
                      </div>
                      <div className="text-xs text-gray-500">workload</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>{isNepali ? operator.specialityNepali : operator.speciality}</span>
                    <span>{operator.station}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex space-x-4">
                      <span>{operator.efficiency}% {isNepali ? 'दक्षता' : 'efficiency'}</span>
                      <span>{operator.qualityScore}% {isNepali ? 'गुणस्तर' : 'quality'}</span>
                    </div>
                    <span>{operator.todayPieces} {isNepali ? 'आज' : 'today'}</span>
                  </div>
                  
                  {operator.estimatedFinishTime && (
                    <div className="text-xs text-blue-600 mt-1">
                      {isNepali ? 'समाप्त हुने समय:' : 'Est. finish:'} {formatTime(operator.estimatedFinishTime)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Assignment */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isNepali ? '✋ म्यानुअल असाइनमेन्ट' : '✋ Manual Assignment'}
        </h3>
        
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isNepali ? 'चुनिएको बन्डल:' : 'Selected Bundle:'}
            </label>
            <div className="p-2 border rounded-md bg-gray-50 text-sm">
              {selectedBundle 
                ? `${selectedBundle.articleNumber} - ${selectedBundle.operation}`
                : (isNepali ? 'बन्डल छनोट गर्नुहोस्' : 'Select a bundle')
              }
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isNepali ? 'चुनिएको ऑपरेटर:' : 'Selected Operator:'}
            </label>
            <div className="p-2 border rounded-md bg-gray-50 text-sm">
              {selectedOperator 
                ? `${selectedOperator.name} (${isNepali ? selectedOperator.specialityNepali : selectedOperator.speciality})`
                : (isNepali ? 'ऑपरेटर छनोट गर्नुहोस्' : 'Select an operator')
              }
            </div>
          </div>
          
          <button
            onClick={handleManualAssign}
            disabled={!selectedBundle || !selectedOperator || loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄' : '✓'} {isNepali ? 'असाइन गर्नुहोस्' : 'Assign'}
          </button>
        </div>
      </div>

      {/* Assignment History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isNepali ? '📋 असाइनमेन्ट इतिहास' : '📋 Assignment History'}
          </h3>
        </div>
        
        <div className="p-4">
          {assignmentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isNepali ? 'कुनै इतिहास छैन' : 'No history available'}
            </div>
          ) : (
            <div className="space-y-2">
              {assignmentHistory.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                      {assignment.articleNumber}
                    </span>
                    <span className="text-sm text-gray-600">
                      {assignment.operation}
                    </span>
                    <span className="text-sm text-gray-600">→</span>
                    <span className="text-sm font-medium">
                      {assignment.operatorName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {formatTime(assignment.assignedAt)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.status === 'completed' ? (isNepali ? 'पूरा' : 'Done') :
                       assignment.status === 'in_progress' ? (isNepali ? 'प्रगति' : 'Progress') :
                       (isNepali ? 'नयाँ' : 'New')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Smart Assignment Modal */}
      <SmartAssignModal
        show={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        onAssign={handleBulkAssign}
      />
    </div>
  );
};

export default WorkAssignment;