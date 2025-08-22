// Garment ERP Service Worker
// Provides offline functionality and push notifications

const CACHE_NAME = "garment-erp-v1";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  // Add other static assets
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Cache populated");
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.destination === "document") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  const options = {
    body: "You have new work assignments!",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
        icon: "/images/checkmark.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/images/xmark.png",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();

    // Handle different notification types
    switch (data.type) {
      case "work-assignment":
        options.title = "नयाँ काम तोकिएको";
        options.body = `बन्डल #${data.bundleId} तपाईंको स्टेसनमा तयार छ`;
        options.icon = "/icon-work.png";
        break;

      case "quality-issue":
        options.title = "गुणस्तर समस्या";
        options.body = `बन्डल #${data.bundleId} मा गुणस्तर जाँच आवश्यक`;
        options.icon = "/icon-quality.png";
        options.badge = "/badge-warning.png";
        break;

      case "efficiency-alert":
        options.title = "दक्षता अलर्ट";
        options.body = data.message;
        options.icon = "/icon-efficiency.png";
        break;

      case "break-reminder":
        options.title = "विश्राम समय";
        options.body = "तपाईंको विश्राम समय सकिएको छ";
        options.icon = "/icon-break.png";
        break;

      case "target-achievement":
        options.title = "लक्ष्य पूरा";
        options.body = `बधाई छ! तपाईंले आजको ${data.percentage}% लक्ष्य पूरा गर्नुभयो`;
        options.icon = "/icon-achievement.png";
        break;

      default:
        options.title = data.title || "गारमेन्ट ERP";
        options.body = data.body || "नयाँ सूचना";
    }
  }

  event.waitUntil(self.registration.showNotification("गारमेन्ट ERP", options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event);

  event.notification.close();

  if (event.action === "explore") {
    // Open app to specific page
    event.waitUntil(clients.openWindow("/dashboard"));
  } else if (event.action === "close") {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});

// Background sync for offline data
self.addEventListener("sync", (event) => {
  console.log("Background sync event:", event.tag);

  if (event.tag === "work-completion") {
    event.waitUntil(syncWorkCompletion());
  } else if (event.tag === "quality-report") {
    event.waitUntil(syncQualityReports());
  }
});

// Sync work completion data when back online
async function syncWorkCompletion() {
  try {
    const db = await openDB();
    const pendingWork = await getAllPendingWork(db);

    for (const work of pendingWork) {
      try {
        const response = await fetch("/api/work/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(work.data),
        });

        if (response.ok) {
          await deletePendingWork(db, work.id);
          console.log("Synced work completion:", work.id);
        }
      } catch (error) {
        console.error("Failed to sync work completion:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Sync quality reports when back online
async function syncQualityReports() {
  try {
    const db = await openDB();
    const pendingReports = await getAllPendingQualityReports(db);

    for (const report of pendingReports) {
      try {
        const response = await fetch("/api/quality/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(report.data),
        });

        if (response.ok) {
          await deletePendingQualityReport(db, report.id);
          console.log("Synced quality report:", report.id);
        }
      } catch (error) {
        console.error("Failed to sync quality report:", error);
      }
    }
  } catch (error) {
    console.error("Quality report sync failed:", error);
  }
}

// IndexedDB helpers for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("GarmentERP", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("pendingWork")) {
        db.createObjectStore("pendingWork", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains("pendingQualityReports")) {
        db.createObjectStore("pendingQualityReports", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains("offlineData")) {
        db.createObjectStore("offlineData", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

function getAllPendingWork(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingWork"], "readonly");
    const store = transaction.objectStore("pendingWork");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingWork(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingWork"], "readwrite");
    const store = transaction.objectStore("pendingWork");
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function getAllPendingQualityReports(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingQualityReports"], "readonly");
    const store = transaction.objectStore("pendingQualityReports");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingQualityReport(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pendingQualityReports"], "readwrite");
    const store = transaction.objectStore("pendingQualityReports");
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "STORE_OFFLINE_DATA") {
    storeOfflineData(event.data.payload);
  }
});

// Store data for offline use
async function storeOfflineData(data) {
  try {
    const db = await openDB();
    const transaction = db.transaction(["offlineData"], "readwrite");
    const store = transaction.objectStore("offlineData");

    await store.put({
      id: data.type + "_" + Date.now(),
      type: data.type,
      data: data.data,
      timestamp: Date.now(),
    });

    console.log("Stored offline data:", data.type);
  } catch (error) {
    console.error("Failed to store offline data:", error);
  }
}

// Periodic background sync for real-time updates
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  try {
    // Sync pending work completions
    await syncWorkCompletion();

    // Sync pending quality reports
    await syncQualityReports();

    // Fetch latest work assignments if online
    if (navigator.onLine) {
      await fetchLatestWorkAssignments();
    }

    console.log("Background sync completed");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

async function fetchLatestWorkAssignments() {
  try {
    const response = await fetch("/api/work/assignments");
    if (response.ok) {
      const assignments = await response.json();

      // Store in cache for offline access
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        "/api/work/assignments",
        new Response(JSON.stringify(assignments))
      );

      // Send notification if new work is available
      if (assignments.length > 0) {
        await self.registration.showNotification("नयाँ काम उपलब्ध", {
          body: `${assignments.length} नयाँ काम असाइनमेन्ट उपलब्ध छ`,
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: "new-work",
          vibrate: [100, 50, 100],
          actions: [
            {
              action: "view",
              title: "हेर्नुहोस्",
            },
          ],
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch work assignments:", error);
  }
}

// Handle network status changes
self.addEventListener("online", () => {
  console.log("Network: Online");
  performBackgroundSync();
});

self.addEventListener("offline", () => {
  console.log("Network: Offline");
});

// Handle app updates
self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

// Custom notification scheduling
function scheduleNotification(data) {
  const { title, body, showTime, tag } = data;
  const now = Date.now();
  const delay = showTime - now;

  if (delay > 0) {
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag,
        vibrate: [100, 50, 100],
      });
    }, delay);
  }
}

// Efficiency monitoring and alerts
async function checkEfficiencyAlerts() {
  try {
    const response = await fetch("/api/efficiency/check");
    if (response.ok) {
      const alerts = await response.json();

      for (const alert of alerts) {
        if (alert.priority === "high") {
          await self.registration.showNotification("दक्षता अलर्ट", {
            body: alert.message,
            icon: "/icon-efficiency.png",
            badge: "/badge-warning.png",
            tag: "efficiency-alert",
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [
              {
                action: "view-details",
                title: "विवरण हेर्नुहोस्",
              },
              {
                action: "dismiss",
                title: "बेवास्ता गर्नुहोस्",
              },
            ],
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to check efficiency alerts:", error);
  }
}

// Quality check reminders
function scheduleQualityChecks() {
  // Schedule quality check reminders every 2 hours during work hours
  const workStart = 8 * 60 * 60 * 1000; // 8 AM
  const workEnd = 18 * 60 * 60 * 1000; // 6 PM
  const now = new Date();
  const currentTime =
    now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000;

  if (currentTime >= workStart && currentTime <= workEnd) {
    setTimeout(() => {
      self.registration.showNotification("गुणस्तर जाँच", {
        body: "गुणस्तर जाँचको समय भयो",
        icon: "/icon-quality.png",
        tag: "quality-reminder",
        vibrate: [100, 50, 100],
      });

      // Schedule next reminder
      scheduleQualityChecks();
    }, 2 * 60 * 60 * 1000); // 2 hours
  }
}

// Initialize scheduled tasks
scheduleQualityChecks();

// Performance monitoring
self.addEventListener("fetch", (event) => {
  const startTime = performance.now();

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        const endTime = performance.now();
        console.log(
          `Cache hit for ${event.request.url} - ${endTime - startTime}ms`
        );
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          const endTime = performance.now();
          console.log(
            `Network request for ${event.request.url} - ${
              endTime - startTime
            }ms`
          );

          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        })
        .catch((error) => {
          console.error("Fetch failed:", error);

          // Return offline page for navigation requests
          if (event.request.destination === "document") {
            return caches.match("/offline.html");
          }

          throw error;
        });
    })
  );
});

console.log("Service Worker loaded successfully");
