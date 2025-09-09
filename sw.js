// public/sw.js
// UnseNews: 빠른 재방문을 위한 정적 자산 캐시(Service Worker)
// - /assets/* : Cache First + 백그라운드 갱신(SWR)
// - /, /404.html 등 프리캐시된 문서: Cache First
// - 기타 요청: Stale-While-Revalidate
// 캐시 버전만 올리면 이전 캐시가 정리됩니다.
const CACHE_VERSION = 'v1.0.0';
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',            // 루트(빌드 후 dist/index.html)
  '/404.html',    // GitHub Pages SPA 리다이렉트
  '/favicon.svg',
  '/site.webmanifest',
  '/og-image.png'
];

// ----- install: 프리캐시 -----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ----- activate: 이전 캐시 정리 -----
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key !== PRECACHE && key !== RUNTIME) return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

// ----- fetch: 캐시 전략 -----
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 해시된 정적 자산 → Cache First + SWR
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirstSWR(req));
    return;
  }

  // 프리캐시 문서 → Cache First
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req))
    );
    return;
  }

  // 그 외 → Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(req));
});

async function cacheFirstSWR(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  }).catch(() => null);

  return cached || network || new Response('', { status: 504 });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  }).catch(() => null);

  return cached || network || new Response('', { status: 504 });
}
