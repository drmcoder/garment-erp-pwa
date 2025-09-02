import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Package,
  Send,
  Eye,
  RefreshCw,
  Calendar,
  MessageSquare,
  Tool
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import BundlePaymentHoldService from '../../services/BundlePaymentHoldService';

const BundlePaymentHolds = () => {
  const { user } = useAuth();
  const { currentLanguage, formatDateTime, formatCurrency } = useLanguage();
  const { showNotification } = useNotifications();
  const isNepali = currentLanguage === 'np';

  const [heldBundles, setHeldBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkForm, setReworkForm] = useState({
    replacementPieces: 1,
    reworkInstructions: '',
    assignedTo: '',
    dueDate: ''
  });

  // Load held bundles
  useEffect(() => {
    const unsubscribe = BundlePaymentHoldService.subscribeToHeldBundles((bundles) => {
      setHeldBundles(bundles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Assign rework
  const assignRework = async () => {
    if (!selectedBundle || !reworkForm.replacementPieces) {
      showNotification(
        isNepali ? 'कृपया सबै आवश्यक जानकारी भर्नुहोस्' : 'Please fill all required information',
        'error'
      );
      return;
    }

    try {
      const reworkData = {
        supervisorId: user.uid,
        supervisorName: user.name,
        replacementPieces: parseInt(reworkForm.replacementPieces),
        reworkInstructions: reworkForm.reworkInstructions,
        dueDate: reworkForm.dueDate ? new Date(reworkForm.dueDate) : null,
        assignedTo: reworkForm.assignedTo || selectedBundle.operatorId, // Default to original operator
        assignedOperatorName: reworkForm.assignedTo ? 'Selected Operator' : selectedBundle.operatorName
      };

      const result = await BundlePaymentHoldService.assignRework(selectedBundle.id, reworkData);

      if (result.success) {
        showNotification(
          isNepali ? 'मर्मत कार्य असाइन गरियो' : 'Rework assigned successfully',
          'success'
        );
        setShowReworkModal(false);
        setReworkForm({
          replacementPieces: 1,
          reworkInstructions: '',
          assignedTo: '',
          dueDate: ''
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error assigning rework:', error);
      showNotification(
        isNepali ? 'मर्मत असाइन गर्न समस्या भयो' : 'Error assigning rework',
        'error'
      );
    }
  };

  // Force release payment
  const forceReleasePayment = async (holdId, reason) => {
    try {
      const result = await BundlePaymentHoldService.forceReleasePayment(
        holdId,
        user.uid,
        reason || 'Supervisor override'
      );

      if (result.success) {
        showNotification(
          isNepali ? 'भुक्तानी जबरजस्ती रिलिज गरियो' : 'Payment force released',
          'success'
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error force releasing payment:', error);
      showNotification(
        isNepali ? 'भुक्तानी रिलिज गर्न समस्या भयो' : 'Error releasing payment',
        'error'
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'damage_reported':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rework_assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rework_completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment_released':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      damage_reported: isNepali ? 'क्षति रिपोर्ट भएको' : 'Damage Reported',
      rework_assigned: isNepali ? 'मर्मत असाइन भएको' : 'Rework Assigned',
      rework_completed: isNepali ? 'मर्मत पूरा भएको' : 'Rework Completed',
      payment_released: isNepali ? 'भुक्तानी रिलिज भएको' : 'Payment Released'
    };
    return statusMap[status] || status;
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
        <h2 className="text-2xl font-bold text-gray-900">
          🔒 {isNepali ? 'बन्डल भुक्तानी होल्ड' : 'Bundle Payment Holds'}
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {heldBundles.length} {isNepali ? 'बन्डल होल्ड छ' : 'bundles on hold'}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isNepali ? 'रिफ्रेस' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'क्षति रिपोर्ट' : 'Damage Reported'}
              </h3>
              <p className="text-2xl font-bold">
                {heldBundles.filter(b => b.status === 'damage_reported').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'मर्मत असाइन भएको' : 'Rework Assigned'}
              </h3>
              <p className="text-2xl font-bold">
                {heldBundles.filter(b => b.status === 'rework_assigned').length}
              </p>
            </div>
            <Tool className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'मर्मत पूरा' : 'Rework Complete'}
              </h3>
              <p className="text-2xl font-bold">
                {heldBundles.filter(b => b.status === 'rework_completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'कुल होल्ड रकम' : 'Total Held Amount'}
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  heldBundles.reduce((sum, bundle) => 
                    sum + (bundle.estimatedEarnings || 0), 0
                  )
                )}
              </p>
            </div>
            <Lock className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Held Bundles List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📦 {isNepali ? 'होल्ड भएका बन्डलहरू' : 'Held Bundles'}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {heldBundles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{isNepali ? 'कुनै बन्डल होल्ड छैन' : 'No bundles on hold'}</p>
            </div>
          ) : (
            heldBundles.map((bundle) => (
              <div key={bundle.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-4 h-4 rounded-full mt-1 ${
                      bundle.status === 'damage_reported' ? 'bg-red-500' :
                      bundle.status === 'rework_assigned' ? 'bg-yellow-500' :
                      bundle.status === 'rework_completed' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{bundle.bundleNumber}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(bundle.status)}`}>
                          {getStatusText(bundle.status)}
                        </span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded">
                          {isNepali ? 'भुक्तानी होल्ड' : 'Payment Held'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">{isNepali ? 'अपरेटर:' : 'Operator:'}</span>
                          <p className="font-medium">{bundle.operatorName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'कुल टुक्रा:' : 'Total Pieces:'}</span>
                          <p className="font-medium">{bundle.totalPieces}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'क्षति संख्या:' : 'Damage Count:'}</span>
                          <p className="font-medium text-red-600">{bundle.damageCount}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'रिपोर्ट मिति:' : 'Reported:'}</span>
                          <p className="font-medium">{formatDateTime(bundle.reportedAt)}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm">
                          <strong>{isNepali ? 'क्षति विवरण:' : 'Damage Description:'}</strong> {bundle.damageDescription}
                        </p>
                        <p className="text-sm mt-1">
                          <strong>{isNepali ? 'क्षति प्रकार:' : 'Damage Type:'}</strong> {bundle.damageType?.replace('_', ' ')}
                        </p>
                      </div>

                      {/* Rework History */}
                      {bundle.reworkHistory && bundle.reworkHistory.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-gray-900 mb-2">
                            🔧 {isNepali ? 'मर्मत इतिहास' : 'Rework History'}
                          </h5>
                          {bundle.reworkHistory.map((rework, index) => (
                            <div key={index} className="bg-blue-50 p-2 rounded text-sm mb-2">
                              <p><strong>{isNepali ? 'मर्मत टुक्रा:' : 'Rework Pieces:'}</strong> {rework.replacementPieces}</p>
                              <p><strong>{isNepali ? 'निर्देशन:' : 'Instructions:'}</strong> {rework.reworkInstructions}</p>
                              <p><strong>{isNepali ? 'स्थिति:' : 'Status:'}</strong> {rework.status}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {bundle.status === 'damage_reported' && (
                      <button
                        onClick={() => { setSelectedBundle(bundle); setShowReworkModal(true); }}
                        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                      >
                        {isNepali ? 'मर्मत असाइन गर्नुहोस्' : 'Assign Rework'}
                      </button>
                    )}
                    
                    {bundle.status === 'rework_completed' && (
                      <button
                        onClick={() => forceReleasePayment(bundle.id, 'Rework completed - releasing payment')}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        {isNepali ? 'भुक्तानी रिलिज गर्नुहोस्' : 'Release Payment'}
                      </button>
                    )}

                    <button
                      onClick={() => forceReleasePayment(bundle.id, 'Supervisor override')}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      {isNepali ? 'जबरजस्ती रिलिज' : 'Force Release'}
                    </button>

                    <button
                      onClick={() => setSelectedBundle(bundle)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rework Assignment Modal */}
      {showReworkModal && selectedBundle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {isNepali ? 'मर्मत असाइन गर्नुहोस्' : 'Assign Rework'}
                </h3>
                <button
                  onClick={() => setShowReworkModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p><strong>{isNepali ? 'बन्डल:' : 'Bundle:'}</strong> {selectedBundle.bundleNumber}</p>
                  <p><strong>{isNepali ? 'क्षति संख्या:' : 'Damage Count:'}</strong> {selectedBundle.damageCount}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'मर्मत टुक्रा संख्या' : 'Replacement Pieces'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reworkForm.replacementPieces}
                    onChange={(e) => setReworkForm({...reworkForm, replacementPieces: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'मर्मत निर्देशन' : 'Rework Instructions'}
                  </label>
                  <textarea
                    value={reworkForm.reworkInstructions}
                    onChange={(e) => setReworkForm({...reworkForm, reworkInstructions: e.target.value})}
                    placeholder={isNepali ? 'मर्मत कसरी गर्ने भनेर लेख्नुहोस्' : 'Describe how to fix the damage'}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'समाप्ति मिति' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={reworkForm.dueDate}
                    onChange={(e) => setReworkForm({...reworkForm, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowReworkModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </button>
                  <button
                    onClick={assignRework}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isNepali ? 'मर्मत असाइन गर्नुहोस्' : 'Assign Rework'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundlePaymentHolds;