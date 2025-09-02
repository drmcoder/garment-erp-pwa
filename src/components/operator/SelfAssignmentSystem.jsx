// src/components/operator/SelfAssignmentSystem.jsx
// Complete Operator Self-Assignment System with Smart Recommendations

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { LanguageContext } from "../../context/LanguageContext";
import { NotificationContext } from "../../context/NotificationContext";
import { BundleService, WIPService, ActivityLogService } from "../../services/firebase-services";
import { db, collection, getDocs, setDoc, doc, updateDoc, COLLECTIONS } from "../../config/firebase";
import OperationsSequenceEditor from '../common/OperationsSequenceEditor';
import MachineSpecialitySelector from './MachineSpecialitySelector';
import { updateBundleWithReadableId, getBundleDisplayName } from '../../utils/bundleIdGenerator';
import { MOCK_DATA, COMPONENT_STATES } from '../../constants';
import { storageUtils, arrayUtils, debugUtils } from '../../lib';

const SelfAssignmentSystem = () => {
  const { user } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { showNotification, addNotification, sendWorkflowNotification, sendMachineGroupNotification } = useContext(NotificationContext);

  const [availableWork, setAvailableWork] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [operationTypes, setOperationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    machineType: "all",
    priority: "all",
    articleType: "all",
  });
  const [showOperationsEditor, setShowOperationsEditor] = useState(false);
  const [showMachineSelector, setShowMachineSelector] = useState(false);

  // Load operation types from Firestore or localStorage fallback
  useEffect(() => {
    const loadOperationTypes = async () => {
      try {
        // Try loading from Firestore first
        const operationsSnapshot = await getDocs(collection(db, 'operationTypes'));
        if (!operationsSnapshot.empty) {
          const operations = operationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOperationTypes(operations);
          console.log('✅ Loaded operation types from Firestore:', operations.length);
        } else {
          // Use mock data if Firestore is empty
          setOperationTypes(MOCK_DATA.OPERATION_TYPES);
          debugUtils.log('Using mock operation types - Firestore collection empty');
        }
      } catch (error) {
        debugUtils.warn('Failed to load operation types from Firestore, using mock data:', error);
        // Use mock data as fallback instead of localStorage
        setOperationTypes(MOCK_DATA.OPERATION_TYPES);
      }
    };
    
    loadOperationTypes();
  }, []);

  // Sample work creation removed - using only real Firestore data

  const loadAvailableWork = useCallback(async () => {
    setLoading(true);
    try {
      // Get bundles compatible with operator's assigned machine
      const operatorMachine = user?.machine || user?.assignedMachines?.[0] || 'overlock';
      if (!operatorMachine) {
        console.warn('No machine assigned to operator, showing all available work');
      }
      
      console.log(`🔍 Loading work for operator machine: ${operatorMachine}`);
      const result = await BundleService.getAvailableBundles(operatorMachine);

      if (result.success) {
        // Map Firebase data to component format with AI recommendations
        let filteredWork = result.bundles
          .filter(bundle => {
            // Comprehensive bundle validation
            const hasValidId = bundle.id && typeof bundle.id === 'string' && bundle.id.trim().length > 0;
            const hasValidStatus = bundle.status && ['pending', 'ready', 'assigned', 'waiting', 'in_progress', 'operator_completed', 'completed'].includes(bundle.status);
            const hasValidData = bundle.article || bundle.articleNumber || bundle.articleName;
            const hasValidMachine = bundle.machineType && bundle.machineType.trim().length > 0;
            const hasValidOperation = bundle.currentOperation && bundle.currentOperation.trim().length > 0;
            
            // Log problematic bundles for debugging
            if (!hasValidId || !hasValidStatus || !hasValidData || !hasValidMachine || !hasValidOperation) {
              console.warn(`🚫 Filtering out problematic bundle:`, {
                id: bundle.id,
                hasValidId,
                hasValidStatus,
                hasValidData,
                hasValidMachine,
                hasValidOperation,
                status: bundle.status,
                article: bundle.article,
                machineType: bundle.machineType,
                operation: bundle.currentOperation
              });
              return false;
            }
            
            // Extra check for specific problematic bundle IDs
            if (bundle.id === 'B727970-w-DD-S' || bundle.id === 'B759524-43--4XL') {
              console.warn(`🚫 Blocking known problematic bundle: ${bundle.id}`);
              return false;
            }
            
            return true;
          })
          .map(bundle => {
            // Generate human-readable bundle ID
            const bundleWithReadableId = updateBundleWithReadableId(bundle);
            
            return {
              id: bundle.id,
              readableId: bundleWithReadableId.readableId,
              displayName: bundleWithReadableId.displayName,
              articleNumber: bundle.article?.toString() || bundle.articleNumber,
              articleName: bundle.articleName || `Article ${bundle.article}`,
              englishName: bundle.articleName || `Article ${bundle.article}`,
              color: bundle.color || 'N/A',
              size: bundle.sizes?.[0] || bundle.size || 'N/A',
              pieces: bundle.quantity || bundle.pieces || bundle.pieceCount || 0,
              operation: bundle.currentOperation || 'Operation',
              englishOperation: bundle.currentOperation || 'Operation',
              machineType: bundle.machineType,
              englishMachine: bundle.machineType,
              rate: bundle.rate || 0,
              estimatedTime: bundle.estimatedTime || 30,
              priority: bundle.priority || 'medium',
              englishPriority: bundle.priority || 'medium',
              difficulty: calculateDifficulty(bundle),
              englishDifficulty: calculateDifficulty(bundle),
              recommendations: generateRecommendations(bundle, user),
              // Preserve WIP identification fields for assignment logic
              wipEntryId: bundle.wipEntryId,
              currentOperation: bundle.currentOperation
            };
          });

        // No sample work - use empty array when no real data available
        if (filteredWork.length === 0) {
          console.log(`ℹ️ No work found in Firebase for ${operatorMachine}. Add bundles to see available work.`);
        }

        console.log(`✅ Loaded ${filteredWork.length} work items for ${operatorMachine} machine`);

        // Work is already filtered by machine type at service level
        // No additional filtering needed for operators

        // Sort by recommendation match score
        filteredWork.sort(
          (a, b) => b.recommendations.match - a.recommendations.match
        );

        setAvailableWork(filteredWork);
      } else {
        throw new Error(result.error || 'Failed to load available work');
      }
    } catch (error) {
      console.error('Load available work error:', error);
      showNotification(
        isNepali ? "काम लोड गर्न समस्या भयो" : "Failed to load available work",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to calculate difficulty
  const calculateDifficulty = (bundle) => {
    const estimatedTime = bundle.estimatedTime || 30;
    if (estimatedTime < 20) return isNepali ? "सजिलो" : "Easy";
    if (estimatedTime < 40) return isNepali ? "मध्यम" : "Medium";
    return isNepali ? "कठिन" : "Hard";
  };

  // Helper function to generate AI recommendations
  const generateRecommendations = (bundle, user) => {
    let match = 50; // Lower base score, machine compatibility is critical
    const reasons = [];

    // Check machine compatibility - MOST IMPORTANT
    const userMachine = user?.machine || user?.speciality;
    const machineMatches = {
      'overlock': ['overlock', 'ओभरलक', 'Overlock', 'OVERLOCK'],
      'flatlock': ['flatlock', 'फ्ल्यालक', 'Flatlock', 'FLATLOCK'], 
      'singleNeedle': ['singleNeedle', 'single_needle', 'एकल सुई', 'Single Needle', 'single-needle', 'SINGLE_NEEDLE'],
      'single-needle': ['singleNeedle', 'single_needle', 'एकल सुई', 'Single Needle', 'single-needle', 'SINGLE_NEEDLE'],
      'buttonhole': ['buttonhole', 'बटनहोल', 'Buttonhole', 'BUTTONHOLE'],
      'buttonAttach': ['buttonAttach', 'button_attach', 'बटन जोड्ने', 'Button Attach', 'BUTTON_ATTACH'],
      'iron': ['iron', 'pressing', 'इस्त्री प्रेस', 'Iron Press', 'IRON'],
      'cutting': ['cutting', 'काट्ने मेसिन', 'Cutting Machine', 'CUTTING'],
      'embroidery': ['embroidery', 'कसिदाकारी मेसिन', 'Embroidery Machine', 'EMBROIDERY'],
      'manual': ['manual', 'हस्तकला काम', 'Manual Work', 'MANUAL']
    };

    // Enhanced compatibility check
    const isCompatible = () => {
      // Strict machine type matching - require both bundle and user machine types
      if (!bundle.machineType || !userMachine) {
        console.log('🚫 Compatibility check failed: missing data', { bundleMachineType: bundle.machineType, userMachine });
        return false;
      }
      
      // Direct match
      if (bundle.machineType === userMachine) {
        console.log('✅ Direct machine match:', bundle.machineType, '===', userMachine);
        return true;
      }
      
      // Check if user machine contains bundle machine type (e.g., "flatlock-Op" contains "flatlock")
      const userMachineClean = userMachine.toLowerCase().replace(/[^a-z]/g, '');
      const bundleMachineClean = bundle.machineType.toLowerCase().replace(/[^a-z]/g, '');
      
      if (userMachineClean.includes(bundleMachineClean) || bundleMachineClean.includes(userMachineClean)) {
        console.log('✅ Partial machine match:', userMachineClean, 'vs', bundleMachineClean);
        return true;
      }
      
      // Check against machine matches - improved logic
      for (const [machineType, aliases] of Object.entries(machineMatches)) {
        const userMachineInAliases = aliases.some(alias => alias.toLowerCase() === userMachine.toLowerCase());
        const bundleMachineInAliases = aliases.some(alias => alias.toLowerCase() === bundle.machineType.toLowerCase());
        
        if (userMachineInAliases && bundleMachineInAliases) {
          console.log('✅ Machine alias match:', machineType, 'connects', userMachine, 'with', bundle.machineType);
          return true;
        }
      }
      
      // Special case: if user is multi-skilled, they can handle any work
      if (userMachine && (userMachine.toLowerCase().includes('multi') || userMachine.toLowerCase().includes('all'))) {
        console.log('✅ Multi-skilled operator can handle any work');
        return true;
      }
      
      console.log('❌ No machine compatibility found:', { userMachine, bundleMachineType: bundle.machineType });
      return false;
    };
    
    if (isCompatible()) {
      match += 40; // High score for machine compatibility
      reasons.push(isNepali ? "तपाईंको विशेषता" : "Perfect machine match");
    } else {
      match = 10; // Very low score if machine doesn't match
      reasons.push(isNepali ? "मेसिन मिल्दैन" : "Machine mismatch");
      return { match, reasons }; // Return early for non-compatible work
    }

    // Check difficulty level for skill compatibility
    if (bundle.difficulty && bundle.difficulty.includes('सामान्य')) {
      match += 5;
      reasons.push(isNepali ? "उपयुक्त कठिनाई" : "Suitable difficulty");
    }

    // Check priority
    if (bundle.priority === 'high') {
      match += 5;
      reasons.push(isNepali ? "उच्च प्राथमिकता" : "High priority");
    }

    // Check estimated time (shorter = easier)
    const estimatedTime = bundle.estimatedTime || 30;
    if (estimatedTime < 30) {
      match += 5;
      reasons.push(isNepali ? "छिटो काम" : "Quick work");
    }

    return {
      match: Math.min(match, 100),
      reasons: reasons.slice(0, 3) // Limit to top 3 reasons
    };
  };

  useEffect(() => {
    loadAvailableWork();
  }, [loadAvailableWork]);


  // Filter available work based on search term and filters
  const getFilteredWork = () => {
    let filtered = [...availableWork];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(work => {
        // Search in multiple fields
        const searchFields = [
          work.articleNumber?.toString(),
          work.articleName?.toLowerCase(),
          work.englishName?.toLowerCase(),
          work.color?.toLowerCase(),
          work.size?.toLowerCase(),
          work.operation?.toLowerCase(),
          work.englishOperation?.toLowerCase(),
          work.id?.toLowerCase()
        ];

        return searchFields.some(field => 
          field && field.includes(search)
        );
      });
    }

    // Apply priority filter
    if (filter.priority !== 'all') {
      filtered = filtered.filter(work => 
        work.priority === filter.priority || 
        work.englishPriority === filter.priority
      );
    }

    // Apply article type filter if needed
    if (filter.articleType !== 'all') {
      filtered = filtered.filter(work => 
        work.articleType === filter.articleType ||
        work.articleName?.toLowerCase().includes(filter.articleType.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredWork = getFilteredWork();

  const handleSelfAssign = async () => {
    if (!selectedWork) return;

    setLoading(true);
    try {
      // Validate bundle exists before assignment
      if (!selectedWork || !selectedWork.id) {
        throw new Error('No work selected or invalid bundle ID');
      }

      console.log(`🔍 Attempting to assign bundle: ${selectedWork.id} to operator: ${user.id}`);

      // Prevent assignment of sample/demo data
      if (selectedWork.isSample || selectedWork.status === 'sample_demo_only' || selectedWork.id?.startsWith('sample_')) {
        throw new Error(
          isNepali 
            ? "यो नमुना डेटा हो - वास्तविक काम असाइनमेन्टका लागि नयाँ डेटा थप्नुहोस्"
            : "This is sample data - add real work data for actual assignments"
        );
      }

      // Pre-validate work item exists by checking current available work (includes both bundles and WIP items)
      // Skip this validation for now as getAvailableBundles only checks traditional bundles, not WIP items
      // TODO: Implement a unified validation that checks both bundles and WIP work items

      // Self-assign work using appropriate service based on work item type
      let assignResult;
      
      // Check if this is a WIP work item (has wipEntryId) or traditional bundle
      const isWIPWorkItem = selectedWork.wipEntryId || selectedWork.currentOperation;
      console.log(`🔍 Work item check:`, {
        id: selectedWork.id,
        wipEntryId: selectedWork.wipEntryId,
        currentOperation: selectedWork.currentOperation,
        isWIPWorkItem
      });
      
      if (isWIPWorkItem) {
        console.log(`🔄 Self-assigning WIP work item: ${selectedWork.currentOperation} on ${selectedWork.machineType}`);
        assignResult = await WIPService.selfAssignWorkItem(
          selectedWork.id,
          user.id
        );
        console.log(`🔍 WIP self-assignment result:`, assignResult);
      } else {
        console.log(`🔄 Self-assigning traditional bundle: ${selectedWork.id}`);
        // Use atomic self-assignment method to prevent race conditions
        assignResult = await BundleService.selfAssignBundle(
          selectedWork.id,
          user.id
        );
        console.log(`🔍 Atomic self-assignment result:`, assignResult);
      }

      if (!assignResult.success) {
        // Silently handle assignment failure without console errors
        
        // Show brief user-friendly error that disappears in 1 second
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-[100] transition-all transform';
        errorToast.textContent = isNepali 
          ? '❌ काम उपलब्ध छैन' 
          : '❌ Work no longer available';
        document.body.appendChild(errorToast);
        
        // Auto-remove after 1 second
        setTimeout(() => {
          errorToast.style.transform = 'translateX(100%)';
          setTimeout(() => document.body.removeChild(errorToast), 300);
        }, 1000);
        
        // Silently refresh the available work list without throwing
        await loadAvailableWork();
        return;
      }

      console.log(`✅ Successfully assigned bundle ${selectedWork.id} to ${user.id}`);

      // For self-assignments, DO NOT auto-start - leave in 'self_assigned' status for supervisor approval
      console.log(`📋 Self-assignment completed - work item stays in 'self_assigned' status for supervisor approval`);
      
      // Skip auto-starting for self-assignments to allow supervisor approval process

      // Update operator status to 'pending_approval' since work is self-assigned but not started
      try {
        await updateDoc(doc(db, COLLECTIONS.OPERATORS, user.id), {
          status: 'pending_approval',
          currentWork: selectedWork.id,
          currentWorkType: isWIPWorkItem ? 'wip_item' : 'bundle',
          selfAssignedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        console.log(`✅ Operator status updated to 'pending_approval' for self-assignment`);
      } catch (operatorUpdateError) {
        console.warn('⚠️ Failed to update operator status:', operatorUpdateError.message);
      }

      // Report to supervisor
      try {
        await ActivityLogService.logActivity(user.id, 'SELF_ASSIGN_AND_START_WORK', {
          bundleId: selectedWork.id,
          articleNumber: selectedWork.articleNumber,
          articleName: selectedWork.articleName,
          color: selectedWork.color,
          pieces: selectedWork.pieces,
          estimatedTime: selectedWork.estimatedTime,
          machineType: selectedWork.machineType,
          operatorName: user.name,
          assignedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          status: 'working',
          supervisorReported: true
        });

        console.log('✅ Self-assignment and work start reported to supervisor');
      } catch (reportError) {
        console.error('❌ Failed to report to supervisor:', reportError);
      }

      // Send immediate notification to supervisors about self-assignment
      try {
        const supervisorNotification = addNotification({
          title: isNepali ? '🎯 ऑपरेटर सेल्फ-असाइनमेन्ट' : '🎯 Operator Self-Assignment',
          message: isNepali 
            ? `${user.name} ले आर्टिकल ${selectedWork.articleNumber} (${selectedWork.operation}) को काम आफैंलाई असाइन गरे`
            : `${user.name} self-assigned Article ${selectedWork.articleNumber} (${selectedWork.operation})`,
          type: 'supervisor_alert',
          priority: 'high',
          data: {
            operatorId: user.id,
            operatorName: user.name,
            bundleId: selectedWork.id,
            articleNumber: selectedWork.articleNumber,
            operation: selectedWork.operation,
            machineType: selectedWork.machineType,
            pieces: selectedWork.pieces,
            estimatedTime: selectedWork.estimatedTime,
            selfAssignedAt: new Date().toISOString(),
            requiresApproval: true,
            actionType: 'SELF_ASSIGNMENT'
          }
        });

        // Audio notification disabled due to CSP restrictions with data: URLs
        // Visual notifications are sufficient for supervisor alerts

        console.log('✅ Supervisor notification sent for self-assignment');
      } catch (notificationError) {
        console.error('❌ Failed to send supervisor notification:', notificationError);
      }

      showNotification(
        isNepali
          ? `✅ काम सेल्फ-असाइन गरियो! सुपरवाइजर अनुमोदनको पर्खाइमा।`
          : `✅ Work self-assigned! Waiting for supervisor approval.`,
        "success"
      );

      // Update the work item status in the selectedWork object for UI display
      const updatedWorkItem = {
        ...selectedWork,
        status: 'self_assigned',
        assignedOperator: user.id,
        assignedAt: new Date().toISOString(),
        // No startedAt since work hasn't started yet - waiting for approval
      };

      // Send work assignment (NOT started) data to parent component or context
      try {
        // Trigger a custom event to notify other components that work has been self-assigned
        const workAssignedEvent = new CustomEvent('workSelfAssigned', {
          detail: {
            workItem: updatedWorkItem,
            operatorId: user.id,
            operatorName: user.name,
            status: 'pending_approval',
            assignedAt: new Date().toISOString()
          }
        });
        window.dispatchEvent(workAssignedEvent);
        console.log('🔄 Work self-assigned event dispatched - awaiting supervisor approval');
      } catch (eventError) {
        console.warn('⚠️ Failed to dispatch work assigned event:', eventError.message);
      }

      // Reset selection and reload available work
      setSelectedWork(null);
      loadAvailableWork();
    } catch (error) {
      // Silently handle assignment errors to avoid console spam
      
      // Show appropriate error message
      let errorMessage = error.message;
      if (errorMessage.includes('not found')) {
        errorMessage = isNepali 
          ? "यो काम अब उपलब्ध छैन। कृपया अर्को काम छान्नुहोस्।"
          : "This work is no longer available. Please select another task.";
      } else if (errorMessage.includes('already assigned')) {
        errorMessage = isNepali
          ? "यो काम अर्को व्यक्तिले पहिले नै लिएको छ।"
          : "This work has already been taken by another operator.";
      } else if (errorMessage.includes('machine mismatch') || errorMessage.includes('Machine mismatch')) {
        errorMessage = isNepali 
          ? "यो काम तपाईंको मेसिनसँग मेल खाँदैन।"
          : "This work doesn't match your machine type.";
      } else {
        errorMessage = isNepali ? "काम असाइन गर्न समस्या भयो" : "Failed to assign work";
      }
      
      showNotification(errorMessage, "error");
      
      // Refresh work list to show current availability
      setSelectedWork(null);
      loadAvailableWork();
    } finally {
      setLoading(false);
    }
  };

  // Handle work selection with machine type validation
  const handleWorkSelection = (work) => {
    const userMachine = user?.machine || user?.speciality;

    // If user doesn't have machine type set, show warning and open selector
    if (!userMachine) {
      showNotification(
        isNepali ? 'पहिले मेसिन विशेषता सेट गर्नुहोस्' : 'Please set your machine speciality first',
        'warning'
      );
      setShowMachineSelector(true);
      return;
    }

    // Check machine type compatibility
    if (work.machineType && work.machineType !== userMachine) {
      // Check if machines are compatible through aliases
      const machineMatches = {
        'overlock': ['overlock', 'ओभरलक', 'Overlock', 'OVERLOCK'],
        'flatlock': ['flatlock', 'फ्ल्यालक', 'Flatlock', 'FLATLOCK'], 
        'single-needle': ['singleNeedle', 'single_needle', 'एकल सुई', 'Single Needle', 'single-needle', 'SINGLE_NEEDLE'],
        'buttonhole': ['buttonhole', 'बटनहोल', 'Buttonhole', 'BUTTONHOLE'],
        'buttonAttach': ['buttonAttach', 'button_attach', 'बटन जोड्ने', 'Button Attach', 'BUTTON_ATTACH'],
        'iron': ['iron', 'pressing', 'इस्त्री प्रेस', 'Iron Press', 'IRON'],
        'cutting': ['cutting', 'काट्ने मेसिन', 'Cutting Machine', 'CUTTING'],
        'manual': ['manual', 'हस्तकला काम', 'Manual Work', 'MANUAL']
      };

      let isCompatible = false;
      for (const [machineType, aliases] of Object.entries(machineMatches)) {
        const userMachineInAliases = aliases.some(alias => alias.toLowerCase() === userMachine.toLowerCase());
        const workMachineInAliases = aliases.some(alias => alias.toLowerCase() === work.machineType.toLowerCase());
        
        if (userMachineInAliases && workMachineInAliases) {
          isCompatible = true;
          break;
        }
      }

      if (!isCompatible) {
        showNotification(
          isNepali 
            ? `यो काम ${work.machineType} मेसिनका लागि हो, तपाईंको ${userMachine} मेसिनका लागि होइन।` 
            : `This work requires ${work.machineType} machine, not your ${userMachine} speciality.`,
          'error'
        );
        return;
      }
    }

    // If all checks pass, select the work
    setSelectedWork(work);
  };

  // Test function for notification system
  const testNotificationSystem = () => {
    // Test supervisor alert
    addNotification({
      title: isNepali ? '🎯 टेस्ट सुपरवाइजर अलर्ट' : '🎯 Test Supervisor Alert',
      message: isNepali 
        ? 'यो एक टेस्ट सुपरवाइजर नोटिफिकेशन हो - बीप र पुश नोटिफिकेशन सहित'
        : 'This is a test supervisor notification - with beep and push notification',
      type: 'supervisor_alert',
      priority: 'high'
    });

    // Test workflow notification
    setTimeout(() => {
      const mockCompletedWork = {
        operatorName: user?.name || 'Test Operator',
        operation: 'Overlock Side Seam',
        articleNumber: 'TEST123',
        pieces: 30
      };

      const mockNextOperators = [
        { operation: 'Flatlock Shoulder', machineType: 'Flatlock' },
        { operation: 'Button Attach', machineType: 'Button Machine' }
      ];

      sendWorkflowNotification(mockCompletedWork, mockNextOperators);
    }, 1000);

    // Test machine group notification
    setTimeout(() => {
      sendMachineGroupNotification('Overlock', {
        articleNumber: 'TEST456',
        nextOperation: 'Side Seam',
        pieces: 25
      });
    }, 2000);

    showNotification(
      isNepali ? 'टेस्ट नोटिफिकेशन पठाइयो!' : 'Test notifications sent!',
      'success'
    );
  };


  return (
    <div className="max-w-7xl mx-auto p-3 space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-bold text-gray-900">
            🎯 {isNepali ? "काम छनोट" : "Choose Work"}
          </h1>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
            {filteredWork.length}
          </span>
        </div>
        
        {/* Inline Search */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isNepali ? "खोज..." : "Search..."}
              className="w-48 pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center">
              <span className="text-gray-400 text-sm">🔍</span>
            </div>
          </div>
          
          <button
            onClick={loadAvailableWork}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            {loading ? "⏳" : "🔄"}
          </button>
        </div>
      </div>

      {/* Machine Warning - Compact */}
      {!user?.machine && !user?.speciality && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-800">
              ⚠️ {isNepali ? 'मेसिन सेट गर्नुहोस्' : 'Set your machine'}
            </span>
            <button
              onClick={() => setShowMachineSelector(true)}
              className="bg-amber-600 text-white px-3 py-1 rounded text-sm"
            >
              {isNepali ? 'सेट' : 'Set'}
            </button>
          </div>
        </div>
      )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>{isNepali ? "लोड गर्दै..." : "Loading..."}</p>
          </div>
        ) : availableWork.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isNepali ? "कुनै काम छैन" : "No work available"}
            </h3>
          </div>
        ) : filteredWork.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isNepali ? "फेला परेन" : "Not found"}
            </h3>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
            >
              {isNepali ? "सफा" : "Clear"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredWork.map((work, index) => (
              <div
                key={`${work.id || work.bundleId || 'work'}_${index}`}
                className={`bg-white rounded-lg border p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                  selectedWork?.id === work.id
                    ? "ring-2 ring-blue-500 shadow-md bg-blue-50"
                    : ""
                }`}
                onClick={() => handleWorkSelection(work)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {work.operation}
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    #{work.articleNumber}
                  </span>
                </div>

                {/* Key Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {work.lotNumber && `Lot: ${work.lotNumber} • `}{work.size} • {work.color}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {work.pieces} pcs
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      ⚙️ {work.machineType}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {work.estimatedTime}m
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      work.difficulty === 'Easy' || work.difficulty === 'सजिलो' 
                        ? 'bg-green-100 text-green-700' 
                        : work.difficulty === 'Medium' || work.difficulty === 'मध्यम'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {work.difficulty}
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      Rs. {work.rate || 0}
                    </span>
                  </div>
                </div>

                {/* AI Match Score */}
                {work.recommendations && work.recommendations.match > 50 && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-700 font-medium">
                        🎯 {work.recommendations.match}% {isNepali ? "मिल्छ" : "Match"}
                      </span>
                      {work.recommendations.reasons[0] && (
                        <span className="text-xs text-green-600">
                          {work.recommendations.reasons[0]}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Selection Status */}
                {selectedWork?.id === work.id ? (
                  <div className="text-center">
                    <span className="text-sm font-medium text-blue-600">
                      ✓ {isNepali ? "छनोट गरियो" : "Selected"}
                    </span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-xs text-gray-400">
                      {isNepali ? "छनोट गर्न क्लिक" : "Click to select"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confirm Assignment - Fixed Bottom */}
        {selectedWork && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">✅</span>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {selectedWork.operation}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedWork.pieces} pcs • {selectedWork.estimatedTime}m • Rs. {selectedWork.rate}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedWork(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    {isNepali ? "रद्द" : "Cancel"}
                  </button>
                  <button
                    onClick={handleSelfAssign}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isNepali ? "असाइन..." : "Assigning..."}
                      </span>
                    ) : (
                      <span>🎯 {isNepali ? "काम स्वीकार" : "Accept Work"}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modals */}
      {showOperationsEditor && (
        <OperationsSequenceEditor
          onClose={() => setShowOperationsEditor(false)}
        />
      )}

      {showMachineSelector && (
        <MachineSpecialitySelector
          onClose={() => setShowMachineSelector(false)}
          onUpdate={(machineType) => {
            loadAvailableWork();
          }}
        />
      )}
    </div>
  );
};

export default SelfAssignmentSystem;
