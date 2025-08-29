import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { db, collection, getDocs, query, where, orderBy, doc, updateDoc, serverTimestamp, COLLECTIONS } from '../../config/firebase';
import { updateBundleWithReadableId } from '../../utils/bundleIdGenerator';
import { formatDateByLanguage } from '../../utils/nepaliDate';

const SelfAssignmentApproval = () => {
  const { user } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);
  
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Load pending self-assignments that need approval
  const loadPendingAssignments = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('🔍 Loading pending self-assignments for supervisor approval...');
      
      // First, load all operators to get names
      const operatorsQuery = query(collection(db, COLLECTIONS.OPERATORS));
      const operatorsSnapshot = await getDocs(operatorsQuery);
      const operatorsMap = {};
      operatorsSnapshot.forEach(doc => {
        const operatorData = doc.data();
        operatorsMap[doc.id] = operatorData.name || operatorData.nameEn || operatorData.username || 'Unknown Operator';
      });
      
      const assignments = [];
      
      // Check workItems collection for self-assignments
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where('status', '==', 'self_assigned')
      );
      
      const workItemsSnapshot = await getDocs(workItemsQuery);
      console.log(`🔍 Found ${workItemsSnapshot.docs.length} work items with status 'self_assigned'`);
      
      // Debug: check what statuses exist in the work items collection
      const allWorkItemsQuery = query(collection(db, COLLECTIONS.WORK_ITEMS));
      const allWorkItemsSnapshot = await getDocs(allWorkItemsQuery);
      const statuses = {};
      allWorkItemsSnapshot.forEach(doc => {
        const status = doc.data().status;
        statuses[status] = (statuses[status] || 0) + 1;
      });
      console.log(`🔍 All work item statuses in database:`, statuses);
      
      workItemsSnapshot.forEach((doc) => {
        const workData = doc.data();
        console.log(`🔍 Checking work item ${doc.id}:`, {
          status: workData.status,
          assignedOperator: workData.assignedOperator,
          assignedBy: workData.assignedBy,
          isSelfAssignment: workData.assignedOperator === workData.assignedBy
        });
        
        // Check if this is a self-assignment (assignedOperator === assignedBy)
        if (workData.assignedOperator === workData.assignedBy) {
          const bundleWithReadableId = updateBundleWithReadableId(workData);
          
          assignments.push({
            id: doc.id,
            type: 'work_item',
            ...workData,
            readableId: bundleWithReadableId.readableId,
            displayName: bundleWithReadableId.displayName,
            assignedAt: workData.assignedAt ? (
              workData.assignedAt.toDate ? workData.assignedAt.toDate() : 
              workData.assignedAt instanceof Date ? workData.assignedAt : 
              new Date(workData.assignedAt)
            ) : new Date(),
            operatorName: operatorsMap[workData.assignedOperator] || 'Unknown Operator'
          });
        }
      });
      
      // Check work assignments collection for self-assignments  
      const workAssignmentsQuery = query(
        collection(db, COLLECTIONS.WORK_ASSIGNMENTS),
        where('status', '==', 'self_assigned')
      );
      
      const assignmentsSnapshot = await getDocs(workAssignmentsQuery);
      assignmentsSnapshot.forEach((doc) => {
        const workData = doc.data();
        // Check if this is a self-assignment (operatorId === assignedBy)
        if (workData.operatorId === workData.assignedBy) {
          const bundleWithReadableId = updateBundleWithReadableId(workData);
          
          assignments.push({
            id: doc.id,
            type: 'work_assignment',
            ...workData,
            readableId: bundleWithReadableId.readableId,
            displayName: bundleWithReadableId.displayName,
            assignedAt: workData.assignedAt ? (
              workData.assignedAt.toDate ? workData.assignedAt.toDate() : 
              workData.assignedAt instanceof Date ? workData.assignedAt : 
              new Date(workData.assignedAt)
            ) : new Date(),
            operatorName: operatorsMap[workData.assignedOperator] || 'Unknown Operator'
          });
        }
      });
      
      // Sort assignments by assignedAt date (client-side sorting)
      assignments.sort((a, b) => {
        const dateA = a.assignedAt || new Date(0);
        const dateB = b.assignedAt || new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log(`✅ Found ${assignments.length} pending self-assignments`);
      setPendingAssignments(assignments);
      
    } catch (error) {
      console.error('❌ Failed to load pending assignments:', error);
      showNotification(
        isNepali ? 'पेन्डिङ असाइनमेन्ट लोड गर्न असफल' : 'Failed to load pending assignments',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Approve self-assignment
  const approveAssignment = async (assignment) => {
    setProcessingId(assignment.id);
    try {
      console.log(`✅ Approving self-assignment: ${assignment.id}`);
      
      const collectionName = assignment.type === 'work_item' ? COLLECTIONS.WORK_ITEMS : COLLECTIONS.WORK_ASSIGNMENTS;
      const assignmentRef = doc(db, collectionName, assignment.id);
      
      await updateDoc(assignmentRef, {
        status: 'assigned',
        approvedBy: user.id,
        approvedAt: serverTimestamp(),
        supervisorApproval: true,
        updatedAt: serverTimestamp()
      });
      
      showNotification(
        isNepali 
          ? `${assignment.operatorName} को सेल्फ-असाइनमेन्ट अनुमोदन गरियो`
          : `Approved self-assignment for ${assignment.operatorName}`,
        'success'
      );
      
      // Remove from pending list
      setPendingAssignments(prev => prev.filter(item => item.id !== assignment.id));
      
    } catch (error) {
      console.error('❌ Failed to approve assignment:', error);
      showNotification(
        isNepali ? 'असाइनमेन्ट अनुमोदन गर्न असफल' : 'Failed to approve assignment',
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Reject self-assignment
  const rejectAssignment = async (assignment, reason = '') => {
    setProcessingId(assignment.id);
    try {
      console.log(`❌ Rejecting self-assignment: ${assignment.id}`);
      
      const collectionName = assignment.type === 'work_item' ? COLLECTIONS.WORK_ITEMS : COLLECTIONS.WORK_ASSIGNMENTS;
      const assignmentRef = doc(db, collectionName, assignment.id);
      
      await updateDoc(assignmentRef, {
        status: 'rejected',
        rejectedBy: user.id,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
        assignedOperator: null, // Remove operator assignment
        operatorId: null,
        assignedAt: null,
        updatedAt: serverTimestamp()
      });
      
      showNotification(
        isNepali 
          ? `${assignment.operatorName} को सेल्फ-असाइनमेन्ट अस्वीकार गरियो`
          : `Rejected self-assignment for ${assignment.operatorName}`,
        'warning'
      );
      
      // Remove from pending list
      setPendingAssignments(prev => prev.filter(item => item.id !== assignment.id));
      
    } catch (error) {
      console.error('❌ Failed to reject assignment:', error);
      showNotification(
        isNepali ? 'असाइनमेन्ट अस्वीकार गर्न असफल' : 'Failed to reject assignment',
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    loadPendingAssignments();
  }, [user?.id]);

  if (loading && pendingAssignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">{isNepali ? 'लोड गर्दै...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNepali ? '📋 सेल्फ-असाइनमेन्ट अनुमोदन' : '📋 Self-Assignment Approvals'}
          </h2>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              pendingAssignments.length > 0 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {pendingAssignments.length} {isNepali ? 'पेन्डिङ' : 'Pending'}
            </span>
            <button
              onClick={loadPendingAssignments}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄' : '↻'} {isNepali ? 'रिफ्रेस' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {pendingAssignments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isNepali ? 'कुनै पेन्डिङ असाइनमेन्ट छैन' : 'No Pending Assignments'}
            </h3>
            <p className="text-gray-500">
              {isNepali 
                ? 'सबै सेल्फ-असाइनमेन्ट अनुमोदन वा अस्वीकार गरिएको छ'
                : 'All self-assignments have been approved or rejected'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAssignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.readableId ? (
                          <span className="text-blue-600">{assignment.readableId}</span>
                        ) : (
                          assignment.displayName || `Work #${assignment.id.slice(-6)}`
                        )}
                      </h3>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                        {isNepali ? 'सेल्फ-असाइन्ड' : 'Self-Assigned'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">{isNepali ? 'ऑपरेटर:' : 'Operator:'}</span>
                        <div className="font-medium">{assignment.operatorName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">{isNepali ? 'असाइन गरिएको:' : 'Assigned:'}</span>
                        <div className="font-medium">
                          {assignment.assignedAt ? formatDateByLanguage(assignment.assignedAt, isNepali, true) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">{isNepali ? 'ऑपरेसन:' : 'Operation:'}</span>
                        <div className="font-medium">{assignment.currentOperation || assignment.operation || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">{isNepali ? 'मेसिन:' : 'Machine:'}</span>
                        <div className="font-medium">{assignment.machineType || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">{isNepali ? 'टुक्राहरू:' : 'Pieces:'}</span>
                        <div className="font-medium">{assignment.pieces || assignment.quantity || 0} pcs</div>
                      </div>
                      <div>
                        <span className="text-gray-500">{isNepali ? 'रंग/साइज:' : 'Color/Size:'}</span>
                        <div className="font-medium">{assignment.color || 'N/A'} / {assignment.size || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => approveAssignment(assignment)}
                    disabled={processingId === assignment.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50"
                  >
                    {processingId === assignment.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isNepali ? 'प्रक्रिया गर्दै...' : 'Processing...'}
                      </div>
                    ) : (
                      <>✅ {isNepali ? 'अनुमोदन गर्नुहोस्' : 'Approve'}</>
                    )}
                  </button>
                  <button
                    onClick={() => rejectAssignment(assignment)}
                    disabled={processingId === assignment.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50"
                  >
                    {processingId === assignment.id ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isNepali ? 'प्रक्रिया गर्दै...' : 'Processing...'}
                      </div>
                    ) : (
                      <>❌ {isNepali ? 'अस्वीकार गर्नुहोस्' : 'Reject'}</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfAssignmentApproval;