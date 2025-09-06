// src/components/supervisor/SelfAssignmentApprovalQueue.jsx
// Supervisor interface for approving/rejecting self-assignments

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LegacyBundleService, WIPService, OperatorService } from '../../services/firebase-services-clean';
import { db, collection, addDoc } from '../../config/firebase';

const SelfAssignmentApprovalQueue = () => {
  const { user } = useContext(AuthContext);
  const { isNepali, formatCurrency, formatDateTime } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [rawPendingData, setRawPendingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [processingItems, setProcessingItems] = useState(new Set());

  // Helper to resolve operator names - separate from useCallback to avoid circular deps
  const resolveOperatorNames = (items, currentOperators) => {
    return items.map(item => ({
      ...item,
      requestedByName: item.requestedByName || 
        currentOperators.find(op => op.id === item.requestedBy)?.name || 
        'Unknown Operator'
    }));
  };

  const loadOperators = useCallback(async () => {
    try {
      const result = await OperatorService.getAllOperators();
      if (result.success) {
        setOperators(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  }, []);

  const loadPendingApprovals = useCallback(async () => {
    setLoading(true);
    try {
      // Load both bundle and WIP self-assignments
      const [bundleResults, wipResults] = await Promise.all([
        LegacyBundleService.getSelfAssignedWork(),
        WIPService.getSelfAssignedWorkItems()
      ]);

      console.log('🔍 Bundle results:', bundleResults);
      console.log('🔍 WIP results:', wipResults);
      
      // Log detailed info about the results
      if (bundleResults.success) {
        console.log('📦 Bundle items found:', bundleResults.data?.length || 0);
        bundleResults.data?.forEach((item, index) => {
          console.log(`  Bundle ${index + 1}:`, {
            id: item.id,
            status: item.status,
            requestedBy: item.requestedBy,
            selfAssignedAt: item.selfAssignedAt
          });
        });
      } else {
        console.log('❌ Bundle query failed:', bundleResults.error);
      }
      
      if (wipResults.success) {
        console.log('🔧 WIP items found:', wipResults.data?.length || 0);
        wipResults.data?.forEach((item, index) => {
          console.log(`  WIP ${index + 1}:`, {
            id: item.id,
            status: item.status,
            requestedBy: item.requestedBy,
            selfAssignedAt: item.selfAssignedAt
          });
        });
      } else {
        console.log('❌ WIP query failed:', wipResults.error);
      }

      // Add test function to window for manual testing
      if (typeof window !== 'undefined') {
        window.createTestSelfAssignment = async () => {
          console.log('🧪 Creating test self-assignment...');
          try {
            const testBundleRef = await addDoc(collection(db, 'bundles'), {
              id: 'TEST_BUNDLE_' + Date.now(),
              status: 'self_assigned',
              selfAssignedAt: new Date(),
              requestedBy: 'test_operator_123',
              assignedOperator: 'test_operator_123',
              operation: 'Test Operation',
              pieces: 50,
              articleNumber: 'TEST-001',
              batchNumber: 'BATCH-TEST',
              color: 'Blue',
              rate: 5.50,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log('✅ Test bundle created:', testBundleRef.id);
            
            const testWorkItemRef = await addDoc(collection(db, 'workItems'), {
              id: 'TEST_WORKITEM_' + Date.now(),
              status: 'self_assigned',
              selfAssignedAt: new Date(),
              requestedBy: 'test_operator_456',
              assignedOperator: 'test_operator_456',
              operation: 'Test WIP Operation',
              pieces: 30,
              batchNumber: 'WIP-BATCH-TEST',
              color: 'Red',
              rate: 4.25,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log('✅ Test work item created:', testWorkItemRef.id);
            console.log('🔄 Refreshing approval queue...');
            loadPendingApprovals();
          } catch (error) {
            console.error('❌ Failed to create test data:', error);
          }
        };
      }

      // Process results and add metadata
      const bundleItems = bundleResults.success ? bundleResults.data.map(item => ({ 
        ...item, 
        type: 'bundle',
        operation: item.operation || item.currentOperation || 'Not specified',
        rate: item.rate || item.unitPrice || 0,
        selfAssignedAt: item.selfAssignedAt || item.timestamp || new Date(),
        batchNumber: item.batchNumber || item.batchNo || item.batch || 'Not specified',
        color: item.color || item.colorName || 'Not specified',
        requestedAt: item.requestedAt || item.createdAt || item.timestamp || new Date(),
        totalPrice: (item.rate || item.unitPrice || 0) * (item.pieces || item.quantity || 0)
      })) : [];

      const wipItems = wipResults.success ? wipResults.data.map(item => ({ 
        ...item, 
        type: 'wip',
        operation: item.operation || item.currentOperation || 'Not specified',
        rate: item.rate || item.unitPrice || 0,
        selfAssignedAt: item.selfAssignedAt || item.timestamp || new Date(),
        batchNumber: item.batchNumber || item.batchNo || item.batch || 'Not specified',
        color: item.color || item.colorName || 'Not specified',
        requestedAt: item.requestedAt || item.createdAt || item.timestamp || new Date(),
        totalPrice: (item.rate || item.unitPrice || 0) * (item.pieces || item.quantity || 0)
      })) : [];

      const allPendingWork = [...bundleItems, ...wipItems];

      // Sort by self-assignment time (oldest first)
      allPendingWork.sort((a, b) => {
        const timeA = a.selfAssignedAt?.seconds || 0;
        const timeB = b.selfAssignedAt?.seconds || 0;
        return timeA - timeB;
      });

      setRawPendingData(allPendingWork);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      showNotification(
        isNepali ? 'अनुमोदन सूची लोड गर्न सकिएन' : 'Failed to load approval queue',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [isNepali, showNotification]); // Removed operators to prevent circular dependency

  // Resolve operator names when raw data or operators change
  useEffect(() => {
    if (rawPendingData.length > 0) {
      const resolvedData = resolveOperatorNames(rawPendingData, operators);
      setPendingApprovals(resolvedData);
    } else {
      setPendingApprovals([]);
    }
  }, [rawPendingData, operators]);

  // Load operators on component mount
  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  // Load pending approvals when operators are available
  useEffect(() => {
    if (operators.length > 0) {
      loadPendingApprovals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operators.length]); // Explicitly excluding loadPendingApprovals to prevent infinite loop

  // Auto-refresh every 30 seconds (only if operators are loaded)
  useEffect(() => {
    if (operators.length > 0) {
      const interval = setInterval(loadPendingApprovals, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operators.length]); // Explicitly excluding loadPendingApprovals to prevent infinite loop


  const handleApprove = async (workItem) => {
    setProcessingItems(prev => new Set(prev).add(workItem.id));
    
    try {
      let result;
      const language = isNepali ? 'np' : 'en';
      if (workItem.type === 'bundle') {
        result = await LegacyBundleService.approveSelfAssignment(workItem.id, user.id, language);
      } else {
        result = await WIPService.approveSelfAssignment(workItem.id, user.id, language);
      }

      if (result.success) {
        await loadPendingApprovals();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      showNotification(
        isNepali ? 'अनुमोदन असफल भयो' : 'Approval failed',
        'error'
      );
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(workItem.id);
        return newSet;
      });
    }
  };

  const handleReject = async (workItem, reason = '') => {
    setProcessingItems(prev => new Set(prev).add(workItem.id));
    
    try {
      let result;
      if (workItem.type === 'bundle') {
        result = await LegacyBundleService.rejectSelfAssignment(workItem.id, user.id, reason);
      } else {
        result = await WIPService.rejectSelfAssignment(workItem.id, user.id, reason);
      }

      if (result.success) {
        await loadPendingApprovals();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Rejection failed:', error);
      showNotification(
        isNepali ? 'अस्वीकार असफल भयो' : 'Rejection failed',
        'error'
      );
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(workItem.id);
        return newSet;
      });
    }
  };

  const handleReassign = async (workItem, newOperatorId) => {
    setProcessingItems(prev => new Set(prev).add(workItem.id));
    
    try {
      let result;
      if (workItem.type === 'bundle') {
        result = await LegacyBundleService.reassignWork(workItem.id, newOperatorId, user.id);
      } else {
        result = await WIPService.reassignWork(workItem.id, newOperatorId, user.id);
      }

      if (result.success) {
        await loadPendingApprovals();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Reassignment failed:', error);
      showNotification(
        isNepali ? 'पुनः असाइनमेन्ट असफल भयो' : 'Reassignment failed',
        'error'
      );
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(workItem.id);
        return newSet;
      });
    }
  };

  const handleBatchApprove = async () => {
    const itemsToApprove = pendingApprovals.filter(item => selectedItems.has(item.id));
    
    for (const item of itemsToApprove) {
      await handleApprove(item);
    }
    
    setSelectedItems(new Set());
  };

  const handleBatchReject = async () => {
    const itemsToReject = pendingApprovals.filter(item => selectedItems.has(item.id));
    
    for (const item of itemsToReject) {
      await handleReject(item, 'Batch rejection');
    }
    
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === pendingApprovals.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(pendingApprovals.map(item => item.id)));
    }
  };

  const getWaitingTime = (selfAssignedAt) => {
    if (!selfAssignedAt) return 'N/A';
    
    const now = new Date();
    const assignedTime = selfAssignedAt.toDate();
    const diffMinutes = Math.floor((now - assignedTime) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}${isNepali ? ' मिनेट' : 'm'}`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}${isNepali ? ' घण्टा' : 'h'}`;
    }
  };

  const getOperatorSkillMatch = (workItem, operatorId) => {
    const operator = operators.find(op => op.id === operatorId);
    if (!operator) return 'unknown';
    
    // Check if operator's skills match work requirements
    const hasSkill = operator.skills?.includes(workItem.operation) || 
                    operator.speciality === workItem.machineType;
    
    if (hasSkill) return 'perfect';
    
    // Check partial match
    const hasPartialSkill = operator.machineType === workItem.machineType;
    return hasPartialSkill ? 'good' : 'poor';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              🙋 {isNepali ? 'स्वयं असाइनमेन्ट अनुमोदन' : 'Self-Assignment Approvals'}
              <span className="ml-2 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
                {pendingApprovals.length}
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isNepali 
                ? 'अपरेटरहरूले स्वयं मागेका कामको अनुमोदन गर्नुहोस्'
                : 'Review and approve operator self-assignment requests'
              }
            </p>
          </div>
          
          {pendingApprovals.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={loadPendingApprovals}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200"
              >
                🔄 {isNepali ? 'रिफ्रेस' : 'Refresh'}
              </button>
              
              {selectedItems.size > 0 && (
                <>
                  <button
                    onClick={handleBatchApprove}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    ✅ {isNepali ? `${selectedItems.size} अनुमोदन` : `Approve ${selectedItems.size}`}
                  </button>
                  <button
                    onClick={handleBatchReject}
                    className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                  >
                    ❌ {isNepali ? `${selectedItems.size} अस्वीकार` : `Reject ${selectedItems.size}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Batch Selection */}
        {pendingApprovals.length > 1 && (
          <div className="flex items-center space-x-2 text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === pendingApprovals.length}
                onChange={toggleSelectAll}
                className="rounded"
              />
              <span className="text-gray-600">
                {isNepali ? 'सबै छान्नुहोस्' : 'Select all'}
              </span>
            </label>
            {selectedItems.size > 0 && (
              <span className="text-blue-600">
                {selectedItems.size} {isNepali ? 'छानिएको' : 'selected'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isNepali ? 'सबै काम अनुमोदित!' : 'All caught up!'}
            </h3>
            <p className="text-gray-500">
              {isNepali 
                ? 'कुनै स्वयं असाइनमेन्ट अनुमोदनको पर्खाइमा छैन'
                : 'No self-assignment requests pending approval'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((workItem) => {
              const skillMatch = getOperatorSkillMatch(workItem, workItem.requestedBy);
              const waitingTime = getWaitingTime(workItem.selfAssignedAt);
              const isProcessing = processingItems.has(workItem.id);
              
              return (
                <div
                  key={workItem.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedItems.has(workItem.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Selection Checkbox */}
                      <label className="flex items-center mt-1">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(workItem.id)}
                          onChange={() => toggleItemSelection(workItem.id)}
                          className="rounded"
                        />
                      </label>

                      {/* Work Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-3">
                          <h4 className="font-semibold text-gray-900">
                            #{workItem.articleNumber || workItem.id}
                          </h4>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {workItem.type === 'bundle' ? 'Bundle' : 'WIP'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            waitingTime.includes('h') 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            ⏱️ {waitingTime}
                          </span>
                          {workItem.batchNumber && workItem.batchNumber !== 'Not specified' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              📦 Batch: {workItem.batchNumber}
                            </span>
                          )}
                          {workItem.color && workItem.color !== 'Not specified' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              🎨 {workItem.color}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm mb-4">
                          <div>
                            <span className="text-gray-500 text-xs">
                              {isNepali ? 'अपरेशन:' : 'Operation:'}
                            </span>
                            <div className="font-medium">{workItem.operation}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">
                              {isNepali ? 'मेसिन:' : 'Machine:'}
                            </span>
                            <div className="font-medium">{workItem.machineType}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">
                              {isNepali ? 'पिस:' : 'Pieces:'}
                            </span>
                            <div className="font-medium">{workItem.pieces || workItem.quantity || 0} pcs</div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">
                              {isNepali ? 'दर:' : 'Rate:'}
                            </span>
                            <div className="font-medium text-green-600">
                              {workItem.rate && workItem.rate > 0 ? formatCurrency(workItem.rate) : 'Rate not set'}/pc
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">
                              {isNepali ? 'कुल मूल्य:' : 'Total Value:'}
                            </span>
                            <div className="font-medium text-green-700">
                              {workItem.totalPrice > 0 ? formatCurrency(workItem.totalPrice) : 'Not calculated'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">
                              {isNepali ? 'अनुरोध गरियो:' : 'Requested:'}
                            </span>
                            <div className="font-medium text-blue-600">
                              {workItem.requestedAt ? formatDateTime(workItem.requestedAt) : 'No date available'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <div>
                                <span className="font-medium text-gray-900">
                                  👤 {workItem.requestedByName}
                                </span>
                                <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                  skillMatch === 'perfect' 
                                    ? 'bg-green-100 text-green-700'
                                    : skillMatch === 'good'
                                    ? 'bg-yellow-100 text-yellow-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {skillMatch === 'perfect' && '🎯 Perfect Match'}
                                  {skillMatch === 'good' && '👍 Good Match'}
                                  {skillMatch === 'poor' && '⚠️ Skill Mismatch'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end text-xs text-gray-500">
                            <div className="flex items-center space-x-2">
                              <span>🔄 Self-assigned:</span>
                              <span className="font-medium">
                                {workItem.selfAssignedAt ? formatDateTime(workItem.selfAssignedAt) : 'No date available'}
                              </span>
                            </div>
                            {workItem.requestedAt && workItem.requestedAt !== workItem.selfAssignedAt && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span>📝 Originally requested:</span>
                                <span className="font-medium">
                                  {formatDateTime(workItem.requestedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(workItem)}
                        disabled={isProcessing}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isProcessing ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <span>✅</span>
                            <span>{isNepali ? 'अनुमोदन' : 'Approve'}</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleReject(workItem)}
                        disabled={isProcessing}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center space-x-1"
                      >
                        <span>❌</span>
                        <span>{isNepali ? 'अस्वीकार' : 'Reject'}</span>
                      </button>

                      {operators.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleReassign(workItem, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          disabled={isProcessing}
                          className="border rounded px-2 py-1 text-sm disabled:opacity-50"
                          defaultValue=""
                        >
                          <option value="">
                            {isNepali ? 'पुनः असाइन' : 'Reassign'}
                          </option>
                          {operators
                            .filter(op => op.id !== workItem.requestedBy && op.status === 'available')
                            .map(operator => (
                              <option key={operator.id} value={operator.id}>
                                {operator.name}
                              </option>
                            ))
                          }
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfAssignmentApprovalQueue;