// app/src/components/common/Layout.jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

/** 내부 네비게이션: 항상 절대 경로로(해시 제거) 이동 */
function go(path = '/') {
  try {
    const url = new URL(path, window.location.origin);
    const clean = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    window.location.assign(clean);
  } catch {
    window.location.assign(path || '/');
  }
}

/** 천천히 움직이는 벡터 일러스트 (SVG) */
const GuideArt = () => (
  <div className="guide-art" aria-hidden="true">
    <svg
      viewBox="0 0 360 140"
      width="100%"
      height="140"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="잔잔한 하늘과 달, 천천히 일렁이는 파도"
    >
      <defs>
        {/* 하늘 그라디언트 */}
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B61FF" />
          <stop offset="70%" stopColor="#5ac8ff" />
          <stop offset="100%" stopColor="#c7f9cc" />
        </linearGradient>

        {/* 달 하이라이트 */}
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* 아주 약한 블러 */}
        <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* 하늘 배경 */}
      <rect x="0" y="0" width="360" height="140" fill="url(#sky)" rx="12" />

      {/* 달 */}
      <g className="moon">
        <circle cx="260" cy="44" r="16" fill="#fff" />
        <circle cx="260" cy="44" r="32" fill="url(#moonGlow)" />
      </g>

      {/* 별들 (느리게 반짝임) */}
      <g className="stars">
        <circle cx="40"  cy="26" r="1.6" fill="#fff" className="star s1" />
        <circle cx="95"  cy="18" r="1.2" fill="#fff" className="star s2" />
        <circle cx="140" cy="34" r="1.4" fill="#fff" className="star s3" />
        <circle cx="190" cy="14" r="1.8" fill="#fff" className="star s4" />
        <circle cx="310" cy="30" r="1.5" fill="#fff" className="star s5" />
        <circle cx="330" cy="68" r="1.3" fill="#fff" className="star s6" />
      </g>

      {/* 구름 (아주 느리게 부유) */}
      <g className="clouds" filter="url(#softBlur)">
        <path
          d="M40 62c10-10 28-12 40-4 8-8 26-8 34 0 8-5 18-4 24 2 7 7-2 16-24 16H52c-14 0-18-7-12-14Z"
          fill="rgba(255,255,255,.25)"
        />
        <path
          d="M210 60c10-8 24-10 34-3 6-6 18-6 24 0 6-4 14-3 18 1 6 6-2 13-18 13h-46c-11 0-14-6-8-11Z"
          fill="rgba(255,255,255,.18)"
        />
      </g>

      {/* 파도 (아주 느리게 상하 이동) */}
      <g className="waves">
        <path
          d="M0 110 Q 30 100 60 110 T 120 110 T 180 110 T 240 110 T 300 110 T 360 110 L 360 140 L 0 140 Z"
          fill="rgba(255,255,255,.65)"
        />
        <path
          d="M0 116 Q 36 108 72 116 T 144 116 T 216 116 T 288 116 T 360 116 L 360 140 L 0 140 Z"
          fill="rgba(255,255,255,.45)"
        />
        <path
          d="M0 122 Q 40 114 80 122 T 160 122 T 240 122 T 320 122 T 360 122 L 360 140 L 0 140 Z"
          fill="rgba(255,255,255,.28)"
        />
      </g>
    </svg>

    <style>{`
      .guide-art { display:flex; justify-content:center; margin-bottom:8px; }

      /* 천천히 */
      .moon { animation: floatY 16s ease-in-out infinite; }
      .clouds { animation: floatY 22s ease-in-out infinite reverse; }
      .waves path:nth-child(1) { animation: floatY 18s ease-in-out infinite; }
      .waves path:nth-child(2) { animation: floatY 20s ease-in-out infinite reverse; }
      .waves path:nth-child(3) { animation: floatY 24s ease-in-out infinite; }

      .star { animation: twinkle 5s ease-in-out infinite; opacity:.7; }
      .star.s2 { animation-duration: 4.4s; }
      .star.s3 { animation-duration: 5.6s; }
      .star.s4 { animation-duration: 6.0s; }
      .star.s5 { animation-duration: 4.8s; }
      .star.s6 { animation-duration: 5.2s; }

      @keyframes floatY {
        0%   { transform: translateY(0px); }
        50%  { transform: translateY(-4px); }
        100% { transform: translateY(0px); }
      }
      @keyframes twinkle {
        0%   { transform: scale(0.92); opacity: .40; }
        50%  { transform: scale(1.06); opacity: .98; }
        100% { transform: scale(0.92); opacity: .40; }
      }

      /* 모션 최소화 환경 존중 */
      @media (prefers-reduced-motion: reduce) {
        .moon, .clouds, .waves path, .star { animation: none !important; }
      }
    `}</style>
  </div>
);

/** 재사용 가능한 빈 상태(안내) 카드 — 기본 버튼만(정보 입력하기), 재시도 버튼 없음 */
export const EmptyStateCard = ({
  title = '안내',
  lines = [],
  primary = { label: '정보 입력하기', href: '/' },
  showArt = true,
  children,
}) => {
  return (
    <div className="card result" style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 28 }}>
      {showArt && <GuideArt />}
      <h2 style={{ margin: 6 }}>{title}</h2>

      {lines.map((t, i) => (
        <p key={i} style={{ color: 'var(--ink-soft)', margin: i === 0 ? '4px 0 0' : '2px 0 14px' }}>{t}</p>
      ))}

      {/* 기본 버튼: 정보 입력하기 (홈으로 이동) */}
      {primary && (
        primary.href ? (
          <a
            href={primary.href}
            className="btn-primary"
            role="button"
            aria-label={primary.label}
            onClick={(e) => { e.preventDefault(); go(primary.href); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                go(primary.href);
              }
            }}
          >
            {primary.label}
          </a>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={primary.onClick}
            aria-label={primary.label}
          >
            {primary.label}
          </button>
        )
      )}

      {children}
    </div>
  );
};

/** 페이지 공통 안내: 입력 정보 없을 때 사용하는 표준 안내 (모든 페이지에서 재사용) */
export const InputRequiredGuide = ({ homeHref='/' }) => (
  <EmptyStateCard
    title="입력 정보가 필요해요"
    lines={[
      '브라우저에 저장된 생년월일·시간 등의 입력이 없어 결과를 표시할 수 없습니다.',
      '아래 버튼을 눌러 홈에서 정보를 입력한 뒤 다시 확인해주세요.',
    ]}
    primary={{ label: '정보 입력하기', href: homeHref }}
  />
);

const Layout = ({ children, showHero = true, heroTitle, heroDescription }) => {
  return (
    <div className="app">
      <Header />
      <main>
        {showHero && (
          <section className="hero">
            <h1>{heroTitle}</h1>
            {heroDescription && <p>{heroDescription}</p>}
          </section>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
