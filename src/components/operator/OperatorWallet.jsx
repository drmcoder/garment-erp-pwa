// src/components/operator/OperatorWallet.jsx
// Operator wallet and earnings display component

import React, { useState, useEffect } from 'react';
import { operatorWalletService } from '../../services/OperatorWalletService';
import { useAuth } from '../../context/AuthContext';

const OperatorWallet = ({ operatorId, isNepali = false, onWalletUpdate, hideAmountsDuringWork = false }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState({
    availableAmount: 0,
    heldAmount: 0,
    totalEarned: 0,
    heldBundles: [],
    canWithdraw: false
  });
  const [heldBundlesDetails, setHeldBundlesDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [recentEarnings, setRecentEarnings] = useState([]);

  // Load wallet data
  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Get wallet balance
      const walletResult = await operatorWalletService.getWalletBalance(operatorId);
      if (walletResult.success) {
        setWallet(walletResult.wallet);
        
        // Notify parent component
        if (onWalletUpdate) {
          onWalletUpdate(walletResult.wallet);
        }
      }

      // Get held bundles details if there are any
      if (walletResult.success && walletResult.wallet.heldBundles.length > 0) {
        const bundlesResult = await operatorWalletService.getHeldBundlesDetails(operatorId);
        if (bundlesResult.success) {
          setHeldBundlesDetails(bundlesResult.heldBundles);
        }
      }

      // Get recent earnings
      const earningsResult = await operatorWalletService.getWageHistory(operatorId, 5);
      if (earningsResult.success) {
        setRecentEarnings(earningsResult.data.wageRecords.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (operatorId) {
      loadWalletData();
      
      // Set up real-time updates
      const unsubscribe = operatorWalletService.subscribeToWallet(operatorId, (updatedWallet) => {
        setWallet(updatedWallet);
        if (onWalletUpdate) {
          onWalletUpdate(updatedWallet);
        }
      });

      // Refresh every 30 seconds
      const refreshInterval = setInterval(loadWalletData, 30000);

      return () => {
        if (unsubscribe) unsubscribe();
        clearInterval(refreshInterval);
      };
    }
  }, [operatorId]);

  const formatCurrency = (amount) => {
    return `Rs ${amount.toFixed(2)}`;
  };

  // Determine if we should hide earnings based on operator status
  const hasActiveWork = user?.status === 'working' || user?.status === 'pending_approval' || user?.currentWork;
  const shouldHideAmounts = hideAmountsDuringWork && hasActiveWork;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Main Wallet Display */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isNepali ? '💰 मेरो पैसा' : '💰 My Wallet'}
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails 
              ? (isNepali ? 'लुकाउनुहोस्' : 'Hide Details')
              : (isNepali ? 'विवरण हेर्नुहोस्' : 'View Details')
            }
          </button>
        </div>

        {/* Available Amount - Main Display */}
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">
                {isNepali ? 'निकाल्न मिल्ने' : 'Available to Withdraw'}
              </p>
              <p className="text-2xl font-bold text-green-700">
                {shouldHideAmounts 
                  ? (isNepali ? '••• काम पछि देखिनेछ' : '••• After completion')
                  : formatCurrency(wallet.availableAmount)
                }
              </p>
            </div>
            <div className="text-3xl">💳</div>
          </div>
          
          {!shouldHideAmounts && wallet.canWithdraw && wallet.availableAmount > 0 && (
            <button className="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              {isNepali ? '💰 पैसा निकाल्नुहोस्' : '💰 Withdraw Money'}
            </button>
          )}
        </div>

        {/* Held Amount Display */}
        {wallet.heldAmount > 0 && (
          <div className="bg-orange-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  {isNepali ? '⏳ रोकिएको पैसा' : '⏳ Money on Hold'}
                </p>
                <p className="text-xl font-bold text-orange-700">
                  {shouldHideAmounts 
                    ? (isNepali ? '••• काम पछि देखिनेछ' : '••• After completion')
                    : formatCurrency(wallet.heldAmount)
                  }
                </p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
            
            <p className="text-xs text-orange-600 mt-1">
              {isNepali 
                ? `${wallet.heldBundles.length} बन्डलमा पैसा रोकिएको छ`
                : `Money held in ${wallet.heldBundles.length} bundles`
              }
            </p>

            {/* Held Bundles Details */}
            {!shouldHideAmounts && heldBundlesDetails.length > 0 && (
              <div className="mt-3 space-y-2">
                {heldBundlesDetails.map((bundle, index) => (
                  <div key={index} className="bg-orange-100 rounded p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">{bundle.bundleNumber}</span>
                      <span className="text-orange-700">{formatCurrency(bundle.heldAmount)}</span>
                    </div>
                    <div className="text-orange-600">
                      {isNepali ? 'कारण:' : 'Reason:'} {bundle.paymentHoldReason || 'Damage reported'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600">
              {isNepali ? 'कुल कमाई' : 'Total Earned'}
            </p>
            <p className="text-lg font-bold text-blue-700">
              {shouldHideAmounts 
                ? (isNepali ? '••• काम पछि देखिनेछ' : '••• After completion')
                : formatCurrency(wallet.totalEarned)
              }
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-purple-600">
              {isNepali ? 'कुल योग' : 'Total Balance'}
            </p>
            <p className="text-lg font-bold text-purple-700">
              {shouldHideAmounts 
                ? (isNepali ? '••• काम पछि देखिनेछ' : '••• After completion')
                : formatCurrency(wallet.availableAmount + wallet.heldAmount)
              }
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t bg-gray-50">
          <div className="p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              {isNepali ? '📊 हालसालको कमाई' : '📊 Recent Earnings'}
            </h4>

            {recentEarnings.length > 0 ? (
              <div className="space-y-3">
                {recentEarnings.map((earning, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">
                        {earning.bundleNumber || earning.workType || 'Work Completed'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {earning.paymentDate || new Date(earning.createdAt).toLocaleDateString()}
                        {earning.pieces && ` • ${earning.pieces} pieces`}
                      </p>
                      {earning.paymentType === 'released_after_damage' && (
                        <p className="text-xs text-orange-600">
                          {isNepali ? '🔧 रिवर्क पछि रिलीज' : '🔧 Released after rework'}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {shouldHideAmounts 
                          ? '••••'
                          : `+${formatCurrency(earning.amount || 0)}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => {/* Open full earnings history */}}
                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  {isNepali ? 'सबै इतिहास हेर्नुहोस्' : 'View Full History'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>
                  {isNepali 
                    ? 'अहिलेसम्म कुनै कमाई छैन'
                    : 'No earnings history yet'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="border-t bg-blue-50">
        <div className="p-4">
          <div className="flex items-start space-x-2">
            <div className="text-blue-500 text-sm">💡</div>
            <div className="text-xs text-blue-700">
              {shouldHideAmounts ? (
                isNepali 
                  ? 'काम सुरु भएपछि पेमेन्ट जानकारी लुकाइएको छ। काम पूरा भएपछि तपाईंको कमाई देखिनेछ।'
                  : 'Payment information is hidden during active work. Your earnings will be visible after work completion.'
              ) : (
                isNepali 
                  ? 'जब कुनै काममा नोक्सान भएको रिपोर्ट गर्नुहुन्छ, त्यो बन्डलको पूरै पैसा रिवर्क सम्पन्न नभएसम्म रोकिन्छ।'
                  : 'When you report damage, the entire bundle payment is held until rework is completed.'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorWallet;