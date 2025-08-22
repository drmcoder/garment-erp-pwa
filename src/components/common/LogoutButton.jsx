// src/components/common/LogoutButton.jsx
// Missing Logout Feature Implementation

import React, { useState } from "react";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const LogoutButton = ({ className = "", variant = "button" }) => {
  const { logout, getUserDisplayInfo } = useAuth();
  const { t } = useLanguage();
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
                {t("settings")}
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? t("loading") : t("logout")}
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
        {isLoggingOut ? t("loading") : t("logout")}
      </span>
    </button>
  );
};

export default LogoutButton;
