import React, { useState, useEffect } from "react";
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

  // Use centralized data hooks
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

  // Process centralized data into component-ready format
  const { lineData, efficiencyAlerts, dashboardProductionStats } = React.useMemo(() => {
    if (!allUsers || !isReady) {
      return { 
        lineData: [], 
        efficiencyAlerts: [],
        dashboardProductionStats: {
          totalProduction: 0,
          targetProduction: 5000,
          efficiency: 0,
          qualityScore: 95,
          activeOperators: 0,
          totalOperators: 0
        }
      };
    }
    
    // Create line data from centralized users data
    const operators = allUsers.filter(user => user.role === 'operator');
    const processedLineData = operators.map(operator => {
      const stationKey = `${operator.machineType || 'general'}-${operator.station || '1'}`;
      
      return {
        id: stationKey,
        station: operator.machineType === 'overlock' ? 'ओभरलक स्टेसन' :
               operator.machineType === 'flatlock' ? 'फ्ल्यालक स्टेसन' :
               operator.machineType === 'single-needle' ? 'एकल सुई स्टेसन' :
               operator.machineType || 'सामान्य स्टेसन',
        stationEn: operator.machineType === 'overlock' ? 'Overlock Station' :
                  operator.machineType === 'flatlock' ? 'Flatlock Station' :
                  operator.machineType === 'single-needle' ? 'Single Needle Station' :
                  operator.machineType || 'General Station',
        operator: operator.name,
        operatorEn: operator.nameEn || operator.name,
        status: operator.isActive ? 'active' : 'idle',
        efficiency: operator.efficiency || 0,
        currentWork: null, // Will be populated from work assignments
        nextWork: null
      };
    });

    // Generate efficiency alerts for low-performing operators
    const alerts = [];
    let alertId = 1;
    
    if (analytics?.operatorEfficiency) {
      analytics.operatorEfficiency.forEach(operatorStat => {
        if (operatorStat.completionRate < 80) { // Alert for operators below 80% completion rate
          alerts.push({
            id: alertId++,
            type: 'low-efficiency',
            station: operatorStat.operatorName,
            stationEn: operatorStat.operatorName,
            operator: operatorStat.operatorName,
            efficiency: operatorStat.completionRate,
            priority: operatorStat.completionRate < 60 ? 'high' : 'medium'
          });
        }
      });
    }

    // Create production stats from centralized data
    const dashboardProductionStatsData = {
      totalProduction: stats?.todayPieces || 0,
      targetProduction: 5000, // Could be from settings
      efficiency: stats?.efficiency || 0,
      qualityScore: 95, // Could be calculated from quality issues
      activeOperators: stats?.activeOperators || 0,
      totalOperators: stats?.totalOperators || operators.length
    };

    return {
      lineData: processedLineData,
      efficiencyAlerts: alerts,
      dashboardProductionStats: dashboardProductionStatsData
    };
  }, [allUsers, analytics, stats, isReady]);

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

  const ProductionOverviewView = () => (
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
            onClick={() => setActiveTab("location")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap relative ${
              activeTab === "location"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📍 {currentLanguage === "np" ? "स्थान" : "Location"}
            {pendingApprovals.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("loginControl")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "loginControl"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🔐 {currentLanguage === "np" ? "लगइन नियन्त्रण" : "Login Control"}
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
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              📦 {t("workAssignment")} & {t("lineBalancing")}
            </h2>
            <div className="text-center text-gray-600 py-8">
              {currentLanguage === "np"
                ? "काम असाइनमेन्ट मोड्युल निर्माणाधीन..."
                : "Work assignment module under construction..."}
            </div>
          </div>
        )}

        {/* Location Management Tab */}
        {activeTab === "location" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                📍 {currentLanguage === "np" ? "स्थान व्यवस्थापन" : "Location Management"}
              </h2>
              <button
                onClick={loadLocationControlData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{currentLanguage === "np" ? "रिफ्रेस" : "Refresh"}</span>
              </button>
            </div>

            {/* Statistics Cards */}
            {locationStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-blue-100 text-sm font-medium">
                        {currentLanguage === "np" ? "कुल पहुँच प्रयास" : "Total Access Attempts"}
                      </h3>
                      <p className="text-2xl font-bold mt-1">{locationStats.totalAttempts || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-green-100 text-sm font-medium">
                        {currentLanguage === "np" ? "वैध पहुँच" : "Valid Access"}
                      </h3>
                      <p className="text-2xl font-bold mt-1">{locationStats.validAttempts || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-red-100 text-sm font-medium">
                        {currentLanguage === "np" ? "अवैध पहुँच" : "Invalid Access"}
                      </h3>
                      <p className="text-2xl font-bold mt-1">{locationStats.invalidAttempts || 0}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-purple-100 text-sm font-medium">
                        {currentLanguage === "np" ? "औसत दूरी" : "Average Distance"}
                      </h3>
                      <p className="text-2xl font-bold mt-1">{formatDistance(locationStats.averageDistance || 0)}</p>
                    </div>
                    <MapPin className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              </div>
            )}

            {/* Pending Approvals */}
            <div className="bg-white rounded-lg shadow-md border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {currentLanguage === "np" ? "पेन्डिङ अनुमोदन" : "Pending Approvals"}
                </h3>
                <span className="text-sm text-gray-500">
                  {pendingApprovals.length} {currentLanguage === "np" ? "अनुरोध" : "requests"}
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {currentLanguage === "np" ? "कुनै पेन्डिङ अनुमोदन छैन" : "No pending approvals"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.slice(0, 5).map((approval) => (
                    <div key={approval.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{approval.userName}</h4>
                              <p className="text-sm text-gray-600">{approval.userRole}</p>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              {currentLanguage === "np" ? "पेन्डिङ" : "PENDING"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-600">
                                {currentLanguage === "np" ? "फ्याक्ट्रीबाट दूरी" : "Distance from Factory"}
                              </p>
                              <p className="font-semibold text-red-600">
                                {formatDistance(approval.validation?.distance || 0)}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-600">
                                {currentLanguage === "np" ? "अनुरोध समय" : "Request Time"}
                              </p>
                              <p className="font-semibold text-gray-800">
                                {formatTimeAgo(approval.requestedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded p-2 mb-3">
                            <p className="text-sm text-blue-800">
                              <strong>{currentLanguage === "np" ? "कारण:" : "Reason:"}</strong> {approval.reason}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprovalAction(approval.id, 'denied', 'Supervisor denied remote access')}
                          className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
                          {currentLanguage === "np" ? "अस्वीकार" : "Deny"}
                        </button>
                        <button
                          onClick={() => handleApprovalAction(approval.id, 'approved', 'Supervisor approved remote access for 8 hours')}
                          className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          {currentLanguage === "np" ? "स्वीकृत" : "Approve"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location Alerts */}
            <div className="bg-white rounded-lg shadow-md border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {currentLanguage === "np" ? "स्थान अलर्ट" : "Location Alerts"}
                </h3>
                <span className="text-sm text-gray-500">
                  {locationAlerts.filter(alert => alert.status === 'unread').length} {currentLanguage === "np" ? "नयाँ" : "new"}
                </span>
              </div>

              {locationAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {currentLanguage === "np" ? "कुनै अलर्ट छैन" : "No alerts"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {locationAlerts.slice(0, 10).map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-3 ${alert.status === 'unread' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                            {alert.status === 'unread' && (
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm mb-1">{alert.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{alert.userName} ({alert.userRole})</span>
                            <span>•</span>
                            <span>{formatDistance(alert.distance)} {currentLanguage === "np" ? "दूरी" : "away"}</span>
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
          </div>
        )}

        {/* Login Control Tab */}
        {activeTab === "loginControl" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  🔐 {currentLanguage === "np" ? "लगइन नियन्त्रण प्रणाली" : "Login Control System"}
                </h2>
                <p className="text-gray-600">
                  {currentLanguage === "np" 
                    ? "समय र स्थान आधारित लगइन नियन्त्रण प्रबन्धन गर्नुहोस्"
                    : "Manage time-based and location-based login controls"}
                </p>
              </div>
              <button
                onClick={handleSaveLoginControls}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? (currentLanguage === "np" ? "सेभ गर्दै..." : "Saving...") : (currentLanguage === "np" ? "सेभ" : "Save")}
              </button>
            </div>

            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "np" ? "वर्तमान समय" : "Current Time"}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTime(currentTime)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(currentTime)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "np" ? "स्थान नियन्त्रण" : "Location Control"}
                    </p>
                    <p className={`text-lg font-semibold ${loginControlSettings.locationControl.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {loginControlSettings.locationControl.enabled 
                        ? (currentLanguage === "np" ? "सक्रिय" : "Active")
                        : (currentLanguage === "np" ? "निष्क्रिय" : "Inactive")
                      }
                    </p>
                  </div>
                  <MapPin className={`w-8 h-8 ${loginControlSettings.locationControl.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "np" ? "समय नियन्त्रण" : "Time Control"}
                    </p>
                    <p className={`text-lg font-semibold ${loginControlSettings.timeControl.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {loginControlSettings.timeControl.enabled 
                        ? (currentLanguage === "np" ? "सक्रिय" : "Active")
                        : (currentLanguage === "np" ? "निष्क्रिय" : "Inactive")
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {loginControlSettings.timeControl.allowedShifts.filter(s => s.active).length} {currentLanguage === "np" ? "सक्रिय शिफ्ट" : "active shifts"}
                    </p>
                  </div>
                  <Clock className={`w-8 h-8 ${loginControlSettings.timeControl.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "np" ? "प्रणाली स्थिति" : "System Status"}
                    </p>
                    <p className={`text-lg font-semibold ${
                      loginControlSettings.emergencyAccess.enabled ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {loginControlSettings.emergencyAccess.enabled 
                        ? (currentLanguage === "np" ? "आपातकालीन" : "Emergency")
                        : (currentLanguage === "np" ? "सामान्य" : "Normal")
                      }
                    </p>
                  </div>
                  <Shield className={`w-8 h-8 ${
                    loginControlSettings.emergencyAccess.enabled ? 'text-red-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
            </div>

            {/* Quick Control Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {currentLanguage === "np" ? "स्थान नियन्त्रण" : "Location Control"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "np" ? "GPS आधारित लगइन प्रतिबन्ध" : "GPS-based login restrictions"}
                    </p>
                  </div>
                  <button
                    onClick={toggleLocationControl}
                    className="flex items-center"
                  >
                    {loginControlSettings.locationControl.enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {currentLanguage === "np" ? "समय नियन्त्रण" : "Time Control"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "np" ? "काम को समय आधारित प्रतिबन्ध" : "Working hours-based restrictions"}
                    </p>
                  </div>
                  <button
                    onClick={toggleTimeControl}
                    className="flex items-center"
                  >
                    {loginControlSettings.timeControl.enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Shift Management */}
            {loginControlSettings.timeControl.enabled && (
              <div className="bg-white border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">
                  {currentLanguage === "np" ? "शिफ्ट व्यवस्थापन" : "Shift Management"}
                </h4>
                <div className="space-y-3">
                  {loginControlSettings.timeControl.allowedShifts.map(shift => (
                    <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
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
            )}

            {/* Emergency Access Control */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-yellow-800">
                  {currentLanguage === "np" ? "आपातकालीन पहुँच" : "Emergency Access"}
                </h4>
                <span className={`px-2 py-1 text-xs rounded ${
                  loginControlSettings.emergencyAccess.enabled 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {loginControlSettings.emergencyAccess.enabled 
                    ? (currentLanguage === "np" ? "सक्रिय" : "Active")
                    : (currentLanguage === "np" ? "निष्क्रिय" : "Inactive")
                  }
                </span>
              </div>

              {!loginControlSettings.emergencyAccess.enabled ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === "np" ? "कारण" : "Reason"}
                    </label>
                    <input
                      type="text"
                      value={emergencyReason}
                      onChange={(e) => setEmergencyReason(e.target.value)}
                      placeholder={currentLanguage === "np" ? "आपातकालीन पहुँच को कारण..." : "Reason for emergency access..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {currentLanguage === "np" ? "अवधि (घण्टा)" : "Duration (hours)"}
                    </label>
                    <select
                      value={emergencyDuration}
                      onChange={(e) => setEmergencyDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1 {currentLanguage === "np" ? "घण्टा" : "hour"}</option>
                      <option value={2}>2 {currentLanguage === "np" ? "घण्टा" : "hours"}</option>
                      <option value={4}>4 {currentLanguage === "np" ? "घण्टा" : "hours"}</option>
                      <option value={8}>8 {currentLanguage === "np" ? "घण्टा" : "hours"}</option>
                    </select>
                  </div>

                  <button
                    onClick={enableEmergencyAccess}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {currentLanguage === "np" ? "आपातकालीन पहुँच सक्षम गर्नुहोस्" : "Enable Emergency Access"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-yellow-200 rounded p-3">
                    <p className="font-medium text-gray-900">
                      {currentLanguage === "np" ? "कारण:" : "Reason:"} {loginControlSettings.emergencyAccess.reason}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "np" ? "सम्म मान्य:" : "Valid until:"} {new Date(loginControlSettings.emergencyAccess.validUntil).toLocaleString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={disableEmergencyAccess}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    {currentLanguage === "np" ? "आपातकालीन पहुँच निष्क्रिय गर्नुहोस्" : "Disable Emergency Access"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Money Management Tab */}
        {activeTab === "money" && (
          <MoneyManagement />
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
              <div className="text-center text-gray-600 py-8">
                {currentLanguage === "np"
                  ? "स्टेसन विवरण लोड हुँदै..."
                  : "Station details loading..."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
