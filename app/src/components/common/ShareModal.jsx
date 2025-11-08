// src/components/common/ShareModal.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui';

/**
 * 디자인 리뉴얼된 공유 모달
 * - 포털 렌더링, 포커스 트랩, ESC/백드롭 닫기, 스크롤 잠금
 * - 버튼 라벨: "공유하기" / "다음에"
 * - 글로벌 토큰(var(--surface/--ink/--accent 등)) 활용
 * - ✅ 공유 후 페이지 이동 제거(모달만 닫기)
 * - ✅ 공유 URL을 해시 없이 정규 경로로 표시
 */
export default function ShareModal({
  isOpen,
  onClose,
  pageTitle = '운세뉴스',
  shareText = '유용했다면 지인에게 공유해보세요!',
}) {
  const backdropRef = useRef(null);
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);
  const lastActiveRef = useRef(null);
  const prevOverflowRef = useRef('');

  // 현재 페이지의 "해시 없는" 공유용 URL 생성
  const getShareUrl = () => {
    const { origin, pathname, search, hash } = window.location;

    // 404.html 리다이렉트에서 넘어온 ?p=/path 형태를 고려한 복원
    const usp = new URLSearchParams(search);
    const p = usp.get('p');
    if (p) {
      try {
        const u = new URL(p, origin);
        return u.origin + u.pathname + u.search; // hash 제거
      } catch {
        // 무시하고 아래 로직으로
      }
    }

    // HashRouter(#/route)라면 hash를 경로로 변환
    if (hash && hash.startsWith('#/')) {
      return origin + hash.slice(1) + (search || '');
    }

    // 그 외는 현재 경로 그대로 (hash 없음)
    return origin + pathname + search;
  };

  const handleClose = () => {
    try { onClose?.(); } catch {}
  };

  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) handleClose();
  };

  const handleShare = async () => {
    const url = getShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({ title: pageTitle, text: shareText, url });
      } catch {
        // 사용자 취소 등은 무시
      } finally {
        // ✅ 공유 후에는 현재 페이지 유지, 모달만 닫기
        handleClose();
      }
      return;
    }

    // Web Share API 미지원 → 클립보드 복사
    try {
      await navigator.clipboard.writeText(url);
      alert('링크를 클립보드에 복사했습니다.');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('링크를 클립보드에 복사했습니다.');
      } catch {
        // 복사 실패 시에도 페이지 이동은 하지 않음
      }
    } finally {
      // ✅ 모달만 닫기 (페이지 이동 없음)
      handleClose();
    }
  };

  // 접근성/스크롤잠금/포커스 관리
  useEffect(() => {
    if (!isOpen) return;
    try { document.body.classList.remove('scroll-lock'); } catch {}
    prevOverflowRef.current = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';

    lastActiveRef.current = document.activeElement;

    // 기본 포커스: 모달 컨테이너에 두는 편이 "버튼이 눌린 상태"처럼 보이는 걸 방지
    const t = setTimeout(() => (modalRef.current)?.focus(), 0);

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
      if (e.key === 'Tab') {
        const f = getFocusable(modalRef.current);
        if (!f.length) { e.preventDefault(); modalRef.current?.focus(); return; }
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflowRef.current || '';
      try { lastActiveRef.current?.focus?.(); } catch {}
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const reduceMotion = (() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  })();

  // ----- 스타일 (토큰 기반) -----
  const backdropStyle = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'color-mix(in oklab, black 38%, transparent)',
    display: 'grid', placeItems: 'center', padding: 16,
    backdropFilter: 'blur(2px)',
    animation: reduceMotion ? undefined : 'fadeIn .16s ease-out',
  };
  const modalStyle = {
    width: 'min(560px, 94vw)',
    background: 'var(--surface, #fff)',
    color: 'var(--ink, #111827)',
    border: '1px solid var(--border, #e5e7eb)',
    borderRadius: 16,
    boxShadow: '0 20px 48px rgba(0,0,0,.16)',
    overflow: 'hidden', outline: 'none',
    display: 'grid', gridTemplateRows: 'auto 1fr auto',
    transform: reduceMotion ? 'none' : 'translateY(6px)',
    animation: reduceMotion ? undefined : 'popIn .18s ease-out',
  };
  const headerStyle = {
    padding: '16px 18px 12px',
    borderBottom: '1px solid var(--border, #e5e7eb)',
    display: 'flex', alignItems: 'center', gap: 12,
  };
  const badgeStyle = {
    width: 36, height: 36, flex: '0 0 36px',
    display: 'grid', placeItems: 'center',
    borderRadius: 12,
    color: '#fff',
    background: 'linear-gradient(135deg, var(--accent, #7a5af8), #0fa958)',
    boxShadow: '0 6px 20px rgba(122,90,248,.25)',
    fontSize: 18, fontWeight: 800,
  };
  const titleWrap = { display: 'grid', gap: 4 };
  const h3Style = { margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.25 };
  const subStyle = { margin: 0, fontSize: 13, color: 'var(--ink-soft, #6b7280)' };
  const bodyStyle = { padding: 18, display: 'grid', gap: 12 };
  const cardStyle = {
    padding: 12, border: '1px solid var(--border, #e5e7eb)', borderRadius: 12, background: 'var(--surface, #fff)',
    fontSize: 14, color: 'var(--ink, #374151)', lineHeight: 1.6,
  };
  const urlBox = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, border: '1px dashed var(--border, #e5e7eb)',
    background: 'color-mix(in oklab, var(--surface, #fff) 92%, #7a5af8 8%)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    overflow: 'hidden',
  };
  const urlText = {
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, opacity: .9,
  };
  const footerStyle = {
    padding: 14, borderTop: '1px solid var(--border, #e5e7eb)',
    display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface, #fff)',
  };

  const shareUrl = getShareUrl();

  const modal = (
    <div ref={backdropRef} style={backdropStyle} onClick={onBackdropClick} data-testid="share-backdrop">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        aria-describedby="share-desc"
        style={modalStyle}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        data-testid="share-modal"
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={badgeStyle} aria-hidden>🔗</div>
          <div style={titleWrap}>
            <h3 id="share-title" style={h3Style}>공유하기</h3>
            <p style={subStyle}>친구/가족에게 운세뉴스를 알려보세요</p>
          </div>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          <div id="share-desc" style={cardStyle}>
            <strong style={{ fontWeight: 800 }}>{pageTitle}</strong>
            <div style={{ marginTop: 6 }}>{shareText}</div>
          </div>

          {/* 링크 프리뷰(읽기전용) */}
          <div style={urlBox} aria-label="공유 링크">
            <span style={{ opacity: .6 }}>URL</span>
            <span style={urlText} title={shareUrl}>{shareUrl}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <Button
            variant="text"
            onClick={handleClose}
            ref={firstFocusRef}
            data-testid="share-cancel"
          >
            다음에
          </Button>
          <Button
            onClick={handleShare}
            data-testid="share-confirm"
          >
            공유하기
          </Button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn {
          from { opacity: .001; transform: translateY(10px) scale(.98) }
          to   { opacity: 1;    transform: translateY(0)  scale(1) }
        }
        @media (prefers-reduced-motion: reduce){
          @keyframes fadeIn { from { opacity: 1 } to { opacity: 1 } }
          @keyframes popIn  { from { transform:none } to { transform:none } }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}

/* utils */
function getFocusable(root) {
  if (!root) return [];
  const sel = [
    'a[href]','button:not([disabled])','textarea:not([disabled])',
    'input:not([disabled])','select:not([disabled])','[tabindex]:not([tabindex="-1"])'
  ].join(',');
  return Array.from(root.querySelectorAll(sel)).filter((el) => {
    const st = window.getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden';
  });
}
