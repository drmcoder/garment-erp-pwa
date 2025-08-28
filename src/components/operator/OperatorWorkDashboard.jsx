import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { db, collection, getDocs, query, where, orderBy, doc, updateDoc, COLLECTIONS } from '../../config/firebase';
import { updateBundleWithReadableId } from '../../utils/bundleIdGenerator';

const OperatorWorkDashboard = () => {
  const { user } = useContext(AuthContext);
  const { currentLanguage } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [activeTab, setActiveTab] = useState('present'); // 'present', 'past', 'earnings'
  const [presentWork, setPresentWork] = useState([]);
  const [pastWork, setPastWork] = useState([]);
  const [earningsData, setEarningsData] = useState({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalEarnings: 0,
    todayPieces: 0,
    weekPieces: 0,
    monthPieces: 0
  });
  const [loading, setLoading] = useState(false);

  // Load present work (assigned but not completed by supervisor)
  const loadPresentWork = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log(`🔍 Loading present work for operator: ${user.id}`);
      
      // Load from WORK_ITEMS collection where operator is assigned
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where('assignedOperator', '==', user.id),
        where('status', 'in', ['assigned', 'in_progress', 'working']),
        orderBy('assignedAt', 'desc')
      );
      
      const workItemsSnapshot = await getDocs(workItemsQuery);
      const workList = [];
      
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
          updatedAt: workData.updatedAt?.toDate()
        });
      });

      console.log(`🔍 Found ${workList.length} work items in WORK_ITEMS collection`);

      // LEGACY: Also check work assignments collection for backward compatibility
      try {
        const legacyWorkQuery = query(
          collection(db, COLLECTIONS.WORK_ASSIGNMENTS),
          where('operatorId', '==', user.id),
          where('status', 'in', ['assigned', 'in_progress', 'working']),
          orderBy('assignedAt', 'desc')
        );
        
        const legacyWorkSnapshot = await getDocs(legacyWorkQuery);
        legacyWorkSnapshot.forEach((doc) => {
          const workData = doc.data();
          const bundleWithReadableId = updateBundleWithReadableId(workData);
          
          workList.push({
            id: doc.id,
            type: 'legacy_assignment',
            ...workData,
            readableId: bundleWithReadableId.readableId,
            displayName: bundleWithReadableId.displayName,
            assignedAt: workData.assignedAt?.toDate(),
            startedAt: workData.startedAt?.toDate(),
            updatedAt: workData.updatedAt?.toDate()
          });
        });
        console.log(`🔍 Found ${legacyWorkSnapshot.docs.length} legacy assignments`);
      } catch (legacyError) {
        console.warn('⚠️ Could not load legacy work assignments:', legacyError);
      }

      // LEGACY: Also check WIP entries for backward compatibility
      try {
        const wipQuery = query(
          collection(db, COLLECTIONS.WIP_ENTRIES),
          where('assignedOperator', '==', user.id),
          where('status', 'in', ['assigned', 'in_progress']),
          orderBy('createdAt', 'desc')
        );
        
        const wipSnapshot = await getDocs(wipQuery);
        wipSnapshot.forEach((doc) => {
          const wipData = doc.data();
          const bundleWithReadableId = updateBundleWithReadableId(wipData);
          
          workList.push({
            id: doc.id,
            type: 'wip_entry',
            ...wipData,
            readableId: bundleWithReadableId.readableId,
            displayName: bundleWithReadableId.displayName,
            assignedAt: wipData.assignedAt?.toDate() || wipData.createdAt?.toDate(),
            createdAt: wipData.createdAt?.toDate()
          });
        });
        console.log(`🔍 Found ${wipSnapshot.docs.length} assigned WIP entries`);
      } catch (wipError) {
        console.warn('⚠️ Could not load WIP entries:', wipError);
      }

      setPresentWork(workList);
      console.log(`✅ Loaded total ${workList.length} present work items for operator ${user.name}`);
    } catch (error) {
      console.error('❌ Failed to load present work:', error);
      showNotification(
        currentLanguage === 'np' ? 'वर्तमान काम लोड गर्न असफल' : 'Failed to load present work',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load past completed work
  const loadPastWork = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load completed work assignments
      const completedWorkQuery = query(
        collection(db, COLLECTIONS.WORK_ASSIGNMENTS),
        where('operatorId', '==', user.id),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );
      
      const completedSnapshot = await getDocs(completedWorkQuery);
      const completedList = [];
      
      completedSnapshot.forEach((doc) => {
        const workData = doc.data();
        completedList.push({
          id: doc.id,
          ...workData,
          assignedAt: workData.assignedAt?.toDate(),
          startedAt: workData.startedAt?.toDate(),
          completedAt: workData.completedAt?.toDate(),
          submittedAt: workData.submittedAt?.toDate()
        });
      });

      setPastWork(completedList);
      console.log(`✅ Loaded ${completedList.length} past work items for operator ${user.name}`);
    } catch (error) {
      console.error('❌ Failed to load past work:', error);
      showNotification(
        currentLanguage === 'np' ? 'पुराना काम लोड गर्न असफल' : 'Failed to load past work',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate earnings
  const calculateEarnings = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all completed work with earnings
      const earningsQuery = query(
        collection(db, COLLECTIONS.WORK_ASSIGNMENTS),
        where('operatorId', '==', user.id),
        where('status', '==', 'completed'),
        where('earnings', '>', 0)
      );

      const earningsSnapshot = await getDocs(earningsQuery);
      let totalEarnings = 0;
      let todayEarnings = 0;
      let weekEarnings = 0;
      let monthEarnings = 0;
      let todayPieces = 0;
      let weekPieces = 0;
      let monthPieces = 0;

      earningsSnapshot.forEach((doc) => {
        const workData = doc.data();
        const earnings = workData.earnings || 0;
        const pieces = workData.pieces || workData.actualPieces || 0;
        const completedAt = workData.completedAt?.toDate();

        totalEarnings += earnings;

        if (completedAt >= todayStart) {
          todayEarnings += earnings;
          todayPieces += pieces;
        }
        if (completedAt >= weekStart) {
          weekEarnings += earnings;
          weekPieces += pieces;
        }
        if (completedAt >= monthStart) {
          monthEarnings += earnings;
          monthPieces += pieces;
        }
      });

      setEarningsData({
        totalEarnings,
        todayEarnings,
        weekEarnings,
        monthEarnings,
        todayPieces,
        weekPieces,
        monthPieces
      });

      console.log('✅ Calculated earnings:', { totalEarnings, todayEarnings, todayPieces });
    } catch (error) {
      console.error('❌ Failed to calculate earnings:', error);
    }
  };

  // Submit work as completed by operator (supervisor still needs to approve)
  const handleWorkSubmit = async (workItem) => {
    try {
      const workRef = doc(db, COLLECTIONS.WORK_ASSIGNMENTS, workItem.id);
      await updateDoc(workRef, {
        status: 'operator_completed',
        operatorCompletedAt: new Date(),
        updatedAt: new Date()
      });

      showNotification(
        currentLanguage === 'np' 
          ? 'काम पूरा गरिएको रूपमा सबमिट गरियो। सुपरवाइजर अनुमोदनको पर्खाइमा।' 
          : 'Work submitted as completed. Waiting for supervisor approval.',
        'success'
      );

      // Refresh present work
      loadPresentWork();
    } catch (error) {
      console.error('❌ Failed to submit work:', error);
      showNotification(
        currentLanguage === 'np' ? 'काम सबमिट गर्न असफल' : 'Failed to submit work',
        'error'
      );
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'present') {
      loadPresentWork();
    } else if (activeTab === 'past') {
      loadPastWork();
    } else if (activeTab === 'earnings') {
      calculateEarnings();
    }
  }, [activeTab, user?.id]);

  // Render work item card
  const renderWorkItem = (workItem, isPast = false) => {
    const statusColors = {
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      working: 'bg-orange-100 text-orange-800',
      operator_completed: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    };

    const statusText = {
      assigned: currentLanguage === 'np' ? 'नियुक्त' : 'Assigned',
      in_progress: currentLanguage === 'np' ? 'प्रगतिमा' : 'In Progress',
      working: currentLanguage === 'np' ? 'काम गर्दै' : 'Working',
      operator_completed: currentLanguage === 'np' ? 'ऑपरेटरले पूरा' : 'Operator Completed',
      completed: currentLanguage === 'np' ? 'पूरा' : 'Completed'
    };

    return (
      <div key={workItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {workItem.type === 'wip' ? `WIP: ${workItem.lotNumber}` : `Bundle: ${workItem.bundleId || workItem.id}`}
            </h3>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'लेख:' : 'Article:'} {workItem.article || workItem.articleNumber || 'N/A'}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[workItem.status] || 'bg-gray-100 text-gray-800'}`}>
            {statusText[workItem.status] || workItem.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{currentLanguage === 'np' ? 'रंग:' : 'Color:'}</span>
            <span className="ml-1 font-medium">{workItem.color || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">{currentLanguage === 'np' ? 'टुक्राहरू:' : 'Pieces:'}</span>
            <span className="ml-1 font-medium">{workItem.pieces || workItem.quantity || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">{currentLanguage === 'np' ? 'दर:' : 'Rate:'}</span>
            <span className="ml-1 font-medium">Rs. {workItem.rate || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">{currentLanguage === 'np' ? 'कुल:' : 'Total:'}</span>
            <span className="ml-1 font-medium text-green-600">Rs. {workItem.earnings || (workItem.pieces * workItem.rate) || 0}</span>
          </div>
        </div>

        {workItem.operation && (
          <div className="mt-3 text-sm">
            <span className="text-gray-500">{currentLanguage === 'np' ? 'अपरेसन:' : 'Operation:'}</span>
            <span className="ml-1 font-medium">{workItem.operation}</span>
          </div>
        )}

        <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
          <div>
            {currentLanguage === 'np' ? 'नियुक्त:' : 'Assigned:'} {workItem.assignedAt?.toLocaleDateString() || 'N/A'}
          </div>
          {isPast && workItem.completedAt && (
            <div>
              {currentLanguage === 'np' ? 'पूरा:' : 'Completed:'} {workItem.completedAt.toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Action buttons for present work */}
        {!isPast && workItem.status === 'in_progress' && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => handleWorkSubmit(workItem)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {currentLanguage === 'np' ? '🏁 काम पूरा गरियो' : '🏁 Mark Complete'}
            </button>
          </div>
        )}

        {!isPast && workItem.status === 'operator_completed' && (
          <div className="mt-4 text-center text-sm text-purple-600 font-medium">
            {currentLanguage === 'np' 
              ? '⏳ सुपरवाइजर अनुमोदनको पर्खाइमा' 
              : '⏳ Awaiting Supervisor Approval'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentLanguage === 'np' ? '🎯 मेरो काम ड्यासबोर्ड' : '🎯 My Work Dashboard'}
        </h1>
        <p className="text-gray-600">
          {currentLanguage === 'np' 
            ? 'तपाईंको वर्तमान काम, पुराना काम, र आम्दानी ट्र्याक गर्नुहोस्'
            : 'Track your current work, past work, and earnings'}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('present')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'present'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {currentLanguage === 'np' ? '📋 वर्तमान काम' : '📋 Present Work'}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {currentLanguage === 'np' ? '✅ पुराना काम' : '✅ Past Work'}
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'earnings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {currentLanguage === 'np' ? '💰 आम्दानी' : '💰 Earnings'}
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* Present Work Tab */}
          {activeTab === 'present' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {currentLanguage === 'np' ? 'वर्तमान काम' : 'Present Work'}
                <span className="ml-2 text-sm text-gray-500">({presentWork.length})</span>
              </h2>
              {presentWork.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-gray-600">
                    {currentLanguage === 'np' ? 'कुनै वर्तमान काम छैन' : 'No present work assigned'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {presentWork.map(workItem => renderWorkItem(workItem, false))}
                </div>
              )}
            </div>
          )}

          {/* Past Work Tab */}
          {activeTab === 'past' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {currentLanguage === 'np' ? 'पुराना काम' : 'Past Work'}
                <span className="ml-2 text-sm text-gray-500">({pastWork.length})</span>
              </h2>
              {pastWork.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-gray-600">
                    {currentLanguage === 'np' ? 'कुनै पुराना काम छैन' : 'No past work completed'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastWork.map(workItem => renderWorkItem(workItem, true))}
                </div>
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div>
              <h2 className="text-lg font-semibold mb-6">
                {currentLanguage === 'np' ? 'आम्दानी सारांश' : 'Earnings Summary'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Today */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-2xl font-bold text-blue-600">Rs. {earningsData.todayEarnings}</div>
                  <div className="text-sm text-blue-800 font-medium">
                    {currentLanguage === 'np' ? 'आजको आम्दानी' : "Today's Earnings"}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {earningsData.todayPieces} {currentLanguage === 'np' ? 'टुक्राहरू' : 'pieces'}
                  </div>
                </div>

                {/* This Week */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="text-2xl font-bold text-green-600">Rs. {earningsData.weekEarnings}</div>
                  <div className="text-sm text-green-800 font-medium">
                    {currentLanguage === 'np' ? 'यो हप्ताको आम्दानी' : "This Week's Earnings"}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {earningsData.weekPieces} {currentLanguage === 'np' ? 'टुक्राहरू' : 'pieces'}
                  </div>
                </div>

                {/* This Month */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="text-2xl font-bold text-purple-600">Rs. {earningsData.monthEarnings}</div>
                  <div className="text-sm text-purple-800 font-medium">
                    {currentLanguage === 'np' ? 'यो महिनाको आम्दानी' : "This Month's Earnings"}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {earningsData.monthPieces} {currentLanguage === 'np' ? 'टुक्राहरू' : 'pieces'}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="text-2xl font-bold text-orange-600">Rs. {earningsData.totalEarnings}</div>
                  <div className="text-sm text-orange-800 font-medium">
                    {currentLanguage === 'np' ? 'कुल आम्दानी' : 'Total Earnings'}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {currentLanguage === 'np' ? 'सबै समय' : 'All time'}
                  </div>
                </div>
              </div>

              {/* Earnings breakdown could be added here */}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OperatorWorkDashboard;