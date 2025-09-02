// public/sw.js - Basic Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Perform install steps
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Perform activate steps
});

self.addEventListener('fetch', (event) => {
  // Optional: Add caching or fetch handling here
  // For now, just pass through
  event.respondWith(fetch(event.request));
});
