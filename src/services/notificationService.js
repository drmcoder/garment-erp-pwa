// File: src/services/notificationService.js
// Complete Real-Time Notification System for Garment ERP

import {
  db,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "../config/firebase";

class NotificationService {
  constructor() {
    this.subscribers = new Map();
    this.unsubscribers = new Map();
    this.isOnline = navigator.onLine;
    this.notificationQueue = [];

    // Setup network status monitoring
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.processQueuedNotifications();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });

    // Register service worker for push notifications
    this.registerServiceWorker();
  }

  // Register service worker for push notifications
  async registerServiceWorker() {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("ServiceWorker registered successfully:", registration);

        // Request notification permission
        await this.requestNotificationPermission();

        return registration;
      } catch (error) {
        console.error("ServiceWorker registration failed:", error);
      }
    }
  }

  // Request permission for notifications
  async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
      return permission === "granted";
    }
    return false;
  }

  // Create notification in Firebase
  async createNotification(notificationData) {
    try {
      const notification = {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false,
        delivered: false,
      };

      const docRef = await addDoc(
        collection(db, "notifications"),
        notification
      );

      // Send push notification immediately
      await this.sendPushNotification(notification);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating notification:", error);

      // Queue for later if offline
      if (!this.isOnline) {
        this.notificationQueue.push(notificationData);
      }

      return { success: false, error: error.message };
    }
  }

  // Send immediate push notification
  async sendPushNotification(notification) {
    if (
      !("serviceWorker" in navigator) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Show notification with Nepali support
      const notificationTitle = this.formatNotificationTitle(notification);
      const notificationOptions = this.formatNotificationOptions(notification);

      registration.showNotification(notificationTitle, notificationOptions);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  // Format notification title for display
  formatNotificationTitle(notification) {
    const { type, language = "np" } = notification;

    const titles = {
      np: {
        workAssigned: "🔔 नयाँ काम तोकिएको",
        workCompleted: "✅ काम सम्पन्न",
        qualityIssue: "🚨 गुणस्तर समस्या",
        efficiency: "📊 दक्षता अलर्ट",
        lineStatus: "🏭 लाइन स्थिति",
        earning: "💰 कमाई अपडेट",
        reminder: "⏰ रिमाइन्डर",
        urgent: "🚨 तत्काल",
      },
      en: {
        workAssigned: "🔔 New Work Assigned",
        workCompleted: "✅ Work Completed",
        qualityIssue: "🚨 Quality Issue",
        efficiency: "📊 Efficiency Alert",
        lineStatus: "🏭 Line Status",
        earning: "💰 Earnings Update",
        reminder: "⏰ Reminder",
        urgent: "🚨 Urgent",
      },
    };

    return titles[language][type] || titles[language].reminder;
  }

  // Format notification options
  formatNotificationOptions(notification) {
    const { message, data = {}, type, language = "np" } = notification;

    return {
      body: message,
      icon: this.getNotificationIcon(type),
      badge: "/icons/badge-96x96.png",
      tag: `${type}-${Date.now()}`,
      renotify: type === "urgent",
      requireInteraction: type === "urgent" || type === "qualityIssue",
      silent: false,
      vibrate: this.getVibrationPattern(type),
      data: {
        ...data,
        timestamp: Date.now(),
        language,
      },
      actions: this.getNotificationActions(type, language),
    };
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const icons = {
      workAssigned: "/icons/work-assigned.png",
      workCompleted: "/icons/work-completed.png",
      qualityIssue: "/icons/quality-issue.png",
      efficiency: "/icons/efficiency.png",
      lineStatus: "/icons/line-status.png",
      earning: "/icons/earning.png",
      reminder: "/icons/reminder.png",
      urgent: "/icons/urgent.png",
    };

    return icons[type] || "/icons/default-notification.png";
  }

  // Get vibration pattern based on notification type
  getVibrationPattern(type) {
    const patterns = {
      urgent: [200, 100, 200, 100, 200],
      qualityIssue: [300, 100, 300],
      workAssigned: [100, 50, 100],
      reminder: [100],
      default: [100],
    };

    return patterns[type] || patterns.default;
  }

  // Get notification actions based on type and language
  getNotificationActions(type, language) {
    const actions = {
      np: {
        workAssigned: [
          { action: "view", title: "💼 काम हेर्नुहोस्" },
          { action: "later", title: "⏰ पछि" },
        ],
        qualityIssue: [
          { action: "view", title: "🔍 विवरण हेर्नुहोस्" },
          { action: "dismiss", title: "❌ बन्द गर्नुहोस्" },
        ],
        efficiency: [
          { action: "view", title: "📊 हेर्नुहोस्" },
          { action: "dismiss", title: "❌ बन्द गर्नुहोस्" },
        ],
        default: [
          { action: "view", title: "👁️ हेर्नुहोस्" },
          { action: "dismiss", title: "❌ बन्द गर्नुहोस्" },
        ],
      },
      en: {
        workAssigned: [
          { action: "view", title: "💼 View Work" },
          { action: "later", title: "⏰ Later" },
        ],
        qualityIssue: [
          { action: "view", title: "🔍 View Details" },
          { action: "dismiss", title: "❌ Dismiss" },
        ],
        efficiency: [
          { action: "view", title: "📊 View" },
          { action: "dismiss", title: "❌ Dismiss" },
        ],
        default: [
          { action: "view", title: "👁️ View" },
          { action: "dismiss", title: "❌ Dismiss" },
        ],
      },
    };

    return actions[language][type] || actions[language].default;
  }

  // Subscribe to notifications for specific user
  subscribeToUserNotifications(userId, callback) {
    if (this.unsubscribers.has(userId)) {
      // Already subscribed
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      callback(notifications);

      // Send push notifications for new notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = {
            id: change.doc.id,
            ...change.doc.data(),
          };
          this.sendPushNotification(notification);
        }
      });
    });

    this.unsubscribers.set(userId, unsubscribe);
    this.subscribers.set(userId, callback);
  }

  // Unsubscribe from notifications
  unsubscribeFromUserNotifications(userId) {
    const unsubscribe = this.unsubscribers.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(userId);
      this.subscribers.delete(userId);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId),
        where("read", "==", false)
      );

      const batch = writeBatch(db);
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp(),
        });
      });

      await batch.commit();
      return { success: true, count: snapshot.docs.length };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }
  }

  // Process queued notifications when back online
  async processQueuedNotifications() {
    if (this.notificationQueue.length === 0) return;

    console.log(
      `Processing ${this.notificationQueue.length} queued notifications`
    );

    const promises = this.notificationQueue.map((notification) =>
      this.createNotification(notification)
    );

    try {
      await Promise.all(promises);
      this.notificationQueue = [];
      console.log("All queued notifications processed");
    } catch (error) {
      console.error("Error processing queued notifications:", error);
    }
  }

  // Predefined notification types for easy use

  // Work Assignment Notification
  async notifyWorkAssigned(operatorId, bundleData, language = "np") {
    const messages = {
      np: `बन्डल #${bundleData.id} तपाईंको स्टेसनमा तयार छ। लेख ${bundleData.article}# ${bundleData.color} - ${bundleData.operation}`,
      en: `Bundle #${bundleData.id} is ready at your station. Article ${bundleData.article}# ${bundleData.color} - ${bundleData.operation}`,
    };

    return this.createNotification({
      type: "workAssigned",
      recipientId: operatorId,
      title: "नयाँ काम तोकिएको",
      message: messages[language],
      data: {
        bundleId: bundleData.id,
        article: bundleData.article,
        operation: bundleData.operation,
        action: "viewWork",
      },
      language,
      priority: "high",
    });
  }

  // Quality Issue Notification
  async notifyQualityIssue(supervisorIds, issueData, language = "np") {
    const messages = {
      np: `बन्डल #${issueData.bundleId} मा गुणस्तर समस्या! ${issueData.defectType} - ${issueData.affectedPieces} टुक्रा प्रभावित`,
      en: `Quality issue in Bundle #${issueData.bundleId}! ${issueData.defectType} - ${issueData.affectedPieces} pieces affected`,
    };

    const promises = supervisorIds.map((supervisorId) =>
      this.createNotification({
        type: "qualityIssue",
        recipientId: supervisorId,
        title: "गुणस्तर समस्या",
        message: messages[language],
        data: {
          bundleId: issueData.bundleId,
          defectType: issueData.defectType,
          affectedPieces: issueData.affectedPieces,
          reportedBy: issueData.reportedBy,
          action: "viewQualityIssue",
        },
        language,
        priority: "urgent",
      })
    );

    return Promise.all(promises);
  }

  // Efficiency Alert Notification
  async notifyEfficiencyAlert(supervisorId, alertData, language = "np") {
    const messages = {
      np: `${alertData.stationName} ${alertData.duration} मिनेट देखि खाली छ। दक्षता: ${alertData.efficiency}%`,
      en: `${alertData.stationName} has been idle for ${alertData.duration} minutes. Efficiency: ${alertData.efficiency}%`,
    };

    return this.createNotification({
      type: "efficiency",
      recipientId: supervisorId,
      title: "दक्षता अलर्ट",
      message: messages[language],
      data: {
        stationId: alertData.stationId,
        stationName: alertData.stationName,
        duration: alertData.duration,
        efficiency: alertData.efficiency,
        suggestions: alertData.suggestions,
        action: "viewLineStatus",
      },
      language,
      priority: "high",
    });
  }

  // Work Completion Notification
  async notifyWorkCompleted(supervisorId, completionData, language = "np") {
    const messages = {
      np: `${completionData.operatorName}ले बन्डल #${completionData.bundleId} पूरा गर्नुभयो। अर्को: ${completionData.nextOperation}`,
      en: `${completionData.operatorName} completed Bundle #${completionData.bundleId}. Next: ${completionData.nextOperation}`,
    };

    return this.createNotification({
      type: "workCompleted",
      recipientId: supervisorId,
      title: "काम सम्पन्न",
      message: messages[language],
      data: {
        bundleId: completionData.bundleId,
        operatorId: completionData.operatorId,
        operatorName: completionData.operatorName,
        completedOperation: completionData.completedOperation,
        nextOperation: completionData.nextOperation,
        qualityStatus: completionData.qualityStatus,
        action: "assignNextWork",
      },
      language,
      priority: "normal",
    });
  }

  // Daily Earnings Notification
  async notifyDailyEarnings(operatorId, earningsData, language = "np") {
    const messages = {
      np: `आजको कमाई: रु. ${earningsData.totalEarnings} (${earningsData.piecesCompleted} टुक्रा)। लक्ष्यको ${earningsData.targetPercentage}%`,
      en: `Today's earnings: Rs. ${earningsData.totalEarnings} (${earningsData.piecesCompleted} pieces). ${earningsData.targetPercentage}% of target`,
    };

    return this.createNotification({
      type: "earning",
      recipientId: operatorId,
      title: "दैनिक कमाई",
      message: messages[language],
      data: {
        totalEarnings: earningsData.totalEarnings,
        piecesCompleted: earningsData.piecesCompleted,
        targetPercentage: earningsData.targetPercentage,
        efficiency: earningsData.efficiency,
        action: "viewEarnings",
      },
      language,
      priority: "low",
    });
  }

  // Line Balancing Suggestion
  async notifyLineBalancingSuggestion(
    supervisorId,
    suggestionData,
    language = "np"
  ) {
    const messages = {
      np: `लाइन बैलेन्सिङ सुझाव: ${suggestionData.suggestion}। अनुमानित दक्षता वृद्धि: +${suggestionData.efficiencyGain}%`,
      en: `Line balancing suggestion: ${suggestionData.suggestion}. Estimated efficiency gain: +${suggestionData.efficiencyGain}%`,
    };

    return this.createNotification({
      type: "efficiency",
      recipientId: supervisorId,
      title: "लाइन बैलेन्सिङ सुझाव",
      message: messages[language],
      data: {
        suggestion: suggestionData.suggestion,
        efficiencyGain: suggestionData.efficiencyGain,
        affectedStations: suggestionData.affectedStations,
        priority: suggestionData.priority,
        action: "viewLineBalancing",
      },
      language,
      priority: "normal",
    });
  }

  // Cleanup method
  destroy() {
    // Unsubscribe from all listeners
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
    this.subscribers.clear();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
