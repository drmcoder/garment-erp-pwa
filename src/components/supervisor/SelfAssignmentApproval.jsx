import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSupervisorData, useWorkManagement } from '../../hooks/useAppData';
import { formatDateByLanguage } from '../../utils/nepaliDate';

const SelfAssignmentApproval = () => {
  const { user } = useAuth();
  const { isNepali } = useLanguage();
  const { showNotification } = useNotifications();
  const { pendingApprovals } = useSupervisorData();
  const { assignWork } = useWorkManagement();
  
  // Use centralized data instead of local state
  const pendingAssignments = pendingApprovals || [];
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Data loaded through centralized hooks
  useEffect(() => {
    console.log('📋 Pending approvals from centralized data:', pendingAssignments.length);
  }, [pendingAssignments]);

  // Approve self-assignment using centralized work assignment
  const approveAssignment = async (assignment) => {
    setProcessingId(assignment.id);
    try {
      console.log(`✅ Approving self-assignment: ${assignment.id}`);
      
      // Use centralized assignWork function
      const result = await assignWork(assignment.operatorId, {
        bundleId: assignment.bundleId,
        articleNumber: assignment.articleNumber,
        operation: assignment.operation,
        pieces: assignment.pieces,
        priority: assignment.priority || 'medium'
      });
      
      if (result.success) {
        showNotification(
          isNepali 
            ? `${assignment.operatorName} को असाइनमेन्ट स्वीकृत भयो`
            : `${assignment.operatorName}'s assignment approved`,
          'success'
        );
      }
    } catch (error) {
      console.error('❌ Failed to approve assignment:', error);
      showNotification(
        isNepali ? 'असाइनमेन्ट अप्रूभ गर्न असफल' : 'Failed to approve assignment',
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Reject self-assignment
  const rejectAssignment = async (assignment) => {
    setProcessingId(assignment.id);
    try {
      console.log(`❌ Rejecting self-assignment: ${assignment.id}`);
      
      showNotification(
        isNepali 
          ? `${assignment.operatorName} को असाइनमेन्ट रिजेक्ट भयो`
          : `${assignment.operatorName}'s assignment rejected`,
        'warning'
      );
    } catch (error) {
      console.error('❌ Failed to reject assignment:', error);
      showNotification(
        isNepali ? 'असाइनमेन्ट रिजेक्ट गर्न असफल' : 'Failed to reject assignment',
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isNepali ? 'लोड गर्दै...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (pendingAssignments.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isNepali ? 'कुनै पेन्डिङ अप्रूभल छैन' : 'No Pending Approvals'}
        </h3>
        <p className="text-gray-500">
          {isNepali 
            ? 'सबै सेल्फ असाइनमेन्टहरू अप्रूभ गरिएका छन्'
            : 'All self-assignments have been approved'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isNepali ? 'सेल्फ असाइनमेन्ट अप्रूभल' : 'Self-Assignment Approvals'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isNepali 
              ? `${pendingAssignments.length} असाइनमेन्ट अप्रूभलको प्रतीक्षामा छ`
              : `${pendingAssignments.length} assignments pending approval`}
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {pendingAssignments.map((assignment) => (
            <div key={assignment.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {assignment.operatorName?.charAt(0) || 'O'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {assignment.operatorName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isNepali ? 'आर्टिकल' : 'Article'}: {assignment.articleNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isNepali ? 'अपरेशन' : 'Operation'}: {assignment.operation}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {assignment.pieces} {isNepali ? 'टुक्रा' : 'pieces'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateByLanguage(assignment.assignedAt, isNepali)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => rejectAssignment(assignment)}
                    disabled={processingId === assignment.id}
                    className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {processingId === assignment.id ? '...' : (isNepali ? 'रिजेक्ट' : 'Reject')}
                  </button>
                  
                  <button
                    onClick={() => approveAssignment(assignment)}
                    disabled={processingId === assignment.id}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {processingId === assignment.id ? '...' : (isNepali ? 'अप्रूभ' : 'Approve')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelfAssignmentApproval;