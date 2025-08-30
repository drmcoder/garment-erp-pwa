import React, { useState, useRef, useEffect } from "react";
import {
  Factory,
  Bell,
  User,
  Menu,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageToggle } from "../../context/LanguageContext";
import NotificationSettings from "./NotificationSettings";

const Header = ({
  onMenuToggle,
  notifications = [],
  isOffline = false,
  showMenuButton = true,
}) => {
  const { user, userRole, logout, getUserDisplayInfo } = useAuth();
  const { t, currentLanguage, getTimeBasedGreeting, formatTime, formatRelativeTime } =
    useLanguage();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const userInfo = getUserDisplayInfo();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentTime = formatTime(new Date());

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu and Title */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            )}

            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Factory className="w-6 h-6" />
              </div>

              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800">
                  {t("appTitle")}
                </h1>
                <p className="text-sm text-gray-600">{t("subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Center Section - Status Indicators (Hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Online/Offline Status */}
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isOffline
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isOffline ? (
                <WifiOff className="w-4 h-4" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              <span className="font-medium">
                {isOffline ? t("offline") : t("online")}
              </span>
            </div>

            {/* Current Time */}
            <div className="text-sm text-gray-600">{currentTime}</div>
          </div>

          {/* Right Section - Actions and User */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Settings Button */}
              <button
                onClick={() => setShowNotificationSettings(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notification Settings"
                title={currentLanguage === "np" ? "सूचना सेटिङ्गहरू" : "Notification Settings"}
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">
                      {t("notifications")}
                    </h3>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-600">
                        {currentLanguage === "np"
                          ? `${unreadCount} नयाँ सूचना`
                          : `${unreadCount} new notifications`}
                      </p>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                !notification.read
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">
                                {currentLanguage === "np"
                                  ? notification.titleNepali
                                  : notification.title}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {currentLanguage === "np"
                                  ? notification.messageNepali
                                  : notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatRelativeTime(notification.time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">
                          {currentLanguage === "np"
                            ? "कुनै सूचना छैन"
                            : "No notifications"}
                        </p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 5 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                        {currentLanguage === "np"
                          ? "सबै हेर्नुहोस्"
                          : "View all"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Toggle (Hidden on small screens) */}
            <div className="hidden sm:block">
              <LanguageToggle showText={false} />
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="User menu"
              >
                {/* User Info */}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {userInfo?.name}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {t(userRole)}{" "}
                    {userInfo?.machine && `• ${t(userInfo.machine)}`}
                  </p>
                </div>

                {/* Avatar */}
                <div className="bg-blue-100 text-blue-700 p-2 rounded-lg flex items-center justify-center">
                  {userInfo?.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {userInfo?.initials}
                    </span>
                  )}
                </div>

                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                        <span className="text-sm font-medium">
                          {userInfo?.initials}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {userInfo?.name}
                        </p>
                        <p className="text-sm text-gray-600">{t(userRole)}</p>
                        {userInfo?.station && (
                          <p className="text-xs text-gray-500">
                            {currentLanguage === "np" ? "स्टेसन" : "Station"}:{" "}
                            {userInfo.station}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Greeting */}
                    <div className="mt-2 text-sm text-gray-600">
                      {getTimeBasedGreeting()}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="w-4 h-4" />
                      <span>{t("profile")}</span>
                    </button>

                    <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>{t("settings")}</span>
                    </button>

                    <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                      <span>{t("help")}</span>
                    </button>

                    {/* Language Toggle for Mobile */}
                    <div className="sm:hidden px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {currentLanguage === "np" ? "भाषा" : "Language"}
                        </span>
                        <LanguageToggle className="border-0 bg-transparent hover:bg-gray-50" />
                      </div>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Status Bar */}
        <div className="md:hidden mt-3 flex items-center justify-between text-sm">
          <div
            className={`flex items-center space-x-2 ${
              isOffline ? "text-red-600" : "text-green-600"
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-4 h-4" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            <span>{isOffline ? t("offline") : t("online")}</span>
          </div>

          <div className="text-gray-600">{currentTime}</div>
        </div>
      </div>
      
      {/* Notification Settings Modal */}
      <NotificationSettings 
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </header>
  );
};

export default Header;
