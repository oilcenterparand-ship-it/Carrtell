const CACHE_NAME = 'carrtell-pwa-v4';
const NAVIGATION_FALLBACKS = ['/', '/driver/login', '/driver/dashboard', '/manifest.webmanifest', '/driver.webmanifest'];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isCacheableStaticResponse(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return false;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (request.destination === 'script') return /javascript|ecmascript|wasm/.test(contentType);
  if (request.destination === 'style') return contentType.includes('text/css');
  if (request.destination === 'image') return contentType.startsWith('image/');
  if (request.destination === 'font') return contentType.includes('font') || contentType.includes('application/octet-stream');
  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(NAVIGATION_FALLBACKS)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || '/driver/dashboard';
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        await client.navigate(target).catch(() => undefined);
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;

  if (request.mode === 'navigate') {
    const driverNavigation = url.pathname.startsWith('/driver/');
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || (driverNavigation ? await caches.match('/driver/login') : await caches.match('/')) || Response.error()));
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(fetch(request).then((response) => {
      if (isCacheableStaticResponse(request, response)) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (!cached || !isCacheableStaticResponse(request, cached)) return Response.error();
      return cached;
    }));
  }
});
