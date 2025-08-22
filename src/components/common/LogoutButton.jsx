// src/components/common/LogoutButton.jsx
// Missing Logout Feature Implementation

import React, { useState } from "react";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const LogoutButton = ({ className = "", variant = "button" }) => {
  const { user, logout, getUserDisplayInfo } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userInfo = getUserDisplayInfo();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Redirect will be handled by AuthContext
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  if (variant === "dropdown") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {userInfo?.name}
            </p>
            <p className="text-xs text-gray-500">{t(userInfo?.role)}</p>
          </div>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-200">
              <p className="font-medium text-gray-900">{userInfo?.name}</p>
              <p className="text-sm text-gray-500">{userInfo?.email}</p>
              <p className="text-xs text-gray-400">{t(userInfo?.role)}</p>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  // Add profile/settings navigation here
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-2" />
                {currentLanguage === "np" ? "सेटिङ्स" : "Settings"}
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut
                  ? currentLanguage === "np"
                    ? "लगआउट हुँदै..."
                    : "Logging out..."
                  : currentLanguage === "np"
                  ? "लगआउट"
                  : "Logout"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 ${className}`}
    >
      <LogOut className="w-4 h-4" />
      <span>
        {isLoggingOut
          ? currentLanguage === "np"
            ? "लगआउट हुँदै..."
            : "Logging out..."
          : currentLanguage === "np"
          ? "लगआउट"
          : "Logout"}
      </span>
    </button>
  );
};

export default LogoutButton;

// ========================================
// Update AuthContext.jsx to add logout function
// ========================================

// Add this to your AuthContext.jsx:

const logout = async () => {
  try {
    setIsLoading(true);

    // Clear user data
    setUser(null);
    setUserRole(null);
    setUserPermissions([]);
    setIsAuthenticated(false);

    // Clear localStorage
    localStorage.removeItem("garment-erp-current-user");
    localStorage.removeItem("garment-erp-auth-token");

    // If using Firebase Auth (when implemented)
    // await signOut(auth);

    console.log("✅ User logged out successfully");

    // Redirect to login
    window.location.href = "/login";
  } catch (error) {
    console.error("❌ Logout error:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Add logout to context value:
const contextValue = {
  user,
  userRole,
  userPermissions,
  isAuthenticated,
  isLoading,
  isInitializing,
  login,
  logout, // ← Add this
  hasPermission,
  getUserDisplayInfo,
};

// ========================================
// Update App.js to include logout in header
// ========================================

// Add to your main App.js or dashboard headers:

import LogoutButton from "./components/common/LogoutButton";

// In your header component:
<div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
  <h1 className="text-xl font-semibold">गारमेन्ट ERP</h1>
  <LogoutButton variant="dropdown" />
</div>;

// ========================================
// Update OperatorDashboard.jsx header
// ========================================

// Add to OperatorDashboard.jsx header:

import LogoutButton from "../common/LogoutButton";

// In the header section:
<div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white m-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-lg font-bold">
        {getTimeBasedGreeting()}, {userInfo?.name}
      </h1>
      <p className="text-blue-100 text-sm">
        {t("operator")} - {t(userInfo?.machine)} | {formatTime(currentTime)}
      </p>
    </div>
    <div className="flex items-center space-x-3">
      <div className="text-right">
        <div className="text-2xl font-bold">
          {formatNumber(dailyStats.piecesCompleted)}
        </div>
        <div className="text-blue-100 text-sm">
          {t("pieces")} {t("today")}
        </div>
      </div>
      <LogoutButton className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white" />
    </div>
  </div>
</div>;
