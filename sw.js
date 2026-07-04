const CACHE_NAME = 'shifa-v4';
const ASSETS = [
  './Shifa_App_TEST.html',
  './data.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;600;700&display=swap'
];

// Installation — mise en cache des ressources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(url => new Request(url, { mode: 'no-cors' })));
    }).then(() => self.skipWaiting())
  );
});

// Activation — suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first pour les ressources locales, network-first pour le reste
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ressources locales : cache first
  if (url.origin === self.location.origin || event.request.url.startsWith('https://fonts.')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('./Shifa_App_TEST.html'));
      })
    );
    return;
  }

  // Images Unsplash et autres — network avec fallback silencieux
  event.respondWith(
    fetch(event.request).catch(() => new Response('', { status: 408 }))
  );
});
