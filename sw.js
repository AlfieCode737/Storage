self.addEventListener('fetch', (event) => {
  // This basic version just lets the app work online
  event.respondWith(fetch(event.request));
});
