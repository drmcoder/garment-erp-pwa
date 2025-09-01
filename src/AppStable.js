// Stable App Component with minimal providers to prevent infinite loops
import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider, useNotifications } from "./context/NotificationContext";
import { SystemProvider } from "./context/SystemContext";
import SentryErrorBoundary from "./components/error/SentryErrorBoundary";
import { FullScreenLoader } from "./components/common/BrandedLoader";
import LoginScreen from "./components/auth/LoginScreen";
import OperatorWorkDashboard from "./components/operator/OperatorWorkDashboardNew";
import SupervisorDashboard from "./components/supervisor/Dashboard";
import AdvancedManagementDashboard from "./components/management/ManagementDashboard";

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

// Notification Bell Component (Simplified)
const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
      >
        <span className="text-xl">🔔</span>
      </button>

      {showNotifications && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b">
              <h3 className="font-medium">Notifications</h3>
            </div>
            <div className="px-4 py-8 text-center text-gray-500">
              <span className="text-4xl block mb-2">📭</span>
              No notifications
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Navigation Component
const Navigation = () => {
  const { logout, getUserDisplayName, getUserRoleDisplay } = useAuth();
  const { showNotification } = useNotifications();
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
                AI Powered Line Balancing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageToggle />
            <NotificationBell />

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

// Main App Content based on user role
const AppContent = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Show different content based on user role
  const renderContent = () => {
    if (user.role === "operator") {
      return <OperatorWorkDashboard />;
    }

    if (user.role === "supervisor") {
      return <SupervisorDashboard />;
    }

    if (user.role === "management" || user.role === "manager" || user.role === "admin") {
      return <AdvancedManagementDashboard />;
    }

    return (
      <div className="p-8 text-center">Under Development for {user.role}</div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
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

// Stable App with minimal providers (no CentralizedAppProvider, no PermissionsProvider)
const AppStable = () => {
  return (
    <SentryErrorBoundary>
      <LanguageProvider>
        <SystemProvider>
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </SystemProvider>
      </LanguageProvider>
    </SentryErrorBoundary>
  );
};

export default AppStable;