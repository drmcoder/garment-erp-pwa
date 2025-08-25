import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';

const SimpleWorkCompletion = ({ currentWork, onWorkCompleted, onCancel }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [completedPieces, setCompletedPieces] = useState('');
  const [qualityIssues, setQualityIssues] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [showNumpad, setShowNumpad] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Pieces, 2: Quality, 3: Confirm

  // Common quality issues
  const commonIssues = [
    { 
      id: 'thread_cut',
      np: 'धागो काटिएको',
      en: 'Thread Cut',
      icon: '✂️'
    },
    { 
      id: 'needle_hole',
      np: 'सुईको प्वाल',
      en: 'Needle Hole', 
      icon: '🕳️'
    },
    { 
      id: 'oil_stain',
      np: 'तेलको दाग',
      en: 'Oil Stain',
      icon: '🛢️'
    },
    { 
      id: 'fabric_defect',
      np: 'कपडामा समस्या',
      en: 'Fabric Defect',
      icon: '🧵'
    },
    { 
      id: 'size_wrong',
      np: 'साइज गलत',
      en: 'Wrong Size',
      icon: '📏'
    },
    { 
      id: 'color_mismatch',
      np: 'रङ मिलेन',
      en: 'Color Mismatch',
      icon: '🎨'
    }
  ];

  const NumpadButton = ({ number, onClick }) => (
    <button
      onClick={() => onClick(number)}
      className="w-20 h-20 bg-white border-3 border-gray-300 rounded-2xl text-3xl font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-all duration-150 shadow-lg touch-button"
    >
      {number}
    </button>
  );

  const handleNumpadInput = (num) => {
    if (completedPieces.length < 3) {
      setCompletedPieces(prev => prev + num);
    }
  };

  const handleClear = () => {
    setCompletedPieces('');
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate pieces
      const pieces = parseInt(completedPieces);
      if (!pieces || pieces <= 0 || pieces > currentWork.pieces) {
        addError({
          message: currentLanguage === 'np' 
            ? 'सही संख्या टाइप गर्नुहोस्' 
            : 'Please enter valid number',
          component: 'SimpleWorkCompletion',
          action: 'Validate Pieces',
          data: { completedPieces, maxPieces: currentWork.pieces }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitWork = async () => {
    try {
      const completionData = {
        completedPieces: parseInt(completedPieces),
        totalPieces: currentWork.pieces,
        hasQualityIssues: qualityIssues,
        qualityIssueType: qualityIssues ? issueType : null,
        completedAt: new Date(),
        operatorId: user?.id,
        operatorName: user?.name
      };

      // Calculate earnings
      const earnings = parseInt(completedPieces) * currentWork.rate;
      completionData.earnings = earnings;

      // Success feedback
      addError({
        message: currentLanguage === 'np' 
          ? `काम सम्पन्न! रु. ${earnings} कमाउनुभयो` 
          : `Work completed! You earned Rs. ${earnings}`,
        component: 'SimpleWorkCompletion',
        action: 'Work Completion Success',
        data: completionData
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

      if (onWorkCompleted) {
        onWorkCompleted(completionData);
      }

    } catch (error) {
      addError({
        message: currentLanguage === 'np' ? 'काम बुझाउन समस्या भयो' : 'Failed to submit work',
        component: 'SimpleWorkCompletion',
        action: 'Submit Work',
        data: { completedPieces, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const calculateEarnings = () => {
    const pieces = parseInt(completedPieces) || 0;
    return pieces * currentWork.rate;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {currentLanguage === 'np' ? '📝 काम पूरा गर्नुहोस्' : '📝 Complete Work'}
              </h1>
              <p className="text-blue-100">
                {currentWork.articleName} - {currentWork.operation}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-blue-600 p-2 rounded-xl transition-colors touch-button"
            >
              <div className="text-2xl">✕</div>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep >= step 
                      ? 'bg-white text-blue-600' 
                      : 'bg-blue-400 text-blue-100'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 h-1 mx-2 transition-all ${
                      currentStep > step ? 'bg-white' : 'bg-blue-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2 text-sm text-blue-100">
              {currentStep === 1 && (currentLanguage === 'np' ? 'संख्या' : 'Count')}
              {currentStep === 2 && (currentLanguage === 'np' ? 'गुणस्तर' : 'Quality')}
              {currentStep === 3 && (currentLanguage === 'np' ? 'पुष्टि' : 'Confirm')}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Pieces Count */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="bg-blue-50 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {currentLanguage === 'np' ? 'कति टुक्रा बनाउनुभयो?' : 'How many pieces did you complete?'}
                </h2>
                
                <div className="text-lg text-gray-600 mb-4">
                  {currentLanguage === 'np' ? 'कुल टुक्राहरू:' : 'Total pieces:'} <span className="font-bold">{currentWork.pieces}</span>
                </div>
                
                {/* Display Screen */}
                <div className="bg-white rounded-2xl p-6 mb-6 border-4 border-blue-200">
                  <div className="text-5xl font-mono font-bold text-center text-gray-800 min-h-[80px] flex items-center justify-center">
                    {completedPieces || '0'}
                  </div>
                  <div className="text-lg text-gray-600 mt-2">
                    {currentLanguage === 'np' ? 'सम्पन्न टुक्राहरू' : 'Completed pieces'}
                  </div>
                </div>

                {/* Quick Buttons for common numbers */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[5, 10, 15, 20, 25, 30].map(num => (
                    <button
                      key={num}
                      onClick={() => setCompletedPieces(num.toString())}
                      disabled={num > currentWork.pieces}
                      className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-xl font-bold py-3 px-4 rounded-xl transition-colors touch-button"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Number Pad Toggle */}
                <button
                  onClick={() => setShowNumpad(!showNumpad)}
                  className="bg-blue-500 text-white text-lg font-bold py-3 px-6 rounded-2xl hover:bg-blue-600 transition-colors touch-button"
                >
                  {showNumpad 
                    ? (currentLanguage === 'np' ? '📱 प्याड बन्द गर्नुहोस्' : '📱 Close Keypad')
                    : (currentLanguage === 'np' ? '📱 प्याड खोल्नुहोस्' : '📱 Open Keypad')
                  }
                </button>

                {/* Number Pad */}
                {showNumpad && (
                  <div className="mt-6">
                    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-4">
                      {[1,2,3,4,5,6,7,8,9,0].map(num => (
                        <NumpadButton
                          key={num}
                          number={num}
                          onClick={handleNumpadInput}
                        />
                      ))}
                      <button
                        onClick={handleClear}
                        className="w-20 h-20 bg-red-100 border-3 border-red-300 rounded-2xl text-lg font-bold text-red-600 hover:bg-red-200 transition-all duration-150 shadow-lg touch-button"
                      >
                        {currentLanguage === 'np' ? 'मेट' : 'Clear'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Earnings Preview */}
                {completedPieces && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="text-sm text-green-600 mb-1">
                      {currentLanguage === 'np' ? 'तपाईंको कमाई' : 'Your earnings'}
                    </div>
                    <div className="text-3xl font-bold text-green-700">
                      रु. {calculateEarnings()}
                    </div>
                    <div className="text-sm text-green-600">
                      {completedPieces} × रु. {currentWork.rate}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Quality Check */}
          {currentStep === 2 && (
            <div className="text-center space-y-6">
              <div className="bg-yellow-50 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {currentLanguage === 'np' ? 'कुनै समस्या छ?' : 'Any quality issues?'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setQualityIssues(false)}
                    className={`p-6 rounded-2xl border-3 font-bold text-lg transition-all touch-button ${
                      !qualityIssues 
                        ? 'bg-green-100 border-green-400 text-green-700' 
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-4xl mb-2">✅</div>
                    <div>{currentLanguage === 'np' ? 'कुनै समस्या छैन' : 'No issues'}</div>
                    <div className="text-sm opacity-75">
                      {currentLanguage === 'np' ? 'सबै राम्रो छ' : 'Everything is good'}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setQualityIssues(true)}
                    className={`p-6 rounded-2xl border-3 font-bold text-lg transition-all touch-button ${
                      qualityIssues 
                        ? 'bg-red-100 border-red-400 text-red-700' 
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-4xl mb-2">❌</div>
                    <div>{currentLanguage === 'np' ? 'समस्या छ' : 'Has issues'}</div>
                    <div className="text-sm opacity-75">
                      {currentLanguage === 'np' ? 'केही ठीक छैन' : 'Something is wrong'}
                    </div>
                  </button>
                </div>

                {/* Issue Types */}
                {qualityIssues && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-4">
                      {currentLanguage === 'np' ? 'कस्तो समस्या?' : 'What kind of issue?'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {commonIssues.map(issue => (
                        <button
                          key={issue.id}
                          onClick={() => setIssueType(issue.id)}
                          className={`p-4 rounded-xl border-2 text-center font-semibold transition-all touch-button ${
                            issueType === issue.id
                              ? 'bg-red-100 border-red-400 text-red-700'
                              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-2xl mb-1">{issue.icon}</div>
                          <div className="text-sm">
                            {currentLanguage === 'np' ? issue.np : issue.en}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <div className="bg-green-50 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {currentLanguage === 'np' ? '✅ काम पूरा गर्नुहोस्' : '✅ Complete Work'}
                </h2>
                
                {/* Work Summary */}
                <div className="bg-white rounded-2xl p-6 mb-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-gray-700 mb-3">
                        {currentLanguage === 'np' ? 'काम विवरण' : 'Work Details'}
                      </h4>
                      <div className="space-y-2 text-gray-600">
                        <div>{currentWork.articleName}</div>
                        <div>{typeof currentWork.operation === 'string' 
                          ? currentWork.operation 
                          : currentWork.operation?.nameEn || currentWork.operation?.name || 'Unknown Operation'}</div>
                        <div>{currentWork.color} • {currentWork.size}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-700 mb-3">
                        {currentLanguage === 'np' ? 'पूरा गरिएको' : 'Completed'}
                      </h4>
                      <div className="space-y-2 text-gray-600">
                        <div>
                          <span className="font-bold text-2xl text-green-600">{completedPieces}</span>
                          <span className="text-gray-500"> / {currentWork.pieces} {currentLanguage === 'np' ? 'टुक्रा' : 'pieces'}</span>
                        </div>
                        <div>
                          {currentLanguage === 'np' ? 'गुणस्तर:' : 'Quality:'} {' '}
                          <span className={qualityIssues ? 'text-red-600' : 'text-green-600'}>
                            {qualityIssues 
                              ? (currentLanguage === 'np' ? 'समस्या छ' : 'Has Issues')
                              : (currentLanguage === 'np' ? 'राम्रो' : 'Good')
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Earnings */}
                  <div className="border-t mt-6 pt-6 text-center">
                    <div className="text-sm text-gray-600 mb-1">
                      {currentLanguage === 'np' ? 'तपाईंको कमाई' : 'Your total earnings'}
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      रु. {calculateEarnings()}
                    </div>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  onClick={handleSubmitWork}
                  className="bg-green-500 text-white text-2xl font-bold py-6 px-12 rounded-2xl hover:bg-green-600 transition-colors touch-button w-full"
                >
                  🎉 {currentLanguage === 'np' ? 'काम बुझाउनुहोस्' : 'Submit Work'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="bg-gray-500 text-white text-lg font-bold py-3 px-8 rounded-2xl hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-button"
            >
              ⬅️ {currentLanguage === 'np' ? 'फिर्ता' : 'Back'}
            </button>
            
            {currentStep < 3 && (
              <button
                onClick={handleNextStep}
                disabled={currentStep === 1 && !completedPieces}
                className="bg-blue-500 text-white text-lg font-bold py-3 px-8 rounded-2xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-button"
              >
                {currentLanguage === 'np' ? 'अर्को' : 'Next'} ➡️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleWorkCompletion;