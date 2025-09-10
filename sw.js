// public/sw.js
// /assets/* 정적 자산에 장기 캐시(1년 immutable) 적용.
// 비 http/https, 교차출처, 확장 스킴 요청은 무시.
// HTML 문서는 no-store 유지.
const CACHE_VERSION = 'v1.1.2'; // ← 캐시 갱신 시 숫자만 올리세요
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/404.html',
  '/favicon.svg',
  '/site.webmanifest',
  '/og-image.png'
];

// helpers
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
function isHttp(url){ return url.protocol === 'http:' || url.protocol === 'https:'; }
function sameOrigin(url){ try{ return url.origin === self.location.origin; } catch { return false; } }
function isAsset(url){ return /^\/assets\/.+\.(?:js|mjs|css|woff2?|ttf|eot|png|jpe?g|gif|webp|svg|ico)$/i.test(url.pathname); }
function isDoc(url){ return url.pathname === '/' || url.pathname === '/404.html'; }

// install
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PRECACHE).then((c) => c.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

// activate
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === PRECACHE || k === RUNTIME) ? null : caches.delete(k)));
    await self.clients.claim();
  })());
});

// fetch
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // data:, chrome-extension:, blob: 등은 무시
  if (!isHttp(url)) return;
  // 교차출처 무시(필요 시 화이트리스트 사용)
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

// strategies
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
