import React from 'react';
import { OPERATION_MODULES, PROCEDURE_TEMPLATES } from '../../../data/mockData';

const WIPSummaryPreview = ({ wipData = {}, currentLanguage }) => {
  // Early return if no wipData provided
  if (!wipData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          {currentLanguage === 'np' ? 'WIP डेटा उपलब्ध छैन' : 'No WIP data available'}
        </div>
      </div>
    );
  }
  // Get template statistics
  const getTemplateStats = (templateId, customTemplates = {}) => {
    const template = PROCEDURE_TEMPLATES[templateId] || customTemplates[templateId];
    if (!template || !template.operations) return { operations: 0, totalTime: 0, machines: [] };
    
    const operations = template.operations.map(opId => OPERATION_MODULES[opId]).filter(Boolean);
    const totalTime = operations.reduce((sum, op) => sum + (op.time || 0), 0);
    const machines = [...new Set(operations.map(op => op.machine).filter(Boolean))];
    
    return {
      operations: operations.length,
      totalTime,
      machines,
      estimatedCost: operations.reduce((sum, op) => sum + (op.rate || 0), 0)
    };
  };

  // Parse sizes and ratios
  const parseSmartSizeInput = (input) => {
    if (!input) return [];
    
    const trimmed = input.trim();
    if (!trimmed) return [];
    
    if (!trimmed.includes(':') && !trimmed.includes(';') && 
        !trimmed.includes(',') && !trimmed.includes('|') &&
        !trimmed.includes(' ')) {
      return [trimmed];
    }
    
    const separatorRegex = /[;,:|\\s]+/;
    
    return trimmed
      .split(separatorRegex)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const detectedSizes = parseSmartSizeInput(wipData?.sizeNames);
  const parsedRatios = wipData?.sizeRatios ? wipData.sizeRatios.split(',').map(r => parseFloat(r.trim())).filter(r => !isNaN(r)) : [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        📋 {currentLanguage === 'np' ? 'WIP सारांश' : 'WIP Summary'}
      </h2>
      
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            🏢 {currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Information'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-blue-700">
                {currentLanguage === 'np' ? 'लट नम्बर:' : 'Lot Number:'}
              </span>
              <span className="text-blue-900">{wipData.lotNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-700">
                {currentLanguage === 'np' ? 'खरिदकर्ता:' : 'Buyer:'}
              </span>
              <span className="text-blue-900">{wipData.buyerName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-700">
                {currentLanguage === 'np' ? 'PO नम्बर:' : 'PO Number:'}
              </span>
              <span className="text-blue-900">{wipData.poNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-blue-700">
                {currentLanguage === 'np' ? 'जरुरी:' : 'Urgency:'}
              </span>
              <span className="text-blue-900">
                {wipData.urgency === 'low' ? (currentLanguage === 'np' ? '🟢 कम' : '🟢 Low') :
                 wipData.urgency === 'medium' ? (currentLanguage === 'np' ? '🟡 मध्यम' : '🟡 Medium') :
                 (currentLanguage === 'np' ? '🔴 उच्च' : '🔴 High')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            🧵 {currentLanguage === 'np' ? 'कपडा जानकारी' : 'Fabric Information'}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-green-700">
                {currentLanguage === 'np' ? 'कपडा:' : 'Fabric:'}
              </span>
              <span className="text-green-900">{wipData.fabricName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-green-700">
                {currentLanguage === 'np' ? 'चौडाइ:' : 'Width:'}
              </span>
              <span className="text-green-900">{wipData.fabricWidth || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-green-700">
                {currentLanguage === 'np' ? 'रोल:' : 'Rolls:'}
              </span>
              <span className="text-green-900">{wipData.rollCount || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-green-700">
                {currentLanguage === 'np' ? 'स्टोर:' : 'Store:'}
              </span>
              <span className="text-green-900">{wipData.fabricStore || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Article Styles Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          👕 {currentLanguage === 'np' ? 'लेख शैलीहरू' : 'Article Styles'} ({(wipData.parsedStyles || []).length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(wipData.parsedStyles || []).map((style, index) => (
            <div key={index} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-yellow-800">
                  {currentLanguage === 'np' ? 'शैली' : 'Style'} #{index + 1}
                </span>
                {wipData.articleProcedures?.[style.articleNumber] && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                    {currentLanguage === 'np' ? 'प्रक्रिया सेट' : 'Procedure Set'}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-yellow-700">
                    {currentLanguage === 'np' ? 'लेख:' : 'Article:'}
                  </span>
                  <span className="text-yellow-900">{style.articleNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-yellow-700">
                    {currentLanguage === 'np' ? 'नाम:' : 'Name:'}
                  </span>
                  <span className="text-yellow-900">{style.styleName || 'N/A'}</span>
                </div>
                {wipData.articleProcedures?.[style.articleNumber] && (
                  <div className="mt-2 pt-2 border-t border-yellow-300">
                    {(() => {
                      const stats = getTemplateStats(wipData.articleProcedures[style.articleNumber].template, wipData.customTemplates);
                      return (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-yellow-700">
                            {stats.operations} {currentLanguage === 'np' ? 'चरण' : 'ops'}
                          </span>
                          <span className="text-yellow-700">
                            ⏱️ {stats.totalTime}min
                          </span>
                          <span className="text-yellow-700">
                            💰 ₹{stats.estimatedCost}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Size Configuration Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          📏 {currentLanguage === 'np' ? 'साइज कन्फिगरेसन' : 'Size Configuration'}
        </h3>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-purple-700 mb-2">
                {currentLanguage === 'np' ? 'साइजहरू:' : 'Sizes:'}
              </div>
              <div className="flex flex-wrap gap-1">
                {detectedSizes.map((size, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {size}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-purple-700 mb-2">
                {currentLanguage === 'np' ? 'अनुपातहरू:' : 'Ratios:'}
              </div>
              <div className="flex flex-wrap gap-1">
                {parsedRatios.map((ratio, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {ratio}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Size Mapping */}
          {detectedSizes.length > 0 && parsedRatios.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-300">
              <div className="text-sm font-medium text-purple-700 mb-2">
                {currentLanguage === 'np' ? 'साइज म्यापिङ:' : 'Size Mapping:'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {detectedSizes.map((size, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-center">
                    <div className="text-xs font-medium text-purple-800">{size}</div>
                    <div className="text-xs text-purple-600">
                      {parsedRatios[index] || '?'} {parsedRatios[index] ? (currentLanguage === 'np' ? 'थान' : 'pcs') : ''}
                    </div>
                  </div>
                ))}
              </div>
              
              {detectedSizes.length !== parsedRatios.length && (
                <div className="mt-2 text-center text-red-600 text-xs">
                  ⚠️ {currentLanguage === 'np' 
                    ? 'साइज र अनुपातको संख्या मेल खाँदैन'
                    : 'Size and ratio count mismatch'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Final Status */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          🎯 {currentLanguage === 'np' ? 'तयारी स्थिति' : 'Readiness Status'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl mb-1 ${wipData.lotNumber && wipData.buyerName ? 'text-green-500' : 'text-red-500'}`}>
              {wipData.lotNumber && wipData.buyerName ? '✅' : '❌'}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Info'}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl mb-1 ${(wipData.parsedStyles || []).every(s => s && s.articleNumber && s.styleName) ? 'text-green-500' : 'text-red-500'}`}>
              {(wipData.parsedStyles || []).every(s => s && s.articleNumber && s.styleName) ? '✅' : '❌'}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {currentLanguage === 'np' ? 'लेख शैली' : 'Article Styles'}
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl mb-1 ${detectedSizes.length > 0 && parsedRatios.length > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {detectedSizes.length > 0 && parsedRatios.length > 0 ? '✅' : '❌'}
            </div>
            <div className="text-sm font-medium text-gray-700">
              {currentLanguage === 'np' ? 'साइज कन्फिगरेसन' : 'Size Configuration'}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          {wipData.lotNumber && wipData.buyerName && 
           (wipData.parsedStyles || []).every(s => s && s.articleNumber && s.styleName) &&
           detectedSizes.length > 0 && parsedRatios.length > 0 ? (
            <div className="text-green-600 font-semibold">
              🎉 {currentLanguage === 'np' ? 'सबै जानकारी पूरा भयो! सेभ गर्न तयार छ।' : 'All information complete! Ready to save.'}
            </div>
          ) : (
            <div className="text-amber-600 font-semibold">
              ⚠️ {currentLanguage === 'np' ? 'कृपया सबै आवश्यक जानकारी भर्नुहोस्।' : 'Please complete all required information.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WIPSummaryPreview;