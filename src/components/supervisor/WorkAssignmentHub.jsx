// src/components/supervisor/WorkAssignmentHub.jsx
// Master hub for multiple work assignment methods

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  useUsers,
  useWorkManagement,
  useSupervisorData 
} from '../../hooks/useAppData';

// Assignment method components
import DragDropAssignment from './assignment-methods/DragDropAssignment';
import KanbanAssignment from './assignment-methods/KanbanAssignment';
import UserProfileAssignment from './assignment-methods/UserProfileAssignment';
import SimpleListAssignment from './assignment-methods/SimpleListAssignment';
import SmartAutoAssignment from './assignment-methods/SmartAutoAssignment';

// Icons for different methods
const AssignmentMethods = {
  SIMPLE: {
    id: 'simple',
    name: 'Simple List',
    nameNp: 'सरल सूची',
    icon: '📋',
    description: 'Easy step-by-step assignment',
    descriptionNp: 'सजिलो चरणबद्ध असाइनमेन्ट',
    difficulty: 'Easy',
    tabletFriendly: true
  },
  DRAG_DROP: {
    id: 'drag-drop',
    name: 'Drag & Drop',
    nameNp: 'ड्र्याग एण्ड ड्रप',
    icon: '🎯',
    description: 'Visual drag and drop interface',
    descriptionNp: 'भिजुअल ड्र्याग एण्ड ड्रप',
    difficulty: 'Medium',
    tabletFriendly: false
  },
  KANBAN: {
    id: 'kanban',
    name: 'Kanban Board',
    nameNp: 'कान्बान बोर्ड',
    icon: '📊',
    description: 'Card-based workflow management',
    descriptionNp: 'कार्ड आधारित वर्कफ्लो',
    difficulty: 'Medium',
    tabletFriendly: true
  },
  PROFILE: {
    id: 'profile',
    name: 'User Profiles',
    nameNp: 'प्रयोगकर्ता प्रोफाइल',
    icon: '👤',
    description: 'Operator-focused assignment',
    descriptionNp: 'अपरेटर केन्द्रित असाइनमेन्ट',
    difficulty: 'Easy',
    tabletFriendly: true
  },
  SMART: {
    id: 'smart',
    name: 'Smart Auto',
    nameNp: 'स्मार्ट अटो',
    icon: '🤖',
    description: 'AI-powered automatic assignment',
    descriptionNp: 'AI संचालित स्वचालित असाइनमेन्ट',
    difficulty: 'Auto',
    tabletFriendly: true
  }
};

const WorkAssignmentHub = () => {
  const { user } = useAuth();
  const { isNepali } = useLanguage();
  const { showNotification } = useNotifications();
  
  // Data hooks
  const { allUsers, loading: usersLoading } = useUsers();
  const { bundles, assignments, assignWork, loading: workLoading } = useWorkManagement();
  
  // Local state
  const [currentMethod, setCurrentMethod] = useState('simple');
  const [isTablet, setIsTablet] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  
  // Detect tablet/mobile
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = window.innerWidth <= 768;
      const isTouch = 'ontouchstart' in window;
      setIsTablet(isMobile || isTouch);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Auto-select tablet-friendly method on mobile
  useEffect(() => {
    if (isTablet && currentMethod === 'drag-drop') {
      setCurrentMethod('simple');
      showNotification(
        isNepali 
          ? 'टेबलेट मोडका लागि सरल मोड चयन गरियो' 
          : 'Switched to Simple mode for tablet',
        'info'
      );
    }
  }, [isTablet, currentMethod, isNepali, showNotification]);

  const loading = usersLoading || workLoading;
  const operators = allUsers?.filter(user => user.role === 'operator') || [];
  const availableBundles = bundles || [];

  // Render current method component
  const renderCurrentMethod = () => {
    const commonProps = {
      operators,
      availableBundles,
      assignments,
      assignWork,
      loading,
      isTablet
    };

    switch (currentMethod) {
      case 'simple':
        return <SimpleListAssignment {...commonProps} />;
      case 'drag-drop':
        return <DragDropAssignment {...commonProps} />;
      case 'kanban':
        return <KanbanAssignment {...commonProps} />;
      case 'profile':
        return <UserProfileAssignment {...commonProps} />;
      case 'smart':
        return <SmartAutoAssignment {...commonProps} />;
      default:
        return <SimpleListAssignment {...commonProps} />;
    }
  };

  const getCurrentMethodInfo = () => AssignmentMethods[currentMethod.toUpperCase().replace('-', '_')] || AssignmentMethods.SIMPLE;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {isNepali ? '🎯 काम असाइनमेन्ट हब' : '🎯 Work Assignment Hub'}
              </h1>
              
              {/* Current Method Badge */}
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
                <span className="text-2xl">{getCurrentMethodInfo().icon}</span>
                <span className="font-medium text-blue-800">
                  {isNepali ? getCurrentMethodInfo().nameNp : getCurrentMethodInfo().name}
                </span>
                {isTablet && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                    📱 {isNepali ? 'टेबलेट मोड' : 'Tablet Mode'}
                  </span>
                )}
              </div>
            </div>

            {/* Method Selector Button */}
            <button
              onClick={() => setShowMethodSelector(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg"
            >
              🔄 {isNepali ? 'मेथड परिवर्तन' : 'Switch Method'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">
                {isNepali ? 'उपलब्ध काम' : 'Available Work'}
              </div>
              <div className="text-blue-800 text-xl font-bold">{availableBundles.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-green-600 text-sm font-medium">
                {isNepali ? 'फ्री अपरेटर' : 'Free Operators'}
              </div>
              <div className="text-green-800 text-xl font-bold">
                {operators.filter(op => (op.currentWorkload || 0) < (op.maxWorkload || 3)).length}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-yellow-600 text-sm font-medium">
                {isNepali ? 'काम गर्दै' : 'Working'}
              </div>
              <div className="text-yellow-800 text-xl font-bold">
                {operators.filter(op => op.status === 'working').length}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-purple-600 text-sm font-medium">
                {isNepali ? 'कुल असाइनमेन्ट' : 'Total Assigned'}
              </div>
              <div className="text-purple-800 text-xl font-bold">
                {assignments?.length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Method Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">
                {isNepali ? 'डेटा लोड गर्दै...' : 'Loading data...'}
              </p>
            </div>
          </div>
        ) : (
          renderCurrentMethod()
        )}
      </div>

      {/* Method Selector Modal */}
      {showMethodSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isNepali ? '🎯 असाइनमेन्ट मेथड छान्नुहोस्' : '🎯 Choose Assignment Method'}
                </h2>
                <button
                  onClick={() => setShowMethodSelector(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {isNepali 
                  ? 'आफ्नो काम शैली अनुसार उपयुक्त मेथड छान्नुहोस्'
                  : 'Choose the method that best fits your working style'
                }
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(AssignmentMethods).map((method) => (
                  <div
                    key={method.id}
                    onClick={() => {
                      if (!isTablet || method.tabletFriendly) {
                        setCurrentMethod(method.id);
                        setShowMethodSelector(false);
                        showNotification(
                          isNepali 
                            ? `${method.nameNp} मेथड चयन गरियो`
                            : `Switched to ${method.name} method`,
                          'success'
                        );
                      }
                    }}
                    className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                      currentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : (!isTablet || method.tabletFriendly)
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {/* Current Method Indicator */}
                    {currentMethod === method.id && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        ✓
                      </div>
                    )}

                    {/* Tablet Incompatible Warning */}
                    {isTablet && !method.tabletFriendly && (
                      <div className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">
                        ⚠️
                      </div>
                    )}

                    <div className="text-center">
                      <div className="text-4xl mb-4">{method.icon}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {isNepali ? method.nameNp : method.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {isNepali ? method.descriptionNp : method.description}
                      </p>

                      {/* Difficulty Badge */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        method.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        method.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        method.difficulty === 'Auto' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {method.difficulty === 'Easy' ? (isNepali ? '✅ सजिलो' : '✅ Easy') :
                         method.difficulty === 'Medium' ? (isNepali ? '⚡ मध्यम' : '⚡ Medium') :
                         method.difficulty === 'Auto' ? (isNepali ? '🤖 स्वचालित' : '🤖 Auto') :
                         method.difficulty}
                      </div>

                      {/* Tablet Friendly Badge */}
                      {method.tabletFriendly && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            📱 {isNepali ? 'टेबलेट मित्र' : 'Tablet Friendly'}
                          </span>
                        </div>
                      )}

                      {/* Tablet Warning */}
                      {isTablet && !method.tabletFriendly && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            ⚠️ {isNepali ? 'टेबलेटमा कठिन' : 'Not for Tablet'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Help Text */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-blue-900 font-semibold mb-2">
                  💡 {isNepali ? 'मद्दत' : 'Help'}
                </h4>
                <div className="text-blue-800 text-sm space-y-1">
                  <p>• <strong>{isNepali ? 'सरल सूची:' : 'Simple List:'}</strong> {isNepali ? 'नयाँ प्रयोगकर्ताका लागि उत्तम' : 'Best for new users'}</p>
                  <p>• <strong>{isNepali ? 'कान्बान:' : 'Kanban:'}</strong> {isNepali ? 'भिजुअल वर्कफ्लो म्यानेजमेन्ट' : 'Visual workflow management'}</p>
                  <p>• <strong>{isNepali ? 'प्रोफाइल:' : 'Profiles:'}</strong> {isNepali ? 'अपरेटर केन्द्रित दृश्य' : 'Operator-focused view'}</p>
                  <p>• <strong>{isNepali ? 'स्मार्ट:' : 'Smart:'}</strong> {isNepali ? 'AI द्वारा सुझाव' : 'AI-powered suggestions'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkAssignmentHub;