// app/src/components/common/Header.jsx
import React, { useEffect, useRef, useState } from 'react';
import { prefetchRoute } from '../../utils/prefetchRoutes';

/**
 * 헤더/모바일 드로어
 * - 메뉴 링크를 절대경로로 고정하고 끝의 슬래시를 제거(/result 형태)
 * - inert 속성은 문자열로만 전달(React 경고 방지)
 * - 모든 내비게이션은 location.assign으로 처리(해시/중첩 경로 방지)
 */
const Header = () => {
  const [open, setOpen] = useState(false);
  const hamRef = useRef(null);
  const firstLinkRef = useRef(null);
  const overlayRef = useRef(null);
  const drawerRef = useRef(null);

  // 경로 정규화: 루트(/)만 예외로 두고, 끝 슬래시 제거
  const normalizePath = (p) => {
    if (!p || p === '/') return '/';
    return ('/' + String(p).replace(/^\/+/, '')).replace(/\/+$/, '');
  };

  const close = () => {
    try {
      const ae = document.activeElement;
      if (ae && drawerRef.current && drawerRef.current.contains(ae)) {
        ae.blur?.();
      }
    } catch {}
    setOpen(false);
    setTimeout(() => hamRef.current?.focus(), 0);
  };

  const toggle = () => (open ? close() : setOpen(true));

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const b = document.body;
    if (open) {
      b.classList.add('scroll-lock');
      setTimeout(() => firstLinkRef.current?.focus(), 0);
    } else {
      b.classList.remove('scroll-lock');
    }
    return () => b.classList.remove('scroll-lock');
  }, [open]);

  // 메뉴(끝 슬래시 없음)
  const menu = [
    { label: '홈',         href: '/' },
    { label: '사주팔자',   href: '/result' },
    { label: '오늘의 운세', href: '/fortune' },
    { label: '로또운세',   href: '/lotto' },
    { label: '궁합',       href: '/compat' },
    { label: '질문 풀이',  href: '/ask' },
  ];

  // 절대 이동 보장(해시 미사용)
  const go = (rawPath) => {
    const path = normalizePath(rawPath);
    try { prefetchRoute(path); } catch {}
    try {
      const current = normalizePath(window.location.pathname);
      if (current !== path) {
        window.location.assign(path);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        close();
      }
    } catch {
      window.location.href = path;
    }
  };

  // 링크 클릭 핸들러: 새 탭/중간클릭/수정키는 기본 동작 유지
  const handleLinkClick = (e, rawPath, { closeDrawer } = { closeDrawer: false }) => {
    if (e.button === 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (closeDrawer) close();
    go(rawPath);
  };

  return (
    <>
      <header className="site-header">
        <div className="navbar">
          <a
            className="brand"
            href="/"
            onClick={(e) => handleLinkClick(e, '/', { closeDrawer: false })}
          >
            <span className="logo" aria-hidden>運</span>
            <span className="brand-text">운세 뉴스</span>
          </a>

          {/* 데스크탑 메뉴 */}
          <ul className="menu-desktop" aria-label="주 메뉴">
            {menu.map((m) => {
              const href = normalizePath(m.href);
              return (
                <li key={href} className="menu-desktop__item">
                  <a
                    className="menu-desktop__link"
                    href={href}                 // ← 속성 자체도 /result 형태로 보장
                    onMouseEnter={() => prefetchRoute(href)}
                    onTouchStart={() => prefetchRoute(href)}
                    onClick={(e) => handleLinkClick(e, href, { closeDrawer: false })}
                  >
                    {m.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* 모바일 햄버거 */}
          <button
            ref={hamRef}
            type="button"
            className={`hamburger ${open ? 'is-open' : ''}`}
            aria-label={open ? '모바일 메뉴 닫기' : '모바일 메뉴 열기'}
            aria-controls="mobile-drawer"
            aria-expanded={open}
            onClick={toggle}
          >
            <svg className="hamburger__icon" viewBox="0 0 24 24" aria-hidden focusable="false">
              <path className="line top" d="M3 6.5h18" />
              <path className="line middle" d="M3 12h18" />
              <path className="line bottom" d="M3 17.5h18" />
            </svg>
          </button>
        </div>
      </header>

      {/* 오버레이 */}
      <button
        ref={overlayRef}
        type="button"
        className={`drawer-overlay ${open ? 'is-visible' : ''}`}
        tabIndex={-1}
        onClick={close}
        aria-label="배경 닫기"
      />

      {/* 좌측 드로어 */}
      <aside
        ref={drawerRef}
        id="mobile-drawer"
        className={`drawer ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        aria-label="모바일 메뉴"
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        {...(!open ? { inert: '' } : {})}
      >
        <div className="drawer__header">
          <strong className="drawer__title">메뉴</strong>
          <button
            type="button"
            className="drawer__close"
            onClick={close}
            aria-label="메뉴 닫기"
            tabIndex={open ? 0 : -1}
            aria-disabled={!open}
          >
            ✕
          </button>
        </div>
        <nav className="drawer__body">
          {menu.map((m, i) => {
            const href = normalizePath(m.href);
            return (
              <a
                key={href}
                ref={i === 0 ? firstLinkRef : undefined}
                href={href}                 // ← /result 형식(끝 슬래시 없음)
                className="drawer__link"
                onMouseEnter={() => prefetchRoute(href)}
                onTouchStart={() => prefetchRoute(href)}
                onClick={(e) => handleLinkClick(e, href, { closeDrawer: true })}
                tabIndex={open ? 0 : -1}
                aria-disabled={!open}
              >
                {m.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <style>{`
        .scroll-lock { overflow: hidden; }

        .site-header{
          position: sticky; top: 0; z-index: 1000;
          background: rgba(255,255,255,.9);
          backdrop-filter: saturate(140%) blur(8px);
          border-bottom: 1px solid #eee;
        }
        .navbar{
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
        }
        .brand{ display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; }
        .logo{
          width: 32px; height: 32px; border-radius: 10px;
          display: grid; place-items: center;
          background: #111; color: #fff; font-weight: 800; font-size: 14px;
          border: 1px solid #e6e6e6; box-shadow: 0 2px 10px rgba(0,0,0,.06);
        }
        .brand-text{ font-weight: 800; letter-spacing: -0.02em; }

        .menu-desktop{ display: none; gap: 20px; align-items: center; margin: 0; padding: 0; list-style: none; }
        .menu-desktop__item{ list-style: none; }
        .menu-desktop__link{
          display: inline-block; padding: 8px 6px; border-radius: 10px; text-decoration: none; color: inherit;
        }
        .menu-desktop__link:hover{ background: rgba(0,0,0,.05); }

        .hamburger{
          display: inline-grid; place-items: center;
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #e6e6e6; background: #fff; color: #111;
        }
        .hamburger:focus-visible{ outline: 2px solid #94a3b8; outline-offset: 2px; }

        .hamburger__icon{ width: 22px; height: 22px; display: block; }
        .hamburger .line{
          stroke: currentColor; stroke-width: 2.2; stroke-linecap: round;
          transform-origin: 12px 12px; transition: transform .25s ease, opacity .2s ease, stroke .2s ease;
        }
        .hamburger:hover .line{ stroke: #0f172a; }
        .hamburger:active .line{ stroke-width: 2.5; }

        .hamburger.is-open .line.top    { transform: translateY(5.5px) rotate(45deg); }
        .hamburger.is-open .line.middle { opacity: 0; transform: scaleX(0.2); }
        .hamburger.is-open .line.bottom { transform: translateY(-5.5px) rotate(-45deg); }

        .drawer-overlay{
          position: fixed; inset: 0; background: rgba(0,0,0,.25);
          opacity: 0; pointer-events: none; transition: opacity .2s ease; z-index: 1200;
        }
        .drawer-overlay.is-visible{ opacity: 1; pointer-events: auto; }

        .drawer{
          position: fixed; top: 0; bottom: 0; left: 0;
          width: 82vw; max-width: 320px; background: #fff;
          transform: translateX(-100%); transition: transform .25s ease; z-index: 1300;
          display: flex; flex-direction: column; box-shadow: 8px 0 24px rgba(0,0,0,.12);
        }
        .drawer.is-open{ transform: translateX(0); }
        .drawer__header{
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid #eee;
        }
        .drawer__title{ font-weight: 700; }
        .drawer__close{
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e6e6e6; background: #fff;
        }
        .drawer__body{ padding: 10px; overflow: auto; }
        .drawer__link{
          display: block; padding: 12px 12px; border-radius: 10px; color: #111; text-decoration: none;
        }
        .drawer__link:hover{ background: rgba(0,0,0,.05); }

        @media (min-width: 920px){
          .menu-desktop{ display: flex; }
          .hamburger{ display: none; }
          .drawer, .drawer-overlay{ display: none; }
        }
      `}</style>
    </>
  );
};

export default Header;
