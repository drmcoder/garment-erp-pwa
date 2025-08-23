import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { NotificationService } from "../services/firebase-services";
import { useAuth } from "./AuthContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { t, currentLanguage } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sample notifications for testing
  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        title: currentLanguage === 'np' ? 'बन्डल #५ तयार छ' : 'Bundle #5 Ready',
        message: currentLanguage === 'np' 
          ? 'तपाईंको स्टेसनमा नयाँ काम तयार छ'
          : 'New work ready at your station',
        time: new Date(Date.now() - 2 * 60000),
        type: 'work',
        read: false,
        priority: 'high'
      },
      {
        id: 2,
        title: currentLanguage === 'np' ? 'दैनिक लक्ष्य' : 'Daily Target',
        message: currentLanguage === 'np'
          ? 'आजको लक्ष्यको ८५% पूरा भयो'
          : '85% of today\'s target completed',
        time: new Date(Date.now() - 30 * 60000),
        type: 'achievement',
        read: false,
        priority: 'medium'
      },
      {
        id: 3,
        title: currentLanguage === 'np' ? 'गुणस्तर चेक' : 'Quality Check',
        message: currentLanguage === 'np'
          ? 'बन्डल #३ मा गुणस्तर जाँच सम्पन्न'
          : 'Quality check completed for Bundle #3',
        time: new Date(Date.now() - 60 * 60000),
        type: 'quality',
        read: true,
        priority: 'low'
      }
    ];

    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.read).length);
  }, [currentLanguage]);

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
    addNotification({
      title: type === 'error' ? (currentLanguage === 'np' ? 'त्रुटि' : 'Error') :
             type === 'success' ? (currentLanguage === 'np' ? 'सफल' : 'Success') :
             type === 'warning' ? (currentLanguage === 'np' ? 'चेतावनी' : 'Warning') :
             (currentLanguage === 'np' ? 'जानकारी' : 'Information'),
      message: message,
      type: type,
      priority: type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'low'
    });
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
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadCount
  };

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