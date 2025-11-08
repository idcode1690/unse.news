// src/pages/ResultPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import SajooResult from '../components/sajoo/SajooResult';
import { setSEO } from '../utils/seo.jsx';
import ShareModal from '../components/common/ShareModal';
import { isShareModalSeenToday, setShareModalSeenToday } from '../utils/cookieUtils.jsx';

export default function ResultPage() {
  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);            // 1회만
  const userInteractedRef = useRef(false);   // 사용자 상호작용 감지
  const bottomSentinelRef = useRef(null);    // 하단 센티넬

  useEffect(() => {
    setSEO({
      title: '사주 결과',
      description: '입력하신 정보로 사주를 계산해 보여드립니다.',
      path: '/#/result',
    });
  }, []);

  // 잔여 scroll-lock 방지
  useEffect(() => { document.body.classList.remove('scroll-lock'); }, []);

  // 사용자 상호작용 + 바닥 진입 감시
  useEffect(() => {
    const markScroll = () => { if (window.pageYOffset > 8) userInteractedRef.current = true; };
    const markWheel  = () => { userInteractedRef.current = true; };
    const markTouch  = () => { userInteractedRef.current = true; };
    const markKey    = (e) => { if (['PageDown','End',' ','Spacebar'].includes(e.key)) userInteractedRef.current = true; };

    window.addEventListener('scroll', markScroll, { passive: true });
    window.addEventListener('wheel',  markWheel,  { passive: true });
    window.addEventListener('touchstart', markTouch, { passive: true });
    window.addEventListener('keydown', markKey);

    const el = bottomSentinelRef.current;
    let observer;
    if (el) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.99 &&
            userInteractedRef.current &&
            !shownRef.current &&
            !isShareModalSeenToday()
          ) {
            shownRef.current = true;
            setShareModalSeenToday(); // ✅ 오늘 본 것으로 기록
            setOpen(true);
          }
        }
      }, { root: null, threshold: [0.99] });
      observer.observe(el);
    }

    return () => {
      window.removeEventListener('scroll', markScroll);
      window.removeEventListener('wheel',  markWheel);
      window.removeEventListener('touchstart', markTouch);
      window.removeEventListener('keydown', markKey);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <>
      <SajooResult />

      {/* 하단 센티넬 */}
      <div ref={bottomSentinelRef} aria-hidden style={{ height: 1 }} />

      <ShareModal
        isOpen={open}
        onClose={() => setOpen(false)}
        pageTitle="사주 결과"
        shareText="결과가 도움이 되셨다면 지인과 공유해 보세요."
      />
    </>
  );
}
