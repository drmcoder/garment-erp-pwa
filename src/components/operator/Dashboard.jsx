import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../hooks/useNotifications";

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
    // Navigate to work completion screen
    console.log("Complete work clicked");
  };

  const handleReportIssue = () => {
    // Navigate to quality issue report
    console.log("Report issue clicked");
  };

  const handleRequestWork = () => {
    // Show notification and request more work
    showWorkNotification({
      bundleId: "B005",
      article: "2288",
      operation: "sleeve attach",
    });
  };

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
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
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
      </div>
    </div>
  );
};

export default OperatorDashboard;
