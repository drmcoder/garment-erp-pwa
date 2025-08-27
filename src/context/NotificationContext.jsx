import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize empty notifications - no test data

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      time: new Date(),
      read: false,
      priority: 'medium',
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: newNotification.type,
        vibrate: [100, 50, 100]
      });
    }

    return newNotification;
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAsUnread = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: false }
          : notification
      )
    );
    setUnreadCount(prev => prev + 1);
  };

  const toggleReadStatus = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      if (notification.read) {
        markAsUnread(notificationId);
      } else {
        markAsRead(notificationId);
      }
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getUnreadCount = () => {
    return unreadCount;
  };

  const showNotification = (message, type = 'info') => {
    const notification = {
      title: type === 'error' ? (currentLanguage === 'np' ? 'त्रुटि' : 'Error') :
             type === 'success' ? (currentLanguage === 'np' ? 'सफल' : 'Success') :
             type === 'warning' ? (currentLanguage === 'np' ? 'चेतावनी' : 'Warning') :
             (currentLanguage === 'np' ? 'जानकारी' : 'Information'),
      message: message,
      type: type,
      priority: type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'low'
    };
    
    const newNotification = addNotification(notification);
    
    // Notifications will NOT auto-dismiss - user must manually dismiss them
    // This allows users to keep important notifications visible
    
    return newNotification;
  };

  const sendWorkAssigned = (articleNumber, operation) => {
    addNotification({
      title: currentLanguage === 'np' ? 'नयाँ काम असाइन भयो' : 'New Work Assigned',
      message: currentLanguage === 'np' 
        ? `आर्टिकल ${articleNumber} - ${operation} तपाईंलाई असाइन गरियो`
        : `Article ${articleNumber} - ${operation} has been assigned to you`,
      type: 'work',
      priority: 'high'
    });
  };

  const sendWorkCompleted = (articleNumber, operation, pieces, earnings) => {
    addNotification({
      title: currentLanguage === 'np' ? 'काम सम्पन्न भयो' : 'Work Completed',
      message: currentLanguage === 'np' 
        ? `आर्टिकल ${articleNumber} - ${operation} सम्पन्न। ${pieces} टुक्रा, ${earnings} कमाई`
        : `Article ${articleNumber} - ${operation} completed. ${pieces} pieces, ${earnings} earnings`,
      type: 'completion',
      priority: 'medium'
    });
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    showNotification,
    sendWorkAssigned,
    sendWorkCompleted,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadCount
  };

  // Show loading state if language context is not ready
  if (!currentLanguage) {
    return (
      <NotificationContext.Provider value={value}>
        <div>Loading notifications...</div>
      </NotificationContext.Provider>
    );
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;