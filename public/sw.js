// Minimal service worker — enough to enable PWA install prompts.
// Keeps the app fully dynamic (no aggressive caching of app shell to avoid staleness).

const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("fm-v1").then((cache) => cache.addAll([OFFLINE_URL]).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    fetch(req).catch(async () => {
      if (req.mode === "navigate") {
        const cache = await caches.open("fm-v1");
        const offline = await cache.match(OFFLINE_URL);
        if (offline) return offline;
      }
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })
  );
});
