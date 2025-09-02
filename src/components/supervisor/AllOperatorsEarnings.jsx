import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Package,
  Eye,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, query, where, orderBy, onSnapshot, getDocs } from '../../config/firebase';

const AllOperatorsEarnings = () => {
  const { user } = useAuth();
  const { currentLanguage, formatCurrency, formatDate, formatDateTime } = useLanguage();
  const isNepali = currentLanguage === 'np';

  const [operators, setOperators] = useState([]);
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('totalEarnings'); // totalEarnings, pendingEarnings, name
  const [selectedOperator, setSelectedOperator] = useState(null);

  // Load operators and their earnings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all operators
        const operatorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'operator'),
          orderBy('name', 'asc')
        );
        
        const operatorsSnapshot = await getDocs(operatorsQuery);
        const operatorsData = operatorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setOperators(operatorsData);

        // Get earnings for all operators
        const earningsQuery = query(
          collection(db, 'operatorEarnings'),
          orderBy('completedAt', 'desc')
        );

        const unsubscribe = onSnapshot(earningsQuery, (snapshot) => {
          const earningsData = {};
          
          snapshot.docs.forEach(doc => {
            const earning = { id: doc.id, ...doc.data() };
            const operatorId = earning.operatorId;
            
            if (!earningsData[operatorId]) {
              earningsData[operatorId] = [];
            }
            earningsData[operatorId].push(earning);
          });

          setEarnings(earningsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading earnings data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate operator stats
  const getOperatorStats = (operatorId) => {
    const operatorEarnings = earnings[operatorId] || [];
    const now = new Date();
    
    // Filter by time period
    const filteredEarnings = operatorEarnings.filter(earning => {
      const earningDate = new Date(earning.completedAt);
      switch (filter) {
        case 'today':
          return earningDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return earningDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return earningDate >= monthAgo;
        default:
          return true;
      }
    });

    const totalEarnings = filteredEarnings.reduce((sum, e) => sum + (e.earnings || 0), 0);
    const pendingEarnings = filteredEarnings
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + (e.earnings || 0), 0);
    const confirmedEarnings = filteredEarnings
      .filter(e => e.status === 'confirmed')
      .reduce((sum, e) => sum + (e.earnings || 0), 0);
    const totalPieces = filteredEarnings.reduce((sum, e) => sum + (e.pieces || 0), 0);
    const workCount = filteredEarnings.length;

    return {
      totalEarnings,
      pendingEarnings,
      confirmedEarnings,
      totalPieces,
      workCount,
      avgEarningsPerWork: workCount > 0 ? totalEarnings / workCount : 0,
      earnings: filteredEarnings
    };
  };

  // Filter and sort operators
  const filteredOperators = operators
    .filter(operator => 
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const statsA = getOperatorStats(a.id);
      const statsB = getOperatorStats(b.id);
      
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'pendingEarnings':
          return statsB.pendingEarnings - statsA.pendingEarnings;
        case 'totalEarnings':
        default:
          return statsB.totalEarnings - statsA.totalEarnings;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'कुल अपरेटरहरू' : 'Total Operators'}
              </h3>
              <p className="text-2xl font-bold">{operators.length}</p>
            </div>
            <Users className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'कुल आम्दानी' : 'Total Earnings'}
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  operators.reduce((sum, op) => sum + getOperatorStats(op.id).totalEarnings, 0)
                )}
              </p>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'प्रतीक्षामा' : 'Pending'}
              </h3>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  operators.reduce((sum, op) => sum + getOperatorStats(op.id).pendingEarnings, 0)
                )}
              </p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'कुल टुक्राहरू' : 'Total Pieces'}
              </h3>
              <p className="text-2xl font-bold">
                {operators.reduce((sum, op) => sum + getOperatorStats(op.id).totalPieces, 0)}
              </p>
            </div>
            <Package className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={isNepali ? 'अपरेटर खोज्नुहोस्' : 'Search operators'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{isNepali ? 'सबै' : 'All Time'}</option>
                <option value="today">{isNepali ? 'आज' : 'Today'}</option>
                <option value="week">{isNepali ? 'यो हप्ता' : 'This Week'}</option>
                <option value="month">{isNepali ? 'यो महिना' : 'This Month'}</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{isNepali ? 'क्रमबद्ध:' : 'Sort by:'}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="totalEarnings">{isNepali ? 'कुल आम्दानी' : 'Total Earnings'}</option>
                <option value="pendingEarnings">{isNepali ? 'प्रतीक्षामा' : 'Pending Earnings'}</option>
                <option value="name">{isNepali ? 'नाम' : 'Name'}</option>
              </select>
            </div>
          </div>

          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm">{isNepali ? 'रिपोर्ट निकाल्नुहोस्' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* Operators List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            👥 {isNepali ? 'अपरेटर आम्दानी' : 'Operator Earnings'}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredOperators.map((operator) => {
            const stats = getOperatorStats(operator.id);
            return (
              <div key={operator.id} className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedOperator(selectedOperator === operator.id ? null : operator.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{operator.name}</h4>
                      <p className="text-sm text-gray-600">
                        {operator.username} • {stats.workCount} {isNepali ? 'काम' : 'works'} • {stats.totalPieces} {isNepali ? 'टुक्रा' : 'pieces'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(stats.totalEarnings)}
                      </p>
                      <div className="flex items-center space-x-2 text-xs">
                        {stats.pendingEarnings > 0 && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {formatCurrency(stats.pendingEarnings)} {isNepali ? 'प्रतीक्षामा' : 'pending'}
                          </span>
                        )}
                        <span className="text-gray-500">
                          {formatCurrency(stats.avgEarningsPerWork)}/{isNepali ? 'काम' : 'work'}
                        </span>
                      </div>
                    </div>
                    {selectedOperator === operator.id ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedOperator === operator.id && (
                  <div className="mt-4 pl-12">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">
                        {isNepali ? 'हालको कामहरू' : 'Recent Work'}
                      </h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {stats.earnings.slice(0, 10).map((earning) => (
                          <div key={earning.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${
                                earning.status === 'confirmed' ? 'bg-green-500' :
                                earning.status === 'pending' ? 'bg-yellow-500' :
                                earning.status === 'paid' ? 'bg-blue-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <p className="text-sm font-medium">{earning.bundleNumber}</p>
                                <p className="text-xs text-gray-600">
                                  {earning.operation} • {earning.pieces} {isNepali ? 'टुक्रा' : 'pieces'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">
                                {formatCurrency(earning.earnings)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(earning.completedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {stats.earnings.length > 10 && (
                        <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                          {isNepali ? 'थप हेर्नुहोस्' : 'View more'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AllOperatorsEarnings;