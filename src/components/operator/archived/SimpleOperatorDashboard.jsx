import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import SimpleOperatorLogin from './SimpleOperatorLogin';
import SimpleWorkAssignment from './SimpleWorkAssignment';
import SimpleWorkCompletion from './SimpleWorkCompletion';

const SimpleOperatorDashboard = () => {
  const { user, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, selectWork, completeWork
  const [currentWork, setCurrentWork] = useState(null);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [isWorkActive, setIsWorkActive] = useState(false);
  const [todayStats, setTodayStats] = useState({
    completedPieces: 0,
    earnings: 0,
    worksCompleted: 0
  });

  // If not logged in, show simple login
  if (!user) {
    return <SimpleOperatorLogin onLoginSuccess={(userData) => {
      console.log('User logged in:', userData);
    }} />;
  }

  const handleStartWork = () => {
    setWorkStartTime(new Date());
    setIsWorkActive(true);
    
    addError({
      message: currentLanguage === 'np' ? 'काम सुरु गरियो!' : 'Work started!',
      component: 'SimpleOperatorDashboard',
      action: 'Start Work',
      data: { workId: currentWork?.id }
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  const handleStopWork = () => {
    setIsWorkActive(false);
    
    addError({
      message: currentLanguage === 'np' ? 'काम रोकियो' : 'Work stopped',
      component: 'SimpleOperatorDashboard',
      action: 'Stop Work',
      data: { workId: currentWork?.id }
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  const handleWorkAssigned = (work) => {
    setCurrentWork(work);
    setCurrentView('dashboard');
    
    addError({
      message: currentLanguage === 'np' 
        ? `नयाँ काम मिल्यो: ${work.articleName}` 
        : `New work assigned: ${work.articleName}`,
      component: 'SimpleOperatorDashboard',
      action: 'Work Assigned',
      data: { workId: work.id }
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  const handleWorkCompleted = (completionData) => {
    // Update today's stats
    setTodayStats(prev => ({
      completedPieces: prev.completedPieces + completionData.completedPieces,
      earnings: prev.earnings + completionData.earnings,
      worksCompleted: prev.worksCompleted + 1
    }));

    // Clear current work
    setCurrentWork(null);
    setIsWorkActive(false);
    setWorkStartTime(null);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentWork(null);
    setIsWorkActive(false);
    setWorkStartTime(null);
    setCurrentView('dashboard');
  };

  const formatWorkTime = () => {
    if (!workStartTime) return '00:00';
    
    const now = new Date();
    const diff = now - workStartTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show work assignment view
  if (currentView === 'selectWork') {
    return (
      <SimpleWorkAssignment 
        onWorkAssigned={handleWorkAssigned}
      />
    );
  }

  // Show work completion view
  if (currentView === 'completeWork' && currentWork) {
    return (
      <SimpleWorkCompletion
        currentWork={currentWork}
        onWorkCompleted={handleWorkCompleted}
        onCancel={() => setCurrentView('dashboard')}
      />
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{user.photo}</div>
            <div>
              <h1 className="text-2xl font-bold">
                {currentLanguage === 'np' ? 'नमस्कार' : 'Hello'}, {user.name}!
              </h1>
              <p className="text-blue-100 text-lg">
                {currentLanguage === 'np' ? 'मेसिन:' : 'Machine:'} {user.machine} • ID: {user.id}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-2xl transition-colors touch-button-large"
          >
            🚪 {currentLanguage === 'np' ? 'बाहिर' : 'Logout'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Today's Stats */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            📊 {currentLanguage === 'np' ? 'आजको रिपोर्ट' : "Today's Report"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-3xl font-bold text-green-600">{todayStats.completedPieces}</div>
              <div className="text-gray-600 font-semibold">
                {currentLanguage === 'np' ? 'टुक्राहरू बनाइयो' : 'Pieces Completed'}
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-3xl font-bold text-yellow-600">रु. {todayStats.earnings}</div>
              <div className="text-gray-600 font-semibold">
                {currentLanguage === 'np' ? 'आजको कमाई' : "Today's Earnings"}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-blue-600">{todayStats.worksCompleted}</div>
              <div className="text-gray-600 font-semibold">
                {currentLanguage === 'np' ? 'काम पूरा' : 'Jobs Completed'}
              </div>
            </div>
          </div>
        </div>

        {/* Current Work Section */}
        {currentWork ? (
          <div className="bg-white rounded-3xl p-6 shadow-lg border-4 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                🎯 {currentLanguage === 'np' ? 'वर्तमान काम' : 'Current Work'}
              </h2>
              
              {isWorkActive && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-2xl font-bold text-lg">
                  ⏰ {formatWorkTime()}
                </div>
              )}
            </div>
            
            {/* Work Details */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-6xl">{currentWork.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{currentWork.articleName}</h3>
                  <p className="text-lg text-gray-600">{currentWork.operation}</p>
                  <p className="text-gray-500">#{currentWork.articleNumber} • {currentWork.color} • {currentWork.size}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{currentWork.pieces}</div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'टुक्राहरू' : 'Pieces'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">रु. {currentWork.rate}</div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'प्रति टुक्रा' : 'Per Piece'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentWork.estimatedTime}</div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'मिनेट' : 'Minutes'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">रु. {currentWork.earnings}</div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'कुल कमाई' : 'Total Earn'}</div>
                </div>
              </div>
            </div>

            {/* Work Control Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {!isWorkActive ? (
                <button
                  onClick={handleStartWork}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-colors touch-button-xl"
                >
                  ▶️ {currentLanguage === 'np' ? 'काम सुरु गर्नुहोस्' : 'Start Work'}
                </button>
              ) : (
                <button
                  onClick={handleStopWork}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-colors touch-button-xl"
                >
                  ⏸️ {currentLanguage === 'np' ? 'काम रोक्नुहोस्' : 'Stop Work'}
                </button>
              )}
              
              <button
                onClick={() => setCurrentView('completeWork')}
                disabled={!isWorkActive}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xl py-6 px-8 rounded-2xl transition-colors touch-button-xl"
              >
                ✅ {currentLanguage === 'np' ? 'काम पूरा' : 'Complete'}
              </button>
              
              <button
                onClick={() => {
                  addError({
                    message: currentLanguage === 'np' ? 'समस्या रिपोर्ट गरियो' : 'Issue reported',
                    component: 'SimpleOperatorDashboard',
                    action: 'Report Issue',
                    data: { workId: currentWork.id }
                  }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-colors touch-button-xl"
              >
                🚨 {currentLanguage === 'np' ? 'समस्या' : 'Issue'}
              </button>
            </div>
          </div>
        ) : (
          /* No Work Available */
          <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
            <div className="text-8xl mb-6">🎯</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {currentLanguage === 'np' ? 'कुनै काम छैन' : 'No Active Work'}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {currentLanguage === 'np' 
                ? 'आफ्नो लागि काम छनोट गर्नुहोस्' 
                : 'Choose work for yourself'}
            </p>
            
            <button
              onClick={() => setCurrentView('selectWork')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold text-2xl py-8 px-12 rounded-3xl transition-colors touch-button-xl"
            >
              🔍 {currentLanguage === 'np' ? 'काम खोज्नुहोस्' : 'Find Work'}
            </button>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setCurrentView('selectWork')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-colors touch-button-large flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">🔍</span>
            <span>{currentLanguage === 'np' ? 'नयाँ काम खोज्नुहोस्' : 'Find New Work'}</span>
          </button>
          
          <button
            onClick={() => {
              addError({
                message: currentLanguage === 'np' ? 'सुपरभाइजरलाई कल गरियो' : 'Supervisor called',
                component: 'SimpleOperatorDashboard',
                action: 'Call Supervisor',
                data: { operatorId: user.id }
              }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-colors touch-button-large flex items-center justify-center space-x-3"
          >
            <span className="text-2xl">📞</span>
            <span>{currentLanguage === 'np' ? 'सुपरभाइजर बोलाउनुहोस्' : 'Call Supervisor'}</span>
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-yellow-800 mb-3 text-center">
            💡 {currentLanguage === 'np' ? 'सहयोग' : 'Help'}
          </h3>
          <div className="text-yellow-700 text-lg space-y-2">
            <p>
              <strong>{currentLanguage === 'np' ? '१.' : '1.'}</strong> {' '}
              {currentLanguage === 'np' 
                ? 'काम खोज्नुहोस् → काम छनोट गर्नुहोस् → सुरु गर्नुहोस्'
                : 'Find work → Select work → Start working'
              }
            </p>
            <p>
              <strong>{currentLanguage === 'np' ? '२.' : '2.'}</strong> {' '}
              {currentLanguage === 'np' 
                ? 'समस्या भएमा रातो बटन थिच्नुहोस्'
                : 'Press red button if there are any problems'
              }
            </p>
            <p>
              <strong>{currentLanguage === 'np' ? '३.' : '3.'}</strong> {' '}
              {currentLanguage === 'np' 
                ? 'काम सकिएपछि नीलो बटन थिच्नुहोस्'
                : 'Press blue button when work is finished'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOperatorDashboard;