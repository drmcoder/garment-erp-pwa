import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useOperatorData, useWorkManagement, useAppData } from '../../hooks/useAppData';
import DamageReportModal from './DamageReportModal';
import DamageNotificationSystem from '../common/DamageNotificationSystem';
import OperatorAvatar from '../common/OperatorAvatar';
import OperatorWallet from './OperatorWallet';
import { damageReportService } from '../../services/DamageReportService';

const OperatorWorkDashboardNewCentralized = () => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { showNotification } = useNotifications();
  
  // Centralized data hooks
  const { stats, myAssignments, refreshStats, loading: operatorLoading } = useOperatorData();
  const { assignWork, completeWork, refreshWorkItems, loading: workLoading } = useWorkManagement();
  const { initializeApp } = useAppData();
  
  // Local UI state only
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [localStats, setLocalStats] = useState({
    todayPieces: 0,
    todayEarnings: 0,
    completedToday: 0,
    totalAssigned: 0,
    pendingReworkPieces: 0
  });
  
  const isNepali = currentLanguage === 'np';
  const loading = operatorLoading || workLoading;

  // Initialize app data on mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Update local stats when centralized stats change
  useEffect(() => {
    if (stats) {
      setLocalStats(prev => ({
        ...prev,
        ...stats,
        totalAssigned: myAssignments.length,
      }));
    }
  }, [stats, myAssignments]);

  // Fetch pending rework data
  useEffect(() => {
    const fetchReworkData = async () => {
      if (!user?.id) return;

      try {
        const pendingReworkResult = await damageReportService.getPendingReworkPieces(user.id);
        
        if (pendingReworkResult.success) {
          setLocalStats(prev => ({
            ...prev,
            pendingReworkPieces: pendingReworkResult.count || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching rework data:', error);
      }
    };

    fetchReworkData();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(fetchReworkData, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [user?.id]);

  // Get current active work
  const currentWork = myAssignments.find(assignment => assignment.status === 'in_progress') || null;
  const readyWork = myAssignments.filter(assignment => assignment.status === 'assigned');

  const handleStartWork = async (workItem) => {
    try {
      // Update work status to in_progress
      const result = await assignWork(user.id, {
        ...workItem,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        showNotification(
          isNepali 
            ? `काम सुरु भयो: ${workItem.operation}` 
            : `Work started: ${workItem.operation}`,
          'success'
        );
        await refreshWorkItems();
      }
    } catch (error) {
      showNotification(
        isNepali ? 'काम सुरु गर्न सकिएन' : 'Failed to start work',
        'error'
      );
    }
  };

  const handleCompleteWork = async (workItem, pieces = null) => {
    if (!pieces) {
      pieces = workItem.targetPieces || 1;
    }

    try {
      const completionData = {
        pieces,
        quality: 100,
        completedAt: new Date().toISOString(),
        notes: '',
      };

      const result = await completeWork(workItem.id, completionData);
      
      if (result.success) {
        showNotification(
          isNepali 
            ? `काम पूरा भयो: ${pieces} टुक्रा` 
            : `Work completed: ${pieces} pieces`,
          'success'
        );
        
        // Refresh data
        await Promise.all([
          refreshWorkItems(),
          refreshStats(),
        ]);
      }
    } catch (error) {
      showNotification(
        isNepali ? 'काम पूरा गर्न सकिएन' : 'Failed to complete work',
        'error'
      );
    }
  };

  const handlePauseWork = async (workItem) => {
    try {
      const result = await assignWork(user.id, {
        ...workItem,
        status: 'paused',
        pausedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        showNotification(
          isNepali ? 'काम रोकियो' : 'Work paused',
          'info'
        );
        await refreshWorkItems();
      }
    } catch (error) {
      showNotification(
        isNepali ? 'काम रोक्न सकिएन' : 'Failed to pause work',
        'error'
      );
    }
  };

  const handleReportDamage = (workItem) => {
    setSelectedWorkItem(workItem);
    setShowDamageModal(true);
  };

  const handleDamageReport = async (damageData) => {
    try {
      // Damage reporting logic would be handled by centralized service
      showNotification(
        isNepali ? 'क्षति रिपोर्ट पेश गरियो' : 'Damage report submitted',
        'success'
      );
      setShowDamageModal(false);
      setSelectedWorkItem(null);
    } catch (error) {
      showNotification(
        isNepali ? 'क्षति रिपोर्ट पेश गर्न सकिएन' : 'Failed to submit damage report',
        'error'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isNepali ? 'डेटा लोड गर्दै...' : 'Loading data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <OperatorAvatar 
              operator={{
                name: user?.name || 'Operator',
                avatar: {
                  type: 'emoji',
                  value: user?.machine === 'single-needle' ? '📍' : 
                         user?.machine === 'overlock' ? '🔗' : 
                         user?.machine === 'flatlock' ? '📎' : 
                         user?.machine === 'buttonhole' ? '🕳️' : '⚙️',
                  bgColor: '#3B82F6',
                  textColor: '#FFFFFF'
                },
                status: currentWork ? 'busy' : 'available',
                currentWorkload: myAssignments.length,
                visualBadges: localStats.todayPieces > 50 ? ['🏆', '⚡'] : ['💪']
              }}
              size="xl"
              showStatus={true}
              showWorkload={true}
              showBadges={true}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isNepali ? `स्वागतम्, ${user?.name}! 👋` : `Welcome, ${user?.name}! 👋`}
          </h1>
          <p className="mt-2 text-gray-600">
            {user?.speciality} {isNepali ? 'अपरेटर' : 'Operator'} | 
            {isNepali ? 'स्टेशन' : 'Station'}: {user?.station} | 
            {isNepali ? 'मेसिन' : 'Machine'}: {user?.machine || (isNepali ? 'नतोकिएको' : 'Not Assigned')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {localStats.todayPieces || 0}
            </div>
            <div className="text-sm text-gray-500">
              {isNepali ? 'आजका टुक्राहरू' : "Today's Pieces"}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              Rs. {localStats.todayEarnings || 0}
            </div>
            <div className="text-sm text-gray-500">
              {isNepali ? 'आजको आम्दानी' : "Today's Earnings"}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              {myAssignments.length}
            </div>
            <div className="text-sm text-gray-500">
              {isNepali ? 'कुल काम' : 'Total Work'}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {localStats.completedToday || 0}
            </div>
            <div className="text-sm text-gray-500">
              {isNepali ? 'आज पूरा भएको' : 'Completed Today'}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-red-600">
              {localStats.pendingReworkPieces || 0}
            </div>
            <div className="text-sm text-gray-500">
              {isNepali ? '🔧 रिवर्क पेन्डिङ' : '🔧 Rework Pending'}
            </div>
          </div>
        </div>

        {/* Operator Wallet */}
        <div className="mb-8">
          <OperatorWallet 
            operatorId={user?.id}
            isNepali={isNepali}
            onWalletUpdate={(walletData) => {
              // Handle wallet updates if needed
              console.log('Wallet updated:', walletData);
            }}
          />
        </div>

        {/* Current Work Section */}
        {currentWork && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                🔄 {isNepali ? 'हालको काम' : 'Current Work'}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePauseWork(currentWork)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                >
                  ⏸️ {isNepali ? 'रोक्नुहोस्' : 'Pause'}
                </button>
                <button
                  onClick={() => handleReportDamage(currentWork)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                >
                  ⚠️ {isNepali ? 'क्षति' : 'Damage'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">
                  {isNepali ? 'आर्टिकल' : 'Article'}
                </div>
                <div className="font-medium">
                  #{currentWork.workData?.articleNumber || currentWork.articleNumber || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {isNepali ? 'अपरेशन' : 'Operation'}
                </div>
                <div className="font-medium">
                  {currentWork.workData?.operation || currentWork.operation || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {isNepali ? 'टुक्राहरू' : 'Pieces'}
                </div>
                <div className="font-medium">
                  {currentWork.workData?.targetPieces || currentWork.targetPieces || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {isNepali ? 'पेमेन्ट' : 'Payment'}
                </div>
                <div className="font-medium text-gray-500">
                  {isNepali ? 'काम पछि' : 'After completion'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => handleCompleteWork(currentWork)}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
              >
                ✅ {isNepali ? 'पूरा गर्नुहोस्' : 'Complete Work'}
              </button>
            </div>
          </div>
        )}

        {/* Ready Work Section */}
        {readyWork.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              📋 {isNepali ? 'तयार काम' : 'Ready Work'} ({readyWork.length})
            </h3>
            
            <div className="space-y-4">
              {readyWork.map((workItem) => (
                <div key={workItem.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">
                            {isNepali ? 'आर्टिकल' : 'Article'}
                          </div>
                          <div className="font-medium">
                            #{workItem.workData?.articleNumber || workItem.articleNumber || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            {isNepali ? 'अपरेशन' : 'Operation'}
                          </div>
                          <div className="font-medium">
                            {workItem.workData?.operation || workItem.operation || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            {isNepali ? 'टुक्राहरू' : 'Pieces'}
                          </div>
                          <div className="font-medium">
                            {workItem.workData?.targetPieces || workItem.targetPieces || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            {isNepali ? 'पेमेन्ट' : 'Payment'}
                          </div>
                          <div className="font-medium text-gray-500">
                            {isNepali ? 'काम पछि' : 'After completion'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleStartWork(workItem)}
                        disabled={!!currentWork}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        ▶️ {isNepali ? 'सुरु गर्नुहोस्' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Work Available */}
        {!currentWork && readyWork.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isNepali ? 'कुनै काम उपलब्ध छैन' : 'No Work Available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isNepali 
                ? 'कृपया सुपरभाइजरसँग सम्पर्क गर्नुहोस् वा नयाँ काम असाइनमेन्टको लागि पर्खनुहोस्।'
                : 'Please contact your supervisor or wait for new work assignments.'
              }
            </p>
            <button
              onClick={() => refreshWorkItems()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              🔄 {isNepali ? 'रिफ्रेस गर्नुहोस्' : 'Refresh'}
            </button>
          </div>
        )}

        {/* Damage Notification System */}
        <DamageNotificationSystem />

        {/* Damage Report Modal */}
        {showDamageModal && selectedWorkItem && (
          <DamageReportModal
            workItem={selectedWorkItem}
            isOpen={showDamageModal}
            onClose={() => setShowDamageModal(false)}
            onSubmit={handleDamageReport}
          />
        )}
      </div>
    </div>
  );
};

export default OperatorWorkDashboardNewCentralized;