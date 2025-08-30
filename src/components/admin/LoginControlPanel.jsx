// File: src/components/admin/LoginControlPanel.jsx
// Admin panel for managing time-based and location-based login controls

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Shield,
  ToggleLeft,
  ToggleRight,
  Settings,
  AlertTriangle,
  Users,
  Calendar,
  Zap,
  Tool,
  Save,
  RefreshCw,
  Play,
  Pause,
  Edit2,
  Plus,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { loginControlService } from '../../services/LoginControlService';

const LoginControlPanel = () => {
  const { currentLanguage, t } = useLanguage();
  const isNepali = currentLanguage === 'np';

  // State management
  const [settings, setSettings] = useState(loginControlService.getSettings());
  const [statusSummary, setStatusSummary] = useState(loginControlService.getStatusSummary());
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Emergency access state
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyDuration, setEmergencyDuration] = useState(2);

  // Maintenance mode state  
  const [maintenanceMessage, setMaintenanceMessage] = useState('System maintenance in progress. Please try again later.');

  useEffect(() => {
    // Update status every minute
    const interval = setInterval(() => {
      setStatusSummary(loginControlService.getStatusSummary());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API save
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(isNepali ? 'सेटिंग्स सुरक्षित गरियो!' : 'Settings saved successfully!');
    } catch (error) {
      alert(isNepali ? 'त्रुटि भयो!' : 'Error saving settings!');
    }
    setSaving(false);
  };

  const toggleLocationControl = () => {
    const updated = loginControlService.updateLocationControl({
      enabled: !settings.locationControl.enabled
    });
    setSettings(prev => ({
      ...prev,
      locationControl: updated
    }));
  };

  const toggleTimeControl = () => {
    const updated = loginControlService.updateTimeControl({
      enabled: !settings.timeControl.enabled
    });
    setSettings(prev => ({
      ...prev,
      timeControl: updated
    }));
  };

  const toggleShift = (shiftId) => {
    const shift = settings.timeControl.allowedShifts.find(s => s.id === shiftId);
    if (shift) {
      const updated = loginControlService.updateShift(shiftId, {
        active: !shift.active
      });
      if (updated) {
        setSettings(prev => ({
          ...prev,
          timeControl: {
            ...prev.timeControl,
            allowedShifts: prev.timeControl.allowedShifts.map(s => 
              s.id === shiftId ? updated : s
            )
          }
        }));
      }
    }
  };

  const enableEmergencyAccess = () => {
    if (!emergencyReason.trim()) {
      alert(isNepali ? 'कारण आवश्यक छ!' : 'Reason required!');
      return;
    }

    const emergency = loginControlService.enableEmergencyAccess(
      emergencyReason,
      emergencyDuration,
      'admin'
    );
    
    setSettings(prev => ({
      ...prev,
      emergencyAccess: emergency
    }));
    
    setEmergencyReason('');
    alert(isNepali ? 'आपतकालीन पहुँच सक्षम गरियो!' : 'Emergency access enabled!');
  };

  const disableEmergencyAccess = () => {
    const emergency = loginControlService.disableEmergencyAccess();
    setSettings(prev => ({
      ...prev,
      emergencyAccess: emergency
    }));
    alert(isNepali ? 'आपतकालीन पहुँच निष्क्रिय गरियो!' : 'Emergency access disabled!');
  };

  const toggleMaintenanceMode = () => {
    if (!settings.maintenanceMode.enabled) {
      const maintenance = loginControlService.enableMaintenanceMode(
        maintenanceMessage,
        ['management', 'supervisor']
      );
      setSettings(prev => ({
        ...prev,
        maintenanceMode: maintenance
      }));
    } else {
      const maintenance = loginControlService.disableMaintenanceMode();
      setSettings(prev => ({
        ...prev,
        maintenanceMode: maintenance
      }));
    }
  };

  const toggleTimeControl = () => {
    setSettings(prev => ({
      ...prev,
      timeControl: {
        ...prev.timeControl,
        enabled: !prev.timeControl.enabled
      }
    }));
  };

  const toggleShift = (shiftId) => {
    setSettings(prev => ({
      ...prev,
      timeControl: {
        ...prev.timeControl,
        allowedShifts: prev.timeControl.allowedShifts.map(shift =>
          shift.id === shiftId ? { ...shift, active: !shift.active } : shift
        )
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isNepali ? 'लगइन नियन्त्रण प्रणाली' : 'Login Control System'}
          </h2>
          <p className="text-gray-600">
            {isNepali 
              ? 'समय र स्थान आधारित लगइन नियन्त्रण प्रबन्धन गर्नुहोस्'
              : 'Manage time-based and location-based login controls'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? (isNepali ? 'सेभ गर्दै...' : 'Saving...') : (isNepali ? 'सेभ' : 'Save')}
        </button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isNepali ? 'वर्तमान समय' : 'Current Time'}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {statusSummary.currentTime}
              </p>
              <p className="text-sm text-gray-500">
                {statusSummary.currentDay}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isNepali ? 'स्थान नियन्त्रण' : 'Location Control'}
              </p>
              <p className={`text-lg font-semibold ${settings.locationControl.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.locationControl.enabled 
                  ? (isNepali ? 'सक्रिय' : 'Active')
                  : (isNepali ? 'निष्क्रिय' : 'Inactive')
                }
              </p>
            </div>
            <MapPin className={`w-8 h-8 ${settings.locationControl.enabled ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isNepali ? 'समय नियन्त्रण' : 'Time Control'}
              </p>
              <p className={`text-lg font-semibold ${settings.timeControl.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {settings.timeControl.enabled 
                  ? (isNepali ? 'सक्रिय' : 'Active')
                  : (isNepali ? 'निष्क्रिय' : 'Inactive')
                }
              </p>
              <p className="text-sm text-gray-500">
                {statusSummary.activeShifts} {isNepali ? 'सक्रिय शिफ्ट' : 'active shifts'}
              </p>
            </div>
            <Clock className={`w-8 h-8 ${settings.timeControl.enabled ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {isNepali ? 'प्रणाली स्थिति' : 'System Status'}
              </p>
              <p className={`text-lg font-semibold ${
                settings.maintenanceMode.enabled ? 'text-yellow-600' :
                settings.emergencyAccess.enabled ? 'text-red-600' : 'text-green-600'
              }`}>
                {settings.maintenanceMode.enabled 
                  ? (isNepali ? 'मर्मत मोड' : 'Maintenance')
                  : settings.emergencyAccess.enabled 
                  ? (isNepali ? 'आपातकालीन' : 'Emergency')
                  : (isNepali ? 'सामान्य' : 'Normal')
                }
              </p>
            </div>
            <Shield className={`w-8 h-8 ${
              settings.maintenanceMode.enabled ? 'text-yellow-600' :
              settings.emergencyAccess.enabled ? 'text-red-600' : 'text-green-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: isNepali ? 'सारांश' : 'Overview', icon: Shield },
          { id: 'location', label: isNepali ? 'स्थान' : 'Location', icon: MapPin },
          { id: 'time', label: isNepali ? 'समय' : 'Time', icon: Clock },
          { id: 'emergency', label: isNepali ? 'आपातकालीन' : 'Emergency', icon: Zap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border rounded-lg p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {isNepali ? 'नियन्त्रण सेटिंग्स' : 'Control Settings'}
            </h3>

            {/* Quick Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isNepali ? 'स्थान नियन्त्रण' : 'Location Control'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isNepali ? 'GPS आधारित लगइन प्रतिबन्ध' : 'GPS-based login restrictions'}
                  </p>
                </div>
                <button
                  onClick={toggleLocationControl}
                  className="flex items-center"
                >
                  {settings.locationControl.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isNepali ? 'समय नियन्त्रण' : 'Time Control'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isNepali ? 'काम को समय आधारित प्रतिबन्ध' : 'Working hours-based restrictions'}
                  </p>
                </div>
                <button
                  onClick={toggleTimeControl}
                  className="flex items-center"
                >
                  {settings.timeControl.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-blue-800 font-medium">
                  {isNepali 
                    ? 'स्थान आधारित लगइन नियन्त्रण'
                    : 'Location-based Login Control'}
                </p>
              </div>
            </div>

            {/* Location Control Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isNepali ? 'स्थान नियन्त्रण सक्षम गर्नुहोस्' : 'Enable Location Control'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isNepali ? 'GPS स्थान आधारमा लगइन प्रतिबन्ध लगाउनुहोस्' : 'Restrict logins based on GPS location'}
                  </p>
                </div>
                <button
                  onClick={toggleLocationControl}
                  className="flex items-center"
                >
                  {settings.locationControl.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              {settings.locationControl.enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900">
                    {isNepali ? 'अनुमतित स्थानहरू' : 'Allowed Locations'}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings.locationControl.allowedLocations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border rounded">
                        <div>
                          <p className="font-medium text-gray-900">{location.name}</p>
                          <p className="text-sm text-gray-600">{location.address}</p>
                          <p className="text-xs text-gray-500">
                            Radius: {location.radius}m
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          location.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {location.active ? (isNepali ? 'सक्रिय' : 'Active') : (isNepali ? 'निष्क्रिय' : 'Inactive')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time-based Controls */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {isNepali ? 'समय नियन्त्रण सक्षम गर्नुहोस्' : 'Enable Time Control'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isNepali ? 'काम को समय आधारमा लगइन प्रतिबन्ध लगाउनुहोस्' : 'Restrict logins based on working hours'}
                  </p>
                </div>
                <button
                  onClick={toggleTimeControl}
                  className="flex items-center"
                >
                  {settings.timeControl.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              {settings.timeControl.enabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900">
                    {isNepali ? 'काम को समय सेटिंग्स' : 'Working Hours Settings'}
                  </h5>
                  <div className="space-y-3">
                    {settings.timeControl.allowedShifts.map(shift => (
                      <div key={shift.id} className="flex items-center justify-between p-3 bg-white border rounded">
                        <div>
                          <h6 className="font-medium text-gray-900">{shift.name}</h6>
                          <p className="text-sm text-gray-600">
                            {shift.start} - {shift.end}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleShift(shift.id)}
                          className="flex items-center"
                        >
                          {shift.active ? (
                            <ToggleRight className="w-8 h-8 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Tab */}
        {activeTab === 'time' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {isNepali ? 'समय आधारित नियन्त्रण' : 'Time-based Control'}
            </h3>

            {/* Shift Management */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {isNepali ? 'शिफ्ट व्यवस्थापन' : 'Shift Management'}
              </h4>
              <div className="space-y-3">
                {settings.timeControl.allowedShifts.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">{shift.name}</h5>
                      <p className="text-sm text-gray-600">
                        {shift.start} - {shift.end}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleShift(shift.id)}
                      className="flex items-center"
                    >
                      {shift.active ? (
                        <ToggleRight className="w-8 h-8 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {isNepali ? 'आपातकालीन पहुँच व्यवस्थापन' : 'Emergency Access Management'}
            </h3>

            {/* Emergency Access */}
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-yellow-800">
                  {isNepali ? 'आपातकालीन पहुँच' : 'Emergency Access'}
                </h4>
                <span className={`px-2 py-1 text-xs rounded ${
                  settings.emergencyAccess.enabled 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {settings.emergencyAccess.enabled 
                    ? (isNepali ? 'सक्रिय' : 'Active')
                    : (isNepali ? 'निष्क्रिय' : 'Inactive')
                  }
                </span>
              </div>

              {!settings.emergencyAccess.enabled ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isNepali ? 'कारण' : 'Reason'}
                    </label>
                    <input
                      type="text"
                      value={emergencyReason}
                      onChange={(e) => setEmergencyReason(e.target.value)}
                      placeholder={isNepali ? 'आपातकालीन पहुँच को कारण...' : 'Reason for emergency access...'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isNepali ? 'अवधि (घण्टा)' : 'Duration (hours)'}
                    </label>
                    <select
                      value={emergencyDuration}
                      onChange={(e) => setEmergencyDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1 {isNepali ? 'घण्टा' : 'hour'}</option>
                      <option value={2}>2 {isNepali ? 'घण्टा' : 'hours'}</option>
                      <option value={4}>4 {isNepali ? 'घण्टा' : 'hours'}</option>
                      <option value={8}>8 {isNepali ? 'घण्टा' : 'hours'}</option>
                      <option value={24}>24 {isNepali ? 'घण्टा' : 'hours'}</option>
                    </select>
                  </div>

                  <button
                    onClick={enableEmergencyAccess}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {isNepali ? 'आपातकालीन पहुँच सक्षम गर्नुहोस्' : 'Enable Emergency Access'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-yellow-200 rounded p-3">
                    <p className="font-medium text-gray-900">
                      {isNepali ? 'कारण:' : 'Reason:'} {settings.emergencyAccess.reason}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isNepali ? 'सम्म मान्य:' : 'Valid until:'} {new Date(settings.emergencyAccess.validUntil).toLocaleString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={disableEmergencyAccess}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    {isNepali ? 'आपातकालीन पहुँच निष्क्रिय गर्नुहोस्' : 'Disable Emergency Access'}
                  </button>
                </div>
              )}
            </div>

            {/* Maintenance Mode */}
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-orange-800">
                  {isNepali ? 'मर्मत मोड' : 'Maintenance Mode'}
                </h4>
                <button
                  onClick={toggleMaintenanceMode}
                  className="flex items-center"
                >
                  {settings.maintenanceMode.enabled ? (
                    <ToggleRight className="w-8 h-8 text-orange-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              {!settings.maintenanceMode.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'सन्देश' : 'Message'}
                  </label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {settings.maintenanceMode.enabled && (
                <div className="bg-white border border-orange-200 rounded p-3">
                  <p className="text-orange-800 font-medium">
                    {isNepali ? 'मर्मत मोड सक्रिय छ' : 'Maintenance mode is active'}
                  </p>
                  <p className="text-sm text-orange-600">
                    {settings.maintenanceMode.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginControlPanel;