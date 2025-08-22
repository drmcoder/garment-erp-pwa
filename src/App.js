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
import SizeConfiguration from "./components/admin/SizeConfiguration";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";
import PWAInstaller from "./components/pwa/PWAInstaller";
import { Bell, Settings, LogOut, Wifi, WifiOff } from "lucide-react";

// Service Worker Registration for PWA
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered successfully:", registration);

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
};

// App Layout Component
const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
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

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
};

// Notification Panel Component
const NotificationPanel = ({ onClose }) => {
  const notifications = [
    {
      id: 1,
      title: "बन्डल #५ तयार छ",
      message: "तपाईंको स्टेसनमा नयाँ काम तयार छ",
      time: "2 मिनेट अगाडि",
      type: "work",
      unread: true,
    },
    {
      id: 2,
      title: "दैनिक लक्ष्य",
      message: "आजको लक्ष्यको ८५% पूरा भयो",
      time: "30 मिनेट अगाडि",
      type: "achievement",
      unread: true,
    },
    {
      id: 3,
      title: "गुणस्तर चेक",
      message: "बन्डल #३ मा गुणस्तर जाँच सम्पन्न",
      time: "1 घण्टा अगाडि",
      type: "quality",
      unread: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">सूचनाहरू</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${
                notification.unread
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {notification.time}
                  </p>
                </div>
                {notification.unread && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component
const SettingsPanel = ({ onClose }) => {
  const [showSizeConfig, setShowSizeConfig] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">सेटिङ्स</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <button
              onClick={() => setShowSizeConfig(true)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
            >
              <div className="font-medium">साइज कन्फिगरेसन</div>
              <div className="text-sm text-gray-600">
                लेखका साइजहरू व्यवस्थापन गर्नुहोस्
              </div>
            </button>

            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
              <div className="font-medium">भाषा सेटिङ्स</div>
              <div className="text-sm text-gray-600">नेपाली/अंग्रेजी भाषा</div>
            </button>

            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
              <div className="font-medium">सूचना सेटिङ्स</div>
              <div className="text-sm text-gray-600">पुश नोटिफिकेसन</div>
            </button>

            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
              <div className="font-medium">खाता सेटिङ्स</div>
              <div className="text-sm text-gray-600">प्रोफाइल र पासवर्ड</div>
            </button>
          </div>
        </div>
      </div>

      {showSizeConfig && (
        <SizeConfiguration
          onClose={() => setShowSizeConfig(false)}
          onSave={(data) => {
            console.log("Size configuration saved:", data);
            setShowSizeConfig(false);
          }}
        />
      )}
    </>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case "operator":
      return <OperatorDashboard />;
    case "supervisor":
      return <SupervisorDashboard />;
    case "management":
    case "admin":
      return <ManagementDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Main App Component
const App = () => {
  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();

    // Add PWA-specific styles
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (isStandalone) {
      document.body.classList.add("pwa-standalone");
    }
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

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
                    <ProtectedRoute
                      allowedRoles={["supervisor", "management", "admin"]}
                    >
                      <AppLayout>
                        <SupervisorDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/management"
                  element={
                    <ProtectedRoute allowedRoles={["management", "admin"]}>
                      <AppLayout>
                        <ManagementDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

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

                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />

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
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
