import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWipFeatures } from '../../hooks/useWipFeatures';

// Import all assignment methods
import BundleCardAssignment from './assignment-methods/BundleCardAssignment';
import DragDropAssignment from './assignment-methods/DragDropAssignment';
import UserProfileAssignment from './assignment-methods/UserProfileAssignment';
import WIPBundleViewAssignment from './assignment-methods/WIPBundleViewAssignment';
import KanbanBoardAssignment from './assignment-methods/KanbanBoardAssignment';
import QuickActionAssignment from './assignment-methods/QuickActionAssignment';
import BatchAssignmentInterface from './assignment-methods/BatchAssignmentInterface';

const MultiMethodWorkAssignment = ({ workItems, operators, bundles = [], onAssignmentComplete, onCancel }) => {
  const { currentLanguage } = useLanguage();
  const wipFeatures = useWipFeatures();
  
  const [selectedMethod, setSelectedMethod] = useState('bundle-card');
  const [methodUsageStats, setMethodUsageStats] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);

  // Track method usage for trial analytics
  const trackMethodUsage = (method, assignmentCount) => {
    setMethodUsageStats(prev => ({
      ...prev,
      [method]: {
        uses: (prev[method]?.uses || 0) + 1,
        totalAssignments: (prev[method]?.totalAssignments || 0) + assignmentCount,
        lastUsed: new Date()
      }
    }));
  };

  const handleAssignmentComplete = async (assignments) => {
    trackMethodUsage(selectedMethod, assignments.length);
    
    // Show very brief success notification that disappears in 1 second
    const successMessage = currentLanguage === 'np' 
      ? `✅ ${assignments.length} काम असाइन गरियो`
      : `✅ ${assignments.length} work items assigned`;
    
    // Create temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[100] transition-all transform';
    toast.textContent = successMessage;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    
    // Remove after 1 second
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 1000);
    
    // Complete the assignment and silently reload
    await onAssignmentComplete(assignments);
  };

  // Available assignment methods with their configurations
  const assignmentMethods = [
    {
      id: 'bundle-card',
      name: currentLanguage === 'np' ? 'बन्डल कार्ड चेकलिस्ट' : 'Bundle Card Checklist',
      icon: '📋',
      description: currentLanguage === 'np' 
        ? 'पारंपरिक चेकलिस्ट स्टाइलमा काम असाइन गर्नुहोस्'
        : 'Traditional checklist-style work assignment',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      component: BundleCardAssignment,
      difficulty: 'beginner',
      bestFor: currentLanguage === 'np' ? 'सरल, स्पष्ट असाइनमेन्ट' : 'Simple, clear assignments',
      enabled: wipFeatures.isEnabled('assignment.bundleCard')
    },
    {
      id: 'drag-drop',
      name: currentLanguage === 'np' ? 'ड्र्याग एन्ड ड्रप' : 'Drag & Drop',
      icon: '🎯',
      description: currentLanguage === 'np'
        ? 'काम आइटमहरूलाई अपरेटरहरूमा ड्र्याग गर्नुहोस्'
        : 'Drag work items to operators intuitively',
      color: 'bg-green-100 text-green-700 border-green-300',
      component: DragDropAssignment,
      difficulty: 'intermediate',
      bestFor: currentLanguage === 'np' ? 'इन्ट्यूटिभ, भिजुअल असाइनमेन्ट' : 'Intuitive, visual assignment',
      enabled: wipFeatures.isEnabled('assignment.dragDrop')
    },
    {
      id: 'user-profile',
      name: currentLanguage === 'np' ? 'यूजर प्रोफाइल व्यू' : 'User Profile View',
      icon: '👤',
      description: currentLanguage === 'np'
        ? 'अपरेटर प्रोफाइल हेरेर काम असाइन गर्नुहोस्'
        : 'View operator profiles before assignment',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      component: UserProfileAssignment,
      difficulty: 'intermediate',
      bestFor: currentLanguage === 'np' ? 'व्यक्तिगत दक्षता आधारित' : 'Individual skill-based',
      enabled: wipFeatures.isEnabled('assignment.userProfile')
    },
    {
      id: 'wip-bundle',
      name: currentLanguage === 'np' ? 'WIP बन्डल व्यू' : 'WIP Bundle View',
      icon: '📦',
      description: currentLanguage === 'np'
        ? 'बन्डल वर्कफ़्लो हेरेर अपरेशन असाइन गर्नुहोस्'
        : 'View bundle workflows and assign operations',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      component: WIPBundleViewAssignment,
      difficulty: 'advanced',
      bestFor: currentLanguage === 'np' ? 'वर्कफ़्लो आधारित असाइनमेन्ट' : 'Workflow-based assignment',
      enabled: wipFeatures.isEnabled('assignment.wipBundle')
    },
    {
      id: 'kanban-board',
      name: currentLanguage === 'np' ? 'कान्बन बोर्ड' : 'Kanban Board',
      icon: '📊',
      description: currentLanguage === 'np'
        ? 'कान्बन स्टाइलमा काम व्यवस्थित गर्नुहोस्'
        : 'Organize work in kanban-style columns',
      color: 'bg-teal-100 text-teal-700 border-teal-300',
      component: KanbanBoardAssignment,
      difficulty: 'advanced',
      bestFor: currentLanguage === 'np' ? 'भिजुअल वर्कफ़्लो व्यवस्थापन' : 'Visual workflow management',
      enabled: wipFeatures.isEnabled('assignment.kanban')
    },
    {
      id: 'quick-action',
      name: currentLanguage === 'np' ? 'त्वरित कार्य' : 'Quick Actions',
      icon: '⚡',
      description: currentLanguage === 'np'
        ? 'एक क्लिकमा स्मार्ट असाइनमेन्ट'
        : 'One-click smart assignments',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      component: QuickActionAssignment,
      difficulty: 'beginner',
      bestFor: currentLanguage === 'np' ? 'तुरुन्त असाइनमेन्ट' : 'Instant assignments',
      enabled: wipFeatures.isEnabled('assignment.quickAction')
    },
    {
      id: 'batch-interface',
      name: currentLanguage === 'np' ? 'बैच इन्टरफेस' : 'Batch Interface',
      icon: '📊',
      description: currentLanguage === 'np'
        ? 'समूहमा बाँडेर इष्टतम असाइनमेन्ट'
        : 'Group and optimize batch assignments',
      color: 'bg-pink-100 text-pink-700 border-pink-300',
      component: BatchAssignmentInterface,
      difficulty: 'expert',
      bestFor: currentLanguage === 'np' ? 'बल्क असाइनमेन्ट अप्टिमाइजेसन' : 'Bulk assignment optimization',
      enabled: wipFeatures.isEnabled('assignment.batch')
    }
  ];

  // Filter enabled methods
  const enabledMethods = assignmentMethods.filter(method => method.enabled !== false);

  const selectedMethodConfig = assignmentMethods.find(m => m.id === selectedMethod);
  const SelectedComponent = selectedMethodConfig?.component;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-hidden flex flex-col z-50">
      
      {/* Compact Header */}
      <div className={`bg-white border-b shadow-sm flex-shrink-0 transition-all duration-300 ${
        isMinimized ? 'py-2' : 'py-3'
      }`}>
        <div className="px-4 flex items-center justify-between">
          {/* Left Side - Close & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
              title={currentLanguage === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {!isMinimized && (
                <span className="text-sm font-medium">
                  {currentLanguage === 'np' ? 'बन्द' : 'Close'}
                </span>
              )}
            </button>
            
            <div className="h-5 w-px bg-gray-300"></div>
            
            {!isMinimized && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <span>🎯</span>
                  <span>{currentLanguage === 'np' ? 'वर्क असाइनमेन्ट' : 'Work Assignment'}</span>
                </h1>
              </div>
            )}
          </div>

          {/* Center - Method Selector */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <button
                onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>{selectedMethodConfig?.icon}</span>
                <span className="font-medium">{selectedMethodConfig?.name}</span>
                <svg className={`w-4 h-4 transition-transform ${showMethodDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Compact Method Dropdown */}
              {showMethodDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-10 min-w-72">
                  <div className="p-2">
                    {enabledMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedMethod(method.id);
                          setShowMethodDropdown(false);
                        }}
                        className={`w-full flex items-center space-x-3 p-3 rounded-md transition-colors text-left ${
                          selectedMethod === method.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-lg">{method.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{method.name}</div>
                          <div className="text-xs text-gray-500">{method.bestFor}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(method.difficulty)}`}>
                            {method.difficulty}
                          </span>
                          {methodUsageStats[method.id] && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                              {methodUsageStats[method.id].uses}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center space-x-2">
            {/* Usage Stats */}
            {Object.keys(methodUsageStats).length > 0 && !isMinimized && (
              <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                📊 {Object.values(methodUsageStats).reduce((sum, stat) => sum + stat.uses, 0)}
              </div>
            )}
            
            {/* Minimize Button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title={isMinimized ? (currentLanguage === 'np' ? 'विस्तार गर्नुहोस्' : 'Expand') : (currentLanguage === 'np' ? 'संक्षिप्त गर्नुहोस्' : 'Minimize')}
            >
              {isMinimized ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Method Component Container - Now Takes Most Screen Space */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="h-full">
          {SelectedComponent ? (
            <SelectedComponent
              workItems={workItems}
              operators={operators}
              bundles={bundles}
              onAssignmentComplete={handleAssignmentComplete}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {currentLanguage === 'np' ? 'मेथड उपलब्ध छैन' : 'Method Not Available'}
                </h3>
                <p className="text-gray-600">
                  {currentLanguage === 'np'
                    ? 'यो असाइनमेन्ट मेथड सक्रिय छैन'
                    : 'This assignment method is not enabled'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click Outside Handler for Dropdown */}
      {showMethodDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMethodDropdown(false)}
        />
      )}

    </div>
  );
};

export default MultiMethodWorkAssignment;