import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import { useWipFeatures, useTemplateConfig } from '../../hooks/useWipFeatures';
// import WIPInfographic from './WIPInfographic';
import NepaliDatePicker from '../common/NepaliDatePicker';
import { WIPService } from '../../services/firebase-services';

// Simple today's Nepali date for default value
const getTodayNepaliDate = () => {
  // Simple approximation - the proper date picker will handle actual conversion
  const today = new Date();
  const nepaliYear = today.getFullYear() + 57;
  const nepaliMonth = ((today.getMonth() + 8) % 12) + 1;
  const nepaliDay = today.getDate();
  
  return `${nepaliYear}/${nepaliMonth.toString().padStart(2, '0')}/${nepaliDay.toString().padStart(2, '0')}`;
};

// Intelligent size parsing that handles multiple separators
const parseSmartSizeInput = (input) => {
  if (!input) return [];
  
  // Handle single values without separators (like just "M")
  if (!input.includes(':') && !input.includes(';') && !input.includes(',') && !input.includes('|')) {
    // Check if it contains spaces (multiple words)
    const spaceSeparated = input.trim().split(/\s+/);
    if (spaceSeparated.length > 1) {
      return spaceSeparated.filter(s => s.length > 0);
    }
    // Single value
    return input.trim() ? [input.trim()] : [];
  }
  
  // Handle multiple separators: : ; , |
  const cleanedInput = input
    .replace(/[;,|]/g, ':') // Convert all separators to colons
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/:\s*:/g, ':') // Remove double colons
    .trim();
  
  return cleanedInput
    .split(':')
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

// Debounce helper for performance optimization
const useDebounce = (callback, delay) => {
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  return useCallback((...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setDebounceTimer(newTimer);
  }, [callback, delay, debounceTimer]);
};

const WIPManualEntry = ({ onImport, onCancel, initialData = null, isEditing = false }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  // Feature configuration hooks
  const wipFeatures = useWipFeatures();
  const templateConfig = useTemplateConfig();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Procedure Template, 3: Articles, 4: Rolls, 5: Preview
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
        
        // Procedure Template
        procedureTemplate: initialData.procedureTemplate || '',
        
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
      
      // Procedure Template (Step 2)
      procedureTemplate: '', // Selected template ID
      
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

  // Optimized update functions with debouncing
  const debouncedUpdateWipData = useDebounce((update) => {
    setWipData(prev => ({ ...prev, ...update }));
  }, 300);

  // Update article sizes configuration with intelligent parsing
  const updateArticleSizes = useCallback((articleNumber, sizes, ratios) => {
    // Parse sizes intelligently
    const parsedSizes = parseSmartSizeInput(sizes);
    const parsedRatios = parseSmartSizeInput(ratios);
    
    // Auto-fix ratio count to match size count
    while (parsedRatios.length < parsedSizes.length) {
      parsedRatios.push('1');
    }
    while (parsedRatios.length > parsedSizes.length) {
      parsedRatios.pop();
    }
    
    const cleanedSizes = parsedSizes.join(':');
    const cleanedRatios = parsedRatios.join(':');
    
    setWipData(prev => {
      const updatedWipData = {
        ...prev,
        articleSizes: {
          ...prev.articleSizes,
          [articleNumber]: {
            sizes: cleanedSizes,
            ratios: cleanedRatios
          }
        }
      };
      
      // Recalculate all roll pieces since article sizes/ratios changed
      const updatedRolls = updatedWipData.rolls.map(roll => ({
        ...roll,
        pieces: calculateRollPieces(roll, updatedWipData.parsedStyles, updatedWipData.articleSizes)
      }));
      
      return {
        ...updatedWipData,
        rolls: updatedRolls,
        totalPieces: updatedRolls.reduce((sum, roll) => sum + (roll.pieces || 0), 0)
      };
    });
  }, []);

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

  // Update roll data and recalculate pieces if needed
  const updateRoll = (rollIndex, field, value) => {
    setWipData(prev => {
      const updatedRolls = prev.rolls.map((roll, index) => {
        if (index === rollIndex) {
          const updatedRoll = { ...roll, [field]: value };
          // Recalculate pieces if layer count changes
          if (field === 'layerCount') {
            updatedRoll.pieces = calculateRollPieces(updatedRoll, prev.parsedStyles, prev.articleSizes);
          }
          return updatedRoll;
        }
        return roll;
      });

      return {
        ...prev,
        rolls: updatedRolls,
        totalPieces: updatedRolls.reduce((sum, roll) => sum + (roll.pieces || 0), 0)
      };
    });
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
  const calculateRollPieces = (roll, parsedStyles = null, articleSizes = null) => {
    let totalPieces = 0;
    
    // Use provided data or fall back to wipData
    const styles = parsedStyles || wipData.parsedStyles;
    const sizes = articleSizes || wipData.articleSizes;
    
    // If no parsed styles or layer count, return 0
    if (!styles || styles.length === 0 || !roll.layerCount) {
      return 0;
    }
    
    styles.forEach(style => {
      const articleConfig = sizes[style.articleNumber];
      if (articleConfig && articleConfig.ratios) {
        // Use smart parsing function instead of manual split
        const sizeRatios = parseSmartSizeInput(articleConfig.ratios);
        
        sizeRatios.forEach(ratioStr => {
          const ratio = parseInt(ratioStr) || 0;
          totalPieces += ratio * roll.layerCount;
        });
      } else {
        // Fallback: if no ratios are configured, assume 1 piece per layer per style
        console.warn(`No ratios configured for article ${style.articleNumber}, using fallback of 1 piece per layer`);
        totalPieces += 1 * roll.layerCount;
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
        return wipData.procedureTemplate; // New step: require procedure template selection
      case 3:
        return wipData.parsedStyles.every(style => style.articleNumber && style.styleName) &&
               Object.keys(wipData.articleSizes).length > 0;
      case 4:
        return wipData.rolls.length > 0 && 
               wipData.rolls.every(roll => roll.colorName && roll.layerCount > 0);
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
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
        totalPieces: totalPieces
      };

      console.log('✅ Final WIP Data prepared:', JSON.stringify(finalWipData, null, 2));
      console.log('🚀 Saving to Firestore via WIPService...');
      
      // Save to Firestore
      const result = await WIPService.saveWIPEntry(finalWipData);
      
      if (result.success) {
        console.log('✅ WIP saved to Firestore successfully!');
        
        // Call the original callback to close the modal and show success
        onImport(finalWipData);
        
        // Show success message
        const successMessage = currentLanguage === 'np' 
          ? `WIP डेटा सफलतापूर्वक सुरक्षित गरियो! ${finalWipData.totalPieces} टुक्राहरू र ${finalWipData.totalRolls} रोलहरू थपिए।`
          : `WIP data saved successfully! Added ${finalWipData.totalPieces} pieces across ${finalWipData.totalRolls} rolls.`;
          
        addError({
          message: successMessage,
          component: 'WIPManualEntry',
          action: 'Save WIP Success'
        }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.LOW);
      } else {
        console.error('❌ Failed to save WIP to Firestore:', result.error);
        
        const errorMessage = currentLanguage === 'np' 
          ? `WIP डेटा सुरक्षित गर्न असफल: ${result.error}`
          : `Failed to save WIP data: ${result.error}`;
          
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Save WIP Failed',
          data: { error: result.error }
        }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
      }
      
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      addError({
        message: 'Failed to submit WIP data: ' + error.message,
        component: 'WIPManualEntry',
        action: 'Submit WIP',
        data: { wipData, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const renderStepIndicator = () => {
    // Generate steps dynamically based on configuration
    const enabledSteps = wipFeatures.getSteps();
    const stepConfigs = [
      { key: 'basicInfo', name: currentLanguage === 'np' ? 'जानकारी' : 'Info', icon: '📝' },
      { key: 'procedureTemplate', name: currentLanguage === 'np' ? 'प्रक्रिया' : 'Template', icon: '⚙️' },
      { key: 'articlesConfig', name: currentLanguage === 'np' ? 'लेख' : 'Articles', icon: '👕' },
      { key: 'rollsData', name: currentLanguage === 'np' ? 'रोल' : 'Rolls', icon: '🧵' },
      { key: 'preview', name: currentLanguage === 'np' ? 'पूर्वावलोकन' : 'Preview', icon: '👁️' }
    ];

    const steps = stepConfigs
      .filter(stepConfig => wipFeatures.isEnabled(`steps.${stepConfig.key}`))
      .map((stepConfig, index) => ({
        num: index + 1,
        name: stepConfig.name,
        icon: stepConfig.icon,
        key: stepConfig.key
      }));

    return (
      <div className="mt-4">
        <div className="flex items-center justify-center space-x-2">
          {steps.map((step, index) => (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.num)}
              disabled={!canProceedFromStep(step.num - 1) && step.num > currentStep}
              className={`group flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentStep >= step.num 
                  ? 'bg-white bg-opacity-20 text-white shadow-md' 
                  : 'bg-white bg-opacity-10 text-blue-100 hover:bg-opacity-20'
              } ${step.num <= currentStep || canProceedFromStep(step.num - 1) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <span className="text-base">{step.icon}</span>
              <span className="hidden sm:inline">{step.name}</span>
              <span className="sm:hidden">{step.num}</span>
            </button>
            {index < 3 && (
              <div className={`w-8 h-0.5 mx-1 transition-all duration-200 ${
                currentStep > step.num ? 'bg-white bg-opacity-40' : 'bg-white bg-opacity-10'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold">
                {isEditing 
                  ? (currentLanguage === 'np' ? 'WIP डेटा सम्पादन' : 'Edit WIP Data')
                  : (currentLanguage === 'np' ? 'म्यानुअल WIP एन्ट्री' : 'Manual WIP Entry')
                }
              </h1>
              <p className="text-blue-100 text-sm">
                {isEditing
                  ? (currentLanguage === 'np' 
                    ? `लट ${wipData.lotNumber} सम्पादन गर्दै`
                    : `Editing Lot ${wipData.lotNumber}`
                  )
                  : (currentLanguage === 'np' ? 'सजिलो र छिटो डेटा एन्ट्री' : 'Easy & Quick Data Entry')
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full">
                Step {currentStep}/4
              </div>
            </div>
          </div>
          
          {renderStepIndicator()}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl">📝</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Information'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {currentLanguage === 'np' ? 'लट र कपडाको विवरण भर्नुहोस्' : 'Fill lot and fabric details'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ {currentLanguage === 'np' ? 'लट नम्बर' : 'Lot Number'} *
                  </label>
                  <input
                    type="text"
                    value={wipData.lotNumber}
                    onChange={(e) => setWipData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="S-85"
                    required
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    📦
                  </div>
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
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🧵 {currentLanguage === 'np' ? 'कपडाको नाम' : 'Fabric Name'} *
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricName}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricName: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Cotton Pique"
                    required
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    🏭
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📏 {currentLanguage === 'np' ? 'कपडाको चौडाई' : 'Fabric Width'}
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricWidth}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricWidth: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="60 inches"
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    📐
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 {currentLanguage === 'np' ? 'रोलको संख्या' : 'Number of Rolls'} *
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setWipData(prev => ({ ...prev, rollCount: Math.max(1, prev.rollCount - 1) }))}
                      className="w-10 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={wipData.rollCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 1;
                        setWipData(prev => ({ ...prev, rollCount: count }));
                      }}
                      onBlur={(e) => {
                        const count = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                        setWipData(prev => ({ ...prev, rollCount: count }));
                      }}
                      className="flex-1 p-3 text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-bold text-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setWipData(prev => ({ ...prev, rollCount: Math.min(20, prev.rollCount + 1) }))}
                      className="w-10 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {currentLanguage === 'np' ? '१-२० रोल' : '1-20 rolls'}
                  </p>
                </div>
                

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏪 {currentLanguage === 'np' ? 'कपडा स्टोर' : 'Fabric Store'}
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricStore}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricStore: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Main Warehouse"
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    📋
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Procedure Template Selection */}
          {currentStep === 2 && wipFeatures.isEnabled('steps.procedureTemplate') && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {currentLanguage === 'np' ? 'प्रक्रिया टेम्प्लेट चयन' : 'Procedure Template Selection'}
                  </h2>
                  <p className="text-gray-600">
                    {currentLanguage === 'np' 
                      ? 'यो लटका लागि प्रक्रिया टेम्प्लेट छान्नुहोस्। यो सबै लेखहरूमा लागू हुनेछ।'
                      : 'Select a procedure template for this lot. This will apply to all articles.'
                    }
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-300 p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'प्रक्रिया टेम्प्लेट' : 'Procedure Template'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={wipData.procedureTemplate}
                      onChange={(e) => setWipData(prev => ({
                        ...prev,
                        procedureTemplate: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="">
                        {currentLanguage === 'np' ? 'प्रक्रिया टेम्प्लेट छान्नुहोस्' : 'Select Procedure Template'}
                      </option>
                      {Object.entries(templateConfig.templates).map(([key, template]) => (
                        <option key={key} value={key}>
                          {template.name[currentLanguage] || template.name.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {wipData.procedureTemplate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        {currentLanguage === 'np' ? 'चयनित टेम्प्लेट जानकारी:' : 'Selected Template Info:'}
                      </h4>
                      <div className="text-sm text-blue-700">
                        {templateConfig.templates[wipData.procedureTemplate] && (
                          <p>
                            {templateConfig.templates[wipData.procedureTemplate].description[currentLanguage] || 
                             templateConfig.templates[wipData.procedureTemplate].description.en}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">💡</span>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">
                        {currentLanguage === 'np' ? 'टिप:' : 'Tip:'}
                      </p>
                      <p>
                        {currentLanguage === 'np'
                          ? 'चयनित प्रक्रिया टेम्प्लेट यो लटका सबै लेखहरूमा लागू हुनेछ। तपाईं पछि व्यक्तिगत लेखहरूका लागि ठोस आपरेशनहरू अनुकूलित गर्न सक्नुहुन्छ।'
                          : 'The selected procedure template will apply to all articles in this lot. You can customize specific operations for individual articles later.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Articles and Sizes */}
          {currentStep === 3 && (
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
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                              placeholder={currentLanguage === 'np' ? 'M वा S:M:L:XL वा S;M;L;XL वा S,M,L,XL वा S|M|L|XL' : 'M or S:M:L:XL or S;M;L;XL or S,M,L,XL or S|M|L|XL'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                <span>
                                  {currentLanguage === 'np' 
                                    ? 'एकल साइज वा कुनै पनि विभाजक प्रयोग गर्नुहोस्: ' 
                                    : 'Single size or use any separator: '
                                  }
                                  <code className="text-blue-600 font-mono bg-gray-100 px-1 rounded">
                                    : ; , | (spaces)
                                  </code>
                                </span>
                              </span>
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
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                              placeholder={currentLanguage === 'np' ? '1 वा 1:2:3:2:1 वा 1;2;3;2;1 वा 1,2,3,2,1 वा 1|2|3|2|1' : '1 or 1:2:3:2:1 or 1;2;3;2;1 or 1,2,3,2,1 or 1|2|3|2|1'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                {currentLanguage === 'np' ? 'प्रति लेयर टुक्राहरू' : 'Pieces per layer'} 
                                {wipData.articleSizes[style.articleNumber]?.sizes && (
                                  <span className="ml-2 text-green-600">
                                    ({parseSmartSizeInput(wipData.articleSizes[style.articleNumber].sizes).length} sizes detected)
                                  </span>
                                )}
                              </span>
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

          {/* Step 4: Roll Data */}
          {currentStep === 4 && (
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
              
              {/* Enhanced Roll Forms */}
              <div className="space-y-4">
                {wipData.rolls.map((roll, index) => {
                  const isCompleted = roll.colorName && roll.layerCount > 0;
                  return (
                    <div key={roll.id} className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                      isCompleted 
                        ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md' 
                        : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg' 
                              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                          }`}>
                            {isCompleted ? '✓' : roll.rollNumber}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {currentLanguage === 'np' ? `रोल ${roll.rollNumber}` : `Roll ${roll.rollNumber}`}
                            </h3>
                            {roll.colorName && (
                              <p className="text-sm text-gray-600">
                                🎨 {roll.colorName}
                              </p>
                            )}
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="text-green-600">
                            <span className="text-2xl">🎉</span>
                          </div>
                        )}
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
                              const ratios = parseSmartSizeInput(config.ratios || '').map(r => parseInt(r.trim()) || 0);
                              return total + (ratios.reduce((sum, ratio) => sum + ratio, 0) * roll.layerCount);
                            }, 0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Formula: {Object.values(wipData.articleSizes).map(config => {
                            const ratios = parseSmartSizeInput(config.ratios || '').map(r => parseInt(r.trim()) || 0);
                            return `(${ratios.join('+')} = ${ratios.reduce((sum, ratio) => sum + ratio, 0)})`;
                          }).join(' + ')} × {roll.layerCount} layers
                        </div>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Summary Dashboard */}
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

          {/* Step 5: Enhanced Preview */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'पूर्वावलोकन र पुष्टि' : 'Preview & Confirm'}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <span>{currentLanguage === 'np' ? 'तयार छ' : 'Ready to submit'}</span>
                </div>
              </div>
              
              {/* Interactive Summary Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Production Overview */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {currentLanguage === 'np' ? 'उत्पादन विवरण' : 'Production Overview'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{currentLanguage === 'np' ? 'लट नम्बर:' : 'Lot Number:'}</span>
                      <span className="font-bold text-lg text-blue-800">{wipData.lotNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{currentLanguage === 'np' ? 'कुल रोल:' : 'Total Rolls:'}</span>
                      <span className="font-bold text-xl text-blue-600">{wipData.totalRolls}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total Pieces:'}</span>
                      <span className="font-bold text-2xl text-green-600">{wipData.totalPieces}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{currentLanguage === 'np' ? 'प्रक्रिया टेम्प्लेट:' : 'Procedure Template:'}</span>
                      <span className="font-medium text-purple-600">
                        {wipData.procedureTemplate === 'shirt-basic' && (currentLanguage === 'np' ? 'शर्ट प्रक्रिया' : 'Shirt Procedure')}
                        {wipData.procedureTemplate === 'trouser-standard' && (currentLanguage === 'np' ? 'ट्राउजर प्रक्रिया' : 'Trouser Procedure')}
                        {wipData.procedureTemplate === 'dress-formal' && (currentLanguage === 'np' ? 'ड्रेस प्रक्रिया' : 'Dress Procedure')}
                        {wipData.procedureTemplate === 'jacket-casual' && (currentLanguage === 'np' ? 'ज्याकेट प्रक्रिया' : 'Jacket Procedure')}
                        {wipData.procedureTemplate === 'tshirt-basic' && (currentLanguage === 'np' ? 'टी-शर्ट प्रक्रिया' : 'T-Shirt Procedure')}
                        {wipData.procedureTemplate === 'custom' && (currentLanguage === 'np' ? 'कस्टम प्रक्रिया' : 'Custom Procedure')}
                        {!wipData.procedureTemplate && (currentLanguage === 'np' ? 'चयन गरिएको छैन' : 'Not Selected')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <div className="text-xs text-blue-600">
                        {currentLanguage === 'np' ? 'मिति:' : 'Date:'} {wipData.nepaliDate}
                      </div>
                      <div className="text-xs text-blue-600">
                        {currentLanguage === 'np' ? 'कपडा:' : 'Fabric:'} {wipData.fabricName} ({wipData.fabricWidth})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Articles & Size Matrix */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    {currentLanguage === 'np' ? 'लेख र साइज मैट्रिक्स' : 'Articles & Size Matrix'}
                  </h3>
                  <div className="space-y-4">
                    {wipData.parsedStyles.map((style, index) => {
                      const sizes = parseSmartSizeInput(wipData.articleSizes[style.articleNumber]?.sizes || '');
                      const ratios = parseSmartSizeInput(wipData.articleSizes[style.articleNumber]?.ratios || '');
                      return (
                        <div key={index} className="bg-white/70 rounded-lg p-4 border border-purple-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-purple-800">{style.articleNumber}</span>
                            <span className="text-sm text-gray-600">{style.styleName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-gray-500 mb-1">{currentLanguage === 'np' ? 'साइज:' : 'Sizes:'}</div>
                              <div className="flex flex-wrap gap-1">
                                {sizes.map((size, idx) => (
                                  <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    {size}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">{currentLanguage === 'np' ? 'अनुपात:' : 'Ratios:'}</div>
                              <div className="flex flex-wrap gap-1">
                                {ratios.map((ratio, idx) => (
                                  <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded font-mono">
                                    {ratio}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            {currentLanguage === 'np' ? 'प्रति लेयर कुल:' : 'Total per layer:'} 
                            <span className="font-bold ml-1">
                              {ratios.reduce((sum, r) => sum + (parseInt(r) || 0), 0)} pieces
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detailed Roll Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  {currentLanguage === 'np' ? 'रोल विवरण विश्लेषण' : 'Roll Detail Analysis'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wipData.rolls.map((roll, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">Roll #{roll.rollNumber}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {roll.colorName}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentLanguage === 'np' ? 'लेयर:' : 'Layers:'}</span>
                          <span className="font-medium">{roll.layerCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentLanguage === 'np' ? 'टुक्राहरू:' : 'Pieces:'}</span>
                          <span className="font-bold text-green-600">{roll.pieces}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{currentLanguage === 'np' ? 'वजन:' : 'Weight:'}</span>
                          <span>{roll.actualWeight || roll.markedWeight} kg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Production Formula Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  {currentLanguage === 'np' ? 'उत्पादन फार्मुला' : 'Production Formula'}
                </h3>
                <div className="text-sm font-mono bg-white/70 p-4 rounded-lg border border-green-100">
                  <div className="mb-2 text-green-700">
                    {currentLanguage === 'np' ? 'कुल टुक्राहरू = ' : 'Total Pieces = '}
                  </div>
                  {wipData.rolls.map((roll, index) => (
                    <div key={index} className="text-gray-700 pl-4 mb-1">
                      Roll {roll.rollNumber}: {roll.layerCount} layers × (
                      {wipData.parsedStyles.map((style, styleIndex) => {
                        const articleConfig = wipData.articleSizes[style.articleNumber];
                        if (articleConfig && articleConfig.ratios) {
                          const ratios = parseSmartSizeInput(articleConfig.ratios);
                          const ratioDisplay = ratios.length > 0 ? ratios.join('+') : '1';
                          const totalRatio = ratios.reduce((sum, r) => sum + (parseInt(r) || 0), 0);
                          return `${ratioDisplay}=${totalRatio}`;
                        } else {
                          // Fallback: show 1 if no ratios configured
                          return '1';
                        }
                      }).join(' + ')}
                      ) = <span className="font-bold text-green-600">{roll.pieces} pieces</span>
                    </div>
                  ))}
                  <div className="border-t border-green-200 pt-2 mt-2 font-bold text-green-800">
                    {currentLanguage === 'np' ? 'महाजम्मा = ' : 'Grand Total = '}
                    <span className="text-xl">{wipData.totalPieces} pieces</span>
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
};

export default WIPManualEntry;