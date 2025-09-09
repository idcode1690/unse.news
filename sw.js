// public/sw.js
// UnseNews Service Worker
// 목표: GitHub Pages의 10분 TTL을 우회해 /assets/* 정적 자산에 1년 immutable 캐시 적용
//       재방문/라우트 전환 가속 + Lighthouse "효율적인 캐시 수명" 경고 제거
//
// 전략
// - /assets/*  : Cache First + Stale-While-Revalidate, 응답 헤더를 1년 immutable로 재작성
// - 문서 계열 : /, /404.html 등은 프리캐시 후 Cache First (HTML은 no-store 유지)
// - 기타 GET  : Stale-While-Revalidate
//
// 새 빌드 시 아래 CACHE_VERSION을 올려 캐시 무효화.
const CACHE_VERSION = 'v1.1.0'; // ← 배포 시 숫자만 올리면 됨
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

// 프리캐시(문서/아이콘 정도만; 해시 자산은 런타임 캐싱)
const PRECACHE_URLS = [
  '/',           // dist/index.html
  '/404.html',   // GH Pages SPA 리다이렉트
  '/favicon.svg',
  '/site.webmanifest',
  '/og-image.png'
];

// ---------------- utils ----------------
function immutableHeaders(baseHeaders = {}) {
  const h = new Headers(baseHeaders);
  h.set('Cache-Control', 'public, max-age=31536000, immutable');
  h.set('Vary', 'Origin'); // 안전
  return h;
}
function noStoreHeaders(baseHeaders = {}) {
  const h = new Headers(baseHeaders);
  h.set('Cache-Control', 'no-store');
  return h;
}
function isAsset(url) {
  // 정적 해시 파일: js/css/font/image 등
  return /^\/assets\/.+\.(?:js|css|mjs|woff2?|ttf|eot|png|jpg|jpeg|gif|webp|svg|ico|map)$/i.test(url.pathname);
}
function isDoc(url) {
  return url.pathname === '/' || url.pathname === '/404.html';
}

// --------------- install ---------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// --------------- activate ---------------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k === PRECACHE || k === RUNTIME) ? null : caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// --------------- fetch ---------------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // /assets/* : Cache First + 헤더 오버라이드(1y immutable)
  if (isAsset(url)) {
    event.respondWith(cacheFirstImmutable(req));
    return;
  }

  // 프리캐시 문서 : Cache First (문서는 항상 no-store 헤더로 응답)
  if (isDoc(url)) {
    event.respondWith(cacheFirstDoc(req));
    return;
  }

  // 그 외 : SWR
  event.respondWith(staleWhileRevalidate(req));
});

// ---- strategies ----
async function cacheFirstImmutable(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  if (hit) {
    // 캐시 히트 시에도 immutable 헤더로 래핑해서 반환
    return new Response(hit.body, {
      status: hit.status,
      statusText: hit.statusText,
      headers: immutableHeaders(hit.headers),
    });
  }

  // 네트워크
  const resp = await fetch(request).catch(() => null);
  if (!resp || resp.status >= 400) {
    return resp || new Response('', { status: 504 });
  }

  // 캐시에 저장
  cache.put(request, resp.clone());

  // 1년 immutable 헤더로 재작성
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
      headers: noStoreHeaders(hit.headers), // 문서는 no-store 유지
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
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  }).catch(() => null);

  if (cached) return cached;
  const net = await netPromise;
  return net || new Response('', { status: 504 });
}
