// app/src/App.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Layout from './components/common/Layout';
import './styles/global.css';

// 페이지 정적 import
import HomePage from './pages/HomePage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import FortunePage from './pages/FortunePage.jsx';
import LottoPage from './pages/LottoPage.jsx';
import CompatPage from './pages/CompatPage.jsx';
import AskFortunePage from './pages/AskFortunePage.jsx';

// 현재 경로 → 페이지키
function parseRoute() {
  // 경로 기반(절대) 우선
  const raw = location.pathname || '/';
  // 끝 슬래시 제거(루트 제외), /index.html 은 / 로 처리
  const path =
    raw === '/index.html'
      ? '/'
      : (raw.replace(/\/+$/, '') || '/');

  if (path === '/') return 'home';
  if (path === '/result')  return 'result';
  if (path === '/fortune') return 'fortune';
  if (path === '/lotto')   return 'lotto';
  if (path === '/compat')  return 'compat';
  if (path === '/ask')     return 'ask';

  // 해시 폴백(예전 북마크 호환) — 끝 슬래시 유무 모두 허용
  const h = (window.location.hash || '#').replace(/\/+$/, '');
  if (h.startsWith('#/result'))  return 'result';
  if (h.startsWith('#/fortune')) return 'fortune';
  if (h.startsWith('#/lotto'))   return 'lotto';
  if (h.startsWith('#/compat'))  return 'compat';
  if (h.startsWith('#/ask'))     return 'ask';

  return 'home';
}

function App() {
  const [currentPage, setCurrentPage] = useState(parseRoute());

  useEffect(() => {
    const onChange = () => setCurrentPage(parseRoute());
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  // ✅ 항상 절대경로로 이동 (상대경로 사용 금지)
  const goto = useCallback((absPath) => {
    try {
      if (!absPath.startsWith('/')) throw new Error('absolute path required');
      // 끝 슬래시 제거(루트 제외)하여 /result 형태로 고정
      let clean = absPath.replace(/\/+$/, '');
      if (clean === '') clean = '/';
      location.href = clean;
    } catch {
      // 폴백: 해시 라우트
      const key = absPath.replace(/^\/+/, '').replace(/\/+$/, '');
      location.hash = key ? `#/${key}` : '#/';
    }
  }, []);

  return (
    <Layout showHero={currentPage === 'home'} heroTitle="정확한 사주 계산 · 24절기 반영">
      {currentPage === 'home'    && <HomePage onNavigateToResult={() => goto('/result')} />}
      {currentPage === 'result'  && <ResultPage onNavigateToHome={() => goto('/')} />}
      {currentPage === 'fortune' && <FortunePage />}
      {currentPage === 'lotto'   && <LottoPage />}
      {currentPage === 'compat'  && <CompatPage />}
      {currentPage === 'ask'     && <AskFortunePage />}
    </Layout>
  );
}

export default App;
