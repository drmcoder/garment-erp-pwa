import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import ProcessTemplateManager from './ProcessTemplateManager';

const BundleManager = ({ bundles, wipData, onWorkItemsCreated, onCancel }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [workItems, setWorkItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Template Selection, 2: Bundle Processing, 3: Work Items Review

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowTemplateManager(false);
    setCurrentStep(2);
    
    // Small delay to show the processing screen, then process
    setTimeout(() => {
      processBundlesWithTemplate(template);
    }, 500);
  };

  const processBundlesWithTemplate = (template) => {
    try {
      const allWorkItems = [];

      console.log('Processing bundles with template:');
      console.log('- Template ID:', template.id);
      console.log('- Template Name:', template.name);
      console.log('- Template Type:', template.articleType);
      console.log('- Template Articles:', template.articleNumbers);
      console.log('- Template Operations:', template.operations.length);
      console.log('- Bundle Count:', bundles.length);
      console.log('- Bundle Articles:', bundles.map(b => b.articleNumber));

      bundles.forEach((bundle, bundleIndex) => {
        // Enhanced compatibility check for custom templates
        const isUniversalTemplate = template.articleType === 'universal' || 
                                   template.id === 'universal-garment-template';
        
        // Remove garment category dependency - use universal matching instead
        const matchesGarmentCategory = true;
        
        const isCustomTemplate = template.customTemplate === true || template.id.startsWith('custom-');
        
        // Custom templates are compatible with any garment category unless they specify specific articles
        const customTemplateApplicable = isCustomTemplate && 
                                        (!template.articleNumbers || 
                                         template.articleNumbers === null || 
                                         template.articleNumbers.length === 0 ||
                                         template.articleNumbers.includes(bundle.articleNumber));

        const isApplicable = isUniversalTemplate || 
                           matchesGarmentCategory || 
                           customTemplateApplicable;

        // Minimal debug logging (only for first 3 bundles)
        if (bundleIndex < 3) {
          console.log(`Bundle ${bundleIndex + 1}/${bundles.length}: ${bundle.bundleId} [${bundle.articleNumber}] - Applicable: ${isApplicable}`);
        }

        if (isApplicable) {
          // Only log for first few bundles to avoid performance issues
          if (bundleIndex < 3) {
            console.log(`Creating work items for bundle ${bundle.bundleId} with ${template.operations.length} operations`);
          }
          
          // Create work items for each operation in the template
          template.operations.forEach(operation => {
            const workItem = {
              id: `${bundle.bundleId}-${operation.id}`,
              bundleId: bundle.bundleId,
              bundleData: bundle,
              operation: operation,
              operationId: operation.id,
              operationName: currentLanguage === 'np' ? operation.nameNp : operation.nameEn,
              sequence: operation.sequence,
              pieces: bundle.pieces,
              estimatedTime: bundle.pieces * operation.estimatedTimePerPiece,
              totalEarnings: bundle.pieces * operation.rate,
              machineType: operation.machineType,
              skillLevel: operation.skillLevel,
              status: operation.sequence === 1 ? 'ready' : 'waiting', // First operation is ready, others wait
              dependencies: operation.dependencies.map(depId => `${bundle.bundleId}-${depId}`),
              assignedOperator: null,
              createdAt: new Date(),
              priority: bundle.priority || 'normal',
              lotNumber: bundle.lotNumber,
              articleNumber: bundle.articleNumber,
              articleName: bundle.articleName,
              color: bundle.color,
              size: bundle.size,
              icon: operation.icon
            };

            allWorkItems.push(workItem);
          });
        }
      });

      // Sort by bundle and sequence
      allWorkItems.sort((a, b) => {
        if (a.bundleId !== b.bundleId) {
          return a.bundleId.localeCompare(b.bundleId);
        }
        return a.sequence - b.sequence;
      });

      console.log('Final work items count:', allWorkItems.length);
      setWorkItems(allWorkItems);
      setCurrentStep(3);

      // Log results - only warn if no work items created
      if (allWorkItems.length === 0) {
        addError({
          message: currentLanguage === 'np' 
            ? `कुनै काम आइटमहरू सिर्जना भएनन् - टेम्प्लेट र बन्डल जाँच गर्नुहोस्`
            : `No work items created - check template and bundle compatibility`,
          component: 'BundleManager',
          action: 'Process Bundles',
          data: { 
            bundleCount: bundles.length,
            templateId: template.id,
            templateType: template.articleType,
            templateArticles: template.articleNumbers,
            bundleArticles: bundles.map(b => b.articleNumber),
            bundleDetails: bundles.map(b => ({ 
              id: b.bundleId || b.id, 
              article: b.articleNumber,
              color: b.color,
              size: b.size 
            })),
            templateOperations: template.operations?.length || 0
          }
        }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
      } else {
        // Success message - no need to log as warning, just console log
        console.log(`✅ Bundle processing success: ${allWorkItems.length} work items created from ${bundles.length} bundles using template ${template.id}`);
      }

    } catch (error) {
      addError({
        message: 'Failed to process bundles with template',
        component: 'BundleManager',
        action: 'Process Bundles',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleCreateWorkItems = () => {
    if (onWorkItemsCreated) {
      onWorkItemsCreated(workItems, selectedTemplate);
    }
  };

  const getBundlesByArticle = () => {
    const grouped = {};
    bundles.forEach(bundle => {
      const key = bundle.articleNumber;
      if (!grouped[key]) {
        grouped[key] = {
          articleNumber: bundle.articleNumber,
          articleName: bundle.articleName,
          bundles: []
        };
      }
      grouped[key].bundles.push(bundle);
    });
    return Object.values(grouped);
  };

  const getMachineTypeColor = (machineType) => {
    const colors = {
      'cutting': 'bg-red-100 text-red-800 border-red-200',
      'overlock': 'bg-blue-100 text-blue-800 border-blue-200',
      'flatlock': 'bg-green-100 text-green-800 border-green-200',
      'singleNeedle': 'bg-purple-100 text-purple-800 border-purple-200',
      'buttonhole': 'bg-orange-100 text-orange-800 border-orange-200',
      'manual': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[machineType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'ready': 'bg-green-100 text-green-800',
      'waiting': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (showTemplateManager) {
    return (
      <ProcessTemplateManager
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowTemplateManager(false)}
      />
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto">
        
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
              <h1 className="text-2xl font-bold text-gray-800">
                📦 {currentLanguage === 'np' ? 'बन्डल व्यवस्थापन' : 'Bundle Management'}
              </h1>
              <p className="text-gray-600">
                {currentLanguage === 'np' ? 'बन्डलहरूलाई काम आइटमहरूमा रूपान्तरण गर्नुहोस्' : 'Convert bundles to work items'}
              </p>
            </div>
            
            <div className="w-10" />
          </div>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2 text-sm text-gray-600">
              {currentStep === 1 && (currentLanguage === 'np' ? 'टेम्प्लेट चयन' : 'Template Selection')}
              {currentStep === 2 && (currentLanguage === 'np' ? 'प्रसंस्करण' : 'Processing')}
              {currentStep === 3 && (currentLanguage === 'np' ? 'समीक्षा' : 'Review')}
            </div>
          </div>
        </div>

        {/* Step 1: Bundle Overview & Template Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Bundle Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📊 {currentLanguage === 'np' ? 'बन्डल सारांश' : 'Bundle Summary'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{bundles.length}</div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'कुल बन्डलहरू' : 'Total Bundles'}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {bundles.reduce((sum, b) => sum + b.pieces, 0)}
                  </div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्राहरू' : 'Total Pieces'}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {new Set(bundles.map(b => b.articleNumber)).size}
                  </div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'लेखहरू' : 'Articles'}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {new Set(bundles.map(b => b.color)).size}
                  </div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'रङहरू' : 'Colors'}</div>
                </div>
              </div>

              {/* Bundles by Article */}
              <div className="space-y-4">
                {getBundlesByArticle().map(articleGroup => (
                  <div key={articleGroup.articleNumber} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {articleGroup.articleNumber} - {articleGroup.articleName}
                        </h3>
                        <p className="text-gray-600">
                          {articleGroup.bundles.length} {currentLanguage === 'np' ? 'बन्डलहरू' : 'bundles'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {articleGroup.bundles.map(bundle => (
                        <div key={bundle.bundleId} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">{bundle.bundleId}</div>
                              <div className="text-xs text-gray-600">
                                {bundle.color} • {bundle.size}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{bundle.pieces}</div>
                              <div className="text-xs text-gray-500">{currentLanguage === 'np' ? 'पिस' : 'pcs'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ⚙️ {currentLanguage === 'np' ? 'प्रसंस्करण टेम्प्लेट चयन गर्नुहोस्' : 'Select Processing Template'}
              </h2>
              
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  {currentLanguage === 'np' 
                    ? 'बन्डलहरूलाई काम आइटमहरूमा रूपान्तरण गर्न प्रसंस्करण टेम्प्लेट आवश्यक छ'
                    : 'A processing template is required to convert bundles into work items'
                  }
                </p>
                
                <button
                  onClick={() => setShowTemplateManager(true)}
                  className="bg-purple-600 text-white text-lg font-semibold py-4 px-8 rounded-2xl hover:bg-purple-700 transition-colors"
                >
                  🔍 {currentLanguage === 'np' ? 'टेम्प्लेट चयन गर्नुहोस्' : 'Choose Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Processing (Loading) */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {currentLanguage === 'np' ? 'बन्डलहरू प्रसंस्करण गर्दै...' : 'Processing Bundles...'}
            </h2>
            <p className="text-gray-600 mb-6">
              {currentLanguage === 'np' 
                ? 'टेम्प्लेट प्रयोग गरेर काम आइटमहरू सिर्जना गर्दै'
                : 'Creating work items using selected template'
              }
            </p>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {/* Step 3: Work Items Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ✅ {currentLanguage === 'np' ? 'काम आइटमहरू तयार' : 'Work Items Ready'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{workItems.length}</div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'काम आइटमहरू' : 'Work Items'}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {workItems.filter(item => item.status === 'ready').length}
                  </div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'तयार' : 'Ready'}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {workItems.filter(item => item.status === 'waiting').length}
                  </div>
                  <div className="text-gray-600">{currentLanguage === 'np' ? 'प्रतीक्षामा' : 'Waiting'}</div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg text-gray-600 mb-2">
                  {currentLanguage === 'np' ? 'चयनित टेम्प्लेट:' : 'Selected Template:'}
                </p>
                <h3 className="text-xl font-bold text-purple-600">{selectedTemplate?.name}</h3>
              </div>
            </div>

            {/* Work Items List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 {currentLanguage === 'np' ? 'काम आइटमहरूको सूची' : 'Work Items List'}
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {workItems.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{item.icon}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-800">
                            {item.bundleId}
                          </span>
                          <span className="text-sm text-gray-500">→</span>
                          <span className="font-medium text-gray-700">
                            {item.operationName}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {item.articleNumber} • {item.color} • {item.size} • {item.pieces} {currentLanguage === 'np' ? 'पिस' : 'pcs'}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded border text-sm font-semibold ${getMachineTypeColor(item.machineType)}`}>
                          {item.machineType}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          रु. {item.totalEarnings} • {item.estimatedTime} min
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                ⬅️ {currentLanguage === 'np' ? 'फिर्ता' : 'Back'}
              </button>
              
              <button
                onClick={handleCreateWorkItems}
                className="bg-green-600 text-white text-lg font-semibold px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                🚀 {currentLanguage === 'np' ? 'काम आइटमहरू सिर्जना गर्नुहोस्' : 'Create Work Items'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleManager;