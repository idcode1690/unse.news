// src/utils/sajooCalculator.js
// 사주(년/월/일/시) + 십성/지장간/12운성/12신살 계산

import { toJDN, lunarToSolar } from './lunarCalendar';
import { getSolarTermKST, makeKSTDateUTC } from './solarTermsKST';

// 내부 유틸
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEM_ELEM = { '甲':'wood','乙':'wood','丙':'fire','丁':'fire','戊':'earth','己':'earth','庚':'metal','辛':'metal','壬':'water','癸':'water' };
const STEM_YANG = { '甲':1,'丙':1,'戊':1,'庚':1,'壬':1,'乙':0,'丁':0,'己':0,'辛':0,'癸':0 };
const BRANCH_MAIN_ELEM = {
  '子':'water','丑':'earth','寅':'wood','卯':'wood','辰':'earth','巳':'fire','午':'fire','未':'earth','申':'metal','酉':'metal','戌':'earth','亥':'water'
};
const mod = (n, m) => ((n % m) + m) % m;

// 지장간(표시용)
const HIDDEN_STEMS = {
  '子': ['癸'],
  '丑': ['己','癸','辛'],
  '寅': ['甲','丙','戊'],
  '卯': ['甲','乙'],
  '辰': ['戊','乙','癸'],
  '巳': ['丙','戊','庚'],
  '午': ['丙','己','丁'],
  '未': ['己','乙','丁'],
  '申': ['戊','壬','庚'],
  '酉': ['辛'],
  '戌': ['戊','辛','丁'],
  '亥': ['戊','甲','壬'],
};

// 지지 대표간(지지 십성 판단용)
const BRANCH_TENGOD_PRIMARY = {
  '子':'癸','丑':'己','寅':'甲','卯':'乙','辰':'戊','巳':'丙','午':'丙','未':'己','申':'庚','酉':'辛','戌':'戊','亥':'壬'
};

// 12운성
const LIFE_STAGE_NAMES = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];
const CHANGSHENG_POS = {
  '甲': 11, '乙': 6, '丙': 2, '丁': 9, '戊': 2, '己': 9, '庚': 5, '辛': 0, '壬': 8, '癸': 3
};

// 12신살(요청 케이스 위주)
const SHINSAL_12_FOR_DAY_BRANCH = {
  '亥': { '申': '겁살', '卯': '육해살', '亥': '망신살', '午': '재살' }
};

// ── 계산 보조 ─────────────────────────────────────────
function tenGod(dayStem, otherStem) {
  if (!dayStem || !otherStem) return '';
  const dEl = STEM_ELEM[dayStem], oEl = STEM_ELEM[otherStem];
  const dYang = STEM_YANG[dayStem], oYang = STEM_YANG[otherStem];

  if (oEl === dEl) return dYang === oYang ? '비견' : '겁재';
  // 내가 생함 → 식상
  if ((dEl==='wood' && oEl==='fire') || (dEl==='fire' && oEl==='earth') || (dEl==='earth' && oEl==='metal') || (dEl==='metal' && oEl==='water') || (dEl==='water' && oEl==='wood')) {
    return dYang === oYang ? '식신' : '상관';
  }
  // 나를 생함 → 인성
  if ((oEl==='wood' && dEl==='fire') || (oEl==='fire' && dEl==='earth') || (oEl==='earth' && dEl==='metal') || (oEl==='metal' && dEl==='water') || (oEl==='water' && dEl==='wood')) {
    return dYang === oYang ? '정인' : '편인';
  }
  // 내가 극함 → 재성
  if ((dEl==='wood' && oEl==='earth') || (dEl==='fire' && oEl==='metal') || (dEl==='earth' && oEl==='water') || (dEl==='metal' && oEl==='wood') || (dEl==='water' && oEl==='fire')) {
    return dYang === oYang ? '편재' : '정재';
  }
  // 나를 극함 → 관살
  if ((oEl==='wood' && dEl==='earth') || (oEl==='fire' && dEl==='metal') || (oEl==='earth' && dEl==='water') || (oEl==='metal' && dEl==='wood') || (oEl==='water' && dEl==='fire')) {
    return dYang === oYang ? '편관' : '정관';
  }
  return '';
}

function lifeStage(dayStem, branch) {
  const start = CHANGSHENG_POS[dayStem];
  if (start == null) return '';
  const bIdx = BRANCHES.indexOf(branch);
  if (bIdx < 0) return '';
  const dir = STEM_YANG[dayStem] ? +1 : -1; // 양간 순행, 음간 역행
  const dist = mod((bIdx - start) * dir, 12);
  return LIFE_STAGE_NAMES[dist] || '';
}

function shinSal(dayBranch, targetBranch) {
  const map = SHINSAL_12_FOR_DAY_BRANCH[dayBranch];
  if (!map) return '';
  return map[targetBranch] || '';
}

function applyLocalSolar(hour, minute, opts) {
  if (!opts || !opts.useLocalSolar) return { hour, minute };
  const lon = typeof opts.longitude === 'number' ? opts.longitude : 126.9784; // 서울 기본
  const deltaMinutes = Math.round((135 - lon) * 4); // 1도=4분
  let total = hour * 60 + minute - deltaMinutes;
  total = mod(total, 1440);
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

// ── 사주 기둥 ─────────────────────────────────────────
// λ: 태양 겉보기 황경(춘분=0°). 입춘은 λ=315° 근방.
const MONTH_BRANCHES_FROM_LICHUN = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];

function getSolarLongitudeAtKST(year, month, day, hour = 0, minute = 0){
  const dateUTC = makeKSTDateUTC(year, month, day, hour, minute);
  const { lambda } = getSolarTermKST(dateUTC);
  return lambda; // 0..360
}

export function getYearPillar(year, month, day, hour = 0, minute = 0) {
  // 입춘(λ≥315°) 이전이면 전년으로 간주
  let y = year;
  try {
    const lambda = getSolarLongitudeAtKST(year, month, day, hour, minute);
    if (lambda < 315) y = year - 1;
  } catch {
    // fallback: 기존 근사 (2/4 이전 전년)
    if (month === 1 || (month === 2 && day < 4)) y = year - 1;
  }
  const base = 1984; // 甲子
  const d = y - base;
  return { stem: STEMS[mod(d, 10)], branch: BRANCHES[mod(d, 12)] };
}

export function getMonthPillar(year, month, day, hour = 0, minute = 0, yearStem) {
  let branch = '寅';
  let bi = 0;
  try {
    const lambda = getSolarLongitudeAtKST(year, month, day, hour, minute);
    // 입춘(315°) 기준 30° 구간으로 월지 결정
    const idx = Math.floor(((lambda - 315 + 360) % 360) / 30);
    branch = MONTH_BRANCHES_FROM_LICHUN[idx];
    bi = idx;
  } catch {
    // fallback: 기존 근사 bi 계산
    if ((month === 2 && day >= 4)  || (month === 3 && day < 5))  bi = 0; // 寅
    else if ((month === 3 && day >= 5)  || (month === 4 && day < 4))  bi = 1; // 卯
    else if ((month === 4 && day >= 4)  || (month === 5 && day < 5))  bi = 2;
    else if ((month === 5 && day >= 5)  || (month === 6 && day < 5))  bi = 3;
    else if ((month === 6 && day >= 5)  || (month === 7 && day < 7))  bi = 4;
    else if ((month === 7 && day >= 7)  || (month === 8 && day < 7))  bi = 5;
    else if ((month === 8 && day >= 7)  || (month === 9 && day < 7))  bi = 6;
    else if ((month === 9 && day >= 7)  || (month === 10 && day < 8)) bi = 7;
    else if ((month === 10 && day >= 8) || (month === 11 && day < 7)) bi = 8;
    else if ((month === 11 && day >= 7) || (month === 12 && day < 7)) bi = 9;
    else if ((month === 12 && day >= 7) || (month === 1 && day < 5))  bi = 10;
    else bi = 11;
    branch = MONTH_BRANCHES_FROM_LICHUN[bi];
  }

  // 월간: 연간 그룹별 寅월 시작간에서 순가산
  const yi = STEMS.indexOf(yearStem);
  let start; // 寅월의 천간 index
  if (yi === 0 || yi === 5) start = 2;       // 甲/己→丙
  else if (yi === 1 || yi === 6) start = 4;  // 乙/庚→戊
  else if (yi === 2 || yi === 7) start = 6;  // 丙/辛→庚
  else if (yi === 3 || yi === 8) start = 8;  // 丁/壬→壬
  else start = 0;                             // 戊/癸→甲

  const si = mod(start + bi, 10);
  return { stem: STEMS[si], branch };
}

export function getDayPillar(year, month, day, hour = 0, minute = 0) {
  let jdn = toJDN(year, month, day);
  if (hour * 60 + minute >= 23 * 60 + 30) jdn += 1; // 자시 23:30 이후 익일
  const baseJDN = toJDN(1912, 2, 18); // 甲子일
  const diff = jdn - baseJDN;
  return { stem: STEMS[mod(diff, 10)], branch: BRANCHES[mod(diff, 12)] };
}

export function getHourPillar(dayStem, hour = 0, minute = 0) {
  const total = hour * 60 + minute;
  const t = mod(total - (23 * 60 + 30), 1440);
  const bi = Math.floor(t / 120);
  const branch = BRANCHES[mod(bi, 12)];
  const di = STEMS.indexOf(dayStem);
  let start;
  if (di === 0 || di === 5) start = 0;     // 甲/己→甲
  else if (di === 1 || di === 6) start = 2;// 乙/庚→丙
  else if (di === 2 || di === 7) start = 4;// 丙/辛→戊
  else if (di === 3 || di === 8) start = 6;// 丁/壬→庚
  else start = 8;                           // 戊/癸→壬
  const stem = STEMS[mod(start + bi, 10)];
  return { stem, branch };
}

export function getCurrentSeason(year, month, day, hour = 12, minute = 0) {
  try {
    const dUTC = makeKSTDateUTC(year, month, day, hour, minute);
    const { name } = getSolarTermKST(dUTC);
    return { name };
  } catch {
    // 근사 fallback
    const names = [
      [1, 5, '소한'], [1, 20, '대한'], [2, 4, '입춘'], [2, 19, '우수'], [3, 6, '경칩'], [3, 21, '춘분'],
      [4, 5, '청명'], [4, 20, '곡우'], [5, 6, '입하'], [5, 21, '소만'], [6, 6, '망종'], [6, 21, '하지'],
      [7, 7, '소서'], [7, 23, '대서'], [8, 7, '입추'], [8, 23, '처서'], [9, 7, '백로'], [9, 23, '추분'],
      [10, 8, '한로'], [10, 23, '상강'], [11, 7, '입동'], [11, 22, '소설'], [12, 7, '대설'], [12, 22, '동지'],
    ];
    const d = new Date(year, month - 1, day);
    let curr = names[0][2];
    for (const [m, dd, nm] of names) {
      const td = new Date(year, m - 1, dd);
      if (d >= td) curr = nm;
    }
    return { name: curr };
  }
}

export function calculateSaju(year, month, day, hour = 0, minute = 0, opts = {}) {
  // If input is lunar, convert to solar date first (preserve hour/minute)
  if (opts && opts.calendar === 'lunar') {
    const isLeap = opts.leapMonth === 'leap' || opts.isLeap === true;
    const solar = lunarToSolar(Number(year), Number(month), Number(day), !!isLeap);
    year = solar.getFullYear();
    month = solar.getMonth() + 1;
    day = solar.getDate();
  }

  const { hour: adjH, minute: adjM } = applyLocalSolar(hour, minute, opts);

  // 연/월주는 KST 절입 시각 반영(표준시 기준). 일/시주는 (선택 시) 지역태양시 보정 적용.
  const yearP = getYearPillar(year, month, day, hour, minute);
  const monthP = getMonthPillar(year, month, day, hour, minute, yearP.stem);
  const dayP = getDayPillar(year, month, day, adjH, adjM);
  const hourP = getHourPillar(dayP.stem, adjH, adjM);
  const season = getCurrentSeason(year, month, day, hour, minute);

  const enrich = (p) => {
    const hs = HIDDEN_STEMS[p.branch] || [];
    const branchRep = BRANCH_TENGOD_PRIMARY[p.branch] || hs[0];
    return {
      ...p,
      tenGodStem: tenGod(dayP.stem, p.stem),
      tenGodBranch: branchRep ? tenGod(dayP.stem, branchRep) : '',
      hiddenStems: hs,
      lifeStage: lifeStage(dayP.stem, p.branch),
      shinsal: shinSal(dayP.branch, p.branch) || '',
      elemStem: STEM_ELEM[p.stem],
      elemBranch: BRANCH_MAIN_ELEM[p.branch],
    };
  };

  return {
    year: enrich(yearP),
    month: enrich(monthP),
    day: enrich(dayP),
    hour: enrich(hourP),
    season,
  };
}
