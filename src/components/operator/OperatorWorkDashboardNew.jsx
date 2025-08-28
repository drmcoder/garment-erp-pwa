import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { db, collection, getDocs, query, where, orderBy, doc, updateDoc, addDoc, COLLECTIONS } from '../../config/firebase';
import { updateBundleWithReadableId } from '../../utils/bundleIdGenerator';
import { formatDateByLanguage } from '../../utils/nepaliDate';

const OperatorWorkDashboardNew = () => {
  const { user } = useContext(AuthContext);
  const { currentLanguage } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [currentWork, setCurrentWork] = useState(null); // Currently active work
  const [readyWork, setReadyWork] = useState([]); // Work ready to start
  const [completedWork, setCompletedWork] = useState([]); // Recent completed work
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    todayPieces: 0,
    todayEarnings: 0,
    completedToday: 0,
    totalAssigned: 0
  });

  const isNepali = currentLanguage === 'np';

  // Load operator's work data
  const loadWorkData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const workList = [];
      
      // Load from work items collection
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where('assignedOperator', '==', user.id),
        orderBy('assignedAt', 'desc')
      );
      
      const workItemsSnapshot = await getDocs(workItemsQuery);
      workItemsSnapshot.forEach((doc) => {
        const workData = doc.data();
        const bundleWithReadableId = updateBundleWithReadableId(workData);
        
        workList.push({
          id: doc.id,
          type: 'work_item',
          ...workData,
          readableId: bundleWithReadableId.readableId,
          displayName: bundleWithReadableId.displayName,
          assignedAt: workData.assignedAt?.toDate(),
          startedAt: workData.startedAt?.toDate(),
          completedAt: workData.completedAt?.toDate(),
          updatedAt: workData.updatedAt?.toDate()
        });
      });

      // Categorize work by status
      const inProgress = workList.find(w => w.status === 'in_progress');
      const assigned = workList.filter(w => ['assigned', 'self_assigned'].includes(w.status));
      const completed = workList.filter(w => ['completed', 'operator_completed'].includes(w.status)).slice(0, 5);
      
      setCurrentWork(inProgress || null);
      setReadyWork(assigned);
      setCompletedWork(completed);
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCompleted = workList.filter(w => 
        ['completed', 'operator_completed'].includes(w.status) && 
        (w.completedAt || w.operatorCompletedAt) && 
        (w.completedAt >= today || w.operatorCompletedAt >= today)
      );
      
      setStats({
        todayPieces: todayCompleted.reduce((sum, w) => sum + (w.pieces || 0), 0),
        todayEarnings: todayCompleted.reduce((sum, w) => sum + (w.earnings || w.pieces * (w.rate || 0)), 0),
        completedToday: todayCompleted.length,
        totalAssigned: assigned.length
      });
      
    } catch (error) {
      console.error('❌ Failed to load work data:', error);
      showNotification(
        isNepali ? 'काम डेटा लोड गर्न असफल' : 'Failed to load work data',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Start work
  const handleStartWork = async (workItem) => {
    try {
      const workRef = doc(db, COLLECTIONS.WORK_ITEMS, workItem.id);
      await updateDoc(workRef, {
        status: 'in_progress',
        startedAt: new Date(),
        updatedAt: new Date()
      });

      showNotification(
        isNepali ? '🚀 काम सुरु भयो!' : '🚀 Work started!',
        'success'
      );
      
      loadWorkData();
    } catch (error) {
      console.error('❌ Failed to start work:', error);
      showNotification(
        isNepali ? 'काम सुरु गर्न असफल' : 'Failed to start work',
        'error'
      );
    }
  };

  // Complete work
  const handleCompleteWork = async (workItem) => {
    try {
      // Calculate earnings based on pieces and rate
      const pieces = workItem.pieces || 0;
      const rate = workItem.rate || 0;
      const earnings = pieces * rate;
      
      const completionData = {
        status: 'operator_completed',
        operatorCompletedAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date(),
        earnings: earnings,
        completedPieces: pieces
      };

      const workRef = doc(db, COLLECTIONS.WORK_ITEMS, workItem.id);
      await updateDoc(workRef, completionData);

      // Add to payroll history
      try {
        const payrollEntry = {
          operatorId: user.id,
          operatorName: user.name || user.nameEn,
          workItemId: workItem.id,
          articleNumber: workItem.articleNumber,
          operation: workItem.operation,
          pieces: pieces,
          rate: rate,
          earnings: earnings,
          completedAt: new Date(),
          bundleId: workItem.bundleId,
          readableId: workItem.readableId,
          status: 'completed',
          paymentStatus: 'pending'
        };

        await addDoc(collection(db, 'payrollEntries'), payrollEntry);
        
        // Show earnings notification
        showNotification(
          isNepali 
            ? `🎉 काम पूरा! ${pieces} टुक्रा, Rs. ${earnings.toFixed(2)} कमाइयो। सुपरवाइजर अनुमोदनको पर्खाइमा।`
            : `🎉 Work completed! ${pieces} pieces, Rs. ${earnings.toFixed(2)} earned. Waiting for supervisor approval.`,
          'success'
        );

      } catch (payrollError) {
        console.error('Failed to add payroll entry:', payrollError);
        // Still show success for work completion even if payroll fails
        showNotification(
          isNepali 
            ? `🎉 काम पूरा! ${pieces} टुक्रा, Rs. ${earnings.toFixed(2)} कमाइयो।`
            : `🎉 Work completed! ${pieces} pieces, Rs. ${earnings.toFixed(2)} earned.`,
          'success'
        );
      }
      
      loadWorkData();
    } catch (error) {
      console.error('❌ Failed to complete work:', error);
      showNotification(
        isNepali ? 'काम पूरा गर्न असफल' : 'Failed to complete work',
        'error'
      );
    }
  };

  useEffect(() => {
    loadWorkData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{isNepali ? 'लोड गर्दै...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNepali ? '👋 नमस्ते,' : '👋 Hello,'} {user?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {isNepali ? 'आजको काम प्रगति' : 'Today\'s Work Progress'}
              </p>
            </div>
            <button
              onClick={loadWorkData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '🔄' : '↻'} {isNepali ? 'रिफ्रेस' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isNepali ? 'आज पूरा' : 'Completed Today'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isNepali ? 'आज टुक्राहरू' : 'Pieces Today'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayPieces}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isNepali ? 'आज कमाई' : 'Earnings Today'}</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {stats.todayEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{isNepali ? 'बाँकी काम' : 'Pending Work'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssigned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Work - Hero Section */}
        {currentWork ? (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-4xl">🚀</span>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isNepali ? 'हाल गरिरहेको काम' : 'Currently Working On'}
                    </h2>
                    <p className="text-green-100 text-sm">
                      {isNepali ? 'प्रगतिमा रहेको काम' : 'Work in progress'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        {currentWork.readableId || `Work #${currentWork.id.slice(-6)}`}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">{isNepali ? 'ऑपरेसन:' : 'Operation:'}</span> {currentWork.currentOperation || 'N/A'}</p>
                        <p><span className="font-medium">{isNepali ? 'रंग:' : 'Color:'}</span> {currentWork.color || 'N/A'}</p>
                        <p><span className="font-medium">{isNepali ? 'साइज:' : 'Size:'}</span> {currentWork.size || 'N/A'}</p>
                        <p><span className="font-medium">{isNepali ? 'टुक्राहरू:' : 'Pieces:'}</span> {currentWork.pieces || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold">Rs. {currentWork.rate || 0}</div>
                        <div className="text-green-100 text-sm">{isNepali ? 'दर प्रति टुक्रा' : 'Rate per piece'}</div>
                      </div>
                      
                      <button
                        onClick={() => handleCompleteWork(currentWork)}
                        className="w-full bg-white text-green-600 font-bold py-4 rounded-xl hover:bg-green-50 transition-all transform hover:scale-105 shadow-lg"
                      >
                        🏁 {isNepali ? 'काम पूरा गर्नुहोस्' : 'Complete Work'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">😴</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              {isNepali ? 'कुनै सक्रिय काम छैन' : 'No Active Work'}
            </h2>
            <p className="text-gray-600">
              {isNepali ? 'तलबाट नयाँ काम सुरु गर्नुहोस्' : 'Start new work from below'}
            </p>
          </div>
        )}

        {/* Ready to Start Work */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {isNepali ? '📋 सुरु गर्न तयार काम' : '📋 Ready to Start'}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {readyWork.length} {isNepali ? 'काम' : 'items'}
                </span>
                {readyWork.length > 5 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                    {isNepali ? 'पहिलो ५ देखाइएको' : 'Showing first 5'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {readyWork.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isNepali ? 'कुनै नयाँ काम छैन' : 'No New Work Available'}
                </h3>
                <p className="text-gray-500">
                  {isNepali ? 'सुपरवाइजरले नयाँ काम असाइन गरेसम्म पर्खनुहोस्' : 'Wait for supervisor to assign new work'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {readyWork.slice(0, 5).map((workItem) => (
                  <div key={workItem.id} className="border-2 border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition-all transform hover:scale-102 bg-gradient-to-br from-white to-gray-50">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {workItem.readableId ? (
                          <span className="text-blue-600">{workItem.readableId}</span>
                        ) : (
                          `#${workItem.id.slice(-6)}`
                        )}
                      </h3>
                      {workItem.status === 'self_assigned' && (
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                          {isNepali ? 'पर्खाइमा' : 'Pending'}
                        </span>
                      )}
                    </div>

                    {/* Key Details in Cards */}
                    <div className="space-y-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-600 font-medium">
                            {isNepali ? 'ऑपरेसन' : 'Operation'}
                          </span>
                          <span className="font-semibold text-blue-900">
                            {workItem.currentOperation || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-xs text-purple-600">{isNepali ? 'रंग' : 'Color'}</div>
                          <div className="font-medium text-purple-900 text-sm">{workItem.color || 'N/A'}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <div className="text-xs text-green-600">{isNepali ? 'टुक्रा' : 'Pieces'}</div>
                          <div className="font-bold text-green-900">{workItem.pieces || 0}</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2">
                          <div className="text-xs text-yellow-600">{isNepali ? 'दर' : 'Rate'}</div>
                          <div className="font-bold text-yellow-900">₹{workItem.rate || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Earnings Preview */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">
                          💰 {isNepali ? 'कुल कमाई' : 'Total Earnings'}
                        </span>
                        <span className="text-lg font-bold text-green-800">
                          ₹{((workItem.pieces || 0) * (workItem.rate || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-2">
                      {workItem.status === 'assigned' ? (
                        <button
                          onClick={() => handleStartWork(workItem)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                        >
                          <span className="text-lg">🚀</span>
                          <span>{isNepali ? 'काम सुरु गर्नुहोस्' : 'Start Work'}</span>
                        </button>
                      ) : (
                        <div className="w-full bg-orange-100 text-orange-800 px-4 py-3 rounded-xl text-sm font-medium text-center flex items-center justify-center space-x-2">
                          <span>⏳</span>
                          <span>{isNepali ? 'अनुमोदन पर्खाइमा' : 'Awaiting Approval'}</span>
                        </div>
                      )}

                      {/* Assigned time */}
                      <div className="text-xs text-gray-500 text-center mt-2">
                        {isNepali ? 'असाइन:' : 'Assigned:'} {workItem.assignedAt ? formatDateByLanguage(workItem.assignedAt, isNepali, true) : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Completed Work */}
        {completedWork.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {isNepali ? '🎉 हाल पूरा भएका काम' : '🎉 Recently Completed'}
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {completedWork.map((workItem) => (
                  <div key={workItem.id} className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">
                        {workItem.readableId || `Work #${workItem.id.slice(-6)}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {workItem.pieces || 0} pcs • Rs. {workItem.rate || 0} • {workItem.currentOperation || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-bold">Rs. {(workItem.pieces || 0) * (workItem.rate || 0)}</div>
                      <div className="text-xs text-gray-500">
                        {workItem.completedAt ? formatDateByLanguage(workItem.completedAt, isNepali) : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorWorkDashboardNew;