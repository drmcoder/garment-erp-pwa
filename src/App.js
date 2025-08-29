// src/App.jsx
// Main App Component with Complete Context Integration

import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  NotificationProvider,
  useNotifications,
} from "./context/NotificationContext";
import { SystemProvider, useSystem } from "./context/SystemContext";
import { GlobalErrorProvider } from "./components/common/GlobalErrorHandler";
// Removed unused Firebase imports - using modular LoginScreen
import SelfAssignmentSystem from "./components/operator/SelfAssignmentSystem";
import OperatorWorkDashboard from "./components/operator/OperatorWorkDashboardNew";
import SupervisorDashboard from "./components/supervisor/SupervisorDashboard";
import WorkAssignment from "./components/supervisor/WorkAssignment";
import SystemSettings from "./components/admin/SystemSettings";
import UserManagement from "./components/admin/UserManagement";
import MachineManagement from "./components/admin/MachineManagement";
import TemplateBuilder from "./components/supervisor/TemplateBuilder";
import AIProductionAnalytics from "./components/analytics/AIProductionAnalytics";
import PayrollSystem from "./components/management/PayrollSystem";
import { PermissionGate, usePermissions, PermissionsProvider } from "./context/PermissionsContext";
import { PERMISSIONS } from "./services/permissions-service";
import { FullScreenLoader } from "./components/common/BrandedLoader";
import LoginScreen from "./components/auth/LoginScreen";

// Inline Login Component removed - using modular LoginScreen from ./components/auth/LoginScreen.jsx

// Language Toggle Component
const LanguageToggle = () => {
  const { currentLanguage, toggleLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-50 transition-colors"
    >
      <span>{isNepali ? '🇳🇵' : '🇺🇸'}</span>
      <span>{isNepali ? "नेपाली" : "English"}</span>
    </button>
  );
};

// Notification Bell Component
const NotificationBell = () => {
  const notificationContext = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Safely destructure with fallbacks
  const {
    getUnreadCount = () => 0,
    notifications = [],
    markAllAsRead = () => {}
  } = notificationContext || {};
  
  // Safety check to ensure getUnreadCount is available
  const unreadCount = typeof getUnreadCount === 'function' ? getUnreadCount() : 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b flex justify-between items-center">
              <h3 className="font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    markAllAsRead();
                    setShowNotifications(false);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <span className="text-4xl block mb-2">📭</span>
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b last:border-b-0 ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-sm">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(() => {
                            try {
                              const date = notification.timestamp?.toDate ? 
                                notification.timestamp.toDate() : 
                                new Date(notification.timestamp);
                              return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString();
                            } catch (error) {
                              return 'Just now';
                            }
                          })()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 5 && (
              <div className="px-4 py-2 border-t text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for notification icons
const getNotificationIcon = (type) => {
  const icons = {
    work_assignment: "🔔",
    quality_issue: "🚨",
    efficiency_alert: "⚡",
    target_achieved: "🎯",
    break_reminder: "⏰",
    work_available: "📋",
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };
  return icons[type] || "ℹ️";
};

// Main Navigation Component
const Navigation = () => {
  const { logout, getUserDisplayName, getUserRoleDisplay } = useAuth();
  const { showNotification } = useNotifications();
  const { lineName } = useSystem();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      showNotification("Logged out successfully", "success");
    } catch (error) {
      showNotification("Logout failed", "error");
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🏭</span>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-gray-900">
                TSA Production Management System
              </h1>
              <p className="text-sm text-gray-500">
                {lineName} - AI Powered Line Balancing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <LanguageToggle />

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                  {getUserDisplayName().charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {getUserDisplayName()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getUserRoleDisplay()}
                  </div>
                </div>
              </button>

              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      👤 Profile
                    </button>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      ⚙️ Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Basic Operator Dashboard
const OperatorDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  // Removed unused notification methods

  // Demo notification buttons

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.name}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            {user.speciality} Operator | Station: {user.station} | Machine: {user.machine || 'Not Assigned'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {user.stats.todayPieces}
            </div>
            <div className="text-sm text-gray-500">Today's Pieces</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              Rs. {user.stats.todayEarnings}
            </div>
            <div className="text-sm text-gray-500">Today's Earnings</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              {user.efficiency}%
            </div>
            <div className="text-sm text-gray-500">Efficiency</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {user.qualityScore}%
            </div>
            <div className="text-sm text-gray-500">Quality</div>
          </div>
        </div>

        {/* Current Work */}
        {user.currentWork && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <h3 className="text-lg font-semibold mb-4">🔄 Current Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Article</div>
                <div className="font-medium">
                  #{user.currentWork.articleNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Operation</div>
                <div className="font-medium">{user.currentWork.operation}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Progress</div>
                <div className="font-medium">
                  {user.currentWork.completed}/{user.currentWork.pieces} pieces
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`grid grid-cols-1 ${process.env.NODE_ENV === 'development' ? 'md:grid-cols-2' : ''} gap-6`}>
          <button
            onClick={() => onNavigate("self-assignment")}
            className="bg-primary-600 text-white p-6 rounded-lg hover:bg-primary-700 transition-colors text-left"
          >
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-xl font-semibold">Choose Work</div>
            <div className="text-primary-200 mt-1">
              Select work based on your skills
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

// Main App Content based on user role
const AppContent = () => {
  const { user } = useAuth();
  // Removed unused permission check
  const [currentView, setCurrentView] = useState("dashboard");

  if (!user) return null;

  // Show different content based on user role
  const renderContent = () => {
    if (user.role === "operator") {
      switch (currentView) {
        case "self-assignment":
          return <SelfAssignmentSystem />;
        case "work-dashboard":
          return <OperatorWorkDashboard />;
        case "dashboard":
        default:
          return <OperatorDashboard onNavigate={setCurrentView} />;
      }
    }

    // Supervisor views
    if (user.role === "supervisor") {
      switch (currentView) {
        case "work-assignment":
          return (
            <PermissionGate permission={PERMISSIONS.WORK_ASSIGN}>
              <WorkAssignment />
            </PermissionGate>
          );
        case "user-management":
          return (
            <PermissionGate permission={PERMISSIONS.USER_VIEW_ALL}>
              <UserManagement />
            </PermissionGate>
          );
        case "template-builder":
          return (
            <PermissionGate permissions={[PERMISSIONS.WIP_IMPORT, PERMISSIONS.WORK_ASSIGN]}>
              <TemplateBuilder 
                onTemplateCreated={(template) => {
                  console.log('Template created:', template);
                  // Save to localStorage or database
                  const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
                  savedTemplates.push(template);
                  localStorage.setItem('customTemplates', JSON.stringify(savedTemplates));
                  setCurrentView('dashboard');
                }}
                onCancel={() => setCurrentView('dashboard')}
              />
            </PermissionGate>
          );
        case "dashboard":
        default:
          return <SupervisorDashboard />;
      }
    }

    // Manager and admin views
    if (user.role === "management" || user.role === "manager") {
      switch (currentView) {
        case "settings":
          return (
            <SystemSettings onBack={() => setCurrentView("dashboard")} />
          );
        case "analytics":
          return (
            <AIProductionAnalytics onBack={() => setCurrentView("dashboard")} />
          );
        case "payroll":
          return (
            <PayrollSystem onBack={() => setCurrentView("dashboard")} />
          );
        case "users":
          return (
            <UserManagement onBack={() => setCurrentView("dashboard")} />
          );
        case "machines":
          return (
            <MachineManagement onBack={() => setCurrentView("dashboard")} />
          );
        case "dashboard":
        default:
          return (
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Management Dashboard 👔
                  </h1>
                  <p className="mt-2 text-gray-600">
                    System Overview and Administration
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* First Row - Main Features */}
                  <button
                    onClick={() => setCurrentView("settings")}
                    className="bg-primary-600 text-white p-6 rounded-lg hover:bg-primary-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">⚙️</div>
                    <div className="text-xl font-semibold">System Settings</div>
                    <div className="text-primary-200 mt-1">
                      Configure production line and targets
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setCurrentView("analytics")}
                    className="bg-success-600 text-white p-6 rounded-lg hover:bg-success-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">🧠</div>
                    <div className="text-xl font-semibold">AI Analytics</div>
                    <div className="text-success-200 mt-1">
                      Production insights and predictions
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentView("payroll")}
                    className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">💰</div>
                    <div className="text-xl font-semibold">Payroll System</div>
                    <div className="text-green-200 mt-1">
                      Manage operator payments and incentives
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setCurrentView("users")}
                    className="bg-orange-600 text-white p-6 rounded-lg hover:bg-orange-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-xl font-semibold">User Management</div>
                    <div className="text-orange-200 mt-1">
                      Manage operators and assign machines
                    </div>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <button
                    onClick={() => setCurrentView("machines")}
                    className="bg-primary-600 text-white p-6 rounded-lg hover:bg-primary-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">🔧</div>
                    <div className="text-xl font-semibold">Machine Management</div>
                    <div className="text-primary-200 mt-1">
                      Add, edit and configure machines
                    </div>
                  </button>
                </div>
              </div>
            </div>
          );
      }
    }

    // Other roles - still under development
    return (
      <div className="p-8 text-center">Under Development for {user.role}</div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Navigation Tabs for Operators */}
      {user.role === "operator" && (
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "dashboard"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setCurrentView("self-assignment")}
                className={`py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "self-assignment"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🎯 Choose Work
              </button>
              <button
                onClick={() => setCurrentView("work-dashboard")}
                className={`py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "work-dashboard"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📋 My Work
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Supervisors */}
      {user.role === "supervisor" && (
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "dashboard"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setCurrentView("work-assignment")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "work-assignment"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🎯 Assign
              </button>
              <button
                onClick={() => setCurrentView("user-management")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "user-management"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                👥 Users
              </button>
              <button
                onClick={() => setCurrentView("template-builder")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "template-builder"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🛠️ Templates
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Navigation Tabs for Management */}
      {user.role === "management" && (
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-6 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "dashboard"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setCurrentView("analytics")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "analytics"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🧠 AI Analytics
              </button>
              <button
                onClick={() => setCurrentView("payroll")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "payroll"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                💰 Payroll
              </button>
              <button
                onClick={() => setCurrentView("settings")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "settings"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                ⚙️ Settings
              </button>
            </nav>
          </div>
        </div>
      )}

      <main>{renderContent()}</main>
    </div>
  );
};

// Main App Component
const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader message="Initializing Garment ERP System..." />;
  }

  return isAuthenticated ? <AppContent /> : <LoginScreen />;
};

// Root App with all providers
const AppWithProviders = () => {
  return (
    <LanguageProvider>
      <GlobalErrorProvider>
        <AuthProvider>
          <PermissionsProvider>
            <SystemProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </SystemProvider>
          </PermissionsProvider>
        </AuthProvider>
      </GlobalErrorProvider>
    </LanguageProvider>
  );
};

export default AppWithProviders;
