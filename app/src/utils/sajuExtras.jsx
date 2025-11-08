// 사주 확장 계산 유틸: 오행 분포, 신강/신약, 합/충/형/해/파/원진, 격국(기초), 용신(휴리스틱), 대운(근사), 세운(연운)

import { STEMS_HAN, BRANCHES_HAN, SOLAR_TERMS } from './constants';

//////////////////////////////
// 0. 기본 매핑/테이블
//////////////////////////////

// 천간 → 오행
const STEM_ELEMENT = {
  '甲': '목', '乙': '목',
  '丙': '화', '丁': '화',
  '戊': '토', '己': '토',
  '庚': '금', '辛': '금',
  '壬': '수', '癸': '수',
};
// 지지 → 오행
const BRANCH_ELEMENT = {
  '子': '수', '丑': '토', '寅': '목', '卯': '목',
  '辰': '토', '巳': '화', '午': '화', '未': '토',
  '申': '금', '酉': '금', '戌': '토', '亥': '수',
};

// 지지 → 장간(숨은 천간) + 가중치(합 1.0 근사)
const HIDDEN_STEMS = {
  '子': [{ stem: '壬', w: 1.0 }],
  '丑': [{ stem: '己', w: 0.5 }, { stem: '癸', w: 0.3 }, { stem: '辛', w: 0.2 }],
  '寅': [{ stem: '甲', w: 0.6 }, { stem: '丙', w: 0.3 }, { stem: '戊', w: 0.1 }],
  '卯': [{ stem: '乙', w: 1.0 }],
  '辰': [{ stem: '戊', w: 0.5 }, { stem: '乙', w: 0.3 }, { stem: '癸', w: 0.2 }],
  '巳': [{ stem: '丙', w: 0.6 }, { stem: '庚', w: 0.3 }, { stem: '戊', w: 0.1 }],
  '午': [{ stem: '丁', w: 0.7 }, { stem: '己', w: 0.3 }],
  '未': [{ stem: '己', w: 0.5 }, { stem: '丁', w: 0.3 }, { stem: '乙', w: 0.2 }],
  '申': [{ stem: '庚', w: 0.7 }, { stem: '壬', w: 0.2 }, { stem: '戊', w: 0.1 }],
  '酉': [{ stem: '辛', w: 1.0 }],
  '戌': [{ stem: '戊', w: 0.6 }, { stem: '辛', w: 0.3 }, { stem: '丁', w: 0.1 }],
  '亥': [{ stem: '壬', w: 0.7 }, { stem: '甲', w: 0.3 }],
};

// 6충/6해/6파/형/원진
const CHONG = [['子','午'], ['丑','未'], ['寅','申'], ['卯','酉'], ['辰','戌'], ['巳','亥']];
const HAE   = [['子','未'], ['丑','午'], ['寅','巳'], ['卯','辰'], ['申','亥'], ['酉','戌']];
const PA    = [
  ['子','卯'], ['丑','戌'], ['寅','亥'], ['卯','子'], ['辰','丑'], ['巳','申'],
  ['午','酉'], ['未','辰'], ['申','巳'], ['酉','午'], ['戌','未'], ['亥','寅'],
];
const HYEONG_TRI = [['寅','巳','申'], ['丑','戌','未']];
const HYEONG_SELF = ['辰','午','酉','子'];

const SAMHAP = [
  { set: ['亥','卯','未'], element: '목' },
  { set: ['寅','午','戌'], element: '화' },
  { set: ['巳','酉','丑'], element: '금' },
  { set: ['申','子','辰'], element: '수' },
];
const BANGHAP = [
  { set: ['亥','子','丑'], element: '수' },
  { set: ['寅','卯','辰'], element: '목' },
  { set: ['巳','午','未'], element: '화' },
  { set: ['申','酉','戌'], element: '금' },
];

// 오행 상생/상극
const CYCLE = ['목','화','토','금','수'];
const produce = (a,b)=> CYCLE[(CYCLE.indexOf(a)+1)%5]===b;
const producedBy = (a,b)=> produce(b,a);
const control = (a,b)=> CYCLE[(CYCLE.indexOf(a)+2)%5]===b;
const controlledBy = (a,b)=> control(b,a);

//////////////////////////////
// 1. 보조
//////////////////////////////
const safe = x => (x ?? '').toString().trim();
const stemEl = s => STEM_ELEMENT[safe(s)] || null;
const branchEl = b => BRANCH_ELEMENT[safe(b)] || null;
const uniq = arr => Array.from(new Set(arr));

//////////////////////////////
// 2. 오행 분포 + 신강/신약
//////////////////////////////
export function countFiveElements(pillars, opt={includeHidden:true}) {
  const counts = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  const add=(el,w=1)=>{ if(counts[el]!=null) counts[el]+=w; };

  const list = [pillars?.year, pillars?.month, pillars?.day, pillars?.hour].filter(Boolean);

  // 천간 1.0
  list.forEach(p=>{ const el=stemEl(p.stem); if(el) add(el,1.0); });
  // 지지 0.8
  list.forEach(p=>{ const el=branchEl(p.branch); if(el) add(el,0.8); });
  // 장간 0.5
  if(opt.includeHidden){
    list.forEach(p=>{
      const arr = HIDDEN_STEMS[safe(p.branch)]||[];
      arr.forEach(({stem,w})=>{
        const el=stemEl(stem); if(el) add(el, w*0.5);
      });
    });
  }
  return counts;
}

export function inferDayMasterStrength(pillars) {
  const dm = stemEl(pillars?.day?.stem);
  if(!dm) return { score:0, level:'불명', rationale:'일간 미확인' };

  const counts = countFiveElements(pillars, {includeHidden:true});
  const same = counts[dm]||0;
  const mother = CYCLE[(CYCLE.indexOf(dm)+4)%5];
  const child  = CYCLE[(CYCLE.indexOf(dm)+1)%5];
  const killer = CYCLE[(CYCLE.indexOf(dm)+2)%5];
  const wealth = CYCLE[(CYCLE.indexOf(dm)+3)%5];

  const sMother=counts[mother]||0, sChild=counts[child]||0, sKiller=counts[killer]||0, sWealth=counts[wealth]||0;

  const monthBr = pillars?.month?.branch;
  const monthGroup = (
    ['寅','卯','辰'].includes(monthBr) ? '봄' :
    ['巳','午','未'].includes(monthBr) ? '여름' :
    ['申','酉','戌'].includes(monthBr) ? '가을' : '겨울'
  );
  const favor = {봄:'목', 여름:'화', 가을:'금', 겨울:'수'}[monthGroup];
  const seasonBoost = (favor===dm)?0.4:0;

  const score = same*1.0 + sMother*0.7 + sChild*0.2 + seasonBoost - sKiller*0.6 - sWealth*0.3;

  let level='중간';
  if(score>=2.8) level='신강';
  else if(score<=1.8) level='신약';

  const rationale = `일간(${dm}) 동류=${same.toFixed(1)}, 인성=${sMother.toFixed(1)}, 식상=${sChild.toFixed(1)}, 관살=${sKiller.toFixed(1)}, 재성=${sWealth.toFixed(1)}, 계절보정=${seasonBoost.toFixed(1)} → 점수=${score.toFixed(2)}`;

  return { score, level, rationale, counts, monthGroup };
}

//////////////////////////////
// 3. 지지 관계
//////////////////////////////
export function detectBranchRelations(pillars) {
  const brs = uniq([pillars?.year?.branch, pillars?.month?.branch, pillars?.day?.branch, pillars?.hour?.branch].filter(Boolean));
  const has=(a,b)=> brs.includes(a)&&brs.includes(b);
  const includeAll=arr=> arr.every(x=>brs.includes(x));

  const samhap = SAMHAP.filter(h=>includeAll(h.set)).map(h=>({type:'삼합', set:h.set, element:h.element}));
  const banghap = BANGHAP.filter(h=>includeAll(h.set)).map(h=>({type:'방합', set:h.set, element:h.element}));
  const chong = CHONG.filter(([a,b])=>has(a,b)).map(([a,b])=>({type:'충', pair:[a,b]}));
  const hae   = HAE.filter(([a,b])=>has(a,b)).map(([a,b])=>({type:'해', pair:[a,b]}));
  const pa    = PA.filter(([a,b])=>has(a,b)).map(([a,b])=>({type:'파', pair:[a,b]}));

  const hyeong=[];
  HYEONG_TRI.forEach(set=>{ if(includeAll(set)) hyeong.push({type:'형(삼형)', set}); });
  HYEONG_SELF.forEach(x=>{
    const cnt = brs.filter(b=>b===x).length;
    if(cnt>=2) hyeong.push({type:'형(자형)', pair:[x,x]});
  });

  const wonjin = HAE.filter(([a,b])=>has(a,b)).map(([a,b])=>({type:'원진', pair:[a,b]}));

  return { samhap, banghap, chong, hae, pa, hyeong, wonjin };
}

//////////////////////////////
// 4. 격국(기초)
//////////////////////////////
export function classifyGeoguk(pillars) {
  const dm = stemEl(pillars?.day?.stem);
  const me = branchEl(pillars?.month?.branch);
  if(!dm || !me) return { type:'불명', basis:'일간/월지 확인 불가' };

  let type='잡격';
  if(me===dm) type='비견격';
  else if(producedBy(dm, me)) type='인수격';
  else if(produce(dm, me)) type='식상격';
  else if(controlledBy(dm, me)) type='관살격';
  else if(control(dm, me)) type='재격';

  return { type, basis:`월지(${pillars?.month?.branch}:${me}) vs 일간(${dm}) 관계` };
}

//////////////////////////////
// 5. 용신(순환/조후) 휴리스틱
//////////////////////////////
export function suggestYongshin(pillars, strength) {
  const dm = stemEl(pillars?.day?.stem);
  if(!dm) return { flow:[], temperature:[], notes:[] };

  const monthBr = pillars?.month?.branch;
  const season =
    ['寅','卯','辰'].includes(monthBr) ? '봄' :
    ['巳','午','未'].includes(monthBr) ? '여름' :
    ['申','酉','戌'].includes(monthBr) ? '가을' : '겨울';

  const mother = CYCLE[(CYCLE.indexOf(dm)+4)%5];
  const killer = CYCLE[(CYCLE.indexOf(dm)+2)%5];
  const wealth = CYCLE[(CYCLE.indexOf(dm)+3)%5];

  const flow = (strength?.level==='신약')
    ? [dm, mother]
    : (strength?.level==='신강')
      ? [killer, wealth]
      : [dm, killer];

  const temperature = (
    season==='겨울' ? ['화'] :
    season==='여름' ? ['수'] :
    season==='봄'   ? ['금','수'] :
                      ['목','수']
  );

  const notes = [
    `계절=${season}, 일간=${dm}, 신강도=${strength?.level||'불명'}`,
    `순환용신(휴리스틱)=${flow.join(', ')}`,
    `조후용신(근사)=${temperature.join(', ')}`
  ];
  return { flow, temperature, notes };
}

//////////////////////////////
// 6. 대운(근사)
//////////////////////////////
const YANG_STEMS = new Set(['甲','丙','戊','庚','壬']);
function isYangStem(stem){ return YANG_STEMS.has(stem); }

function jiaziIndexFromPillar(stem, branch){
  const si = STEMS_HAN.indexOf(stem);
  const bi = BRANCHES_HAN.indexOf(branch);
  if(si<0 || bi<0) return -1;
  for(let n=0;n<60;n++){
    if((n%10)===si && (n%12)===bi) return n;
  }
  return -1;
}
function pillarFromJiaziIndexHan(n){
  const si = (n%60)%10;
  const bi = (n%60)%12;
  return { stem: STEMS_HAN[si], branch: BRANCHES_HAN[bi] };
}

// month boundary names used in getMonthPillar (근사)
const MONTH_BOUNDARY_NAMES = ['소한','입춘','경칩','청명','입하','망종','소서','입추','백로','한로','입동','대설'];
function buildBoundariesForYear(year){
  const termMap = {};
  SOLAR_TERMS.forEach(t=>{
    termMap[t.name] = { month: t.month, day: t.approxDay };
  });
  const arr=[];
  for(const name of MONTH_BOUNDARY_NAMES){
    const t = termMap[name];
    if(t){
      arr.push({ name, date: new Date(year, t.month-1, t.day, 0, 0, 0) });
    }
  }
  return arr;
}

function diffDays(a,b){ return (b - a)/(1000*60*60*24); }

export function computeDaewoon(pillars, birth){
  if(!pillars?.month || !pillars?.year) return { direction:'불명', start:{years:0,months:0,days:0}, list:[] };

  const birthDate = new Date(birth.y, (birth.m||1)-1, birth.d, birth.hh||0, birth.mm||0, 0);

  // 순/역행: 남성+양년 또는 여성+음년 → 순행, 그 외 역행
  const male = (birth.gender !== 'female');
  const yStem = birth.yearStem || pillars.year.stem;
  const isYangYear = isYangStem(yStem);
  const forward = (male && isYangYear) || (!male && !isYangYear);
  const direction = forward ? '순행' : '역행';
  const dirStep = forward ? 1 : -1;

  // 다음/이전 절입까지 일수 → 3일=1년 → 1일=4개월
  const bYear = birthDate.getFullYear();
  const current = buildBoundariesForYear(bYear);
  const nextYear = buildBoundariesForYear(bYear+1);
  const prevYear = buildBoundariesForYear(bYear-1);

  let targetDate = null;
  if(forward){
    const candidates = [...current, ...nextYear].map(x=>x.date);
    targetDate = candidates.find(dt => dt.getTime() > birthDate.getTime()) || nextYear[0]?.date;
  }else{
    const candidates = [...prevYear, ...current].map(x=>x.date).filter(dt=> dt.getTime() < birthDate.getTime());
    targetDate = candidates[candidates.length-1] || prevYear[prevYear.length-1]?.date;
  }
  if(!targetDate) targetDate = new Date(bYear, birthDate.getMonth(), birthDate.getDate()+5);

  const dDays = Math.max(0, Math.round(diffDays(birthDate, targetDate)));
  const totalMonths = dDays * 4; // 1일=4개월
  const startYears = Math.floor(totalMonths / 12);
  const startMonths = totalMonths % 12;

  // 월주에서 시작, 한 대운당 1간지
  const monthIndex = jiaziIndexFromPillar(pillars.month.stem, pillars.month.branch);
  const list = [];
  const count = 8;
  for(let k=1;k<=count;k++){
    const n = (monthIndex + dirStep*k + 60) % 60;
    const p = pillarFromJiaziIndexHan(n);
    const ageStart = startYears + (k-1)*10;
    const ageEnd = ageStart + 9;
    list.push({ order:k, pillar:p, ageStart, ageEnd });
  }

  // 시작일(근사)
  let startDate = null;
  try{
    const sd = new Date(birthDate.getTime());
    const y = sd.getFullYear(), mo = sd.getMonth(), da = sd.getDate();
    const start = new Date(y, mo + totalMonths, da);
    startDate = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
  }catch{}

  return { direction, start: { years:startYears, months:startMonths, days:dDays }, startDate, list };
}

//////////////////////////////
// 7. 세운(연운)
//////////////////////////////
// 한글 간지 표기용(결과 페이지 표시에 사용)
const STEMS_KOR = ['갑','을','병','정','무','기','경','신','임','계'];
const BRANCHES_KOR = ['자','축','인','묘','진','사','오','미','신','유','술','해'];

function yearIndex60(year){ let n=(year-1984)%60; if(n<0) n+=60; return n; } // 1984=甲子(갑자)

function pillarKorFromIndex(n){
  return { stem: STEMS_KOR[n%10], branch: BRANCHES_KOR[n%12] };
}
function pillarHanFromIndex(n){
  const si=(n%60)%10, bi=(n%60)%12;
  return { stem: STEMS_HAN[si], branch: BRANCHES_HAN[bi] };
}

/** baseYear부터 span년 간의 세운 목록(한글/한자 동시 제공) */
export function computeSewoon(baseYear = new Date().getFullYear(), span = 10) {
  const list = [];
  for(let i=0;i<span;i++){
    const y = baseYear + i;
    const idx = yearIndex60(y);
    list.push({
      year: y,
      pillarKor: pillarKorFromIndex(idx), // {stem:'을', branch:'사'} 등
      pillarHan: pillarHanFromIndex(idx), // {stem:'乙', branch:'巳'} 등
    });
  }
  return {
    currentYear: baseYear,
    currentKor: pillarKorFromIndex(yearIndex60(baseYear)),
    currentHan: pillarHanFromIndex(yearIndex60(baseYear)),
    list,
  };
}

//////////////////////////////
// 8. 통합 분석
//////////////////////////////
export function analyzeSajuMeta(pillars, opts={}) {
  const strength = inferDayMasterStrength(pillars);
  const relations = detectBranchRelations(pillars);
  const geoguk = classifyGeoguk(pillars);
  const yongshin = suggestYongshin(pillars, strength);

  let daewoon = null;
  if(opts.birth && opts.birth.y){
    daewoon = computeDaewoon(pillars, opts.birth);
  }

  // 세운: 기본은 현재 해부터 10년
  const nowYear = new Date().getFullYear();
  const sewoon = computeSewoon(nowYear, 10);

  return {
    counts: strength.counts,
    strength: {
      score: Number(strength.score?.toFixed?.(2) ?? strength.score),
      level: strength.level,
      rationale: strength.rationale,
      monthGroup: strength.monthGroup,
    },
    relations,
    geoguk,
    yongshin,
    daewoon,
    sewoon, // ✅ 추가
  };
}

// 외부 노출: 간/지 오행
export function getElementOfStem(stem){ return stemEl(stem); }
export function getElementOfBranch(branch){ return branchEl(branch); }
