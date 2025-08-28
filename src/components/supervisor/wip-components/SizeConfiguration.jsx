import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

// Validate and sanitize size input - More permissive, only remove clearly problematic characters
const validateSizeInput = (input) => {
  const problematicCharsRegex = /[<>{}[\]\\\/]/g;
  return input.replace(problematicCharsRegex, '');
};

// Handle keypress events to prevent invalid characters - More permissive
const handleSizeInputKeyPress = (e) => {
  const forbiddenChars = /^[<>{}[\]\\\/]$/;
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape'];
  
  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || !forbiddenChars.test(e.key)) {
    return;
  }
  
  e.preventDefault();
};

// Enhanced size parsing that handles all separator types flexibly
const parseSmartSizeInput = (input) => {
  if (!input) return [];
  
  const trimmed = input.trim();
  if (!trimmed) return [];
  
  // Handle single values without any separators
  if (!trimmed.includes(':') && !trimmed.includes(';') && 
      !trimmed.includes(',') && !trimmed.includes('|') &&
      !trimmed.includes(' ')) {
    return [trimmed];
  }
  
  const separatorRegex = /[;,:|\s]+/;
  
  return trimmed
    .split(separatorRegex)
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

const SizeConfiguration = ({ 
  wipData = {}, 
  currentLanguage,
  handleSizeNamesChange,
  handleSizeRatiosChange
}) => {
  const detectedSizes = parseSmartSizeInput(wipData?.sizeNames);
  const parsedRatios = wipData?.sizeRatios ? wipData.sizeRatios.split(',').map(r => parseFloat(r.trim())).filter(r => !isNaN(r)) : [];

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          📏 {currentLanguage === 'np' ? 'साइज कन्फिगरेसन' : 'Size Configuration'}
        </h3>
        <p className="text-sm text-gray-600">
          {currentLanguage === 'np' 
            ? 'साइजहरू र तिनीहरूका अनुपातहरू परिभाषित गर्नुहोस्'
            : 'Define sizes and their ratios'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Size Names */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {currentLanguage === 'np' ? 'साइज नामहरू' : 'Size Names'} *
          </label>
          <input
            type="text"
            value={wipData.sizeNames}
            onChange={(e) => {
              const sanitized = validateSizeInput(e.target.value);
              handleSizeNamesChange(sanitized);
            }}
            onKeyDown={handleSizeInputKeyPress}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={currentLanguage === 'np' ? 'S, M, L, XL' : 'S, M, L, XL'}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {currentLanguage === 'np' 
              ? 'एकल साइज वा कुनै पनि विभाजक प्रयोग गर्नुहोस्: : ; , | (स्पेसहरू)'
              : 'Single size or use any separator: : ; , | (spaces)'
            }
          </p>
          
          {/* Size Detection Preview */}
          {detectedSizes.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">
                {currentLanguage === 'np' ? 'पहिचान गरिएका साइजहरू:' : 'Detected sizes:'}
              </div>
              <div className="flex flex-wrap gap-1">
                {detectedSizes.map((size, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Size Ratios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {currentLanguage === 'np' ? 'साइज अनुपातहरू' : 'Size Ratios'} *
          </label>
          <input
            type="text"
            value={wipData.sizeRatios}
            onChange={handleSizeRatiosChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={currentLanguage === 'np' ? '1, 2, 2, 1' : '1, 2, 2, 1'}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {currentLanguage === 'np' 
              ? 'प्रति तह टुक्राहरू'
              : 'Pieces per layer'
            }
          </p>
          
          {/* Ratio Preview */}
          {parsedRatios.length > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-green-600 font-medium mb-1">
                {currentLanguage === 'np' ? 'अनुपात पूर्वावलोकन:' : 'Ratio preview:'}
              </div>
              <div className="flex flex-wrap gap-1">
                {parsedRatios.map((ratio, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {ratio}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-medium">
            ({detectedSizes.length} {currentLanguage === 'np' ? 'साइजहरू पहिचान गरियो' : 'sizes detected'})
          </span>
          {detectedSizes.length !== parsedRatios.length && (
            <span className="ml-2 text-red-600">
              ⚠️ {currentLanguage === 'np' 
                ? 'साइज र अनुपातको संख्या मेल खाँदैन'
                : 'Size and ratio count mismatch'
              }
            </span>
          )}
        </div>
        
        {/* Size-Ratio Mapping */}
        {detectedSizes.length > 0 && parsedRatios.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium text-gray-600 mb-1">
              {currentLanguage === 'np' ? 'साइज म्यापिङ:' : 'Size mapping:'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {detectedSizes.map((size, index) => (
                <div key={index} className="bg-white p-2 rounded border text-center">
                  <div className="text-xs font-medium text-gray-800">{size}</div>
                  <div className="text-xs text-gray-600">
                    {parsedRatios[index] || '?'}
                    {parsedRatios[index] ? (currentLanguage === 'np' ? ' थान' : ' pcs') : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SizeConfiguration;