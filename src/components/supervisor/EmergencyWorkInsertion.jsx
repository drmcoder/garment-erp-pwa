// src/components/supervisor/EmergencyWorkInsertion.jsx
// Emergency Work Insertion System for Production Disruption Scenarios

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { WIPService, LegacyBundleService as BundleService, OperatorService, NotificationService } from '../../services/firebase-services-clean';
import { WorkflowAnalyticsService } from '../../services/WorkflowAnalyticsService';

const EmergencyWorkInsertion = ({ lotNumber, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [formData, setFormData] = useState({
    operationType: '',
    operationName: '',
    operationNameNp: '',
    machineType: '',
    insertionPoint: 'after_current', // 'after_current', 'before_next', 'parallel'
    priority: 'emergency',
    estimatedTime: 30,
    skillRequirements: [],
    reason: '',
    affectedOperations: [],
    // New fields for batch integration and pricing
    selectedBatch: '',
    ratePerOperation: 0,
    totalCost: 0,
    quantity: 1,
    splitIntoWorkItems: 1
  });

  const [availableOperations, setAvailableOperations] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState([]);
  const [suggestedOperators, setSuggestedOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // New state for batch integration
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Common emergency operations that get added frequently
  const emergencyOperationTypes = [
    {
      id: 'top_stitch_pocket',
      english: 'Top Stitch on Pocket',
      nepali: 'पकेटमा माथिल्लो स्टिच',
      machine: 'single-needle',
      estimatedTime: 15,
      skills: ['precision_stitching', 'pocket_work']
    },
    {
      id: 'reinforcement_stitch',
      english: 'Reinforcement Stitching',
      nepali: 'बलियो बनाउने स्टिच',
      machine: 'overlock',
      estimatedTime: 10,
      skills: ['reinforcement', 'stress_points']
    },
    {
      id: 'quality_fix',
      english: 'Quality Issue Fix',
      nepali: 'गुणस्तर सुधार',
      machine: 'manual',
      estimatedTime: 20,
      skills: ['quality_control', 'hand_work']
    },
    {
      id: 'additional_buttonhole',
      english: 'Additional Buttonhole',
      nepali: 'थप बटनहोल',
      machine: 'buttonhole',
      estimatedTime: 5,
      skills: ['buttonhole_precision']
    },
    {
      id: 'edge_finishing',
      english: 'Edge Finishing',
      nepali: 'किनारा सिकाउने',
      machine: 'overlock',
      estimatedTime: 12,
      skills: ['edge_work', 'finishing']
    }
  ];

  const insertionPoints = [
    { id: 'after_current', english: 'After Current Operation', nepali: 'हालको काम पछि' },
    { id: 'before_next', english: 'Before Next Scheduled', nepali: 'अर्को काम अगाडि' },
    { id: 'parallel', english: 'Parallel (Independent)', nepali: 'छुट्टै (स्वतन्त्र)' }
  ];

  const priorityLevels = [
    { id: 'emergency', english: 'Emergency', nepali: 'आपातकालीन', color: 'red' },
    { id: 'high', english: 'High Priority', nepali: 'उच्च प्राथमिकता', color: 'orange' },
    { id: 'medium', english: 'Medium', nepali: 'मध्यम', color: 'yellow' }
  ];

  // Load current workflow for the lot
  useEffect(() => {
    const loadCurrentWorkflow = async () => {
      try {
        const workItems = await WIPService.getWorkItemsForLot(lotNumber);
        if (workItems.success) {
          setCurrentWorkflow(workItems.workItems);
        }
      } catch (error) {
        console.error('Failed to load current workflow:', error);
      }
    };

    if (lotNumber) {
      loadCurrentWorkflow();
    }
  }, [lotNumber]);

  // Load available batches from WIP entries
  useEffect(() => {
    const loadAvailableBatches = async () => {
      setLoadingBatches(true);
      try {
        const wipData = await WIPService.getAllWIPEntries();
        if (wipData.success) {
          // Extract batches/lots from WIP entries
          const batches = wipData.wipEntries.map(wip => ({
            id: wip.id,
            lotNumber: wip.lotNumber,
            fabricName: wip.fabricName,
            totalPieces: wip.totalPieces,
            status: wip.status,
            parsedStyles: wip.parsedStyles || []
          }));
          setAvailableBatches(batches);
          
          // Auto-select current lot if available
          const currentBatch = batches.find(b => b.lotNumber === lotNumber);
          if (currentBatch) {
            setFormData(prev => ({ ...prev, selectedBatch: currentBatch.id }));
          }
        }
      } catch (error) {
        console.error('Failed to load available batches:', error);
      } finally {
        setLoadingBatches(false);
      }
    };

    loadAvailableBatches();
  }, [lotNumber]);

  // Auto-suggest operators when machine type changes
  useEffect(() => {
    const suggestOperators = async () => {
      if (!formData.machineType) return;

      try {
        const operators = await OperatorService.getOperatorsByMachine(formData.machineType);
        if (operators.success) {
          // Score operators based on availability and skills
          const scored = operators.operators.map(op => ({
            ...op,
            score: calculateOperatorScore(op, formData)
          })).sort((a, b) => b.score - a.score);

          setSuggestedOperators(scored.slice(0, 3)); // Top 3 suggestions
        }
      } catch (error) {
        console.error('Failed to suggest operators:', error);
      }
    };

    suggestOperators();
  }, [formData.machineType, formData.skillRequirements]);

  // Calculate total cost when rate or quantity changes
  useEffect(() => {
    const totalCost = (formData.ratePerOperation * formData.quantity).toFixed(2);
    setFormData(prev => ({ ...prev, totalCost: parseFloat(totalCost) }));
  }, [formData.ratePerOperation, formData.quantity]);

  const calculateOperatorScore = (operator, workRequirements) => {
    let score = 50; // Base score

    // Availability bonus
    if (operator.status === 'available') score += 30;
    else if (operator.status === 'finishing_work') score += 20;
    else if (operator.status === 'working') score += 10;

    // Machine match bonus
    if (operator.machine === workRequirements.machineType) score += 20;

    // Skill match bonus
    if (operator.skills && workRequirements.skillRequirements.length > 0) {
      const matchingSkills = workRequirements.skillRequirements.filter(skill =>
        operator.skills.includes(skill)
      );
      score += (matchingSkills.length / workRequirements.skillRequirements.length) * 15;
    }

    // Experience bonus (if available)
    if (operator.experienceLevel === 'expert') score += 10;
    else if (operator.experienceLevel === 'intermediate') score += 5;

    return Math.min(score, 100);
  };

  const handleOperationTypeSelect = (operation) => {
    setFormData({
      ...formData,
      operationType: operation.id,
      operationName: operation.english,
      operationNameNp: operation.nepali,
      machineType: operation.machine,
      estimatedTime: operation.estimatedTime,
      skillRequirements: operation.skills || [],
      // Set default rate based on operation complexity
      ratePerOperation: operation.id === 'top_stitch_pocket' ? 3.5 : 
                       operation.id === 'quality_fix' ? 5.0 :
                       operation.id === 'additional_buttonhole' ? 2.0 :
                       operation.id === 'reinforcement_stitch' ? 2.5 : 3.0
    });
  };

  const handleInsertWork = async () => {
    if (!formData.operationType || !formData.machineType || !formData.selectedBatch) {
      showNotification(
        isNepali ? 'सबै आवश्यक जानकारी भर्नुहोस्' : 'Please fill all required fields',
        'error'
      );
      return;
    }
    
    if (formData.ratePerOperation <= 0) {
      showNotification(
        isNepali ? 'कृपया वैध दर प्रविष्ट गर्नुहोस्' : 'Please enter a valid rate',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      // Phase 1: Create multiple emergency work items based on split
      const piecesPerWorkItem = Math.floor(formData.quantity / formData.splitIntoWorkItems);
      const remainingPieces = formData.quantity % formData.splitIntoWorkItems;
      
      const workItemResults = [];
      
      for (let i = 0; i < formData.splitIntoWorkItems; i++) {
        const workItemQuantity = i === formData.splitIntoWorkItems - 1 ? 
          piecesPerWorkItem + remainingPieces : piecesPerWorkItem;
        
        const emergencyWorkItem = {
          lotNumber: lotNumber,
          operation: formData.operationName,
          operationNp: formData.operationNameNp,
          machineType: formData.machineType,
          status: 'ready',
          priority: formData.priority,
          estimatedTime: formData.estimatedTime,
          insertionPoint: formData.insertionPoint,
          reason: formData.reason,
          skillRequirements: formData.skillRequirements,
          insertedBy: user.id,
          insertedAt: new Date().toISOString(),
          requiresApproval: formData.priority === 'emergency' ? false : true,
          affectedOperations: formData.affectedOperations,
          workflowDisruption: true,
          // Batch and pricing fields for this work item
          batchId: formData.selectedBatch,
          quantity: workItemQuantity,
          pieces: workItemQuantity, // Add pieces field for clarity
          ratePerOperation: formData.ratePerOperation,
          totalCost: (formData.ratePerOperation * workItemQuantity).toFixed(2),
          pricing: {
            rate: formData.ratePerOperation,
            quantity: workItemQuantity,
            total: (formData.ratePerOperation * workItemQuantity).toFixed(2),
            currency: 'NPR'
          },
          // Split tracking
          splitIndex: i + 1,
          totalSplits: formData.splitIntoWorkItems,
          originalQuantity: formData.quantity
        };

        // Insert each work item
        const result = await WIPService.insertEmergencyWorkItem(emergencyWorkItem);
        workItemResults.push(result);
        
        if (!result.success) {
          throw new Error(result.error || `Failed to insert emergency work item ${i + 1}`);
        }
      }
      
      // Check if all work items were created successfully
      const failedItems = workItemResults.filter(r => !r.success);
      if (failedItems.length > 0) {
        throw new Error(`Failed to create ${failedItems.length} work items`);
      }

      // Phase 2: Pause downstream assignments for this lot (optional)
      if (formData.insertionPoint !== 'parallel' && workItemResults.length > 0) {
        await WIPService.pauseDownstreamAssignments(lotNumber, workItemResults[0].workItemId);
      }

      // Phase 3: Emergency work items created - ready for manual assignment
      console.log(`✅ Created ${formData.splitIntoWorkItems} emergency work items for lot ${lotNumber}`);

      // Notify other supervisors about workflow disruption
      await NotificationService.createNotification({
        title: "उत्पादन कार्यप्रवाह परिवर्तन",
        titleEn: "Production Workflow Changed",
        message: `${user.name} ले लट ${lotNumber} मा ${formData.operationName} थप्यो`,
        messageEn: `${user.name} added ${formData.operationName} to Lot ${lotNumber}`,
        type: "workflow_change",
        priority: "high",
        targetRole: "supervisor",
        lotNumber: lotNumber,
        insertedOperation: formData.operationName,
        insertedBy: user.name
      });

      // Phase 3: Track insertion for analytics and template learning
      try {
        await WorkflowAnalyticsService.trackEmergencyInsertion({
          lotNumber: lotNumber,
          operationType: formData.operationType,
          operationName: formData.operationName,
          machineType: formData.machineType,
          insertionPoint: formData.insertionPoint,
          reason: formData.reason,
          estimatedTime: formData.estimatedTime,
          insertedBy: user.id,
          priority: formData.priority,
          garmentType: 'generic', // Could be enhanced to detect from lot
          styleNumber: null
        });
        console.log('📊 Emergency insertion tracked for analytics');
      } catch (analyticsError) {
        console.warn('Failed to track analytics, but insertion succeeded:', analyticsError);
      }

      showNotification(
        isNepali 
          ? `✅ ${formData.splitIntoWorkItems} वटा आपातकालीन काम सफलतापूर्वक सिर्जना भयो`
          : `✅ ${formData.splitIntoWorkItems} emergency work items created successfully`,
        'success'
      );

      onSuccess && onSuccess(workItemResults.map(r => r.workItemId));
      onClose();

    } catch (error) {
      console.error('Failed to insert emergency work:', error);
      showNotification(
        isNepali ? 'आपातकालीन काम थप्न समस्या भयो' : 'Failed to insert emergency work',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-red-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              🚨 {isNepali ? 'आपातकालीन काम थप्नुहोस्' : 'Insert Emergency Work'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-red-100 mt-1">
            {isNepali ? `लट नम्बर: ${lotNumber}` : `Lot Number: ${lotNumber}`}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Operation Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {isNepali ? 'आपातकालीन काम प्रकार' : 'Emergency Operation Type'} *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emergencyOperationTypes.map(operation => (
                <div
                  key={operation.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.operationType === operation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleOperationTypeSelect(operation)}
                >
                  <div className="font-medium text-gray-900">
                    {isNepali ? operation.nepali : operation.english}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    ⚙️ {operation.machine} • ⏱️ {operation.estimatedTime}m
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Operation Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isNepali ? 'कस्टम काम (अंग्रेजी)' : 'Custom Operation (English)'}
              </label>
              <input
                type="text"
                value={formData.operationName}
                onChange={(e) => setFormData({...formData, operationName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., Extra buttonhole, Top stitch"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isNepali ? 'कस्टम काम (नेपाली)' : 'Custom Operation (Nepali)'}
              </label>
              <input
                type="text"
                value={formData.operationNameNp}
                onChange={(e) => setFormData({...formData, operationNameNp: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="जस्तै: थप बटनहोल, माथिल्लो स्टिच"
              />
            </div>
          </div>

          {/* Machine Type and Timing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isNepali ? 'मेसिन प्रकार' : 'Machine Type'} *
              </label>
              <select
                value={formData.machineType}
                onChange={(e) => setFormData({...formData, machineType: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">{isNepali ? 'छान्नुहोस्' : 'Select'}</option>
                <option value="overlock">Overlock</option>
                <option value="flatlock">Flatlock</option>
                <option value="single-needle">Single Needle</option>
                <option value="buttonhole">Buttonhole</option>
                <option value="manual">Manual Work</option>
                <option value="iron">Iron/Press</option>
                <option value="cutting">Cutting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isNepali ? 'अनुमानित समय (मिनेट)' : 'Estimated Time (minutes)'}
              </label>
              <input
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({...formData, estimatedTime: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="1"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isNepali ? 'प्राथमिकता' : 'Priority'}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {priorityLevels.map(level => (
                  <option key={level.id} value={level.id}>
                    {isNepali ? level.nepali : level.english}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch Selection and Pricing */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-3">
              {isNepali ? 'ब्याच र मूल्य निर्धारण' : 'Batch & Pricing'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'ब्याच छान्नुहोस्' : 'Select Batch'} *
                </label>
                <select
                  value={formData.selectedBatch}
                  onChange={(e) => setFormData({...formData, selectedBatch: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  disabled={loadingBatches}
                >
                  <option value="">{loadingBatches ? 'Loading...' : (isNepali ? 'छान्नुहोस्' : 'Select')}</option>
                  {availableBatches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.lotNumber} - {batch.fabricName} ({batch.totalPieces} pieces)
                    </option>
                  ))}
                </select>
                {loadingBatches && (
                  <div className="text-xs text-gray-500 mt-1">
                    {isNepali ? 'ब्याच लोड गर्दै...' : 'Loading batches...'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'परिमाण' : 'Quantity'}
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'कति वटा काम बनाउने' : 'Split into Work Items'}
                </label>
                <input
                  type="number"
                  value={formData.splitIntoWorkItems}
                  onChange={(e) => setFormData({...formData, splitIntoWorkItems: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="1"
                  max={formData.quantity}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isNepali ? 
                    `${Math.floor(formData.quantity / formData.splitIntoWorkItems)} पिस प्रति काम` : 
                    `${Math.floor(formData.quantity / formData.splitIntoWorkItems)} pieces per work item`
                  }
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'प्रति ओपरेसन दर (रुपैयाँ)' : 'Rate per Operation (Rs.)'}
                </label>
                <input
                  type="number"
                  step="0.50"
                  value={formData.ratePerOperation}
                  onChange={(e) => setFormData({...formData, ratePerOperation: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'कुल लागत (रुपैयाँ)' : 'Total Cost (Rs.)'}
                </label>
                <input
                  type="text"
                  value={`Rs. ${formData.totalCost.toFixed(2)}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  readOnly
                />
              </div>
            </div>
            
            {formData.totalCost > 0 && (
              <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                💰 {isNepali ? `कुल लागत: रु. ${formData.totalCost.toFixed(2)} (${formData.quantity} × रु. ${formData.ratePerOperation.toFixed(2)})` 
                              : `Total Cost: Rs. ${formData.totalCost.toFixed(2)} (${formData.quantity} × Rs. ${formData.ratePerOperation.toFixed(2)})`}
              </div>
            )}
          </div>

          {/* Insertion Point */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {isNepali ? 'कहाँ राख्ने' : 'Insertion Point'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insertionPoints.map(point => (
                <div
                  key={point.id}
                  className={`p-3 border rounded-lg cursor-pointer text-center ${
                    formData.insertionPoint === point.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({...formData, insertionPoint: point.id})}
                >
                  <div className="font-medium">
                    {isNepali ? point.nepali : point.english}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Operators */}
          {suggestedOperators.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🎯 {isNepali ? 'सुझावित ऑपरेटरहरू' : 'Suggested Operators'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestedOperators.map(operator => (
                  <div
                    key={operator.id}
                    className="p-3 border border-green-200 bg-green-50 rounded-lg"
                  >
                    <div className="font-medium text-green-800">{operator.name}</div>
                    <div className="text-sm text-green-600">
                      {operator.machine} • {operator.status}
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      {operator.score}% {isNepali ? 'मिल्छ' : 'match'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'कारण वर्णन' : 'Reason for Insertion'}
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
              placeholder={isNepali ? 'यो काम किन आवश्यक छ?' : 'Why is this work necessary?'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              ⚠️ {isNepali 
                ? 'आपातकालीन काम तुरुन्त असाइन हुनेछ' 
                : 'Emergency work will be assigned immediately'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {isNepali ? 'रद्द' : 'Cancel'}
              </button>
              <button
                onClick={handleInsertWork}
                disabled={loading || !formData.operationType}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isNepali ? 'थप्दै...' : 'Inserting...'}
                  </span>
                ) : (
                  `🚨 ${isNepali ? 'आपातकालीन काम थप्नुहोस्' : 'Insert Emergency Work'}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyWorkInsertion;