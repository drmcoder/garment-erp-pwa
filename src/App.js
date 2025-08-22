// File: src/App.js - UPDATED VERSION
// Fixed App component with proper routing

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, LanguageToggle } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import LoginPage from "./components/auth/LoginPage";
import OperatorDashboard from "./components/operator/OperatorDashboard";
import SupervisorDashboard from "./components/supervisor/SupervisorDashboard";
import ManagementDashboard from "./components/management/ManagementDashboard";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";
import PWAInstaller from "./components/pwa/PWAInstaller";
import { Bell, Settings, LogOut, Wifi, WifiOff } from "lucide-react";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, isInitializing } = useAuth();

  console.log("🛡️ ProtectedRoute check:", {
    isAuthenticated,
    userRole,
    isInitializing,
  });

  if (isInitializing) {
    return <LoadingSpinner message="Initializing..." />;
  }

  if (!isAuthenticated) {
    console.log("❌ Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log("❌ Insufficient permissions, redirecting to unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("✅ Access granted");
  return children;
};

// Dashboard Router Component - Based on User Role
const DashboardRouter = () => {
  const { user, userRole } = useAuth();

  console.log("🎯 DashboardRouter - user role:", userRole);

  switch (userRole) {
    case "operator":
      console.log("📱 Loading OperatorDashboard");
      return <OperatorDashboard />;
    case "supervisor":
      console.log("📊 Loading SupervisorDashboard");
      return <SupervisorDashboard />;
    case "management":
      console.log("🏢 Loading ManagementDashboard");
      return <ManagementDashboard />;
    default:
      console.log("❓ Unknown role, redirecting to login");
      return <Navigate to="/login" replace />;
  }
};

// App Layout Component
const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top App Bar - Only for mobile */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-lg font-bold text-blue-600">गारमेन्ट ERP</div>
          {!isOnline && (
            <div className="flex items-center text-orange-600 text-sm">
              <WifiOff className="w-4 h-4 mr-1" />
              Offline
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <LanguageToggle showText={false} className="p-2 border-0" />

          <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
          <WifiOff className="w-4 h-4 inline mr-2" />
          You are offline. Some features may not be available.
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* PWA Install Prompt */}
      <PWAInstaller />
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  console.log(
    "🚀 App rendering - authenticated:",
    isAuthenticated,
    "initializing:",
    isInitializing
  );

  if (isInitializing) {
    return <LoadingSpinner message="Loading application..." />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardRouter />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/operator"
          element={
            <ProtectedRoute allowedRoles={["operator"]}>
              <AppLayout>
                <OperatorDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/supervisor"
          element={
            <ProtectedRoute allowedRoles={["supervisor", "management"]}>
              <AppLayout>
                <SupervisorDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/management"
          element={
            <ProtectedRoute allowedRoles={["management"]}>
              <AppLayout>
                <ManagementDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  पहुँच निषेध
                </h1>
                <p className="text-gray-600">
                  तपाईंलाई यो पृष्ठ पहुँच गर्ने अनुमति छैन।
                </p>
              </div>
            </div>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  पृष्ठ फेला परेन
                </h1>
                <p className="text-gray-600">
                  माफ गर्नुहोस्, तपाईंले खोजेको पृष्ठ अवस्थित छैन।
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  फिर्ता जानुहोस्
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
