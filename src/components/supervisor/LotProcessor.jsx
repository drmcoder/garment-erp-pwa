import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';

const LotProcessor = ({ wipData, onBundlesCreated, onCancel }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [processedRolls, setProcessedRolls] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Roll Processing, 2: Bundle Creation, 3: Review

  useEffect(() => {
    if (wipData) {
      processWIPRolls();
    }
  }, [wipData]);

  const processWIPRolls = () => {
    try {
      const processed = wipData.rolls.map(roll => {
        const rollBundles = [];
        
        // Process each article/style in the roll
        wipData.parsedStyles.forEach(style => {
          const articleConfig = wipData.articleSizes[style.articleNumber];
          if (!articleConfig) return;

          const sizes = articleConfig.sizes.split(':').map(s => s.trim()).filter(s => s);
          const ratios = articleConfig.ratios.split(':').map(r => parseInt(r.trim()) || 0);

          // Create bundles for each size
          sizes.forEach((size, index) => {
            const ratio = ratios[index] || 0;
            const piecesPerBundle = ratio * roll.layerCount;

            if (piecesPerBundle > 0) {
              rollBundles.push({
                id: `${roll.id}-${style.articleNumber}-${size}`,
                rollId: roll.id,
                rollNumber: roll.rollNumber,
                articleNumber: style.articleNumber,
                articleName: style.styleName,
                color: roll.colorName,
                size: size,
                layers: roll.layerCount,
                ratio: ratio,
                pieces: piecesPerBundle,
                status: 'ready_for_cutting'
              });
            }
          });
        });

        return {
          ...roll,
          bundles: rollBundles,
          totalBundles: rollBundles.length,
          totalPieces: rollBundles.reduce((sum, b) => sum + b.pieces, 0)
        };
      });

      setProcessedRolls(processed);
      
      // Flatten all bundles
      const allBundles = processed.flatMap(roll => 
        roll.bundles.map(bundle => ({
          ...bundle,
          lotNumber: wipData.lotNumber,
          fabricName: wipData.fabricName,
          nepaliDate: wipData.nepaliDate,
          rollData: {
            rollNumber: roll.rollNumber,
            colorName: roll.colorName,
            layerCount: roll.layerCount,
            markedWeight: roll.markedWeight,
            actualWeight: roll.actualWeight
          }
        }))
      );

      setBundles(allBundles);
      
    } catch (error) {
      addError({
        message: 'Error processing WIP rolls',
        component: 'LotProcessor',
        action: 'Process Rolls',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleCreateBundles = () => {
    try {
      // Add bundle IDs and processing status
      const finalBundles = bundles.map((bundle, index) => ({
        ...bundle,
        bundleId: `${wipData.lotNumber}-B${(index + 1).toString().padStart(3, '0')}`,
        createdAt: new Date(),
        status: 'cut_ready',
        processStage: 'cutting',
        nextOperation: 'cutting',
        estimatedTime: calculateEstimatedTime(bundle),
        priority: 'normal',
        assignedOperator: null
      }));

      if (onBundlesCreated) {
        onBundlesCreated(finalBundles);
      }

      addError({
        message: currentLanguage === 'np' 
          ? `${finalBundles.length} बन्डलहरू सिर्जना गरियो` 
          : `${finalBundles.length} bundles created successfully`,
        component: 'LotProcessor',
        action: 'Create Bundles',
        data: { bundleCount: finalBundles.length }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

    } catch (error) {
      addError({
        message: 'Failed to create bundles',
        component: 'LotProcessor',
        action: 'Create Bundles',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const calculateEstimatedTime = (bundle) => {
    // Base time calculation - can be made more sophisticated
    const baseTimePerPiece = 2; // minutes
    return bundle.pieces * baseTimePerPiece;
  };

  const getColorForArticle = (articleNumber) => {
    const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-yellow-100', 'bg-pink-100'];
    const index = parseInt(articleNumber) % colors.length;
    return colors[index];
  };

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
                {currentLanguage === 'np' ? '🏭 लट प्रसंस्करण' : '🏭 Lot Processing'}
              </h1>
              <p className="text-gray-600">
                {currentLanguage === 'np' ? 'WIP डेटाबाट बन्डल बनाउनुहोस्' : 'Create bundles from WIP data'}
              </p>
            </div>
            
            <div className="w-10" />
          </div>
        </div>

        {/* Step 1: Roll Processing Summary */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📊 {currentLanguage === 'np' ? 'रोल प्रसंस्करण सारांश' : 'Roll Processing Summary'}
              </h2>
              
              {/* Lot Overview */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{wipData.lotNumber}</div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'लट नम्बर' : 'Lot Number'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{processedRolls.length}</div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'रोलहरू' : 'Rolls'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{bundles.length}</div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'बन्डलहरू' : 'Bundles'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{bundles.reduce((sum, b) => sum + b.pieces, 0)}</div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्राहरू' : 'Total Pieces'}</div>
                  </div>
                </div>
              </div>

              {/* Rolls Detail */}
              <div className="space-y-4">
                {processedRolls.map(roll => (
                  <div key={roll.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          {roll.rollNumber}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{roll.colorName}</div>
                          <div className="text-sm text-gray-600">
                            {roll.layerCount} {currentLanguage === 'np' ? 'लेयर' : 'layers'} • 
                            {roll.actualWeight}kg
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-green-600">{roll.totalBundles}</div>
                        <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'बन्डलहरू' : 'bundles'}</div>
                      </div>
                    </div>

                    {/* Bundles from this roll */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {roll.bundles.map(bundle => (
                        <div key={bundle.id} className={`${getColorForArticle(bundle.articleNumber)} rounded-lg p-3`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800">
                                {bundle.articleNumber}#{bundle.size}
                              </div>
                              <div className="text-sm text-gray-600">{bundle.articleName}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-800">{bundle.pieces}</div>
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

            {/* Continue Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
              >
                ➡️ {currentLanguage === 'np' ? 'बन्डल बनाउनुहोस्' : 'Create Bundles'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Bundle Creation */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                📦 {currentLanguage === 'np' ? 'बन्डल निर्माण' : 'Bundle Creation'}
              </h2>

              {/* Bundle Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map((bundle, index) => (
                  <div key={bundle.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                        B{(index + 1).toString().padStart(3, '0')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Roll #{bundle.rollNumber}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'आर्टिकल:' : 'Article:'}</span>
                        <span className="font-semibold">{bundle.articleNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'रङ:' : 'Color:'}</span>
                        <span className="font-semibold">{bundle.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'साइज:' : 'Size:'}</span>
                        <span className="font-semibold">{bundle.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'लेयर:' : 'Layers:'}</span>
                        <span className="font-semibold">{bundle.layers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'अनुपात:' : 'Ratio:'}</span>
                        <span className="font-semibold">{bundle.ratio}</span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्राहरू:' : 'Total Pieces:'}</span>
                        <span className="text-2xl font-bold text-green-600">{bundle.pieces}</span>
                      </div>
                    </div>

                    {/* Bundle calculation formula */}
                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded p-2">
                      {bundle.layers} layers × {bundle.ratio} ratio = {bundle.pieces} pieces
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-8 bg-green-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">{bundles.length}</div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'कुल बन्डलहरू' : 'Total Bundles'}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{bundles.reduce((sum, b) => sum + b.pieces, 0)}</div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्राहरू' : 'Total Pieces'}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{new Set(bundles.map(b => b.articleNumber + b.size)).size}</div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'विविधताहरू' : 'Variations'}</div>
                  </div>
                </div>
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
                onClick={handleCreateBundles}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
              >
                ✅ {currentLanguage === 'np' ? 'बन्डलहरू सिर्जना गर्नुहोस्' : 'Create Bundles'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LotProcessor;