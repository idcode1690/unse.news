/* public/sw.js */
const SW_VERSION = 'v1.0.4';
const SHELL_CACHE = 'shell-' + SW_VERSION;
const ASSET_CACHE = 'assets-' + SW_VERSION;

// 앱 셸 프리캐시
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(SHELL_CACHE).then((c) =>
      c.addAll([
        '/',           // 루트
        '/index.html', // 안전하게 함께
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, ASSET_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 네비게이션은 항상 index.html 폴백(오프라인/404 방지)
async function handleNavigation(request) {
  try {
    const net = await fetch(request);
    if (net && net.ok) return net;
  } catch {}
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match('/');
  return cached || Response.error();
}

// 정적 에셋: stale-while-revalidate
async function handleAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const fetching = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || fetching || Response.error();
}

self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return; // 외부는 패스
  if (req.method !== 'GET') return;

  const accept = req.headers.get('accept') || '';
  const isNav = req.mode === 'navigate' || accept.includes('text/html');

  // 매니페스트/SW는 네트워크 우선
  if (url.pathname.endsWith('site.webmanifest') || url.pathname === '/sw.js') {
    evt.respondWith(fetch(req));
    return;
  }

  if (isNav) {
    evt.respondWith(handleNavigation(req));
    return;
  }

  if (/\.(js|css|svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|otf)$/.test(url.pathname)) {
    evt.respondWith(handleAsset(req));
  }
});

// (선택) 캐시 비우기 훅 — 필요할 때만 수동 호출
self.addEventListener('message', (evt) => {
  if (!evt.data) return;
  if (evt.data.type === 'CLEAR_ALL_CACHES') {
    evt.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});
