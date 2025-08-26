// Feature Toggle Panel for Development and Trial Phase
// Allows easy enabling/disabling of features without code changes

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWipFeatures } from '../../hooks/useWipFeatures';

const FeatureTogglePanel = ({ isOpen, onClose }) => {
  const { currentLanguage } = useLanguage();
  const wipFeatures = useWipFeatures();
  const [activeTab, setActiveTab] = useState('steps');

  if (!isOpen) return null;

  const handlePresetApply = (presetName) => {
    wipFeatures.applyPreset(presetName);
    alert(`Applied ${presetName} preset!`);
  };

  const handleFeatureToggle = (featurePath, enabled) => {
    wipFeatures.toggle(featurePath, enabled);
  };

  const handleLogConfig = () => {
    wipFeatures.logCurrentConfig();
    const status = wipFeatures.getFeatureStatus();
    console.log('📊 Feature Status:', status);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <span>🔧</span>
              <span>
                {currentLanguage === 'np' ? 'फिचर टगल प्यानल' : 'Feature Toggle Panel'}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-100 mt-2">
            {currentLanguage === 'np' 
              ? 'ट्रायल फेजको लागि फिचरहरू सजिलै बन्द/खोल्नुहोस्' 
              : 'Easily enable/disable features for trial phase'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-4">
            {['steps', 'templates', 'presets', 'debug'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {currentLanguage === 'np' ? 'स्टेप कन्फिगरेसन' : 'Step Configuration'}
              </h3>
              
              {Object.entries(wipFeatures.config.steps).map(([stepKey, stepConfig]) => (
                <div key={stepKey} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stepConfig.enabled}
                          onChange={(e) => handleFeatureToggle(`steps.${stepKey}`, e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="font-medium text-gray-700 capitalize">
                          {stepKey.replace(/([A-Z])/g, ' $1')}
                        </span>
                      </label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stepConfig.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stepConfig.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">Order: {stepConfig.order}</span>
                  </div>
                  
                  {stepConfig.features && (
                    <div className="mt-3 pl-6 border-l-2 border-purple-200">
                      <p className="text-sm font-medium text-gray-600 mb-2">Features:</p>
                      {Object.entries(stepConfig.features).map(([featureKey, featureConfig]) => (
                        <label key={featureKey} className="flex items-center space-x-2 mb-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={featureConfig.enabled}
                            onChange={(e) => handleFeatureToggle(`steps.${stepKey}.features.${featureKey}`, e.target.checked)}
                            className="w-3 h-3 text-purple-600 rounded focus:ring-purple-500"
                            disabled={!stepConfig.enabled}
                          />
                          <span className="text-sm text-gray-600 capitalize">
                            {featureKey.replace(/([A-Z])/g, ' $1')}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {currentLanguage === 'np' ? 'टेम्प्लेट कन्फिगरेसन' : 'Template Configuration'}
              </h3>
              
              {Object.entries(wipFeatures.config.steps.procedureTemplate.templates).map(([templateKey, templateConfig]) => (
                <div key={templateKey} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={templateConfig.enabled}
                        onChange={(e) => handleFeatureToggle(`steps.procedureTemplate.templates.${templateKey}`, e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="font-medium text-gray-700">
                          {templateConfig.name.en}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {templateConfig.description.en}
                        </p>
                      </div>
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      templateConfig.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {templateConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {currentLanguage === 'np' ? 'प्रिसेट कन्फिगरेसन' : 'Preset Configuration'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'minimal', name: 'Minimal', desc: 'Only essential features enabled', color: 'bg-blue-500' },
                  { key: 'full', name: 'Full Features', desc: 'All features enabled', color: 'bg-green-500' },
                  { key: 'testing', name: 'Testing Mode', desc: 'Relaxed validation for testing', color: 'bg-yellow-500' },
                  { key: 'production', name: 'Production Ready', desc: 'Strict validation and all features', color: 'bg-red-500' }
                ].map((preset) => (
                  <div key={preset.key} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-4 h-4 ${preset.color} rounded-full`}></div>
                      <h4 className="font-medium text-gray-800">{preset.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{preset.desc}</p>
                    <button
                      onClick={() => handlePresetApply(preset.key)}
                      className={`w-full ${preset.color} text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity`}
                    >
                      Apply {preset.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {currentLanguage === 'np' ? 'डिबग जानकारी' : 'Debug Information'}
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-800">Current Configuration</h4>
                  <button
                    onClick={handleLogConfig}
                    className="bg-purple-500 text-white py-1 px-3 rounded text-sm font-medium hover:bg-purple-600 transition-colors"
                  >
                    Log to Console
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enabled Steps:</span>
                    <span className="font-medium">{wipFeatures.getFeatureStatus().enabledSteps.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enabled Templates:</span>
                    <span className="font-medium">{wipFeatures.getFeatureStatus().enabledTemplates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strict Mode:</span>
                    <span className={`font-medium ${wipFeatures.isStrictMode ? 'text-red-600' : 'text-green-600'}`}>
                      {wipFeatures.isStrictMode ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Has Multiple Steps:</span>
                    <span className={`font-medium ${wipFeatures.hasMultipleSteps ? 'text-green-600' : 'text-red-600'}`}>
                      {wipFeatures.hasMultipleSteps ? 'YES' : 'NO'}
                    </span>
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

export default FeatureTogglePanel;