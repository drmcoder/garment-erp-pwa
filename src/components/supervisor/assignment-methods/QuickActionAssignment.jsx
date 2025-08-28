import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useGlobalError } from '../../common/GlobalErrorHandler';
import { getMachineTypeIcon } from '../../../constants';
import { MachineCompatibilityValidator } from '../../../utils/machineCompatibility';

const QuickActionAssignment = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [quickFilters, setQuickFilters] = useState({
    priority: 'all',
    machine: 'all',
    pieces: 'all'
  });

  const handleQuickAssign = async (workItem, operator) => {
    try {
      // Validate assignment before proceeding
      const validation = MachineCompatibilityValidator.validateAssignment(operator, workItem, {
        checkWorkload: true,
        checkAvailability: true
      });

      if (!validation.valid) {
        const error = validation.errors[0];
        let errorMessage;
        
        if (error.type === 'MACHINE_INCOMPATIBLE') {
          errorMessage = currentLanguage === 'np'
            ? `मेसिन बेमेल: ${operator.name} (${operator.machine}) ले ${workItem.machineType} काम गर्न सक्दैन`
            : `Machine mismatch: ${operator.name} (${operator.machine}) cannot handle ${workItem.machineType} work`;
        } else {
          errorMessage = currentLanguage === 'np'
            ? 'असाइनमेन्ट असफल भयो - अनुकूलता जाँच गर्नुहोस्'
            : 'Assignment failed - check compatibility';
        }

        addError({
          message: errorMessage,
          component: 'QuickActionAssignment',
          action: 'Quick Assign Validation Failed',
          data: { validation }
        }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
        return;
      }

      const assignment = {
        workItemId: workItem.id,
        operatorId: operator.id,
        assignedAt: new Date(),
        method: 'quick-action'
      };

      await onAssignmentComplete([assignment]);
      
      addError({
        message: currentLanguage === 'np'
          ? `${workItem.bundleNumber} तुरुन्त ${operator.name}लाई असाइन गरियो`
          : `Bundle ${workItem.bundleNumber} quickly assigned to ${operator.name}`,
        component: 'QuickActionAssignment',
        action: 'Quick Assign Success'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      
    } catch (error) {
      addError({
        message: 'Quick assignment failed',
        component: 'QuickActionAssignment',
        action: 'Quick Assign',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleBulkQuickAssign = async (priority = 'urgent') => {
    try {
      const urgentItems = workItems.filter(item => 
        item.status === 'ready' && item.priority === priority
      );

      if (urgentItems.length === 0) {
        addError({
          message: currentLanguage === 'np'
            ? `${priority} प्राथमिकताका कुनै काम फेला परेन`
            : `No ${priority} priority items found`,
          component: 'QuickActionAssignment',
          action: 'Bulk Quick Assign Validation'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
        return;
      }

      // Smart assignment algorithm
      const assignments = [];
      const availableOperators = operators.filter(op => op.status === 'available');
      
      urgentItems.forEach(item => {
        const compatibleOps = MachineCompatibilityValidator.getCompatibleOperators(availableOperators, item);
        
        if (compatibleOps.length > 0) {
          // Find best operator based on efficiency and workload
          const bestOp = compatibleOps.reduce((best, current) => {
            const bestScore = (best.efficiency || 70) - ((best.currentLoad / best.maxLoad) * 30);
            const currentScore = (current.efficiency || 70) - ((current.currentLoad / current.maxLoad) * 30);
            return currentScore > bestScore ? current : best;
          });

          // Final validation before adding to assignments
          const validation = MachineCompatibilityValidator.validateAssignment(bestOp, item, {
            checkWorkload: true,
            checkAvailability: true
          });

          if (validation.valid) {
            assignments.push({
              workItemId: item.id,
              operatorId: bestOp.id,
              assignedAt: new Date(),
              method: 'bulk-quick-action'
            });

            // Update operator load for next assignment
            bestOp.currentLoad += 1;
          }
        }
      });

      if (assignments.length > 0) {
        await onAssignmentComplete(assignments);
        
        addError({
          message: currentLanguage === 'np'
            ? `${assignments.length} वटा ${priority} काम तुरुन्त असाइन गरियो`
            : `${assignments.length} ${priority} items quickly assigned`,
          component: 'QuickActionAssignment',
          action: 'Bulk Quick Assign Success'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      }
      
    } catch (error) {
      addError({
        message: 'Bulk quick assignment failed',
        component: 'QuickActionAssignment',
        action: 'Bulk Quick Assign',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleAutoBalance = async () => {
    try {
      const readyItems = workItems.filter(item => item.status === 'ready');
      const availableOperators = operators.filter(op => op.status === 'available');
      
      if (readyItems.length === 0) {
        addError({
          message: currentLanguage === 'np' ? 'असाइन गर्नका लागि कुनै काम उपलब्ध छैन' : 'No work available for assignment',
          component: 'QuickActionAssignment',
          action: 'Auto Balance Validation'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
        return;
      }

      // Group items by machine type
      const itemsByMachine = {};
      readyItems.forEach(item => {
        if (!itemsByMachine[item.machineType]) {
          itemsByMachine[item.machineType] = [];
        }
        itemsByMachine[item.machineType].push(item);
      });

      const assignments = [];
      
      // Distribute work evenly across operators
      Object.entries(itemsByMachine).forEach(([machineType, items]) => {
        const compatibleOps = availableOperators.filter(op => 
          op.machine === machineType || op.machine === 'multi-skill'
        ).sort((a, b) => (a.currentLoad / a.maxLoad) - (b.currentLoad / b.maxLoad));

        items.forEach((item, index) => {
          if (compatibleOps.length > 0) {
            const operator = compatibleOps[index % compatibleOps.length];
            assignments.push({
              workItemId: item.id,
              operatorId: operator.id,
              assignedAt: new Date(),
              method: 'auto-balance'
            });
          }
        });
      });

      if (assignments.length > 0) {
        await onAssignmentComplete(assignments);
        
        addError({
          message: currentLanguage === 'np'
            ? `${assignments.length} वटा काम स्वचालित रूपमा बैलेन्स गरियो`
            : `${assignments.length} items auto-balanced`,
          component: 'QuickActionAssignment',
          action: 'Auto Balance Success'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      }
      
    } catch (error) {
      addError({
        message: 'Auto balance failed',
        component: 'QuickActionAssignment',
        action: 'Auto Balance',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const getFilteredItems = () => {
    return workItems.filter(item => {
      const priorityMatch = quickFilters.priority === 'all' || item.priority === quickFilters.priority;
      const machineMatch = quickFilters.machine === 'all' || item.machineType === quickFilters.machine;
      const piecesMatch = quickFilters.pieces === 'all' || 
        (quickFilters.pieces === 'small' && item.pieces < 50) ||
        (quickFilters.pieces === 'medium' && item.pieces >= 50 && item.pieces < 100) ||
        (quickFilters.pieces === 'large' && item.pieces >= 100);
      
      return item.status === 'ready' && priorityMatch && machineMatch && piecesMatch;
    });
  };

  const getCompatibleOperators = (workItem) => {
    return operators.filter(op => 
      (op.machine === workItem.machineType || op.machine === 'multi-skill') &&
      op.status === 'available'
    ).sort((a, b) => {
      const aScore = (a.efficiency || 70) - ((a.currentLoad / a.maxLoad) * 30);
      const bScore = (b.efficiency || 70) - ((b.currentLoad / b.maxLoad) * 30);
      return bScore - aScore;
    });
  };

  // Using centralized machine type icons

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Helper function to get color value for display
  const getColorValue = (colorName) => {
    const colorMap = {
      'red': '#ef4444',
      'blue': '#3b82f6', 
      'green': '#10b981',
      'yellow': '#f59e0b',
      'black': '#374151',
      'white': '#f3f4f6',
      'gray': '#6b7280',
      'pink': '#ec4899',
      'purple': '#8b5cf6',
      'orange': '#f97316'
    };
    return colorMap[colorName?.toLowerCase()] || '#d1d5db';
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ⚡ {currentLanguage === 'np' ? 'त्वरित कार्य असाइनमेन्ट' : 'Quick Action Assignment'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'एक क्लिकमा काम असाइन गर्नुहोस् वा स्वचालित बैलेन्सिंग प्रयोग गर्नुहोस्'
                : 'Assign work with one click or use automatic balancing'
              }
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleBulkQuickAssign('urgent')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <span>🚨</span>
              <span>{currentLanguage === 'np' ? 'जरुरी असाइन' : 'Assign Urgent'}</span>
            </button>
            
            <button
              onClick={() => handleBulkQuickAssign('high')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <span>⏫</span>
              <span>{currentLanguage === 'np' ? 'उच्च असाइन' : 'Assign High'}</span>
            </button>
            
            <button
              onClick={handleAutoBalance}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>⚖️</span>
              <span>{currentLanguage === 'np' ? 'ऑटो बैलेन्स' : 'Auto Balance'}</span>
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'प्राथमिकता' : 'Priority'}
            </label>
            <select
              value={quickFilters.priority}
              onChange={(e) => setQuickFilters({...quickFilters, priority: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">{currentLanguage === 'np' ? 'सबै' : 'All'}</option>
              <option value="urgent">{currentLanguage === 'np' ? 'जरुरी' : 'Urgent'}</option>
              <option value="high">{currentLanguage === 'np' ? 'उच्च' : 'High'}</option>
              <option value="medium">{currentLanguage === 'np' ? 'मध्यम' : 'Medium'}</option>
              <option value="low">{currentLanguage === 'np' ? 'न्यून' : 'Low'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'मेसिन प्रकार' : 'Machine Type'}
            </label>
            <select
              value={quickFilters.machine}
              onChange={(e) => setQuickFilters({...quickFilters, machine: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">{currentLanguage === 'np' ? 'सबै' : 'All'}</option>
              <option value="single-needle">{currentLanguage === 'np' ? 'सिंगल नीडल' : 'Single Needle'}</option>
              <option value="overlock">{currentLanguage === 'np' ? 'ओभरलक' : 'Overlock'}</option>
              <option value="flatlock">{currentLanguage === 'np' ? 'फ्ल्यालक' : 'Flatlock'}</option>
              <option value="buttonhole">{currentLanguage === 'np' ? 'बटनहोल' : 'Buttonhole'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'टुक्राको साइज' : 'Piece Size'}
            </label>
            <select
              value={quickFilters.pieces}
              onChange={(e) => setQuickFilters({...quickFilters, pieces: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">{currentLanguage === 'np' ? 'सबै' : 'All'}</option>
              <option value="small">{currentLanguage === 'np' ? 'सानो (<50)' : 'Small (<50)'}</option>
              <option value="medium">{currentLanguage === 'np' ? 'मध्यम (50-99)' : 'Medium (50-99)'}</option>
              <option value="large">{currentLanguage === 'np' ? 'ठूलो (100+)' : 'Large (100+)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Assignment Cards */}
      <div className="max-h-[800px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
          const compatibleOps = getCompatibleOperators(item);
          
          return (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
              {/* Enhanced Bundle Header */}
              <div className="border-b border-gray-100 pb-3 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getMachineTypeIcon(item.machineType)}</span>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">
                        #{item.bundleNumber || item.id?.slice(-4) || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {item.articleName || item.article || 'Unknown Article'}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(item.priority)}`}>
                    {item.priority || 'medium'}
                  </span>
                </div>

                {/* Color and Size */}
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" 
                         style={{backgroundColor: getColorValue(item.color)}}
                         title={item.color}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.color || 'N/A'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    Size: {item.size || 'N/A'}
                  </span>
                </div>

                {/* Operation - Most Important */}
                <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  <div className="text-sm font-bold text-blue-800">
                    ⚙️ {item.operation || item.currentOperation || 'No Operation Specified'}
                  </div>
                  <div className="text-xs text-blue-600">
                    Machine: {item.machineType || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded px-3 py-2 text-center">
                  <div className="text-lg font-bold text-gray-800">🔢 {item.pieces || 0}</div>
                  <div className="text-xs text-gray-600">Pieces</div>
                </div>
                <div className="bg-gray-50 rounded px-3 py-2 text-center">
                  <div className="text-lg font-bold text-gray-800">⏱️ {item.estimatedTime || 0}</div>
                  <div className="text-xs text-gray-600">Minutes</div>
                </div>
              </div>

              {/* Quick Assignment Buttons */}
              <div className="space-y-2">
                <div className="text-xs text-gray-600 mb-2">
                  {currentLanguage === 'np' ? 'त्वरित असाइन:' : 'Quick assign to:'}
                </div>
                
                {compatibleOps.slice(0, 3).map((operator, index) => (
                  <button
                    key={operator.id}
                    onClick={() => handleQuickAssign(item, operator)}
                    className={`w-full text-left p-2 rounded border transition-colors text-sm ${
                      index === 0 
                        ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="flex items-center space-x-2">
                          <span>
                            {operator.machine === 'single-needle' && '📍'}
                            {operator.machine === 'overlock' && '🔗'}
                            {operator.machine === 'flatlock' && '📎'}
                            {operator.machine === 'buttonhole' && '🕳️'}
                            {!['single-needle', 'overlock', 'flatlock', 'buttonhole'].includes(operator.machine) && '⚙️'}
                          </span>
                          <span className="font-medium">{operator.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded">
                            {operator.machine?.replace('-', ' ').toUpperCase() || 'MULTI'}
                          </span>
                        </div>
                        {index === 0 && (
                          <span className="text-xs text-green-600 font-medium">BEST</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {operator.efficiency}% | {operator.currentLoad}/{operator.maxLoad}
                      </div>
                    </div>
                  </button>
                ))}

                {compatibleOps.length === 0 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    {currentLanguage === 'np' 
                      ? 'कुनै उपयुक्त अपरेटर उपलब्ध छैन'
                      : 'No compatible operators available'
                    }
                  </div>
                )}

                {compatibleOps.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{compatibleOps.length - 3} {currentLanguage === 'np' ? 'थप विकल्पहरू' : 'more options'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {currentLanguage === 'np' ? 'कुनै काम फेला परेन' : 'No Work Items Found'}
          </h3>
          <p className="text-gray-600">
            {currentLanguage === 'np'
              ? 'फिल्टर परिवर्तन गर्नुहोस् वा नयाँ काम आइटमहरू थप्नुहोस्'
              : 'Try changing filters or add new work items'
            }
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {currentLanguage === 'np' ? 'त्वरित तथ्याङ्कहरू' : 'Quick Stats'}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {workItems.filter(item => item.priority === 'urgent' && item.status === 'ready').length}
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'जरुरी काम' : 'Urgent Items'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {operators.filter(op => op.status === 'available').length}
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'उपलब्ध अपरेटर' : 'Available Ops'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(operators.reduce((sum, op) => sum + (op.efficiency || 0), 0) / operators.length)}%
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'औसत दक्षता' : 'Avg Efficiency'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredItems.reduce((sum, item) => sum + item.pieces, 0)}
            </div>
            <div className="text-xs text-gray-600">
              {currentLanguage === 'np' ? 'जम्मा टुक्रा' : 'Total Pieces'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionAssignment;