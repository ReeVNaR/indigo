const CACHE_VERSION = 'v1';
const SHELL_CACHE = `indigo-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `indigo-runtime-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
];

const isSameOrigin = (url) => url.origin === self.location.origin;

async function cacheResponse(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('indigo-') && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        await cacheResponse(SHELL_CACHE, request, networkResponse.clone());
        return networkResponse;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        return (
          (await cache.match(request, { ignoreSearch: true })) ||
          (await cache.match('/dashboard')) ||
          (await cache.match('/'))
        );
      }
    })());
    return;
  }

  if (!isSameOrigin(url)) return;

  const isStaticAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image/');

  if (!isStaticAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(request);
          await cache.put(request, fresh.clone());
        } catch {
          // Ignore refresh failures while offline.
        }
      })());
      return cached;
    }

    try {
      const fresh = await fetch(request);
      await cache.put(request, fresh.clone());
      return fresh;
    } catch {
      return cached;
    }
  })());
});
