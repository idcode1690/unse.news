// src/pages/FortunePage.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import PillarDisplay from '../components/sajoo/PillarDisplay.jsx';
import AIFortune from '../components/sajoo/AIFortune.jsx';
import { InputRequiredGuide } from '../components/common/Layout.jsx';
import FullScreenLoader from '../components/common/FullScreenLoader.jsx';
import ShareModal from '../components/common/ShareModal.jsx';

import { callOpenAI } from '../services/openaiService.jsx';
import {
  loadCalculationDataFromCookie,
  loadTodayAiResultFromCookie,
  saveTodayAiResultToCookie,
  isShareModalSeenToday,
  setShareModalSeenToday,
} from '../utils/cookieUtils.jsx';
import { calculateSaju } from '../utils/sajooCalculator.jsx';
import { lunarToSolar } from '../utils/lunarCalendar.jsx';
import { analyzeSajuMeta } from '../utils/sajuExtras.jsx';
import { setSEO } from '../utils/seo.jsx';

function pad2(n){ return String(n).padStart(2,'0'); }

// ⬇️ 시간 표준화: '', null, undefined, NaN → null
function normalizeHour(raw){
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : null;
}

// YYYY.MM.DD (KST)
function formatTodayKST() {
  const nowUtc = Date.now();
  const kst = new Date(nowUtc + 9 * 3600 * 1000);
  const y = kst.getUTCFullYear();
  const m = pad2(kst.getUTCMonth() + 1);
  const d = pad2(kst.getUTCDate());
  return `${y}.${m}.${d}`;
}
// YYYY-MM-DD (KST)
function todayKeyKST() {
  const nowUtc = Date.now();
  const kst = new Date(nowUtc + 9 * 3600 * 1000);
  const y = kst.getUTCFullYear();
  const m = pad2(kst.getUTCMonth() + 1);
  const d = pad2(kst.getUTCDate());
  return `${y}-${m}-${d}`;
}

const toInt = (v, fb = undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

// 출생 사주 보강(쿠키에 sajuResult 없을 때 재계산). “오늘 기둥”은 사용하지 않음.
function ensureSajuComputed(data) {
  if (!data) return null;
  if (data?.sajuResult?.year && data?.sajuResult?.month && data?.sajuResult?.day && data?.sajuResult?.hour) {
    return data;
  }
  const calendar = data.calendar || 'solar';
  const year = toInt(data.year);
  const month = toInt(data.month);
  const day = toInt(data.day);

  // ⬇️ 계산은 ‘모름’일 때 정오(12시)로 통일
  const hourForCalc = normalizeHour(data.hour) ?? 12;
  const minuteForCalc = toInt(data.minute, 0) ?? 0;

  const isLeap = data.leapMonth === 'leap' || data.isLeap === true;

  let sY, sM, sD;
  if (typeof data.solarDate === 'string') {
    const m = String(data.solarDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) { sY = toInt(m[1]); sM = toInt(m[2]); sD = toInt(m[3]); }
  }
  if (!sY || !sM || !sD) {
    if (calendar === 'lunar') {
      const dConv = lunarToSolar(year, month, day, isLeap);
      const solar = dConv instanceof Date ? dConv : new Date(dConv);
      sY = solar.getFullYear(); sM = solar.getMonth() + 1; sD = solar.getDate();
    } else {
      sY = year; sM = month; sD = day;
    }
  }

  const saju = calculateSaju(sY, sM, sD, hourForCalc, minuteForCalc);
  return {
    ...data,
    calendar,
    solarDate: `${sY}-${String(sM).padStart(2, '0')}-${String(sD).padStart(2, '0')}`,
    sajuResult: saju,
    year, month, day,
    // 표시용은 원본 유지(모름 허용)
    hour: data.hour ?? '',
    minute: data.minute ?? '',
    isLeap,
  };
}

// 오늘(KST) 날짜(연/월/일)만 사용 → 시간은 정오(12:00) 고정
function getTodayYMD_KST() {
  const nowUtc = Date.now();
  const kst = new Date(nowUtc + 9 * 3600 * 1000);
  return {
    y: kst.getUTCFullYear(),
    m: kst.getUTCMonth() + 1,
    d: kst.getUTCDate(),
  };
}

// 같은 입력이면 같은 텍스트 캐시(오늘 날짜는 별도 key로 분리)
function buildSignature(inputEnsured) {
  if (!inputEnsured) return 'NOINPUT';
  const { calendar, year, month, day, hour, minute, gender, leapMonth, solarDate, mbti } = inputEnsured;
  return [
    'FORTUNE',
    calendar || 'solar',
    `${year || ''}-${month || ''}-${day || ''}`,
    `${pad2(Number.isFinite(Number(hour)) ? Number(hour) : 12)}:${pad2(Number.isFinite(Number(minute)) ? Number(minute) : 0)}`,
    gender || '',
    leapMonth || (inputEnsured.isLeap ? 'leap' : 'common'),
    solarDate || '',
    (mbti || '').toUpperCase(),
  ].join('|');
}

const FortunePage = () => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [birthPillars, setBirthPillars] = useState(null);   // 출생 4주
  const [todayPillars, setTodayPillars] = useState(null);   // 오늘 4주 (KST 정오 기준)
  const [birthMeta, setBirthMeta] = useState(null);         // 출생 메타(용신·육친·신살·격국…)
  const [todayMeta, setTodayMeta] = useState(null);         // 오늘 메타(일간 기준 십성·신살 등)
  const [inputEnsured, setInputEnsured] = useState(null);   // 서명용 원천 입력(보강 후)

  // 공유 모달
  const [modalOpen, setModalOpen] = useState(false);
  const shownRef = useRef(false);
  const userInteractedRef = useRef(false);
  const bottomSentinelRef = useRef(null);

  const todayStr = useMemo(() => formatTodayKST(), []);
  const todayKey = useMemo(() => todayKeyKST(), []);
  const hasInput = useMemo(() => !!loadCalculationDataFromCookie(), []);

  // SEO
  useEffect(() => {
    setSEO({
      title: `오늘의 운세 ${todayStr}`,
      description: '오늘의 일진과 길한 시간대, 주의 포인트를 간단 요약으로 확인하세요.',
      path: '/#/fortune',
      image: '/og-image.png',
    });
  }, [todayStr]);

  // 출생 사주 복원/보강
  useEffect(() => {
    const raw = loadCalculationDataFromCookie();
    if (!raw) return;
    const ensured = ensureSajuComputed(raw);
    setInputEnsured(ensured || null);
    setBirthPillars(ensured?.sajuResult || null);

    // 출생 메타(용신·육친·신살·격국/대운/세운 등) — 일간 기준 시각 보정
    if (ensured?.sajuResult) {
      const by = ensured.year, bm = ensured.month, bd = ensured.day;
      const birthCtx = {
        y: by, m: bm, d: bd,
        hh: normalizeHour(ensured.hour) ?? 12,
        mm: toInt(ensured.minute, 0) ?? 0,
        gender: ensured.gender || 'unknown',
      };
      const meta = analyzeSajuMeta(ensured.sajuResult, { birth: birthCtx });
      setBirthMeta(meta);
    }
  }, []);

  // 오늘의 사주(오늘 KST 정오 12:00 고정) + 오늘 메타(일간 기준 십성/신살 등)
  useEffect(() => {
    const { y, m, d } = getTodayYMD_KST();
    const pillars = calculateSaju(y, m, d, 12, 0); // ✅ 정오 고정
    setTodayPillars(pillars);

    // ✅ 오늘 메타를 “출생 일간” 기준으로 해석하도록 앵커 전달 (연간 사용 금지)
    const anchorDayStem = birthPillars?.day?.stem || null;
    setTodayMeta(
      analyzeSajuMeta(pillars, {
        mode: 'today',
        anchorDayStem,                 // 해석 기준: 출생 일간
        focus: 'day',                  // (옵션 힌트) 오늘 '일간/일지' 중심
        preferDay: true,               // (옵션 힌트) day 우선
        birth: anchorDayStem ? { dayStem: anchorDayStem } : undefined, // 연간 힌트 미전달
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthPillars?.day?.stem]);

  // AI 호출
  useEffect(() => {
    if (!inputEnsured || !birthPillars || !todayPillars) return;

    const run = async () => {
      setIsLoading(true);
      setError('');
      try {
        const signature = buildSignature(inputEnsured);
        const cached = loadTodayAiResultFromCookie();
        if (cached?.text && cached?.meta?.date === todayStr && cached?.meta?.signature === signature) {
          setContent(cached.text);
          return;
        }

        const hhCalc = normalizeHour(inputEnsured.hour) ?? 12;
        const mmCalc = toInt(inputEnsured.minute, 0) ?? 0;

        const birthDesc = {
          calendar: inputEnsured.calendar,
          y: inputEnsured.year, m: inputEnsured.month, d: inputEnsured.day,
          hh: hhCalc, mm: mmCalc,
          gender: inputEnsured.gender || 'unknown',
          leapMonth: inputEnsured.leapMonth || (inputEnsured.isLeap ? 'leap' : 'common'),
          solarDate: inputEnsured.solarDate || null,
          mbti: (inputEnsured.mbti || '').toUpperCase(),
        };

        // ✅ “오늘은 일간 중심”이라는 신호를 페이로드로 분리 명시
        const todayCore = {
          date: todayKey,
          day: {
            stem: todayPillars?.day?.stem || '',
            branch: todayPillars?.day?.branch || '',
          },
          // 참고용으로 전체 기둥도 같이 제공(디스플레이/합충 판단용)
          full: todayPillars,
        };

        const anchors = {
          birthDayStem: birthPillars?.day?.stem || '',
          todayDayStem: todayPillars?.day?.stem || '',
        };

        // ✅ 분석 JSON: 출생 4주/메타 + 오늘 4주/메타 + todayCore(일간/일지 초점)
        const payload = {
          birth: birthDesc,
          pillars: { birth: birthPillars, today: todayPillars },
          meta: {
            birth: birthMeta,         // 용신·육친·신살·격국·오행분포·대운/세운 등
            today: todayMeta,         // (출생 일간 기준으로 본) 오늘 십성/신살 요약
          },
          todayCore,
          anchors,
          todayKST: { date: todayKey, display: todayStr, timeBase: 'KST 12:00' },
        };

        const systemPrompt = [
          '당신은 명리·사주 풀이 무당입니다. 오늘의 운세를 풀이하고 다음 규칙을 반드시 지킵니다.',
          '모르거나 부정확한 풀이는 허위로 작성하지 말고 완전히 작성하지 마세요',
          '한글로 작성해야된다.',
          '오늘의 날짜를 기준으로 오늘의 운세 풀이를 작성하고. 사주기둥도 오늘의 기둥을 중심으로 풀이해야한다.',
          '소제목은 h3(###) 형식으로 작성하고, 추가 소제목/서론/결론/요약 금지',
          '사주기둥으로 윤친,신살,용신을 모두 적용해서 해석하고 당사자에게 말하는 말투로 작성하되 이 사람의 오늘의 사주풀이에 대해서만 이야기해야 된다.',
          '새 간지/절기/점수 생성 금지, 외부 추정 금지, 조언금지, 해결책 제시 금지',
          '오늘의 사주운 총평, 오늘의 금전운, 오늘의 직장운, 오늘의 연애운, 오늘의 관계운으로 소제목을 작성해줘.',
          '각 항목은 400~600자, 반복/상투어 금지, 오늘의 “상호작용”을 구체 사례로 설명.',
          // ⬇️ 핵심: 해석 기준을 '출생 일간'과 '오늘 일간'으로 고정, 연간/월간 십성판단 금지
          '모든 십성/상생·상극 평가는 반드시 출생 일간(day.stem)을 기준으로, 오늘 쪽은 오늘의 일간(today.day.stem) 중심으로 수행한다.',
          '연간/월간을 기준으로 십성을 판단하거나 주 해석 축으로 삼지 말라(연/월은 보조 맥락만).',
        ].join(' ');

        const userPrompt = [
          '분석 JSON:',
          '```json',
          JSON.stringify(payload, null, 2),
          '```',
          '',
          '핵심 축:',
          `- 출생 일간: ${anchors.birthDayStem || '(미확인)'}`,
          `- 오늘 일간: ${anchors.todayDayStem || '(미확인)'}`,
          `- 오늘 일지: ${todayCore.day.branch || '(미확인)'}`,
          '',
          '지침:',
          '- 출생 메타의 용신/기신을 우선 기준으로 오늘의 천간·지지를 평가하세요.',
          '- 십성/신살 해석은 “출생 일간(day.stem)” ↔ “오늘 일간(today.day.stem)”의 관계를 최우선으로 삼으세요.',
          '- 합·충·형·해·파·원진은 출생 4주 지지 ↔ 오늘 일지(필요시 월/시지) 상호작용을 영향 영역과 연결하세요.',
          '- 금지: 오늘의 연간/월간을 기준으로 십성 판단하거나 주 해석 축으로 삼는 행위.',
          '- 확률/점수/별점/색상표 금지. 체크리스트/시간대 팁은 구체적으로.',
        ].join('\n');

        const text = await callOpenAI({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          cacheKey: `TODAY|${todayKey}|${signature}`, // 자정까지 캐시
        });

        const result = String(text || '').trim();
        setContent(result);
        saveTodayAiResultToCookie(result, { date: todayStr, signature });
      } catch (e) {
        setError(`오늘의 운세 생성에 실패했습니다.\n${e?.message ?? ''}`);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [inputEnsured, birthPillars, todayPillars, birthMeta, todayMeta, todayStr, todayKey]);

  // 공유 모달: 사용자 상호작용 이후 바닥 센티넬 보이면 1회, 하루 1회 제한
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
            setShareModalSeenToday();
            setModalOpen(true);
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

  if (!hasInput) {
    return (
      <div className="calculator">
        <InputRequiredGuide homeHref="/" />
      </div>
    );
  }

  const bootLoading = (!birthPillars || !todayPillars) && !error;
  const showFullLoader = bootLoading || (isLoading && !error);

  return (
    <>
      <div className="calculator">
        <FullScreenLoader
          show={showFullLoader}
          title={bootLoading ? '오늘의 정보를 준비 중…' : 'AI 해석을 준비하고 있어요'}
          message={bootLoading ? '출생 사주와 오늘의 일진을 계산하고 있습니다.' : '곧 결과가 표시됩니다.'}
        />

        <div className="card result" aria-busy={showFullLoader ? 'true' : 'false'}>
          <h2 style={{ textAlign: 'left' }}>오늘의 운세</h2>

          {birthPillars && (
            <div>
              <h3 style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>출생 사주 기둥</h3>
              <PillarDisplay pillars={birthPillars} />
            </div>
          )}

          {todayPillars && (
            <div style={{ marginTop: 4 }}>
              <h3 style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>
                오늘의 사주 기둥 (KST 정오 기준)
              </h3>
              <PillarDisplay pillars={todayPillars} />
            </div>
          )}

          <div className="info-box" style={{ marginTop: 4 }}>
            <div className="season-title" style={{ marginBottom: 4 }}>오늘</div>
            <div className="info-row">
              <span className="info-label">KST 기준</span>
              <span className="info-value">{todayStr}</span>
            </div>
            <div className="info-sub">※ 날짜가 바뀌면 ‘오늘의 사주 기둥’도 달라질 수 있어요. (정오 고정)</div>
          </div>

          {!isLoading && (
            <AIFortune content={content} />
          )}

          {(!isLoading && !error && content) && (
            <details className="info-box info-soft calc-notes" style={{ marginTop: 12 }}>
              <summary>오늘의 운세는 이렇게 계산했어요 (펼치기)</summary>
              <div className="calc-body">
                <ol>
                  <li><strong>일간 중심</strong>: 출생 <em>일간</em>과 오늘 <em>일간</em>의 생·극·설·쟁을 교차 점검.</li>
                  <li><strong>신강·신약</strong>: 출생 신강도/계절, 오늘 조후 보정 여부를 함께 고려.</li>
                  <li><strong>용신·기신</strong>: 출생 용신/기신 기준으로 오늘 천간·지지를 평가.</li>
                  <li><strong>십성 초점</strong>: 오늘 <em>일간↔출생 일간</em>이 맺는 십성으로 금전/관계/업무 초점 도출.</li>
                  <li><strong>합·충·형·해·파·원진</strong>: 출생 지지 ↔ 오늘 <em>일지</em> 상호작용을 영향 영역과 연결.</li>
                  <li><strong>대운·세운 톤</strong>: 큰 흐름과 오늘 톤의 일치 여부 확인.</li>
                </ol>
                <p className="caption">※ 연간/월간은 보조 맥락만 참고하며, 주 해석 축은 일간/일지입니다.</p>
              </div>
            </details>
          )}

          {error && !isLoading && !content && (
            <div className="helper" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 하단 센티넬 */}
      <div ref={bottomSentinelRef} aria-hidden style={{ height: 1 }} />

      <ShareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pageTitle="오늘의 운세"
        shareText="오늘의 운세가 도움이 되셨다면 지인과 공유해 보세요."
      />
    </>
  );
};

export default FortunePage;
