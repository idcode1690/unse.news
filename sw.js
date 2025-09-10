// public/sw.js
// 목적: GitHub Pages 등 기본 TTL(10분) 환경에서 /assets/* 정적 자산을
//       1년 immutable 캐시로 서빙하여 Lighthouse "효율적인 캐시 수명" 해결.
//
// 전략:
//  - /assets/* : Cache First + 응답 헤더를 1년 immutable로 재작성
//  - 문서(/, /404.html) : Cache First + no-store
//  - 그 외 GET      : Stale-While-Revalidate
//  - 비 http/https, 교차출처 요청은 모두 무시
//
const CACHE_VERSION = 'v1.2.0'; // ← 새 배포마다 숫자 올리세요
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/404.html',
  '/favicon.svg',
  '/site.webmanifest',
  '/og-image.png',
];

// ---------- utils ----------
const ONE_YEAR = 60 * 60 * 24 * 365;

function immutableHeaders(baseHeaders = {}) {
  const h = new Headers(baseHeaders);
  h.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  h.set('Vary', 'Origin');
  return h;
}
function noStoreHeaders(baseHeaders = {}) {
  const h = new Headers(baseHeaders);
  h.set('Cache-Control', 'no-store');
  return h;
}
function isHttp(url){ return url.protocol === 'http:' || url.protocol === 'https:'; }
function sameOrigin(url){ try { return url.origin === self.location.origin; } catch { return false; } }
function isAsset(url){ return /^\/assets\/.+\.(?:js|mjs|css|woff2?|ttf|eot|png|jpe?g|gif|webp|svg|ico|map)$/i.test(url.pathname); }
function isDoc(url){ return url.pathname === '/' || url.pathname === '/404.html'; }

// ---------- install ----------
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PRECACHE).then((c) => c.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

// ---------- activate ----------
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k === PRECACHE || k === RUNTIME) ? null : caches.delete(k))
    );
    // navigation preload(선택): origin 서버 병행 요청 활성화
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();

    // 새 SW가 잡히면 모든 클라이언트에 "refresh" 신호(선택)
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'SW_READY' }));
  })());
});

// ---------- fetch ----------
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // data:, chrome-extension:, blob: 등은 무시
  if (!isHttp(url)) return;
  // 교차출처는 캐시 대상 제외(필요 시 화이트리스트 사용)
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
