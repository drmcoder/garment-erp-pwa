import React, { useState, useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import config from '../../config/environments';

const NotificationSettings = ({ isOpen, onClose }) => {
  const { isNepali } = useContext(LanguageContext);
  const { notifications, clearNotification } = useContext(NotificationContext);
  
  const [settings, setSettings] = useState({
    enableDemoNotifications: config.features.demoNotifications || false,
    enableSounds: true,
    enableBrowserNotifications: true,
    autoCloseTime: 5000
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Update the environment config for demo notifications
    if (key === 'enableDemoNotifications') {
      config.features.demoNotifications = value;
      console.log(`📢 Demo notifications ${value ? 'enabled' : 'disabled'}`);
    }
  };

  const clearAllNotifications = () => {
    notifications.forEach(notification => {
      clearNotification(notification.id);
    });
  };

  const clearDamageNotifications = () => {
    const damageNotifs = notifications.filter(n => 
      n.type === 'damage_reported' || 
      n.type === 'rework_completed' || 
      n.type === 'rework_started'
    );
    
    damageNotifs.forEach(notification => {
      clearNotification(notification.id);
    });
    
    console.log(`🧹 Cleared ${damageNotifs.length} damage notifications`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isNepali ? '📢 सूचना सेटिङ्गहरू' : '📢 Notification Settings'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Current Environment Info */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>{isNepali ? 'वर्तमान वातावरण' : 'Current Environment'}:</strong> {config.name}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {config.isDevelopment && (
              <span>{isNepali ? '🔧 विकास मोड - परीक्षण सुविधाहरू उपलब्ध' : '🔧 Development Mode - Testing features available'}</span>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          {/* Demo Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">
                {isNepali ? '🎭 डेमो सूचनाहरू' : '🎭 Demo Notifications'}
              </label>
              <p className="text-sm text-gray-500">
                {isNepali ? 'परीक्षण क्षति रिपोर्टहरू देखाउनुहोस्' : 'Show test damage reports'}
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('enableDemoNotifications', !settings.enableDemoNotifications)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                settings.enableDemoNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.enableDemoNotifications ? 'translate-x-6' : 'translate-x-1'
                } mt-1`}
              />
            </button>
          </div>

          {/* Sound Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">
                {isNepali ? '🔊 ध्वनि सूचनाहरू' : '🔊 Sound Notifications'}
              </label>
              <p className="text-sm text-gray-500">
                {isNepali ? 'सूचनाको लागि आवाज बजाउनुहोस्' : 'Play sound for notifications'}
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('enableSounds', !settings.enableSounds)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                settings.enableSounds ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.enableSounds ? 'translate-x-6' : 'translate-x-1'
                } mt-1`}
              />
            </button>
          </div>

          {/* Browser Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">
                {isNepali ? '🌐 ब्राउजर सूचनाहरू' : '🌐 Browser Notifications'}
              </label>
              <p className="text-sm text-gray-500">
                {isNepali ? 'डेस्कटप सूचनाहरू देखाउनुहोस्' : 'Show desktop notifications'}
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('enableBrowserNotifications', !settings.enableBrowserNotifications)}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                settings.enableBrowserNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  settings.enableBrowserNotifications ? 'translate-x-6' : 'translate-x-1'
                } mt-1`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <button
              onClick={clearDamageNotifications}
              className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              {isNepali ? '🧹 सबै क्षति सूचनाहरू सफा गर्नुहोस्' : '🧹 Clear All Damage Notifications'}
            </button>
            
            <button
              onClick={clearAllNotifications}
              className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
            >
              {isNepali ? '🗑️ सबै सूचनाहरू सफा गर्नुहोस्' : '🗑️ Clear All Notifications'}
            </button>
          </div>
        </div>

        {/* Current Stats */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="flex justify-between">
            <span>{isNepali ? 'कुल सूचनाहरू' : 'Total Notifications'}:</span>
            <span>{notifications.length}</span>
          </div>
          <div className="flex justify-between">
            <span>{isNepali ? 'क्षति सूचनाहरू' : 'Damage Notifications'}:</span>
            <span>
              {notifications.filter(n => 
                n.type === 'damage_reported' || 
                n.type === 'rework_completed' || 
                n.type === 'rework_started'
              ).length}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isNepali ? 'बन्द गर्नुहोस्' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;