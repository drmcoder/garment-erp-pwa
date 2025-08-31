import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import config from '../config/environments';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Audio context for notification sounds
  const [audioContext, setAudioContext] = useState(null);

  // Initialize audio context after first user interaction
  useEffect(() => {
    const enableAudio = () => {
      if (!window.audioContextAllowed) {
        window.audioContextAllowed = true;
        console.log('✅ Audio context enabled after user interaction');
        
        // Play any queued notification sound
        if (window.pendingNotificationSound !== undefined) {
          playNotificationSound(window.pendingNotificationSound);
          window.pendingNotificationSound = undefined;
        }
      }
    };

    // Listen for user interactions to enable audio
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, enableAudio, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
    };
  }, []);

  // Function to play notification sound
  const playNotificationSound = (isSupervisorAlert = false) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume audio context if suspended
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const frequencies = isSupervisorAlert ? [800, 600, 400] : [600];
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
        }, index * 400);
      });
    } catch (error) {
      console.log('Audio playback failed:', error.message);
    }
  };

  // Initialize empty notifications - no test data
  
  // Add test notifications with different timestamps for debugging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Test notifications with different timestamps
      setTimeout(() => {
        const now = new Date();
        
        // Create notifications with different timestamps
        const testNotifications = [
          {
            title: currentLanguage === 'np' ? 'सफल' : 'Success',
            message: currentLanguage === 'np' ? 'डेटा रिफ्रेश गरियो' : 'Data refreshed',
            type: 'success',
            time: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
            priority: 'low'
          },
          {
            title: currentLanguage === 'np' ? 'सफल' : 'Success',
            message: '8085 assigned to bimala overlock',
            type: 'success', 
            time: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
            priority: 'medium'
          },
          {
            title: currentLanguage === 'np' ? 'सफल' : 'Success',
            message: currentLanguage === 'np' ? 'आपातकालीन काम सफलतापूर्वक थपियो' : 'Emergency work inserted successfully',
            type: 'success',
            time: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
            priority: 'high'
          }
        ];
        
        // Only add test notifications if there are no existing notifications
        if (notifications.length === 0) {
          testNotifications.forEach(notif => addNotification(notif));
        }
      }, 1000);
    }
  }, [currentLanguage]); // Only run when language context is ready

  const addNotification = (notification) => {
    // Check if demo notifications are disabled
    if (!config.features.demoNotifications && notification.isDemo) {
      console.log('🚫 Demo notification blocked:', notification.title);
      return;
    }

    const newNotification = {
      id: Date.now(),
      time: notification.time || new Date(),
      read: false,
      priority: 'medium',
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Play sound for high priority notifications (only after user interaction)
    if (newNotification.priority === 'high' || newNotification.type === 'supervisor_alert') {
      // Only play sound if user has interacted with the page
      if (window.audioContextAllowed) {
        playNotificationSound(newNotification.type === 'supervisor_alert');
      } else {
        // Queue the sound to play after first user interaction
        window.pendingNotificationSound = newNotification.type === 'supervisor_alert';
      }
    }

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: newNotification.type,
        vibrate: newNotification.type === 'supervisor_alert' ? [200, 100, 200, 100, 200] : [100, 50, 100],
        requireInteraction: newNotification.priority === 'high', // Keep high priority notifications visible
        silent: false
      });

      // Auto-close normal notifications after 5 seconds, but keep high priority ones
      if (newNotification.priority !== 'high') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Mark notification as read when clicked
        markAsRead(newNotification.id);
      };
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

  // Send workflow-based notification to next operators
  const sendWorkflowNotification = (completedWork, nextOperators) => {
    if (!nextOperators || nextOperators.length === 0) return;

    nextOperators.forEach(nextOp => {
      const notification = {
        title: currentLanguage === 'np' ? '🔄 नयाँ काम तयार छ' : '🔄 New Work Ready',
        message: currentLanguage === 'np' 
          ? `आर्टिकल ${completedWork.articleNumber} - ${nextOp.operation} तपाईंको मेसिन ${nextOp.machineType} का लागि तयार छ`
          : `Article ${completedWork.articleNumber} - ${nextOp.operation} ready for your ${nextOp.machineType} machine`,
        type: 'workflow_next',
        priority: 'high',
        data: {
          previousOperator: completedWork.operatorName,
          previousOperation: completedWork.operation,
          nextOperation: nextOp.operation,
          machineType: nextOp.machineType,
          articleNumber: completedWork.articleNumber,
          pieces: completedWork.pieces,
          completedAt: new Date().toISOString(),
          actionType: 'WORKFLOW_NOTIFICATION'
        }
      };

      // Add notification for each next operator
      addNotification(notification);
    });

    console.log(`✅ Workflow notifications sent to ${nextOperators.length} next operators`);
  };

  // Send machine type group notifications
  const sendMachineGroupNotification = (machineType, workData) => {
    const notification = {
      title: currentLanguage === 'np' ? `🔧 ${machineType} मेसिन काम` : `🔧 ${machineType} Machine Work`,
      message: currentLanguage === 'np' 
        ? `आर्टिकल ${workData.articleNumber} ${machineType} मेसिनका सबै ऑपरेटरहरूका लागि तयार छ`
        : `Article ${workData.articleNumber} ready for all ${machineType} machine operators`,
      type: 'machine_group',
      priority: 'medium',
      data: {
        machineType: machineType,
        articleNumber: workData.articleNumber,
        operation: workData.nextOperation,
        pieces: workData.pieces,
        readyAt: new Date().toISOString(),
        actionType: 'MACHINE_GROUP_NOTIFICATION'
      }
    };

    addNotification(notification);
    console.log(`✅ Machine group notification sent for ${machineType}`);
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
    sendWorkflowNotification,
    sendMachineGroupNotification,
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