import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Target,
  Eye
} from 'lucide-react';

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';
  const [stats, setStats] = useState({
    totalOperators: 12,
    activeOperators: 10,
    todayTarget: 500,
    todayCompleted: 425,
    efficiency: 85,
    qualityScore: 94,
    pendingBundles: 8,
    completedBundles: 32
  });

  const [operatorPerformance, setOperatorPerformance] = useState([
    { 
      id: 1, 
      name: 'Ram Bahadur', 
      nameNp: 'राम बहादुर', 
      station: 'Station-1', 
      stationNp: 'स्टेसन-1', 
      completed: 45, 
      target: 50, 
      efficiency: 90, 
      status: 'active' 
    },
    { 
      id: 2, 
      name: 'Sita Devi', 
      nameNp: 'सीता देवी', 
      station: 'Station-2', 
      stationNp: 'स्टेसन-2', 
      completed: 48, 
      target: 50, 
      efficiency: 96, 
      status: 'active' 
    },
    { 
      id: 3, 
      name: 'Hari Prasad', 
      nameNp: 'हरि प्रसाद', 
      station: 'Station-3', 
      stationNp: 'स्टेसन-3', 
      completed: 42, 
      target: 50, 
      efficiency: 84, 
      status: 'active' 
    },
    { 
      id: 4, 
      name: 'Geeta Shrestha', 
      nameNp: 'गीता श्रेष्ठ', 
      station: 'Station-4', 
      stationNp: 'स्टेसन-4', 
      completed: 50, 
      target: 50, 
      efficiency: 100, 
      status: 'active' 
    },
    { 
      id: 5, 
      name: 'Kamal Thapa', 
      nameNp: 'कमल थापा', 
      station: 'Station-5', 
      stationNp: 'स्टेसन-5', 
      completed: 38, 
      target: 50, 
      efficiency: 76, 
      status: 'break' 
    },
  ]);

  const [linePerformance, setLinePerformance] = useState([
    { line: 'Line A', lineNp: 'लाइन A', target: 200, completed: 180, efficiency: 90, operators: 5 },
    { line: 'Line B', lineNp: 'लाइन B', target: 200, completed: 165, efficiency: 82.5, operators: 4 },
    { line: 'Line C', lineNp: 'लाइन C', target: 100, completed: 80, efficiency: 80, operators: 3 },
  ]);

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 95) return 'text-green-600 bg-green-50 border-green-200';
    if (efficiency >= 85) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (efficiency >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      break: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      active: isNepali ? 'सक्रिय' : 'Active',
      break: isNepali ? 'विश्राम' : 'Break',
      inactive: isNepali ? 'निष्क्रिय' : 'Inactive'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {isNepali ? 'सुपरवाइजर ड्यासबोर्ड' : 'Supervisor Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isNepali 
              ? `स्वागत छ, ${user?.name || 'सुपरवाइजर'}! आजको प्रगति र टोलीको कार्यसम्पादन हेर्नुहोस्।`
              : `Welcome, ${user?.name || 'Supervisor'}! Monitor today's progress and team performance.`
            }
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isNepali ? 'कुल अपरेटर' : 'Total Operators'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOperators}</p>
                <p className="text-xs text-green-600">{stats.activeOperators} {isNepali ? 'सक्रिय' : 'Active'}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isNepali ? 'आजको लक्ष्य' : 'Today\'s Target'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCompleted}/{stats.todayTarget}</p>
                <p className="text-xs text-blue-600">{Math.round((stats.todayCompleted / stats.todayTarget) * 100)}% {isNepali ? 'पूरा' : 'Complete'}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isNepali ? 'दक्षता' : 'Efficiency'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.efficiency}%</p>
                <p className="text-xs text-green-600">+2% {isNepali ? 'हिजो देखि' : 'from yesterday'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{isNepali ? 'गुणस्तर स्कोर' : 'Quality Score'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qualityScore}%</p>
                <p className="text-xs text-green-600">{isNepali ? 'उत्कृष्ट' : 'Excellent'}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Operator Performance */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{isNepali ? 'अपरेटर कार्यसम्पादन' : 'Operator Performance'}</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  {isNepali ? 'सबै हेर्नुहोस्' : 'View All'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {operatorPerformance.map((operator) => (
                  <div key={operator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {operator.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{isNepali ? operator.nameNp : operator.name}</p>
                        <p className="text-sm text-gray-600">{isNepali ? operator.stationNp : operator.station}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getEfficiencyColor(operator.efficiency)}`}>
                          {operator.efficiency}%
                        </span>
                        {getStatusBadge(operator.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {operator.completed}/{operator.target}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Line Performance */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{isNepali ? 'लाइन कार्यसम्पादन' : 'Line Performance'}</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {linePerformance.map((line, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{isNepali ? line.lineNp : line.line}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getEfficiencyColor(line.efficiency)}`}>
                        {line.efficiency}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{isNepali ? 'लक्ष्य' : 'Target'}: <span className="font-medium text-gray-900">{line.target}</span></p>
                        <p className="text-gray-600">{isNepali ? 'पूरा' : 'Completed'}: <span className="font-medium text-gray-900">{line.completed}</span></p>
                      </div>
                      <div>
                        <p className="text-gray-600">{isNepali ? 'अपरेटर' : 'Operators'}: <span className="font-medium text-gray-900">{line.operators}</span></p>
                        <p className="text-gray-600">{isNepali ? 'बाँकी' : 'Remaining'}: <span className="font-medium text-gray-900">{line.target - line.completed}</span></p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(line.completed / line.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{isNepali ? 'आजका कार्यहरू' : 'Today\'s Tasks'}</h2>
          </div>
          <div className="p-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Eye className="w-5 h-5 text-blue-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{isNepali ? 'लाइन निरीक्षण' : 'Line Inspection'}</p>
                  <p className="text-sm text-gray-600">{isNepali ? 'प्रत्येक लाइनको निरीक्षण गर्नुहोस्' : 'Inspect each production line'}</p>
                </div>
              </button>

              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{isNepali ? 'रिपोर्ट जेनेरेट' : 'Generate Reports'}</p>
                  <p className="text-sm text-gray-600">{isNepali ? 'दैनिक प्रगति रिपोर्ट' : 'Daily progress reports'}</p>
                </div>
              </button>

              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{isNepali ? 'समस्या समाधान' : 'Issue Resolution'}</p>
                  <p className="text-sm text-gray-600">{isNepali ? 'बाँकी समस्याहरू हेर्नुहोस्' : 'Review pending issues'}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;