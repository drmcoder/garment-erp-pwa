import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users, 
  Activity,
  Clock,
  Map,
  BarChart3,
  Settings,
  RefreshCw,
  Edit2,
  Save,
  X,
  Navigation,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { locationService } from '../../services/LocationService';

const LocationManagement = () => {
  const { user } = useAuth();
  const { currentLanguage, t } = useLanguage();
  const isNepali = currentLanguage === 'np';

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [locationAlerts, setLocationAlerts] = useState([]);
  const [locationStats, setLocationStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Toggle states
  const [monitoringEnabled, setMonitoringEnabled] = useState(locationService.isMonitoringEnabled());
  const [approvalRequired, setApprovalRequired] = useState(locationService.isApprovalRequired());
  
  // Multi-location settings state
  const [locations, setLocations] = useState(locationService.getAllLocations());
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingRadius, setEditingRadius] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    latitude: 27.7172,
    longitude: 85.3240,
    radius: 500,
    active: true
  });
  const [newRadius, setNewRadius] = useState(locationService.ALLOWED_RADIUS);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadLocationData();
  }, []);

  const loadLocationData = async () => {
    setLoading(true);
    try {
      // Load all location-related data in parallel
      const [approvalsResult, alertsResult, statsResult] = await Promise.all([
        locationService.getPendingApprovals(),
        locationService.getLocationAlerts(),
        locationService.getLocationStats(30)
      ]);

      if (approvalsResult.success) {
        setPendingApprovals(approvalsResult.approvals);
      }

      if (alertsResult.success) {
        setLocationAlerts(alertsResult.alerts);
      }

      if (statsResult.success) {
        setLocationStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Failed to load location data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (approvalId, action, reason = '') => {
    try {
      const result = await locationService.processLocationApproval(
        approvalId, 
        action, 
        user.id, 
        user.name, 
        reason
      );

      if (result.success) {
        // Remove from pending list
        setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
        
        // Show success message
        alert(isNepali 
          ? `अनुरोध ${action === 'approved' ? 'स्वीकृत' : 'अस्वीकृत'} भयो`
          : `Request ${action === 'approved' ? 'approved' : 'denied'} successfully`
        );
      }
    } catch (error) {
      console.error('Failed to process approval:', error);
      alert(isNepali ? 'कार्य असफल भयो' : 'Action failed');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLocationData();
    setRefreshing(false);
  };

  // Toggle handlers
  const handleToggleMonitoring = () => {
    const newState = locationService.toggleMonitoring();
    setMonitoringEnabled(newState);
  };

  const handleToggleApproval = () => {
    const newState = locationService.toggleApprovalRequired();
    setApprovalRequired(newState);
  };

  // Location settings functions
  const handleLocationUpdate = async () => {
    setSavingSettings(true);
    try {
      // Simulate API call to update factory location
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update LocationService factory location
      locationService.FACTORY_LOCATION = {
        ...newLocation,
        latitude: parseFloat(newLocation.latitude),
        longitude: parseFloat(newLocation.longitude)
      };
      
      setEditingLocation(false);
      alert(isNepali ? 'फ्याक्ट्री स्थान अपडेट भयो!' : 'Factory location updated successfully!');
    } catch (error) {
      alert(isNepali ? 'त्रुटि भयो!' : 'Error updating location!');
    }
    setSavingSettings(false);
  };

  const handleRadiusUpdate = async () => {
    setSavingSettings(true);
    try {
      // Simulate API call to update allowed radius
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update LocationService allowed radius
      locationService.ALLOWED_RADIUS = parseInt(newRadius);
      
      setEditingRadius(false);
      alert(isNepali ? 'अनुमतित दूरी अपडेट भयो!' : 'Allowed distance updated successfully!');
    } catch (error) {
      alert(isNepali ? 'त्रुटि भयो!' : 'Error updating radius!');
    }
    setSavingSettings(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setEditingLocation(true);
      navigator.geolocation.getCurrentPosition((position) => {
        setNewLocation(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      });
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${distance}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return isNepali ? 'अहिले' : 'Now';
    if (diffInMinutes < 60) return isNepali ? `${diffInMinutes} मिनेट पहिले` : `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return isNepali ? `${Math.floor(diffInMinutes / 60)} घण्टा पहिले` : `${Math.floor(diffInMinutes / 60)}h ago`;
    return isNepali ? `${Math.floor(diffInMinutes / 1440)} दिन पहिले` : `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">
            {isNepali ? 'स्थान डेटा लोड गर्दै...' : 'Loading location data...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? 'स्थान व्यवस्थापन' : 'Location Management'}
            </h1>
            <p className="text-gray-600">
              {isNepali ? 'अपरेटर स्थान निगरानी र अनुमोदन' : 'Operator location monitoring and approvals'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{isNepali ? 'रिफ्रेस' : 'Refresh'}</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {locationStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-100 text-sm font-medium">
                  {isNepali ? 'कुल पहुँच प्रयास' : 'Total Access Attempts'}
                </h3>
                <p className="text-2xl font-bold mt-2">{locationStats.totalAttempts}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-100 text-sm font-medium">
                  {isNepali ? 'वैध पहुँच' : 'Valid Access'}
                </h3>
                <p className="text-2xl font-bold mt-2">{locationStats.validAttempts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-100 text-sm font-medium">
                  {isNepali ? 'अवैध पहुँच' : 'Invalid Access'}
                </h3>
                <p className="text-2xl font-bold mt-2">{locationStats.invalidAttempts}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-purple-100 text-sm font-medium">
                  {isNepali ? 'औसत दूरी' : 'Average Distance'}
                </h3>
                <p className="text-2xl font-bold mt-2">{formatDistance(locationStats.averageDistance)}</p>
              </div>
              <Map className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: isNepali ? 'अवलोकन' : 'Overview', icon: BarChart3 },
              { id: 'approvals', label: isNepali ? 'अनुमोदन' : 'Approvals', icon: Shield, count: pendingApprovals.length },
              { id: 'alerts', label: isNepali ? 'अलर्ट' : 'Alerts', icon: AlertTriangle, count: locationAlerts.filter(alert => alert.status === 'unread').length },
              { id: 'settings', label: isNepali ? 'सेटिंग' : 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    {isNepali ? 'हालैको गतिविधि' : 'Recent Activity'}
                  </h3>
                  
                  {locationStats?.logs?.slice(0, 5).map((log, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${log.validation.isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="font-medium text-gray-800">{log.userName}</p>
                          <p className="text-sm text-gray-600">
                            {formatDistance(log.validation.distance)} {isNepali ? 'दूरी' : 'away'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">
                      {isNepali ? 'कुनै हालैको गतिविधि छैन' : 'No recent activity'}
                    </p>
                  )}
                </div>

                {/* Location Violations */}
                <div className="bg-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                    {isNepali ? 'स्थान उल्लंघन' : 'Location Violations'}
                  </h3>
                  
                  {locationStats?.recentViolations?.slice(0, 5).map((violation, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-red-200 last:border-0">
                      <div>
                        <p className="font-medium text-red-800">{violation.userName}</p>
                        <p className="text-sm text-red-600">
                          {formatDistance(violation.validation.distance)} {isNepali ? 'फ्याक्ट्रीबाट टाढा' : 'from factory'}
                        </p>
                      </div>
                      <span className="text-sm text-red-500">
                        {formatTimeAgo(violation.timestamp)}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">
                      {isNepali ? 'कुनै उल्लंघन छैन' : 'No violations'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {isNepali ? 'पेन्डिङ अनुमोदन' : 'Pending Approvals'}
                </h3>
                <span className="text-sm text-gray-500">
                  {pendingApprovals.length} {isNepali ? 'अनुरोध' : 'requests'}
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {isNepali ? 'कुनै पेन्डिङ अनुमोदन छैन' : 'No pending approvals'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="bg-white border rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{approval.userName}</h4>
                              <p className="text-sm text-gray-600">{approval.userRole}</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              {isNepali ? 'पेन्डिङ' : 'PENDING'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-600 mb-1">
                                {isNepali ? 'फ्याक्ट्रीबाट दूरी' : 'Distance from Factory'}
                              </p>
                              <p className="font-semibold text-red-600">
                                {formatDistance(approval.validation?.distance || 0)}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-600 mb-1">
                                {isNepali ? 'अनुरोध समय' : 'Request Time'}
                              </p>
                              <p className="font-semibold text-gray-800">
                                {formatTimeAgo(approval.requestedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                              <strong>{isNepali ? 'कारण:' : 'Reason:'}</strong> {approval.reason}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {isNepali ? 'अनुरोध ID:' : 'Request ID:'} {approval.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                          onClick={() => handleApprovalAction(approval.id, 'denied', 'Admin denied remote access')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4 inline mr-2" />
                          {isNepali ? 'अस्वीकार' : 'Deny'}
                        </button>
                        <button
                          onClick={() => handleApprovalAction(approval.id, 'approved', 'Admin approved remote access for 8 hours')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          {isNepali ? 'स्वीकृत' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {isNepali ? 'स्थान अलर्ट' : 'Location Alerts'}
                </h3>
                <span className="text-sm text-gray-500">
                  {locationAlerts.length} {isNepali ? 'अलर्ट' : 'alerts'}
                </span>
              </div>

              {locationAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {isNepali ? 'कुनै अलर्ट छैन' : 'No alerts'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {locationAlerts.slice(0, 20).map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-4 ${alert.status === 'unread' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                            {alert.status === 'unread' && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{alert.message}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{alert.userName} ({alert.userRole})</span>
                            <span>•</span>
                            <span>{formatDistance(alert.distance)} {isNepali ? 'दूरी' : 'away'}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(alert.timestamp)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            alert.severity === 'HIGH' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab - Multi-Location System */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {t('locationSettings') || (isNepali ? 'स्थान सेटिंग' : 'Factory Locations')}
                </h3>
                <button
                  onClick={() => setShowAddLocation(true)}
                  disabled={locations.length >= 3}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isNepali ? 'नयाँ स्थान थप्नुहोस्' : 'Add Location'}
                </button>
              </div>
              
              {/* Location Monitoring Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Operator Location Monitoring Toggle */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {isNepali ? 'अपरेटर स्थान निगरानी' : 'Operator Location Monitoring'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isNepali ? 'अपरेटरहरूको स्थान ट्र्याक गर्नुहोस्' : 'Track operator locations'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleMonitoring}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        monitoringEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          monitoringEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      monitoringEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {monitoringEnabled 
                        ? (isNepali ? 'सक्रिय' : 'Enabled') 
                        : (isNepali ? 'निष्क्रिय' : 'Disabled')
                      }
                    </span>
                  </div>
                </div>

                {/* Location Approval Toggle */}
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {isNepali ? 'स्थान अनुमोदन आवश्यक' : 'Location Approval Required'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isNepali ? 'रिमोट एक्सेसको लागि अनुमोदन चाहिन्छ' : 'Require approval for remote access'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleApproval}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        approvalRequired ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          approvalRequired ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      approvalRequired 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {approvalRequired 
                        ? (isNepali ? 'सक्रिय' : 'Required') 
                        : (isNepali ? 'निष्क्रिय' : 'Not Required')
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-blue-800 font-medium">
                      {isNepali 
                        ? 'बहु-स्थान प्रणाली सक्रिय'
                        : 'Multi-Location System Active'}
                    </p>
                    <p className="text-blue-600 text-sm">
                      {isNepali 
                        ? `${locations.filter(l => l.active).length} सक्रिय स्थानहरू मध्ये ${locations.length}`
                        : `${locations.filter(l => l.active).length} active out of ${locations.length} locations`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {t('factoryLocation') || (isNepali ? 'फ्याक्ट्री स्थान' : 'Factory Location')}
                    </h4>
                    {!editingLocation && (
                      <button
                        onClick={() => setEditingLocation(true)}
                        className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        {t('edit') || (isNepali ? 'सम्पादन' : 'Edit')}
                      </button>
                    )}
                  </div>

                  {!editingLocation ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        {isNepali ? 'हाल सेट गरिएको फ्याक्ट्री स्थान:' : 'Currently set factory location:'}
                      </p>
                      <p className="text-gray-800">
                        📍 {locationService.FACTORY_LOCATION.address}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {locationService.FACTORY_LOCATION.latitude.toFixed(6)}, {locationService.FACTORY_LOCATION.longitude.toFixed(6)}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'फ्याक्ट्री नाम' : 'Factory Name'}
                        </label>
                        <input
                          type="text"
                          value={newLocation.name}
                          onChange={(e) => setNewLocation(prev => ({...prev, name: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'ठेगाना' : 'Address'}
                        </label>
                        <input
                          type="text"
                          value={newLocation.address}
                          onChange={(e) => setNewLocation(prev => ({...prev, address: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isNepali ? 'अक्षांश' : 'Latitude'}
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={newLocation.latitude}
                            onChange={(e) => setNewLocation(prev => ({...prev, latitude: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isNepali ? 'देशान्तर' : 'Longitude'}
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={newLocation.longitude}
                            onChange={(e) => setNewLocation(prev => ({...prev, longitude: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={getCurrentLocation}
                          className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          {isNepali ? 'हालको स्थान' : 'Current Location'}
                        </button>
                        <button
                          onClick={handleLocationUpdate}
                          disabled={savingSettings}
                          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {savingSettings ? (isNepali ? 'सेभ गर्दै...' : 'Saving...') : (isNepali ? 'सेभ' : 'Save')}
                        </button>
                        <button
                          onClick={() => setEditingLocation(false)}
                          className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {isNepali ? 'रद्द' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {isNepali ? 'अनुमतित दूरी' : 'Allowed Distance'}
                    </h4>
                    {!editingRadius && (
                      <button
                        onClick={() => setEditingRadius(true)}
                        className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        {t('edit') || (isNepali ? 'सम्पादन' : 'Edit')}
                      </button>
                    )}
                  </div>

                  {!editingRadius ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        {isNepali ? 'फ्याक्ट्रीबाट अधिकतम दूरी:' : 'Maximum distance from factory:'}
                      </p>
                      <p className="text-gray-800 text-2xl font-bold">
                        {formatDistance(locationService.ALLOWED_RADIUS)}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'दूरी (मिटरमा)' : 'Distance (in meters)'}
                        </label>
                        <input
                          type="number"
                          min="100"
                          max="5000"
                          step="50"
                          value={newRadius}
                          onChange={(e) => setNewRadius(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {isNepali ? 'न्यूनतम: 100m, अधिकतम: 5000m' : 'Minimum: 100m, Maximum: 5000m'}
                        </p>
                      </div>
                      
                      {/* Quick preset buttons */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600">{isNepali ? 'छिटो सेट:' : 'Quick Set:'}</span>
                        {[200, 500, 1000, 2000].map(distance => (
                          <button
                            key={distance}
                            onClick={() => setNewRadius(distance)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              parseInt(newRadius) === distance 
                                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {formatDistance(distance)}
                          </button>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={handleRadiusUpdate}
                          disabled={savingSettings}
                          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {savingSettings ? (isNepali ? 'सेभ गर्दै...' : 'Saving...') : (isNepali ? 'सेभ' : 'Save')}
                        </button>
                        <button
                          onClick={() => setEditingRadius(false)}
                          className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {isNepali ? 'रद्द' : 'Cancel'}
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
    </div>
  );
};

export default LocationManagement;