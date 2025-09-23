// app/public/sw.js
// 서브경로 배포 호환 버전 (new URL 미사용)
const VERSION = 'v2.1.0';
const PRECACHE = `unse-precache-${VERSION}`;
const RUNTIME  = `unse-runtime-${VERSION}`;

// e.g. scope: "https://user.github.io/repo/" or "https://unse.news/"
let BASE = '/';
try {
  var scope = String(self.registration && self.registration.scope || '');
  var origin = String(self.location && self.location.origin || '');
  if (scope && origin && scope.indexOf(origin) === 0) {
    BASE = scope.slice(origin.length); // "/repo/" 또는 "/"
  }
  if (!BASE.endsWith('/')) BASE += '/';
} catch { BASE = '/'; }

// 사전 캐시할 파일 (BASE 기준)
const PRECACHE_URLS = [
  '',                 // index.html (BASE)
  '404.html',
  'favicon.svg',
  'site.webmanifest',
  'og-image.png'
].map((p) => BASE + p);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' })));
    self.skipWaiting?.();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === PRECACHE || k === RUNTIME) ? null : caches.delete(k)));
    self.clients?.claim?.();
  })());
});

function sameOrigin(url) {
  try { return url.origin === self.location.origin; } catch { return false; }
}
function isAsset(url) {
  return sameOrigin(url) && url.pathname.startsWith(BASE + 'assets/');
}
function isDoc(url) {
  return sameOrigin(url) && url.pathname.startsWith(BASE) && !isAsset(url);
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.status === 200) { try { await cache.put(req, res.clone()); } catch {} }
  return res;
}

async function networkFirstNoStore(req) {
  try {
    const res = await fetch(req);
    const h = new Headers(res.headers);
    h.set('Cache-Control', 'no-store');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  } catch {
    const cache = await caches.open(PRECACHE);
    return (await cache.match(BASE)) || (await cache.match(BASE + '404.html')) || new Response('', { status: 504 });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  try {
    const url = new URL(request.url);
    if (!sameOrigin(url)) return;

    if (isAsset(url)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    if (isDoc(url) && (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html'))) {
      event.respondWith(networkFirstNoStore(request));
      return;
    }
  } catch {
    // ignore malformed urls
  }
});
