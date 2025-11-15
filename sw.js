// public/sw.js
// SPA 친화 SW: 네비게이션은 index로 복원, 정적 자산은 immutable 캐시, 그 외는 네트워크 우선.
// 배포 때마다 버전만 올려 주세요.
const CACHE_VERSION = 'v1.4.3'; // ★ 배포마다 숫자/태그 변경
const PRECACHE = `unse-precache-${CACHE_VERSION}`;
const RUNTIME  = `unse-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',                // index.html (스코프 기준)
  './404.html',
  './favicon.svg',
  './site.webmanifest',
  './og-image.png',
  // 📌 RSS/Sitemap/Robots를 정적 제공 (메인으로 리다이렉트되는 문제 방지)
  './rss.xml',
  './sitemap.xml',
  './robots.txt'
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
    // ❌ 여기서 postMessage로 새로고침 유도하지 않음 (Edge 무한루프 방지)
  })());
});

// ---------- 유틸 ----------
function isHttp(u) { return u.protocol === 'http:' || u.protocol === 'https:'; }
function sameOrigin(u) { try { return u.origin === self.location.origin; } catch { return false; } }
function isAsset(u) { return u.pathname.startsWith('/assets/'); }
function isXmlOrSpecial(u) {
  // rss/sitemap/robots/webmanifest 등은 네비게이션이어도 index로 돌리지 않음
  return (
    /\.xml$/i.test(u.pathname) ||
    /\/robots\.txt$/i.test(u.pathname) ||
    /\/site\.webmanifest$/i.test(u.pathname)
  );
}
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

// 네비게이션 처리: 네트워크 우선(index), 실패 시 캐시된 index로 폴백
async function handleNavigate() {
  try {
    const net = await fetch('./', { cache: 'no-store' }); // scope 기준 './' → index.html
    if (net) {
      // index.html은 캐시하지 않고 바로 반환(헤더만 no-store로 교체)
      return new Response(net.body, {
        status: net.status,
        statusText: net.statusText,
        headers: noStoreHeaders(net.headers)
      });
    }
  } catch {}
  // 네트워크 실패 → 프리캐시 index로 폴백
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

  // 0) XML/robots/webmanifest는 네비게이션이어도 원본으로 응답 (index로 복원 금지)
  if (isXmlOrSpecial(url)) {
    event.respondWith((async () => {
      // 네트워크 우선, 실패 시 프리캐시 폴백
      try {
        const net = await fetch(req, { cache: 'no-store' });
        if (net) return net; // ok 여부와 무관히 서버 응답 그대로
      } catch {}
      const cache = await caches.open(PRECACHE);
      const key = url.pathname.replace(/^\//, './'); // '/rss.xml' → './rss.xml'
      const cached = await cache.match(key);
      return cached || new Response('', { status: 504 });
    })());
    return;
  }

  // 1) SPA 네비게이션: 어떤 경로(/result/, /fortune/...)든 문서 진입이면 index로 복원
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigate());
    return;
  }

  // 2) 정적 번들 자산: Stale-While-Revalidate + immutable 캐시
  if (isAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      if (cached) {
        // 백그라운드 재검증
        event.waitUntil((async () => {
          try {
            const net = await fetch(req);
            if (net && net.ok) {
              const resp = new Response(net.body, {
                status: net.status,
                statusText: net.statusText,
                headers: immutableHeaders(net.headers)
              });
              try { await cache.put(req, resp.clone()); } catch {}
            }
          } catch {}
        })());
        return cached;
      }
      // 캐시 없음 → 네트워크 시도
      try {
        const net = await fetch(req);
        if (net && net.ok) {
          const resp = new Response(net.body, {
            status: net.status,
            statusText: net.statusText,
            headers: immutableHeaders(net.headers)
          });
          try { await cache.put(req, resp.clone()); } catch {}
          return resp;
        }
        // ok가 아니면(예: 404) 서버 응답 그대로 반환, 캐시는 건너뜀
        return net;
      } catch {
        // 네트워크 자체 실패 → 504
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  // 3) 그 외 요청: 네트워크 우선 + 성공 시 캐시 갱신, 실패 시 캐시 폴백
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME);
    try {
      const net = await fetch(req);
      if (net && net.ok && req.method === 'GET') {
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
      // ❌ 여기서 SW_READY/SW_UPDATED 브로드캐스트/새로고침 유도하지 않음 (루프 방지)
    })());
  }
});
