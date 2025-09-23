// public/sw.js
// SPA 친화 SW: 네비게이션은 index로 복원, 정적 자산은 immutable 캐시, 그 외는 네트워크 우선.
// 배포 때마다 버전만 올려 주세요.
const CACHE_VERSION = 'v1.4.0'; // ★ 배포마다 숫자/태그 변경
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',                // index.html (스코프 기준)
  './404.html',
  './favicon.svg',
  './site.webmanifest',
  './og-image.png'
];

const ONE_YEAR = 60 * 60 * 24 * 365;

// ---------- 설치 ----------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(PRECACHE_URLS);
    } catch {}
    await self.skipWaiting();
  })());
});

// ---------- 활성화 ----------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k.includes(CACHE_VERSION) ? null : caches.delete(k))));
    } catch {}
    await self.clients.claim();
    // ❌ 이전 코드: 여기서 postMessage({ type:'SW_UPDATED' })를 보내면
    //    페이지가 즉시 새로고침/캐시삭제 → Edge에서 루프가 생길 수 있음.
  })());
});

// ---------- 유틸 ----------
function isHttp(u) { return u.protocol === 'http:' || u.protocol === 'https:'; }
function sameOrigin(u) { try { return u.origin === self.location.origin; } catch { return false; } }
function isAsset(u) { return u.pathname.startsWith('/assets/'); }
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
    return resp;
  }
  return new Response('', { status: 504 });
}

// 네비게이션 처리: 네트워크 우선(index), 실패/404면 캐시된 index로 폴백
async function handleNavigate() {
  try {
    // 루트(index)로부터 새로 받아오기 (scope 기준 './'은 index.html)
    const net = await fetch('./', { cache: 'no-store' });
    if (net && net.ok) {
      // index.html은 캐시하지 않고 바로 반환(헤더만 no-store로 교체)
      return new Response(net.body, {
        status: net.status,
        statusText: net.statusText,
        headers: noStoreHeaders(net.headers)
      });
    }
  } catch {}
  // 네트워크 실패 또는 ok가 아닌 경우 → 프리캐시 index로 폴백
  const cache = await caches.open(PRECACHE);
  const cached = await cache.match('./');
  return cached || new Response('', { status: 504 });
}

// ---------- 페치 ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (!isHttp(url) || !sameOrigin(url)) return;

  // 1) SPA 네비게이션: 어떤 경로(/result/, /fortune/...)든 문서 진입이면 index로 복원
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigate());
    return;
  }

  // 2) 정적 번들 자산: 캐시-퍼스트(immutable)
  if (isAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      if (cached) return cached;
      const net = await fetch(req).catch(() => null);
      if (net && net.status === 200) {
        // 자산엔 immutable 헤더를 강제 적용
        const resp = new Response(net.body, {
          status: net.status,
          statusText: net.statusText,
          headers: immutableHeaders(net.headers)
        });
        try { await cache.put(req, resp.clone()); } catch {}
        return resp;
      }
      return new Response('', { status: 504 });
    })());
    return;
  }

  // 3) 그 외 요청: 네트워크 우선 + 성공 시 캐시 갱신, 실패 시 캐시 폴백
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    try {
      const net = await fetch(req);
      if (net && net.status === 200 && req.method === 'GET') {
        try { await cache.put(req, net.clone()); } catch {}
      }
      return net;
    } catch {
      const cached = await cache.match(req);
      return cached || new Response('', { status: 504 });
    }
  })());
});

// ---------- 메시지 ----------
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      // ❌ 예전처럼 여기서 SW_READY를 다시 브로드캐스트하지 않습니다.
      //    (페이지가 이 신호로 새로고침 → Edge에서 루프 유발 가능)
    })());
  }
});
