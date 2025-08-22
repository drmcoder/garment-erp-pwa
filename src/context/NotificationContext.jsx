// src/contexts/NotificationContext.jsx
// Complete Notification Context with Chrome Push Notifications

import React, { createContext, useState, useEffect, useContext } from "react";
import { useLanguage } from "./LanguageContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState("default");
  const [toastNotifications, setToastNotifications] = useState([]);

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Register service worker for PWA notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    }

    // Listen for PWA notifications
    const handleMessage = (event) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICKED") {
        handleNotificationClick(event.data.notification);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleMessage);
    }

    // Cleanup
    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      }
    };
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    try {
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === "granted";
      }
      return false;
    } catch (error) {
      console.error("❌ Error requesting notification permission:", error);
      return false;
    }
  };

  // Show browser notification
  const showBrowserNotification = (title, options = {}) => {
    try {
      if (permission === "granted" && "Notification" in window) {
        const notification = new Notification(title, {
          body: options.body || "",
          icon: options.icon || "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          tag: options.tag || "garment-erp",
          requireInteraction: options.requireInteraction || false,
          actions: options.actions || [],
          data: options.data || {},
          ...options,
        });

        notification.onclick = () => {
          handleNotificationClick(options.data);
          notification.close();
        };

        return notification;
      }
      return null;
    } catch (error) {
      console.error("❌ Error showing browser notification:", error);
      return null;
    }
  };

  // Handle notification click
  const handleNotificationClick = (data) => {
    try {
      // Focus the window
      if (window.focus) {
        window.focus();
      }

      // Handle different notification types
      switch (data?.type) {
        case "work_assignment":
          // Navigate to work queue
          window.location.hash = "#/operator/work-queue";
          break;
        case "quality_issue":
          // Navigate to quality reports
          window.location.hash = "#/operator/quality";
          break;
        case "efficiency_alert":
          // Navigate to efficiency dashboard
          window.location.hash = "#/supervisor/efficiency";
          break;
        default:
          // Navigate to dashboard
          window.location.hash = "#/dashboard";
      }
    } catch (error) {
      console.error("❌ Error handling notification click:", error);
    }
  };

  // Show toast notification (in-app)
  const showToast = (message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type, // success, error, warning, info
      duration,
      timestamp: new Date(),
    };

    setToastNotifications((prev) => [...prev, toast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  };

  // Remove toast notification
  const removeToast = (id) => {
    setToastNotifications((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Add notification to history
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 100)); // Keep last 100
    return newNotification;
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Show notification (combines browser and toast)
  const showNotification = (message, type = "info", options = {}) => {
    // Show toast
    const toastId = showToast(message, type, options.duration);

    // Show browser notification for important types
    if (
      ["success", "error", "warning"].includes(type) &&
      permission === "granted"
    ) {
      const title = getNotificationTitle(type);
      showBrowserNotification(title, {
        body: message,
        requireInteraction: type === "error",
        ...options,
      });
    }

    // Add to notification history
    const notification = addNotification({
      type,
      message,
      title: getNotificationTitle(type),
      ...options,
    });

    return { toastId, notification };
  };

  // Get notification title based on type
  const getNotificationTitle = (type) => {
    const titles = {
      success: isNepali ? "✅ सफल!" : "✅ Success!",
      error: isNepali ? "❌ त्रुटि!" : "❌ Error!",
      warning: isNepali ? "⚠️ चेतावनी!" : "⚠️ Warning!",
      info: isNepali ? "ℹ️ जानकारी" : "ℹ️ Information",
    };
    return titles[type] || titles.info;
  };

  // Predefined notification templates
  const notificationTemplates = {
    workAssigned: (articleNumber, operation) => ({
      type: "work_assignment",
      title: isNepali ? "🔔 नयाँ काम" : "🔔 New Work",
      message: isNepali
        ? `लेख ${articleNumber} - ${operation} तपाईंलाई तोकिएको छ`
        : `Article ${articleNumber} - ${operation} assigned to you`,
      data: { type: "work_assignment", articleNumber, operation },
    }),

    workCompleted: (articleNumber, earnings) => ({
      type: "success",
      title: isNepali ? "✅ काम सम्पन्न" : "✅ Work Completed",
      message: isNepali
        ? `लेख ${articleNumber} सम्पन्न! कमाई: रु. ${earnings}`
        : `Article ${articleNumber} completed! Earnings: Rs. ${earnings}`,
      data: { type: "work_completed", articleNumber, earnings },
    }),

    qualityIssue: (bundleId, defectType) => ({
      type: "error",
      title: isNepali ? "🚨 गुणस्तर समस्या" : "🚨 Quality Issue",
      message: isNepali
        ? `बन्डल ${bundleId} मा ${defectType} फेला परेको`
        : `${defectType} found in bundle ${bundleId}`,
      requireInteraction: true,
      data: { type: "quality_issue", bundleId, defectType },
    }),

    efficiencyAlert: (stationName, idleTime) => ({
      type: "warning",
      title: isNepali ? "⚡ दक्षता अलर्ट" : "⚡ Efficiency Alert",
      message: isNepali
        ? `${stationName} ${idleTime} मिनेट देखि खाली छ`
        : `${stationName} idle for ${idleTime} minutes`,
      data: { type: "efficiency_alert", stationName, idleTime },
    }),

    targetAchieved: (targetType, percentage) => ({
      type: "success",
      title: isNepali ? "🎯 लक्ष्य प्राप्त" : "🎯 Target Achieved",
      message: isNepali
        ? `${targetType} लक्ष्य ${percentage}% पूरा भयो!`
        : `${targetType} target ${percentage}% achieved!`,
      data: { type: "target_achieved", targetType, percentage },
    }),

    breakReminder: (timeRemaining) => ({
      type: "info",
      title: isNepali ? "⏰ विश्राम सम्झना" : "⏰ Break Reminder",
      message: isNepali
        ? `विश्राम समय ${timeRemaining} मिनेटमा सुरु हुन्छ`
        : `Break time starts in ${timeRemaining} minutes`,
      data: { type: "break_reminder", timeRemaining },
    }),

    workAvailable: (workCount) => ({
      type: "info",
      title: isNepali ? "📋 नयाँ काम उपलब्ध" : "📋 New Work Available",
      message: isNepali
        ? `तपाईंका लागि ${workCount} नयाँ काम उपलब्ध छ`
        : `${workCount} new work items available for you`,
      data: { type: "work_available", workCount },
    }),
  };

  // Send predefined notifications
  const sendWorkAssigned = (articleNumber, operation) => {
    const template = notificationTemplates.workAssigned(
      articleNumber,
      operation
    );
    showBrowserNotification(template.title, template);
    return addNotification(template);
  };

  const sendWorkCompleted = (articleNumber, earnings) => {
    const template = notificationTemplates.workCompleted(
      articleNumber,
      earnings
    );
    showBrowserNotification(template.title, template);
    return addNotification(template);
  };

  const sendQualityIssue = (bundleId, defectType) => {
    const template = notificationTemplates.qualityIssue(bundleId, defectType);
    showBrowserNotification(template.title, template);
    return addNotification(template);
  };

  const sendEfficiencyAlert = (stationName, idleTime) => {
    const template = notificationTemplates.efficiencyAlert(
      stationName,
      idleTime
    );
    showBrowserNotification(template.title, template);
    return addNotification(template);
  };

  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  // Toast Notification Component
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastNotifications.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ${getToastStyles(
            toast.type
          )}`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">{getToastIcon(toast.type)}</div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {toast.message}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {toast.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => removeToast(toast.id)}
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  aria-label={isNepali ? 'बन्द गर्नुहोस्' : 'Close'}
                >
                  <span className="sr-only">{isNepali ? 'बन्द गर्नुहोस्' : 'Close'}</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const getToastStyles = (type) => {
    const styles = {
      success: "border-l-4 border-green-400",
      error: "border-l-4 border-red-400",
      warning: "border-l-4 border-yellow-400",
      info: "border-l-4 border-blue-400",
    };
    return styles[type] || styles.info;
  };

  const getToastIcon = (type) => {
    const icons = {
      success: <span className="text-green-400">✅</span>,
      error: <span className="text-red-400">❌</span>,
      warning: <span className="text-yellow-400">⚠️</span>,
      info: <span className="text-blue-400">ℹ️</span>,
    };
    return icons[type] || icons.info;
  };

  const value = {
    notifications,
    toastNotifications,
    permission,
    requestPermission,
    showNotification,
    showToast,
    removeToast,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    getUnreadCount,
    sendWorkAssigned,
    sendWorkCompleted,
    sendQualityIssue,
    sendEfficiencyAlert,
    notificationTemplates,
    ToastContainer,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer />
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
