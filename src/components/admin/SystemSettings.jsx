// src/components/admin/SystemSettings.jsx
// System Settings Component for Line Configuration

import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { db, doc, getDoc, setDoc, COLLECTIONS } from '../../config/firebase';
import BackButton from '../common/BackButton';

const SystemSettings = ({ onBack }) => {
  const { isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);
  
  const [settings, setSettings] = useState({
    currentLine: 'line-1',
    lineName: isNepali ? 'उत्पादन लाइन १' : 'Production Line 1',
    lineNameEnglish: 'Production Line 1',
    lineNameNepali: 'उत्पादन लाइन १',
    targetEfficiency: 85,
    dailyTarget: 500,
    maxOperators: 50,
    shiftHours: 8,
    qualityThreshold: 95
  });
  
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Available line options
  const lineOptions = [
    { id: 'line-1', nameEn: 'Production Line 1', nameNp: 'उत्पादन लाइन १' },
    { id: 'line-2', nameEn: 'Production Line 2', nameNp: 'उत्पादन लाइन २' },
    { id: 'line-3', nameEn: 'Production Line 3', nameNp: 'उत्पादन लाइन ३' },
    { id: 'line-4', nameEn: 'Production Line 4', nameNp: 'उत्पादन लाइन ४' },
    { id: 'line-5', nameEn: 'Production Line 5', nameNp: 'उत्पादन लाइन ५' }
  ];

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      // Try loading from Firestore first
      const settingsDoc = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'global');
      const docSnap = await getDoc(settingsDoc);
      
      if (docSnap.exists()) {
        const firestoreSettings = docSnap.data();
        setSettings(firestoreSettings);
        console.log('✅ Loaded system settings from Firestore');
      } else {
        // No fallback - use default settings
        console.log('ℹ️ No Firestore settings found, using default settings');
      }
    } catch (error) {
      console.error('Failed to load system settings from Firestore:', error);
      // No localStorage fallback - use default settings
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [field]: value };
      
      // Auto-update line names when line changes
      if (field === 'currentLine') {
        const selectedLine = lineOptions.find(line => line.id === value);
        if (selectedLine) {
          newSettings.lineNameEnglish = selectedLine.nameEn;
          newSettings.lineNameNepali = selectedLine.nameNp;
          newSettings.lineName = isNepali ? selectedLine.nameNp : selectedLine.nameEn;
        }
      }
      
      return newSettings;
    });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save to Firestore first
      const settingsDoc = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'global');
      await setDoc(settingsDoc, settings);
      console.log('✅ Saved system settings to Firestore');
      
      // No localStorage backup needed
      
      // Settings saved successfully
      
      setHasChanges(false);
      showNotification(
        isNepali ? 'सेटिङ्ग्स सुरक्षित गरियो' : 'Settings saved successfully',
        'success'
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification(
        isNepali ? 'सेटिङ्ग्स सुरक्षित गर्न समस्या भयो' : 'Failed to save settings',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      currentLine: 'line-1',
      lineName: isNepali ? 'उत्पादन लाइन १' : 'Production Line 1',
      lineNameEnglish: 'Production Line 1',
      lineNameNepali: 'उत्पादन लाइन १',
      targetEfficiency: 85,
      dailyTarget: 500,
      maxOperators: 50,
      shiftHours: 8,
      qualityThreshold: 95
    });
    setHasChanges(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4 mb-4">
            {onBack && (
              <BackButton 
                onClick={onBack} 
                text={isNepali ? 'फिर्ता' : 'Back'} 
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ⚙️ {isNepali ? 'सिस्टम सेटिङ्ग्स' : 'System Settings'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isNepali 
                  ? 'उत्पादन लाइन र सिस्टम कन्फिगरेसन प्रबन्धन गर्नुहोस्'
                  : 'Configure production line and system settings'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Line Configuration */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🏭 {isNepali ? 'उत्पादन लाइन कन्फिगरेसन' : 'Production Line Configuration'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Line Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'हालको लाइन छनोट गर्नुहोस्' : 'Select Current Line'}
                </label>
                <select
                  value={settings.currentLine}
                  onChange={(e) => handleSettingChange('currentLine', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {lineOptions.map(line => (
                    <option key={line.id} value={line.id}>
                      {isNepali ? line.nameNp : line.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'लाइन प्रदर्शन नाम' : 'Line Display Name'}
                </label>
                <input
                  type="text"
                  value={settings.lineName}
                  onChange={(e) => handleSettingChange('lineName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'लाइन नाम' : 'Line Name'}
                />
              </div>
            </div>

            {/* Line Status Display */}
            <div className="mt-4 p-4 bg-white rounded-md border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {isNepali ? 'हालको सक्रिय लाइन:' : 'Currently Active Line:'}
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {settings.lineName} ({settings.currentLine})
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">
                    {isNepali ? 'सक्रिय' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Production Targets */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 {isNepali ? 'उत्पादन लक्ष्यहरू' : 'Production Targets'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'दैनिक लक्ष्य (टुक्राहरू)' : 'Daily Target (Pieces)'}
                </label>
                <input
                  type="number"
                  value={settings.dailyTarget}
                  onChange={(e) => handleSettingChange('dailyTarget', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'लक्ष्य दक्षता (%)' : 'Target Efficiency (%)'}
                </label>
                <input
                  type="number"
                  value={settings.targetEfficiency}
                  onChange={(e) => handleSettingChange('targetEfficiency', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'गुणस्तर थ्रेसहोल्ड (%)' : 'Quality Threshold (%)'}
                </label>
                <input
                  type="number"
                  value={settings.qualityThreshold}
                  onChange={(e) => handleSettingChange('qualityThreshold', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Operational Settings */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🏗️ {isNepali ? 'परिचालन सेटिङ्ग्स' : 'Operational Settings'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अधिकतम अपरेटरहरू' : 'Maximum Operators'}
                </label>
                <input
                  type="number"
                  value={settings.maxOperators}
                  onChange={(e) => handleSettingChange('maxOperators', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'शिफ्ट घण्टाहरू' : 'Shift Hours'}
                </label>
                <input
                  type="number"
                  value={settings.shiftHours}
                  onChange={(e) => handleSettingChange('shiftHours', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="24"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t">
            <button
              onClick={resetToDefaults}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {isNepali ? '🔄 डिफल्टमा रिसेट गर्नुहोस्' : '🔄 Reset to Defaults'}
            </button>

            <div className="flex space-x-4">
              {hasChanges && (
                <span className="text-amber-600 text-sm">
                  {isNepali ? 'असुरक्षित परिवर्तनहरू' : 'Unsaved changes'}
                </span>
              )}
              
              <button
                onClick={saveSettings}
                disabled={loading || !hasChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isNepali ? 'सुरक्षित गर्दै...' : 'Saving...'}</span>
                  </div>
                ) : (
                  `💾 ${isNepali ? 'सेटिङ्ग्स सुरक्षित गर्नुहोस्' : 'Save Settings'}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;