// Service Worker for Push Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const options = {
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View",
        icon: "/favicon.ico",
      },
      {
        action: "close",
        title: "Close",
        icon: "/favicon.ico",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(self.registration.showNotification("Parish", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(self.clients.openWindow("/"));
  }
});

self.addEventListener("notificationclose", (event) => {});
