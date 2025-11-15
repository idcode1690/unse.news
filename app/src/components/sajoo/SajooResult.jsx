// app/src/components/sajoo/SajooResult.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PillarDisplay from '../sajoo/PillarDisplay.jsx';
import AIFortune from '../sajoo/AIFortune.jsx';
import { InputRequiredGuide } from '../common/Layout';
import FullScreenLoader from '../common/FullScreenLoader.jsx';

import {
  loadCalculationDataFromCookie,
  loadFormDataFromCookie,
  saveAiResultToCookie,
  loadAiResultFromCookie,
  saveCalculationDataToCookie as saveCalcCookie,
  saveSajuMetaToCookie,
  loadSajuMetaFromCookie,
} from '../../utils/cookieUtils';
import { calculateSaju } from '../../utils/sajooCalculator';
import { lunarToSolar } from '../../utils/lunarCalendar';
import { analyzeSajuMeta } from '../../utils/sajuExtras';
import { lunarToSolar } from '../../utils/lunarCalendar';
import { callOpenAI } from '../../services/openaiService';

function pad2(n) { return String(n).padStart(2, '0'); }

// ⬇️ 시간 표기 유틸: '', null, undefined, NaN 은 모름(null)로 처리
function normalizeHour(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : null;
}
function formatBirthline({ year, month, day, hour }) {
  const y = year ? String(year) : 'YYYY';
  const m = month ? pad2(month) : 'MM';
  const d = day ? pad2(day) : 'DD';
  const h = normalizeHour(hour);
  return h === null ? `${y}.${m}.${d} 모름` : `${y}.${m}.${d} ${pad2(h)}시`;
}

// ✅ 오늘 날짜(표시/나이 계산 참고용) — “기둥 계산에는 사용하지 않음”
function formatTodayKST() {
  const nowUtc = Date.now();
  const kst = new Date(nowUtc + 9 * 3600 * 1000);
  const y = kst.getUTCFullYear();
  const m = pad2(kst.getUTCMonth() + 1);
  const d = pad2(kst.getUTCDate());
  return `${y}.${m}.${d}`;
}

// ✅ 만 나이 계산(양력 기준, KST)
function computeAgeFromYMD(y, m, d) {
  const Y = Number(y), M = Number(m), D = Number(d);
  if (!Number.isFinite(Y) || !Number.isFinite(M) || !Number.isFinite(D)) return null;
  const now = new Date(Date.now() + 9 * 3600 * 1000); // KST
  const ny = now.getUTCFullYear();
  const nm = now.getUTCMonth() + 1;
  const nd = now.getUTCDate();
  let age = ny - Y;
  if (nm < M || (nm === M && nd < D)) age -= 1;
  return age >= 0 && age < 200 ? age : null;
}

/* ──────────────────────
   지지(12지) 정규화 & 띠
   ────────────────────── */
// 지지 표준 키(한글)
const BRANCH_KEYS = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
// 지지 한자
const BRANCH_HANJA = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
// 지지 로마자(병음)
const BRANCH_PINYIN = ['zi','chou','yin','mao','chen','si','wu','wei','shen','you','xu','hai'];
// 영문 동물명 → 한글 지지 매핑(여러 변형 흡수)
const BRANCH_ANIM_EN = {
  rat:'자', ox:'축', cow:'축',
  tiger:'인',
  rabbit:'묘', hare:'묘',
  dragon:'진',
  snake:'사',
  horse:'오',
  sheep:'미', goat:'미', ram:'미',
  monkey:'신',
  rooster:'유', chicken:'유',
  dog:'술',
  pig:'해', boar:'해'
};

function normalizeBranchKey(raw){
  if (!raw && raw !== 0) return null;

  // 객체 형태 방어 (예: { branch:'子' } 또는 {kr:'자', hanja:'子'} 등)
  let v = raw;
  if (typeof v === 'object') {
    v =
      v.kr || v.ko || v.kor || v.hangul || v.branch || v.name ||
      v.hanja || v.char || v.zh || v.value || '';
  }
  v = String(v).trim();
  if (!v) return null;

  // 괄호/공백 제거 (예: "申(신)")
  const s = v.replace(/[()\s]/g, '');

  // 한글 지지
  if (BRANCH_KEYS.includes(s)) return s;

  // 한자 지지
  const idxH = BRANCH_HANJA.indexOf(s);
  if (idxH >= 0) return BRANCH_KEYS[idxH];

  // 로마자 지지
  const sLow = s.toLowerCase();
  const idxP = BRANCH_PINYIN.indexOf(sLow);
  if (idxP >= 0) return BRANCH_KEYS[idxP];

  // 영문 동물명
  if (BRANCH_ANIM_EN[sLow]) return BRANCH_ANIM_EN[sLow];

  // 숫자 인덱스(0~11) 허용
  if (/^\d+$/.test(sLow)) {
    const n = Number(sLow) % 12;
    return BRANCH_KEYS[n];
  }

  return null;
}

const BRANCH_TO_ANIMAL = {
  '자': '쥐띠', '축': '소띠', '인': '호랑이띠', '묘': '토끼띠',
  '진': '용띠', '사': '뱀띠', '오': '말띠',   '미': '양띠',
  '신': '원숭이띠', '유': '닭띠', '술': '개띠', '해': '돼지띠',
};

function getAnimalFromYearBranch(rawBranch) {
  const key = normalizeBranchKey(rawBranch);
  return key ? (BRANCH_TO_ANIMAL[key] || '—') : '—';
}

// 다양한 구조에서 연지(branch) 추출
function extractYearBranch(pillars) {
  if (!pillars) return null;
  // 흔한 구조들 방어적으로 탐색
  return (
    pillars?.year?.branch ??
    pillars?.yearBranch ??
    pillars?.year?.branchKr ??
    pillars?.year?.branchKo ??
    pillars?.year?.branchChar ??
    pillars?.year?.zhi ??
    null
  );
}

const SajooResult = () => {
  const [calculationData, setCalculationData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [aiResult, setAiResult] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState('');
  const [sentPayload, setSentPayload] = useState(null);

  // ✅ 오늘 날짜 문자열 (표시/만 나이 표현 참고용)
  const todayStr = useMemo(() => formatTodayKST(), []);

  const showDebug = useMemo(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('debug') === '1') return true;
      if (localStorage.getItem('SAJU_DEBUG') === '1') return true;
    } catch {}
    return false;
  }, []);

  const toInt = useCallback((v, fallback = undefined) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }, []);

  // sajuResult 없으면 계산(※ 오늘 날짜/일진/기둥은 사용하지 않음)
  const ensureSajuComputed = useCallback((data) => {
    if (data?.sajuResult?.year && data?.sajuResult?.month && data?.sajuResult?.day && data?.sajuResult?.hour) {
      return data;
    }

    const calendar = data.calendar || 'solar';
    const year = toInt(data.year);
    const month = toInt(data.month);
    const day = toInt(data.day);

    // ⬇️ 계산용과 표시용 분리: 표시용은 원본 그대로('' 지원), 계산용은 기본값(정오 12시) 사용
    const rawHour = (data.hour !== undefined ? data.hour : '');
    const rawMinute = (data.minute !== undefined ? data.minute : '');
    const hourForCalc = normalizeHour(rawHour) ?? 12;     // 모름이면 계산은 12시로
    const minuteForCalc = toInt(rawMinute, 0);

    const isLeap = data.leapMonth === 'leap' || data.isLeap === true;

    let sY, sM, sD;
    if (typeof data.solarDate === 'string') {
      const m = String(data.solarDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (m) { sY = toInt(m[1]); sM = toInt(m[2]); sD = toInt(m[3]); }
    }
    if (!sY || !sM || !sD) {
      if (calendar === 'lunar') {
        const d = lunarToSolar(year, month, day, isLeap);
        const solar = d instanceof Date ? d : new Date(d);
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
      year: year, month: month, day: day,
      // ⬇️ 표시용은 원본 유지(빈 문자열 허용)
      hour: rawHour,
      minute: rawMinute,
    };
  }, [toInt]);

  // 입력 "서명" (캐시 키) — 오늘 날짜 미포함(안정적 캐시)
  const buildSignature = useCallback((calc, fd) => {
    const {
      calendar, year, month, day,
      hour, minute, gender, leapMonth, solarDate,
      mbti: calcMbti,
    } = calc || {};
    const mbti = (fd?.mbti || calcMbti || '').toUpperCase();
    return [
      'SAJU',
      calendar, `${year}-${month}-${day}`, `${hour ?? ''}:${minute ?? ''}`,
      gender, leapMonth, solarDate || '', mbti
    ].join('|');
  }, []);

  // OpenAI 호출(오늘 날짜는 안내/나이 참고용으로만 제공)
  const generateAIReading = useCallback(async (ensured, fd, metaObj) => {
    setAiResult('');
    setIsLoadingAI(true);
    setError('');
    try {
      // 출생 컨텍스트
      let by = 0, bm = 0, bd = 0;
      if (typeof ensured.solarDate === 'string') {
        const m = ensured.solarDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) { by = Number(m[1]); bm = Number(m[2]); bd = Number(m[3]); }
      } else {
        by = toInt(ensured.year); bm = toInt(ensured.month); bd = toInt(ensured.day);
      }
      const hhDisplay = normalizeHour(ensured.hour);     // 표시용
      const hhCalc    = normalizeHour(ensured.hour) ?? 12; // 계산용 기본

      const birthCtx = {
        y: by, m: bm, d: bd,
        hh: hhCalc, mm: toInt(ensured.minute, 0) ?? 0,
        gender: ensured.gender || 'unknown',
        yearStem: ensured.sajuResult?.year?.stem,
      };

      const finalMeta = metaObj || analyzeSajuMeta(ensured.sajuResult, { birth: birthCtx });

      const brief =
        `- 입력 캘린더=${ensured.calendar || 'N/A'} ` +
        `생년월일=${ensured.year || 'YYYY'}.${ensured.month || 'MM'}.${ensured.day || 'DD'} ` +
        `${hhDisplay === null ? '모름' : pad2(hhDisplay)}:${pad2(toInt(ensured.minute, 0) ?? 0)} ` +
        `성별=${ensured.gender || 'N/A'} ` +
        `(양력=${ensured.solarDate || 'N/A'}, 윤달=${ensured.leapMonth || (ensured.isLeap ? 'leap' : 'normal')})\n` +
        `- 4주: 년(${ensured.sajuResult?.year?.stem || ''}${ensured.sajuResult?.year?.branch || ''}) ` +
        `월(${ensured.sajuResult?.month?.stem || ''}${ensured.sajuResult?.month?.branch || ''}) ` +
        `일(${ensured.sajuResult?.day?.stem || ''}${ensured.sajuResult?.day?.branch || ''}) ` +
        `시(${ensured.sajuResult?.hour?.stem || ''}${ensured.sajuResult?.hour?.branch || ''})\n` +
        `- 조회일(KST): ${todayStr}\n` +
        `- MBTI: ${(fd?.mbti || ensured.mbti || '미입력').toUpperCase()}`;

      // ✅ 프롬프트(기존 유지)
      const systemPrompt = [
        '당신은 명리·사주 풀이 무당입니다. 평생운을 풀이하고 다음 규칙을 반드시 지킵니다.',
        '모르거나 부정확한 풀이는 허위로 작성하지 말고 완전히 작성하지 마세요',
        '이 사람의 사주풀이에 대해서만 이야기하고 당사자에게 말하는 말투로 작성해줘.',
        '한글로 작성해야된다.',
        '사주기둥으로 윤친,신살,용신을 모두 해석할 것',
        '소제목은 항상 h3(###) 형식으로 작성하고, 추가 소제목/서론/결론/요약 금지',
        '평생운 총평, 과거운 풀이, 미래운 풀이, 자식운 풀이(자식이 언제쯤 생길지 이야기해줘), 직장운 풀이, 사업운 풀이, 건강운 풀이, 재물운 풀이, 삼재운 풀이, 연애운 풀이, 바람끼 풀이, 성욕 풀이(변태 성욕이 있는지 풀이해줘)로 소제목을 작성해줘.',
        '각 항목별 500자 정도 작성할것',
        '주어진 데이터에 따른 풀이만 이야기하고 명리용어 및 전문용어설명 금지, 조언금지 JSON에 없는 추정/가정 금지.',
        'todayKST는 조회일·나이 표현 참고용일 뿐, 오늘의 일진/시주는 새로 세우지 않습니다.',
        '**일반적이지 않은 내용을 위주로 작성하고 항목마다 500자 내외로 자세히 서술하세요',
        '해결방법을 제시하지말것, 조언하지말것, 소설쓰지말것, 충고하지말것 사주풀이만 이야기할것',
      ].join(' ');

      const payloadForAI = JSON.stringify({
        birth: {
          calendar: ensured.calendar,
          y: ensured.year, m: ensured.month, d: ensured.day,
          hh: hhCalc, mm: toInt(ensured.minute, 0) ?? 0,
          gender: ensured.gender || 'unknown',
          solarDate: ensured.solarDate,
          leapMonth: ensured.leapMonth || (ensured.isLeap ? 'leap' : 'normal'),
        },
        pillars: ensured.sajuResult,
        meta: finalMeta,
        todayKST: todayStr,
        mbti: (fd?.mbti || ensured.mbti || '').toUpperCase(),
      }, null, 2);

      const userPrompt = [
        '분석용 JSON:',
        '```json',
        payloadForAI,
        '```',
        '',
        '※ 추가 소제목/서론/결론/요약 금지. 각 항목은 한 단락으로만 작성.'
      ].join('\n');

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: brief + "\n\n" + userPrompt },
      ];

      setSentPayload({
        birth: {
          calendar: ensured.calendar,
          y: ensured.year, m: ensured.month, d: ensured.day,
          hh: hhCalc, mm: toInt(ensured.minute, 0) ?? 0,
          gender: ensured.gender || 'unknown',
          solarDate: ensured.solarDate,
          leapMonth: ensured.leapMonth || (ensured.isLeap ? 'leap' : 'normal'),
        },
        pillars: ensured.sajuResult,
        meta: finalMeta,
        todayKST: todayStr,
        mbti: (fd?.mbti || ensured.mbti || '').toUpperCase(),
      });

      const signature = buildSignature(ensured, fd); // ✅ todayStr 미포함(같은 입력이면 동일 캐시)
      const text = await callOpenAI({ messages, cacheKey: signature });
      setAiResult(text || '');

      saveAiResultToCookie(text || '', { signature });
      saveSajuMetaToCookie(finalMeta, { signature });
      setMeta(finalMeta);
    } catch (e) {
      setError(`AI 풀이 생성에 실패했습니다.\n${e?.message ? `오류: ${e.message}` : ''}`);
    } finally {
      setIsLoadingAI(false);
    }
  }, [buildSignature, toInt, todayStr]);

  // StrictMode 중복 방지
  const effectRunRef = useRef(false);

  // 쿠키 로드 + 계산 보장 + (메타/AI) 복원 또는 생성
  useEffect(() => {
    if (effectRunRef.current) return;
    effectRunRef.current = true;

    const rawForm = loadFormDataFromCookie() || null;
    const rawCalc = loadCalculationDataFromCookie();

    if (!rawCalc) {
      setError('입력 데이터가 없습니다. 먼저 정보를 입력해 주세요.');
      return;
    }
    try {
      const ensured = ensureSajuComputed(rawCalc); // ✅ 오늘 기둥 계산 없음
      setCalculationData(ensured);
      saveCalcCookie(ensured); // ⬅️ 표시용 hour('' 가능) 그대로 저장

      const signature = buildSignature(ensured, rawForm);

      // 1) 메타 복원 또는 계산
      const savedMeta = loadSajuMetaFromCookie();
      const metaOK = !!(savedMeta?.meta && savedMeta?.metaSignature === signature);
      let metaForAI = null;

      if (metaOK) {
        setMeta(savedMeta.meta);
        metaForAI = savedMeta.meta;
      } else {
        // 로컬 메타 계산(출생 4주만 사용)
        let by = 0, bm = 0, bd = 0;
        if (typeof ensured.solarDate === 'string') {
          const m = ensured.solarDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) { by = Number(m[1]); bm = Number(m[2]); bd = Number(m[3]); }
        } else {
          by = Number(ensured.year); bm = Number(ensured.month); bd = Number(ensured.day);
        }
        const birthCtx = {
          y: by, m: bm, d: bd,
          hh: normalizeHour(ensured.hour) ?? 12, mm: Number(ensured.minute ?? 0),
          gender: ensured.gender || 'unknown',
          yearStem: ensured.sajuResult?.year?.stem,
        };
        const computedMeta = analyzeSajuMeta(ensured.sajuResult, { birth: birthCtx });
        setMeta(computedMeta);
        saveSajuMetaToCookie(computedMeta, { signature });
        metaForAI = computedMeta;
      }

      // 2) AI 결과 복원
      const savedAI = loadAiResultFromCookie();
      const aiOK = !!(savedAI?.text && savedAI?.meta?.signature === signature);
      if (aiOK) {
        setAiResult(savedAI.text);
        return; // 캐시 있으니 재생성 안 함
      }

      // 3) 없으면 생성 (todayKST는 안내/나이 참고용으로만 전달)
      generateAIReading(ensured, rawForm, metaForAI);
    } catch {
      setError('명식을 계산하는 중 오류가 발생했습니다.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureSajuComputed, buildSignature]);

  // 화면 로딩 오버레이 노출 조건
  const showBootLoading = !calculationData && !error;    // 초기 데이터 준비 중
  const showAiLoading   =  isLoadingAI && !error;        // AI 해석 생성 중
  const showFullLoader  = showBootLoading || showAiLoading;

  // 기본정보 박스
  const BasicInfoBox = ({ data, pillars }) => {
    if (!data) return null;
    const calendarKr = data.calendar === 'lunar' ? '음력' : '양력';
    const y = data.year ?? data.y;
    const m = data.month ?? data.m;
    const d = data.day ?? data.d;
    const hh = data.hour ?? data.hh;

    const genderKr = data.gender === 'male' ? '남성' : data.gender === 'female' ? '여성' : (data.gender || '미입력');
    const mbti = (data.mbti || '').toUpperCase() || '미입력';
    const leapStr = data.calendar === 'lunar'
      ? ((data.leapMonth === 'leap' || data.isLeap) ? '윤달' : '평달')
      : '-';
    const solarStr = (data.solarDate || '').replace(/-/g, '.');

    const showSolar = data.calendar === 'lunar' && solarStr;

    const birthline = formatBirthline({ year: y, month: m, day: d, hour: hh });
    const solarLine = showSolar
      ? (normalizeHour(hh) === null ? `${solarStr} 모름` : `${solarStr} ${pad2(normalizeHour(hh))}시`)
      : '';

    // ✅ 만 나이(양력 기준)
    let ageForCalc = { y: Number(y), m: Number(m), d: Number(d) };
    // 음력 입력이지만 solarDate를 가진 경우 → 양력으로 환산된 날짜를 우선 사용
    if (data.calendar === 'lunar' && typeof data.solarDate === 'string') {
      const ms = data.solarDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (ms) ageForCalc = { y: Number(ms[1]), m: Number(ms[2]), d: Number(ms[3]) };
    }
    const ageNum = computeAgeFromYMD(ageForCalc.y, ageForCalc.m, ageForCalc.d);
    const ageStr = Number.isFinite(ageNum) ? `만 ${ageNum}세` : '—';

        // ✅ 띠 계산 (설날 기준): 음력 1월 1일(설날) 이전 출생이면 전년도 띠
        let zodiacAnimal = '—';
        try {
          // 기준 양력 출생일(음력 입력이면 이미 solarDate로 환산됨)
          let sy, sm, sd;
          if (typeof data.solarDate === 'string') {
            const m = data.solarDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) { sy = Number(m[1]); sm = Number(m[2]); sd = Number(m[3]); }
          } else {
            sy = Number(y); sm = Number(m); sd = Number(d);
          }
          if (Number.isFinite(sy) && Number.isFinite(sm) && Number.isFinite(sd)) {
            const birthDate = new Date(sy, sm - 1, sd);
            const lunarNY = lunarToSolar(sy, 1, 1, false); // 해당 양력년의 설날(음력 1.1)
            // 출생일이 설날보다 앞이면 전년도 기준으로 띠 계산
            const zodiacYear = birthDate < lunarNY ? sy - 1 : sy;
            const BRANCHES_HAN = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
            const branch = BRANCHES_HAN[((zodiacYear - 1984) % 12 + 12) % 12];
            zodiacAnimal = getAnimalFromYearBranch(branch) || '—';
          }
        } catch {}

    return (
      <div className="info-box info-soft" aria-label="기본정보" style={{ marginTop: 10 }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>📋 계산 기준 정보(입력·변환 요약)</strong>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li>달력: <strong>{calendarKr}</strong></li>
          <li>생년월일: <strong>{birthline}</strong></li>
          {showSolar && (
            <li>양력변환: <strong>{solarLine}</strong></li>
          )}
          {data.calendar === 'lunar' && (
            <li>윤달 여부: <strong>{leapStr}</strong></li>
          )}
          <li>성별: <strong>{genderKr}</strong></li>
          <li>MBTI: <strong>{mbti}</strong></li>
          <li>만 나이: <strong>{ageStr}</strong></li>
          <li>띠(설날 기준): <strong>{zodiacAnimal}</strong></li>
          {/* ✅ 조회일(KST) — 오늘 기둥 계산과 무관, 표시/나이 참고용 */}
          <li>조회일(KST): <strong>{todayStr}</strong></li>
        </ul>
      </div>
    );
  };

  const hasAI = useMemo(() => typeof aiResult === 'string' && aiResult.trim().length > 0, [aiResult]);
  const showCalcNotes = useMemo(() => hasAI && !isLoadingAI && !error, [hasAI, isLoadingAI, error]);

  // ---------- 렌더 ----------
  // 입력 데이터가 전혀 없으면 안내
  if (error && !calculationData) {
    return (
      <div className="calculator">
        <InputRequiredGuide homeHref="/" />
      </div>
    );
  }

  const { sajuResult } = calculationData || {};

  return (
    <div className="calculator">
      {/* 🔵 전면 로딩 오버레이 (공용) */}
      <FullScreenLoader
        show={showFullLoader}
        title={showBootLoading ? '사주 정보를 불러오는 중…' : 'AI 해석을 준비하고 있어요'}
        message={showBootLoading ? '입력값을 검증하고 명식을 계산하는 중입니다.' : '한 번 생성되면 같은 입력에서는 동일한 결과가 제공됩니다.'}
      />

      <div className="card result" aria-busy={showFullLoader ? 'true' : 'false'}>
        <h2>사주팔자 결과</h2>

        {sajuResult ? (
          <>
            <div style={{ marginTop: 0 }}>
              <h3 style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>출생 사주 기둥</h3>
              <PillarDisplay pillars={sajuResult} />
            </div>

            {/* 1) 계산 기준 정보(입력·변환 요약) + 나이/띠/조회일 */}
            <BasicInfoBox data={calculationData} pillars={sajuResult} />

            {/* 2) AI 해석 — 로딩 중에는 렌더하지 않음(오버레이만 보이도록) */}
            {!isLoadingAI && (
              <AIFortune content={aiResult} isLoading={false} error={error} />
            )}

            {/* 3) 계산식 안내(출생 4주만 기준) */}
            {showCalcNotes && (
              <details className="info-box info-soft calc-notes" style={{ marginTop: 12 }}>
                <summary>📘 이 결과는 이렇게 계산했어요 (펼치기)</summary>
                <div className="calc-body">
                  <ol>
                    <li><strong>입력 전처리</strong>: 음력 선택 시 양력 변환(윤달 반영).</li>
                    <li><strong>연주</strong>: 입춘(≈ 2/4) 이전 출생은 전년으로 간주 → 1984년=갑자 기준 10간/12지 모듈러.</li>
                    <li><strong>월주</strong>: 절기 경계 근사표로 월지 결정, 월간은 <em>기두법</em>(寅 기준 순가산).</li>
                    <li><strong>일주</strong>: 기준 갑자일 앵커 + <em>중경법</em>(23:30 이후 익일).</li>
                    <li><strong>시주</strong>: 子시 23:30 시작, 2시간 단위 12지 분할, 일간그룹별 시작간 적용.</li>
                    <li><strong>절기</strong>: 24절기 월/일 근사표로 현재/다음 절기 표기.</li>
                    <li><strong>오행·신강</strong>: 간·지·장간 가중 합산 + 계절 보정 점수로 판정.</li>
                    <li><strong>합·충·형·해·파·원진</strong>: 표준 테이블로 성립여부 탐지.</li>
                    <li><strong>격국</strong>: 월지 오행과 일간의 생극관계로 1차 분류.</li>
                    <li><strong>용신</strong>: 신강도·계절 기반으로 순환/조후 용신 참조.</li>
                    <li><strong>대운</strong>: 출생→절입까지 일수로 환산, 10년 주기 전개.</li>
                    <li><strong>세운</strong>: 1984=갑자 기준으로 연운 산출.</li>
                  </ol>
                  <p className="caption">※ 오늘 날짜(todayKST)는 결과의 표현(조회일·나이) 참고에만 쓰이며, 오늘의 일진/기둥 계산은 포함하지 않습니다.</p>
                </div>
                <style>{`
                  .calc-notes > summary { cursor: pointer; font-weight: 600; color: var(--ink-strong, #222); list-style: none; }
                  .calc-notes[open] > summary { margin-bottom: 8px; }
                  .calc-body ol { margin: 0; padding-left: 18px; line-height: 1.6; }
                  .calc-body li { margin: 6px 0; }
                  .calc-body em { font-style: normal; color: var(--accent, #7a5af8); }
                  .calc-body .caption { margin-top: 8px; color: var(--ink-soft, #666); font-size: .9rem; }
                `}</style>
              </details>
            )}

            {showDebug && sentPayload ? (
              <details className="info-box" style={{ marginTop: 12 }}>
                <summary>보낸 데이터 미리보기 (AI 프롬프트용)</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 8 }}>
                  {JSON.stringify(sentPayload, null, 2)}
                </pre>
              </details>
            ) : null}

            {showDebug && meta ? (
              <details className="info-box" style={{ marginTop: 8 }}>
                <summary>메타 미리보기 (오행/신강/합충/격국/용신/대운/세운)</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 8 }}>
                  {JSON.stringify(meta, null, 2)}
                </pre>
              </details>
            ) : null}
          </>
        ) : (
          // 데이터가 준비되기 전에 여기로 떨어질 수 있으나,
          // 전면 로더가 덮고 있으므로 사용자에게는 안 보임(접근성용 문구만)
          <div className="sr-only" aria-live="polite">
            사주 정보를 불러오고 있습니다…
          </div>
        )}
      </div>
    </div>
  );
};

export default SajooResult;
