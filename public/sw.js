self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

// fetch handler vuoto: non cambia il comportamento, ma rende la PWA installabile
self.addEventListener("fetch", (event) => {});
