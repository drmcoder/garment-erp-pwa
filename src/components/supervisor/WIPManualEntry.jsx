import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import ArticleStyleCard from './wip-components/ArticleStyleCard';
import SizeConfiguration from './wip-components/SizeConfiguration';
import RollDataEntry from './wip-components/RollDataEntry';
import WIPSummaryPreview from './wip-components/WIPSummaryPreview';
import { OPERATION_MODULES, PROCEDURE_TEMPLATES } from '../../data/mockData';

// Simple today's Nepali date for default value
const getTodayNepaliDate = () => {
  const today = new Date();
  const nepaliYear = today.getFullYear() + 57;
  const nepaliMonth = ((today.getMonth() + 8) % 12) + 1;
  const nepaliDay = today.getDate();
  
  return `${nepaliYear}/${nepaliMonth.toString().padStart(2, '0')}/${nepaliDay.toString().padStart(2, '0')}`;
};

// Get procedure preview text
const getProcedurePreview = (templateId, customTemplates = {}) => {
  const template = PROCEDURE_TEMPLATES[templateId] || customTemplates[templateId];
  if (!template) return 'Custom configuration';
  
  return template.operations.map((opId, index) => {
    const operation = OPERATION_MODULES[opId];
    if (!operation) return `${index + 1}. Unknown Operation`;
    
    const machineIcon = operation.machine === 'single-needle' ? '📍' : 
                       operation.machine === 'overlock' ? '🔗' : 
                       operation.machine === 'flatlock' ? '📎' : 
                       operation.machine === 'buttonhole' ? '🕳️' : '⚙️';
    
    return `${index + 1}. ${operation.name} ${machineIcon} ${operation.time}min`;
  }).join(' → ');
};

// Get template statistics
const getTemplateStats = (templateId, customTemplates = {}) => {
  const template = PROCEDURE_TEMPLATES[templateId] || customTemplates[templateId];
  if (!template) return { operations: 0, totalTime: 0, machines: [] };
  
  const operations = template.operations.map(opId => OPERATION_MODULES[opId]).filter(Boolean);
  const totalTime = operations.reduce((sum, op) => sum + op.time, 0);
  const machines = [...new Set(operations.map(op => op.machine))];
  
  return {
    operations: operations.length,
    totalTime,
    machines,
    estimatedCost: operations.reduce((sum, op) => sum + op.rate, 0)
  };
};

const WIPManualEntryModular = ({ onCancel, initialData = null }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [wipData, setWipData] = useState({
    // Basic Info
    lotNumber: initialData?.lotNumber || '',
    buyerName: initialData?.buyerName || '',
    poNumber: initialData?.poNumber || '',
    receivedDate: initialData?.receivedDate || getTodayNepaliDate(),
    deliveryDate: initialData?.deliveryDate || '',
    urgency: initialData?.urgency || 'medium',
    
    // Fabric Info
    fabricName: initialData?.fabricName || '',
    fabricWidth: initialData?.fabricWidth || '',
    fabricStore: initialData?.fabricStore || '',
    rollCount: initialData?.rollCount || 1,
    
    // Articles and Styles
    parsedStyles: initialData?.parsedStyles || [
      { articleNumber: '', styleName: '' }
    ],
    
    // Size Configuration
    sizeNames: initialData?.sizeNames || '',
    sizeRatios: initialData?.sizeRatios || '1',
    
    // Article Procedures
    articleProcedures: initialData?.articleProcedures || {},
    customTemplates: initialData?.customTemplates || {}
  });

  const handleStyleChange = (index, field, value) => {
    const newStyles = [...wipData.parsedStyles];
    newStyles[index] = { ...newStyles[index], [field]: value };
    setWipData(prev => ({ ...prev, parsedStyles: newStyles }));
  };

  const removeStyle = (index) => {
    const newStyles = wipData.parsedStyles.filter((_, i) => i !== index);
    setWipData(prev => ({ ...prev, parsedStyles: newStyles }));
  };

  const addNewStyle = () => {
    setWipData(prev => ({
      ...prev,
      parsedStyles: [...prev.parsedStyles, { articleNumber: '', styleName: '' }]
    }));
  };

  const handleSizeNamesChange = (value) => {
    setWipData(prev => ({ ...prev, sizeNames: value }));
  };

  const handleSizeRatiosChange = (e) => {
    setWipData(prev => ({ ...prev, sizeRatios: e.target.value }));
  };

  const openTemplateBuilder = (templateId = null) => {
    // Template builder functionality would go here
    console.log('Opening template builder for:', templateId);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Submit functionality would go here
    console.log('Submitting WIP data:', wipData);
    addError({
      message: currentLanguage === 'np' ? 'WIP डेटा सफलतापूर्वक बचत गरियो' : 'WIP data saved successfully',
      component: 'WIPManualEntry'
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📝 {currentLanguage === 'np' ? 'म्यानुअल WIP एन्ट्री' : 'Manual WIP Entry'}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentLanguage === 'np' ? 'नयाँ काम प्रगति रेकर्ड बनाउनुहोस्' : 'Create new work in progress record'}
              </p>
            </div>
            
            {/* Step Progress */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {currentLanguage === 'np' ? 'बेसिक जानकारी' : 'Basic Information'}
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
                    placeholder={currentLanguage === 'np' ? 'जस्तै: LOT001' : 'e.g., LOT001'}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'खरिदकर्ताको नाम' : 'Buyer Name'} *
                  </label>
                  <input
                    type="text"
                    value={wipData.buyerName}
                    onChange={(e) => setWipData(prev => ({ ...prev, buyerName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={currentLanguage === 'np' ? 'खरिदकर्ताको नाम' : 'Buyer name'}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Article Styles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'लेख शैलीहरू' : 'Article Styles'}
                </h2>
                <button
                  type="button"
                  onClick={addNewStyle}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + {currentLanguage === 'np' ? 'नयाँ शैली' : 'Add Style'}
                </button>
              </div>
              
              {wipData.parsedStyles.map((style, index) => (
                <ArticleStyleCard
                  key={index}
                  style={style}
                  index={index}
                  wipData={wipData}
                  currentLanguage={currentLanguage}
                  handleStyleChange={handleStyleChange}
                  removeStyle={removeStyle}
                  getTemplateStats={getTemplateStats}
                  getProcedurePreview={getProcedurePreview}
                  openTemplateBuilder={openTemplateBuilder}
                />
              ))}
            </div>

            {/* Size Configuration */}
            <SizeConfiguration
              wipData={wipData}
              currentLanguage={currentLanguage}
              handleSizeNamesChange={handleSizeNamesChange}
              handleSizeRatiosChange={handleSizeRatiosChange}
            />
          </div>
        )}

        {currentStep === 2 && (
          <RollDataEntry
            wipData={wipData}
            currentLanguage={currentLanguage}
            setWipData={setWipData}
          />
        )}

        {currentStep === 3 && (
          <WIPSummaryPreview
            wipData={wipData}
            currentLanguage={currentLanguage}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← {currentLanguage === 'np' ? 'अघिल्लो' : 'Previous'}
              </button>
            )}
          </div>
          
          <div className="space-x-4">
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentLanguage === 'np' ? 'अर्को' : 'Next'} →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ {currentLanguage === 'np' ? 'सेभ गर्नुहोस्' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WIPManualEntryModular;