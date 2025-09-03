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
        // Mock operators data for demonstration
        const mockOperators = [
          { id: 'op1', name: 'Ram Singh', username: 'ramsingh', machine: 'overlock', speciality: 'shoulder_join' },
          { id: 'op2', name: 'Sita Devi', username: 'sitadevi', machine: 'flatlock', speciality: 'hem_fold' },
          { id: 'op3', name: 'Hari Bahadur', username: 'haribahadur', machine: 'single-needle', speciality: 'collar_attach' },
          { id: 'op4', name: 'Maya Gurung', username: 'mayagurung', machine: 'overlock', speciality: 'side_seam' },
          { id: 'op5', name: 'Krishna Lal', username: 'krishnalal', machine: 'buttonhole', speciality: 'button_attach' },
          { id: 'op6', name: 'Devi Kumari', username: 'devikumari', machine: 'flatlock', speciality: 'sleeve_attach' }
        ];

        // Mock earnings data for demonstration with realistic values
        const mockEarnings = {
          'op1': [
            { id: 'e1', operatorId: 'op1', bundleNumber: '8085', operation: 'shoulder_join', pieces: 25, earnings: 125, status: 'confirmed', completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), rate: 5.0 },
            { id: 'e2', operatorId: 'op1', bundleNumber: '8088', operation: 'shoulder_join', pieces: 30, earnings: 150, status: 'pending', completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), rate: 5.0 },
            { id: 'e3', operatorId: 'op1', bundleNumber: '8091', operation: 'shoulder_join', pieces: 20, earnings: 100, status: 'paid', completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), rate: 5.0 },
            { id: 'e4', operatorId: 'op1', bundleNumber: '8095', operation: 'shoulder_join', pieces: 35, earnings: 175, status: 'confirmed', completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), rate: 5.0 },
            { id: 'e5', operatorId: 'op1', bundleNumber: '8098', operation: 'shoulder_join', pieces: 28, earnings: 140, status: 'pending', completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), rate: 5.0 }
          ],
          'op2': [
            { id: 'e6', operatorId: 'op2', bundleNumber: '8086', operation: 'hem_fold', pieces: 40, earnings: 160, status: 'confirmed', completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), rate: 4.0 },
            { id: 'e7', operatorId: 'op2', bundleNumber: '8089', operation: 'hem_fold', pieces: 35, earnings: 140, status: 'paid', completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), rate: 4.0 },
            { id: 'e8', operatorId: 'op2', bundleNumber: '8092', operation: 'hem_fold', pieces: 45, earnings: 180, status: 'pending', completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), rate: 4.0 },
            { id: 'e9', operatorId: 'op2', bundleNumber: '8096', operation: 'hem_fold', pieces: 50, earnings: 200, status: 'confirmed', completedAt: new Date(Date.now() - 26 * 60 * 60 * 1000), rate: 4.0 }
          ],
          'op3': [
            { id: 'e10', operatorId: 'op3', bundleNumber: '8087', operation: 'collar_attach', pieces: 15, earnings: 90, status: 'confirmed', completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), rate: 6.0 },
            { id: 'e11', operatorId: 'op3', bundleNumber: '8090', operation: 'collar_attach', pieces: 20, earnings: 120, status: 'pending', completedAt: new Date(Date.now() - 7 * 60 * 60 * 1000), rate: 6.0 },
            { id: 'e12', operatorId: 'op3', bundleNumber: '8093', operation: 'collar_attach', pieces: 18, earnings: 108, status: 'paid', completedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), rate: 6.0 }
          ],
          'op4': [
            { id: 'e13', operatorId: 'op4', bundleNumber: '8088', operation: 'side_seam', pieces: 30, earnings: 135, status: 'confirmed', completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), rate: 4.5 },
            { id: 'e14', operatorId: 'op4', bundleNumber: '8094', operation: 'side_seam', pieces: 25, earnings: 112.5, status: 'pending', completedAt: new Date(Date.now() - 9 * 60 * 60 * 1000), rate: 4.5 },
            { id: 'e15', operatorId: 'op4', bundleNumber: '8097', operation: 'side_seam', pieces: 35, earnings: 157.5, status: 'confirmed', completedAt: new Date(Date.now() - 27 * 60 * 60 * 1000), rate: 4.5 }
          ],
          'op5': [
            { id: 'e16', operatorId: 'op5', bundleNumber: '8099', operation: 'button_attach', pieces: 50, earnings: 150, status: 'pending', completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), rate: 3.0 },
            { id: 'e17', operatorId: 'op5', bundleNumber: '8100', operation: 'button_attach', pieces: 60, earnings: 180, status: 'confirmed', completedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), rate: 3.0 }
          ],
          'op6': [
            { id: 'e18', operatorId: 'op6', bundleNumber: '8101', operation: 'sleeve_attach', pieces: 22, earnings: 132, status: 'confirmed', completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), rate: 6.0 },
            { id: 'e19', operatorId: 'op6', bundleNumber: '8102', operation: 'sleeve_attach', pieces: 18, earnings: 108, status: 'paid', completedAt: new Date(Date.now() - 28 * 60 * 60 * 1000), rate: 6.0 }
          ]
        };

        setOperators(mockOperators);
        setEarnings(mockEarnings);
        setLoading(false);

        // Try to load real data if available, but don't block the UI
        try {
          const operatorsQuery = query(
            collection(db, 'users'),
            where('role', '==', 'operator'),
            orderBy('name', 'asc')
          );
          
          const operatorsSnapshot = await getDocs(operatorsQuery);
          if (!operatorsSnapshot.empty) {
            const operatorsData = operatorsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setOperators(operatorsData);

            // Get real earnings data
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
            });

            return () => unsubscribe();
          }
        } catch (error) {
          console.log('Using mock data - Firebase not available:', error.message);
        }
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
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-green-100 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-green-800">
                            ₹{Math.round(stats.confirmedEarnings)}
                          </div>
                          <div className="text-xs text-green-600">
                            {isNepali ? 'पुष्टि भएको' : 'Confirmed'}
                          </div>
                        </div>
                        <div className="bg-yellow-100 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-yellow-800">
                            ₹{Math.round(stats.pendingEarnings)}
                          </div>
                          <div className="text-xs text-yellow-600">
                            {isNepali ? 'प्रतीक्षामा' : 'Pending'}
                          </div>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-blue-800">
                            {stats.earnings.filter(e => e.status === 'paid').length}
                          </div>
                          <div className="text-xs text-blue-600">
                            {isNepali ? 'भुक्तानी भयो' : 'Paid'}
                          </div>
                        </div>
                        <div className="bg-purple-100 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-purple-800">
                            ₹{Math.round(stats.avgEarningsPerWork)}
                          </div>
                          <div className="text-xs text-purple-600">
                            {isNepali ? 'औसत/काम' : 'Avg/Work'}
                          </div>
                        </div>
                      </div>

                      <h5 className="font-medium text-gray-900 mb-3">
                        {isNepali ? 'हालका कामहरूको विस्तार' : 'Detailed Work History'}
                      </h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {stats.earnings.slice(0, 10).map((earning) => (
                          <div key={earning.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                earning.status === 'confirmed' ? 'bg-green-500' :
                                earning.status === 'pending' ? 'bg-yellow-500' :
                                earning.status === 'paid' ? 'bg-blue-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-bold text-gray-900">{earning.bundleNumber}</p>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    earning.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    earning.status === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {earning.status === 'confirmed' ? (isNepali ? 'पुष्टि' : 'Confirmed') :
                                     earning.status === 'pending' ? (isNepali ? 'प्रतीक्षा' : 'Pending') :
                                     earning.status === 'paid' ? (isNepali ? 'भुक्तानी' : 'Paid') : 'Error'
                                    }
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">{earning.operation}</span> • 
                                  <span className="ml-1">{earning.pieces} {isNepali ? 'टुक्रा' : 'pieces'}</span> • 
                                  <span className="ml-1">₹{earning.rate}/{isNepali ? 'टुक्रा' : 'pc'}</span>
                                </p>
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDateTime ? formatDateTime(earning.completedAt) : earning.completedAt.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                ₹{earning.earnings}
                              </p>
                              <p className="text-xs text-gray-500">
                                {earning.pieces} × ₹{earning.rate}
                              </p>
                              {earning.status === 'pending' && (
                                <div className="mt-1">
                                  <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                                    {isNepali ? 'स्वीकार' : 'Approve'}
                                  </button>
                                </div>
                              )}
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