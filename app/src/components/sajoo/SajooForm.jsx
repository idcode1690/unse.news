// src/components/sajoo/SajooForm.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Select, SegmentedControl, Card } from '../ui';
import { DEFAULT_VALUES, MBTI_TYPES } from '../../utils/constants';
import {
  saveFormDataToCookie,
  loadFormDataFromCookie,
  clearFormDataCookie,
  saveCalculationDataToCookie,
  loadCalculationDataFromCookie,
} from '../../utils/cookieUtils';

/**
 * 홈 입력 폼 + 빠른 메뉴 카드 (심플 버전)
 * - 입력 정보 없으면 카드 숨김
 * - “정보저장” 후에만 카드 표시 + 첫 카드로 ‘천천히’ 스크롤
 * - 락 상태(저장완료) 유지(LS), 다른 페이지 다녀오면 자동 스크롤 금지(SS)
 * - 락 상태에선 어떤 입력도 선택/클릭 불가 (fieldset + pointer-events)
 */

const HOME_LOCK_KEY = 'home_form_locked_v1';
const ALLOW_SCROLL_ONCE_KEY = 'home_allow_scroll_once';

/* ── 날짜 유틸 ── */
function isLeapYear(y) {
  y = Number(y);
  if (!Number.isFinite(y) || y <= 0) return false;
  return (y % 400 === 0) || (y % 4 === 0 && y % 100 !== 0);
}
function solarDaysInMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(m) || m < 1 || m > 12) return 31;
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  if ([4, 6, 9, 11].includes(m)) return 30;
  return 31;
}

/* ── 스토리지 유틸 ── */
function safeLSGet(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
function safeLSSet(k,v){ try{ localStorage.setItem(k,v);}catch{} }
function safeSSGet(k){ try{ return sessionStorage.getItem(k);}catch{ return null; } }
function safeSSSet(k,v){ try{ sessionStorage.setItem(k,v);}catch{} }
function safeSSDel(k){ try{ sessionStorage.removeItem(k);}catch{} }

const SajooForm = () => {
  const [formData, setFormData] = useState(() => {
    const draft = loadFormDataFromCookie();
    if (draft) {
      return { ...DEFAULT_VALUES, ...draft, hour: draft.hour || '', hourBranch: undefined };
    }
    const calc = loadCalculationDataFromCookie();
    if (calc) {
      const { calendar, year, month, day, hour, gender, leapMonth, mbti } = calc;
      return {
        ...DEFAULT_VALUES,
        calendar: calendar ?? DEFAULT_VALUES.calendar,
        year: year ?? '',
        month: month ?? '',
        day: day ?? '',
        hour: hour ?? '',
        gender: gender ?? DEFAULT_VALUES.gender,
        leapMonth: leapMonth ?? DEFAULT_VALUES.leapMonth,
        mbti: mbti ?? '',
      };
    }
    // 요청 기본값
    return {
      ...DEFAULT_VALUES,
      calendar: 'solar',
      gender: 'male',
      year: '1980',
      month: '3',
      day: '27',
      hour: '',
      leapMonth: DEFAULT_VALUES.leapMonth,
      mbti: '',
    };
  });

  // 계산 쿠키 있으면 무조건 잠금
  const getInitialLock = () => {
    const hasCalcCookie = !!loadCalculationDataFromCookie();
    if (hasCalcCookie) return true;
    const persisted = safeLSGet(HOME_LOCK_KEY);
    return persisted === '1';
  };
  const [isLocked, setIsLocked] = useState(getInitialLock);

  // 카드 표시 여부
  const [showMenus, setShowMenus] = useState(() => !!loadCalculationDataFromCookie());

  const firstCardRef = useRef(null);

  useEffect(() => {
    const hasCalc = !!loadCalculationDataFromCookie();
    const persisted = safeLSGet(HOME_LOCK_KEY);
    if (hasCalc) {
      if (persisted !== '1') safeLSSet(HOME_LOCK_KEY, '1');
      if (!isLocked) setIsLocked(true);
    } else {
      if (persisted === null) safeLSSet(HOME_LOCK_KEY, '0');
    }
    if (safeSSGet(ALLOW_SCROLL_ONCE_KEY) === null) safeSSSet(ALLOW_SCROLL_ONCE_KEY, '0');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 자동 임시 저장
  const firstLoadRef = useRef(true);
  useEffect(() => {
    if (firstLoadRef.current) { firstLoadRef.current = false; return; }
    saveFormDataToCookie(formData);
  }, [formData]);

  // 옵션
  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = 1900; y <= 2029; y++) arr.push({ value: String(y), label: `${y}년` });
    return arr;
  }, []);
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}월` })),
    []
  );
  const dayOptions = useMemo(() => {
    const isLunar = formData.calendar === 'lunar';
    const maxDays = isLunar ? 30 : solarDaysInMonth(formData.year, formData.month);
    return Array.from({ length: maxDays }, (_, i) => ({ value: String(i + 1), label: `${i + 1}일` }));
  }, [formData.calendar, formData.year, formData.month]);
  const hourOptions = useMemo(() => {
    const hours = [{ value: '', label: '모름' }];
    for (let i = 0; i < 24; i++) hours.push({ value: String(i), label: `${String(i).padStart(2, '0')}시` });
    return hours;
  }, []);
  const mbtiOptions = useMemo(
    () => MBTI_TYPES.map((m) => ({ value: m.value, label: m.label })),
    []
  );

  // day 범위 보정 setter
  const setWithClamp = useCallback((next) => {
    const n = { ...next };
    const isLunar = n.calendar === 'lunar';
    const maxDays = isLunar ? 30 : solarDaysInMonth(n.year, n.month);
    const curDay = Number(n.day);
    if (!curDay || curDay > maxDays) n.day = String(Math.min(curDay || 1, maxDays));
    return n;
  }, []);

  // 연/월/달력 변경 시 자동 보정
  useEffect(() => {
    const isLunar = formData.calendar === 'lunar';
    const maxDays = isLunar ? 30 : solarDaysInMonth(formData.year, formData.month);
    const curDay = Number(formData.day);
    if (curDay && curDay > maxDays) setFormData(prev => ({ ...prev, day: String(maxDays) }));
  }, [formData.calendar, formData.year, formData.month]);

  // 입력 핸들러
  const handleCalendarChange = (value) => {
    if (isLocked) return;
    setFormData((p) => setWithClamp({ ...p, calendar: value }));
  };
  const handleGenderChange = (gender) => {
    if (isLocked) return;
    setFormData((p) => ({ ...p, gender }));
  };
  const handleFieldChange = (field, value) => {
    if (isLocked) return;
    if (field === 'year' || field === 'month' || field === 'leapMonth') {
      setFormData((p) => setWithClamp({ ...p, [field]: value }));
    } else {
      setFormData((p) => ({ ...p, [field]: value }));
    }
  };

  // 스크롤 유틸
  const getScrollContainer = (node) => {
    if (!node || typeof window === 'undefined') return null;
    let el = node.parentElement;
    while (el) {
      const st = getComputedStyle(el);
      const oy = st.overflowY || st.overflow;
      if (/(auto|scroll|overlay)/i.test(oy)) return el;
      el = el.parentElement;
    }
    return null;
  };
  const getHeaderOffset = useCallback(() => {
    try {
      const header = document.querySelector('header, .header, [role="banner"]');
      if (!header) return 0;
      const pos = (getComputedStyle(header)?.position || '').toLowerCase();
      return (pos.includes('fixed') || pos.includes('sticky'))
        ? Math.ceil(header.getBoundingClientRect().height || 0)
        : 0;
    } catch { return 0; }
  }, []);
  const rafIdRef = useRef(0);
  const cancelAnim = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
    try { const html = document.documentElement; if (html) html.style.scrollBehavior = ''; } catch {}
  }, []);
  useEffect(() => {
    const cancelers = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    cancelers.forEach((t) => window.addEventListener(t, cancelAnim, { passive: true }));
    return () => cancelers.forEach((t) => window.removeEventListener(t, cancelAnim));
  }, [cancelAnim]);
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
  const animateScrollTo = useCallback((container, to, duration = 1400) => {
    cancelAnim();
    const isWindow = !container;
    const doc = document.scrollingElement || document.documentElement;
    const start = isWindow ? (doc.scrollTop || window.pageYOffset || 0) : container.scrollTop;
    const change = to - start;
    if (Math.abs(change) < 1) return;
    let startTime = 0;
    const html = document.documentElement;
    const prevBehavior = html ? html.style.scrollBehavior : '';
    if (html) html.style.scrollBehavior = 'auto';
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const p = Math.min(1, elapsed / duration);
      const eased = easeOutQuint(p);
      const next = start + change * eased;
      if (isWindow) window.scrollTo(0, next);
      else container.scrollTop = next;
      if (p < 1) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        setTimeout(() => { if (html) html.style.scrollBehavior = prevBehavior || ''; }, 10);
        rafIdRef.current = 0;
      }
    };
    rafIdRef.current = requestAnimationFrame(step);
  }, [cancelAnim]);

  const scrollToFirstCard = useCallback(() => {
    const el = firstCardRef.current;
    if (!el) return;
    const container = getScrollContainer(el);
    const headerH = getHeaderOffset();
    const SAFE = Math.max(14, Math.min(40, Math.round((window.innerHeight || 600) * 0.04)));
    if (container) {
      const crect = container.getBoundingClientRect();
      const rect  = el.getBoundingClientRect();
      const rawTarget = container.scrollTop + (rect.top - crect.top) - headerH - SAFE;
      const target = Math.max(0, Math.min(rawTarget, container.scrollHeight - container.clientHeight));
      animateScrollTo(container, target, 1400);
      setTimeout(() => {
        const c2 = container.getBoundingClientRect();
        const r2 = el.getBoundingClientRect();
        const t2 = Math.max(0, Math.min(container.scrollTop + (r2.top - c2.top) - getHeaderOffset() - SAFE, container.scrollHeight - container.clientHeight));
        if (Math.abs(t2 - container.scrollTop) > 20) animateScrollTo(container, t2, 600);
      }, 350);
      setTimeout(() => {
        const c3 = container.getBoundingClientRect();
        const r3 = el.getBoundingClientRect();
        const t3 = Math.max(0, Math.min(container.scrollTop + (r3.top - c3.top) - getHeaderOffset() - SAFE, container.scrollHeight - container.clientHeight));
        if (Math.abs(t3 - container.scrollTop) > 20) animateScrollTo(container, t3, 500);
      }, 800);
    } else {
      const doc = document.scrollingElement || document.documentElement;
      const rect = el.getBoundingClientRect();
      const rawTarget = (doc.scrollTop || window.pageYOffset || 0) + rect.top - headerH - SAFE;
      const maxTarget = Math.max(0, doc.scrollHeight - (window.innerHeight || doc.clientHeight));
      const target = Math.max(0, Math.min(rawTarget, maxTarget));
      animateScrollTo(null, target, 1400);
      setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        const raw2 = (document.scrollingElement || document.documentElement).scrollTop + r2.top - getHeaderOffset() - SAFE;
        const t2 = Math.max(0, Math.min(raw2, (document.scrollingElement || document.documentElement).scrollHeight - (window.innerHeight || (document.scrollingElement || document.documentElement).clientHeight)));
        if (Math.abs(t2 - (document.scrollingElement || document.documentElement).scrollTop) > 20) animateScrollTo(null, t2, 600);
      }, 350);
      setTimeout(() => {
        const r3 = el.getBoundingClientRect();
        const raw3 = (document.scrollingElement || document.documentElement).scrollTop + r3.top - getHeaderOffset() - SAFE;
        const t3 = Math.max(0, Math.min(raw3, (document.scrollingElement || document.documentElement).scrollHeight - (window.innerHeight || (document.scrollingElement || document.documentElement).clientHeight)));
        if (Math.abs(t3 - (document.scrollingElement || document.documentElement).scrollTop) > 20) animateScrollTo(null, t3, 500);
      }, 800);
    }
  }, [getHeaderOffset, animateScrollTo]);

  // 저장
  const handleSubmit = useCallback(() => {
    const hasDate = !!(formData.year && formData.month && formData.day);
    const lunarOk = formData.calendar === 'solar' || !!formData.leapMonth;
    const hasGender = !!formData.gender;
    if (!hasDate || !lunarOk || !hasGender) return;

    setIsLocked(true);
    safeLSSet(HOME_LOCK_KEY, '1');

    saveCalculationDataToCookie({
      calendar: formData.calendar,
      year: formData.year,
      month: formData.month,
      day: formData.day,
      hour: formData.hour || '',
      minute: '0',
      gender: formData.gender,
      leapMonth: formData.leapMonth,
      mbti: formData.mbti || '',
    });

    safeSSSet(ALLOW_SCROLL_ONCE_KEY, '1');
    setShowMenus(true);
  }, [formData]);

  // 카드 첫 노출 시 스크롤
  useEffect(() => {
    if (!showMenus) return;
    if (safeSSGet(ALLOW_SCROLL_ONCE_KEY) !== '1') return;
    const run = () => {
      scrollToFirstCard();
      setTimeout(scrollToFirstCard, 900);
      setTimeout(scrollToFirstCard, 1500);
      safeSSSet(ALLOW_SCROLL_ONCE_KEY, '0');
    };
    requestAnimationFrame(run);
    return () => cancelAnim();
  }, [showMenus, scrollToFirstCard, cancelAnim]);

  // 초기화 (요청 기본값으로 복원)
  const handleReset = useCallback(() => {
    setFormData({
      ...DEFAULT_VALUES,
      calendar: 'solar',
      gender: 'male',
      year: '1980',
      month: '3',
      day: '27',
      hour: '',
      leapMonth: DEFAULT_VALUES.leapMonth,
      mbti: '',
    });
    clearFormDataCookie();
    setIsLocked(false);
    safeLSSet(HOME_LOCK_KEY, '0');
    setShowMenus(false);
    safeSSDel(ALLOW_SCROLL_ONCE_KEY);
    cancelAnim();
  }, [cancelAnim]);

  const calendarOptions = [
    { value: 'solar', label: '양력' },
    { value: 'lunar', label: '음력' },
  ];
  const genderOptions = [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
  ];
  const leapOptions = [
    { value: 'common', label: '평달' },
    { value: 'leap', label: '윤달' },
  ];
  const isLunarSelected = formData.calendar === 'lunar';

  // ✅ 절대경로 메뉴(상대경로 누적 방지)
  const simpleMenus = [
    { key: 'result',  icon: '📜', title: '사주팔자',   desc: '정확한 사주 계산',     href: '/result/'  },
    { key: 'fortune', icon: '🔮', title: '오늘의 운세', desc: '오늘 운세 한눈에',     href: '/fortune/' },
    { key: 'lotto',   icon: '🎰', title: '로또운세',   desc: '사주 기반 번호 추천', href: '/lotto/'   },
    { key: 'compat',  icon: '❤️', title: '궁합',       desc: '상대와의 궁합 확인',   href: '/compat/'  },
    { key: 'ask',     icon: '❓', title: '질문 풀이',   desc: '사주로 궁금증 풀이',   href: '/ask/'     },
  ];

  // ✅ 절대경로 내비게이션(실패 시 해시 폴백)
  const gotoAbs = useCallback((absPath) => {
    try {
      if (!absPath.startsWith('/')) throw new Error('absolute path required');
      window.location.href = absPath;
    } catch {
      const key = absPath.replace(/^\/+/, ''); // 'result/' 등
      window.location.hash = `#/${key}`;
    }
  }, []);

  return (
    <section className="calculator">
      <Card className="form-card">
        <h2 className="h2" style={{ marginTop: 0 }}>내 정보</h2>

        <fieldset
          disabled={isLocked}
          aria-disabled={isLocked}
          className={isLocked ? 'fieldset-locked' : undefined}
          style={{ border: 0, padding: 0, margin: 0 }}
        >
          <div className="row cols-2">
            <div className="field-calendar">
              <SegmentedControl
                label="달력"
                options={calendarOptions}
                value={formData.calendar}
                onChange={handleCalendarChange}
                ariaLabel="달력 종류 선택"
              />
            </div>
            {isLunarSelected && (
              <div className="field-leap">
                <Select
                  label="윤달 여부"
                  id="leapMonth"
                  options={leapOptions}
                  value={formData.leapMonth}
                  onChange={(e) => handleFieldChange('leapMonth', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="row cols-2">
            <div className="field-gender">
              <SegmentedControl
                label="성별"
                options={genderOptions}
                value={formData.gender}
                onChange={handleGenderChange}
                ariaLabel="성별 선택"
              />
            </div>
            <div className="field-mbti only-desktop">
              <Select
                label="MBTI (선택사항)"
                id="mbti-desktop"
                options={mbtiOptions}
                value={formData.mbti || ''}
                onChange={(e) => handleFieldChange('mbti', e.target.value)}
              />
            </div>
          </div>

          <div className="row cols-4 sm-cols-2" aria-label="생년월일 및 시간 선택">
            <div className="field-year">
              <Select
                label="년도"
                id="year"
                options={yearOptions}
                value={formData.year}
                onChange={(e) => handleFieldChange('year', e.target.value)}
              />
            </div>
            <div className="field-month">
              <Select
                label="월"
                id="month"
                options={monthOptions}
                value={formData.month}
                onChange={(e) => handleFieldChange('month', e.target.value)}
              />
            </div>
            <div className="field-day">
              <Select
                label="일"
                id="day"
                options={dayOptions}
                value={formData.day}
                onChange={(e) => handleFieldChange('day', e.target.value)}
              />
            </div>
            <div className="field-hour">
              <Select
                label="시간"
                id="hour"
                options={hourOptions}
                value={formData.hour}
                onChange={(e) => handleFieldChange('hour', e.target.value)}
              />
            </div>
          </div>

          {/* 모바일 전용 MBTI */}
          <div className="row only-mobile">
            <div className="field-mbti">
              <Select
                label="MBTI (선택사항)"
                id="mbti-mobile"
                options={mbtiOptions}
                value={formData.mbti || ''}
                onChange={(e) => handleFieldChange('mbti', e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        <div className="actions">
          <Button variant="text" onClick={handleReset}>초기화</Button>
          <Button onClick={handleSubmit} disabled={isLocked}>
            {isLocked ? '저장완료' : '정보저장'}
          </Button>
        </div>
      </Card>

      {showMenus && (
        <div className="row cols-4 gx quick-grid" aria-label="빠른 메뉴">
          {simpleMenus.map((m, idx) => (
            <Card
              key={m.key}
              ref={idx === 0 ? firstCardRef : null}
              role="link"
              tabIndex={0}
              className="nav-card-simple"
              onClick={() => gotoAbs(m.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  gotoAbs(m.href);
                }
              }}
            >
              <div className="nav-simple">
                <div className="nav-icon" aria-hidden>{m.icon}</div>
                <div className="nav-body">
                  <h3 className="h3 nav-title">{m.title}</h3>
                  <p className="muted nav-desc">{m.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <style>{`
        :root{ --row-gap: 14px; --col-gap: 12px; }

        .form-card { margin-bottom: 14px; }

        /* 행 간격을 '딱' 고정 */
        .form-card .row{
          display: grid;
          gap: var(--row-gap) var(--col-gap);
          margin: 0;                     /* 기본 여백 제거 */
        }
        .form-card .row + .row{ margin-top: var(--row-gap); } /* 행-행 간격 균일 */
        .form-card .row.only-mobile{ margin-top: var(--row-gap); }

        /* 필드 컨테이너 자체 여백 제거 (컴포넌트 내부 마진 영향 최소화) */
        .form-card .row > [class^="field-"]{ margin: 0; }

        /* 액션 영역도 동일한 상단 간격 적용 */
        .actions{
          margin-top: var(--row-gap);
          display: flex; gap: 10px;
        }

        .quick-grid { margin-top: 10px; }

        /* 락 시 포인터 차단 */
        .fieldset-locked { opacity: 0.98; }
        .fieldset-locked * {
          pointer-events: none !important;
          cursor: not-allowed !important;
        }

        /* 카드 레이아웃 */
        .nav-card-simple { cursor: pointer; }
        .nav-simple{
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
        }
        .nav-icon{
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
        }
        .nav-title{
          margin: 0;
          font-weight: 800;
          line-height: 1.22;
        }
        .nav-desc{
          margin: 2px 0 0;
          font-size: 13px;
          color: var(--ink-soft, #6b7280);
        }

        @media (max-width: 640px){
          .nav-title{ font-size: 18px; }
          .nav-desc{ font-size: 15px; margin-top: 0; }
        }
      `}</style>
    </section>
  );
};

export default SajooForm;
