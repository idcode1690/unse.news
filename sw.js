// public/sw.js
// 정적 자산은 캐시, 문서는 네비게이션 친화적으로 처리.
// 배포 시 CACHE_VERSION을 자동으로 바꾸기 어렵다면, 최소한 이 값을 수동으로 올리세요.
const CACHE_VERSION = 'v1.3.0'; // ★ 배포마다 올리기
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './404.html',
  './favicon.svg',
  './site.webmanifest',
  './og-image.png'
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
      await Promise.all(
        keys.map((k) => (k.includes(CACHE_VERSION) ? null : caches.delete(k)))
      );
    } catch {}
    await self.clients.claim();

    // 모든 클라이언트에 갱신 알림
    const all = await self.clients.matchAll({ includeUncontrolled: true });
    for (const c of all) {
      try { c.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }); } catch {}
    }
  })());
});

// 외부 요청 필터
function isHttp(u) { return u.protocol === 'http:' || u.protocol === 'https:'; }
function sameOrigin(u) { try { return u.origin === self.location.origin; } catch { return false; } }
function isAsset(u) { return u.pathname.startsWith('/assets/'); }
function isDoc(u)   { return u.pathname === '/' || u.pathname.endsWith('.html'); }

function immutableHeaders(h) {
  const out = new Headers(h);
  out.set('Cache-Control', `public, max-age=${ONE_YEAR}, immutable`);
  return out;
}
function noStoreHeaders(h) {
  const out = new Headers(h);
  out.set('Cache-Control', 'no-store');
  return out;
}

async function cacheFirstImmutable(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const resp = await fetch(request).catch(() => null);
  if (resp && resp.status === 200) {
    try { await cache.put(request, resp.clone()); } catch {}
  }
  return resp || new Response('', { status: 504 });
}

async function cacheFirstDoc(request) {
  // 문서는 네비게이션에 중요 → 네트워크 우선, 실패 시 캐시
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
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (!isHttp(url) || !sameOrigin(url)) return;

  if (isAsset(url)) {
    event.respondWith(cacheFirstImmutable(req));
    return;
  }
  if (isDoc(url)) {
    event.respondWith(cacheFirstDoc(req));
    return;
  }

  // 그 외 요청은 네트워크 우선 + 캐시 보조
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    try {
      const net = await fetch(req);
      if (net && net.status === 200 && req.method === 'GET') {
        try { cache.put(req, net.clone()); } catch {}
      }
      return net;
    } catch {
      const cached = await cache.match(req);
      return cached || new Response('', { status: 504 });
    }
  })());
});

// ✅ 페이지에서 캐시 비우기 요청
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      // 다음 요청부터는 새 자산을 내려받도록 알림
      const all = await self.clients.matchAll({ includeUncontrolled: true });
      for (const c of all) {
        try { c.postMessage({ type: 'SW_READY' }); } catch {}
      }
    })());
  }
});
