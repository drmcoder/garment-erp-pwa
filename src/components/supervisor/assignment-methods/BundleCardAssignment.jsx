import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';
import { getMachineTypeIcon } from '../../../constants';
import OperatorAvatar from '../../common/OperatorAvatar';

const BundleCardAssignment = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [filterMachine, setFilterMachine] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const handleItemToggle = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    const filteredIds = getFilteredItems().map(item => item.id);
    setSelectedItems(new Set(filteredIds));
  };

  const handleClearAll = () => {
    setSelectedItems(new Set());
  };

  const getFilteredItems = () => {
    if (!workItems || !Array.isArray(workItems)) return [];
    
    return workItems.filter(item => {
      if (!item) return false;
      const machineMatch = filterMachine === 'all' || item.machineType === filterMachine;
      const priorityMatch = filterPriority === 'all' || item.priority === filterPriority;
      return machineMatch && priorityMatch && item.status === 'ready';
    });
  };

  const getCompatibleOperators = () => {
    if (!operators || !Array.isArray(operators)) return [];
    if (selectedItems.size === 0) return operators;
    
    if (!workItems || !Array.isArray(workItems)) return operators;
    
    const selectedWorkItems = workItems.filter(item => item && selectedItems.has(item.id));
    const machineTypes = [...new Set(selectedWorkItems.map(item => item.machineType).filter(Boolean))];
    
    if (machineTypes.length === 1) {
      return operators.filter(op => op && op.machine === machineTypes[0]);
    }
    return operators.filter(op => op && op.machine === 'multi-skill');
  };

  const handleAssign = async () => {
    if (selectedItems.size === 0 || !selectedOperator) {
      addError({
        message: currentLanguage === 'np' 
          ? 'कृपया काम र अपरेटर दुबै छान्नुहोस्'
          : 'Please select both work items and operator',
        component: 'BundleCardAssignment',
        action: 'Assign Validation'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      return;
    }

    try {
      const assignments = Array.from(selectedItems).map(itemId => ({
        workItemId: itemId,
        operatorId: selectedOperator.id,
        assignedAt: new Date(),
        method: 'bundle-card-checklist'
      }));

      await onAssignmentComplete(assignments);
      
      // Clear selections
      setSelectedItems(new Set());
      setSelectedOperator(null);
      
    } catch (error) {
      addError({
        message: 'Failed to assign work items',
        component: 'BundleCardAssignment',
        action: 'Assign Work',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Using centralized machine type icons

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            📋 {currentLanguage === 'np' ? 'बन्डल कार्ड चेकलिस्ट असाइनमेन्ट' : 'Bundle Card Checklist Assignment'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {currentLanguage === 'np' ? 'सबै छान्नुहोस्' : 'Select All'}
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {currentLanguage === 'np' ? 'सफा गर्नुहोस्' : 'Clear All'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-4">
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="all">{currentLanguage === 'np' ? 'सबै मेसिन' : 'All Machines'}</option>
            <option value="single-needle">{currentLanguage === 'np' ? 'सिंगल नीडल' : 'Single Needle'}</option>
            <option value="overlock">{currentLanguage === 'np' ? 'ओभरलक' : 'Overlock'}</option>
            <option value="flatlock">{currentLanguage === 'np' ? 'फ्ल्यालक' : 'Flatlock'}</option>
            <option value="buttonhole">{currentLanguage === 'np' ? 'बटनहोल' : 'Buttonhole'}</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="all">{currentLanguage === 'np' ? 'सबै प्राथमिकता' : 'All Priorities'}</option>
            <option value="urgent">{currentLanguage === 'np' ? 'जरुरी' : 'Urgent'}</option>
            <option value="high">{currentLanguage === 'np' ? 'उच्च' : 'High'}</option>
            <option value="medium">{currentLanguage === 'np' ? 'मध्यम' : 'Medium'}</option>
            <option value="low">{currentLanguage === 'np' ? 'न्यून' : 'Low'}</option>
          </select>
        </div>

        {/* Selection Summary */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            <span className="font-medium">{selectedItems.size}</span> {currentLanguage === 'np' ? 'वटा काम छानिएको' : 'items selected'}
            {selectedOperator && (
              <>
                {' → '}
                <span className="font-medium">{selectedOperator.name}</span>
                {' '}({selectedOperator.machine})
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Items Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-gray-800">
            {currentLanguage === 'np' ? 'उपलब्ध काम' : 'Available Work Items'}
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getFilteredItems().map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedItems.has(item.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleItemToggle(item.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleItemToggle(item.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
                        <span className="font-medium text-gray-800">
                          Bundle #{item.bundleNumber}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>📦 {item.articleName} - {item.size}</div>
                        <div>🔢 {item.pieces} pieces | ⏱️ {item.estimatedTime}min</div>
                        <div>🏷️ {item.operation}</div>
                        <div>🎨 {item.color}</div>
                        <div>📋 Article: {item.article}</div>
                        <div>🏭 Lot: {item.lotNumber}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total Pieces:'}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {item.pieces}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operator Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">
            {currentLanguage === 'np' ? 'अपरेटर छान्नुहोस्' : 'Select Operator'}
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getCompatibleOperators().map((operator) => (
              <div
                key={operator.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  selectedOperator?.id === operator.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedOperator(operator)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={selectedOperator?.id === operator.id}
                    onChange={() => setSelectedOperator(operator)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  
                  {/* Enhanced operator display with avatar */}
                  <OperatorAvatar
                    operator={{
                      name: operator.name,
                      avatar: {
                        type: 'initials',
                        bgColor: operator.profileColor || '#10B981',
                        textColor: '#FFFFFF'
                      },
                      status: operator.status || 'available',
                      currentWorkload: operator.currentLoad || 0
                    }}
                    size="md"
                    showStatus={true}
                    showWorkload={true}
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{operator.name}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-1">
                      <span>{getMachineTypeIcon(operator.machine)}</span>
                      <span>{operator.machine?.replace('-', ' ').toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span className="flex items-center space-x-1">
                        <span>⚡</span>
                        <span>{operator.efficiency || 85}%</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>📊</span>
                        <span>{operator.currentLoad || 0}/{operator.maxLoad || 10}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Assignment Button */}
          <button
            onClick={handleAssign}
            disabled={selectedItems.size === 0 || !selectedOperator}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {currentLanguage === 'np' 
              ? `${selectedItems.size} वटा काम असाइन गर्नुहोस्`
              : `Assign ${selectedItems.size} Items`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default BundleCardAssignment;