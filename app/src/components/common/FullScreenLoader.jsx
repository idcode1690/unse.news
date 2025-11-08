import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 전면(Fullscreen) 로딩 오버레이
 * - show: true일 때 전체 화면을 덮는 로딩 화면
 * - title, message: 안내 텍스트
 * - API 로드 중(= show true) 모바일에서 짧은 햅틱을 주기적으로 발생
 *   * 단, 사용자 제스처가 있었을 때만 (브라우저 정책)
 *   * iOS Safari 등 미지원 기기는 자동 건너뜀
 */
export default function FullScreenLoader({
  show = false,
  title = '준비 중입니다…',
  message = '조금만 기다려 주세요.',
  respectReducedMotion = true,
  // 필요 시 강제 활성화 (테스트용). 기본은 false 유지 권장
  forceHaptics = false,
}) {
  /* ── 환경 판정 ─────────────────────────────────────────────── */
  const isVibrateSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (!respectReducedMotion) return;
    try {
      const mm = window.matchMedia('(prefers-reduced-motion: reduce)');
      const on = () => setReduceMotion(!!mm.matches);
      on();
      mm.addEventListener ? mm.addEventListener('change', on) : mm.addListener(on);
      return () => {
        mm.removeEventListener ? mm.removeEventListener('change', on) : mm.removeListener(on);
      };
    } catch {}
  }, [respectReducedMotion]);

  const isMobileish = useMemo(() => {
    try {
      return (
        forceHaptics ||
        navigator?.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
      );
    } catch {
      return !!forceHaptics;
    }
  }, [forceHaptics]);

  /* ── 사용자 제스처 언락 상태 ───────────────────────────────── */
  const [unlocked, setUnlocked] = useState(false);

  const hasActivation = () => {
    try {
      const ua = navigator.userActivation;
      return !!(ua?.isActive || ua?.hasBeenActive);
    } catch {
      return false;
    }
  };

  // show가 true로 바뀌는 즉시, 이미 activation이 있으면 곧바로 언락
  useEffect(() => {
    if (!show) return;
    if (hasActivation()) {
      // 마이크로태스크로 미세 타이밍 이슈 방지
      queueMicrotask(() => setUnlocked(true));
    }
  }, [show]);

  // 아직 언락이 안 되었으면 첫 사용자 제스처 때 언락
  useEffect(() => {
    if (!show || unlocked) return;
    const unlock = () => {
      setUnlocked(true);
    };
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true });
    window.addEventListener('touchstart', unlock, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      window.removeEventListener('touchstart', unlock, { capture: true });
    };
  }, [show, unlocked]);

  /* ── 진동 루프 ─────────────────────────────────────────────── */
  const loopRef = useRef(null);
  const prevShowRef = useRef(show);

  // 가장 호환성 좋은 짧은 진동
  const vibrateOnce = (msOrPattern = 20) => {
    if (!isVibrateSupported) return false;
    if (!unlocked && !hasActivation()) return false;
    if (reduceMotion && !forceHaptics) return false;

    try {
      // 일부 기기는 배열보다 단일값을 더 잘 수용
      const ok = navigator.vibrate(msOrPattern);
      if (ok) return true;
      // 단일값이 실패하면 짧은 배열 재시도
      if (Array.isArray(msOrPattern)) {
        return navigator.vibrate(20) || false;
      } else {
        return navigator.vibrate([20, 30, 20]) || false;
      }
    } catch {
      return false;
    }
  };

  const stopVibrate = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    // 언락 전에는 vibrate(0)도 호출 금지(경고 방지)
    if (isVibrateSupported && (unlocked || hasActivation()) && !(reduceMotion && !forceHaptics)) {
      try { navigator.vibrate(0); } catch {}
    }
  };

  // show/unlocked 상태에 따라 루프 관리
  useEffect(() => {
    const shouldRun = show && isMobileish && isVibrateSupported && (unlocked || hasActivation()) && !(reduceMotion && !forceHaptics);

    if (shouldRun) {
      // 즉시 한 번
      vibrateOnce(20);
      // 2초 간격 반복 (너무 잦으면 배터리/소음 문제)
      if (!loopRef.current) {
        loopRef.current = setInterval(() => {
          vibrateOnce(20);
        }, 2000);
      }
    } else {
      stopVibrate();
    }

    // show가 false로 바뀌는 순간 짧은 종료 햅틱(가능 환경에서만)
    if (prevShowRef.current && !show) {
      vibrateOnce(0);
      setTimeout(() => vibrateOnce([25, 35, 25]), 0);
    }
    prevShowRef.current = show;

    return () => {
      stopVibrate();
    };
  }, [show, isMobileish, isVibrateSupported, unlocked, reduceMotion, forceHaptics]);

  // 가시성 변경 시 루프 일시중지/재개
  useEffect(() => {
    if (!show) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        stopVibrate();
      } else if (show && (unlocked || hasActivation())) {
        // 다시 들어왔을 때 한 번 울리고 루프 재개
        vibrateOnce(20);
        if (!loopRef.current) {
          loopRef.current = setInterval(() => vibrateOnce(20), 2000);
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [show, unlocked]);

  // 안내 로그 (개발용)
  useEffect(() => {
    if (!show) return;
    if (!isVibrateSupported) {
      console.info('[FullScreenLoader] 이 환경은 navigator.vibrate를 지원하지 않습니다(iOS Safari 등).');
    }
  }, [show, isVibrateSupported]);

  if (!show) return null;

  return (
    <div role="status" aria-live="polite" className={`fs-loader ${reduceMotion ? 'reduce' : 'animate'}`}>
      <div className="fs-loader__inner">
        {/* 태양계 애니메이션 (디자인 그대로) */}
        <div className="solarsys" role="img" aria-label="로딩 중: 태양계 애니메이션">
          <div className="sun" aria-hidden="true" />
          <div className="orbit orbit--1" aria-hidden="true">
            <div className="planet planet--1" />
          </div>
          <div className="orbit orbit--2" aria-hidden="true">
            <div className="planet planet--2" />
          </div>
          <div className="orbit orbit--3" aria-hidden="true">
            <div className="planet planet--3" />
          </div>
        </div>

        <h3 className="fs-loader__title">{title}</h3>
        <p className="fs-loader__msg">{message}</p>

        {/* 상태 힌트(디자인 영향 없음, 필요시 제거 가능) */}
        <span style={{ marginTop: 2, fontSize: 11, opacity: .45, userSelect: 'none', display: 'block' }}>
          {isVibrateSupported
            ? (unlocked || hasActivation() ? '진동 활성화됨' : '화면을 한 번 터치하면 진동이 켜집니다')
            : '이 기기는 진동 미지원'}
        </span>
      </div>

      <style>{`
        .fs-loader { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 9999;
          display: grid; place-items: center; background: rgba(250,250,252,.88); backdrop-filter: blur(4px);
          contain: layout style paint; }
        @media (prefers-color-scheme: dark){ .fs-loader { background: rgba(11,15,25,.72); } }

        .fs-loader__inner { display: grid; justify-items: center; gap: 14px; padding: 24px 28px; border-radius: 16px;
          background: var(--surface,#fff); border: 1px solid var(--border,#e5e7eb);
          box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 18px 50px rgba(0,0,0,.10);
          text-align: center; max-width: min(88vw,520px); transform: translateZ(0); will-change: transform; }
        @media (prefers-color-scheme: dark){ .fs-loader__inner { background: #0b0f19; border-color: #253041; } }

        .fs-loader__title { margin: 2px 0 0; font-size: clamp(18px,2.2vw,20px); font-weight: 800;
          letter-spacing: -0.01em; color: var(--ink-strong,#111827); }
        .fs-loader__msg { margin: 0; font-size: 14px; color: var(--ink-soft,#6b7280); }
        @media (prefers-color-scheme: dark){
          .fs-loader__title { color: #e5e7eb; }
          .fs-loader__msg { color: #9aa4b2; }
        }

        .solarsys { --size: clamp(84px,16vw,120px); --sun: calc(var(--size)*0.28);
          --o1: calc(var(--size)*0.40); --o2: calc(var(--size)*0.64); --o3: calc(var(--size)*0.84);
          --spin1: 7s; --spin2: 11s; --spin3: 16s; --pulse: 2.6s;
          position: relative; width: var(--size); height: var(--size);
          display: grid; place-items: center; user-select: none; pointer-events: none;
          transform: translateZ(0); will-change: transform; }
        .fs-loader.reduce .solarsys { --spin1: 11s; --spin2: 16s; --spin3: 24s; --pulse: 4.2s; }

        .solarsys .sun { width: var(--sun); height: var(--sun); border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffd166 0%, #fca311 45%, #f59e0b 60%, #ef7f00 100%);
          box-shadow: 0 0 12px 4px rgba(255,184,0,.35), 0 0 40px 8px rgba(255,184,0,.20);
          animation: sun-pulse var(--pulse) ease-in-out infinite; }

        .solarsys .orbit { position: absolute; display: grid; place-items: center; border-radius: 50%;
          border: 1px dashed rgba(125,130,155,.25); }
        .solarsys .orbit--1 { width: var(--o1); height: var(--o1); animation: spin var(--spin1) linear infinite; }
        .solarsys .orbit--2 { width: var(--o2); height: var(--o2); animation: spin var(--spin2) linear infinite reverse; }
        .solarsys .orbit--3 { width: var(--o3); height: var(--o3); animation: spin var(--spin3) linear infinite; }

        .solarsys .planet { position: absolute; top: 0; transform: translateY(-50%); border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,.12); }
        .solarsys .planet--1 { width: calc(var(--size)*0.08); height: calc(var(--size)*0.08);
          background: radial-gradient(circle at 35% 35%, #9ae6b4 0%, #22c55e 70%); }
        .solarsys .planet--2 { width: calc(var(--size)*0.10); height: calc(var(--size)*0.10);
          background: radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 70%); }
        .solarsys .planet--3 { width: calc(var(--size)*0.12); height: calc(var(--size)*0.12);
          background: radial-gradient(circle at 35% 35%, #fca5a5 0%, #ef4444 70%); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes sun-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>
    </div>
  );
}
