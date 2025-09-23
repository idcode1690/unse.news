// app/public/sw.js

// 즉시 활성화
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 네비게이션 프리로드 켜고, 이후 fetch에서 preloadResponse를 기다린다
  if (self.registration.navigationPreload) {
    event.waitUntil(self.registration.navigationPreload.enable());
  }
  event.waitUntil(self.clients.claim());

  // 클라이언트에게 준비됨 신호(SW_READY) 전달
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: 'SW_READY' });
    }
  })());
});

// 네비게이션 요청 처리: preloadResponse -> network -> offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith((async () => {
    // 1) 프리로드 응답
    try {
      const preload = await event.preloadResponse;
      if (preload) return preload;
    } catch { /* ignore */ }

    // 2) 네트워크 시도
    try {
      return await fetch(event.request);
    } catch {
      // 3) 오프라인 폴백(원하면 offline.html 캐시 사용)
      return new Response('<!doctype html><title>Offline</title><h1>오프라인입니다</h1>', {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        status: 503
      });
    }
  })());
});
