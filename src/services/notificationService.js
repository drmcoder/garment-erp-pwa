class NotificationService {
  constructor() {
    this.isSupported = "Notification" in window && "serviceWorker" in navigator;
    this.permission = "default";
    this.registration = null;
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", this.registration);
      this.permission = Notification.permission;
      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) return false;
    if (this.permission === "granted") return true;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== "granted") {
      return false;
    }

    const defaultOptions = {
      icon: "/logo192.png",
      badge: "/logo192.png",
      vibrate: [100, 50, 100],
      requireInteraction: true,
      ...options,
    };

    try {
      if (this.registration) {
        await this.registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  }

  async showWorkNotification(workData, language = "np") {
    const title = language === "np" ? "नयाँ काम तोकिएको" : "New Work Assigned";
    const body =
      language === "np"
        ? `बन्डल #${workData.bundleId} - ${workData.article} तपाईंको स्टेसनमा तयार छ`
        : `Bundle #${workData.bundleId} - ${workData.article} ready at your station`;

    return await this.showNotification(title, {
      body,
      tag: "work-assignment",
      data: workData,
      actions: [
        {
          action: "accept",
          title: language === "np" ? "स्वीकार गर्नुहोस्" : "Accept",
        },
        {
          action: "view",
          title: language === "np" ? "विवरण हेर्नुहोस्" : "View Details",
        },
      ],
    });
  }

  async showQualityNotification(qualityData, language = "np") {
    const title = language === "np" ? "गुणस्तर समस्या" : "Quality Issue";
    const body =
      language === "np"
        ? `बन्डल #${qualityData.bundleId} मा समस्या फेला परेको छ`
        : `Quality issue found in Bundle #${qualityData.bundleId}`;

    return await this.showNotification(title, {
      body,
      tag: "quality-issue",
      data: qualityData,
      requireInteraction: true,
      actions: [
        {
          action: "review",
          title: language === "np" ? "समीक्षा गर्नुहोस्" : "Review",
        },
      ],
    });
  }

  getPermissionStatus() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      canShow: this.permission === "granted",
    };
  }
}

export const notificationService = new NotificationService();
