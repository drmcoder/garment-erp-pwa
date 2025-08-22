import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Settings,
  Download,
  Filter
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const ManagementDashboard = () => {
  const { t, currentLanguage, formatTime, formatNumber } = useLanguage();
  const { user } = useAuth();
  
  const [timeframe, setTimeframe] = useState('today');
  const [productionData, setProductionData] = useState({});
  const [operatorStats, setOperatorStats] = useState([]);

  useEffect(() => {
    // Sample management data
    setProductionData({
      today: {
        totalProduction: 3750,
        targetProduction: 5000,
        efficiency: 75,
        qualityScore: 96,
        revenue: 125000,
        costs: 72000,
        profit: 53000
      },
      week: {
        totalProduction: 23500,
        targetProduction: 30000,
        efficiency: 78,
        qualityScore: 94,
        revenue: 875000,
        costs: 504000,
        profit: 371000
      },
      month: {
        totalProduction: 98750,
        targetProduction: 120000,
        efficiency: 82,
        qualityScore: 95,
        revenue: 3250000,
        costs: 1950000,
        profit: 1300000
      }
    });

    setOperatorStats([
      { name: 'राम सिंह', efficiency: 95, pieces: 145, earnings: 362.50 },
      { name: 'सीता देवी', efficiency: 92, pieces: 138, earnings: 345.00 },
      { name: 'हरि बहादुर', efficiency: 90, pieces: 132, earnings: 330.00 },
      { name: 'गीता शर्मा', efficiency: 88, pieces: 128, earnings: 320.00 },
      { name: 'श्याम पोखरेल', efficiency: 85, pieces: 125, earnings: 312.50 }
    ]);
  }, []);

  const currentData = productionData[timeframe] || productionData.today;

  const StatCard = ({ title, value, subValue, icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="text-3xl font-bold text-gray-800 mt-2">{value}</div>
          {subValue && (
            <div className="text-sm text-gray-500 mt-1">{subValue}</div>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center mt-4 text-sm ${
          trend > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp className="w-4 h-4 mr-1" />
          {trend > 0 ? '+' : ''}{trend}% {t('comparison')}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t('management')} {t('dashboard')}
            </h1>
            <p className="text-gray-600">
              {currentLanguage === 'np' ? 'नमस्कार' : 'Welcome'}, {user?.name || 'Management'} | {formatTime(new Date())}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timeframe Selector */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">{t('today')}</option>
              <option value="week">{t('thisWeek')}</option>
              <option value="month">{t('thisMonth')}</option>
            </select>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Download className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={`${t('production')} (${t(timeframe)})`}
            value={formatNumber(currentData.totalProduction || 0)}
            subValue={`/ ${formatNumber(currentData.targetProduction || 0)} ${t('target')}`}
            icon={<Package className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100"
            trend={12}
          />
          
          <StatCard
            title={t('efficiency')}
            value={`${formatNumber(currentData.efficiency || 0)}%`}
            subValue={currentLanguage === 'np' ? 'लक्ष्य: ९०%' : 'Target: 90%'}
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            color="bg-green-100"
            trend={5}
          />
          
          <StatCard
            title={`${t('quality')} ${t('score')}`}
            value={`${formatNumber(currentData.qualityScore || 0)}%`}
            subValue={currentLanguage === 'np' ? 'लक्ष्य: ९५%' : 'Target: 95%'}
            icon={<AlertTriangle className="w-6 h-6 text-purple-600" />}
            color="bg-purple-100"
            trend={2}
          />
          
          <StatCard
            title={t('profit')}
            value={`रु. ${formatNumber((currentData.profit || 0) / 1000)}K`}
            subValue={`${t('revenue')}: रु. ${formatNumber((currentData.revenue || 0) / 1000)}K`}
            icon={<DollarSign className="w-6 h-6 text-orange-600" />}
            color="bg-orange-100"
            trend={18}
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              {t('topPerformers')} ({t('today')})
            </h3>
            
            <div className="space-y-3">
              {operatorStats.map((operator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{operator.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(operator.pieces)} {t('pieces')} | {operator.efficiency}% {t('efficiency')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">रु. {operator.earnings}</div>
                    <div className="text-sm text-gray-500">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Production Trends */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              {t('production')} {t('trends')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('today')} {t('target')}</span>
                <span className="font-medium">
                  {Math.round((currentData.totalProduction / currentData.targetProduction) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(currentData.totalProduction / currentData.targetProduction) * 100}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatNumber(48)}</div>
                  <div className="text-sm text-gray-600">{t('active')} {t('operators')}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(85)}</div>
                  <div className="text-sm text-gray-600">{t('completed')} {t('bundles')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Management Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t('systemStatus')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">99.2%</div>
              <div className="text-gray-600">{t('uptime')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">2.1s</div>
              <div className="text-gray-600">{t('avgResponseTime')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">47</div>
              <div className="text-gray-600">{t('activeUsers')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;