import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, getDocs, COLLECTIONS } from '../../config/firebase';
import MachineManagement from './MachineManagement';
import SupervisorManagement from './SupervisorManagement';
import AIProductionAnalytics from '../analytics/AIProductionAnalytics';
import LoginControlPanel from './LoginControlPanel';
import LocationManagement from './LocationManagement';
import OperatorAvatar from '../common/OperatorAvatar';
import { 
  Users, 
  UserCheck, 
  Cog, 
 
  GitBranch,
  TrendingUp,
  Activity,
  AlertCircle,
  Wrench,
  Calendar,
  Clock,
  Settings,
  BarChart3,
  Shield,
  Database,
  LogOut,
  ChevronDown,
  Bell,
  User,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createMissingUsers } from '../../utils/createUsers';

const AdminDashboard = () => {
  const { currentLanguage } = useLanguage();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [creatingUsers, setCreatingUsers] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalMachines: 0,
    totalLocations: 0,
  });

  // Load stats from localStorage or API
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('🔄 Loading admin dashboard stats from Firestore...');
      
      // Load real data from Firestore - focused on admin-level management
      const [supervisorsSnapshot, machinesSnapshot] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.SUPERVISORS)),
        getDocs(collection(db, COLLECTIONS.MACHINE_CONFIGS))
      ]);

      const supervisors = supervisorsSnapshot.docs || [];
      const machines = machinesSnapshot.docs || [];
      const locations = 3; // Mock locations count - should be from LocationService

      console.log('✅ Admin dashboard stats loaded:', {
        supervisors: supervisors.length, 
        machines: machines.length,
        locations: locations
      });

      setStats({
        totalSupervisors: supervisors.length,
        totalMachines: machines.length,
        totalLocations: locations
      });
    } catch (error) {
      console.error('❌ Error loading admin dashboard stats:', error);
      // Keep existing stats on error
    }
  };

  const handleCreateMissingUsers = async () => {
    if (!window.confirm('Create missing users (button, dinesh)? This will add them to the system.')) {
      return;
    }
    
    setCreatingUsers(true);
    try {
      const result = await createMissingUsers();
      if (result.success) {
        alert('✅ Users created successfully! You can now login with: button/123456 or dinesh/123456');
        await loadStats(); // Refresh stats
      } else {
        alert('❌ Failed to create users: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating users:', error);
      alert('❌ Error creating users: ' + error.message);
    } finally {
      setCreatingUsers(false);
    }
  };

  const tabs = [
    {
      id: 'analytics',
      label: currentLanguage === 'en' ? '🧠 AI Analytics' : '🧠 AI विश्लेषण',
      icon: Activity,
      count: 0,
      color: 'blue'
    },
    {
      id: 'supervisors',
      label: currentLanguage === 'en' ? 'Supervisors' : 'सुपरवाइजरहरू',
      icon: UserCheck,
      count: stats.totalSupervisors,
      color: 'green'
    },
    {
      id: 'machines',
      label: currentLanguage === 'en' ? 'Machines' : 'मेसिनहरू',
      icon: Cog,
      count: stats.totalMachines,
      color: 'purple'
    },
    {
      id: 'locations',
      label: currentLanguage === 'en' ? 'Locations' : 'स्थानहरू',
      icon: MapPin,
      count: stats.totalLocations,
      color: 'orange'
    },
    {
      id: 'logincontrol',
      label: currentLanguage === 'en' ? 'Login Control' : 'लगइन नियन्त्रण',
      icon: Shield,
      count: 0,
      color: 'red'
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AIProductionAnalytics />;
      case 'supervisors':
        return <SupervisorManagement onStatsUpdate={loadStats} />;
      case 'machines':
        return <MachineManagement onStatsUpdate={loadStats} />;
      case 'locations':
        return <LocationManagement onStatsUpdate={loadStats} />;
      case 'logincontrol':
        return <LoginControlPanel />;
      default:
        return <AIProductionAnalytics />;
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        icon: 'text-blue-500',
        stat: 'text-blue-700'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200', 
        text: 'text-green-600',
        icon: 'text-green-500',
        stat: 'text-green-700'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600', 
        icon: 'text-purple-500',
        stat: 'text-purple-700'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
        icon: 'text-orange-500', 
        stat: 'text-orange-700'
      },
      indigo: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-600',
        icon: 'text-indigo-500',
        stat: 'text-indigo-700'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-600',
        icon: 'text-red-500',
        stat: 'text-red-700'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glass Effect */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Admin Avatar */}
              <OperatorAvatar 
                operator={{
                  name: 'Admin',
                  avatar: {
                    type: 'emoji',
                    value: '🛡️',
                    bgColor: '#4F46E5',
                    textColor: '#FFFFFF'
                  },
                  status: 'available'
                }}
                size="lg"
                showStatus={true}
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 flex items-center space-x-2 mt-1">
                  <Database className="w-4 h-4" />
                  <span>
                    {currentLanguage === 'en' 
                      ? 'AI Powered Production Management System'
                      : 'AI संचालित उत्पादन प्रबन्धन प्रणाली'
                    }
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Enhanced Quick Stats Cards */}
              <div className="flex space-x-3">
                {tabs.slice(1, 4).map((tab) => {
                  const colors = getColorClasses(tab.color);
                  const IconComponent = tab.icon;
                  return (
                    <div key={tab.id} className={`${colors.bg} ${colors.border} border rounded-xl p-4 min-w-[100px] shadow-sm hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                        <div className={`text-2xl font-bold ${colors.stat}`}>{tab.count}</div>
                      </div>
                      <div className={`text-sm font-medium ${colors.text}`}>
                        {tab.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-3 hover:bg-white/50 rounded-xl transition-colors border border-white/20"
                  aria-label="User menu"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">Admin Panel</p>
                      <p className="text-sm text-gray-600">System Administrator</p>
                    </div>

                    <div className="py-2">
                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <User className="w-4 h-4" />
                        <span>{currentLanguage === 'en' ? 'Profile' : 'प्रोफाइल'}</span>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>{currentLanguage === 'en' ? 'Settings' : 'सेटिङ्गहरू'}</span>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <Bell className="w-4 h-4" />
                        <span>{currentLanguage === 'en' ? 'Notifications' : 'सूचनाहरू'}</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          handleCreateMissingUsers();
                        }}
                        disabled={creatingUsers}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        <Users className="w-4 h-4" />
                        <span>
                          {creatingUsers ? (currentLanguage === 'en' ? 'Creating...' : 'बनाउँदै...') : 
                           (currentLanguage === 'en' ? 'Create Missing Users' : 'छुटेका प्रयोगकर्ता बनाउनुहोस्')}
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{currentLanguage === 'en' ? 'Logout' : 'लगआउट'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information Overview - Real Data Only */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* System Status */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {currentLanguage === 'np' ? 'अनलाइन' : 'Online'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {currentLanguage === 'np' ? 'प्रणाली स्थिति' : 'System Status'}
            </h3>
            <p className="text-2xl font-bold text-green-600 mb-2">
              {currentLanguage === 'np' ? 'सक्रिय' : 'Active'}
            </p>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'वर्तमान स्थिति' : 'Current Status'}
            </p>
          </div>

          {/* Total Supervisors */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {currentLanguage === 'np' ? 'सुपरवाइजरहरू' : 'Supervisors'}
            </h3>
            <p className="text-2xl font-bold text-blue-600 mb-2">{stats.totalSupervisors}</p>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'कुल' : 'Total'}
            </p>
          </div>

          {/* Total Machines */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Cog className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {currentLanguage === 'np' ? 'मेसिनहरू' : 'Machines'}
            </h3>
            <p className="text-2xl font-bold text-purple-600 mb-2">{stats.totalMachines}</p>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'कुल' : 'Total'}
            </p>
          </div>

          {/* Total Locations */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {currentLanguage === 'np' ? 'स्थानहरू' : 'Locations'}
            </h3>
            <p className="text-2xl font-bold text-orange-600 mb-2">{stats.totalLocations}</p>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'कुल' : 'Total'}
            </p>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const colors = getColorClasses(tab.color);
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[200px] py-6 px-6 flex flex-col items-center space-y-3 border-b-3 transition-all duration-200 ${
                    isActive
                      ? `border-${tab.color}-500 bg-gradient-to-br ${colors.bg}`
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? colors.bg : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${isActive ? colors.icon : 'text-gray-500'}`} />
                  </div>
                  
                  <div className="text-center">
                    <div className={`font-semibold ${isActive ? colors.text : 'text-gray-700'}`}>
                      {tab.label}
                    </div>
                    {tab.count > 0 && (
                      <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isActive 
                          ? `${colors.bg} ${colors.text} border ${colors.border}`
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;