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
  const [showBundleTracker, setShowBundleTracker] = useState(false);
  const [showWIPBoard, setShowWIPBoard] = useState(false);
  const [showWIPManager, setShowWIPManager] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [wipData, setWipData] = useState(null);
  const [showWorkAssignment, setShowWorkAssignment] = useState(false);
  const [showWIPProgress, setShowWIPProgress] = useState(false);
  const [showSelfAssignmentApproval, setShowSelfAssignmentApproval] = useState(false);
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isNepali ? '🚀 त्वरित कार्यहरू' : '🚀 Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              className="flex flex-col items-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {isNepali ? 'WIP स्थिति बोर्ड' : 'WIP Status Board'}
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                {isNepali ? 'रङ र साइज अनुसार प्रगति हेर्नुहोस्' : 'View progress by color and size'}
              </div>
            </button>

            <button
              onClick={() => setShowBundleTracker(true)}
              className="flex flex-col items-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {isNepali ? 'बन्डल फ्लो ट्र्याकर' : 'Bundle Flow Tracker'}
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                {isNepali ? 'सिलाई प्रक्रियाहरू बीच ट्र्याकिङ' : 'Track bundles between operations'}
              </div>
            </button>


            <button
              onClick={() => setShowWIPManager(true)}
              className="flex flex-col items-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {isNepali ? 'WIP डेटा प्रबन्धन' : 'WIP Data Manager'}
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                {isNepali ? 'एन्ट्री हेर्नुहोस्, सम्पादन र प्रबन्धन गर्नुहोस्' : 'View, edit and manage entries'}
              </div>
            </button>

            <button
              onClick={() => setShowTemplateManager(true)}
              className="flex flex-col items-center p-4 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-3xl mb-2">🛠️</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {isNepali ? 'टेम्प्लेट प्रबन्धन' : 'Template Manager'}
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                {isNepali ? 'प्रक्रिया टेम्प्लेट सिर्जना र सम्पादन' : 'Create and edit process templates'}
              </div>
            </button>

            <button 
              onClick={() => setShowWorkAssignment(true)}
              className="flex flex-col items-center p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {isNepali ? 'काम असाइनमेन्ट' : 'Work Assignment'}
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                {isNepali ? 'अपरेटरहरूलाई काम असाइन गर्नुहोस्' : 'Assign work to operators'}
              </div>
            </button>

            <button 
              onClick={() => setShowWIPProgress(true)}
              className="flex flex-col items-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="text-3xl mb-2">📈</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {isNepali ? 'प्रगति ट्र्याकर' : 'Progress Tracker'}
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                {isNepali ? 'लट र बन्डलको प्रगति हेर्नुहोस्' : 'Track lot and bundle progress'}
              </div>
            </button>

            <button 
              onClick={() => setShowSelfAssignmentApproval(true)}
              className="flex flex-col items-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm font-medium text-gray-900 text-center">
                {isNepali ? 'सेल्फ-असाइनमेन्ट अनुमोदन' : 'Self-Assignment Approval'}
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center">
                {isNepali ? 'अपरेटरहरूको सेल्फ-असाइनमेन्ट अनुमोदन गर्नुहोस्' : 'Approve operator self-assignments'}
              </div>
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
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {operator.name.charAt(0)}
                        </span>
                      </div>
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