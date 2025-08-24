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
import SelfAssignmentSystem from "./components/operator/SelfAssignmentSystem";
import SupervisorDashboard from "./components/supervisor/SupervisorDashboard";
import WorkAssignment from "./components/supervisor/WorkAssignment";
import WIPImportSimplified from "./components/supervisor/WIPImportSimplified";
import SystemSettings from "./components/admin/SystemSettings";
import UserManagement from "./components/admin/UserManagement";
import TemplateBuilder from "./components/supervisor/TemplateBuilder";
import AIProductionAnalytics from "./components/analytics/AIProductionAnalytics";
import PayrollSystem from "./components/management/PayrollSystem";
import { PermissionGate, usePermissions, PermissionsProvider } from "./context/PermissionsContext";
import { PERMISSIONS } from "./services/permissions-service";

// Login Component
const LoginScreen = () => {
  const { login, loading } = useAuth();
  const { showNotification } = useNotifications();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Available users (this would normally come from a users API or context)
  const availableUsers = [
    { username: 'ram.singh', name: 'Ram Bahadur Singh', role: 'operator' },
    { username: 'sita.devi', name: 'Sita Devi Sharma', role: 'operator' },
    { username: 'hari.supervisor', name: 'Hari Prasad Thapa', role: 'supervisor' },
    { username: 'admin.manager', name: 'Admin Manager', role: 'management' },
    // Add more users as created through UserManagement
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      await login(
        credentials.username,
        credentials.password,
        credentials.rememberMe
      );
      showNotification("Login successful!", "success");
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setCredentials(prev => ({ 
      ...prev, 
      username: user.username,
      password: 'password123' // Auto-fill default password
    }));
    setShowDropdown(false);
    setManualEntry(false);
  };

  const handleUsernameClick = () => {
    setClickCount(prev => prev + 1);
    setTimeout(() => {
      if (clickCount === 0) {
        // Single click - show dropdown
        setShowDropdown(true);
        setManualEntry(false);
      }
      setClickCount(0);
    }, 300);
  };

  const handleUsernameDoubleClick = () => {
    // Double click - enable manual entry
    setManualEntry(true);
    setShowDropdown(false);
    setCredentials(prev => ({ ...prev, username: '' }));
  };

  const getRoleIcon = (role) => {
    const icons = {
      operator: '👤',
      supervisor: '👨‍💼', 
      management: '👔'
    };
    return icons[role] || '👤';
  };

  const getRoleColor = (role) => {
    const colors = {
      operator: 'text-blue-600',
      supervisor: 'text-purple-600',
      management: 'text-red-600'
    };
    return colors[role] || 'text-gray-600';
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center text-4xl">
            🏭
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            TSA Production Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI Powered for Line Balancing
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              
              {/* Username Input/Button */}
              {manualEntry ? (
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Type username manually..."
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  onBlur={() => {
                    if (!credentials.username) {
                      setManualEntry(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={handleUsernameClick}
                  onDoubleClick={handleUsernameDoubleClick}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-left bg-white hover:bg-gray-50"
                >
                  {credentials.username || "Click to select user, double-click for manual entry"}
                </button>
              )}

              {/* Dropdown */}
              {showDropdown && !manualEntry && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b bg-gray-50">
                    <p className="text-xs text-gray-600 text-center">
                      Select user or double-click above for manual entry
                    </p>
                  </div>
                  {availableUsers.map((user) => (
                    <button
                      key={user.username}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getRoleIcon(user.role)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">@{user.username}</span>
                            <span className={`text-xs font-semibold ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className="p-2 border-t bg-gray-50">
                    <button
                      type="button"
                      onClick={() => {
                        setManualEntry(true);
                        setShowDropdown(false);
                        setCredentials(prev => ({ ...prev, username: '' }));
                      }}
                      className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ⌨️ Type manually instead
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${
                  credentials.password === 'password123' ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder={credentials.password === 'password123' ? "Auto-filled password" : "Password (password123)"}
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={credentials.rememberMe}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    rememberMe: e.target.checked,
                  })
                }
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loginLoading || loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </button>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
            <p className="font-medium mb-2">Demo Accounts:</p>
            <div className="space-y-1">
              <p>
                <strong>Operator:</strong> ram.singh / password123
              </p>
              <p>
                <strong>Supervisor:</strong> hari.supervisor / password123
              </p>
              <p>
                <strong>Manager:</strong> admin.manager / password123
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

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
                          {new Date(
                            notification.timestamp
                          ).toLocaleTimeString()}
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
  const { sendWorkAssigned, sendWorkCompleted } = useNotifications();

  // Demo notification buttons
  const testNotifications = () => {
    sendWorkAssigned("8085", "Shoulder Join");
    setTimeout(() => {
      sendWorkCompleted("8085", 75);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.name}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            {user.speciality} Operator | Station: {user.station}
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
            className="bg-indigo-600 text-white p-6 rounded-lg hover:bg-indigo-700 transition-colors text-left"
          >
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-xl font-semibold">Choose Work</div>
            <div className="text-indigo-200 mt-1">
              Select work based on your skills
            </div>
          </button>

          {/* Test Notifications - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={testNotifications}
              className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-left"
            >
              <div className="text-3xl mb-2">🔔</div>
              <div className="text-xl font-semibold">Test Notifications</div>
              <div className="text-green-200 mt-1">Try sample notifications</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Content based on user role
const AppContent = () => {
  const { user } = useAuth();
  const { canAccessView } = usePermissions();
  const [currentView, setCurrentView] = useState("dashboard");

  if (!user) return null;

  // Show different content based on user role
  const renderContent = () => {
    if (user.role === "operator") {
      switch (currentView) {
        case "self-assignment":
          return <SelfAssignmentSystem />;
        case "dashboard":
        default:
          return <OperatorDashboard onNavigate={setCurrentView} />;
      }
    }

    // Supervisor views
    if (user.role === "supervisor") {
      switch (currentView) {
        case "wip-import":
          return (
            <PermissionGate permission={PERMISSIONS.WIP_IMPORT}>
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden relative">
                  {/* Close button */}
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <WIPImportSimplified 
                    onImport={(result) => {
                      console.log('WIP Import completed:', result);
                      setCurrentView('dashboard');
                    }}
                    onCancel={() => setCurrentView('dashboard')}
                  />
                </div>
              </div>
            </PermissionGate>
          );
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
    if (user.role === "management") {
      switch (currentView) {
        case "settings":
          return (
            <PermissionGate permission={PERMISSIONS.SETTINGS_VIEW}>
              <SystemSettings />
            </PermissionGate>
          );
        case "analytics":
          return (
            <PermissionGate permission={PERMISSIONS.ANALYTICS_VIEW}>
              <AIProductionAnalytics />
            </PermissionGate>
          );
        case "payroll":
          return (
            <PermissionGate permission={PERMISSIONS.PAYROLL_VIEW}>
              <PayrollSystem />
            </PermissionGate>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setCurrentView("settings")}
                    className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">⚙️</div>
                    <div className="text-xl font-semibold">System Settings</div>
                    <div className="text-blue-200 mt-1">
                      Configure production line and targets
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setCurrentView("analytics")}
                    className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">🧠</div>
                    <div className="text-xl font-semibold">AI Analytics</div>
                    <div className="text-purple-200 mt-1">
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
                onClick={() => setCurrentView("wip-import")}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  currentView === "wip-import"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📝 WIP
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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
