// public/sw.js
const CACHE_VERSION = 'v1.3.1'; // ← 버전 업데이트
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './404.html',
  './favicon.svg',
  './site.webmanifest',
  './og-image.png',
  // ✅ XML/텍스트도 사전 캐시 (선택)
  './rss.xml',
  './sitemap.xml',
  './robots.txt'
];

const ONE_YEAR = 60 * 60 * 24 * 365;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(PRECACHE_URLS);
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k.includes(CACHE_VERSION) ? null : caches.delete(k))));
    } catch {}
    await self.clients.claim();
    const all = await self.clients.matchAll({ includeUncontrolled: true });
    for (const c of all) { try { c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }); } catch {} }
  })());
});

function isHttp(u){ return u.protocol === 'http:' || u.protocol === 'https:'; }
function sameOrigin(u){ try { return u.origin === self.location.origin; } catch { return false; } }
function isAsset(u){ return u.pathname.startsWith('/assets/'); }
function isDoc(u){ return u.pathname === '/' || u.pathname.endsWith('.html'); }

function immutableHeaders(h){ const out=new Headers(h); out.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`); return out; }
function noStoreHeaders(h){ const out=new Headers(h); out.set('Cache-Control','no-store'); return out; }

async function cacheFirstImmutable(request){
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const resp = await fetch(request).catch(() => null);
  if (resp && resp.status === 200) { try { await cache.put(request, resp.clone()); } catch {} }
  return resp || new Response('', { status: 504 });
}

async function cacheFirstDoc(request){
  try {
    const net = await fetch(request);
    return new Response(net.body, { status: net.status, statusText: net.statusText, headers: noStoreHeaders(net.headers) });
  } catch {
    const cache = await caches.open(PRECACHE);
    const cached = await cache.match('./');
    return cached || new Response('', { status: 504 });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  let url; try { url = new URL(req.url); } catch { return; }
  if (!isHttp(url) || !sameOrigin(url)) return;

  // XML/텍스트(정적 파일)는 자주 변하지 않으므로 캐시 우선
  if (url.pathname.endsWith('/rss.xml') || url.pathname.endsWith('/sitemap.xml') || url.pathname.endsWith('/robots.txt')) {
    event.respondWith(cacheFirstImmutable(req));
    return;
  }

  if (isAsset(url)) { event.respondWith(cacheFirstImmutable(req)); return; }
  if (isDoc(url))   { event.respondWith(cacheFirstDoc(req)); return; }

  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    try {
      const net = await fetch(req);
      if (net && net.status === 200 && req.method === 'GET') { try { cache.put(req, net.clone()); } catch {} }
      return net;
    } catch {
      const cached = await cache.match(req);
      return cached || new Response('', { status: 504 });
    }
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const all = await self.clients.matchAll({ includeUncontrolled: true });
      for (const c of all) { try { c.postMessage({ type: 'SW_READY' }); } catch {} }
    })());
  }
});
