// Ultra-Clean App Component - No Zustand store, no problematic services
import React, { useState } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider, useNotifications } from "./context/NotificationContext";
import SentryErrorBoundary from "./components/error/SentryErrorBoundary";
import { FullScreenLoader } from "./components/common/BrandedLoader";
import LoginScreen from "./components/auth/LoginScreen";
// Temporarily commenting out advanced dashboards to debug
// import OperatorWorkDashboardNewCentralized from "./components/operator/OperatorWorkDashboardNewCentralized";
// import SupervisorDashboardFull from "./components/supervisor/Dashboard";

// Removed simple notification system - using NotificationProvider instead

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

// Simple Navigation Component
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
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
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

// Simple Dashboard Components removed - using advanced components instead

// Simple Dashboard Components removed - using advanced components instead

const ManagementDashboard = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Daily Production</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">1,250</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">Rs. 45K</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overall Efficiency</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">87%</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">23</p>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>🏭 Production Lines</span>
                <span className="text-green-600">3 Active</span>
              </div>
              <div className="flex justify-between">
                <span>👥 Total Workers</span>
                <span className="text-blue-600">45</span>
              </div>
              <div className="flex justify-between">
                <span>📦 Pending Orders</span>
                <span className="text-yellow-600">12</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>🎯 Target Achievement</span>
                <span className="text-green-600">95%</span>
              </div>
              <div className="flex justify-between">
                <span>⚡ System Health</span>
                <span className="text-green-600">Excellent</span>
              </div>
              <div className="flex justify-between">
                <span>🔄 Data Sync</span>
                <span className="text-green-600">Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Content based on user role
const AppContent = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Show different content based on user role
  const renderContent = () => {
    if (user.role === "operator") {
      return <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-green-600">✅ Operator Dashboard</h2>
        <p>Advanced dashboard temporarily disabled for debugging</p>
        <p>User: {user.name}</p>
      </div>;
    }

    if (user.role === "supervisor") {
      return <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-blue-600">✅ Supervisor Dashboard</h2>
        <p>Advanced dashboard temporarily disabled for debugging</p>
        <p>User: {user.name}</p>
      </div>;
    }

    if (user.role === "management" || user.role === "manager" || user.role === "admin") {
      return <ManagementDashboard user={user} />;
    }

    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome {user.name}</h2>
        <p className="text-gray-600">Dashboard for {user.role} role is under development</p>
      </div>
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

// Ultra-Clean App with minimal providers (NO store dependencies)
const AppClean = () => {
  return (
    <SentryErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </SentryErrorBoundary>
  );
};

export default AppClean;