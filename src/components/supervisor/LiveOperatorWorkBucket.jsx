import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  PlayCircle, 
  PauseCircle, 
  CheckCircle, 
  Clock, 
  Package,
  AlertTriangle,
  Eye,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, query, where, onSnapshot, orderBy } from '../../config/firebase';
import OperatorAvatar from '../common/OperatorAvatar';

const LiveOperatorWorkBucket = () => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  // State management
  const [operators, setOperators] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMachine, setFilterMachine] = useState('all');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time data subscription
  useEffect(() => {
    const unsubscribes = [];

    // Subscribe to operators
    const operatorsQuery = query(
      collection(db, 'operators'),
      orderBy('name', 'asc')
    );
    
    const unsubOperators = onSnapshot(operatorsQuery, (snapshot) => {
      const operatorData = [];
      snapshot.forEach(doc => {
        operatorData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setOperators(operatorData);
      setLastUpdated(new Date());
    });
    unsubscribes.push(unsubOperators);

    // Subscribe to work items
    const workItemsQuery = query(
      collection(db, 'workItems'),
      orderBy('assignedAt', 'desc')
    );
    
    const unsubWorkItems = onSnapshot(workItemsQuery, (snapshot) => {
      const workData = [];
      snapshot.forEach(doc => {
        workData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setWorkItems(workData);
      setLoading(false);
      setLastUpdated(new Date());
    });
    unsubscribes.push(unsubWorkItems);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Get operator work statistics
  const getOperatorStats = (operatorId) => {
    const operatorWork = workItems.filter(work => work.assignedOperator === operatorId);
    const activeWork = operatorWork.filter(work => work.status === 'in_progress' || work.status === 'started');
    const pendingWork = operatorWork.filter(work => work.status === 'assigned' || work.status === 'pending');
    const completedToday = operatorWork.filter(work => {
      if (work.status === 'completed' || work.status === 'operator_completed') {
        const completedDate = work.completedAt?.toDate ? work.completedAt.toDate() : new Date(work.completedAt);
        const today = new Date();
        return completedDate.toDateString() === today.toDateString();
      }
      return false;
    });

    const totalPieces = completedToday.reduce((sum, work) => sum + (work.pieces || 0), 0);
    const totalEarnings = completedToday.reduce((sum, work) => sum + (work.earnings || (work.pieces * work.rate) || 0), 0);

    return {
      activeWork: activeWork.length,
      pendingWork: pendingWork.length,
      completedToday: completedToday.length,
      totalPieces,
      totalEarnings,
      currentWork: activeWork[0] || null,
      efficiency: calculateEfficiency(operatorWork)
    };
  };

  const calculateEfficiency = (operatorWork) => {
    const completedWork = operatorWork.filter(work => work.status === 'completed' || work.status === 'operator_completed');
    if (completedWork.length === 0) return 0;
    
    const totalAssigned = operatorWork.length;
    const totalCompleted = completedWork.length;
    return Math.round((totalCompleted / totalAssigned) * 100);
  };

  // Filter operators based on search and filters
  const getFilteredOperators = () => {
    return operators.filter(operator => {
      const matchesSearch = operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           operator.nameNp?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const stats = getOperatorStats(operator.id);
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && stats.activeWork > 0) ||
                           (filterStatus === 'idle' && stats.activeWork === 0) ||
                           (filterStatus === 'productive' && stats.completedToday > 0);
      
      const matchesMachine = filterMachine === 'all' || operator.machine === filterMachine;
      
      return matchesSearch && matchesStatus && matchesMachine;
    });
  };

  const getStatusColor = (stats) => {
    if (stats.activeWork > 0) return 'text-green-600 bg-green-100';
    if (stats.pendingWork > 0) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (stats) => {
    if (stats.activeWork > 0) return isNepali ? 'काम गर्दै' : 'Working';
    if (stats.pendingWork > 0) return isNepali ? 'पर्खाइमा' : 'Waiting';
    return isNepali ? 'निष्क्रिय' : 'Idle';
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getMachineIcon = (machine) => {
    const icons = {
      'single-needle': '📍',
      'overlock': '🔗',
      'flatlock': '📎',
      'buttonhole': '🕳️',
      'multi-skill': '⚙️'
    };
    return icons[machine] || '⚙️';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">
            {isNepali ? 'लाइभ डेटा लोड गर्दै...' : 'Loading live data...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Eye className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? 'लाइभ अपरेटर वर्क बकेट' : 'Live Operator Work Bucket'}
            </h1>
            <p className="text-gray-600">
              {isNepali ? 'रियल-टाइम अपरेटर कार्य निगरानी' : 'Real-time operator work monitoring'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Activity className="w-4 h-4" />
            <span>{isNepali ? 'अन्तिम अपडेट:' : 'Last Update:'}</span>
            <span className="font-medium">{lastUpdated.toLocaleTimeString()}</span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isNepali ? 'रिफ्रेस' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-green-100 text-sm font-medium">
                {isNepali ? 'काम गरिरहेका' : 'Active Workers'}
              </h3>
              <p className="text-2xl font-bold mt-2">
                {operators.filter(op => getOperatorStats(op.id).activeWork > 0).length}
              </p>
            </div>
            <PlayCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-100 text-sm font-medium">
                {isNepali ? 'पर्खाइमा' : 'Waiting'}
              </h3>
              <p className="text-2xl font-bold mt-2">
                {operators.filter(op => {
                  const stats = getOperatorStats(op.id);
                  return stats.activeWork === 0 && stats.pendingWork > 0;
                }).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-100 text-sm font-medium">
                {isNepali ? 'निष्क्रिय' : 'Idle'}
              </h3>
              <p className="text-2xl font-bold mt-2">
                {operators.filter(op => {
                  const stats = getOperatorStats(op.id);
                  return stats.activeWork === 0 && stats.pendingWork === 0;
                }).length}
              </p>
            </div>
            <PauseCircle className="w-8 h-8 text-gray-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-blue-100 text-sm font-medium">
                {isNepali ? 'आजको पूर्ण' : 'Today Completed'}
              </h3>
              <p className="text-2xl font-bold mt-2">
                {operators.reduce((sum, op) => sum + getOperatorStats(op.id).completedToday, 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={isNepali ? 'अपरेटर खोज्नुहोस्...' : 'Search operators...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{isNepali ? 'सबै स्थिति' : 'All Status'}</option>
              <option value="active">{isNepali ? 'काम गर्दै' : 'Working'}</option>
              <option value="idle">{isNepali ? 'निष्क्रिय' : 'Idle'}</option>
              <option value="productive">{isNepali ? 'उत्पादक' : 'Productive'}</option>
            </select>

            <select
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{isNepali ? 'सबै मेसिन' : 'All Machines'}</option>
              <option value="single-needle">{isNepali ? 'सिंगल नीडल' : 'Single Needle'}</option>
              <option value="overlock">{isNepali ? 'ओभरलक' : 'Overlock'}</option>
              <option value="flatlock">{isNepali ? 'फ्ल्यालक' : 'Flatlock'}</option>
              <option value="buttonhole">{isNepali ? 'बटनहोल' : 'Buttonhole'}</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>
              {getFilteredOperators().length} {isNepali ? 'अपरेटर' : 'operators'}
            </span>
          </div>
        </div>
      </div>

      {/* Operators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {getFilteredOperators().map((operator) => {
          const stats = getOperatorStats(operator.id);
          return (
            <div 
              key={operator.id} 
              className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-shadow p-6"
            >
              {/* Operator Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <OperatorAvatar
                    operator={{
                      name: operator.name,
                      avatar: {
                        type: 'emoji',
                        value: getMachineIcon(operator.machine),
                        bgColor: stats.activeWork > 0 ? '#22C55E' : stats.pendingWork > 0 ? '#EAB308' : '#6B7280'
                      },
                      status: stats.activeWork > 0 ? 'busy' : 'available',
                      currentWorkload: stats.activeWork + stats.pendingWork
                    }}
                    size="md"
                    showStatus={true}
                    showWorkload={true}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{operator.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      {getMachineIcon(operator.machine)} {operator.machine?.replace('-', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stats)}`}>
                  {getStatusText(stats)}
                </div>
              </div>

              {/* Work Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.activeWork}</div>
                  <div className="text-xs text-gray-600">{isNepali ? 'सक्रिय' : 'Active'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingWork}</div>
                  <div className="text-xs text-gray-600">{isNepali ? 'पेन्डिंग' : 'Pending'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.completedToday}</div>
                  <div className="text-xs text-gray-600">{isNepali ? 'पूर्ण' : 'Done'}</div>
                </div>
              </div>

              {/* Current Work */}
              {stats.currentWork ? (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800 text-sm mb-1">
                        {isNepali ? '🔄 हालको काम' : '🔄 Current Work'}
                      </h4>
                      <p className="text-green-700 text-sm">
                        {stats.currentWork.readableId || `#${stats.currentWork.id.slice(-6)}`}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-green-600">
                          {stats.currentWork.currentOperation || stats.currentWork.operation}
                        </span>
                        <span className="text-xs text-green-500">
                          {stats.currentWork.pieces || 0} {isNepali ? 'टुक्रा' : 'pcs'}
                        </span>
                      </div>
                    </div>
                    <PlayCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              ) : stats.pendingWork > 0 ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-yellow-800 text-sm">
                        {isNepali ? '⏳ पर्खाइमा' : '⏳ Waiting for Work'}
                      </h4>
                      <p className="text-yellow-700 text-xs">
                        {stats.pendingWork} {isNepali ? 'काम असाइन गरिएको' : 'work items assigned'}
                      </p>
                    </div>
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-l-4 border-gray-400 p-3 mb-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm">
                        {isNepali ? '💤 निष्क्रिय' : '💤 Idle'}
                      </h4>
                      <p className="text-gray-600 text-xs">
                        {isNepali ? 'कुनै काम असाइन गरिएको छैन' : 'No work assigned'}
                      </p>
                    </div>
                    <PauseCircle className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Package className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="font-semibold text-blue-800">{stats.totalPieces}</span>
                  </div>
                  <p className="text-blue-600 text-xs">{isNepali ? 'आजका टुक्रा' : 'Today Pieces'}</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="w-4 h-4 text-green-600 mr-1" />
                    <span className="font-semibold text-green-800">₹{Math.round(stats.totalEarnings)}</span>
                  </div>
                  <p className="text-green-600 text-xs">{isNepali ? 'आजको आम्दानी' : 'Today Earnings'}</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedOperator(operator)}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {isNepali ? '📋 विस्तृत हेर्नुहोस्' : '📋 View Details'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {getFilteredOperators().length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {isNepali ? 'कुनै अपरेटर फेला परेन' : 'No Operators Found'}
          </h3>
          <p className="text-gray-500">
            {isNepali ? 'खोज शर्त वा फिल्टर परिवर्तन गर्नुहोस्' : 'Try changing your search or filter criteria'}
          </p>
        </div>
      )}

      {/* Selected Operator Modal/Detail View can be added here */}
      {selectedOperator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedOperator.name} - {isNepali ? 'विस्तृत विवरण' : 'Detailed View'}
                </h2>
                <button
                  onClick={() => setSelectedOperator(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Detailed operator information would go here */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600">
                  {isNepali 
                    ? 'विस्तृत अपरेटर जानकारी विकास चरणमा छ।'
                    : 'Detailed operator information is under development.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOperatorWorkBucket;