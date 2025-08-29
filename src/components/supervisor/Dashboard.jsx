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
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { 
  useHybridDashboard,
  useOperatorStatus,
  useLiveMetrics,
  useConnectionStatus
} from "../../hooks/useRealtimeData";
import { CompactLoader } from "../common/BrandedLoader";

const SupervisorDashboard = () => {
  const { getUserDisplayInfo, isOnline } = useAuth();
  const {
    t,
    currentLanguage,
    formatTime,
    formatNumber,
    getSizeLabel,
  } = useLanguage();

  const [activeTab, setActiveTab] = useState("monitoring");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStation, setSelectedStation] = useState(null);

  const userInfo = getUserDisplayInfo();

  // Use hybrid real-time data approach
  const {
    dashboardData,
    loading: hybridLoading,
    error: hybridError,
    lastUpdated
  } = useHybridDashboard();

  // Real-time operator status
  const { operatorStatuses, connected: rtdbConnected } = useOperatorStatus();

  // Live production metrics
  const { metrics: liveMetrics } = useLiveMetrics();

  // Connection monitoring
  const { isConnected: realtimeConnected, connectionStats } = useConnectionStatus();

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Process hybrid data into component-ready format
  const { lineData, productionStats, efficiencyAlerts } = React.useMemo(() => {
    const { operatorProfiles, operatorStatuses, liveMetrics, stationStatuses } = dashboardData;
    
    // Merge static profiles with real-time status
    const processedLineData = operatorProfiles.map(operator => {
      const liveStatus = operatorStatuses[operator.id] || {};
      const stationKey = `${operator.machineType}-${operator.station || '1'}`;
      
      return {
        id: stationKey,
        station: operator.machineType === 'overlock' ? 'ओभरलक स्टेसन' :
               operator.machineType === 'flatlock' ? 'फ्ल्यालक स्टेसन' :
               operator.machineType === 'single-needle' ? 'एकल सुई स्टेसन' :
               operator.machineType,
        stationEn: operator.machineType === 'overlock' ? 'Overlock Station' :
                  operator.machineType === 'flatlock' ? 'Flatlock Station' :
                  operator.machineType === 'single-needle' ? 'Single Needle Station' :
                  operator.machineType,
        operator: operator.name,
        operatorEn: operator.nameEn || operator.name,
        status: liveStatus.status || (operator.active ? 'active' : 'idle'),
        efficiency: liveStatus.efficiency || operator.efficiency || 0,
        currentWork: liveStatus.currentWork || null,
        nextWork: null
      };
    });

    // Use live metrics if available, otherwise calculate from static data
    const stats = {
      totalProduction: liveMetrics.totalProduction || 0,
      targetProduction: liveMetrics.targetProduction || 5000,
      efficiency: liveMetrics.averageEfficiency || 0,
      qualityScore: liveMetrics.qualityScore || 95,
      activeOperators: liveMetrics.activeOperators || operatorProfiles.filter(op => op.active).length,
      totalOperators: operatorProfiles.length,
      completedBundles: liveMetrics.completedBundles || 0,
      pendingBundles: 0
    };

    // Generate efficiency alerts from real-time data
    const alerts = [];
    let alertId = 1;
    
    Object.values(operatorStatuses).forEach(status => {
      if (status.status === 'idle' && !status.currentWork) {
        const operator = operatorProfiles.find(op => op.id === status.id);
        if (operator) {
          alerts.push({
            id: alertId++,
            type: 'idle-station',
            station: operator.machineType,
            stationEn: operator.machineType,
            operator: operator.name,
            idleTime: 15,
            priority: 'high'
          });
        }
      }
    });

    return {
      lineData: processedLineData,
      productionStats: stats,
      efficiencyAlerts: alerts
    };
  }, [dashboardData, operatorStatuses, liveMetrics]);

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
              {formatNumber(productionStats.totalProduction)}
            </div>
            <div className="text-sm text-gray-500">
              / {formatNumber(productionStats.targetProduction)} {t("target")}
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
                  (productionStats.totalProduction /
                    productionStats.targetProduction) *
                  100
                }%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round(
              (productionStats.totalProduction /
                productionStats.targetProduction) *
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
                productionStats.efficiency
              )}`}
            >
              {formatNumber(productionStats.efficiency)}%
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
              {formatNumber(productionStats.qualityScore)}%
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
              {formatNumber(productionStats.activeOperators)}
            </div>
            <div className="text-sm text-gray-500">
              / {formatNumber(productionStats.totalOperators)} {t("total")}
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
                  realtimeConnected && rtdbConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
                title="Realtime Database Connection"
              >
                <span>🔥</span>
                <span>{realtimeConnected && rtdbConnected ? "RT" : "RT⚠️"}</span>
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
        <div className="flex space-x-6 mt-4">
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "monitoring"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🏭 {t("lineMonitoring")}
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 {t("overview")}
          </button>
          <button
            onClick={() => setActiveTab("efficiency")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "efficiency"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ⚡ {t("efficiency")} {t("alerts")}
          </button>
          <button
            onClick={() => setActiveTab("assignment")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "assignment"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📦 {t("workAssignment")}
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

export default SupervisorDashboard;
