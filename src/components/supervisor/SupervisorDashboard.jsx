import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, addDoc, getDocs, setDoc, doc, query, where, orderBy, serverTimestamp, COLLECTIONS } from '../../config/firebase';
import { WIPService, OperatorService, ConfigService } from '../../services/firebase-services';
import BundleFlowTracker from './BundleFlowTracker';
import WIPStatusBoard from './WIPStatusBoard';
import WIPDataManager from './WIPDataManager';
import WIPProgressTracker from './WIPProgressTracker';
import ProcessTemplateManager from './ProcessTemplateManager';
import WorkAssignmentManager from './WorkAssignmentManager';
import SelfAssignmentApproval from './SelfAssignmentApproval';
import DamageQueue from './DamageQueue';
import DamageNotificationSystem from '../common/DamageNotificationSystem';
import LiveOperatorWorkBucket from './LiveOperatorWorkBucket';
import OperatorAvatar from '../common/OperatorAvatar';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Target,
  Eye,
  Activity,
  Clock,
  Award,
  Zap,
  Settings,
  Bell,
  Calendar,
  PieChart,
  Layers,
  UserCheck,
  Package,
  Workflow,
  ClipboardCheck,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ChevronDown,
  User
} from 'lucide-react';

const SupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';
  const [showBundleTracker, setShowBundleTracker] = useState(false);
  const [showWIPBoard, setShowWIPBoard] = useState(false);
  const [showWIPManager, setShowWIPManager] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [wipData, setWipData] = useState(null);
  const [showWorkAssignment, setShowWorkAssignment] = useState(false);
  const [showWIPProgress, setShowWIPProgress] = useState(false);
  const [showSelfAssignmentApproval, setShowSelfAssignmentApproval] = useState(false);
  const [showDamageQueue, setShowDamageQueue] = useState(false);
  const [showLiveOperatorBucket, setShowLiveOperatorBucket] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    totalOperators: 0,
    activeOperators: 0,
    todayTarget: 0,
    todayCompleted: 0,
    efficiency: 0,
    qualityScore: 0,
    pendingBundles: 0,
    completedBundles: 0
  });

  const [operatorPerformance, setOperatorPerformance] = useState([]);
  const [linePerformance, setLinePerformance] = useState([]);

  // Load data from Firestore/localStorage fallback
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load configurations first
        const [machines, skills] = await Promise.all([
          ConfigService.getMachines(),
          ConfigService.getSkills()
        ]);
        
        // Load operators from Firestore first, fallback to localStorage
        let operators = [];
        try {
          const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
          operators = operatorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(user => user.active !== false);
        } catch (error) {
          console.warn('Failed to load operators from Firestore:', error);
          // Use empty array instead of localStorage fallback
          operators = [];
        }
        
        // Helper function to get operator's primary skill
        const getOperatorSkill = (operator) => {
          if (operator.skills && operator.skills.length > 0) {
            const skillId = operator.skills[0];
            const skill = skills.find(s => s.id === skillId);
            return skill ? { name: skill.name, nameNp: skill.nameNp } : null;
          }
          
          // Fallback: determine skill from assigned machines
          if (operator.assignedMachines && operator.assignedMachines.length > 0) {
            const machineId = operator.assignedMachines[0];
            const machine = machines.find(m => m.id === machineId);
            const machineType = machine?.type?.toLowerCase() || machineId;
            
            const skill = skills.find(s => 
              s.machineTypes && s.machineTypes.includes(machineType)
            );
            
            if (skill) {
              return { name: skill.name, nameNp: skill.nameNp };
            }
          }
          
          // Final fallback
          return { name: 'General Operator', nameNp: 'सामान्य अपरेटर' };
        };
        
        // Helper function to get operator's assigned machine display name
        const getOperatorMachineDisplay = (operator) => {
          if (operator.assignedMachines && operator.assignedMachines.length > 0) {
            const machineId = operator.assignedMachines[0];
            const machine = machines.find(m => m.id === machineId);
            if (machine) {
              return {
                name: machine.name,
                nameNp: machine.nameNp || machine.name,
                icon: machine.icon || '⚙️'
              };
            }
          }
          
          // Fallback to station if no machine assigned
          return {
            name: operator.station || `${operator.machine || 'Station'}-${operator.name?.split(' ')[0] || 'Op'}`,
            nameNp: operator.stationNp || operator.station || `${operator.machine || 'स्टेशन'}-${operator.name?.split(' ')[0] || 'अप'}`,
            icon: '🏭'
          };
        };
        
        const operatorData = operators.map(user => {
          const skill = getOperatorSkill(user);
          const machineDisplay = getOperatorMachineDisplay(user);
          
          return {
            id: user.id,
            name: user.name,
            nameNp: user.nameNp || user.name,
            skill: skill.name,
            skillNp: skill.nameNp,
            machineDisplay: machineDisplay.name,
            machineDisplayNp: machineDisplay.nameNp,
            machineIcon: machineDisplay.icon,
            completed: 0, // Will be calculated from work data
            target: 50,
            efficiency: user.efficiency || 85,
            status: 'active'
          };
        });
        
        setOperatorPerformance(operatorData);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalOperators: operators.length,
          activeOperators: operators.length // Assume all are active for now
        }));
        
        // Load work data from Firestore first, fallback to localStorage
        let workItems = [];
        try {
          const workItemsSnapshot = await getDocs(collection(db, COLLECTIONS.WORK_ASSIGNMENTS));
          workItems = workItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.warn('Failed to load work items from Firestore:', error);
          // Use empty array instead of localStorage fallback
          workItems = [];
        }
        
        const completedToday = workItems.filter(item => 
          item.status === 'completed' && 
          new Date(item.completedAt).toDateString() === new Date().toDateString()
        );
        
        setStats(prev => ({
          ...prev,
          todayCompleted: completedToday.reduce((sum, item) => sum + (item.pieces || 0), 0),
          completedBundles: completedToday.length
        }));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadDashboardData();
  }, []);

  // No sample work initialization - use real data only


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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Modern Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {/* Supervisor Avatar */}
              <OperatorAvatar 
                operator={{
                  name: user?.name || 'Supervisor',
                  avatar: {
                    type: 'emoji',
                    value: '👨‍💼',
                    bgColor: '#7C3AED',
                    textColor: '#FFFFFF'
                  },
                  status: 'available',
                  currentWorkload: stats.activeOperators
                }}
                size="lg"
                showStatus={true}
                showWorkload={true}
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {isNepali ? 'सुपरवाइजर ड्यासबोर्ड' : 'Supervisor Dashboard'}
                </h1>
                <p className="text-gray-600 flex items-center space-x-2 mt-1">
                  <Activity className="w-4 h-4" />
                  <span>
                    {isNepali 
                      ? `स्वागत छ, ${user?.name || 'सुपरवाइजर'}! टोलीको निरीक्षण गर्नुहोस्।`
                      : `Welcome, ${user?.name || 'Supervisor'}! Monitor your team performance.`
                    }
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Real-time Status Indicator */}
              <div className="flex items-center space-x-2 bg-green-100 border border-green-200 rounded-xl px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium text-sm">Live</span>
              </div>
              
              {/* Damage Notification System */}
              <DamageNotificationSystem />

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
                      <p className="font-semibold text-gray-800">{user?.name || 'Supervisor'}</p>
                      <p className="text-sm text-gray-600">{isNepali ? 'सुपरभाइजर' : 'Supervisor'}</p>
                    </div>

                    <div className="py-2">
                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <User className="w-4 h-4" />
                        <span>{isNepali ? 'प्रोफाइल' : 'Profile'}</span>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>{isNepali ? 'सेटिङ्गहरू' : 'Settings'}</span>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors">
                        <Bell className="w-4 h-4" />
                        <span>{isNepali ? 'सूचनाहरू' : 'Notifications'}</span>
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
                        <span>{isNepali ? 'लगआउट' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Team Overview */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.totalOperators}</div>
                <div className="text-xs text-green-600 flex items-center justify-end space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>{stats.activeOperators} {isNepali ? 'सक्रिय' : 'Active'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{isNepali ? 'कुल अपरेटर' : 'Total Operators'}</h3>
              <p className="text-sm text-gray-600">{isNepali ? 'टोलीको आकार' : 'Team size overview'}</p>
            </div>
          </div>

          {/* Production Target */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.todayCompleted}<span className="text-lg text-gray-500">/{stats.todayTarget}</span></div>
                <div className="text-xs text-blue-600 flex items-center justify-end space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{Math.round((stats.todayCompleted / stats.todayTarget) * 100)}% {isNepali ? 'पूरा' : 'Complete'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{isNepali ? 'आजको लक्ष्य' : 'Today\'s Target'}</h3>
              <p className="text-sm text-gray-600">{isNepali ? 'उत्पादन लक्ष्य' : 'Production target'}</p>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.round((stats.todayCompleted / stats.todayTarget) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Efficiency */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.efficiency}%</div>
                <div className="text-xs text-green-600 flex items-center justify-end space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2% {isNepali ? 'हिजो देखि' : 'vs yesterday'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{isNepali ? 'दक्षता' : 'Efficiency'}</h3>
              <p className="text-sm text-gray-600">{isNepali ? 'औसत कार्यसम्पादन' : 'Average performance'}</p>
            </div>
          </div>

          {/* Quality Score */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.qualityScore}%</div>
                <div className="text-xs text-green-600">{isNepali ? 'उत्कृष्ट' : 'Excellent'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{isNepali ? 'गुणस्तर स्कोर' : 'Quality Score'}</h3>
              <p className="text-sm text-gray-600">{isNepali ? 'गुणस्तर मापदण्ड' : 'Quality standard'}</p>
            </div>
          </div>
        </div>

        {/* Modern Quick Actions Grid */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
                <Zap className="w-6 h-6 text-indigo-600" />
                <span>{isNepali ? 'त्वरित कार्यहरू' : 'Quick Actions'}</span>
              </h2>
              <p className="text-gray-600 mt-1">{isNepali ? 'मुख्य कार्यहरूमा द्रुत पहुँच' : 'Quick access to main functions'}</p>
            </div>
            <RefreshCw className="w-5 h-5 text-gray-400 hover:text-indigo-600 cursor-pointer hover:animate-spin" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* WIP Status Board */}
            <button
              onClick={async () => {
                console.log('🔄 Loading WIP data for Status Board...');
                try {
                  const wipResult = await WIPService.getAllWIPEntries();
                  // Fix: Service returns 'wipEntries', not 'entries'
                  if (wipResult.success && wipResult.wipEntries && wipResult.wipEntries.length > 0) {
                    // Transform WIP entries to the format WIPStatusBoard expects
                    const transformedWipData = {
                      colors: []
                    };
                    
                    wipResult.wipEntries.forEach(wipEntry => {
                      if (wipEntry.rolls && wipEntry.rolls.length > 0) {
                        wipEntry.rolls.forEach(roll => {
                          const existingColor = transformedWipData.colors.find(c => c.name === roll.colorName);
                          if (existingColor) {
                            existingColor.pieces += roll.pieces || 0;
                            existingColor.rolls.push(roll);
                          } else {
                            transformedWipData.colors.push({
                              name: roll.colorName,
                              pieces: roll.pieces || 0,
                              rolls: [roll],
                              lotNumber: wipEntry.lotNumber,
                              article: wipEntry.parsedStyles?.[0]?.articleNumber,
                              styleName: wipEntry.parsedStyles?.[0]?.styleName
                            });
                          }
                        });
                      }
                    });
                    
                    console.log('✅ Transformed WIP data for Status Board:', transformedWipData);
                    setWipData(transformedWipData);
                  } else {
                    console.log('ℹ️ No WIP entries found');
                    setWipData(null);
                  }
                } catch (error) {
                  console.error('❌ Error loading WIP data for Status Board:', error);
                  setWipData(null);
                }
                setShowWIPBoard(true);
              }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'WIP स्थिति बोर्ड' : 'WIP Status Board'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'रङ र साइज अनुसार प्रगति हेर्नुहोस्' : 'View progress by color and size'}
              </p>
            </button>

            {/* Bundle Flow Tracker */}
            <button
              onClick={() => setShowBundleTracker(true)}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Workflow className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'बन्डल फ्लो ट्र्याकर' : 'Bundle Flow Tracker'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'सिलाई प्रक्रियाहरू बीच ट्र्याकिङ' : 'Track bundles between operations'}
              </p>
            </button>

            {/* WIP Data Manager */}
            <button
              onClick={() => setShowWIPManager(true)}
              className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-6 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'WIP डेटा प्रबन्धन' : 'WIP Data Manager'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'एन्ट्री हेर्नुहोस्, सम्पादन र प्रबन्धन गर्नुहोस्' : 'View, edit and manage entries'}
              </p>
            </button>

            {/* Template Manager */}
            <button
              onClick={() => setShowTemplateManager(true)}
              className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6 hover:from-indigo-100 hover:to-blue-100 hover:border-indigo-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <Settings className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'टेम्प्लेट प्रबन्धन' : 'Template Manager'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'प्रक्रिया टेम्प्लेट सिर्जना र सम्पादन' : 'Create and edit process templates'}
              </p>
            </button>

            {/* Work Assignment */}
            <button 
              onClick={() => setShowWorkAssignment(true)}
              className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'काम असाइनमेन्ट' : 'Work Assignment'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'अपरेटरहरूलाई काम असाइन गर्नुहोस्' : 'Assign work to operators'}
              </p>
            </button>

            {/* Progress Tracker */}
            <button 
              onClick={() => setShowWIPProgress(true)}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'प्रगति ट्र्याकर' : 'Progress Tracker'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'लट र बन्डलको प्रगति हेर्नुहोस्' : 'Track lot and bundle progress'}
              </p>
            </button>

            {/* Damage Queue - High Priority */}
            <button 
              onClick={() => setShowDamageQueue(true)}
              className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6 hover:from-red-100 hover:to-rose-100 hover:border-red-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'क्षति र मर्मत सूची' : 'Damage & Rework Queue'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'क्षतिग्रस्त टुक्राहरू व्यवस्थापन गर्नुहोस्' : 'Manage damaged pieces and rework'}
              </p>
            </button>

            {/* Live Operator Work Bucket */}
            <button 
              onClick={() => setShowLiveOperatorBucket(true)}
              className="bg-gradient-to-br from-cyan-50 to-sky-50 border-2 border-cyan-200 rounded-2xl p-6 hover:from-cyan-100 hover:to-sky-100 hover:border-cyan-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition-colors">
                <Activity className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'लाइभ अपरेटर बकेट' : 'Live Operator Bucket'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'अपरेटरहरूको काम र स्थिति हेर्नुहोस्' : 'Monitor operator work and status'}
              </p>
            </button>
            {/* Self-Assignment Approval */}
            <button 
              onClick={() => setShowSelfAssignmentApproval(true)}
              className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 hover:from-violet-100 hover:to-purple-100 hover:border-violet-300 transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-200 transition-colors">
                <ClipboardCheck className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-center">
                {isNepali ? 'सेल्फ-असाइनमेन्ट अनुमोदन' : 'Self-Assignment Approval'}
              </h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                {isNepali ? 'अपरेटरहरूको सेल्फ-असाइनमेन्ट अनुमोदन गर्नुहोस्' : 'Approve operator self-assignments'}
              </p>
            </button>
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
                      <OperatorAvatar
                        operator={{
                          name: operator.name,
                          avatar: {
                            type: 'initials',
                            bgColor: operator.profileColor || '#3B82F6',
                            textColor: '#FFFFFF'
                          },
                          status: operator.status,
                          currentWorkload: operator.completed
                        }}
                        size="md"
                        showStatus={true}
                        showWorkload={true}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{isNepali ? operator.nameNp : operator.name}</p>
                        <p className="text-sm text-blue-600 font-medium">
                          {isNepali ? operator.skillNp : operator.skill}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <span>{operator.machineIcon}</span>
                          <span>{isNepali ? operator.machineDisplayNp : operator.machineDisplay}</span>
                        </div>
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

      {/* Modal Components */}
      {showBundleTracker && (
        <BundleFlowTracker
          onBundleUpdate={(bundle) => {
            // Handle bundle updates here
            console.log('Bundle updated:', bundle);
          }}
          onClose={() => setShowBundleTracker(false)}
        />
      )}

      {showWIPBoard && (
        <WIPStatusBoard
          wipData={wipData}
          onClose={() => setShowWIPBoard(false)}
        />
      )}


      {showWIPManager && (
        <WIPDataManager
          onClose={() => setShowWIPManager(false)}
        />
      )}

      {showWIPProgress && (
        <WIPProgressTracker
          onClose={() => setShowWIPProgress(false)}
        />
      )}

      {showTemplateManager && (
        <ProcessTemplateManager
          onTemplateSelect={(template) => {
            console.log('Template selected:', template);
            setShowTemplateManager(false);
          }}
          onClose={() => setShowTemplateManager(false)}
        />
      )}

      {showWorkAssignment && (
        <WorkAssignmentManager
          onClose={() => setShowWorkAssignment(false)}
        />
      )}

      {/* Damage Queue Modal - High Priority */}
      {showDamageQueue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔧</span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isNepali ? 'क्षति र मर्मत सूची' : 'Damage & Rework Queue'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDamageQueue(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DamageQueue />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Operator Work Bucket Modal */}
      {showLiveOperatorBucket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isNepali ? 'लाइभ अपरेटर बकेट' : 'Live Operator Work Bucket'}
                </h2>
                <button
                  onClick={() => setShowLiveOperatorBucket(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <LiveOperatorWorkBucket />
              </div>
            </div>
          </div>
        </div>
      )}

      {showSelfAssignmentApproval && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isNepali ? 'सेल्फ-असाइनमेन्ट अनुमोदन' : 'Self-Assignment Approval'}
                </h2>
                <button
                  onClick={() => setShowSelfAssignmentApproval(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SelfAssignmentApproval />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;