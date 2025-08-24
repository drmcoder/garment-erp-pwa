import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
// import WIPInfographic from './WIPInfographic';
import NepaliDatePicker from '../common/NepaliDatePicker';

// Simple today's Nepali date for default value
const getTodayNepaliDate = () => {
  // Simple approximation - the proper date picker will handle actual conversion
  const today = new Date();
  const nepaliYear = today.getFullYear() + 57;
  const nepaliMonth = ((today.getMonth() + 8) % 12) + 1;
  const nepaliDay = today.getDate();
  
  return `${nepaliYear}/${nepaliMonth.toString().padStart(2, '0')}/${nepaliDay.toString().padStart(2, '0')}`;
};

const WIPManualEntry = ({ onImport, onCancel, initialData = null, isEditing = false }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Articles, 3: Rolls, 4: Preview
  const [wipData, setWipData] = useState(() => {
    if (isEditing && initialData) {
      return {
        // Basic Information
        lotNumber: initialData.lotNumber || '',
        nepaliDate: initialData.nepaliDate || getTodayNepaliDate(),
        fabricName: initialData.fabricName || '',
        fabricWidth: initialData.fabricWidth || '',
        fabricStore: initialData.fabricStore || '',
        rollCount: initialData.rollCount || initialData.rolls?.length || 1,
        
        // Articles and Styles
        parsedStyles: initialData.parsedStyles?.length > 0 ? initialData.parsedStyles : [
          { articleNumber: '', styleName: '' }
        ],
        
        // Article Sizes Configuration
        articleSizes: initialData.articleSizes || {},
        
        // Rolls Data
        rolls: initialData.rolls || [],
        
        // Calculated fields
        totalRolls: initialData.totalRolls || initialData.rolls?.length || 0,
        totalPieces: initialData.totalPieces || 0
      };
    }
    
    return {
      // Basic Information
      lotNumber: '',
      nepaliDate: getTodayNepaliDate(),
      fabricName: '',
      fabricWidth: '',
      fabricStore: '',
      rollCount: 1, // Number of rolls to create
      
      // Articles and Styles
      parsedStyles: [
        { articleNumber: '', styleName: '' }
      ],
      
      // Article Sizes Configuration
      articleSizes: {},
      
      // Rolls Data
      rolls: [],
      
      // Calculated fields
      totalRolls: 0,
      totalPieces: 0
    };
  });

  const [currentRoll, setCurrentRoll] = useState({
    rollNumber: 1,
    colorName: '',
    layerCount: 0,
    markedWeight: 0,
    actualWeight: 0,
    pieces: 0
  });

  // Add article
  const addArticle = () => {
    setWipData(prev => ({
      ...prev,
      parsedStyles: [...prev.parsedStyles, { articleNumber: '', styleName: '' }]
    }));
  };

  // Remove article
  const removeArticle = (index) => {
    if (wipData.parsedStyles.length <= 1) return;
    
    setWipData(prev => {
      const newStyles = prev.parsedStyles.filter((_, i) => i !== index);
      const newArticleSizes = { ...prev.articleSizes };
      delete newArticleSizes[prev.parsedStyles[index].articleNumber];
      
      return {
        ...prev,
        parsedStyles: newStyles,
        articleSizes: newArticleSizes
      };
    });
  };

  // Update article
  const updateArticle = (index, field, value) => {
    setWipData(prev => ({
      ...prev,
      parsedStyles: prev.parsedStyles.map((style, i) => 
        i === index ? { ...style, [field]: value } : style
      )
    }));
  };

  // Update article sizes configuration
  const updateArticleSizes = (articleNumber, sizes, ratios) => {
    setWipData(prev => ({
      ...prev,
      articleSizes: {
        ...prev.articleSizes,
        [articleNumber]: {
          sizes: sizes,
          ratios: ratios
        }
      }
    }));
  };

  // Initialize rolls array when moving to step 3
  const initializeRolls = () => {
    if (wipData.rolls.length === 0) {
      const initialRolls = Array.from({ length: wipData.rollCount }, (_, index) => ({
        id: Date.now() + index,
        rollNumber: index + 1,
        colorName: '',
        layerCount: 0,
        markedWeight: 0,
        actualWeight: 0,
        pieces: 0
      }));
      
      setWipData(prev => ({
        ...prev,
        rolls: initialRolls
      }));
    }
  };

  // Update roll data
  const updateRoll = (rollIndex, field, value) => {
    setWipData(prev => ({
      ...prev,
      rolls: prev.rolls.map((roll, index) => 
        index === rollIndex ? { ...roll, [field]: value } : roll
      )
    }));
  };

  // Add roll
  const addRoll = () => {
    try {
      if (!currentRoll.colorName || !currentRoll.layerCount) {
        const errorMessage = currentLanguage === 'np' ? 'रङको नाम र लेयर संख्या आवश्यक छ' : 'Color name and layer count are required';
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Add Roll',
          data: { currentRoll }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      const calculatedPieces = calculateRollPieces(currentRoll);
      const newRoll = {
        ...currentRoll,
        id: Date.now(),
        pieces: calculatedPieces
      };

      setWipData(prev => {
        const newRolls = [...prev.rolls, newRoll];
        return {
          ...prev,
          rolls: newRolls,
          totalRolls: newRolls.length,
          totalPieces: newRolls.reduce((sum, roll) => sum + roll.pieces, 0)
        };
      });

      // Reset current roll form
      setCurrentRoll({
        rollNumber: wipData.rolls.length + 2,
        colorName: '',
        layerCount: 0,
        markedWeight: 0,
        actualWeight: 0,
        pieces: 0
      });
      
    } catch (error) {
      addError({
        message: 'Failed to add roll',
        component: 'WIPManualEntry',
        action: 'Add Roll',
        data: { currentRoll, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  // Calculate pieces for a roll based on articles and sizes
  const calculateRollPieces = (roll) => {
    let totalPieces = 0;
    
    wipData.parsedStyles.forEach(style => {
      const articleConfig = wipData.articleSizes[style.articleNumber];
      if (articleConfig) {
        // eslint-disable-next-line no-unused-vars
        const sizeNames = articleConfig.sizes.split(':').map(s => s.trim()).filter(s => s);
        const sizeRatios = articleConfig.ratios.split(':').map(s => parseInt(s.trim()) || 0);
        
        sizeRatios.forEach(ratio => {
          totalPieces += ratio * roll.layerCount;
        });
      }
    });
    
    return totalPieces;
  };

  // Remove roll
  const removeRoll = (rollId) => {
    setWipData(prev => {
      const newRolls = prev.rolls.filter(roll => roll.id !== rollId);
      return {
        ...prev,
        rolls: newRolls,
        totalRolls: newRolls.length,
        totalPieces: newRolls.reduce((sum, roll) => sum + roll.pieces, 0)
      };
    });
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation functions
  const canProceedFromStep = (step) => {
    switch (step) {
      case 1:
        return wipData.lotNumber && wipData.fabricName && wipData.rollCount > 0;
      case 2:
        return wipData.parsedStyles.every(style => style.articleNumber && style.styleName) &&
               Object.keys(wipData.articleSizes).length > 0;
      case 3:
        return wipData.rolls.length > 0 && 
               wipData.rolls.every(roll => roll.colorName && roll.layerCount > 0);
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    console.log('🔥 WIP MANUAL ENTRY - SUBMIT BUTTON CLICKED');
    console.log('📋 Current WIP Data before validation:', JSON.stringify(wipData, null, 2));
    console.log('📊 Data validation starting...');
    
    try {
      // Validation
      if (wipData.rolls.length === 0) {
        const errorMessage = currentLanguage === 'np' ? 'कम्तीमा एक रोल आवश्यक छ' : 'At least one roll is required';
        console.log('❌ VALIDATION FAILED: No rolls found');
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Submit WIP',
          data: { wipData }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      if (!wipData.lotNumber || !wipData.fabricName) {
        const errorMessage = currentLanguage === 'np' ? 'लट नम्बर र कपडाको नाम आवश्यक छ' : 'Lot number and fabric name are required';
        console.log('❌ VALIDATION FAILED: Missing lot number or fabric name');
        console.log('- Lot Number:', wipData.lotNumber);
        console.log('- Fabric Name:', wipData.fabricName);
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Submit WIP',
          data: { wipData }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      if (wipData.parsedStyles.some(style => !style.articleNumber || !style.styleName)) {
        const errorMessage = currentLanguage === 'np' ? 'सबै लेख नम्बर र स्टाइल नाम भर्नुहोस्' : 'Please fill all article numbers and style names';
        console.log('❌ VALIDATION FAILED: Missing article data');
        console.log('- Parsed Styles:', wipData.parsedStyles);
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Submit WIP',
          data: { wipData }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      console.log('✅ ALL VALIDATIONS PASSED');

      // Add calculated totals
      const totalPieces = wipData.rolls.reduce((sum, roll) => sum + (roll.pieces || 0), 0);
      const finalWipData = {
        ...wipData,
        totalRolls: wipData.rolls.length,
        totalPieces: totalPieces,
        createdAt: isEditing ? wipData.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Final WIP Data prepared:', JSON.stringify(finalWipData, null, 2));
      console.log('🚀 Calling onImport callback with final data...');
      
      // Success
      onImport(finalWipData);
      
    } catch (error) {
      addError({
        message: 'Failed to submit WIP data',
        component: 'WIPManualEntry',
        action: 'Submit WIP',
        data: { wipData, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`w-12 h-1 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-2">
        <span className="text-sm text-gray-600">
          {currentStep === 1 && (currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Information')}
          {currentStep === 2 && (currentLanguage === 'np' ? 'लेख र साइज कन्फिगरेसन' : 'Articles & Size Configuration')}
          {currentStep === 3 && (currentLanguage === 'np' ? 'रोल डेटा' : 'Roll Data')}
          {currentStep === 4 && (currentLanguage === 'np' ? 'पूर्वावलोकन र पुष्टि' : 'Preview & Confirm')}
        </span>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">
                {isEditing 
                  ? (currentLanguage === 'np' ? 'WIP डेटा सम्पादन' : 'Edit WIP Data')
                  : (currentLanguage === 'np' ? 'म्यानुअल WIP एन्ट्री' : 'Manual WIP Entry')
                }
              </h1>
              <p className="text-sm text-gray-600">
                {isEditing
                  ? (currentLanguage === 'np' 
                    ? `लट ${wipData.lotNumber} सम्पादन गर्दै`
                    : `Editing Lot ${wipData.lotNumber}`
                  )
                  : (currentLanguage === 'np' ? 'रोल-आधारित उत्पादन डेटा' : 'Roll-based Production Data')
                }
              </p>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
          
          {renderStepIndicator()}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Information'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'लट नम्बर' : 'Lot Number'} *
                  </label>
                  <input
                    type="text"
                    value={wipData.lotNumber}
                    onChange={(e) => setWipData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="S-85"
                    required
                  />
                </div>
                
                <div>
                  <NepaliDatePicker
                    label={currentLanguage === 'np' ? 'नेपाली मिति (बि.स.)' : 'Nepali Date (BS)'}
                    value={wipData.nepaliDate}
                    onChange={(date) => {
                      try {
                        setWipData(prev => ({ ...prev, nepaliDate: date }));
                      } catch (error) {
                        addError({
                          message: 'Error updating Nepali date',
                          component: 'WIPManualEntry',
                          action: 'Date Change',
                          data: { date, error: error.message }
                        }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
                      }
                    }}
                    placeholder={currentLanguage === 'np' ? 'मिति छान्नुहोस्' : 'Select Date'}
                    showTodayButton={true}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'कपडाको नाम' : 'Fabric Name'} *
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricName}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Cotton Pique"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'कपडाको चौडाई' : 'Fabric Width'}
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricWidth}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricWidth: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="60 inches"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'रोलको संख्या' : 'Number of Rolls'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={wipData.rollCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 1;
                      setWipData(prev => ({ ...prev, rollCount: count }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="4"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {currentLanguage === 'np' 
                      ? 'कति रोल कपडा काटिने (१-२०)'
                      : 'How many rolls of fabric to cut (1-20)'
                    }
                  </p>
                </div>
                

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'कपडा स्टोर' : 'Fabric Store'}
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricStore}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricStore: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Main Warehouse"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Articles and Sizes */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'लेख र साइज कन्फिगरेसन' : 'Articles & Size Configuration'}
                </h2>
                <button
                  onClick={addArticle}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + {currentLanguage === 'np' ? 'लेख थप्नुहोस्' : 'Add Article'}
                </button>
              </div>
              
              <div className="space-y-6">
                {wipData.parsedStyles.map((style, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        {currentLanguage === 'np' ? 'लेख' : 'Article'} {index + 1}
                      </h3>
                      {wipData.parsedStyles.length > 1 && (
                        <button
                          onClick={() => removeArticle(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'लेख नम्बर' : 'Article Number'} *
                        </label>
                        <input
                          type="text"
                          value={style.articleNumber}
                          onChange={(e) => updateArticle(index, 'articleNumber', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="8085"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'स्टाइलको नाम' : 'Style Name'} *
                        </label>
                        <input
                          type="text"
                          value={style.styleName}
                          onChange={(e) => updateArticle(index, 'styleName', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Polo T-Shirt"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Size Configuration */}
                    {style.articleNumber && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-3">
                          {currentLanguage === 'np' ? 'साइज कन्फिगरेसन' : 'Size Configuration'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {currentLanguage === 'np' ? 'साइज नामहरू' : 'Size Names'}
                            </label>
                            <input
                              type="text"
                              value={wipData.articleSizes[style.articleNumber]?.sizes || ''}
                              onChange={(e) => updateArticleSizes(
                                style.articleNumber,
                                e.target.value,
                                wipData.articleSizes[style.articleNumber]?.ratios || ''
                              )}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="S : M : L : XL : XXL"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {currentLanguage === 'np' ? 'कोलनले छुट्याउनुहोस् (:)' : 'Separate with colons (:)'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {currentLanguage === 'np' ? 'साइज अनुपात' : 'Size Ratios'}
                            </label>
                            <input
                              type="text"
                              value={wipData.articleSizes[style.articleNumber]?.ratios || ''}
                              onChange={(e) => updateArticleSizes(
                                style.articleNumber,
                                wipData.articleSizes[style.articleNumber]?.sizes || '',
                                e.target.value
                              )}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="1 : 2 : 3 : 2 : 1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {currentLanguage === 'np' ? 'प्रति लेयर टुक्राहरू' : 'Pieces per layer'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Roll Data */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'रोल डेटा' : 'Roll Data'}
                </h2>
                <div className="text-sm text-gray-600">
                  {currentLanguage === 'np' 
                    ? `${wipData.rollCount} रोल भर्नुहोस्` 
                    : `Fill details for ${wipData.rollCount} rolls`
                  }
                </div>
              </div>

              {/* Initialize rolls when entering step 3 */}
              {wipData.rolls.length === 0 && initializeRolls()}
              
              {/* Roll Forms */}
              <div className="grid grid-cols-1 gap-6">
                {wipData.rolls.map((roll, index) => (
                  <div key={roll.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800 flex items-center">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {roll.rollNumber}
                        </div>
                        {currentLanguage === 'np' ? `रोल ${roll.rollNumber}` : `Roll ${roll.rollNumber}`}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'रङको नाम' : 'Color Name'} *
                        </label>
                        <input
                          type="text"
                          value={roll.colorName}
                          onChange={(e) => updateRoll(index, 'colorName', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={currentLanguage === 'np' ? 'नीलो-१' : 'Blue-1'}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'लेयर संख्या' : 'Layer Count'} *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={roll.layerCount || ''}
                          onChange={(e) => updateRoll(index, 'layerCount', parseInt(e.target.value) || 0)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="23"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'मार्क तौल (kg)' : 'Marked Weight (kg)'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={roll.markedWeight || ''}
                          onChange={(e) => updateRoll(index, 'markedWeight', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="8.5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'वास्तविक तौल (kg)' : 'Actual Weight (kg)'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={roll.actualWeight || ''}
                          onChange={(e) => updateRoll(index, 'actualWeight', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="8.2"
                        />
                      </div>
                    </div>

                    {/* Roll Summary */}
                    {roll.layerCount > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                          {currentLanguage === 'np' ? 'कुल टुक्राहरू:' : 'Total pieces from this roll:'}
                          <span className="font-bold text-gray-800 ml-2">
                            {Object.values(wipData.articleSizes).reduce((total, config) => {
                              const ratios = config.ratios.split(':').map(r => parseInt(r.trim()) || 0);
                              return total + (ratios.reduce((sum, ratio) => sum + ratio, 0) * roll.layerCount);
                            }, 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  {currentLanguage === 'np' ? 'संक्षेप' : 'Summary'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{wipData.rolls.length}</div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'रोल' : 'Rolls'}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {wipData.rolls.reduce((sum, roll) => sum + (roll.layerCount || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'कुल लेयर' : 'Total Layers'}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {wipData.rolls.reduce((sum, roll) => sum + (roll.actualWeight || 0), 0).toFixed(1)}kg
                    </div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'कुल तौल' : 'Total Weight'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {currentLanguage === 'np' ? 'पूर्वावलोकन र पुष्टि' : 'Preview & Confirm'}
              </h2>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  {currentLanguage === 'np' ? 'डेटा समीक्षा' : 'Data Review'}
                </h3>
                
                <div className="space-y-4">
                  {/* Basic Info Summary */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Information'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'लट:' : 'Lot:'}</span>
                        <span className="ml-2 font-medium">{wipData.lotNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'मिति:' : 'Date:'}</span>
                        <span className="ml-2 font-medium">{wipData.nepaliDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'कपडा:' : 'Fabric:'}</span>
                        <span className="ml-2 font-medium">{wipData.fabricName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Articles Summary */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'लेखहरू' : 'Articles'}
                    </h4>
                    <div className="space-y-2">
                      {wipData.parsedStyles.map((style, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{style.articleNumber}</span>
                          <span className="text-gray-600">{style.styleName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rolls Summary */}
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'रोल सारांश' : 'Roll Summary'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-sm">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'कुल रोल:' : 'Total Rolls:'}</span>
                        <span className="ml-2 font-bold text-blue-600">{wipData.totalRolls}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total Pieces:'}</span>
                        <span className="ml-2 font-bold text-green-600">{wipData.totalPieces}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentLanguage === 'np' ? 'अघिल्लो' : 'Previous'}
          </button>
          
          <div className="space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(currentStep)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentLanguage === 'np' ? 'अर्को' : 'Next'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {isEditing 
                  ? (currentLanguage === 'np' ? 'WIP अपडेट गर्नुहोस्' : 'Update WIP')
                  : (currentLanguage === 'np' ? 'WIP सुरक्षित गर्नुहोस्' : 'Save WIP')
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WIPManualEntry;