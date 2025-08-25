import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WIPStatusBoard = ({ wipData, onClose }) => {
  const { currentLanguage } = useLanguage();
  const [view, setView] = useState('matrix'); // 'matrix', 'flow', 'analytics'
  const [selectedLot, setSelectedLot] = useState(null);
  const [processStep, setProcessStep] = useState(0);

  // If no WIP data provided, show empty state instead of mock data
  if (!wipData || !wipData.colors || wipData.colors.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">
                📊 {currentLanguage === 'np' ? 'WIP स्थिति बोर्ड' : 'WIP Status Board'}
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'कुनै WIP डेटा फेला परेन' : 'No WIP Data Found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {currentLanguage === 'np' 
                ? 'WIP स्थिति देखाउन कुनै डेटा उपलब्ध छैन। कृपया पहिले WIP डेटा प्रविष्ट गर्नुहोस्।'
                : 'No data available to display WIP status. Please enter WIP data first.'
              }
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {currentLanguage === 'np' ? 'बन्द गर्नुहोस्' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const data = wipData;
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

  // Calculate completion percentages
  const calculateProgress = (color, step) => {
    const status = color.status[step];
    const total = status.completed + status.inProgress + status.pending;
    return total > 0 ? (status.completed / total) * 100 : 0;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTotalsByStep = (step) => {
    return data.colors.reduce((total, color) => {
      const status = color.status[step];
      return {
        completed: total.completed + status.completed,
        inProgress: total.inProgress + status.inProgress,
        pending: total.pending + status.pending
      };
    }, { completed: 0, inProgress: 0, pending: 0 });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                📊 {currentLanguage === 'np' ? 'WIP स्थिति बोर्ड' : 'WIP Status Board'}
              </h2>
              <p className="text-blue-200 mt-1">
                {data.lotNumber} | {data.buyer} | {data.orderNumber}
              </p>
              <p className="text-blue-200 text-sm">
                {currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total pieces:'} {data.totalPieces} | 
                {currentLanguage === 'np' ? 'बन्डल:' : 'Bundles:'} {data.totalBundles}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white border-b p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setView('matrix')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'matrix' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 {currentLanguage === 'np' ? 'म्याट्रिक्स दृश्य' : 'Matrix View'}
            </button>
            <button
              onClick={() => setView('flow')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'flow' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔄 {currentLanguage === 'np' ? 'फ्लो दृश्य' : 'Flow View'}
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📈 {currentLanguage === 'np' ? 'एनालिटिक्स' : 'Analytics'}
            </button>
          </div>
        </div>

        <div className="h-full overflow-y-auto">
          {/* Matrix View */}
          {view === 'matrix' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🎨 {currentLanguage === 'np' ? 'रङ र साइज अनुसार प्रगति' : 'Progress by Color and Size'}
              </h3>
              
              <div className="space-y-6">
                {data.colors.map((color, colorIndex) => (
                  <div key={colorIndex} className="bg-white border rounded-lg p-4">
                    {/* Color Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                        <h4 className="text-lg font-semibold text-gray-800">{color.name}</h4>
                        <span className="text-sm text-gray-600">
                          {Object.values(color.pieces).reduce((sum, pieces) => sum + pieces, 0)} {currentLanguage === 'np' ? 'टुक्रा' : 'pieces'}
                        </span>
                      </div>
                      
                      {/* Overall Progress */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{currentLanguage === 'np' ? 'समग्र:' : 'Overall:'}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(
                              data.processSteps.reduce((avg, step) => avg + calculateProgress(color, step), 0) / data.processSteps.length
                            )}`}
                            style={{
                              width: `${data.processSteps.reduce((avg, step) => avg + calculateProgress(color, step), 0) / data.processSteps.length}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(data.processSteps.reduce((avg, step) => avg + calculateProgress(color, step), 0) / data.processSteps.length)}%
                        </span>
                      </div>
                    </div>

                    {/* Size Breakdown */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        {currentLanguage === 'np' ? 'साइज अनुसार बाँडफाँड:' : 'Size Breakdown:'}
                      </h5>
                      <div className="grid grid-cols-7 gap-2">
                        {sizes.map(size => (
                          <div key={size} className="text-center">
                            <div className="text-xs text-gray-600 font-medium">{size}</div>
                            <div className="text-lg font-bold text-blue-600">
                              {color.pieces[size] || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Process Steps */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        {currentLanguage === 'np' ? 'प्रक्रिया चरणहरू:' : 'Process Steps:'}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.processSteps.map((step, stepIndex) => {
                          const status = color.status[step];
                          const total = status.completed + status.inProgress + status.pending;
                          const progress = calculateProgress(color, step);
                          
                          return (
                            <div key={stepIndex} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-800">{step}</span>
                                <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                              </div>
                              
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className={`h-2 rounded-full ${getProgressColor(progress)}`}
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              
                              <div className="flex justify-between text-xs">
                                <span className="text-green-600">✅ {status.completed}</span>
                                <span className="text-yellow-600">⏳ {status.inProgress}</span>
                                <span className="text-gray-500">⏸️ {status.pending}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flow View */}
          {view === 'flow' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🔄 {currentLanguage === 'np' ? 'प्रक्रिया फ्लो' : 'Process Flow'}
              </h3>
              
              {/* Process Step Selector */}
              <div className="mb-6">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {data.processSteps.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => setProcessStep(index)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                        processStep === index 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xs">चरण {index + 1}</span>
                      <div>{step}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Flow Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {(() => {
                  const stepStats = getTotalsByStep(data.processSteps[processStep]);
                  const total = stepStats.completed + stepStats.inProgress + stepStats.pending;
                  
                  return (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{stepStats.completed}</div>
                        <div className="text-sm text-green-700">{currentLanguage === 'np' ? 'सम्पन्न' : 'Completed'}</div>
                        <div className="text-xs text-green-600">
                          {total > 0 ? Math.round((stepStats.completed / total) * 100) : 0}%
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-600">{stepStats.inProgress}</div>
                        <div className="text-sm text-yellow-700">{currentLanguage === 'np' ? 'चलिरहेको' : 'In Progress'}</div>
                        <div className="text-xs text-yellow-600">
                          {total > 0 ? Math.round((stepStats.inProgress / total) * 100) : 0}%
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-gray-600">{stepStats.pending}</div>
                        <div className="text-sm text-gray-700">{currentLanguage === 'np' ? 'बाँकी' : 'Pending'}</div>
                        <div className="text-xs text-gray-600">
                          {total > 0 ? Math.round((stepStats.pending / total) * 100) : 0}%
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{total}</div>
                        <div className="text-sm text-blue-700">{currentLanguage === 'np' ? 'कुल' : 'Total'}</div>
                        <div className="text-xs text-blue-600">100%</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Color-wise Flow */}
              <div className="space-y-4">
                {data.colors.map((color, index) => {
                  const status = color.status[data.processSteps[processStep]];
                  const total = status.completed + status.inProgress + status.pending;
                  
                  return (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800">{color.name}</h4>
                        <span className="text-sm text-gray-600">
                          {total} {currentLanguage === 'np' ? 'टुक्रा' : 'pieces'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div 
                              className="bg-green-500 transition-all duration-300"
                              style={{ width: `${(status.completed / total) * 100}%` }}
                              title={`Completed: ${status.completed}`}
                            ></div>
                            <div 
                              className="bg-yellow-500 transition-all duration-300"
                              style={{ width: `${(status.inProgress / total) * 100}%` }}
                              title={`In Progress: ${status.inProgress}`}
                            ></div>
                            <div 
                              className="bg-gray-400 transition-all duration-300"
                              style={{ width: `${(status.pending / total) * 100}%` }}
                              title={`Pending: ${status.pending}`}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4 text-sm">
                          <span className="text-green-600">✅ {status.completed}</span>
                          <span className="text-yellow-600">⏳ {status.inProgress}</span>
                          <span className="text-gray-500">⏸️ {status.pending}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analytics View */}
          {view === 'analytics' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                📈 {currentLanguage === 'np' ? 'उत्पादन एनालिटिक्स' : 'Production Analytics'}
              </h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                  <div className="text-3xl font-bold">{data.totalPieces}</div>
                  <div className="text-blue-100">{currentLanguage === 'np' ? 'कुल टुक्रा' : 'Total Pieces'}</div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
                  <div className="text-3xl font-bold">
                    {(() => {
                      const totalCompleted = data.colors.reduce((sum, color) => {
                        return sum + data.processSteps.reduce((stepSum, step) => {
                          return stepSum + color.status[step].completed;
                        }, 0);
                      }, 0);
                      const totalPossible = data.totalPieces * data.processSteps.length;
                      return Math.round((totalCompleted / totalPossible) * 100);
                    })()}%
                  </div>
                  <div className="text-green-100">{currentLanguage === 'np' ? 'समग्र प्रगति' : 'Overall Progress'}</div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
                  <div className="text-3xl font-bold">{data.colors.length}</div>
                  <div className="text-yellow-100">{currentLanguage === 'np' ? 'रङहरू' : 'Colors'}</div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
                  <div className="text-3xl font-bold">{data.totalBundles}</div>
                  <div className="text-purple-100">{currentLanguage === 'np' ? 'बन्डलहरू' : 'Bundles'}</div>
                </div>
              </div>

              {/* Bottleneck Analysis */}
              <div className="bg-white border rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  🚧 {currentLanguage === 'np' ? 'बाधा विश्लेषण' : 'Bottleneck Analysis'}
                </h4>
                
                <div className="space-y-3">
                  {data.processSteps.map((step, index) => {
                    const stepTotal = getTotalsByStep(step);
                    const total = stepTotal.completed + stepTotal.inProgress + stepTotal.pending;
                    const completionRate = total > 0 ? (stepTotal.completed / total) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-24 text-sm font-medium text-gray-700">{step}</div>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all ${getProgressColor(completionRate)}`}
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-right font-medium">
                          {Math.round(completionRate)}%
                        </div>
                        <div className="w-20 text-xs text-gray-600 text-right">
                          {stepTotal.completed}/{total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Efficiency Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    ⚡ {currentLanguage === 'np' ? 'दक्षता मेट्रिक्स' : 'Efficiency Metrics'}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{currentLanguage === 'np' ? 'औसत पूर्णता दर:' : 'Average completion rate:'}</span>
                      <span className="font-semibold">
                        {(() => {
                          const rates = data.processSteps.map(step => {
                            const stepTotal = getTotalsByStep(step);
                            const total = stepTotal.completed + stepTotal.inProgress + stepTotal.pending;
                            return total > 0 ? (stepTotal.completed / total) * 100 : 0;
                          });
                          return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
                        })()}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{currentLanguage === 'np' ? 'सबैभन्दा छिटो चरण:' : 'Fastest step:'}</span>
                      <span className="font-semibold text-green-600">
                        {(() => {
                          let fastestStep = '';
                          let highestRate = 0;
                          data.processSteps.forEach(step => {
                            const stepTotal = getTotalsByStep(step);
                            const total = stepTotal.completed + stepTotal.inProgress + stepTotal.pending;
                            const rate = total > 0 ? (stepTotal.completed / total) * 100 : 0;
                            if (rate > highestRate) {
                              highestRate = rate;
                              fastestStep = step;
                            }
                          });
                          return fastestStep;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{currentLanguage === 'np' ? 'सबैभन्दा ढिलो चरण:' : 'Slowest step:'}</span>
                      <span className="font-semibold text-red-600">
                        {(() => {
                          let slowestStep = '';
                          let lowestRate = 100;
                          data.processSteps.forEach(step => {
                            const stepTotal = getTotalsByStep(step);
                            const total = stepTotal.completed + stepTotal.inProgress + stepTotal.pending;
                            const rate = total > 0 ? (stepTotal.completed / total) * 100 : 0;
                            if (rate < lowestRate) {
                              lowestRate = rate;
                              slowestStep = step;
                            }
                          });
                          return slowestStep;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    🎯 {currentLanguage === 'np' ? 'लक्ष्य ट्र्याकिङ' : 'Target Tracking'}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{currentLanguage === 'np' ? 'दैनिक लक्ष्य:' : 'Daily target:'}</span>
                      <span className="font-semibold">150 {currentLanguage === 'np' ? 'टुक्रा' : 'pieces'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{currentLanguage === 'np' ? 'आजको प्रगति:' : "Today's progress:"}</span>
                      <span className="font-semibold text-blue-600">89 {currentLanguage === 'np' ? 'टुक्रा' : 'pieces'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{currentLanguage === 'np' ? 'बाँकी:' : 'Remaining:'}</span>
                      <span className="font-semibold text-orange-600">61 {currentLanguage === 'np' ? 'टुक्रा' : 'pieces'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: '59%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WIPStatusBoard;