// Centralized Self-Assignment System
// Uses centralized hooks and business logic instead of direct Firebase calls

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";
import { useWorkManagement, useUsers, useCentralizedStatus } from "../../hooks/useAppData";
import BusinessLogicService from "../../services/BusinessLogicService";
import OperationsSequenceEditor from '../common/OperationsSequenceEditor';
import MachineSpecialitySelector from './MachineSpecialitySelector';
import { getBundleDisplayName } from '../../utils/bundleIdGenerator';

// Mock operation types for fallback
const mockOperationTypes = [
  { id: 'overlock', english: 'Overlock Stitching', nepali: 'ओभरलक सिलाई', machine: 'Overlock' },
  { id: 'flatlock', english: 'Flatlock Stitching', nepali: 'फ्ल्याटलक सिलाई', machine: 'Flatlock' },
  { id: 'singleNeedle', english: 'Single Needle', nepali: 'एकल सुई', machine: 'Single Needle' },
  { id: 'buttonhole', english: 'Buttonhole', nepali: 'बटनहोल', machine: 'Buttonhole' },
];

const SelfAssignmentSystemCentralized = () => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { showNotification } = useNotifications();
  
  // Centralized data hooks
  const { bundles, assignments, assignWork, loading: workLoading } = useWorkManagement();
  const { operators } = useUsers();
  const { isReady, isLoading: centralizedLoading } = useCentralizedStatus();
  
  // Local state
  const [selectedWork, setSelectedWork] = useState(null);
  const [operationTypes, setOperationTypes] = useState(mockOperationTypes);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    machineType: "all",
    priority: "all",
    articleType: "all",
  });
  const [showOperationsEditor, setShowOperationsEditor] = useState(false);
  const [showMachineSelector, setShowMachineSelector] = useState(false);
  
  const isNepali = currentLanguage === 'np';
  const loading = workLoading || centralizedLoading;

  // Calculate available work using centralized data and business logic
  const availableWork = useMemo(() => {
    if (!bundles || !user) return [];

    const userMachine = user.machine || user.speciality;
    const userId = user.id;

    // Get all work items that are available for assignment
    const available = bundles.flatMap(bundle => 
      (bundle.workItems || []).filter(workItem => {
        // Basic availability checks
        if (!workItem || workItem.status !== 'ready') return false;
        if (workItem.operatorId && workItem.operatorId !== userId) return false;
        
        // Machine compatibility check
        if (userMachine && workItem.requiredMachine && 
            workItem.requiredMachine !== userMachine) return false;
        
        // Not already assigned
        const isAssigned = assignments.some(assignment => 
          assignment.workItemId === workItem.id && 
          assignment.status === 'assigned'
        );
        
        return !isAssigned;
      }).map(workItem => ({
        ...workItem,
        bundleId: bundle.id,
        bundleName: bundle.name || getBundleDisplayName(bundle),
        articleNumber: bundle.articleNumber || workItem.articleNumber,
        priority: workItem.priority || bundle.priority || 'medium',
      }))
    );

    return available;
  }, [bundles, assignments, user]);

  // Filter and search available work
  const filteredWork = useMemo(() => {
    if (!availableWork) return [];

    return availableWork.filter(workItem => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          (workItem.operation?.toLowerCase() || '').includes(searchLower) ||
          (workItem.articleNumber?.toLowerCase() || '').includes(searchLower) ||
          (workItem.bundleName?.toLowerCase() || '').includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Machine type filter
      if (filter.machineType !== 'all') {
        if (workItem.requiredMachine !== filter.machineType) return false;
      }

      // Priority filter
      if (filter.priority !== 'all') {
        if (workItem.priority !== filter.priority) return false;
      }

      // Article type filter (if available)
      if (filter.articleType !== 'all') {
        if (workItem.articleType !== filter.articleType) return false;
      }

      return true;
    });
  }, [availableWork, searchTerm, filter]);

  // Smart work recommendations using business logic
  const recommendedWork = useMemo(() => {
    if (!filteredWork.length || !user) return [];

    return filteredWork
      .map(workItem => {
        let score = 0;
        const reasons = [];

        // Machine compatibility bonus
        if (workItem.requiredMachine === user.machine) {
          score += 10;
          reasons.push(isNepali ? 'मेसिन म्याच' : 'Machine Match');
        }

        // Speciality bonus
        if (workItem.operation === user.speciality) {
          score += 15;
          reasons.push(isNepali ? 'विशेषज्ञता' : 'Speciality');
        }

        // Priority bonus
        if (workItem.priority === 'high') {
          score += 8;
          reasons.push(isNepali ? 'उच्च प्राथमिकता' : 'High Priority');
        } else if (workItem.priority === 'urgent') {
          score += 12;
          reasons.push(isNepali ? 'तुरुन्त' : 'Urgent');
        }

        // Rate bonus (higher rate = higher score)
        if (workItem.rate > 5) {
          score += 5;
          reasons.push(isNepali ? 'उच्च दर' : 'High Rate');
        }

        return {
          ...workItem,
          recommendationScore: score,
          recommendationReasons: reasons
        };
      })
      .filter(item => item.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 5); // Top 5 recommendations
  }, [filteredWork, user, isNepali]);

  const handleWorkSelection = async (workItem) => {
    if (!user) return;

    // Check assignment eligibility using business logic
    const eligibility = await BusinessLogicService.canAssignWork(user.id, workItem);
    
    if (!eligibility.canAssign) {
      showNotification(eligibility.reason, 'warning');
      return;
    }

    setSelectedWork(workItem);
  };

  const handleAssignWork = async () => {
    if (!selectedWork || !user) return;

    try {
      const result = await assignWork(user.id, selectedWork);
      
      if (result.success) {
        const message = isNepali 
          ? `काम असाइन भयो: ${selectedWork.operation}` 
          : `Work assigned: ${selectedWork.operation}`;
        
        showNotification(message, 'success');
        
        // Log activity
        console.log(`✅ Self-assigned work: ${selectedWork.operation} to ${user.name}`);
        
        setSelectedWork(null);
      } else {
        throw new Error(result.error || 'Failed to assign work');
      }
    } catch (error) {
      const message = isNepali 
        ? `काम असाइन गर्न सकिएन: ${error.message}` 
        : `Failed to assign work: ${error.message}`;
      
      showNotification(message, 'error');
    }
  };

  const handleCancelSelection = () => {
    setSelectedWork(null);
  };

  // Show loading state while data is being initialized
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isNepali ? 'डेटा लोड गर्दै...' : 'Loading work data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isNepali ? '🎯 काम छान्नुहोस्' : '🎯 Choose Your Work'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isNepali 
              ? 'तपाईंको सीप र मेसिनका आधारमा उपयुक्त काम छान्नुहोस्।'
              : 'Select work that matches your skills and machine.'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isNepali ? 'खोज्नुहोस्' : 'Search'}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder={isNepali ? 'अपरेशन वा आर्टिकल खोज्नुहोस्...' : 'Search operation or article...'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isNepali ? 'मेसिन प्रकार' : 'Machine Type'}
              </label>
              <select
                value={filter.machineType}
                onChange={(e) => setFilter({ ...filter, machineType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{isNepali ? 'सबै मेसिन' : 'All Machines'}</option>
                <option value="Overlock">{isNepali ? 'ओभरलक' : 'Overlock'}</option>
                <option value="Flatlock">{isNepali ? 'फ्ल्याटलक' : 'Flatlock'}</option>
                <option value="Single Needle">{isNepali ? 'एकल सुई' : 'Single Needle'}</option>
                <option value="Buttonhole">{isNepali ? 'बटनहोल' : 'Buttonhole'}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isNepali ? 'प्राथमिकता' : 'Priority'}
              </label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{isNepali ? 'सबै प्राथमिकता' : 'All Priority'}</option>
                <option value="urgent">{isNepali ? 'तुरुन्त' : 'Urgent'}</option>
                <option value="high">{isNepali ? 'उच्च' : 'High'}</option>
                <option value="medium">{isNepali ? 'मध्यम' : 'Medium'}</option>
                <option value="low">{isNepali ? 'कम' : 'Low'}</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter({ machineType: 'all', priority: 'all', articleType: 'all' });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                {isNepali ? 'खाली गर्नुहोस्' : 'Clear'}
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendedWork.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              ⭐ {isNepali ? 'तपाईंको लागि सिफारिस' : 'Recommended for You'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedWork.slice(0, 3).map((workItem) => (
                <div
                  key={workItem.id}
                  className="bg-white p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleWorkSelection(workItem)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{workItem.operation}</h4>
                    <span className="text-sm font-medium text-green-600">
                      Rs. {workItem.rate}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {isNepali ? 'आर्टिकल' : 'Article'}: {workItem.articleNumber}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {workItem.recommendationReasons.map((reason, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Work List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {isNepali ? '📋 उपलब्ध काम' : '📋 Available Work'} ({filteredWork.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowOperationsEditor(true)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
              >
                {isNepali ? '⚙️ अपरेशन' : '⚙️ Operations'}
              </button>
              <button
                onClick={() => setShowMachineSelector(true)}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
              >
                {isNepali ? '🔧 मेसिन' : '🔧 Machine'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">{isNepali ? 'लोड गर्दै...' : 'Loading...'}</p>
            </div>
          ) : filteredWork.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isNepali ? 'कुनै काम उपलब्ध छैन' : 'No Work Available'}
              </h3>
              <p className="text-gray-600">
                {isNepali 
                  ? 'हाल तपाईंका लागि कुनै काम उपलब्ध छैन। कृपया फिल्टर परिवर्तन गर्नुहोस् वा पछि प्रयास गर्नुहोस्।'
                  : 'No work is currently available for you. Try changing filters or check back later.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWork.map((workItem) => (
                <div
                  key={workItem.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedWork?.id === workItem.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleWorkSelection(workItem)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">
                        {isNepali ? 'अपरेशन' : 'Operation'}
                      </div>
                      <div className="font-medium">{workItem.operation}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        {isNepali ? 'आर्टिकल' : 'Article'}
                      </div>
                      <div className="font-medium">#{workItem.articleNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        {isNepali ? 'टुक्राहरू' : 'Pieces'}
                      </div>
                      <div className="font-medium">{workItem.pieces || workItem.targetPieces || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        {isNepali ? 'दर' : 'Rate'}
                      </div>
                      <div className="font-medium text-green-600">Rs. {workItem.rate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        {isNepali ? 'प्राथमिकता' : 'Priority'}
                      </div>
                      <div className={`font-medium ${
                        workItem.priority === 'urgent' ? 'text-red-600' :
                        workItem.priority === 'high' ? 'text-orange-600' :
                        workItem.priority === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {workItem.priority === 'urgent' ? (isNepali ? 'तुरुन्त' : 'Urgent') :
                         workItem.priority === 'high' ? (isNepali ? 'उच्च' : 'High') :
                         workItem.priority === 'medium' ? (isNepali ? 'मध्यम' : 'Medium') :
                         (isNepali ? 'कम' : 'Low')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        {isNepali ? 'मेसिन' : 'Machine'}
                      </div>
                      <div className="font-medium">{workItem.requiredMachine || 'Any'}</div>
                    </div>
                  </div>
                  
                  {workItem.recommendationScore > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {workItem.recommendationReasons.map((reason, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Confirmation */}
        {selectedWork && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                {isNepali ? '✅ काम पुष्टि गर्नुहोस्' : '✅ Confirm Work Selection'}
              </h3>
              
              <div className="space-y-2 mb-6">
                <p><strong>{isNepali ? 'अपरेशन' : 'Operation'}:</strong> {selectedWork.operation}</p>
                <p><strong>{isNepali ? 'आर्टिकल' : 'Article'}:</strong> #{selectedWork.articleNumber}</p>
                <p><strong>{isNepali ? 'टुक्राहरू' : 'Pieces'}:</strong> {selectedWork.pieces || selectedWork.targetPieces || 0}</p>
                <p><strong>{isNepali ? 'दर' : 'Rate'}:</strong> Rs. {selectedWork.rate}</p>
                <p><strong>{isNepali ? 'अनुमानित आम्दानी' : 'Estimated Earnings'}:</strong> Rs. {(selectedWork.pieces || selectedWork.targetPieces || 0) * selectedWork.rate}</p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleAssignWork}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {loading ? (isNepali ? 'असाइन गर्दै...' : 'Assigning...') : (isNepali ? 'असाइन गर्नुहोस्' : 'Assign Work')}
                </button>
                <button
                  onClick={handleCancelSelection}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Operations Editor Modal */}
        {showOperationsEditor && (
          <OperationsSequenceEditor
            isOpen={showOperationsEditor}
            onClose={() => setShowOperationsEditor(false)}
            operations={operationTypes}
            onSave={(updatedOperations) => {
              setOperationTypes(updatedOperations);
              setShowOperationsEditor(false);
            }}
          />
        )}

        {/* Machine Selector Modal */}
        {showMachineSelector && (
          <MachineSpecialitySelector
            isOpen={showMachineSelector}
            onClose={() => setShowMachineSelector(false)}
            currentMachine={user?.machine}
            currentSpeciality={user?.speciality}
            onSave={(machineData) => {
              // This would update user's machine/speciality in centralized store
              console.log('Machine/speciality update:', machineData);
              setShowMachineSelector(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SelfAssignmentSystemCentralized;