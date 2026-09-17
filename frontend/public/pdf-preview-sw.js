const CACHE_NAME = 'kcht-pdf-preview-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/kcht-pdf-preview/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const matched = await cache.match(event.request);
        if (matched) {
          return matched;
        }
        // Fallback: Tìm theo pathname nếu URL có query params hoặc hash
        const keys = await cache.keys();
        for (const req of keys) {
          const reqUrl = new URL(req.url);
          if (reqUrl.pathname === url.pathname) {
            const resp = await cache.match(req);
            if (resp) return resp;
          }
        }
        return new Response('File PDF không tồn tại trong bộ nhớ đệm', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
  }
});
