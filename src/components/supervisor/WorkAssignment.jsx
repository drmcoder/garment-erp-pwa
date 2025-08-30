// src/components/supervisor/WorkAssignment.jsx
// Drag & drop work assignment interface for supervisors

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { BundleService, OperatorService, WorkAssignmentService, ConfigService, WIPService } from '../../services/firebase-services';
import { assignWorkItemToOperator, startWorkItem, completeWorkItem } from '../../utils/progressManager';
import SelfAssignmentApprovalQueue from './SelfAssignmentApprovalQueue';
import EmergencyWorkInsertion from './EmergencyWorkInsertion';
import WorkflowAnalyticsDashboard from './WorkflowAnalyticsDashboard';

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
    status: 'ready'
  });
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [activeWork, setActiveWork] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' | 'approvals'
  const [showEmergencyInsertion, setShowEmergencyInsertion] = useState(false);
  const [selectedLotForInsertion, setSelectedLotForInsertion] = useState(null);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  
  // Load data when component mounts
  useEffect(() => {
    loadOperators();
    loadAvailableBundles();
    loadAssignmentHistory();
    loadActiveWork();
  }, []);

  // Auto-refresh operators every 30 seconds to catch admin changes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing operators...');
      loadOperators();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Dynamic configurations from ConfigService
  const [machines, setMachines] = useState([]);
  const [operations, setOperations] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [skills, setSkills] = useState([]);

  // Helper function to get machine icon from configurations
  const getMachineIcon = (machineType) => {
    if (!machines || !Array.isArray(machines) || machines.length === 0 || !machineType) {
      return '⚙️';
    }
    const machine = machines.find(m => 
      m?.id === machineType || 
      m?.name?.toLowerCase().includes(machineType?.toLowerCase()) ||
      m?.nameNp?.includes(machineType)
    );
    return machine?.icon || '⚙️';
  };

  // Helper function to get machine color from configurations
  const getMachineColor = (machineType) => {
    if (!machines || !Array.isArray(machines) || machines.length === 0 || !machineType) {
      return '#6B7280';
    }
    const machine = machines.find(m => 
      m?.id === machineType || 
      m?.name?.toLowerCase().includes(machineType?.toLowerCase()) ||
      m?.nameNp?.includes(machineType)
    );
    return machine?.color || '#6B7280';
  };

  useEffect(() => {
    const loadData = async () => {
      await loadConfigurations(); // Load configurations first
      await loadAvailableBundles();
      await loadOperators(); // Load operators after skills are available
      await loadAssignmentHistory();
      await loadActiveWork();
    };
    loadData();
  }, [filter]);

  // Auto-refresh operators every 30 seconds to catch new users
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadOperators();
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    loadOperators();
    loadAvailableBundles();
    showNotification(
      isNepali ? 'डेटा रिफ्रेश गरियो' : 'Data refreshed',
      'success'
    );
  };

  // Load all dynamic configurations from ConfigService
  const loadConfigurations = async () => {
    try {
      console.log('🔄 Loading configurations for Work Assignment...');
      
      const [machinesData, operationsData, prioritiesData, statusesData, skillsData] = await Promise.all([
        ConfigService.getMachines(),
        ConfigService.getOperations(),
        ConfigService.getPriorities(),
        ConfigService.getStatuses('work'),
        ConfigService.getSkills()
      ]);
      
      setMachines(machinesData);
      setOperations(operationsData);
      setPriorities(prioritiesData);
      setStatuses(statusesData);
      setSkills(skillsData);
      
      console.log('✅ Loaded configurations:', {
        machines: machinesData.length,
        operations: operationsData.length,
        priorities: prioritiesData.length,
        statuses: statusesData.length,
        skills: skillsData.length
      });
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
    }
  };

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
          lotNumber: bundle.lotNumber || bundle.bundleNumber || bundle.id,
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

  // Helper function to get operator's primary skill
  const getOperatorSkill = (operator) => {
    // Check if operator has a skill assigned
    if (operator.skills && operator.skills.length > 0) {
      const skillId = operator.skills[0];
      const skill = skills.find(s => s.id === skillId);
      return {
        id: skillId,
        name: skill?.name || skillId,
        nameNp: skill?.nameNp || skillId
      };
    }

    // Fallback: determine skill from assigned machines
    if (operator.assignedMachines && operator.assignedMachines.length > 0) {
      const machineId = operator.assignedMachines[0];
      const machine = machines.find(m => m.id === machineId);
      const machineType = machine?.type?.toLowerCase() || machineId;
      
      // Find skill based on machine type
      const skill = skills.find(s => 
        s.machineTypes && s.machineTypes.includes(machineType)
      );
      
      if (skill) {
        return {
          id: skill.id,
          name: skill.name,
          nameNp: skill.nameNp
        };
      }
    }

    // Final fallback to general
    const generalSkill = skills.find(s => s.id === 'general');
    return {
      id: 'general',
      name: generalSkill?.name || 'General Operator',
      nameNp: generalSkill?.nameNp || 'सामान्य अपरेटर'
    };
  };

  // Helper function to get operator's assigned machine display name
  const getOperatorMachineDisplay = (operator) => {
    if (operator.assignedMachines && operator.assignedMachines.length > 0) {
      const machineId = operator.assignedMachines[0];
      const machine = machines.find(m => m.id === machineId);
      if (machine) {
        return {
          name: machine.name,
          nameNp: machine.nameNp || machine.name,
          icon: machine.icon || '⚙️'
        };
      }
    }
    
    // Fallback to station if no machine assigned
    return {
      name: operator.station || `${operator.machine || 'Station'}-${operator.name?.split(' ')[0] || 'Op'}`,
      nameNp: operator.stationNp || operator.station || `${operator.machine || 'स्टेशन'}-${operator.name?.split(' ')[0] || 'अप'}`,
      icon: '🏭'
    };
  };

  const loadOperators = async () => {
    try {
      console.log('🔄 Loading operators for Work Assignment...');
      // Try Firebase first
      const result = await OperatorService.getActiveOperators();
      let operators = [];
      
      if (result.success && result.operators.length > 0) {
        operators = result.operators;
        console.log('✅ Loaded operators from Firebase:', operators.length);
      } else {
        // No localStorage fallback - use empty array
        operators = [];
        console.log('⚠️ No operators found in Firebase, using empty array');
        console.log('Result details:', result);
      }

      // Map data to component format  
      const mappedOperators = operators.map(operator => {
        const operatorSkill = getOperatorSkill(operator);
        
        // Get machine display info
        const machineDisplay = getOperatorMachineDisplay(operator);
        
        return {
        ...operator,
        name: isNepali ? operator.name : operator.nameEn || operator.name,
        speciality: isNepali ? operatorSkill.nameNp : operatorSkill.name,
        specialityNepali: operatorSkill.nameNp,
        machineDisplay: machineDisplay.name || operator.machine || 'Not Assigned',
        machineDisplayNp: machineDisplay.nameNp || operator.machine || 'तोकिएको छैन',
        machineIcon: machineDisplay.icon || '🏭',
        status: operator.currentBundle ? 'working' : 'available',
        efficiency: operator.efficiency || operator.productivity?.averageTime || 75,
        qualityScore: operator.qualityScore || operator.productivity?.qualityScore || 95,
        currentWorkload: operator.currentWorkload || 0,
        maxWorkload: operator.maxWorkload || 3,
        skills: operator.skills || [],
        todayPieces: operator.todayStats?.piecesCompleted || operator.productivity?.completedBundles || 0,
        estimatedFinishTime: operator.estimatedFinishTime || null,
        station: operator.station || `${operator.machine || 'Station'}-${operator.name?.split(' ')[0] || 'Op'}`
      };
      });

      setOperators(mappedOperators);
      console.log('Final mapped operators:', mappedOperators.length);

    } catch (error) {
      console.error('Failed to load operators:', error);
      // No localStorage fallback
      try {
        setOperators([]);
        console.log('No operators available - using empty array');
      } catch (localError) {
        console.error('Error setting empty operators array:', localError);
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
        workItem.operationName || (workItem.operation?.nameEn || workItem.operation?.name) || 'Unknown Operation',
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

    const operatorMachine = operator.machineType || operator.machine || operator.speciality;
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
        // Determine if this is a WIP work item or traditional bundle
        const isWIPWorkItem = bundle.wipEntryId || bundle.garmentType || bundle.operationSequence;
        
        let assignResult;
        if (isWIPWorkItem) {
          // Handle WIP work item assignment
          console.log(`🔄 Assigning WIP work item: ${bundle.currentOperation} on ${bundle.machineType}`);
          assignResult = await WIPService.assignWorkItem(bundle.id, operator.id, user?.id || 'supervisor_01');
        } else {
          // Handle traditional bundle assignment (Firebase)
          assignResult = await BundleService.assignBundle(bundle.id, operator.id, user?.id || 'supervisor_01');
        }
        
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
      // Silently handle assignment errors to avoid console spam
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

  // Enhanced relative time formatting function
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return isNepali ? 'अमान्य मिति' : 'Invalid Date';
      }
      
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) {
        return isNepali ? 'अहिले' : 'Just now';
      } else if (diffMinutes < 60) {
        return isNepali ? `${diffMinutes} मिनेट अगाडि` : `${diffMinutes} min ago`;
      } else if (diffHours < 24) {
        return isNepali ? `${diffHours} घण्टा अगाडि` : `${diffHours} hours ago`;
      } else if (diffDays === 1) {
        return isNepali ? 'हिजो' : 'Yesterday';
      } else if (diffDays < 7) {
        return isNepali ? `${diffDays} दिन अगाडि` : `${diffDays} days ago`;
      } else {
        // For older dates, show the actual date
        return date.toLocaleDateString(isNepali ? 'ne-NP' : 'en-US', {
          month: 'short',
          day: 'numeric',
          ...(diffDays > 365 && { year: 'numeric' })
        });
      }
    } catch (error) {
      console.warn('Error formatting relative time:', error);
      return isNepali ? 'अमान्य मिति' : 'Invalid Date';
    }
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
                          {typeof assignment.bundle.operation === 'string' 
                            ? assignment.bundle.operation 
                            : assignment.bundle.operation?.nameEn || assignment.bundle.operation?.name || 'Unknown Operation'} ({assignment.bundle.pieces} {isNepali ? 'पिस' : 'pcs'})
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
            {/* Tab Navigation */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setActiveTab('assignment')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'assignment' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                🎯 {isNepali ? 'काम असाइन' : 'Work Assignment'}
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'approvals' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                🙋 {isNepali ? 'अनुमोदन गर्नुहोस्' : 'Approvals'}
              </button>
            </div>
            
            {activeTab === 'assignment' && (
              <>
                <button
                  onClick={() => setShowAnalyticsDashboard(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  title={isNepali ? 'वर्कफ्लो एनालिटिक्स' : 'Workflow Analytics'}
                >
                  📊 {isNepali ? 'एनालिटिक्स' : 'Analytics'}
                </button>
                <button
                  onClick={() => {
                    // Auto-detect current lot numbers from available work
                    const lotNumbers = [...new Set(availableBundles.map(b => b.lotNumber).filter(Boolean))];
                    if (lotNumbers.length === 1) {
                      setSelectedLotForInsertion(lotNumbers[0]);
                    } else {
                      setSelectedLotForInsertion('LOT001'); // Default if multiple or none
                    }
                    setShowEmergencyInsertion(true);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  title={isNepali ? 'आपातकालीन काम थप्नुहोस्' : 'Insert Emergency Work'}
                >
                  🚨 {isNepali ? 'आपातकाल' : 'Emergency'}
                </button>
                <button
                  onClick={() => setShowBulkAssign(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  {isNepali ? '🤖 स्मार्ट असाइन' : '🤖 Smart Assign'}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '🔄' : '↻'} {isNepali ? 'रिफ्रेस' : 'Refresh'}
                </button>
              </>
            )}
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

      {/* Tab Content */}
      {activeTab === 'approvals' ? (
        /* Approval Queue */
        <SelfAssignmentApprovalQueue />
      ) : (
        <>
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
              <option value="all">{isNepali ? 'सबै मेसिन' : 'All Machines'}</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {isNepali ? machine.nameNp || machine.name : machine.name}
                </option>
              ))}
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
              <option value="all">{isNepali ? 'सबै' : 'All'}</option>
              {statuses.filter(status => 
                // Only show statuses that make sense for assignment
                ['pending', 'ready', 'on-hold', 'self_assigned'].includes(status.id)
              ).map(status => (
                <option key={status.id} value={status.id}>
                  {status.icon} {isNepali ? status.nameNp : status.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Work Bundles */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {isNepali ? '📦 उपलब्ध काम' : '📦 Available Work'}
              </h2>
              <span className="text-sm text-gray-500">
                {availableBundles.length} {isNepali ? 'आइटम' : 'items'}
              </span>
            </div>
            
            {/* Search Bar */}
            <div className="mb-3">
              <input
                type="text"
                placeholder={isNepali ? 'खोज्नुहोस् (Article, Lot, Color, Operation...)' : 'Search (Article, Lot, Color, Operation...)'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
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
                    className={`p-4 border rounded-lg cursor-grab hover:shadow-md transition-all duration-200
                      ${selectedBundle?.id === bundle.id ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50' : ''}
                      ${draggedBundle?.id === bundle.id ? 'opacity-50' : ''}`}
                  >
                    {/* Header with Article and Priority */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          #{bundle.articleNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(bundle.priority)}`}>
                          {bundle.priority?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">{formatCurrency(bundle.rate)}/pc</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          ⏱️ ~{bundle.estimatedTime}min
                        </div>
                      </div>
                    </div>
                    
                    {/* Article Name and Lot */}
                    <div className="mb-2">
                      <div className="text-sm text-gray-900 font-semibold mb-1">
                        {bundle.articleName || `Article ${bundle.articleNumber}`}
                      </div>
                      <div className="text-xs text-gray-600">
                        📦 Lot: <span className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          {bundle.lotNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Operation and Machine */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs">
                        <span className="text-gray-500">Operation:</span>
                        <span className="ml-1 bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">
                          {typeof bundle.operation === 'string' 
                            ? bundle.operation 
                            : bundle.operation?.nameEn || bundle.operation?.name || 'Sewing'}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Machine:</span>
                        <span 
                          className="ml-1 px-2 py-1 rounded font-medium flex items-center space-x-1"
                          style={{ 
                            backgroundColor: `${getMachineColor(bundle.machineType)}15`,
                            color: getMachineColor(bundle.machineType)
                          }}
                        >
                          <span className="text-sm">{getMachineIcon(bundle.machineType)}</span>
                          <span>{bundle.machineType}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Bottom Row: Color, Size, Pieces */}
                    <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center">
                          <span className="w-3 h-3 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full mr-1"></span>
                          <span className="font-medium">{bundle.color || 'N/A'}</span>
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                          {bundle.size || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                        {bundle.pieces || 0} {isNepali ? 'पिस' : 'pcs'}
                      </div>
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
                    <div className="flex items-center space-x-1">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {operator.machineType || operator.machine || (isNepali ? operator.specialityNepali : operator.speciality)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                      <span>{operator.machineIcon}</span>
                      <span>{isNepali ? operator.machineDisplayNp : operator.machineDisplay}</span>
                    </div>
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
                ? `${typeof selectedBundle.articleNumber === 'string' 
                    ? selectedBundle.articleNumber 
                    : selectedBundle.articleNumber?.name || selectedBundle.articleNumber?.en || selectedBundle.articleNumber || 'Unknown Article'} - ${typeof selectedBundle.operation === 'string' 
                    ? selectedBundle.operation 
                    : selectedBundle.operation?.nameEn || selectedBundle.operation?.name || 'Unknown Operation'}`
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
                ? `${selectedOperator.name} (${selectedOperator.machineType || selectedOperator.machine || (isNepali ? selectedOperator.specialityNepali : selectedOperator.speciality)})`
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
                      {formatRelativeTime(assignment.assignedAt)}
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
        </>
      )}

      <SmartAssignModal
        show={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        onAssign={handleBulkAssign}
      />

      {/* Emergency Work Insertion Modal */}
      {showEmergencyInsertion && (
        <EmergencyWorkInsertion
          lotNumber={selectedLotForInsertion}
          onClose={() => {
            setShowEmergencyInsertion(false);
            setSelectedLotForInsertion(null);
          }}
          onSuccess={(workItemId) => {
            showNotification(
              isNepali 
                ? `✅ आपातकालीन काम सफलतापूर्वक थपियो`
                : `✅ Emergency work inserted successfully`,
              'success'
            );
            // Refresh work lists
            loadAvailableBundles();
            loadActiveWork();
          }}
        />
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalyticsDashboard && (
        <WorkflowAnalyticsDashboard
          onClose={() => setShowAnalyticsDashboard(false)}
        />
      )}
    </div>
  );
};

export default WorkAssignment;