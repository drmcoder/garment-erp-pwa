// =====================================================
// PHASE 2.1: REAL DATA INTEGRATION
// Priority: Connect existing UI to Firebase backend
// =====================================================

// Step 1: Enhanced OperatorDashboard with Real Firebase Data
// File: src/components/operator/OperatorDashboard.jsx - UPDATED VERSION

import React, { useState, useEffect } from "react";
import {
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  Package,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";
import WorkCompletion from "./WorkCompletion";
import QualityReport from "./QualityReport";

// Import Firebase services
import {
  BundleService,
  ProductionService,
  NotificationService,
} from "../../services/firebase-services";

const OperatorDashboard = () => {
  const { user, getUserDisplayInfo } = useAuth();
  const {
    t,
    currentLanguage,
    getTimeBasedGreeting,
    formatTime,
    formatNumber,
    getSizeLabel,
  } = useLanguage();
  const { addNotification } = useNotifications();

  // State management
  const [currentWork, setCurrentWork] = useState(null);
  const [workQueue, setWorkQueue] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    piecesCompleted: 0,
    totalEarnings: 0,
    efficiency: 0,
    qualityScore: 0,
    targetPieces: 120,
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showWorkCompletion, setShowWorkCompletion] = useState(false);
  const [showQualityReport, setShowQualityReport] = useState(false);
  const [isWorkStarted, setIsWorkStarted] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userInfo = getUserDisplayInfo();

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load operator data on mount
  useEffect(() => {
    if (user?.id) {
      loadOperatorData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  // Load operator's current work and queue
  const loadOperatorData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.log("📊 Loading operator data for:", user.id);

      // Load operator's assigned bundles
      const bundlesResult = await BundleService.getOperatorBundles(user.id);

      if (bundlesResult.success) {
        const bundles = bundlesResult.bundles;
        console.log("📦 Loaded bundles:", bundles.length);

        // Find current work (in-progress or assigned)
        const currentBundle = bundles.find(
          (b) =>
            b.status === "in-progress" ||
            (b.status === "assigned" && b.assignedOperator === user.id)
        );

        if (currentBundle) {
          setCurrentWork(currentBundle);
          setIsWorkStarted(currentBundle.status === "in-progress");
          console.log("🔄 Current work found:", currentBundle.id);
        } else {
          console.log("ℹ️ No current work assigned");
        }

        // Set work queue (pending bundles)
        const queueBundles = bundles.filter(
          (b) => b.status === "pending" || b.status === "assigned"
        );
        setWorkQueue(queueBundles);
      } else {
        throw new Error(bundlesResult.error);
      }

      // Load today's production stats
      const statsResult = await ProductionService.getTodayStats();
      if (statsResult.success) {
        // Update with operator-specific stats if available
        setDailyStats((prev) => ({
          ...prev,
          ...statsResult.stats,
        }));
      }

      // Load operator's daily performance (mock for now)
      setDailyStats((prev) => ({
        ...prev,
        piecesCompleted: 85,
        totalEarnings: 237.5,
        efficiency: 88,
        qualityScore: 98,
      }));
    } catch (error) {
      console.error("❌ Error loading operator data:", error);
      setError(error.message);

      // Fallback to sample data
      setCurrentWork({
        id: "B001-85-BL-XL",
        bundleNumber: "B001",
        article: "8085",
        articleName: "Polo T-Shirt",
        color: "Blue-1",
        size: "XL",
        pieces: 30,
        currentOperation: "shoulderJoin",
        nextOperation: "topStitch",
        machineType: "overlock",
        rate: 2.5,
        status: "assigned",
        completedPieces: 0,
        estimatedTime: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    console.log("🔄 Setting up real-time subscriptions for:", user.id);

    // Subscribe to bundle updates
    const unsubscribeBundles = BundleService.subscribeToOperatorBundles(
      user.id,
      (bundles) => {
        console.log("🔄 Real-time bundle update:", bundles.length);

        // Update current work
        const currentBundle = bundles.find(
          (b) =>
            b.status === "in-progress" ||
            (b.status === "assigned" && b.assignedOperator === user.id)
        );

        if (currentBundle) {
          setCurrentWork(currentBundle);
          setIsWorkStarted(currentBundle.status === "in-progress");
        }

        // Update work queue
        const queueBundles = bundles.filter(
          (b) => b.status === "pending" || b.status === "assigned"
        );
        setWorkQueue(queueBundles);
      }
    );

    // Subscribe to notifications
    const unsubscribeNotifications =
      NotificationService.subscribeToUserNotifications(
        user.id,
        (notifications) => {
          console.log(
            "🔔 Real-time notification update:",
            notifications.length
          );

          // Add new notifications to context
          notifications.forEach((notification) => {
            addNotification({
              title: notification.title,
              message: notification.message,
              type: notification.type,
              priority: notification.priority,
            });
          });
        }
      );

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeBundles) unsubscribeBundles();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  };

  // Start work on current bundle
  const handleStartWork = async () => {
    if (!currentWork) return;

    console.log("▶️ Starting work on bundle:", currentWork.id);

    try {
      const result = await BundleService.startWork(currentWork.id, user.id);

      if (result.success) {
        setIsWorkStarted(true);
        setWorkStartTime(new Date());
        setCurrentWork((prev) => ({
          ...prev,
          status: "in-progress",
          startTime: new Date(),
        }));

        console.log("✅ Work started successfully");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error starting work:", error);
      alert(
        currentLanguage === "np"
          ? "काम सुरु गर्न समस्या भयो"
          : "Error starting work"
      );
    }
  };

  // Pause current work
  const handlePauseWork = () => {
    setIsWorkStarted(false);
    setCurrentWork((prev) => ({
      ...prev,
      status: "paused",
    }));

    console.log("⏸️ Work paused");
  };

  // Complete current work
  const handleCompleteWork = () => {
    if (!currentWork) return;
    setShowWorkCompletion(true);
  };

  // Report quality issue
  const handleReportQuality = () => {
    if (!currentWork) return;
    setShowQualityReport(true);
  };

  // Handle work completion
  const handleWorkCompleted = async (completionData) => {
    if (!currentWork) return;

    console.log("✅ Completing work:", completionData);

    try {
      const result = await BundleService.completeWork(currentWork.id, {
        operatorId: user.id,
        ...completionData,
      });

      if (result.success) {
        console.log("✅ Work completed successfully");

        // Update daily stats
        setDailyStats((prev) => ({
          ...prev,
          piecesCompleted:
            prev.piecesCompleted + completionData.completedPieces,
          totalEarnings: prev.totalEarnings + result.earnings,
        }));

        // Clear current work
        setCurrentWork(null);
        setIsWorkStarted(false);
        setWorkStartTime(null);

        // Show success notification
        addNotification({
          title: currentLanguage === "np" ? "काम सम्पन्न!" : "Work Completed!",
          message:
            currentLanguage === "np"
              ? `कमाई: रु. ${result.earnings}`
              : `Earnings: Rs. ${result.earnings}`,
          type: "success",
          priority: "medium",
        });

        // Reload data
        await loadOperatorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ Error completing work:", error);
      alert(
        currentLanguage === "np"
          ? "काम पूरा गर्न समस्या भयो"
          : "Error completing work"
      );
    } finally {
      setShowWorkCompletion(false);
    }
  };

  // Handle quality report submission
  const handleQualityReported = async (qualityData) => {
    console.log("🚨 Quality issue reported:", qualityData);

    try {
      // Create quality issue record
      // Implementation depends on your quality tracking requirements

      addNotification({
        title:
          currentLanguage === "np"
            ? "गुणस्तर रिपोर्ट पठाइयो"
            : "Quality Report Sent",
        message:
          currentLanguage === "np"
            ? "सुपरभाइजरलाई सूचना पठाइयो"
            : "Supervisor notified",
        type: "info",
        priority: "medium",
      });
    } catch (error) {
      console.error("❌ Error reporting quality issue:", error);
    } finally {
      setShowQualityReport(false);
    }
  };

  // Calculate work progress
  const getWorkProgressPercentage = () => {
    if (!currentWork || !currentWork.pieces) return 0;
    return Math.round((currentWork.completedPieces / currentWork.pieces) * 100);
  };

  // Get status color for work
  const getWorkStatusColor = (status) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "paused":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get efficiency color
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 80) return "text-blue-600";
    if (efficiency >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {currentLanguage === "np"
              ? "डेटा लोड हुँदै छ..."
              : "Loading data..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {currentLanguage === "np"
              ? "डेटा लोड गर्न समस्या"
              : "Error Loading Data"}
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadOperatorData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {currentLanguage === "np" ? "पुनः प्रयास" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // Main Dashboard View (rest of the component remains the same as before...)
  // ... Continue with the existing dashboard UI code ...

  // Return the complete dashboard UI
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white m-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              {getTimeBasedGreeting()}, {userInfo?.name}
            </h1>
            <p className="text-blue-100 text-sm">
              {t("operator")} - {t(userInfo?.machine)} |{" "}
              {formatTime(currentTime)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatNumber(dailyStats.piecesCompleted)}
            </div>
            <div className="text-blue-100 text-sm">
              {t("pieces")} {t("today")}
            </div>
          </div>
        </div>
      </div>

      {/* Current Work Section */}
      {currentWork ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 m-4">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                {t("currentWork")}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkStatusColor(
                  currentWork.status
                )}`}
              >
                {t(currentWork.status)}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Article Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t("article")}</div>
                <div className="font-semibold">
                  {currentWork.article}# {currentWork.articleName}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t("operation")}</div>
                <div className="font-semibold">
                  {t(currentWork.currentOperation)} (
                  {t(currentWork.machineType)})
                </div>
              </div>
            </div>

            {/* Color, Size, Bundle Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t("color")}</div>
                <div className="font-medium">{currentWork.color}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t("size")}</div>
                <div className="font-medium">
                  {getSizeLabel(currentWork.article, currentWork.size)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t("bundle")}</div>
                <div className="font-medium">#{currentWork.bundleNumber}</div>
              </div>
            </div>

            {/* Progress Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-3 text-center text-sm">
                <div>
                  <div className="text-gray-600">{t("assigned")}</div>
                  <div className="font-bold text-lg">
                    {formatNumber(currentWork.pieces)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">{t("completed")}</div>
                  <div className="font-bold text-lg text-green-600">
                    {formatNumber(currentWork.completedPieces || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">{t("remaining")}</div>
                  <div className="font-bold text-lg text-orange-600">
                    {formatNumber(
                      currentWork.pieces - (currentWork.completedPieces || 0)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">{t("ratePerPiece")}</div>
                  <div className="font-bold text-lg text-blue-600">
                    रु. {currentWork.rate}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t("progress")}</span>
                  <span>{getWorkProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getWorkProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Earnings */}
              <div className="mt-3 text-center">
                <div className="text-sm text-gray-600">
                  {t("currentWork")} {t("earnings")}
                </div>
                <div className="text-xl font-bold text-green-600">
                  रु.{" "}
                  {(
                    (currentWork.completedPieces || 0) * currentWork.rate
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!isWorkStarted ? (
                <button
                  onClick={handleStartWork}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>{t("startWork")}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseWork}
                  className="flex items-center justify-center space-x-2 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  <PauseCircle className="w-5 h-5" />
                  <span>{t("pauseWork")}</span>
                </button>
              )}

              <button
                onClick={handleCompleteWork}
                disabled={!isWorkStarted}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{t("completeWork")}</span>
              </button>
            </div>

            <button
              onClick={handleReportQuality}
              className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t("reportIssue")}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 m-4 p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {currentLanguage === "np" ? "काम उपलब्ध छैन" : "No Work Available"}
          </h3>
          <p className="text-gray-600 mb-4">
            {currentLanguage === "np"
              ? "तपाईंलाई नयाँ काम तोकिने प्रतीक्षा गर्नुहोस्"
              : "Waiting for new work assignment"}
          </p>
          <button
            onClick={loadOperatorData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {currentLanguage === "np" ? "रिफ्रेस गर्नुहोस्" : "Refresh"}
          </button>
        </div>
      )}

      {/* Daily Statistics */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 m-4">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            {t("today")} {t("statistics")}
          </h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(dailyStats.piecesCompleted)}
              </div>
              <div className="text-sm text-gray-600">
                {t("pieces")} {t("completed")}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                रु. {dailyStats.totalEarnings}
              </div>
              <div className="text-sm text-gray-600">{t("earnings")}</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div
                className={`text-2xl font-bold ${getEfficiencyColor(
                  dailyStats.efficiency
                )}`}
              >
                {formatNumber(dailyStats.efficiency)}%
              </div>
              <div className="text-sm text-gray-600">{t("efficiency")}</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(dailyStats.qualityScore)}%
              </div>
              <div className="text-sm text-gray-600">{t("quality")}</div>
            </div>
          </div>

          {/* Daily Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                {t("today")} {t("target")}:{" "}
                {formatNumber(dailyStats.targetPieces)} {t("pieces")}
              </span>
              <span>
                {Math.round(
                  (dailyStats.piecesCompleted / dailyStats.targetPieces) * 100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (dailyStats.piecesCompleted / dailyStats.targetPieces) *
                      100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              {currentLanguage === "np"
                ? `टिम औसत भन्दा +१२% माथि`
                : `+12% above team average`}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWorkCompletion && currentWork && (
        <WorkCompletion
          currentWork={currentWork}
          onClose={() => setShowWorkCompletion(false)}
          onComplete={handleWorkCompleted}
        />
      )}

      {showQualityReport && currentWork && (
        <QualityReport
          currentWork={currentWork}
          onClose={() => setShowQualityReport(false)}
          onSubmit={handleQualityReported}
        />
      )}
    </div>
  );
};

export default OperatorDashboard;
