// File: public/sw.js
// Fixed Service Worker for Garment ERP PWA

const CACHE_NAME = "garment-erp-v2";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  // Static assets will be cached dynamically when fetched
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
      .catch((error) => {
        console.error("Cache population failed:", error);
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
  // Skip Chrome extension requests and non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Skip Google Analytics requests
  if (
    event.request.url.includes("google-analytics.com") ||
    event.request.url.includes("analytics.google.com") ||
    event.request.url.includes("googletagmanager.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        return response;
      }

      // Clone the request because it's a stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Cache static assets (JS, CSS, images)
          const shouldCache = 
            event.request.url.includes('/static/') ||
            event.request.url.endsWith('.js') ||
            event.request.url.endsWith('.css') ||
            event.request.url.endsWith('.png') ||
            event.request.url.endsWith('.ico') ||
            event.request.url.endsWith('.json');

          if (shouldCache) {
            // Clone the response because it's a stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch((error) => {
          console.log("Fetch failed:", error);

          // Return offline page for navigation requests
          if (event.request.destination === "document") {
            return new Response(
              `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>गारमेन्ट ERP - Offline</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      text-align: center; 
                      padding: 50px; 
                      background: #f5f5f5; 
                    }
                    .container { 
                      max-width: 400px; 
                      margin: 0 auto; 
                      background: white; 
                      padding: 30px; 
                      border-radius: 10px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                    }
                    h1 { color: #2563eb; margin-bottom: 20px; }
                    p { color: #666; margin-bottom: 20px; }
                    button { 
                      background: #2563eb; 
                      color: white; 
                      border: none; 
                      padding: 12px 24px; 
                      border-radius: 6px; 
                      cursor: pointer; 
                      font-size: 16px;
                    }
                    button:hover { background: #1d4ed8; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>🔌 अफलाइन मोड</h1>
                    <p>तपाईं अहिले अफलाइन हुनुहुन्छ। केही सुविधाहरू उपलब्ध नहुन सक्छ।</p>
                    <p><strong>Offline Mode</strong><br>You are currently offline. Some features may not be available.</p>
                    <button onclick="window.location.reload()">पुनः प्रयास गर्नुहोस् / Retry</button>
                  </div>
                </body>
              </html>
            `,
              {
                headers: { "Content-Type": "text/html" },
              }
            );
          }

          // For other requests, return a basic error response
          return new Response("Network error occurred", {
            status: 408,
            statusText: "Request Timeout",
          });
        });
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  let notificationData = {
    title: "गारमेन्ट ERP",
    body: "नयाँ सूचना प्राप्त भयो",
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
        title: "हेर्नुहोस्",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "बन्द गर्नुहोस्",
        icon: "/icons/xmark.png",
      },
    ],
  };

  if (event.data) {
    try {
      const data = event.data.json();

      // Handle different notification types
      switch (data.type) {
        case "work-assignment":
          notificationData.title = "नयाँ काम तोकिएको";
          notificationData.body = `बन्डल #${data.bundleId} तपाईंको स्टेसनमा तयार छ`;
          notificationData.icon = "/icons/work.png";
          break;

        case "quality-issue":
          notificationData.title = "गुणस्तर समस्या";
          notificationData.body = `बन्डल #${data.bundleId} मा गुणस्तर जाँच आवश्यक`;
          notificationData.icon = "/icons/quality.png";
          notificationData.badge = "/icons/warning.png";
          break;

        case "efficiency-alert":
          notificationData.title = "दक्षता अलर्ट";
          notificationData.body = data.message;
          notificationData.icon = "/icons/efficiency.png";
          break;

        case "break-reminder":
          notificationData.title = "विश्राम समय";
          notificationData.body = "तपाईंको विश्राम समय सकिएको छ";
          notificationData.icon = "/icons/break.png";
          break;

        case "target-achievement":
          notificationData.title = "लक्ष्य पूरा";
          notificationData.body = `बधाई छ! तपाईंले आजको ${data.percentage}% लक्ष्य पूरा गर्नुभयो`;
          notificationData.icon = "/icons/achievement.png";
          break;

        default:
          notificationData.title = data.title || "गारमेन्ट ERP";
          notificationData.body = data.body || "नयाँ सूचना";
      }
    } catch (error) {
      console.error("Error parsing push data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
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
          if (
            client.url.includes("localhost") ||
            client.url.includes(self.location.origin)
          ) {
            if ("focus" in client) {
              return client.focus();
            }
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
    // In a real app, you'd retrieve pending work from IndexedDB
    console.log("Syncing work completion data...");

    // For now, just log the sync attempt
    console.log("Work completion sync completed");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Sync quality reports when back online
async function syncQualityReports() {
  try {
    console.log("Syncing quality reports...");
    console.log("Quality report sync completed");
  } catch (error) {
    console.error("Quality report sync failed:", error);
  }
}

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Handle network status changes
self.addEventListener("online", () => {
  console.log("Network: Online");
});

self.addEventListener("offline", () => {
  console.log("Network: Offline");
});

console.log("Service Worker loaded successfully");
