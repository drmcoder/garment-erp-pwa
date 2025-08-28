import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const ArticleStyleCard = ({ 
  style = {}, 
  index, 
  wipData = {}, 
  currentLanguage,
  handleStyleChange,
  removeStyle,
  getTemplateStats,
  getProcedurePreview,
  openTemplateBuilder
}) => {
  const isValid = style.articleNumber && style.styleName;
  
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              isValid 
                ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
            }`}>
              {index + 1}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {currentLanguage === 'np' ? 'लेख शैली' : 'Article Style'} #{index + 1}
            </h3>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'लेख नम्बर र शैलीको नाम प्रविष्ट गर्नुहोस्'
                : 'Enter article number and style name'
              }
            </p>
          </div>
        </div>
        
        {(wipData.parsedStyles || []).length > 1 && (
          <button
            type="button"
            onClick={() => removeStyle(index)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            title={currentLanguage === 'np' ? 'यो शैली हटाउनुहोस्' : 'Remove this style'}
          >
            ✕
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
            onChange={(e) => handleStyleChange(index, 'articleNumber', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder={currentLanguage === 'np' ? 'जस्तै: TSH001' : 'e.g., TSH001'}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {currentLanguage === 'np' ? 'शैलीको नाम' : 'Style Name'} *
          </label>
          <input
            type="text"
            value={style.styleName}
            onChange={(e) => handleStyleChange(index, 'styleName', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder={currentLanguage === 'np' ? 'जस्तै: बेसिक टी-शर्ट' : 'e.g., Basic T-Shirt'}
            required
          />
        </div>
      </div>

      {/* Validation Status */}
      <div className="mb-4">
        {isValid ? (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium">
              {currentLanguage === 'np' 
                ? 'शैली जानकारी पूरा भयो'
                : 'Style information complete'
              }
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <span className="text-lg">⚠️</span>
            <span className="text-sm">
              {currentLanguage === 'np' 
                ? 'कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्'
                : 'Please fill in all required fields'
              }
            </span>
          </div>
        )}
      </div>

      {/* Enhanced procedure details if template selected */}
      {wipData.articleProcedures?.[style.articleNumber]?.template && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-bold text-blue-800 flex items-center">
              <span className="mr-2">📋</span>
              {currentLanguage === 'np' ? 'प्रक्रिया विवरण:' : 'Procedure Details:'}
            </h5>
            {(() => {
              const stats = getTemplateStats(wipData.articleProcedures[style.articleNumber].template, wipData.customTemplates);
              return (
                <div className="flex items-center space-x-3 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    {stats.operations} operations
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    ⏱️ {stats.totalTime}min
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                    💰 ${stats.estimatedCost.toFixed(2)}
                  </span>
                </div>
              );
            })()}
          </div>
          
          {/* Operation sequence */}
          <div className="text-xs text-blue-700 mb-3 font-mono bg-blue-50 p-2 rounded border-l-4 border-blue-300">
            {getProcedurePreview(wipData.articleProcedures[style.articleNumber].template, wipData.customTemplates)}
          </div>

          {/* Custom template warning/info */}
          {wipData.customTemplates?.[wipData.articleProcedures[style.articleNumber].template] && (
            <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-yellow-800">
                  {currentLanguage === 'np' 
                    ? 'यो कस्टम टेम्प्लेट हो। यसलाई परिमार्जन गर्न सकिन्छ।'
                    : 'This is a custom template. It can be modified.'
                  }
                </span>
                <button
                  type="button"
                  onClick={() => openTemplateBuilder(wipData.articleProcedures[style.articleNumber].template)}
                  className="ml-auto text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-2 py-1 rounded border border-yellow-400 transition-colors"
                >
                  ✏️ {currentLanguage === 'np' ? 'सम्पादन' : 'Edit'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleStyleCard;