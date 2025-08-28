// src/components/operator/SelfAssignmentSystem.jsx
// Complete Operator Self-Assignment System with Smart Recommendations

import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { LanguageContext } from "../../context/LanguageContext";
import { NotificationContext } from "../../context/NotificationContext";
import { BundleService, WIPService } from "../../services/firebase-services";
import { db, collection, getDocs, setDoc, doc, updateDoc, COLLECTIONS } from "../../config/firebase";
import OperationsSequenceEditor from '../common/OperationsSequenceEditor';
import MachineSpecialitySelector from './MachineSpecialitySelector';
import { updateBundleWithReadableId, getBundleDisplayName } from '../../utils/bundleIdGenerator';

// Mock operation types for fallback
const mockOperationTypes = [
  { id: 'overlock', english: 'Overlock Stitching', nepali: 'ओभरलक सिलाई', machine: 'Overlock' },
  { id: 'flatlock', english: 'Flatlock Stitching', nepali: 'फ्ल्याटलक सिलाई', machine: 'Flatlock' },
  { id: 'singleNeedle', english: 'Single Needle', nepali: 'एकल सुई', machine: 'Single Needle' },
  { id: 'buttonhole', english: 'Buttonhole', nepali: 'बटनहोल', machine: 'Buttonhole' },
];

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
          setOperationTypes(mockOperationTypes);
          console.log('ℹ️ Using mock operation types - Firestore collection empty');
        }
      } catch (error) {
        console.warn('Failed to load operation types from Firestore, using mock data:', error);
        // Use mock data as fallback instead of localStorage
        setOperationTypes(mockOperationTypes);
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
            const hasValidStatus = bundle.status && ['pending', 'ready', 'assigned', 'waiting'].includes(bundle.status);
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
              recommendations: generateRecommendations(bundle, user)
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

      // Pre-validate bundle exists by checking current available bundles
      const currentBundles = await BundleService.getAvailableBundles();
      if (currentBundles.success) {
        const bundleExists = currentBundles.bundles.some(bundle => bundle.id === selectedWork.id);
        if (!bundleExists) {
          throw new Error(`Bundle ${selectedWork.id} not found in Firestore - it may have been assigned to another operator`);
        }
      }

      // Self-assign work using appropriate service based on work item type
      let assignResult;
      
      // Check if this is a WIP work item (has wipEntryId) or traditional bundle
      const isWIPWorkItem = selectedWork.wipEntryId || selectedWork.currentOperation;
      
      if (isWIPWorkItem) {
        console.log(`🔄 Self-assigning WIP work item: ${selectedWork.currentOperation} on ${selectedWork.machineType}`);
        assignResult = await WIPService.assignWorkItem(
          selectedWork.id,
          user.id,
          user.id, // Self-assignment, so assignedBy is the operator themselves
          'self_assigned' // Set special status for supervisor approval
        );
      } else {
        console.log(`🔄 Self-assigning traditional bundle: ${selectedWork.id}`);
        assignResult = await BundleService.assignBundle(
          selectedWork.id,
          user.id,
          user.id, // Self-assignment, so assignedBy is the operator themselves
          'self_assigned' // Set special status for supervisor approval
        );
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

      // Automatically start the work and update status to 'working'
      try {
        let startResult;
        
        if (isWIPWorkItem) {
          // Start WIP work item - update status to 'in_progress' (working)
          startResult = await WIPService.startWorkItem(selectedWork.id, user.id);
        } else {
          // Start traditional bundle work
          startResult = await BundleService.startWork(selectedWork.id, user.id);
        }

        if (startResult && startResult.success) {
          console.log(`✅ Work automatically started - status updated to 'working'`);
        }
      } catch (startError) {
        console.warn('⚠️ Work assigned but failed to auto-start:', startError.message);
      }

      // Update operator status to 'working' in the operators collection
      try {
        await updateDoc(doc(db, COLLECTIONS.OPERATORS, user.id), {
          status: 'working',
          currentWork: selectedWork.id,
          currentWorkType: isWIPWorkItem ? 'wip_item' : 'bundle',
          workStartedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        console.log(`✅ Operator status updated to 'working'`);
      } catch (operatorUpdateError) {
        console.warn('⚠️ Failed to update operator status:', operatorUpdateError.message);
      }

      // Report to supervisor
      try {
        await BundleService.logActivity(user.id, 'SELF_ASSIGN_AND_START_WORK', {
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

        // Add beep sound for supervisor notification
        if (supervisorNotification && 'Audio' in window) {
          try {
            const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0EJXfH8d2QQAoUXrTp66hVFApGn+DyvmwhBzmN0fLPlC0E');
            beep.volume = 0.3;
            beep.play().catch(() => {}); // Silent fail if audio doesn't work
          } catch (audioError) {
            console.log('Audio notification failed:', audioError.message);
          }
        }

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
        status: isWIPWorkItem ? 'in_progress' : 'in-progress',
        assignedOperator: user.id,
        assignedAt: new Date().toISOString(),
        startedAt: new Date().toISOString()
      };

      // Send work assignment and start data to parent component or context
      try {
        // Trigger a custom event to notify other components that work has started
        const workStartedEvent = new CustomEvent('workStarted', {
          detail: {
            workItem: updatedWorkItem,
            operatorId: user.id,
            operatorName: user.name,
            status: 'working',
            startedAt: new Date().toISOString()
          }
        });
        window.dispatchEvent(workStartedEvent);
        console.log('🔄 Work started event dispatched to update dashboard');
      } catch (eventError) {
        console.warn('⚠️ Failed to dispatch work started event:', eventError.message);
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
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? "🎯 काम छनोट गर्नुहोस्" : "🎯 Choose Your Work"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNepali
                ? "आफ्नो क्षमता अनुसार उपयुक्त काम छनोट गर्नुहोस्"
                : "Choose suitable work based on your skills"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {searchTerm 
                ? (isNepali ? "खोजको परिणाम" : "Search Results")
                : (isNepali ? "उपलब्ध काम" : "Available Work")
              }
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {searchTerm ? filteredWork.length : availableWork.length}
              {searchTerm && (
                <span className="text-sm text-gray-500 ml-1">
                  / {availableWork.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Machine Speciality Warning */}
      {!user?.machine && !user?.speciality && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-amber-800">
                {isNepali ? 'मेसिन विशेषता आवश्यक' : 'Machine Speciality Required'}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {isNepali 
                  ? 'काम सेल्फ-एसाइन गर्न पहिले मेसिन विशेषता सेट गर्नुहोस्। यसले तपाईंलाई सही काम मिलाउन मद्दत गर्नेछ।'
                  : 'Please set your machine speciality first to self-assign work. This helps match you with suitable tasks.'
                }
              </p>
            </div>
            <div className="ml-3">
              <button
                onClick={() => setShowMachineSelector(true)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                {isNepali ? 'सेट गर्नुहोस्' : 'Set Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">
              {isNepali ? "🔍 खोज र फिल्टर" : "🔍 Search & Filter"}
            </h3>

            {/* Search Box */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                {isNepali ? "काम खोज्नुहोस्" : "Search Work"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isNepali 
                    ? "आर्टिकल नम्बर, रङ, साइज खोज्नुहोस्..." 
                    : "Search by article, color, size..."
                  }
                  className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="mt-2 text-sm text-blue-600">
                  {isNepali 
                    ? `"${searchTerm}" खोजिँदै - ${filteredWork.length} परिणामहरू`
                    : `Searching "${searchTerm}" - ${filteredWork.length} results`
                  }
                </div>
              )}
            </div>

            {/* Machine Section Header */}
            <h4 className="text-md font-semibold mb-3 text-gray-700">
              {isNepali ? "🔧 तपाईंको मेसिन" : "🔧 Your Machine"}
            </h4>

            {/* Assigned Machine Display */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isNepali ? "तपाईंको मेसिन" : "Your Assigned Machine"}
              </label>
              <div className={`w-full p-3 border rounded-md font-medium ${
                user?.machine || user?.assignedMachines?.[0] 
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-orange-50 border-orange-200 text-orange-800'
              }`}>
                🔧 {user?.machine || user?.assignedMachines?.[0] || 'Default (Overlock)'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isNepali 
                  ? (user?.machine || user?.assignedMachines?.[0] 
                      ? "तपाईंको मेसिनका कामहरू देखाउँदै"
                      : "कुनै मेसिन असाइन नभएको, डिफल्ट देखाउँदै"
                    )
                  : (user?.machine || user?.assignedMachines?.[0]
                      ? "Showing work for your assigned machine"
                      : "No machine assigned, showing default work"
                    )
                }
              </p>
            </div>

            {/* Priority Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isNepali ? "प्राथमिकता" : "Priority"}
              </label>
              <select
                value={filter.priority}
                onChange={(e) =>
                  setFilter({ ...filter, priority: e.target.value })
                }
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  {isNepali ? "सबै प्राथमिकता" : "All Priorities"}
                </option>
                <option value="उच्च">
                  {isNepali ? "उच्च प्राथमिकता" : "High Priority"}
                </option>
                <option value="सामान्य">
                  {isNepali ? "सामान्य प्राथमिकता" : "Normal Priority"}
                </option>
                <option value="कम">
                  {isNepali ? "कम प्राथमिकता" : "Low Priority"}
                </option>
              </select>
            </div>

            {/* Quick Operation Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isNepali ? "मेरो विशेषता" : "My Specialty"}
              </label>
              <div className="space-y-2">
                {operationTypes.slice(0, 4).map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setFilter({ ...filter, operation: op.id })}
                    className="w-full text-left p-2 text-sm rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {isNepali ? op.nepali : op.english}
                    <span className="text-xs text-gray-500 block">
                      {op.machine}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadAvailableWork}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isNepali ? "लोड गर्दै..." : "Loading..."}
                </div>
              ) : isNepali ? (
                "🔄 नयाँ काम खोज्नुहोस्"
              ) : (
                "🔄 Refresh Work"
              )}
            </button>

            {/* Firestore Data Only Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <div className="flex items-center space-x-2 text-blue-700">
                <span>🔥</span>
                <span className="font-semibold">
                  {isNepali ? "फायरस्टोर डाटा मात्र" : "Firestore Data Only"}
                </span>
              </div>
              <p className="text-blue-600 mt-1">
                {isNepali 
                  ? "सिस्टमले अब केवल फायरस्टोर बाट डाटा लिन्छ। व्यवस्थापकले कामको डाटा सेटअप गर्नुपर्छ।" 
                  : "System now uses only Firestore data. Admin needs to setup work data."}
              </p>
            </div>


            {/* Test Notification System Button */}
            <button
              onClick={testNotificationSystem}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors mb-2"
            >
              🔔 {isNepali ? "नोटिफिकेशन टेस्ट गर्नुहोस्" : "Test Notifications"}
            </button>

            {/* Operations Sequence Editor Button */}
            <button
              onClick={() => setShowOperationsEditor(true)}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              ⚙️ {isNepali ? "सञ्चालन क्रम सम्पादन" : "Edit Operations Sequence"}
            </button>
          </div>
        </div>

        {/* Available Work List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>{isNepali ? "काम लोड गर्दै..." : "Loading work..."}</p>
              </div>
            ) : availableWork.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isNepali ? "कुनै काम उपलब्ध छैन" : "No work available"}
                </h3>
                <p className="text-gray-500">
                  {isNepali
                    ? "फिल्टर परिवर्तन गर्नुहोस् वा पछि प्रयास गर्नुहोस्"
                    : "Try changing filters or check back later"}
                </p>
              </div>
            ) : filteredWork.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isNepali ? "खोजको परिणाम फेला परेन" : "No search results found"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {isNepali
                    ? `"${searchTerm}" सँग मिल्ने काम फेला परेन`
                    : `No work found matching "${searchTerm}"`}
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {isNepali ? "खोज सफा गर्नुहोस्" : "Clear Search"}
                </button>
              </div>
            ) : (
              filteredWork.map((work, index) => (
                <div
                  key={`${work.id || work.bundleId || 'work'}_${index}`}
                  className={`bg-white rounded-lg border p-6 transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedWork?.id === work.id
                      ? "ring-2 ring-blue-500 shadow-md"
                      : ""
                  }`}
                  onClick={() => handleWorkSelection(work)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {/* Main Work Info */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {isNepali ? work.operation : work.englishOperation}
                          </h3>
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                            {work.readableId || `#${work.articleNumber}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Lot #{work.articleNumber}</span>
                          <span>•</span>
                          <span>{work.size} Size</span>
                          <span>•</span>
                          <span>{work.color}</span>
                          <span>•</span>
                          <span className="font-medium text-gray-900">{work.pieces} pcs</span>
                        </div>
                      </div>

                      {/* Work Status and Details */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            work.difficulty === 'Easy' || work.difficulty === 'सजिलो' 
                              ? 'bg-green-100 text-green-700' 
                              : work.difficulty === 'Medium' || work.difficulty === 'मध्यम'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            💪 {isNepali ? work.difficulty : work.englishDifficulty}
                          </div>
                          <div className="text-gray-600">
                            ⚙️ {isNepali ? work.machineType : work.englishMachine}
                          </div>
                        </div>
                        <div className="text-gray-600">
                          💰 Rs. {work.rate || 0}
                        </div>
                      </div>
                    </div>

                    {/* Time Display */}
                    <div className="ml-4 text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {work.estimatedTime} {isNepali ? "मिनेट" : "min"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isNepali ? "अनुमानित समय" : "Estimated Time"}
                      </div>
                    </div>
                  </div>

                  {/* Work Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">⏱️</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "समय:" : "Time:"}
                        </div>
                        <div className="font-semibold">
                          {work.estimatedTime} {isNepali ? "मिनेट" : "min"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">📦</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "टुक्राहरू:" : "Pieces:"}
                        </div>
                        <div className="font-semibold">
                          {work.pieces || work.quantity || 0} {isNepali ? "पीस" : "pcs"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-600">⚙️</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "अपरेसन:" : "Operation:"}
                        </div>
                        <div className="font-semibold">
                          {work.operation || work.operationName || (isNepali ? "सिलाई" : "Sewing")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600">💪</span>
                      <div>
                        <div className="text-gray-500">
                          {isNepali ? "कठिनाई:" : "Difficulty:"}
                        </div>
                        <div className="font-semibold">
                          {isNepali ? work.difficulty : work.englishDifficulty}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Work History */}
                  {(work.lastWorker || work.lastAction || work.lastActionDate) && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">
                        {isNepali ? "अन्तिम कार्य:" : "Last Activity:"}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">
                            {work.lastWorker || (isNepali ? "नयाँ काम" : "New Work")}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {work.lastAction || (isNepali ? "तोकिएको छैन" : "Not assigned yet")}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          {work.lastActionDate ? 
                            new Date(work.lastActionDate.seconds * 1000).toLocaleDateString() : 
                            (work.createdAt ? new Date(work.createdAt.seconds * 1000).toLocaleDateString() : '')
                          }
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-gray-50 rounded-md p-3 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {isNepali ? "🤖 AI सुझाव:" : "🤖 AI Recommendations:"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {work.recommendations && work.recommendations.reasons && work.recommendations.reasons.map((reason, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {isNepali
                        ? "क्लिक गरेर छनोट गर्नुहोस्"
                        : "Click to select this work"}
                    </div>
                    {selectedWork?.id === work.id && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <span className="text-sm font-medium">
                          {isNepali ? "छनोट गरिएको" : "Selected"}
                        </span>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Confirm Assignment Button */}
          {selectedWork && (
            <div className="mt-6 bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {isNepali
                      ? "✅ काम पुष्टि गर्नुहोस्"
                      : "✅ Confirm Work Assignment"}
                  </h3>
                  <p className="text-gray-600">
                    {isNepali
                      ? `${selectedWork.articleName} - ${selectedWork.operation}`
                      : `${selectedWork.englishName} - ${selectedWork.englishOperation}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {isNepali ? "अनुमानित समय" : "Estimated Time"}
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {selectedWork.estimatedTime} {isNepali ? "मिनेट" : "min"}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleSelfAssign}
                  disabled={loading || selectedWork?.isSample || selectedWork?.status === 'sample_demo_only' || selectedWork?.id?.startsWith('sample_')}
                  className={`flex-1 py-3 px-6 rounded-md transition-colors font-medium ${
                    selectedWork?.isSample || selectedWork?.status === 'sample_demo_only' || selectedWork?.id?.startsWith('sample_')
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isNepali ? "असाइन गर्दै..." : "Assigning..."}
                    </div>
                  ) : selectedWork?.isSample || selectedWork?.status === 'sample_demo_only' || selectedWork?.id?.startsWith('sample_') ? (
                    isNepali ? "📋 नमुना डेटा मात्र" : "📋 Sample Data Only"
                  ) : isNepali ? (
                    "🎯 काम स्वीकार गर्नुहोस्"
                  ) : (
                    "🎯 Accept This Work"
                  )}
                </button>
                <button
                  onClick={() => setSelectedWork(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {isNepali ? "रद्द गर्नुहोस्" : "Cancel"}
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                💡{" "}
                {isNepali
                  ? "टिप: यो काम स्वीकार गरेपछि तुरुन्त तपाईंको कामको सूचीमा थपिनेछ।"
                  : "Tip: After accepting this work, it will be immediately added to your work queue."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operations Sequence Editor Modal */}
      {showOperationsEditor && (
        <OperationsSequenceEditor
          onClose={() => setShowOperationsEditor(false)}
        />
      )}

      {/* Machine Speciality Selector Modal */}
      {showMachineSelector && (
        <MachineSpecialitySelector
          onClose={() => setShowMachineSelector(false)}
          onUpdate={(machineType) => {
            // Refresh available work after machine type is set
            loadAvailableWork();
          }}
        />
      )}
    </div>
  );
};

export default SelfAssignmentSystem;
