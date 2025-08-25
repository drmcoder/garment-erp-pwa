import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import { OperatorService } from '../../services/firebase-services';

const SimpleOperatorLogin = ({ onLoginSuccess }) => {
  const { login, loading } = useAuth();
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [operatorId, setOperatorId] = useState('');
  const [showNumpad, setShowNumpad] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState('');

  // Available operators loaded from Firestore
  const [operators, setOperators] = useState([]);

  // Load operators from Firestore
  useEffect(() => {
    const loadOperators = async () => {
      try {
        console.log('🔄 Loading operators for simple login from Firestore...');
        const result = await OperatorService.getActiveOperators();
        
        if (result.success) {
          const formattedOperators = result.operators.map((operator, index) => ({
            id: operator.id || `op-${index + 1}`,
            name: operator.name || operator.nameNepali,
            nameEn: operator.nameEn || operator.name,
            machine: operator.machine || operator.assignedMachine || 'overlock',
            photo: getOperatorPhoto(operator.machine || 'overlock'),
            skill: operator.skills?.[0] || 'general',
            username: operator.username
          }));
          
          console.log('✅ Loaded operators for simple login:', formattedOperators.length);
          setOperators(formattedOperators);
        } else {
          console.warn('⚠️ No operators found for simple login');
          setOperators([]);
        }
      } catch (error) {
        console.error('❌ Error loading operators for simple login:', error);
        setOperators([]);
      }
    };

    loadOperators();
    
    // Auto-refresh operators every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing simple login operators...');
      loadOperators();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Helper function to assign photo based on machine type
  const getOperatorPhoto = (machineType) => {
    const photos = {
      overlock: '👨‍🏭',
      flatlock: '👩‍🏭', 
      singleNeedle: '👨‍🔧',
      buttonhole: '👩‍🔧',
      buttonAttach: '👨‍⚙️',
      iron: '👩‍⚙️',
      cutting: '👨‍💼'
    };
    return photos[machineType] || '👨‍🏭';
  };

  // Machine types with visual icons
  const machines = [
    {
      type: 'overlock',
      name: currentLanguage === 'np' ? 'ओभरलक' : 'Overlock',
      icon: '🧵',
      color: 'bg-blue-100 border-blue-300 hover:bg-blue-200'
    },
    {
      type: 'flatlock', 
      name: currentLanguage === 'np' ? 'फ्ल्यालक' : 'Flatlock',
      icon: '🔧',
      color: 'bg-green-100 border-green-300 hover:bg-green-200'
    },
    {
      type: 'singleNeedle',
      name: currentLanguage === 'np' ? 'एकल सुई' : 'Single Needle',
      icon: '📐',
      color: 'bg-purple-100 border-purple-300 hover:bg-purple-200'
    },
    {
      type: 'buttonhole',
      name: currentLanguage === 'np' ? 'बटनहोल' : 'Buttonhole', 
      icon: '🕳️',
      color: 'bg-orange-100 border-orange-300 hover:bg-orange-200'
    }
  ];

  const handleOperatorSelect = (operator) => {
    setOperatorId(operator.id);
    setSelectedMachine(operator.machine);
    handleLogin(operator);
  };

  const handleLogin = async (operator) => {
    try {
      // Simple login with operator data
      const loginData = {
        id: operator.id,
        name: currentLanguage === 'np' ? operator.name : operator.nameEn,
        role: 'operator',
        machine: operator.machine,
        skill: operator.skill,
        photo: operator.photo
      };

      const result = await login(loginData);
      
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess(loginData);
        }
      } else {
        throw new Error(result.error || 'Login failed');
      }
      
    } catch (error) {
      addError({
        message: currentLanguage === 'np' ? 'लग इन गर्न समस्या भयो' : 'Login failed',
        component: 'SimpleOperatorLogin',
        action: 'Login',
        data: { operatorId: operator.id, error: error.message }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.HIGH);
    }
  };

  const NumpadButton = ({ number, onClick }) => (
    <button
      onClick={() => onClick(number)}
      className="w-20 h-20 bg-white border-2 border-gray-300 rounded-xl text-3xl font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-all duration-150 shadow-sm"
    >
      {number}
    </button>
  );

  const handleNumpadInput = (num) => {
    if (operatorId.length < 3) {
      setOperatorId(prev => prev + num);
    }
  };

  const handleClear = () => {
    setOperatorId('');
  };

  const handleNumpadLogin = () => {
    const operator = operators.find(op => op.id === operatorId);
    if (operator) {
      handleLogin(operator);
    } else {
      addError({
        message: currentLanguage === 'np' ? 'अपरेटर फेला परेन' : 'Operator not found',
        component: 'SimpleOperatorLogin',
        action: 'Numpad Login',
        data: { operatorId }
      }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏭</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {currentLanguage === 'np' ? 'कारखानामा स्वागत छ' : 'Welcome to Factory'}
          </h1>
          <p className="text-xl text-gray-600">
            {currentLanguage === 'np' ? 'आफ्नो नाम छनोट गर्नुहोस्' : 'Select Your Name'}
          </p>
        </div>

        {!showNumpad ? (
          <>
            {/* Photo Selection Method */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
                {currentLanguage === 'np' ? '📷 आफ्नो फोटो छनोट गर्नुहोस्' : '📷 Choose Your Photo'}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {operators.map((operator) => (
                  <button
                    key={operator.id}
                    onClick={() => handleOperatorSelect(operator)}
                    disabled={loading}
                    className="flex flex-col items-center p-6 border-3 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 touch-button"
                  >
                    {/* Large Photo/Avatar */}
                    <div className="text-6xl mb-3">{operator.photo}</div>
                    
                    {/* Name */}
                    <div className="text-xl font-bold text-gray-800 mb-2 text-center">
                      {currentLanguage === 'np' ? operator.name : operator.nameEn}
                    </div>
                    
                    {/* ID Number - Large and Clear */}
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-lg font-bold mb-2">
                      #{operator.id}
                    </div>
                    
                    {/* Machine Type with Icon */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{machines.find(m => m.type === operator.machine)?.icon}</span>
                      <span>{machines.find(m => m.type === operator.machine)?.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Alternative: Number Input */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {currentLanguage === 'np' ? '🔢 वा आफ्नो नम्बर टाइप गर्नुहोस्' : '🔢 Or Type Your Number'}
                </h3>
                <button
                  onClick={() => setShowNumpad(true)}
                  className="bg-green-500 text-white text-xl font-bold py-4 px-8 rounded-2xl hover:bg-green-600 transition-colors touch-button"
                >
                  {currentLanguage === 'np' ? '📱 नम्बर प्याड खोल्नुहोस्' : '📱 Open Number Pad'}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Number Pad Interface */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                {currentLanguage === 'np' ? '🔢 आफ्नो नम्बर टाइप गर्नुहोस्' : '🔢 Type Your Number'}
              </h2>
              
              {/* Display Screen */}
              <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                <div className="text-4xl font-mono font-bold text-center text-gray-800 min-h-[60px] flex items-center justify-center">
                  {operatorId || '---'}
                </div>
              </div>
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-8">
              {[1,2,3,4,5,6,7,8,9,0].map(num => (
                <NumpadButton
                  key={num}
                  number={num}
                  onClick={handleNumpadInput}
                />
              ))}
              <button
                onClick={handleClear}
                className="w-20 h-20 bg-red-100 border-2 border-red-300 rounded-xl text-xl font-bold text-red-600 hover:bg-red-200 transition-all duration-150 shadow-sm"
              >
                {currentLanguage === 'np' ? 'मेट' : 'Clear'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleNumpadLogin}
                disabled={!operatorId || operatorId.length < 3 || loading}
                className="bg-green-500 text-white text-xl font-bold py-4 px-8 rounded-2xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-button"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{currentLanguage === 'np' ? 'प्रवेश गर्दै...' : 'Logging in...'}</span>
                  </div>
                ) : (
                  <>
                    ✅ {currentLanguage === 'np' ? 'प्रवेश गर्नुहोस्' : 'Login'}
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowNumpad(false);
                  setOperatorId('');
                }}
                className="bg-gray-500 text-white text-xl font-bold py-4 px-8 rounded-2xl hover:bg-gray-600 transition-colors touch-button"
              >
                ⬅️ {currentLanguage === 'np' ? 'फिर्ता' : 'Back'}
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              💡 {currentLanguage === 'np' ? 'सहयोग चाहिए?' : 'Need Help?'}
            </h3>
            <p className="text-yellow-700">
              {currentLanguage === 'np' 
                ? 'आफ्नो फोटो देख्न सक्नुभएन? सुपरभाइजरलाई भन्नुहोस् वा आफ्नो ID नम्बर प्रयोग गर्नुहोस्।'
                : "Can't see your photo? Ask your supervisor or use your ID number."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOperatorLogin;