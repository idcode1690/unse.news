// app/public/sw.js
// 서브경로 배포 호환 버전: BASE = self.location 기준
const VERSION = 'v2.0.0';
const PRECACHE = `unse-precache-${VERSION}`;
const RUNTIME  = `unse-runtime-${VERSION}`;

// e.g. '/' or '/unsenews/'
const BASE = new URL('./', self.location).pathname;

// 사전 캐시할 문서/아이콘 (BASE 기준 상대 경로)
const PRECACHE_URLS = [
  '',                 // BASE 자체 (index)
  '404.html',
  'favicon.svg',
  'site.webmanifest',
  'og-image.png'
].map(p => BASE + p);

const ONE_YEAR = 60 * 60 * 24 * 365;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS.map(u => new Request(u, { cache: 'reload' })));
    self.skipWaiting?.();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === PRECACHE || k === RUNTIME) ? null : caches.delete(k)));
    self.clients?.claim?.();
  })());
});

// utils
function sameOrigin(u) { return u.origin === self.location.origin; }
function isAsset(u)    { return sameOrigin(u) && u.pathname.startsWith(BASE + 'assets/'); }
function isDoc(u)      { return sameOrigin(u) && u.pathname.startsWith(BASE) && !isAsset(u); }

async function cacheFirstImmutable(req) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  try { if (res && res.status === 200) await cache.put(req, res.clone()); } catch {}
  return res;
}

async function networkFirstNoStore(req) {
  try {
    const res = await fetch(req);
    // 문서는 no-store로 돌려 캐시 축적 방지
    const h = new Headers(res.headers);
    h.set('Cache-Control', 'no-store');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  } catch {
    // 오프라인 대체: BASE(index) 또는 404
    const cache = await caches.open(PRECACHE);
    return (await cache.match(BASE)) || (await cache.match(BASE + '404.html')) || new Response('', { status: 504 });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (!sameOrigin(url)) return; // 외부 리소스는 패스

  // 정적 자산은 캐시우선(immutable)
  if (isAsset(url)) {
    event.respondWith(cacheFirstImmutable(request));
    return;
  }

  // 문서(페이지 네비게이션)
  if (isDoc(url) && (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(networkFirstNoStore(request));
    return;
  }

  // 그 외는 기본 네트워크
});
