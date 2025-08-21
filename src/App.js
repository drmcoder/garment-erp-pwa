import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import LoginScreen from "./components/auth/LoginScreen";
import Header from "./components/common/Header";
import OperatorDashboard from "./components/operator/OperatorDashboard";
import { useAuth } from "./context/AuthContext";

// Main App Content
function AppContent() {
  const { isAuthenticated, userRole, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Sample notifications for header
  const sampleNotifications = [
    {
      id: 1,
      title: "Bundle Ready",
      titleNepali: "बन्डल तयार",
      message: "Bundle #B002-33-GR-2XL ready for your station",
      messageNepali: "बन्डल #B002-33-GR-2XL तपाईंको स्टेसनको लागि तयार छ",
      time: new Date(Date.now() - 2 * 60000),
      read: false,
      urgent: false,
    },
    {
      id: 2,
      title: "Work Approved",
      titleNepali: "काम स्वीकृत",
      message: "Bundle #B001-85-BL-XL completed successfully. Earnings: Rs. 75",
      messageNepali: "बन्डल #B001-85-BL-XL सफलतापूर्वक सकियो। कमाई: रु. ७५",
      time: new Date(Date.now() - 15 * 60000),
      read: true,
      urgent: false,
    },
    {
      id: 3,
      title: "Quality Issue",
      titleNepali: "गुणस्तर समस्या",
      message: "Quality issue reported in Bundle #B003-35-WH-L. Please review.",
      messageNepali:
        "बन्डल #B003-35-WH-L मा गुणस्तर समस्या रिपोर्ट गरिएको। कृपया समीक्षा गर्नुहोस्।",
      time: new Date(Date.now() - 30 * 60000),
      read: false,
      urgent: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        notifications={sampleNotifications}
        isOffline={false}
        showMenuButton={userRole !== "operator"}
      />

      <main>
        {userRole === "operator" ? (
          <OperatorDashboard />
        ) : userRole === "supervisor" ? (
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Supervisor Dashboard
              </h1>
              <p className="text-gray-600">
                🏭 Supervisor interface coming soon...
              </p>
            </div>
          </div>
        ) : userRole === "management" ? (
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Management Dashboard
              </h1>
              <p className="text-gray-600">
                📊 Management interface coming soon...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Welcome to Garment ERP!
              </h1>
              <p className="text-gray-600">
                🎉 System is working! Role-based dashboard will be loaded based
                on your permissions.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Current User Info:
                </h3>
                <p className="text-blue-700">
                  Name: {user?.name || user?.displayName}
                </p>
                <p className="text-blue-700">Role: {userRole}</p>
                <p className="text-blue-700">
                  Station: {user?.station || "Not assigned"}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Main App with Providers
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
