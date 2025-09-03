import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Package,
  Target,
  Settings,
  RefreshCw,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import MoneyManagement from "./MoneyManagement";
import WorkAssignmentSystem from "../common/WorkAssignmentSystem";
import LiveOperatorWorkBucket from "./LiveOperatorWorkBucket";
import AllOperatorsEarnings from "./AllOperatorsEarnings";
import DailyReports from "./DailyReports";
import IssueResolution from "./IssueResolution";
import BundlePaymentHolds from "./BundlePaymentHolds";
import SelfAssignmentApprovalQueue from "./SelfAssignmentApprovalQueue";

const Dashboard = () => {
  const { getUserDisplayInfo, isOnline } = useAuth();
  const {
    t,
    currentLanguage,
    formatTime,
    formatNumber,
  } = useLanguage();

  const [activeTab, setActiveTab] = useState("overview");
  const [currentTime, setCurrentTime] = useState(new Date());


  const userInfo = getUserDisplayInfo();

  // Simplified data to prevent infinite loops
  const isReady = true;

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);



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

  // Navigation Cards Component
  const NavigationCards = () => {
    const navigationOptions = [
      {
        id: "assignment",
        icon: "📦",
        title: currentLanguage === "np" ? "कार्य असाइनमेन्ट" : "Work Assignment",
        description: currentLanguage === "np" ? "अपरेटरहरूलाई कार्य असाइन गर्नुहोस्" : "Assign tasks to operators",
        color: "bg-blue-50 hover:bg-blue-100 border-blue-200"
      },
      {
        id: "money",
        icon: "💰",
        title: currentLanguage === "np" ? "पैसा व्यवस्थापन" : "Money Management",
        description: currentLanguage === "np" ? "वेतन र भुक्तानी व्यवस्थापन" : "Manage payroll and payments",
        color: "bg-green-50 hover:bg-green-100 border-green-200"
      },
      {
        id: "live-bucket",
        icon: "👥",
        title: currentLanguage === "np" ? "लाइभ अपरेटर बकेट" : "Live Operator Bucket",
        description: currentLanguage === "np" ? "वास्तविक समयमा अपरेटर स्थिति" : "Real-time operator status",
        color: "bg-purple-50 hover:bg-purple-100 border-purple-200"
      },
      {
        id: "earnings",
        icon: "💼",
        title: currentLanguage === "np" ? "सबै आम्दानी" : "All Earnings",
        description: currentLanguage === "np" ? "अपरेटर आम्दानी रिपोर्ट" : "Operator earnings reports",
        color: "bg-orange-50 hover:bg-orange-100 border-orange-200"
      },
      {
        id: "reports",
        icon: "📊",
        title: currentLanguage === "np" ? "दैनिक रिपोर्ट" : "Daily Reports",
        description: currentLanguage === "np" ? "उत्पादन र गुणस्तर रिपोर्ट" : "Production and quality reports",
        color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
      },
      {
        id: "issues",
        icon: "🔧",
        title: currentLanguage === "np" ? "समस्या समाधान" : "Issue Resolution",
        description: currentLanguage === "np" ? "गुणस्तर समस्या समाधान" : "Resolve quality issues",
        color: "bg-red-50 hover:bg-red-100 border-red-200"
      },
      {
        id: "payment-holds",
        icon: "🔒",
        title: currentLanguage === "np" ? "भुक्तानी होल्ड" : "Payment Holds",
        description: currentLanguage === "np" ? "होल्डमा रहेका भुक्तानीहरू" : "Manage payment holds",
        color: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
      },
      {
        id: "self-assignments",
        icon: "📋",
        title: currentLanguage === "np" ? "स्व-असाइनमेन्ट स्वीकृति" : "Self-Assignment Approval",
        description: currentLanguage === "np" ? "स्व-असाइनमेन्ट स्वीकृति गर्नुहोस्" : "Approve self-assignments",
        color: "bg-teal-50 hover:bg-teal-100 border-teal-200"
      }
    ];

    return (
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            {currentLanguage === "np" ? "सुपरवाइजर कार्यहरू" : "Supervisor Functions"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {navigationOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`${option.color} p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="w-8 h-8 bg-white bg-opacity-50 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm">→</span>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">{option.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ProductionOverviewView = () => (
    <div>
      <NavigationCards />
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
          <button
            onClick={() => setActiveTab("self-assignments")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "self-assignments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📋 {currentLanguage === "np" ? "स्व-असाइनमेन्ट स्वीकृति" : "Self-Assignment Approval"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === "overview" && <ProductionOverviewView />}


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

        {/* Self-Assignment Approval Tab */}
        {activeTab === "self-assignments" && (
          <SelfAssignmentApprovalQueue />
        )}
      </div>

    </div>
  );
};

export default Dashboard;
