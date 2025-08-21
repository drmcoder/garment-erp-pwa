import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  Package,
  Star,
  ArrowRight,
  RefreshCw,
  Plus,
  Settings,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const OperatorDashboard = () => {
  const {
    user,
    getUserDisplayInfo,
    subscribeToUserBundles,
    subscribeToUserNotifications,
  } = useAuth();
  const {
    t,
    currentLanguage,
    formatCurrency,
    formatTime,
    getTimeBasedGreeting,
  } = useLanguage();

  // State management
  const [currentWork, setCurrentWork] = useState(null);
  const [workQueue, setWorkQueue] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    completedPieces: 85,
    totalEarnings: 237.5,
    efficiency: 88,
    qualityScore: 98,
    target: 120,
    hoursWorked: 6.5,
  });
  const [notifications, setNotifications] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [workTimer, setWorkTimer] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const userInfo = getUserDisplayInfo();

  // Sample current work data
  useEffect(() => {
    setCurrentWork({
      id: 1,
      bundleNumber: "B001-85-BL-XL",
      article: "8085",
      articleName: "Polo T-Shirt",
      color: "Blue-1",
      size: "XL",
      operation: "shoulderJoin",
      machine: "overlock",
      totalPieces: 30,
      completedPieces: 25,
      rate: 2.5,
      estimatedTime: 60,
      startTime: new Date(Date.now() - 45 * 60000),
      priority: "normal",
      qualityStatus: "good",
    });

    // Sample work queue
    setWorkQueue([
      {
        id: 2,
        bundleNumber: "B002-33-GR-2XL",
        article: "2233",
        articleName: "Round Neck T-Shirt",
        color: "Green-1",
        size: "2XL",
        operation: "sideSeam",
        pieces: 28,
        rate: 2.8,
        estimatedTime: 50,
        priority: "high",
      },
      {
        id: 3,
        bundleNumber: "B003-35-WH-L",
        article: "6635",
        articleName: "3-Button Paper Tops",
        color: "White-1",
        size: "L",
        operation: "hemFold",
        pieces: 40,
        rate: 1.9,
        estimatedTime: 70,
        priority: "normal",
      },
      {
        id: 4,
        bundleNumber: "B004-85-BL-L",
        article: "8085",
        articleName: "Polo T-Shirt",
        color: "Blue-1",
        size: "L",
        operation: "placket",
        pieces: 32,
        rate: 3.2,
        estimatedTime: 80,
        priority: "normal",
      },
    ]);
  }, []);

  // Work timer effect
  useEffect(() => {
    let interval;
    if (isWorking && currentWork) {
      interval = setInterval(() => {
        setWorkTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorking, currentWork]);

  // Real-time subscriptions
  useEffect(() => {
    if (user?.uid) {
      const bundlesUnsubscribe = subscribeToUserBundles((result) => {
        if (result.success) {
          // Handle real bundles data
          console.log("Bundles updated:", result.data);
        }
      });

      const notificationsUnsubscribe = subscribeToUserNotifications(
        (result) => {
          if (result.success) {
            setNotifications(result.data || []);
          }
        }
      );

      return () => {
        if (bundlesUnsubscribe) bundlesUnsubscribe();
        if (notificationsUnsubscribe) notificationsUnsubscribe();
      };
    }
  }, [user, subscribeToUserBundles, subscribeToUserNotifications]);

  // Calculate progress and earnings
  const progress = currentWork
    ? (currentWork.completedPieces / currentWork.totalPieces) * 100
    : 0;
  const currentEarnings = currentWork
    ? currentWork.completedPieces * currentWork.rate
    : 0;
  const remainingPieces = currentWork
    ? currentWork.totalPieces - currentWork.completedPieces
    : 0;

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle work actions
  const handleStartWork = () => {
    setIsWorking(true);
    setWorkTimer(0);
  };

  const handlePauseWork = () => {
    setIsWorking(false);
  };

  const handleCompleteWork = () => {
    setIsWorking(false);
    setWorkTimer(0);
    // Navigate to work completion screen
    console.log("Navigate to work completion");
  };

  const handleReportIssue = () => {
    // Navigate to quality issue reporting
    console.log("Navigate to quality issue reporting");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with greeting and stats summary */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {getTimeBasedGreeting()}, {userInfo?.name}!
            </h1>
            <p className="text-sm text-gray-600">
              {t("operator")} • {userInfo?.station} • {formatTime(new Date())}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {dailyStats.completedPieces}
            </div>
            <div className="text-xs text-gray-600">{t("pieces")}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(dailyStats.totalEarnings)}
            </div>
            <div className="text-xs text-gray-600">{t("earnings")}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {dailyStats.efficiency}%
            </div>
            <div className="text-xs text-gray-600">{t("efficiency")}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {dailyStats.qualityScore}%
            </div>
            <div className="text-xs text-gray-600">{t("quality")}</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-6">
        {/* Current Work Section */}
        {currentWork ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-blue-800 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  {t("currentWork")}
                </h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                    currentWork.priority
                  )}`}
                >
                  {currentWork.priority}
                </span>
              </div>
            </div>

            <div className="p-4">
              {/* Work details */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {t("article")} {currentWork.article}#{" "}
                  {currentWork.articleName}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {t("operation")}: {t(currentWork.operation)} (
                  {t(currentWork.machine)})
                </p>
                <p className="text-sm text-gray-600">
                  {t("bundle")}: {currentWork.bundleNumber} •{" "}
                  {currentWork.color} • {currentWork.size}
                </p>
              </div>

              {/* Progress section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t("progress")}
                  </span>
                  <span className="text-sm text-gray-600">
                    {currentWork.completedPieces}/{currentWork.totalPieces}{" "}
                    {t("pieces")}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {remainingPieces}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t("remaining")}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(currentEarnings)}
                    </div>
                    <div className="text-xs text-gray-600">{t("earned")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {isWorking ? formatTimer(workTimer) : "⏸️"}
                    </div>
                    <div className="text-xs text-gray-600">{t("time")}</div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                {!isWorking ? (
                  <button
                    onClick={handleStartWork}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t("startWork")}
                  </button>
                ) : (
                  <button
                    onClick={handlePauseWork}
                    className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    {t("pauseWork")}
                  </button>
                )}

                <button
                  onClick={handleCompleteWork}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={remainingPieces > 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("completeWork")}
                </button>
              </div>

              <button
                onClick={handleReportIssue}
                className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {t("reportIssue")}
              </button>
            </div>
          </div>
        ) : (
          /* No current work */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("noWorkAvailable")}
            </h3>
            <p className="text-gray-600 mb-4">{t("waitingForWork")}</p>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              {t("requestWork")}
            </button>
          </div>
        )}

        {/* Work Queue Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {t("workQueue")} ({workQueue.length})
            </h2>
            <button className="text-blue-600 text-sm hover:text-blue-800">
              {t("view")} {t("all")}
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {workQueue.slice(0, 3).map((work, index) => (
              <div
                key={work.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-800">
                      #{index + 1}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
                        work.priority
                      )}`}
                    >
                      {work.priority}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>

                <h4 className="font-medium text-gray-800 mb-1">
                  {t("article")} {work.article}# {work.articleName}
                </h4>

                <p className="text-sm text-gray-600 mb-2">
                  {t("operation")}: {t(work.operation)} • {work.color} •{" "}
                  {work.size}
                </p>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {work.pieces} {t("pieces")} •{" "}
                    {formatCurrency(work.pieces * work.rate)}
                  </span>
                  <span className="text-gray-500">
                    ~{work.estimatedTime} {t("minutes")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {workQueue.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{t("noWorkInQueue")}</p>
            </div>
          )}
        </div>

        {/* Daily Performance Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {t("today")} {t("performance")}
            </h2>
            <button className="text-blue-600 text-sm hover:text-blue-800">
              {t("details")}
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {dailyStats.completedPieces}/{dailyStats.target}
                </div>
                <div className="text-sm text-gray-600">{t("dailyTarget")}</div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (dailyStats.completedPieces / dailyStats.target) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(dailyStats.totalEarnings)}
                </div>
                <div className="text-sm text-gray-600">
                  {t("totalEarnings")}
                </div>
                <div className="text-xs text-green-700 mt-1 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% {t("vs")} {t("yesterday")}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {dailyStats.efficiency}%
                </div>
                <div className="text-xs text-gray-600">{t("efficiency")}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {dailyStats.qualityScore}%
                </div>
                <div className="text-xs text-gray-600">{t("quality")}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">
                  {dailyStats.hoursWorked}h
                </div>
                <div className="text-xs text-gray-600">{t("hours")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-800">
              {t("myStats")}
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <Settings className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-800">
              {t("settings")}
            </div>
          </button>
        </div>
      </div>

      {/* Bottom padding for safe area */}
      <div className="h-6"></div>
    </div>
  );
};

export default OperatorDashboard;
