import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../hooks/useNotifications';
import WorkCompletion from './WorkCompletion';
import QualityReport from "./QualityReport";

const OperatorDashboard = () => {
  const { user, getUserDisplayInfo } = useAuth();
  const { t, currentLanguage, getTimeBasedGreeting, formatTime } =
    useLanguage();
  const { showWorkNotification } = useNotifications();

  const [currentWork, setCurrentWork] = useState({
    id: 1,
    bundleNumber: "B001-85-BL-XL",
    article: "8085",
    articleName: "Polo T-Shirt",
    color: "नीलो-१",
    size: "XL",
    operation: "काँध जोड्ने",
    machine: "ओभरलक",
    totalPieces: 30,
    completedPieces: 25,
    rate: 2.5,
    startTime: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    estimatedTime: 60,
    status: "in-progress",
    nextOperation: "माथिल्लो सिलाई",
    nextMachine: "फ्ल्यालक",
  });

  const [dailyStats, setDailyStats] = useState({
    totalPieces: 85,
    totalEarnings: 237.5,
    efficiency: 88,
    qualityScore: 98,
    completedBundles: 3,
    teamAverage: 76,
  });

  const [workQueue, setWorkQueue] = useState([
    {
      id: 2,
      bundleNumber: "B002-33-GR-2XL",
      article: "2233",
      articleName: "Round Neck T-Shirt",
      color: "हरियो-१",
      size: "2XL",
      operation: "साइड सिम",
      machine: "ओभरलक",
      pieces: 28,
      rate: 2.8,
      estimatedTime: 35,
      priority: "high",
      nextOperation: "हेम फोल्ड",
      nextMachine: "फ्ल्यालक",
    },
    {
      id: 3,
      bundleNumber: "B003-35-WH-L",
      article: "6635",
      articleName: "3-Button Tops",
      color: "सेतो-१",
      size: "L",
      operation: "हेम फोल्ड",
      machine: "फ्ल्यालक",
      pieces: 40,
      rate: 1.9,
      estimatedTime: 50,
      priority: "normal",
      nextOperation: "बटनहोल",
      nextMachine: "बटनहोल",
    },
    {
      id: 4,
      bundleNumber: "B004-85-BL-L",
      article: "8085",
      articleName: "Polo T-Shirt",
      color: "नीलो-१",
      size: "L",
      operation: "प्लाकेट",
      machine: "एकल सुई",
      pieces: 32,
      rate: 3.2,
      estimatedTime: 80,
      priority: "normal",
      nextOperation: "कलर अट्याच",
      nextMachine: "एकल सुई",
    },
    {
      id: 5,
      bundleNumber: "B005-88-CR-XL",
      article: "2288",
      articleName: "Full Sleeve T-Shirt",
      color: "क्रिम-१",
      size: "XL",
      operation: "स्लिभ अट्याच",
      machine: "ओभरलक",
      pieces: 25,
      rate: 4.5,
      estimatedTime: 90,
      priority: "low",
      nextOperation: "काँध जोड्ने",
      nextMachine: "ओभरलक",
    },
  ]);

  const [showWorkCompletion, setShowWorkCompletion] = useState(false);
  const [showWorkQueue, setShowWorkQueue] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "work-ready",
      title: "नयाँ काम तयार",
      message: "बन्डल #B006 तपाईंको स्टेसनमा तयार छ",
      time: new Date(Date.now() - 5 * 60000),
      read: false,
    },
    {
      id: 2,
      type: "reminder",
      title: "विश्राम समय",
      message: "१० मिनेट पछि विश्राम समय सुरु हुन्छ",
      time: new Date(Date.now() - 15 * 60000),
      read: false,
    },
  ]);

  const userInfo = getUserDisplayInfo();
  const currentTime = formatTime(new Date());
  const remainingPieces = currentWork.totalPieces - currentWork.completedPieces;
  const currentProgress = Math.round(
    (currentWork.completedPieces / currentWork.totalPieces) * 100
  );
  const currentEarnings = currentWork.completedPieces * currentWork.rate;

  const handleCompleteWork = () => {
    setShowWorkCompletion(true);
  };

const handleReportIssue = () => {
  setShowQualityReport(true);
};

  const handleRequestWork = async () => {
    // Show notification and request more work
    await showWorkNotification({
      bundleId: "B006",
      article: "2288",
      operation: "sleeve attach",
    });

    // Add notification to local state
    const newNotification = {
      id: Date.now(),
      type: "work-request",
      title: "काम अनुरोध पठाइयो",
      message: "सुपरभाइजरलाई थप काम पठाउन अनुरोध गरिएको छ",
      time: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };
const [showQualityReport, setShowQualityReport] = useState(false);

  const handleWorkCompleted = (completionData) => {
    console.log("Work completed:", completionData);

    setShowWorkCompletion(false);

    // Update current work to next item in queue
    if (workQueue.length > 0) {
      const nextWork = workQueue[0];
      setCurrentWork({
        ...nextWork,
        totalPieces: nextWork.pieces,
        completedPieces: 0,
        startTime: new Date(),
        status: "in-progress",
      });

      // Remove completed work from queue
      setWorkQueue((prev) => prev.slice(1));
    } else {
      // No more work available
      setCurrentWork(null);
    }

    // Update daily stats
    setDailyStats((prev) => ({
      ...prev,
      totalPieces: prev.totalPieces + completionData.completedPieces,
      totalEarnings: prev.totalEarnings + completionData.totalEarnings,
      completedBundles: prev.completedBundles + 1,
    }));

    // Add completion notification
    const completionNotification = {
      id: Date.now(),
      type: "work-completed",
      title: "काम सम्पन्न",
      message: `बन्डल ${currentWork.bundleNumber} सफलतापूर्वक सम्पन्न भयो। कमाई: रु. ${completionData.totalEarnings}`,
      time: new Date(),
      read: false,
    };

    setNotifications((prev) => [completionNotification, ...prev]);
  };

  const handleWorkCompletionCancel = () => {
    setShowWorkCompletion(false);
  };

  const handleViewAllWork = () => {
    setShowWorkQueue(true);
  };

  const handleCloseWorkQueue = () => {
    setShowWorkQueue(false);
  };

  const markNotificationRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };
const handleQualityReportSubmit = (reportData) => {
  console.log("Quality report submitted:", reportData);

  // Add to notifications
  const notification = {
    id: Date.now(),
    type: "quality-reported",
    title: "समस्या रिपोर्ट पठाइयो",
    message: `${reportData.defectTypeName} समस्या सुपरभाइजरलाई पठाइएको छ`,
    time: new Date(),
    read: false,
  };

  setNotifications((prev) => [notification, ...prev]);
  setShowQualityReport(false);

  // You would typically send this to your backend here
  // await submitQualityReport(reportData);
};

const handleQualityReportCancel = () => {
  setShowQualityReport(false);
};
  // Auto-update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      // Force re-render to update time
    }, 60000);

    return () => clearInterval(timer);
  }, []);
if (showQualityReport) {
  return (
    <QualityReport
      bundleData={currentWork}
      onSubmit={handleQualityReportSubmit}
      onCancel={handleQualityReportCancel}
    />
  );
}
  // Show work completion screen
  if (showWorkCompletion) {
    return (
      <WorkCompletion
        workData={currentWork}
        onComplete={handleWorkCompleted}
        onCancel={handleWorkCompletionCancel}
      />
    );
  }

  // Show work queue screen
  if (showWorkQueue) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Work Queue Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCloseWorkQueue}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-gray-800">
                  {currentLanguage === "np" ? "कामको लाइन" : "Work Queue"}
                </h1>
              </div>
              <span className="text-sm text-gray-500">
                {workQueue.length}{" "}
                {currentLanguage === "np" ? "वटा काम" : "tasks"}
              </span>
            </div>
          </div>
        </div>

        {/* Work Queue List */}
        <div className="p-4 space-y-4">
          {workQueue.map((work, index) => (
            <div key={work.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                    #{index + 1}
                  </span>
                  {work.priority === "high" && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                      {currentLanguage === "np"
                        ? "उच्च प्राथमिकता"
                        : "High Priority"}
                    </span>
                  )}
                  {work.priority === "low" && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {currentLanguage === "np"
                        ? "कम प्राथमिकता"
                        : "Low Priority"}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "अनुमानित समय" : "Est. Time"}
                  </p>
                  <p className="font-semibold">
                    {work.estimatedTime}{" "}
                    {currentLanguage === "np" ? "मिनेट" : "min"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "लेख" : "Article"}
                  </p>
                  <p className="font-semibold">
                    {work.article}# {work.articleName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "काम" : "Operation"}
                  </p>
                  <p className="font-semibold">
                    {work.operation} ({work.machine})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "रङ/साइज" : "Color/Size"}
                  </p>
                  <p className="font-semibold">
                    {work.color} / {work.size}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "टुक्राहरू" : "Pieces"}
                  </p>
                  <p className="font-semibold">{work.pieces} टुक्रा</p>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {currentLanguage === "np"
                      ? "अनुमानित कमाई"
                      : "Estimated Earnings"}
                    :
                  </span>
                  <span className="font-bold text-green-600">
                    रु. {(work.pieces * work.rate).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    रु. {work.rate}/टुक्रा
                  </span>
                  <span className="text-xs text-gray-500">
                    {currentLanguage === "np" ? "अर्को" : "Next"}:{" "}
                    {work.nextOperation}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {workQueue.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {currentLanguage === "np"
                  ? "कुनै काम बाँकी छैन"
                  : "No Work Remaining"}
              </h3>
              <p className="text-gray-600 mb-4">
                {currentLanguage === "np"
                  ? "सबै काम सकिएको छ। नयाँ काम आउने पर्खनुहोस्।"
                  : "All work completed. Wait for new assignments."}
              </p>
              <button
                onClick={handleRequestWork}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentLanguage === "np"
                  ? "थप काम माग्नुहोस्"
                  : "Request More Work"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                <span className="text-sm font-medium">
                  {userInfo?.initials}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {getTimeBasedGreeting()}, {userInfo?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {t("operator")} | {userInfo?.station} | {currentTime}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5 5-5 5H5m5 0V9a4 4 0 014-4 4 4 0 014 4v8z"
                    />
                  </svg>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
              </div>

              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                {currentLanguage === "np" ? "अनलाइन" : "Online"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Current Work Card */}
        {currentWork ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                {currentLanguage === "np" ? "हालको काम" : "Current Work"}
              </h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {currentLanguage === "np" ? "चलिरहेको" : "In Progress"}
              </span>
            </div>

            <div className="space-y-4">
              {/* Work Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "लेख" : "Article"}
                  </p>
                  <p className="font-semibold">
                    {currentWork.article}# {currentWork.articleName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "काम" : "Operation"}
                  </p>
                  <p className="font-semibold">
                    {currentWork.operation} ({currentWork.machine})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "रङ/साइज" : "Color/Size"}
                  </p>
                  <p className="font-semibold">
                    {currentWork.color} / {currentWork.size}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "बन्डल" : "Bundle"}
                  </p>
                  <p className="font-semibold">
                    #{currentWork.bundleNumber.split("-")[0]}
                  </p>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {currentWork.totalPieces}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentLanguage === "np" ? "तोकिएको" : "Assigned"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {currentWork.completedPieces}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentLanguage === "np" ? "पूरा" : "Completed"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">
                    {remainingPieces}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentLanguage === "np" ? "बाँकी" : "Remaining"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">
                    रु. {currentWork.rate}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentLanguage === "np" ? "दर/टुक्रा" : "Rate/Piece"}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {currentLanguage === "np" ? "प्रगति" : "Progress"}:{" "}
                    {currentProgress}%
                  </span>
                  <span>
                    {currentLanguage === "np" ? "कमाई" : "Earnings"}: रु.{" "}
                    {currentEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleCompleteWork}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  {currentLanguage === "np"
                    ? "काम पूरा गर्नुहोस्"
                    : "Complete Work"}
                </button>
                <button
                  onClick={handleReportIssue}
                  className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  {currentLanguage === "np" ? "समस्या रिपोर्ट" : "Report Issue"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* No Current Work */
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {currentLanguage === "np" ? "कुनै काम नभएको" : "No Current Work"}
            </h3>
            <p className="text-gray-600 mb-4">
              {currentLanguage === "np"
                ? "नयाँ काम असाइन हुने पर्खनुहोस् वा थप काम माग्नुहोस्।"
                : "Wait for new work assignment or request more work."}
            </p>
            <button
              onClick={handleRequestWork}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentLanguage === "np"
                ? "थप काम माग्नुहोस्"
                : "Request More Work"}
            </button>
          </div>
        )}

        {/* Daily Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np" ? "आजको तथ्याङ्क" : "Today's Statistics"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {dailyStats.totalPieces}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "टुक्राहरू" : "Pieces"}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    रु. {dailyStats.totalEarnings}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "कमाई" : "Earnings"}
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {dailyStats.efficiency}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "दक्षता" : "Efficiency"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentLanguage === "np" ? "टिम औसत भन्दा" : "vs team avg"}{" "}
                    +{dailyStats.efficiency - dailyStats.teamAverage}%
                  </p>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {dailyStats.qualityScore}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentLanguage === "np" ? "गुणस्तर" : "Quality"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentLanguage === "np"
                      ? "२ दोष मात्र"
                      : "Only 2 defects"}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Queue Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {currentLanguage === "np" ? "अर्का कामहरू" : "Upcoming Work"}
            </h2>
            <span className="text-sm text-gray-500">
              {workQueue.length}{" "}
              {currentLanguage === "np" ? "वटा बाँकी" : "remaining"}
            </span>
          </div>

          <div className="space-y-3">
            {workQueue.slice(0, 2).map((work, index) => (
              <div
                key={work.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    {work.priority === "high" && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                        {currentLanguage === "np"
                          ? "उच्च प्राथमिकता"
                          : "High Priority"}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    ~{work.estimatedTime}{" "}
                    {currentLanguage === "np" ? "मिनेट" : "min"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">
                      {currentLanguage === "np" ? "लेख" : "Article"}:
                    </span>
                    <span className="ml-1 font-medium">
                      {work.article}# {work.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {currentLanguage === "np" ? "काम" : "Operation"}:
                    </span>
                    <span className="ml-1 font-medium">{work.operation}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {currentLanguage === "np" ? "टुक्रा" : "Pieces"}:
                    </span>
                    <span className="ml-1 font-medium">{work.pieces}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {currentLanguage === "np" ? "कमाई" : "Earnings"}:
                    </span>
                    <span className="ml-1 font-medium text-green-600">
                      रु. {(work.pieces * work.rate).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={handleViewAllWork}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {currentLanguage === "np"
                  ? "सबै काम हेर्नुहोस्"
                  : "View All Work"}
              </button>
              <button
                onClick={handleRequestWork}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                {currentLanguage === "np" ? "थप काम चाहिन्छ" : "Need More Work"}
              </button>
            </div>
          </div>
        </div>

        {/* Today's Target Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np" ? "आजको लक्ष्य" : "Today's Target"}
          </h2>

          <div className="space-y-4">
            {/* Pieces Target */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {currentLanguage === "np" ? "टुक्रा लक्ष्य" : "Pieces Target"}
                </span>
                <span>
                  {dailyStats.totalPieces}/120 (
                  {Math.round((dailyStats.totalPieces / 120) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (dailyStats.totalPieces / 120) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Earnings Target */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {currentLanguage === "np" ? "कमाई लक्ष्य" : "Earnings Target"}
                </span>
                <span>
                  रु. {dailyStats.totalEarnings}/400 (
                  {Math.round((dailyStats.totalEarnings / 400) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (dailyStats.totalEarnings / 400) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Quality Target */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {currentLanguage === "np"
                    ? "गुणस्तर लक्ष्य"
                    : "Quality Target"}
                </span>
                <span>
                  {dailyStats.qualityScore}%/95% (
                  {dailyStats.qualityScore >= 95 ? "पुरा!" : "राम्रो!"})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dailyStats.qualityScore >= 95
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (dailyStats.qualityScore / 95) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === "np"
                ? "हालका सूचनाहरू"
                : "Recent Notifications"}
            </h2>

            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border-l-4 cursor-pointer transition-colors ${
                    notification.read
                      ? "bg-gray-50 border-gray-300"
                      : "bg-blue-50 border-blue-500"
                  }`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          notification.read ? "text-gray-700" : "text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p
                        className={`text-sm ${
                          notification.read ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        {notification.message}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 ml-3">
                      {notification.time.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                  )}
                </div>
              ))}
            </div>

            {notifications.filter((n) => !n.read).length > 3 && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                  {currentLanguage === "np"
                    ? `${
                        notifications.filter((n) => !n.read).length - 3
                      } थप सूचनाहरू हेर्नुहोस्`
                    : `View ${
                        notifications.filter((n) => !n.read).length - 3
                      } more notifications`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np" ? "छिटो कार्यहरू" : "Quick Actions"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleViewAllWork}
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {currentLanguage === "np" ? "काम लिस्ट" : "Work List"}
              </span>
            </button>

            <button
              onClick={handleReportIssue}
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {currentLanguage === "np" ? "समस्या रिपोर्ट" : "Report Issue"}
              </span>
            </button>

            <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {currentLanguage === "np" ? "प्रदर्शन" : "Performance"}
              </span>
            </button>

            <button
              onClick={handleRequestWork}
              className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {currentLanguage === "np" ? "थप काम" : "More Work"}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {currentLanguage === "np" ? "संस्करण" : "Version"} 1.0 - PWA Ready
            </div>
            <div>
              {currentLanguage === "np" ? "अन्तिम अपडेट" : "Last updated"}:{" "}
              {currentTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;