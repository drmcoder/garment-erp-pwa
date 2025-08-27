import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';
import { getMachineTypeIcon } from '../../../constants';

const BatchAssignmentInterface = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [batchConfig, setBatchConfig] = useState({
    groupBy: 'machine', // machine, priority, bundle, lot
    assignmentStrategy: 'balanced', // balanced, efficiency, workload
    maxItemsPerOperator: 5,
    considerSkillLevel: true,
    optimizeForDeadlines: false
  });
  
  const [selectedBatches, setSelectedBatches] = useState(new Set());
  const [previewAssignments, setPreviewAssignments] = useState([]);
  
  // Group work items into batches based on configuration
  const workItemBatches = useMemo(() => {
    const batches = {};
    
    workItems.filter(item => item.status === 'ready').forEach(item => {
      let batchKey;
      
      switch (batchConfig.groupBy) {
        case 'machine':
          batchKey = item.machineType;
          break;
        case 'priority':
          batchKey = item.priority;
          break;
        case 'bundle':
          batchKey = `bundle-${item.bundleNumber}`;
          break;
        case 'lot':
          batchKey = item.lotNumber || 'no-lot';
          break;
        default:
          batchKey = 'default';
      }
      
      if (!batches[batchKey]) {
        batches[batchKey] = {
          id: batchKey,
          name: batchKey,
          items: [],
          totalPieces: 0,
          totalTime: 0,
          priority: 'medium',
          machineTypes: new Set()
        };
      }
      
      batches[batchKey].items.push(item);
      batches[batchKey].totalPieces += item.pieces || 0;
      batches[batchKey].totalTime += item.estimatedTime || 0;
      batches[batchKey].machineTypes.add(item.machineType);
      
      // Set batch priority to highest item priority
      const priorities = ['low', 'medium', 'high', 'urgent'];
      const itemPriorityIndex = priorities.indexOf(item.priority);
      const batchPriorityIndex = priorities.indexOf(batches[batchKey].priority);
      
      if (itemPriorityIndex > batchPriorityIndex) {
        batches[batchKey].priority = item.priority;
      }
    });
    
    return Object.values(batches).map(batch => ({
      ...batch,
      machineTypes: Array.from(batch.machineTypes)
    }));
  }, [workItems, batchConfig.groupBy]);

  const generateBatchAssignments = (batch) => {
    const compatibleOperators = operators.filter(op => {
      const machineMatch = batch.machineTypes.some(machine => 
        op.machine === machine || op.machine === 'multi-skill'
      );
      return machineMatch && op.status === 'available';
    });

    if (compatibleOperators.length === 0) return [];

    let sortedOperators;
    
    switch (batchConfig.assignmentStrategy) {
      case 'efficiency':
        sortedOperators = compatibleOperators.sort((a, b) => 
          (b.efficiency || 70) - (a.efficiency || 70)
        );
        break;
      case 'workload':
        sortedOperators = compatibleOperators.sort((a, b) => 
          (a.currentLoad / a.maxLoad) - (b.currentLoad / b.maxLoad)
        );
        break;
      default: // balanced
        sortedOperators = compatibleOperators.sort((a, b) => {
          const aScore = (a.efficiency || 70) - ((a.currentLoad / a.maxLoad) * 30);
          const bScore = (b.efficiency || 70) - ((b.currentLoad / b.maxLoad) * 30);
          return bScore - aScore;
        });
    }

    const assignments = [];
    const itemsPerOperator = Math.min(
      batchConfig.maxItemsPerOperator,
      Math.ceil(batch.items.length / sortedOperators.length)
    );

    let operatorIndex = 0;
    let itemsAssignedToCurrentOp = 0;

    batch.items.forEach(item => {
      if (itemsAssignedToCurrentOp >= itemsPerOperator && operatorIndex < sortedOperators.length - 1) {
        operatorIndex++;
        itemsAssignedToCurrentOp = 0;
      }

      const operator = sortedOperators[operatorIndex];
      if (operator) {
        assignments.push({
          workItemId: item.id,
          operatorId: operator.id,
          workItem: item,
          operator: operator,
          batchId: batch.id,
          assignedAt: new Date(),
          method: 'batch-assignment'
        });
        itemsAssignedToCurrentOp++;
      }
    });

    return assignments;
  };

  const handleBatchToggle = (batchId) => {
    const newSelected = new Set(selectedBatches);
    if (newSelected.has(batchId)) {
      newSelected.delete(batchId);
    } else {
      newSelected.add(batchId);
    }
    setSelectedBatches(newSelected);
  };

  const handlePreviewAssignments = () => {
    const allAssignments = [];
    
    workItemBatches.forEach(batch => {
      if (selectedBatches.has(batch.id)) {
        const batchAssignments = generateBatchAssignments(batch);
        allAssignments.push(...batchAssignments);
      }
    });

    setPreviewAssignments(allAssignments);
  };

  const handleConfirmBatchAssignments = async () => {
    if (previewAssignments.length === 0) {
      addError({
        message: currentLanguage === 'np'
          ? 'पहिले असाइनमेन्ट प्रिव्यू गर्नुहोस्'
          : 'Please preview assignments first',
        component: 'BatchAssignmentInterface',
        action: 'Confirm Validation'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    try {
      const assignments = previewAssignments.map(a => ({
        workItemId: a.workItemId,
        operatorId: a.operatorId,
        assignedAt: a.assignedAt,
        method: a.method
      }));

      await onAssignmentComplete(assignments);
      
      setSelectedBatches(new Set());
      setPreviewAssignments([]);
      
    } catch (error) {
      addError({
        message: 'Failed to confirm batch assignments',
        component: 'BatchAssignmentInterface',
        action: 'Confirm Batch Assignments',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const getBatchColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-red-500 bg-red-50';
      case 'high': return 'border-l-4 border-orange-500 bg-orange-50';
      case 'medium': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-4 border-green-500 bg-green-50';
      default: return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  // Using centralized machine type icons

  return (
    <div className="space-y-6">
      {/* Header and Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              📊 {currentLanguage === 'np' ? 'बैच असाइनमेन्ट इन्टरफेस' : 'Batch Assignment Interface'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'काम आइटमहरूलाई समूहमा बाँडेर इष्टतम असाइनमेन्ट गर्नुहोस्'
                : 'Group work items and create optimized assignments'
              }
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handlePreviewAssignments}
              disabled={selectedBatches.size === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
            >
              <span>👀</span>
              <span>{currentLanguage === 'np' ? 'प्रिव्यू' : 'Preview'}</span>
            </button>
            
            <button
              onClick={handleConfirmBatchAssignments}
              disabled={previewAssignments.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
            >
              <span>✅</span>
              <span>{currentLanguage === 'np' ? 'पुष्टि गर्नुहोस्' : 'Confirm'}</span>
            </button>
          </div>
        </div>

        {/* Batch Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'समूह बनाउने आधार' : 'Group By'}
            </label>
            <select
              value={batchConfig.groupBy}
              onChange={(e) => setBatchConfig({...batchConfig, groupBy: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="machine">{currentLanguage === 'np' ? 'मेसिन प्रकार' : 'Machine Type'}</option>
              <option value="priority">{currentLanguage === 'np' ? 'प्राथमिकता' : 'Priority'}</option>
              <option value="bundle">{currentLanguage === 'np' ? 'बन्डल' : 'Bundle'}</option>
              <option value="lot">{currentLanguage === 'np' ? 'लट' : 'Lot'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'असाइनमेन्ट रणनीति' : 'Assignment Strategy'}
            </label>
            <select
              value={batchConfig.assignmentStrategy}
              onChange={(e) => setBatchConfig({...batchConfig, assignmentStrategy: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="balanced">{currentLanguage === 'np' ? 'संतुलित' : 'Balanced'}</option>
              <option value="efficiency">{currentLanguage === 'np' ? 'दक्षता' : 'Efficiency'}</option>
              <option value="workload">{currentLanguage === 'np' ? 'वर्कलोड' : 'Workload'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'अधिकतम काम/अपरेटर' : 'Max Items/Operator'}
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={batchConfig.maxItemsPerOperator}
              onChange={(e) => setBatchConfig({...batchConfig, maxItemsPerOperator: parseInt(e.target.value)})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'स्किल लेभल' : 'Skill Level'}
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={batchConfig.considerSkillLevel}
                onChange={(e) => setBatchConfig({...batchConfig, considerSkillLevel: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {currentLanguage === 'np' ? 'विचार गर्नुहोस्' : 'Consider'}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'डेडलाइन' : 'Deadlines'}
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={batchConfig.optimizeForDeadlines}
                onChange={(e) => setBatchConfig({...batchConfig, optimizeForDeadlines: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {currentLanguage === 'np' ? 'अनुकूलन गर्नुहोस्' : 'Optimize'}
              </span>
            </label>
          </div>
        </div>

        {/* Batch Selection Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">{selectedBatches.size}</span> {currentLanguage === 'np' ? 'समूह छानिएको' : 'batches selected'} |{' '}
            <span className="font-medium">
              {workItemBatches
                .filter(batch => selectedBatches.has(batch.id))
                .reduce((sum, batch) => sum + batch.items.length, 0)
              }
            </span> {currentLanguage === 'np' ? 'काम आइटम' : 'work items'} |{' '}
            <span className="font-medium">
              {workItemBatches
                .filter(batch => selectedBatches.has(batch.id))
                .reduce((sum, batch) => sum + batch.totalPieces, 0)
              }
            </span> {currentLanguage === 'np' ? 'कुल टुक्रा' : 'total pieces'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Batch Selection */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-gray-800">
            {currentLanguage === 'np' ? 'काम समूहहरू' : 'Work Batches'}
            <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
              {workItemBatches.length}
            </span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {workItemBatches.map((batch) => (
              <div
                key={batch.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedBatches.has(batch.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                } ${getBatchColor(batch.priority)}`}
                onClick={() => handleBatchToggle(batch.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedBatches.has(batch.id)}
                      onChange={() => handleBatchToggle(batch.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-800 capitalize">
                        {batch.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {batch.items.length} {currentLanguage === 'np' ? 'आइटम' : 'items'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                    {batch.priority}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total Pieces:'}</span>
                      <span className="font-medium text-blue-600">{batch.totalPieces}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{currentLanguage === 'np' ? 'अनुमानित समय:' : 'Est. Time:'}</span>
                      <span className="font-medium text-purple-600">{batch.totalTime}min</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600 text-xs mb-1">
                      {currentLanguage === 'np' ? 'मेसिन प्रकार:' : 'Machine Types:'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {batch.machineTypes.map(machine => (
                        <span key={machine} className="text-lg" title={machine}>
                          {getMachineTypeIcon(machine)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">
            {currentLanguage === 'np' ? 'असाइनमेन्ट प्रिव्यू' : 'Assignment Preview'}
            {previewAssignments.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                {previewAssignments.length}
              </span>
            )}
          </h3>
          
          <div className="bg-white rounded-lg shadow-sm p-4 max-h-96 overflow-y-auto">
            {previewAssignments.length > 0 ? (
              <div className="space-y-3">
                {previewAssignments.map((assignment, index) => (
                  <div key={index} className="border border-gray-200 rounded p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{getMachineTypeIcon(assignment.workItem.machineType)}</span>
                        <span className="font-medium">
                          Bundle #{assignment.workItem.bundleNumber}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {assignment.workItem.pieces}pc
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      → {assignment.operator.name} ({assignment.operator.machine})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👀</div>
                <p className="text-sm">
                  {currentLanguage === 'np'
                    ? 'समूह छानेर प्रिव्यू बटन थिच्नुहोस्'
                    : 'Select batches and click Preview'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Assignment Statistics */}
          {previewAssignments.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-3">
                {currentLanguage === 'np' ? 'असाइनमेन्ट तथ्याङ्क' : 'Assignment Stats'}
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {new Set(previewAssignments.map(a => a.operatorId)).size}
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentLanguage === 'np' ? 'अपरेटरहरू' : 'Operators'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(previewAssignments.reduce((sum, a) => sum + a.workItem.pieces, 0) / previewAssignments.length)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentLanguage === 'np' ? 'औसत टुक्रा' : 'Avg Pieces'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchAssignmentInterface;