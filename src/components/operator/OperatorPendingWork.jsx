import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  Package,
  CheckCircle,
  Lock,
  Unlock,
  RefreshCw,
  User,
  Calendar,
  Wrench,
  PlayCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import BundlePaymentHoldService from '../../services/BundlePaymentHoldService';
import EarningsService from '../../services/EarningsService';
import EnhancedDamageReport from './EnhancedDamageReport';

const OperatorPendingWork = () => {
  const { user } = useAuth();
  const { currentLanguage, formatDateTime, formatCurrency } = useLanguage();
  const { showNotification } = useNotifications();
  const isNepali = currentLanguage === 'np';

  const [pendingWork, setPendingWork] = useState({
    heldBundles: [],
    regularWork: [],
    reworkAssignments: [],
    totalPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [completingWork, setCompletingWork] = useState(false);

  // Load pending work
  useEffect(() => {
    loadPendingWork();
  }, []);

  const loadPendingWork = async () => {
    try {
      setLoading(true);
      const result = await BundlePaymentHoldService.getOperatorPendingWork(user.uid);
      
      if (result.success) {
        setPendingWork(result.data);
      }
    } catch (error) {
      console.error('Error loading pending work:', error);
      showNotification(
        isNepali ? 'काम लोड गर्न समस्या भयो' : 'Error loading work',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Complete regular work
  const completeWork = async (workItem) => {
    setCompletingWork(true);
    try {
      // Record earnings for completed work
      const earningsData = {
        operatorId: user.uid,
        operatorName: user.name,
        bundleNumber: workItem.bundleNumber,
        articleNumber: workItem.articleNumber,
        operation: workItem.operation,
        machineType: workItem.machineType,
        pieces: workItem.pieces,
        ratePerPiece: workItem.ratePerPiece || 5, // Default rate
        startTime: workItem.assignedAt,
        completedAt: new Date(),
        qualityNotes: '',
        damageInfo: null // No damage for regular completion
      };

      const result = await EarningsService.recordEarnings(earningsData);

      if (result.success) {
        showNotification(
          isNepali 
            ? `काम सम्पन्न भयो - ${formatCurrency(result.data.earnings)} कमाई`
            : `Work completed - ${formatCurrency(result.data.earnings)} earned`,
          'success'
        );
        
        loadPendingWork(); // Refresh the list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error completing work:', error);
      showNotification(
        isNepali ? 'काम पूरा गर्न समस्या भयो' : 'Error completing work',
        'error'
      );
    } finally {
      setCompletingWork(false);
    }
  };

  // Complete rework
  const completeRework = async (reworkItem) => {
    setCompletingWork(true);
    try {
      const completionData = {
        operatorId: user.uid,
        operatorName: user.name,
        completedPieces: reworkItem.pieces,
        qualityNotes: 'Rework completed successfully',
        completedAt: new Date()
      };

      const result = await BundlePaymentHoldService.completeRework(
        reworkItem.holdId,
        completionData
      );

      if (result.success) {
        showNotification(
          result.paymentReleased 
            ? (isNepali ? 'मर्मत पूरा भयो - भुक्तानी रिलिज भयो!' : 'Rework completed - Payment released!')
            : (isNepali ? 'मर्मत पूरा भयो' : 'Rework completed'),
          result.paymentReleased ? 'success' : 'info'
        );
        
        loadPendingWork(); // Refresh the list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error completing rework:', error);
      showNotification(
        isNepali ? 'मर्मत पूरा गर्न समस्या भयो' : 'Error completing rework',
        'error'
      );
    } finally {
      setCompletingWork(false);
    }
  };

  // Report damage for a work item
  const reportDamage = (workItem) => {
    setSelectedWork(workItem);
    setShowDamageReport(true);
  };

  const getWorkStatusColor = (status, type) => {
    if (type === 'held') {
      switch (status) {
        case 'damage_reported':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'rework_assigned':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'rework_completed':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getWorkStatusText = (status, type) => {
    if (type === 'held') {
      const statusMap = {
        damage_reported: isNepali ? 'क्षति रिपोर्ट - भुक्तानी होल्ड' : 'Damage Reported - Payment Held',
        rework_assigned: isNepali ? 'मर्मत असाइन भएको' : 'Rework Assigned',
        rework_completed: isNepali ? 'मर्मत पूरा - भुक्तानी प्रतीक्षामा' : 'Rework Done - Payment Pending'
      };
      return statusMap[status] || status;
    }
    return isNepali ? 'काम तयार' : 'Ready to Work';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📋 {isNepali ? 'मेरो प्रतीक्षित काम' : 'My Pending Work'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {pendingWork.totalPending} {isNepali ? 'काम प्रतीक्षामा' : 'work items pending'}
          </p>
        </div>
        <button
          onClick={loadPendingWork}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isNepali ? 'रिफ्रेस' : 'Refresh'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'नियमित काम' : 'Regular Work'}
              </h3>
              <p className="text-2xl font-bold">{pendingWork.regularWork.length}</p>
            </div>
            <Package className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'होल्ड भएका बन्डल' : 'Held Bundles'}
              </h3>
              <p className="text-2xl font-bold">{pendingWork.heldBundles.length}</p>
            </div>
            <Lock className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'मर्मत काम' : 'Rework Tasks'}
              </h3>
              <p className="text-2xl font-bold">
                {pendingWork.regularWork.filter(w => w.type === 'rework').length}
              </p>
            </div>
            <Wrench className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Held Bundles Section */}
      {pendingWork.heldBundles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200">
          <div className="p-4 border-b border-red-200 bg-red-50">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">
                🔒 {isNepali ? 'भुक्तानी होल्ड भएका बन्डलहरू' : 'Payment Held Bundles'}
              </h3>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {isNepali 
                ? 'यी बन्डलहरूको भुक्तानी क्षति मर्मत नभएसम्म होल्ड छ'
                : 'These bundles have payment held until damage is repaired'
              }
            </p>
          </div>

          <div className="divide-y divide-red-100">
            {pendingWork.heldBundles.map((bundle) => (
              <div key={bundle.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-red-100 rounded-full p-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{bundle.bundleNumber}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getWorkStatusColor(bundle.status, 'held')}`}>
                          {getWorkStatusText(bundle.status, 'held')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">{isNepali ? 'कुल टुक्रा:' : 'Total Pieces:'}</span>
                          <p className="font-medium">{bundle.totalPieces}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'पूरा भएको:' : 'Completed:'}</span>
                          <p className="font-medium">{bundle.completedPieces}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'क्षति:' : 'Damaged:'}</span>
                          <p className="font-medium text-red-600">{bundle.damageCount}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'रिपोर्ट मिति:' : 'Reported:'}</span>
                          <p className="font-medium">{formatDateTime(bundle.reportedAt)}</p>
                        </div>
                      </div>

                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>{isNepali ? 'क्षति:' : 'Damage:'}</strong> {bundle.damageDescription}
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          <strong>{isNepali ? 'स्थिति:' : 'Status:'}</strong> 
                          {bundle.status === 'damage_reported' && (isNepali ? 'सुपरवाइजर प्रतीक्षामा' : 'Waiting for supervisor')}
                          {bundle.status === 'rework_assigned' && (isNepali ? 'मर्मत काम असाइन भयो' : 'Rework assigned')}
                          {bundle.status === 'rework_completed' && (isNepali ? 'भुक्तानी रिलिजको प्रतीक्षामा' : 'Waiting for payment release')}
                        </p>
                      </div>

                      {/* Show rework details if assigned */}
                      {bundle.reworkHistory && bundle.reworkHistory.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-900 mb-2">
                            🔧 {isNepali ? 'मर्मत निर्देशन' : 'Rework Instructions'}
                          </h5>
                          {bundle.reworkHistory.map((rework, index) => (
                            <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <p className="text-sm">
                                <strong>{isNepali ? 'मर्मत टुक्रा:' : 'Replacement pieces:'}</strong> {rework.replacementPieces}
                              </p>
                              <p className="text-sm mt-1">
                                <strong>{isNepali ? 'निर्देशन:' : 'Instructions:'}</strong> {rework.reworkInstructions}
                              </p>
                              <p className="text-sm mt-1">
                                <strong>{isNepali ? 'अन्तिम मिति:' : 'Due date:'}</strong> {formatDateTime(rework.dueDate)}
                              </p>
                              
                              {rework.status === 'assigned' && (
                                <button
                                  onClick={() => completeRework({...rework, holdId: bundle.id, pieces: rework.replacementPieces})}
                                  disabled={completingWork}
                                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                  {isNepali ? 'मर्मत पूरा गर्नुहोस्' : 'Complete Rework'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Work Section */}
      {pendingWork.regularWork.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              📦 {isNepali ? 'नियमित काम' : 'Regular Work'}
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {pendingWork.regularWork.map((work) => (
              <div key={work.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 rounded-full p-2">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{work.bundleNumber}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getWorkStatusColor(work.status, 'regular')}`}>
                          {work.type === 'rework' 
                            ? (isNepali ? 'मर्मत काम' : 'Rework Task')
                            : (isNepali ? 'नियमित काम' : 'Regular Work')
                          }
                        </span>
                        {work.priority === 'high' && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full border border-orange-200">
                            {isNepali ? 'उच्च प्राथमिकता' : 'High Priority'}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">{isNepali ? 'ऑपरेशन:' : 'Operation:'}</span>
                          <p className="font-medium">{work.operation}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'टुक्रा:' : 'Pieces:'}</span>
                          <p className="font-medium">{work.pieces}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'अनुमानित कमाई:' : 'Est. Earnings:'}</span>
                          <p className="font-medium text-green-600">
                            {formatCurrency((work.pieces || 0) * (work.ratePerPiece || 5))}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'असाइन मिति:' : 'Assigned:'}</span>
                          <p className="font-medium">{formatDateTime(work.assignedAt)}</p>
                        </div>
                      </div>

                      {work.instructions && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="text-sm text-blue-800">
                            <strong>{isNepali ? 'निर्देशन:' : 'Instructions:'}</strong> {work.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => completeWork(work)}
                      disabled={completingWork}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isNepali ? 'पूरा गर्नुहोस्' : 'Complete'}</span>
                    </button>
                    
                    <button
                      onClick={() => reportDamage(work)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>{isNepali ? 'क्षति रिपोर्ट' : 'Report Damage'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No work message */}
      {pendingWork.totalPending === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isNepali ? 'कुनै प्रतीक्षित काम छैन' : 'No Pending Work'}
          </h3>
          <p className="text-gray-600">
            {isNepali 
              ? 'तपाईंसँग हाल कुनै काम छैन। नयाँ काम असाइन भएको बेला तपाईंलाई सूचना दिइनेछ।'
              : 'You have no pending work items. You will be notified when new work is assigned.'
            }
          </p>
        </div>
      )}

      {/* Damage Report Modal */}
      {showDamageReport && selectedWork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <EnhancedDamageReport
              bundleData={{
                bundleNumber: selectedWork.bundleNumber,
                pieces: selectedWork.pieces,
                articleNumber: selectedWork.articleNumber,
                operation: selectedWork.operation,
                estimatedEarnings: (selectedWork.pieces || 0) * (selectedWork.ratePerPiece || 5)
              }}
              onReportSubmitted={(holdData) => {
                setShowDamageReport(false);
                setSelectedWork(null);
                loadPendingWork(); // Refresh the work list
              }}
              onClose={() => {
                setShowDamageReport(false);
                setSelectedWork(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorPendingWork;