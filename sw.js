// public/sw.js
// /assets/* 정적 자산은 1년 immutable 캐시, 문서는 no-store.
// 자동 새로고침/메시지 전송 로직 제거 → 화면 깜빡임/사라짐 방지.
const CACHE_VERSION = 'v1.2.1';
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/404.html',
  '/favicon.svg',
  '/site.webmanifest',
  '/og-image.png'
];

const ONE_YEAR = 60 * 60 * 24 * 365;

function immutableHeaders(base = {}) {
  const h = new Headers(base);
  h.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  h.set('Vary', 'Origin');
  return h;
}
function noStoreHeaders(base = {}) {
  const h = new Headers(base);
  h.set('Cache-Control', 'no-store');
  return h;
}
function isHttp(u){ return u.protocol === 'http:' || u.protocol === 'https:'; }
function sameOrigin(u){ try { return u.origin === self.location.origin; } catch { return false; } }
function isAsset(u){ return /^\/assets\/.+\.(?:js|mjs|css|woff2?|ttf|eot|png|jpe?g|gif|webp|svg|ico|map)$/i.test(u.pathname); }
function isDoc(u){ return u.pathname === '/' || u.pathname === '/404.html'; }

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PRECACHE).then((c) => c.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === PRECACHE || k === RUNTIME) ? null : caches.delete(k)));
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  if (!isHttp(url)) return;
  if (!sameOrigin(url)) return;

  if (isAsset(url)) {
    e.respondWith(cacheFirstImmutable(req));
    return;
  }
  if (isDoc(url)) {
    e.respondWith(cacheFirstDoc(req));
    return;
  }
  e.respondWith(staleWhileRevalidate(req));
});

async function cacheFirstImmutable(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  if (hit) {
    return new Response(hit.body, { status: hit.status, statusText: hit.statusText, headers: immutableHeaders(hit.headers) });
    }
  const resp = await fetch(request).catch(() => null);
  if (!resp || resp.status >= 400) return resp || new Response('', { status: 504 });
  try { await cache.put(request, resp.clone()); } catch {}
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: immutableHeaders(resp.headers) });
}

async function cacheFirstDoc(request) {
  const hit = await caches.match(request);
  if (hit) return new Response(hit.body, { status: hit.status, statusText: hit.statusText, headers: noStoreHeaders(hit.headers) });
  const resp = await fetch(request).catch(() => null);
  if (!resp) return new Response('', { status: 504 });
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: noStoreHeaders(resp.headers) });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const net = fetch(request).then((res) => {
    if (res && res.status === 200) { try { cache.put(request, res.clone()); } catch {} }
    return res;
  }).catch(() => null);
  if (cached) return cached;
  const resp = await net;
  return resp || new Response('', { status: 504 });
}
