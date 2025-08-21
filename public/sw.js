// Service Worker for PWA & Push Notifications
const CACHE_NAME = "garment-erp-v1";
const urlsToCache = ["/", "/manifest.json"];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Only cache essential files that exist
        return cache.addAll(["/"]);
      })
      .catch((error) => {
        console.log("Cache failed:", error);
      })
  );
});

// Fetch Event - Offline Support
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If fetch succeeds, cache and return
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If fetch fails, try cache
        return caches.match(event.request);
      })
  );
});

// Push Event - Handle Push Notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "नयाँ सूचना आएको छ!",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification("गारमेन्ट ERP", options));
});

// Notification Click Event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
