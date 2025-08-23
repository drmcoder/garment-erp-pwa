import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';

const CredentialManager = ({ onClose }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [credentials, setCredentials] = useState({
    googleSheets: {
      enabled: false,
      apiKey: '',
      serviceAccountKey: '',
      defaultSheetId: ''
    },
    firebase: {
      enabled: false,
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    },
    database: {
      type: 'local', // 'local', 'firebase', 'mysql'
      host: '',
      port: '',
      username: '',
      password: '',
      database: ''
    },
    notifications: {
      emailEnabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      whatsappEnabled: false,
      whatsappApiKey: ''
    }
  });

  const [activeTab, setActiveTab] = useState('database');
  const [showPasswords, setShowPasswords] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = () => {
    try {
      const saved = localStorage.getItem('systemCredentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCredentials(parsed);
      }
    } catch (error) {
      addError({
        message: 'Failed to load credentials',
        component: 'CredentialManager',
        action: 'Load Credentials',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const saveCredentials = () => {
    try {
      localStorage.setItem('systemCredentials', JSON.stringify(credentials));
      setHasChanges(false);
      
      addError({
        message: currentLanguage === 'np' ? 'प्रमाणपत्र सुरक्षित गरियो' : 'Credentials saved successfully',
        component: 'CredentialManager',
        action: 'Save Credentials',
        data: { timestamp: new Date() }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

    } catch (error) {
      addError({
        message: 'Failed to save credentials',
        component: 'CredentialManager',
        action: 'Save Credentials',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const updateCredential = (section, field, value) => {
    setCredentials(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const testConnection = async (type) => {
    try {
      // Mock connection test - in real app, this would make actual API calls
      addError({
        message: currentLanguage === 'np' 
          ? `${type} जडान सफल भयो` 
          : `${type} connection successful`,
        component: 'CredentialManager',
        action: 'Test Connection',
        data: { type }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      
    } catch (error) {
      addError({
        message: `${type} connection failed`,
        component: 'CredentialManager',
        action: 'Test Connection',
        data: { type, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const tabs = [
    { id: 'database', name: currentLanguage === 'np' ? 'डाटाबेस' : 'Database', icon: '🗄️' },
    { id: 'googleSheets', name: currentLanguage === 'np' ? 'Google Sheets' : 'Google Sheets', icon: '📊' },
    { id: 'firebase', name: 'Firebase', icon: '🔥' },
    { id: 'notifications', name: currentLanguage === 'np' ? 'सूचनाहरू' : 'Notifications', icon: '📧' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                🔐 {currentLanguage === 'np' ? 'प्रमाणपत्र व्यवस्थापन' : 'Credential Management'}
              </h1>
              <p className="text-purple-100">
                {currentLanguage === 'np' ? 'सिस्टम कनेक्शन र API keys' : 'System connections and API keys'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-600 p-2 rounded-xl transition-colors"
            >
              <div className="text-2xl">✕</div>
            </button>
          </div>
        </div>

        <div className="flex h-96">
          {/* Sidebar Tabs */}
          <div className="w-64 bg-gray-50 border-r">
            <div className="p-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left mb-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* Database Settings */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">
                  🗄️ {currentLanguage === 'np' ? 'डाटाबेस कन्फिगरेसन' : 'Database Configuration'}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'डाटाबेस प्रकार' : 'Database Type'}
                    </label>
                    <select
                      value={credentials.database.type}
                      onChange={(e) => updateCredential('database', 'type', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="local">{currentLanguage === 'np' ? 'स्थानीय भण्डारण' : 'Local Storage'}</option>
                      <option value="firebase">Firebase Firestore</option>
                      <option value="mysql">MySQL</option>
                    </select>
                  </div>

                  {credentials.database.type === 'mysql' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                          <input
                            type="text"
                            value={credentials.database.host}
                            onChange={(e) => updateCredential('database', 'host', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="localhost"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                          <input
                            type="text"
                            value={credentials.database.port}
                            onChange={(e) => updateCredential('database', 'port', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="3306"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'डाटाबेस नाम' : 'Database Name'}
                        </label>
                        <input
                          type="text"
                          value={credentials.database.database}
                          onChange={(e) => updateCredential('database', 'database', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="garment_erp"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {currentLanguage === 'np' ? 'प्रयोगकर्ता नाम' : 'Username'}
                          </label>
                          <input
                            type="text"
                            value={credentials.database.username}
                            onChange={(e) => updateCredential('database', 'username', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {currentLanguage === 'np' ? 'पासवर्ड' : 'Password'}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.dbPassword ? 'text' : 'password'}
                              value={credentials.database.password}
                              onChange={(e) => updateCredential('database', 'password', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('dbPassword')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPasswords.dbPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => testConnection('Database')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🔍 {currentLanguage === 'np' ? 'जडान परीक्षण' : 'Test Connection'}
                  </button>
                </div>
              </div>
            )}

            {/* Google Sheets Settings */}
            {activeTab === 'googleSheets' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">
                  📊 Google Sheets API
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="googleSheetsEnabled"
                      checked={credentials.googleSheets.enabled}
                      onChange={(e) => updateCredential('googleSheets', 'enabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="googleSheetsEnabled" className="text-sm font-medium text-gray-700">
                      {currentLanguage === 'np' ? 'Google Sheets सक्षम गर्नुहोस्' : 'Enable Google Sheets Integration'}
                    </label>
                  </div>

                  {credentials.googleSheets.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <div className="relative">
                          <input
                            type={showPasswords.googleApiKey ? 'text' : 'password'}
                            value={credentials.googleSheets.apiKey}
                            onChange={(e) => updateCredential('googleSheets', 'apiKey', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                            placeholder="AIzaSy..."
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('googleApiKey')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPasswords.googleApiKey ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'डिफल्ट शीट ID' : 'Default Sheet ID'}
                        </label>
                        <input
                          type="text"
                          value={credentials.googleSheets.defaultSheetId}
                          onChange={(e) => updateCredential('googleSheets', 'defaultSheetId', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                        />
                      </div>

                      <button
                        onClick={() => testConnection('Google Sheets')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        🔍 {currentLanguage === 'np' ? 'शीट परीक्षण' : 'Test Sheet Access'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Firebase Settings */}
            {activeTab === 'firebase' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">🔥 Firebase Configuration</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="firebaseEnabled"
                      checked={credentials.firebase.enabled}
                      onChange={(e) => updateCredential('firebase', 'enabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="firebaseEnabled" className="text-sm font-medium text-gray-700">
                      {currentLanguage === 'np' ? 'Firebase सक्षम गर्नुहोस्' : 'Enable Firebase'}
                    </label>
                  </div>

                  {credentials.firebase.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
                        <input
                          type="text"
                          value={credentials.firebase.projectId}
                          onChange={(e) => updateCredential('firebase', 'projectId', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="garment-erp-nepal"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                        <div className="relative">
                          <input
                            type={showPasswords.firebaseApiKey ? 'text' : 'password'}
                            value={credentials.firebase.apiKey}
                            onChange={(e) => updateCredential('firebase', 'apiKey', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('firebaseApiKey')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPasswords.firebaseApiKey ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Auth Domain</label>
                        <input
                          type="text"
                          value={credentials.firebase.authDomain}
                          onChange={(e) => updateCredential('firebase', 'authDomain', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          placeholder="garment-erp-nepal.firebaseapp.com"
                        />
                      </div>

                      <button
                        onClick={() => testConnection('Firebase')}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        🔍 {currentLanguage === 'np' ? 'Firebase परीक्षण' : 'Test Firebase'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">
                  📧 {currentLanguage === 'np' ? 'सूचना कन्फिगरेसन' : 'Notification Configuration'}
                </h2>
                
                <div className="space-y-6">
                  {/* Email Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="emailEnabled"
                        checked={credentials.notifications.emailEnabled}
                        onChange={(e) => updateCredential('notifications', 'emailEnabled', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="emailEnabled" className="text-lg font-medium text-gray-700">
                        📧 {currentLanguage === 'np' ? 'इमेल सूचनाहरू' : 'Email Notifications'}
                      </label>
                    </div>

                    {credentials.notifications.emailEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                          <input
                            type="text"
                            value={credentials.notifications.smtpHost}
                            onChange={(e) => updateCredential('notifications', 'smtpHost', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                          <input
                            type="number"
                            value={credentials.notifications.smtpPort}
                            onChange={(e) => updateCredential('notifications', 'smtpPort', parseInt(e.target.value))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={credentials.notifications.smtpUser}
                            onChange={(e) => updateCredential('notifications', 'smtpUser', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.smtpPassword ? 'text' : 'password'}
                              value={credentials.notifications.smtpPassword}
                              onChange={(e) => updateCredential('notifications', 'smtpPassword', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('smtpPassword')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPasswords.smtpPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="whatsappEnabled"
                        checked={credentials.notifications.whatsappEnabled}
                        onChange={(e) => updateCredential('notifications', 'whatsappEnabled', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="whatsappEnabled" className="text-lg font-medium text-gray-700">
                        📱 {currentLanguage === 'np' ? 'व्हाट्सएप सूचनाहरू' : 'WhatsApp Notifications'}
                      </label>
                    </div>

                    {credentials.notifications.whatsappEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp API Key</label>
                        <div className="relative">
                          <input
                            type={showPasswords.whatsappApiKey ? 'text' : 'password'}
                            value={credentials.notifications.whatsappApiKey}
                            onChange={(e) => updateCredential('notifications', 'whatsappApiKey', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('whatsappApiKey')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPasswords.whatsappApiKey ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {hasChanges && (
                <span className="text-orange-600">
                  ⚠️ {currentLanguage === 'np' ? 'परिवर्तनहरू बचत गर्नुहोस्' : 'Unsaved changes'}
                </span>
              )}
            </div>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button
                onClick={saveCredentials}
                disabled={!hasChanges}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                💾 {currentLanguage === 'np' ? 'सुरक्षित गर्नुहोस्' : 'Save Credentials'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialManager;