// 아덴힐 스마트 셔틀 PWA Service Worker
const CACHE_NAME = "arden-hill-pwa-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // 네트워크 우선 정책
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
