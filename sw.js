// public/sw.js
// UnseNews Service Worker
// - /assets/* : Cache First + immutable 헤더로 재응답
// - 문서(/, /404.html) : 프리캐시 + Cache First (문서는 no-store)
// - 기타 GET : Stale-While-Revalidate
// - ⚠️ 비 http/https 요청(data:, chrome-extension:, blob:, etc.)은 즉시 패스
const CACHE_VERSION = 'v1.1.1';
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/404.html',
  '/favicon.svg',
  '/site.webmanifest',
  '/og-image.png'
];

// ---------- helpers ----------
function immutableHeaders(baseHeaders = {}) {
  const h = new Headers(baseHeaders);
  h.set('Cache-Control', 'public, max-age=31536000, immutable');
  h.set('Vary', 'Origin');
  return h;
}
function noStoreHeaders(baseHeaders = {}) {
  const h = new Headers(baseHeaders);
  h.set('Cache-Control', 'no-store');
  return h;
}
function isHttpLike(url) {
  return url.protocol === 'http:' || url.protocol === 'https:';
}
function isSameOrigin(url) {
  try { return url.origin === self.location.origin; }
  catch { return false; }
}
function isAsset(url) {
  return /^\/assets\/.+\.(?:js|mjs|css|woff2?|ttf|eot|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
}
function isDoc(url) {
  return url.pathname === '/' || url.pathname === '/404.html';
}

// ---------- install ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ---------- activate ----------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k === PRECACHE || k === RUNTIME) ? null : caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// ---------- fetch ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // 🚫 data:, chrome-extension:, blob:, file: 등 비 HTTP/HTTPS 는 패스
  if (!isHttpLike(url)) return;

  // 🚫 교차 출처는 캐시 대상에서 제외(필요 시 화이트리스트로 선별)
  if (!isSameOrigin(url)) return;

  // /assets/* : Cache First + immutable 헤더
  if (isAsset(url)) {
    event.respondWith(cacheFirstImmutable(req));
    return;
  }

  // 문서(/, /404.html) : Cache First + no-store
  if (isDoc(url)) {
    event.respondWith(cacheFirstDoc(req));
    return;
  }

  // 그 외 : SWR
  event.respondWith(staleWhileRevalidate(req));
});

// ---------- strategies ----------
async function cacheFirstImmutable(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  if (hit) {
    return new Response(hit.body, {
      status: hit.status,
      statusText: hit.statusText,
      headers: immutableHeaders(hit.headers),
    });
  }
  const resp = await fetch(request).catch(() => null);
  if (!resp || resp.status >= 400) {
    return resp || new Response('', { status: 504 });
  }
  try { await cache.put(request, resp.clone()); } catch {}
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: immutableHeaders(resp.headers),
  });
}

async function cacheFirstDoc(request) {
  const hit = await caches.match(request);
  if (hit) {
    return new Response(hit.body, {
      status: hit.status,
      statusText: hit.statusText,
      headers: noStoreHeaders(hit.headers),
    });
  }
  const resp = await fetch(request).catch(() => null);
  if (!resp) return new Response('', { status: 504 });
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: noStoreHeaders(resp.headers),
  });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);

  const netPromise = fetch(request).then((res) => {
    if (res && res.status === 200) { try { cache.put(request, res.clone()); } catch {} }
    return res;
  }).catch(() => null);

  if (cached) return cached;
  const net = await netPromise;
  return net || new Response('', { status: 504 });
}
