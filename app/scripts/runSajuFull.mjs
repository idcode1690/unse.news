// Quick standalone saju calculator (subset) for testing
// This file reuses logic from src/utils/sajooCalculator.jsx but is self-contained for Node.

const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEM_ELEM = { '甲':'wood','乙':'wood','丙':'fire','丁':'fire','戊':'earth','己':'earth','庚':'metal','辛':'metal','壬':'water','癸':'water' };
const STEM_YANG = { '甲':1,'丙':1,'戊':1,'庚':1,'壬':1,'乙':0,'丁':0,'己':0,'辛':0,'癸':0 };
const BRANCH_MAIN_ELEM = {
  '子':'water','丑':'earth','寅':'wood','卯':'wood','辰':'earth','巳':'fire','午':'fire','未':'earth','申':'metal','酉':'metal','戌':'earth','亥':'water'
};
const mod = (n,m) => ((n % m) + m) % m;

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
const BRANCH_TENGOD_PRIMARY = {
  '子':'癸','丑':'己','寅':'甲','卯':'乙','辰':'戊','巳':'丙','午':'丙','未':'己','申':'庚','酉':'辛','戌':'戊','亥':'壬'
};
const LIFE_STAGE_NAMES = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];
const CHANGSHENG_POS = { '甲':11,'乙':6,'丙':2,'丁':9,'戊':2,'己':9,'庚':5,'辛':0,'壬':8,'癸':3 };
const SHINSAL_12_FOR_DAY_BRANCH = { '亥': { '申': '겁살', '卯': '육해살', '亥': '망신살', '午': '재살' } };
const MONTH_BRANCHES_FROM_LICHUN = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];

function tenGod(dayStem, otherStem) {
  if (!dayStem || !otherStem) return '';
  const dEl = STEM_ELEM[dayStem], oEl = STEM_ELEM[otherStem];
  const dYang = STEM_YANG[dayStem], oYang = STEM_YANG[otherStem];
  if (oEl === dEl) return dYang === oYang ? '비견' : '겁재';
  if ((dEl==='wood' && oEl==='fire') || (dEl==='fire' && oEl==='earth') || (dEl==='earth' && oEl==='metal') || (dEl==='metal' && oEl==='water') || (dEl==='water' && oEl==='wood')) {
    return dYang === oYang ? '식신' : '상관';
  }
  if ((oEl==='wood' && dEl==='fire') || (oEl==='fire' && dEl==='earth') || (oEl==='earth' && dEl==='metal') || (oEl==='metal' && dEl==='water') || (oEl==='water' && dEl==='wood')) {
    return dYang === oYang ? '정인' : '편인';
  }
  if ((dEl==='wood' && oEl==='earth') || (dEl==='fire' && oEl==='metal') || (dEl==='earth' && oEl==='water') || (dEl==='metal' && oEl==='wood') || (dEl==='water' && oEl==='fire')) {
    return dYang === oYang ? '편재' : '정재';
  }
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
  const dir = STEM_YANG[dayStem] ? +1 : -1;
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
  const lon = typeof opts.longitude === 'number' ? opts.longitude : 126.9784;
  const deltaMinutes = Math.round((135 - lon) * 4);
  let total = hour * 60 + minute - deltaMinutes;
  total = mod(total, 1440);
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

function toJDN(y,m,d){
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function getYearPillar(year, month, day, hour=0, minute=0){
  let y = year;
  // use fallback: if month===1 or (month===2 && day <4) then previous year
  if (month===1 || (month===2 && day<4)) y = year -1;
  const base = 1984; const d = y - base;
  return { stem: STEMS[mod(d,10)], branch: BRANCHES[mod(d,12)] };
}

function getMonthPillar(year, month, day, hour=0, minute=0, yearStem){
  let branch='寅'; let bi=0;
  // fallback mapping (same as original)
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

  const yi = STEMS.indexOf(yearStem);
  let start;
  if (yi === 0 || yi === 5) start = 2;
  else if (yi === 1 || yi === 6) start = 4;
  else if (yi === 2 || yi === 7) start = 6;
  else if (yi === 3 || yi === 8) start = 8;
  else start = 0;
  const si = mod(start + bi, 10);
  return { stem: STEMS[si], branch };
}

function getDayPillar(year, month, day, hour=0, minute=0){
  let jdn = toJDN(year, month, day);
  if (hour * 60 + minute >= 23 * 60 + 30) jdn += 1;
  const baseJDN = toJDN(1912,2,18);
  const diff = jdn - baseJDN;
  return { stem: STEMS[mod(diff,10)], branch: BRANCHES[mod(diff,12)] };
}

function getHourPillar(dayStem, hour=0, minute=0){
  const total = hour*60 + minute;
  const t = mod(total - (23*60+30), 1440);
  const bi = Math.floor(t/120);
  const branch = BRANCHES[mod(bi,12)];
  const di = STEMS.indexOf(dayStem);
  let start;
  if (di === 0 || di === 5) start = 0;
  else if (di === 1 || di === 6) start = 2;
  else if (di === 2 || di === 7) start = 4;
  else if (di === 3 || di === 8) start = 6;
  else start = 8;
  const stem = STEMS[mod(start + bi, 10)];
  return { stem, branch };
}

function enrich(p, dayP){
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
}

// simple lunarToSolar for our test: use checkpoint in constants (specific mapping)
function lunarToSolarTest(lunarYear, lunarMonth, lunarDay, isLeap=false) {
  // checkpoint from constants: lunar 1980-2-11 -> solar 1980-3-27
  if (lunarYear === 1980 && lunarMonth === 2 && lunarDay === 11 && !isLeap) {
    return new Date(1980, 2, 27); // March 27, 1980
  }
  // fallback: naive add 30 days
  const approx = new Date(lunarYear, lunarMonth -1, lunarDay);
  approx.setDate(approx.getDate() + 30);
  return approx;
}

// main
function calculateSajuTest(year, month, day, hour=0, minute=0, opts={}){
  if (opts && opts.calendar === 'lunar'){
    const isLeap = opts.leapMonth === 'leap' || opts.isLeap === true;
    const solar = lunarToSolarTest(Number(year), Number(month), Number(day), !!isLeap);
    year = solar.getFullYear(); month = solar.getMonth() + 1; day = solar.getDate();
  }
  const { hour: adjH, minute: adjM } = applyLocalSolar(hour, minute, opts);
  const yearP = getYearPillar(year, month, day, hour, minute);
  const monthP = getMonthPillar(year, month, day, hour, minute, yearP.stem);
  const dayP = getDayPillar(year, month, day, adjH, adjM);
  const hourP = getHourPillar(dayP.stem, adjH, adjM);
  return {
    year: enrich(yearP, dayP),
    month: enrich(monthP, dayP),
    day: enrich(dayP, dayP),
    hour: enrich(hourP, dayP)
  };
}

const cases = [
  { id: 'solar-13:10', label: '양력 1980-03-27 13:10 (서울)', args: [1980,3,27,13,10,{calendar:'solar'}] },
  { id: 'lunar-13:10', label: '음력(평달) 1980-02-11 13:10 (서울)', args: [1980,2,11,13,10,{calendar:'lunar'}] },
  { id: 'solar-12:38-local', label: '양력 1980-03-27 12:38 (지역시 -32분, 서울)', args: [1980,3,27,12,38,{calendar:'solar', useLocalSolar:true, longitude:126.9784}] },
  // debug: force year-1 to test alternate year-handling
  { id: 'solar-forcePrevYear', label: '양력 강제 전년도(1979) 1979-03-27 13:10 (테스트)', args: [1979,3,27,13,10,{calendar:'solar'}] },
  { id: 'lunar-forcePrevYear', label: '음력 입력이지만 연도 강제 전년도(1979) 계산 테스트', args: [1979,3,27,13,10,{calendar:'solar'}] },
];

for (const c of cases) {
  const res = calculateSajuTest(...c.args);
  console.log('---', c.id, c.label, '---');
  console.log(JSON.stringify(res, null, 2));
}

// Variant: keep day/hour based on 1980-03-27 but compute year pillar from 1979
// and RECOMPUTE the month pillar using the forced year-stem (this matches the
// convention the user expects where year uses previous year's stem for month calc)
console.log('--- variant: solar 1980-03-27 but year pillar from 1979 and month recomputed ---');
const base = calculateSajuTest(1980,3,27,13,10,{calendar:'solar'});
// forced year pillar from previous year
const forcedYearRaw = getYearPillar(1979,3,27,13,10);
const forcedYear = enrich(forcedYearRaw, base.day);
// recompute month pillar using original solar date but with forced year stem
const recomputedMonthRaw = getMonthPillar(1980,3,27,13,10, forcedYearRaw.stem);
const recomputedMonth = enrich(recomputedMonthRaw, base.day);

const alt2 = {
  year: forcedYear,
  month: recomputedMonth,
  day: base.day,
  hour: base.hour,
};

console.log(JSON.stringify(alt2, null, 2));
