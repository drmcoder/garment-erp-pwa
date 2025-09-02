import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clock, 
  Package,
  Eye,
  Download,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, query, where, orderBy, onSnapshot } from '../../config/firebase';

const EarningsWallet = () => {
  const { user } = useAuth();
  const { currentLanguage, formatCurrency, formatDate, formatDateTime } = useLanguage();
  const isNepali = currentLanguage === 'np';

  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [expandedItem, setExpandedItem] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [confirmedEarnings, setConfirmedEarnings] = useState(0);

  // Real-time earnings subscription
  useEffect(() => {
    if (!user?.uid) return;

    const earningsQuery = query(
      collection(db, 'operatorEarnings'),
      where('operatorId', '==', user.uid),
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(earningsQuery, (snapshot) => {
      const earningsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEarnings(earningsData);
      
      // Calculate totals
      const total = earningsData.reduce((sum, item) => sum + (item.earnings || 0), 0);
      const pending = earningsData
        .filter(item => item.status === 'pending')
        .reduce((sum, item) => sum + (item.earnings || 0), 0);
      const confirmed = earningsData
        .filter(item => item.status === 'confirmed')
        .reduce((sum, item) => sum + (item.earnings || 0), 0);

      setTotalEarnings(total);
      setPendingEarnings(pending);
      setConfirmedEarnings(confirmed);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter earnings based on selected period
  const filteredEarnings = earnings.filter(item => {
    const itemDate = new Date(item.completedAt);
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      default:
        return true;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'held':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    if (isNepali) {
      switch (status) {
        case 'confirmed': return 'पुष्टि भएको';
        case 'pending': return 'प्रतीक्षामा';
        case 'paid': return 'भुक्तानी भएको';
        case 'held': return 'रोकिएको';
        default: return 'अज्ञात';
      }
    } else {
      switch (status) {
        case 'confirmed': return 'Confirmed';
        case 'pending': return 'Pending';
        case 'paid': return 'Paid';
        case 'held': return 'Held';
        default: return 'Unknown';
      }
    }
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'कुल आम्दानी' : 'Total Earnings'}
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
            <Wallet className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'प्रतीक्षामा' : 'Pending'}
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(pendingEarnings)}
              </p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'पुष्टि भएको' : 'Confirmed'}
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(confirmedEarnings)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {isNepali ? 'फिल्टर:' : 'Filter:'}
            </span>
            <div className="flex space-x-1">
              {[
                { key: 'all', label: isNepali ? 'सबै' : 'All' },
                { key: 'today', label: isNepali ? 'आज' : 'Today' },
                { key: 'week', label: isNepali ? 'यो हप्ता' : 'This Week' },
                { key: 'month', label: isNepali ? 'यो महिना' : 'This Month' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">
              {isNepali ? 'डाउनलोड' : 'Download'}
            </span>
          </button>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            💰 {isNepali ? 'आम्दानी इतिहास' : 'Earnings History'}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredEarnings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{isNepali ? 'कुनै आम्दानी रेकर्ड फेला परेन' : 'No earnings records found'}</p>
            </div>
          ) : (
            filteredEarnings.map((earning) => (
              <div key={earning.id} className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedItem(expandedItem === earning.id ? null : earning.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {earning.bundleNumber} - {earning.operation}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(earning.completedAt)} • {earning.pieces} {isNepali ? 'टुक्रा' : 'pieces'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(earning.status)}`}>
                      {getStatusText(earning.status)}
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(earning.earnings)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(earning.ratePerPiece)}/{isNepali ? 'टुक्रा' : 'piece'}
                      </p>
                    </div>
                    {expandedItem === earning.id ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedItem === earning.id && (
                  <div className="mt-4 pl-12 border-l-2 border-blue-200">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">{isNepali ? 'लेख नम्बर:' : 'Article Number:'}</span>
                          <p className="font-medium">{earning.articleNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'मेसिन:' : 'Machine:'}</span>
                          <p className="font-medium">{earning.machineType}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'सुरु समय:' : 'Start Time:'}</span>
                          <p className="font-medium">{formatDateTime(earning.startTime)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{isNepali ? 'समाप्त समय:' : 'End Time:'}</span>
                          <p className="font-medium">{formatDateTime(earning.completedAt)}</p>
                        </div>
                      </div>

                      {earning.qualityNotes && (
                        <div>
                          <span className="text-gray-600 text-sm">{isNepali ? 'गुणस्तर टिप्पणी:' : 'Quality Notes:'}</span>
                          <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200 mt-1">
                            {earning.qualityNotes}
                          </p>
                        </div>
                      )}

                      {earning.damageDeduction && earning.damageDeduction > 0 && (
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <p className="text-sm text-red-700">
                            <strong>{isNepali ? 'क्षति कटौती:' : 'Damage Deduction:'}</strong> -{formatCurrency(earning.damageDeduction)}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {earning.damageReason || (isNepali ? 'क्षति कारण उल्लेख गरिएको छैन' : 'No damage reason specified')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsWallet;