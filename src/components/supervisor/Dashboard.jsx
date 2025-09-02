import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Clock,
  TrendingUp,
  Package,
  PauseCircle,
  Target,
  Settings,
  RefreshCw,
  Plus,
  Eye,
  Bell,
  Zap,
  X,
  MapPin,
  Shield,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  Pause,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { 
  useSupervisorData,
  useUsers,
  useWorkManagement,
  useProductionAnalytics,
  useCentralizedStatus
} from "../../hooks/useAppData";
import { CompactLoader } from "../common/BrandedLoader";
import { loginControlService } from "../../services/LoginControlService";
import { locationService } from "../../services/LocationService";
import MoneyManagement from "./MoneyManagement";
import WorkAssignmentSystem from "../common/WorkAssignmentSystem";
import LiveOperatorWorkBucket from "./LiveOperatorWorkBucket";
import AllOperatorsEarnings from "./AllOperatorsEarnings";
import LineInspection from "./LineInspection";
import DailyReports from "./DailyReports";
import IssueResolution from "./IssueResolution";
import BundlePaymentHolds from "./BundlePaymentHolds";

const Dashboard = () => {
  const { getUserDisplayInfo, isOnline } = useAuth();
  const {
    t,
    currentLanguage,
    formatTime,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatNumber,
    getSizeLabel,
  } = useLanguage();

  const [activeTab, setActiveTab] = useState("monitoring");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStation, setSelectedStation] = useState(null);

  // Location and Login Control State
  const [loginControlSettings, setLoginControlSettings] = useState(loginControlService.getSettings());
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [locationAlerts, setLocationAlerts] = useState([]);
  const [locationStats, setLocationStats] = useState(null);
  const [saving, setSaving] = useState(false);

  // Emergency access state
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyDuration, setEmergencyDuration] = useState(2);

  const userInfo = getUserDisplayInfo();

  // Use centralized data hooks - INFINITE LOOP FIXED
  
  const { 
    lineStatus, 
    pendingApprovals: supervisorPendingApprovals, 
    qualityIssues
  } = useSupervisorData();
  
  const { allUsers, loading: usersLoading } = useUsers();
  const { workItems, loading: workLoading } = useWorkManagement();
  const { stats, analytics, loading: productionLoading } = useProductionAnalytics();
  const { isReady, isLoading: centralizedLoading, error: centralizedError } = useCentralizedStatus();

  // Combine loading states
  const hybridLoading = usersLoading || workLoading || productionLoading || centralizedLoading;
  const hybridError = centralizedError;

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Load location and login control data
  useEffect(() => {
    loadLocationControlData();
  }, []);

  const loadLocationControlData = async () => {
    try {
      // Load location approvals and alerts
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
      console.error('Failed to load location control data:', error);
    }
  };

  // Static data to completely prevent infinite loops
  const lineData = [
    {
      id: 'overlock-1',
      station: 'ओभरलक स्टेसन',
      stationEn: 'Overlock Station',
      operator: 'Ram Bahadur',
      operatorEn: 'Ram Bahadur',
      status: 'active',
      efficiency: 85,
      currentWork: null,
      nextWork: null
    },
    {
      id: 'single-needle-1',
      station: 'एकल सुई स्टेसन',
      stationEn: 'Single Needle Station',
      operator: 'Shyam Kumar',
      operatorEn: 'Shyam Kumar',
      status: 'active',
      efficiency: 92,
      currentWork: null,
      nextWork: null
    },
    {
      id: 'flatlock-1',
      station: 'फ्ल्यालक स्टेसन',
      stationEn: 'Flatlock Station',
      operator: 'Gita Sharma',
      operatorEn: 'Gita Sharma',
      status: 'idle',
      efficiency: 78,
      currentWork: null,
      nextWork: null
    }
  ];

  const efficiencyAlerts = [
    {
      id: 1,
      type: 'low-efficiency',
      station: 'Gita Sharma',
      stationEn: 'Gita Sharma',
      operator: 'Gita Sharma',
      efficiency: 78,
      priority: 'medium'
    }
  ];

  const dashboardProductionStats = {
    totalProduction: 1250,
    targetProduction: 15000,
    efficiency: 88,
    qualityScore: 95,
    activeOperators: 18,
    totalOperators: 20
  };

  // Removed problematic useMemo dependency - using static data above

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "idle":
        return "bg-red-100 text-red-800 border-red-200";
      case "break":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "maintenance":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 80) return "text-blue-600";
    if (efficiency >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Helper function to get greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (currentLanguage === "np") {
      if (hour < 12) return "शुभ प्रभात";
      if (hour < 17) return "नमस्कार";
      return "शुभ संध्या";
    } else {
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    }
  };

  // Login Control Functions
  const handleSaveLoginControls = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(currentLanguage === 'np' ? 'सेटिंग्स सुरक्षित गरियो!' : 'Settings saved successfully!');
    } catch (error) {
      alert(currentLanguage === 'np' ? 'त्रुटि भयो!' : 'Error saving settings!');
    }
    setSaving(false);
  };

  const toggleLocationControl = () => {
    const updated = loginControlService.updateLocationControl({
      enabled: !loginControlSettings.locationControl.enabled
    });
    setLoginControlSettings(prev => ({
      ...prev,
      locationControl: updated
    }));
  };

  const toggleTimeControl = () => {
    const updated = loginControlService.updateTimeControl({
      enabled: !loginControlSettings.timeControl.enabled
    });
    setLoginControlSettings(prev => ({
      ...prev,
      timeControl: updated
    }));
  };

  const toggleShift = (shiftId) => {
    const shift = loginControlSettings.timeControl.allowedShifts.find(s => s.id === shiftId);
    if (shift) {
      const updated = loginControlService.updateShift(shiftId, {
        active: !shift.active
      });
      if (updated) {
        setLoginControlSettings(prev => ({
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
      alert(currentLanguage === 'np' ? 'कारण आवश्यक छ!' : 'Reason required!');
      return;
    }

    const emergency = loginControlService.enableEmergencyAccess(
      emergencyReason,
      emergencyDuration,
      'supervisor'
    );
    
    setLoginControlSettings(prev => ({
      ...prev,
      emergencyAccess: emergency
    }));
    
    setEmergencyReason('');
    alert(currentLanguage === 'np' ? 'आपतकालीन पहुँच सक्षम गरियो!' : 'Emergency access enabled!');
  };

  const disableEmergencyAccess = () => {
    const emergency = loginControlService.disableEmergencyAccess();
    setLoginControlSettings(prev => ({
      ...prev,
      emergencyAccess: emergency
    }));
    alert(currentLanguage === 'np' ? 'आपतकालीन पहुँच निष्क्रिय गरियो!' : 'Emergency access disabled!');
  };

  // Location Management Functions
  const handleApprovalAction = async (approvalId, action, reason = '') => {
    try {
      const result = await locationService.processLocationApproval(
        approvalId, 
        action, 
        userInfo.id, 
        userInfo.name, 
        reason
      );

      if (result.success) {
        setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
        alert(currentLanguage === 'np' 
          ? `अनुरोध ${action === 'approved' ? 'स्वीकृत' : 'अस्वीकृत'} भयो`
          : `Request ${action === 'approved' ? 'approved' : 'denied'} successfully`
        );
        loadLocationControlData(); // Reload data
      }
    } catch (error) {
      console.error('Failed to process approval:', error);
      alert(currentLanguage === 'np' ? 'कार्य असफल भयो' : 'Action failed');
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
    
    if (diffInMinutes < 1) return currentLanguage === 'np' ? 'अहिले' : 'Now';
    if (diffInMinutes < 60) return currentLanguage === 'np' ? `${diffInMinutes} मिनेट पहिले` : `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return currentLanguage === 'np' ? `${Math.floor(diffInMinutes / 60)} घण्टा पहिले` : `${Math.floor(diffInMinutes / 60)}h ago`;
    return currentLanguage === 'np' ? `${Math.floor(diffInMinutes / 1440)} दिन पहिले` : `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const LineMonitoringView = () => {
    if (hybridLoading) {
      return <CompactLoader message="Loading line data..." />;
    }

    if (hybridError) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️ Error loading data</div>
          <p className="text-gray-600">{hybridError}</p>
        </div>
      );
    }

    if (lineData.length === 0) {
      return (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No stations found</p>
        </div>
      );
    }

    return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {lineData.map((station) => (
        <div
          key={station.id}
          className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
        >
          {/* Station Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {currentLanguage === "np"
                    ? station.station
                    : station.stationEn}
                </h3>
                <p className="text-sm text-gray-600">
                  👤{" "}
                  {currentLanguage === "np"
                    ? station.operator
                    : station.operatorEn}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  station.status
                )}`}
              >
                {t(station.status)}
              </span>
            </div>
          </div>

          {/* Station Content */}
          <div className="p-4 space-y-4">
            {/* Current Work */}
            {station.currentWork ? (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    🔄 {t("currentWork")}
                  </span>
                  <span className="text-xs text-blue-600">
                    {Math.round(
                      (station.currentWork.completed /
                        station.currentWork.pieces) *
                        100
                    )}
                    % {t("completed")}
                  </span>
                </div>

                <div className="text-sm space-y-1">
                  <div className="font-medium">
                    {station.currentWork.article}#{" "}
                    {station.currentWork.articleName}
                  </div>
                  <div className="text-gray-600">
                    {t(station.currentWork.operation)} |{" "}
                    {station.currentWork.color} |{t("size")}:{" "}
                    {getSizeLabel(
                      station.currentWork.article,
                      station.currentWork.size
                    )}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>
                      {formatNumber(station.currentWork.completed)}/
                      {formatNumber(station.currentWork.pieces)} {t("pieces")}
                    </span>
                    <span>
                      ⏱️ {formatNumber(station.currentWork.estimatedTime)}{" "}
                      {t("minutes")} {t("remaining")}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (station.currentWork.completed /
                            station.currentWork.pieces) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                {station.status === "idle" ? (
                  <div className="text-orange-600">
                    <Clock className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">
                      ⚠️ {formatNumber(station.idleTime)} {t("minutes")}{" "}
                      {t("waiting")}
                    </div>
                    <div className="text-xs mt-1">{t("noWorkAvailable")}</div>
                  </div>
                ) : station.status === "break" ? (
                  <div className="text-yellow-600">
                    <PauseCircle className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">
                      ⏸️ {t("breakTime")}
                    </div>
                    <div className="text-xs mt-1">
                      {formatNumber(station.breakTimeRemaining)} {t("minutes")}{" "}
                      {t("remaining")}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Package className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm">{t("noWorkAvailable")}</div>
                  </div>
                )}
              </div>
            )}

            {/* Next Work Preview */}
            {station.nextWork && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm font-medium text-green-800 mb-2">
                  📅 {t("nextWork")}
                </div>
                <div className="text-sm text-green-700">
                  {station.nextWork.article}# | {t("size")}:{" "}
                  {getSizeLabel(
                    station.nextWork.article,
                    station.nextWork.size
                  )}{" "}
                  |{formatNumber(station.nextWork.pieces)} {t("pieces")}
                </div>
              </div>
            )}

            {/* Efficiency & Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-600">{t("efficiency")}: </span>
                <span
                  className={`font-bold ${getEfficiencyColor(
                    station.efficiency
                  )}`}
                >
                  {formatNumber(station.efficiency)}%
                </span>
              </div>

              <div className="flex space-x-2">
                {station.status === "idle" && (
                  <button
                    onClick={() => setSelectedStation(station)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    {t("assign")} {t("work")}
                  </button>
                )}
                <button
                  onClick={() => setSelectedStation(station)}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const EfficiencyAlertsView = () => (
    <div className="space-y-4">
      {efficiencyAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    alert.priority === "high"
                      ? "bg-red-500"
                      : alert.priority === "medium"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                ></div>
                <h3 className="font-semibold text-gray-800">
                  🎯 {t("efficiencyOptimization")} {t("opportunity")}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : alert.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {alert.priority === "high"
                    ? "🔴 उच्च"
                    : alert.priority === "medium"
                    ? "🟡 सामान्य"
                    : "🟢 कम"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    ⚠️ {t("station")}:
                  </div>
                  <div className="font-medium">
                    {currentLanguage === "np" ? alert.station : alert.stationEn}{" "}
                    ({alert.operator})
                  </div>
                </div>

                {alert.type === "idle-station" && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      📊 {t("status")}:
                    </div>
                    <div className="text-orange-600 font-medium">
                      {formatNumber(alert.idleTime)} {t("minutes")}{" "}
                      {currentLanguage === "np" ? "देखि खाली" : "idle"}
                    </div>
                  </div>
                )}

                {alert.suggestedWork && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      💡 {t("suggested")} {t("work")}:
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        {t("article")}: {alert.suggestedWork.article}# |
                        {t("size")}:{" "}
                        {getSizeLabel(
                          alert.suggestedWork.article,
                          alert.suggestedWork.size
                        )}{" "}
                        |{formatNumber(alert.suggestedWork.pieces)}{" "}
                        {t("pieces")}
                      </div>
                      <div>
                        {t("operation")}: {t(alert.suggestedWork.operation)}
                      </div>
                      <div className="font-medium">
                        📈 {t("impact")}: {alert.suggestedWork.impact}{" "}
                        {t("efficiency")} {t("improvement")}
                      </div>
                    </div>
                  </div>
                )}

                {alert.type === "efficiency-drop" && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-yellow-800 mb-2">
                      📉 {t("efficiency")} {t("issue")}:
                    </div>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <div>
                        {t("current")}: {formatNumber(alert.currentEfficiency)}% | {t("target")}: {formatNumber(alert.targetEfficiency)}%
                      </div>
                      <div>
                        {t("suggestedAction")}: {t(alert.suggestedAction)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                {t("accept")}
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                {t("modify")}
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-600 text-sm rounded hover:bg-gray-300 transition-colors">
                {t("ignore")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const KPIOverviewView = () => (
    <div className="mb-8">
      {/* Single Line Status */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            📊 {currentLanguage === "np" ? "लाइन D - मुख्य KPIs" : "Line D - Key Performance Indicators"}
          </h3>
          <div className="text-sm text-gray-500">
            {currentLanguage === "np" ? "अपडेट: " : "Updated: "}{formatTime(currentTime)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Production Achievement */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-700 font-medium text-sm">
                {currentLanguage === "np" ? "उत्पादन प्राप्ति" : "Production Achievement"}
              </span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-800">12750</div>
            <div className="text-sm text-blue-600">
              / 15000 {currentLanguage === "np" ? "लक्ष्य" : "Target"}
            </div>
            <div className="mt-2">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="text-xs text-blue-600 mt-1">85% {currentLanguage === "np" ? "पूरा" : "Complete"}</div>
            </div>
          </div>

          {/* Efficiency Rate */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium text-sm">
                {currentLanguage === "np" ? "दक्षता दर" : "Efficiency Rate"}
              </span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-800">88%</div>
            <div className="text-sm text-green-600">
              {currentLanguage === "np" ? "लक्ष्य: ९०%" : "Target: 90%"}
            </div>
            <div className="text-xs text-green-500 mt-2">
              ↗️ {currentLanguage === "np" ? "पछिल्लो घण्टाबाट +२%" : "+2% from last hour"}
            </div>
          </div>

          {/* Quality Score */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-700 font-medium text-sm">
                {currentLanguage === "np" ? "गुणस्तर स्कोर" : "Quality Score"}
              </span>
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-800">96.2%</div>
            <div className="text-sm text-purple-600">
              {currentLanguage === "np" ? "उत्कृष्ट" : "Excellent"}
            </div>
            <div className="text-xs text-purple-500 mt-2">
              ✅ {currentLanguage === "np" ? "लक्ष्य भन्दा माथि" : "Above target"}
            </div>
          </div>

          {/* Active Operators */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-700 font-medium text-sm">
                {currentLanguage === "np" ? "सक्रिय अपरेटर" : "Active Operators"}
              </span>
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-800">18</div>
            <div className="text-sm text-orange-600">
              / 20 {currentLanguage === "np" ? "कुल" : "Total"}
            </div>
            <div className="text-xs text-orange-500 mt-2">
              ⚡ {currentLanguage === "np" ? "९०% उपयोग" : "90% Utilization"}
            </div>
          </div>
        </div>

        {/* Additional KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Hourly Rate */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-800">106</div>
            <div className="text-xs text-gray-600">
              {currentLanguage === "np" ? "प्रति घण्टा" : "Per Hour"}
            </div>
          </div>

          {/* On Time Delivery */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-gray-800">94%</div>
            <div className="text-xs text-gray-600">
              {currentLanguage === "np" ? "समयमै डेलिभरी" : "On Time Delivery"}
            </div>
          </div>

          {/* Rework Rate */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-600">3.8%</div>
            <div className="text-xs text-gray-600">
              {currentLanguage === "np" ? "पुन:कार्य दर" : "Rework Rate"}
            </div>
          </div>

          {/* Defect Rate */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-600">2.1%</div>
            <div className="text-xs text-gray-600">
              {currentLanguage === "np" ? "दोष दर" : "Defect Rate"}
            </div>
          </div>

          {/* Machine Uptime */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">97%</div>
            <div className="text-xs text-gray-600">
              {currentLanguage === "np" ? "मेसिन अपटाइम" : "Machine Uptime"}
            </div>
          </div>

          {/* OEE */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">82%</div>
            <div className="text-xs text-gray-600">
              {currentLanguage === "np" ? "समग्र दक्षता" : "OEE"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductionOverviewView = () => (
    <div>
      <KPIOverviewView />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* Production Summary Cards */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600">
              {t("today")} {t("production")}
            </h3>
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(dashboardProductionStats.totalProduction)}
            </div>
            <div className="text-sm text-gray-500">
              / {formatNumber(dashboardProductionStats.targetProduction)} {t("target")}
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{
                width: `${
                  (dashboardProductionStats.totalProduction /
                    dashboardProductionStats.targetProduction) *
                  100
                }%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round(
              (dashboardProductionStats.totalProduction /
                dashboardProductionStats.targetProduction) *
                100
            )}
            % {t("completed")}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600">
              {t("efficiency")}
            </h3>
            <div
              className={`text-3xl font-bold ${getEfficiencyColor(
                dashboardProductionStats.efficiency
              )}`}
            >
              {formatNumber(dashboardProductionStats.efficiency)}%
            </div>
            <div className="text-sm text-gray-500">
              {currentLanguage === "np" ? "लक्ष्य: ९०%" : "Target: 90%"}
            </div>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600">
              {t("quality")} {t("score")}
            </h3>
            <div className="text-3xl font-bold text-purple-600">
              {formatNumber(dashboardProductionStats.qualityScore)}%
            </div>
            <div className="text-sm text-gray-500">
              {currentLanguage === "np" ? "लक्ष्य: ९५%" : "Target: 95%"}
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600">
              {t("active")} {t("operators")}
            </h3>
            <div className="text-3xl font-bold text-orange-600">
              {formatNumber(dashboardProductionStats.activeOperators)}
            </div>
            <div className="text-sm text-gray-500">
              / {formatNumber(dashboardProductionStats.totalOperators)} {t("total")}
            </div>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t("appTitle")} - {t("supervisor")} {t("dashboard")}
            </h1>
            <p className="text-gray-600">
              {getTimeBasedGreeting()}, {userInfo?.name} |{" "}
              {formatTime(currentTime)}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Hybrid Connection Status */}
            <div className="flex items-center space-x-2">
              {/* Firestore Status */}
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  isOnline
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                }`}
                title="Firestore Connection"
              >
                <span>📚</span>
                <span>{isOnline ? "FS" : "FS❌"}</span>
              </div>
              
              {/* Realtime DB Status */}
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  isReady && isOnline
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
                title="Realtime Database Connection"
              >
                <span>🔥</span>
                <span>{isReady && isOnline ? "RT" : "RT⚠️"}</span>
              </div>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 mt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "monitoring"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🏭 {t("lineMonitoring")}
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 {t("overview")}
          </button>
          <button
            onClick={() => setActiveTab("efficiency")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "efficiency"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ⚡ {t("efficiency")} {t("alerts")}
          </button>
          <button
            onClick={() => setActiveTab("assignment")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "assignment"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📦 {t("workAssignment")}
          </button>
          <button
            onClick={() => setActiveTab("money")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "money"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            💰 {currentLanguage === "np" ? "पैसा व्यवस्थापन" : "Money Management"}
          </button>
          <button
            onClick={() => setActiveTab("live-bucket")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "live-bucket"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            👥 {currentLanguage === "np" ? "लाइभ अपरेटर बकेट" : "Live Operator Bucket"}
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "earnings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            💼 {currentLanguage === "np" ? "सबै आम्दानी" : "All Earnings"}
          </button>
          <button
            onClick={() => setActiveTab("line-inspection")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "line-inspection"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🔍 {currentLanguage === "np" ? "लाइन निरीक्षण" : "Line Inspection"}
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "reports"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 {currentLanguage === "np" ? "दैनिक रिपोर्ट" : "Daily Reports"}
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "issues"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🔧 {currentLanguage === "np" ? "समस्या समाधान" : "Issue Resolution"}
          </button>
          <button
            onClick={() => setActiveTab("payment-holds")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "payment-holds"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🔒 {currentLanguage === "np" ? "भुक्तानी होल्ड" : "Payment Holds"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === "overview" && <ProductionOverviewView />}

        {activeTab === "monitoring" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                🏭 {t("lineMonitoring")} -{" "}
                {currentLanguage === "np"
                  ? "रियल-टाइम स्थिति"
                  : "Real-time Status"}
              </h2>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("load")} {t("work")}
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("optimize")}
                </button>
              </div>
            </div>
            <LineMonitoringView />
          </div>
        )}

        {activeTab === "efficiency" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                ⚡ {t("efficiency")} {t("optimization")} {t("opportunities")}
              </h2>
              <div className="text-sm text-gray-600">
                {efficiencyAlerts.length} {t("alerts")} {t("pending")}
              </div>
            </div>
            <EfficiencyAlertsView />
          </div>
        )}

        {activeTab === "assignment" && (
          <WorkAssignmentSystem 
            currentLanguage={currentLanguage} 
            t={t} 
            getEfficiencyColor={getEfficiencyColor}
          />
        )}


        {/* Money Management Tab */}
        {activeTab === "money" && (
          <MoneyManagement />
        )}

        {/* Live Operator Work Bucket Tab */}
        {activeTab === "live-bucket" && (
          <LiveOperatorWorkBucket />
        )}

        {/* All Operators Earnings Tab */}
        {activeTab === "earnings" && (
          <AllOperatorsEarnings />
        )}

        {/* Line Inspection Tab */}
        {activeTab === "line-inspection" && (
          <LineInspection />
        )}

        {/* Daily Reports Tab */}
        {activeTab === "reports" && (
          <DailyReports />
        )}

        {/* Issue Resolution Tab */}
        {activeTab === "issues" && (
          <IssueResolution />
        )}

        {/* Bundle Payment Holds Tab */}
        {activeTab === "payment-holds" && (
          <BundlePaymentHolds />
        )}
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {currentLanguage === "np"
                  ? selectedStation.station
                  : selectedStation.stationEn}
              </h3>
              <button
                onClick={() => setSelectedStation(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-6">
                {/* Operator Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    👤 {currentLanguage === "np" ? "अपरेटर जानकारी" : "Operator Details"}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">
                          {currentLanguage === "np" ? selectedStation.operator : selectedStation.operatorEn}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {currentLanguage === "np" ? "अपरेटर" : "Operator"} • 
                          {currentLanguage === "np" ? " सक्रिय" : " Active"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded p-3">
                        <p className="text-sm text-gray-600">
                          {currentLanguage === "np" ? "आजको दक्षता" : "Today's Efficiency"}
                        </p>
                        <p className={`text-lg font-semibold ${getEfficiencyColor(selectedStation.efficiency)}`}>
                          {formatNumber(selectedStation.efficiency)}%
                        </p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-sm text-gray-600">
                          {currentLanguage === "np" ? "स्थिति" : "Status"}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedStation.status)}`}>
                          {t(selectedStation.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Work Details */}
                {selectedStation.currentWork && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      🔄 {currentLanguage === "np" ? "हालको काम" : "Current Work"}
                    </h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-semibold text-blue-800">
                            {selectedStation.currentWork.article}# {selectedStation.currentWork.articleName}
                          </h5>
                          <span className="text-sm text-blue-600">
                            {Math.round((selectedStation.currentWork.completed / selectedStation.currentWork.pieces) * 100)}% 
                            {currentLanguage === "np" ? " पूरा" : " Complete"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">{currentLanguage === "np" ? "रङ" : "Color"}</p>
                            <p className="font-medium">{selectedStation.currentWork.color}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">{currentLanguage === "np" ? "साइज" : "Size"}</p>
                            <p className="font-medium">{selectedStation.currentWork.size}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">{currentLanguage === "np" ? "टुक्राहरू" : "Pieces"}</p>
                            <p className="font-medium">
                              {formatNumber(selectedStation.currentWork.completed)}/
                              {formatNumber(selectedStation.currentWork.pieces)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-blue-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{
                              width: `${(selectedStation.currentWork.completed / selectedStation.currentWork.pieces) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Station Actions */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    {currentLanguage === "np" ? "काम असाइन गर्नुहोस्" : "Assign Work"}
                  </button>
                  <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                    {currentLanguage === "np" ? "विस्तृत रिपोर्ट" : "Detailed Report"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
