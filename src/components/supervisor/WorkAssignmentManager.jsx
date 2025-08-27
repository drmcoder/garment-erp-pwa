import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import { WIPService, OperatorService } from '../../services/firebase-services';
import WorkAssignmentBoard from './WorkAssignmentBoard';

const WorkAssignmentManager = ({ onClose }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const isNepali = currentLanguage === 'np';
  
  const [workItems, setWorkItems] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkItems();
    loadOperators();
  }, [addError]);

  // Add refresh functionality to reload data
  const handleRefreshData = () => {
    console.log('🔄 Refreshing operator and work item data...');
    setLoading(true);
    loadWorkItems();
    loadOperators();
  };

  const loadWorkItems = async () => {
    try {
      const result = await WIPService.getWorkItemsFromWIP();
      
      if (result.success) {
        // Filter for unassigned work items
        const availableWorkItems = result.workItems.filter(item => 
          !item.assignedOperator && 
          (item.status === 'ready' || item.status === 'waiting')
        );
        
        setWorkItems(availableWorkItems);
        console.log('✅ Loaded work items from WIP:', availableWorkItems.length);
        
        // Only show notification if there are no work items (error case)
        if (availableWorkItems.length === 0) {
          addError({
            message: `${isNepali ? 'कुनै काम आइटम फेला परेनन्' : 'No work items available'}`,
            component: 'WorkAssignmentManager',
            action: 'Load Work Items'
          }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
        }
      } else {
        console.warn('⚠️ No work items found from WIP');
        setWorkItems([]);
        addError({
          message: `${isNepali ? 'कुनै काम आइटम फेला परेनन्' : 'No work items found'}`,
          component: 'WorkAssignmentManager',
          action: 'Load Work Items'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      }
      
      setLoading(false);
      
    } catch (error) {
      setLoading(false);
      console.error('❌ Error loading work items:', error);
      addError({
        message: 'Failed to load work items',
        component: 'WorkAssignmentManager',
        action: 'Load Work Items',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const loadOperators = async () => {
    try {
      const result = await OperatorService.getActiveOperators();
      
      if (result.success && result.operators && result.operators.length > 0) {
        console.log('✅ Loaded operators for work assignment:', result.operators.length);
        console.log('🔍 Sample operator structure:', result.operators[0]);
        setOperators(result.operators);
      } else {
        console.warn('⚠️ No operators found');
        console.log('Result details:', result);
        setOperators([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading operators:', error);
      setOperators([]);
      addError({
        message: 'Failed to load operators',
        component: 'WorkAssignmentManager',
        action: 'Load Operators',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleAssignmentComplete = (assignments) => {
    try {
      // No localStorage updates - assignments are handled by backend
      // No localStorage saving
      
      // Reload work items to show updated state
      loadWorkItems();
      
      addError({
        message: `${isNepali ? 'सफलतापूर्वक असाइन गरियो' : 'Successfully assigned'} ${assignments.length} ${isNepali ? 'काम आइटम' : 'work items'}`,
        component: 'WorkAssignmentManager',
        action: 'Assignment Complete'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      
    } catch (error) {
      addError({
        message: 'Failed to save assignments',
        component: 'WorkAssignmentManager',
        action: 'Assignment Complete',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isNepali ? 'काम आइटम लोड गर्दै...' : 'Loading Work Items...'}
            </h3>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (workItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
          <div className="text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ✕
            </button>
            
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isNepali ? 'काम आइटम फेला परेनन्' : 'No Work Items Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isNepali 
                ? 'पहिले WIP डेटा इम्पोर्ट गरेर काम आइटम सिर्जना गर्नुहोस्'
                : 'Please import WIP data first to create work items'
              }
            </p>
            
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isNepali ? 'बन्द गर्नुहोस्' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden">
        <div className="h-full relative">
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button
              onClick={handleRefreshData}
              className="bg-blue-500 text-white rounded-full p-2 shadow-lg hover:bg-blue-600 transition-colors"
              title={isNepali ? 'डेटा रिफ्रेश गर्नुहोस्' : 'Refresh Data'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <WorkAssignmentBoard
            workItems={workItems}
            operators={operators}
            onAssignmentComplete={handleAssignmentComplete}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkAssignmentManager;