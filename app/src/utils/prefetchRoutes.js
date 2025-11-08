// app/src/utils/prefetchRoutes.js

// 페이지 청크를 경로(pathname) 기준으로 프리패치 (끝 슬래시 없이 사용)
// App에서는 절대 경로(/result 등)를 쓰므로 여기도 동일하게 정규화합니다.
const routeLoaders = {
  '/result':  () => import('../pages/ResultPage.jsx'),
  '/fortune': () => import('../pages/FortunePage.jsx'),
  '/lotto':   () => import('../pages/LottoPage.jsx'),
  '/compat':  () => import('../pages/CompatPage.jsx'),
  '/ask':     () => import('../pages/AskFortunePage.jsx'),
};

// 중복 프리패치 방지용
const inFlight = new Map();

function normalize(pathname) {
  if (typeof pathname !== 'string') return '';
  let p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // 루트('/') 제외하고 끝 슬래시 제거
  p = p.length > 1 ? p.replace(/\/+$/, '') : '/';
  return p;
}

export async function prefetchRoute(pathname) {
  const key = normalize(pathname);
  const loader = routeLoaders[key];
  if (!loader) return;

  // 이미 진행/완료된 프리패치면 재요청 방지
  if (inFlight.has(key)) {
    try { await inFlight.get(key); } catch {}
    return;
  }
  const p = Promise.resolve().then(() => loader());
  inFlight.set(key, p);
  try { await p; } catch { /* 무시 */ }
  // 완료 후에도 inFlight에 보존해서 다시 호출되어도 네트워크 작업 안 하도록 유지
}

export function prefetchAllIdle() {
  const work = () => {
    Object.keys(routeLoaders).forEach((key) => {
      try { prefetchRoute(key); } catch {}
    });
  };
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(work, { timeout: 1500 });
  } else {
    setTimeout(work, 0);
  }
}
