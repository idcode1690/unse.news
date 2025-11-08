// app/src/pages/LottoPage.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { setSEO } from '../utils/seo.jsx';
import { loadCalculationDataFromCookie, isShareModalSeenToday, setShareModalSeenToday } from '../utils/cookieUtils.jsx';
import { lunarToSolar } from '../utils/lunarCalendar.jsx';
import { calculateSaju } from '../utils/sajooCalculator.jsx';
import {
  countFiveElements,
  inferDayMasterStrength,
  getElementOfStem,
  analyzeSajuMeta, // 메타(용신·기신·십성·신살·합충형해파·격국 등)
} from '../utils/sajuExtras.jsx';
import PillarDisplay from '../components/sajoo/PillarDisplay';
import { InputRequiredGuide } from '../components/common/Layout';
import ShareModal from '../components/common/ShareModal';

/* ───────── 공통 유틸 ───────── */
function pad2(n){ return String(n).padStart(2,'0'); }
function fmt2(n){
  const x = Number(n);
  if (!Number.isFinite(x)) return '0.00';
  return x.toFixed(2);
}
function todayKST(){
  const now = new Date(Date.now() + 9*3600*1000);
  return { y: now.getUTCFullYear(), m: now.getUTCMonth()+1, d: now.getUTCDate() };
}
function todayKeyKST(){
  const t = todayKST();
  return `${t.y}-${pad2(t.m)}-${pad2(t.d)}`;
}

/* ---- 자동 오픈 제어 상수 ---- */
const MIN_SCROLL_DELTA = 120;
const MIN_PROGRESS = 0.6;

/* 시드 고정 난수 */
function hash32(str){
  let h = 2166136261 >>> 0;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h>>>0;
}
function mulberry32(a){
  return function(){
    let t = (a += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 번호군(오행→숫자) */
const ELEMENT_GROUPS = {
  '목': Array.from({length:9}, (_,i)=>1+i),
  '화': Array.from({length:9}, (_,i)=>10+i),
  '토': Array.from({length:9}, (_,i)=>19+i),
  '금': Array.from({length:9}, (_,i)=>28+i),
  '수': Array.from({length:9}, (_,i)=>37+i),
};
const CYCLE = ['목','화','토','금','수'];
const motherOf = (el)=> CYCLE[(CYCLE.indexOf(el)+4)%5];
const childOf  = (el)=> CYCLE[(CYCLE.indexOf(el)+1)%5];
const killerOf = (el)=> CYCLE[(CYCLE.indexOf(el)+2)%5];
const wealthOf = (el)=> CYCLE[(CYCLE.indexOf(el)+3)%5];

function normalizeHour(raw){
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : null;
}

function ensureSajuComputed(data){
  if (!data) return null;
  if (data?.sajuResult?.year && data?.sajuResult?.month && data?.sajuResult?.day && data?.sajuResult?.hour) {
    return data;
  }
  const calendar = data.calendar || 'solar';
  const year = Number(data.year);
  const month = Number(data.month);
  const day = Number(data.day);

  // ⬇️ 시간 모름이면 계산은 12시로(정오)
  const hourCalc = normalizeHour(data.hour) ?? 12;
  const minuteCalc = Number(data.minute ?? 0);

  const isLeap = data.leapMonth === 'leap' || data.isLeap === true;

  let sY,sM,sD;
  if (typeof data.solarDate === 'string') {
    const m = String(data.solarDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) { sY = Number(m[1]); sM = Number(m[2]); sD = Number(m[3]); }
  }
  if (!sY || !sM || !sD) {
    if (calendar === 'lunar') {
      const d = lunarToSolar(year, month, day, isLeap);
      const solar = d instanceof Date ? d : new Date(d);
      sY = solar.getFullYear(); sM = solar.getMonth()+1; sD = solar.getDate();
    } else { sY = year; sM = month; sD = day; }
  }
  const saju = calculateSaju(sY, sM, sD, hourCalc, minuteCalc);
  return {
    ...data,
    calendar,
    solarDate: `${sY}-${pad2(sM)}-${pad2(sD)}`,
    sajuResult: saju,
    year, month, day,
    hour: data.hour ?? '',   // 표시용은 원본 유지(모름 허용)
    minute: data.minute ?? '0',
  };
}

function computeTodayPillars(){
  const t = todayKST();
  return calculateSaju(t.y, t.m, t.d, 12, 0);
}
function weightedPick(rng, weights){
  const entries = Object.entries(weights).filter(([,w])=>w>0);
  const total = entries.reduce((s,[,w])=>s+w,0);
  if (!entries.length || total <= 0) return null;
  let r = rng()*total;
  for (const [k,w] of entries){ if (r < w) return k; r -= w; }
  return entries[entries.length-1][0];
}
// ⬇️ 기본 가중치(오행 분포 + 일간 신강/신약 + 오늘 분포 + 용신 가점)
function buildWeights(myCounts, dayMasterEl, dmStrength, todayCounts, yongshinEls){
  const avg = (myCounts.목 + myCounts.화 + myCounts.토 + myCounts.금 + myCounts.수) / 5;
  const weights = {
    목: Math.max(0, avg - (myCounts.목||0)),
    화: Math.max(0, avg - (myCounts.화||0)),
    토: Math.max(0, avg - (myCounts.토||0)),
    금: Math.max(0, avg - (myCounts.금||0)),
    수: Math.max(0, avg - (myCounts.수||0)),
  };
  if (dayMasterEl) {
    const inc = (k, v)=> weights[k] = Math.max(0, (weights[k]||0) + v);
    if (dmStrength.level === '신약') {
      inc(motherOf(dayMasterEl), 1.0); inc(childOf(dayMasterEl), 0.35); inc(dayMasterEl, 0.25);
    } else if (dmStrength.level === '신강') {
      inc(wealthOf(dayMasterEl), 0.85); inc(killerOf(dayMasterEl), 0.35);
      weights[dayMasterEl] = Math.max(0, (weights[dayMasterEl]||0) - 0.25);
    } else { inc(childOf(dayMasterEl), 0.15); inc(wealthOf(dayMasterEl), 0.15); }
  }
  // 오늘 분포 가점
  const tAdd = 0.25;
  ['목','화','토','금','수'].forEach((el)=>{
    const add = (todayCounts[el]||0) * tAdd;
    weights[el] = Math.max(0, (weights[el]||0) + add);
  });
  // 용신(1·2순위) 요소 가점
  if (yongshinEls && yongshinEls.length){
    for (const el of yongshinEls){
      weights[el] = Math.max(0, (weights[el]||0) + 0.6);
    }
  }
  return weights;
}
function getElementForNumber(n){
  if (n >= 1  && n <= 9 ) return '목';
  if (n >= 10 && n <= 18) return '화';
  if (n >= 19 && n <= 27) return '토';
  if (n >= 28 && n <= 36) return '금';
  if (n >= 37 && n <= 45) return '수';
  return '';
}
function elBgClass(el){
  switch (el) {
    case '목': return 'el-wood';
    case '화': return 'el-fire';
    case '토': return 'el-earth';
    case '금': return 'el-metal';
    case '수': return 'el-water';
    default:   return '';
  }
}
function generateWeightedGame(rng, baseWeights){
  const pools = {
    목: [...ELEMENT_GROUPS['목']],
    화: [...ELEMENT_GROUPS['화']],
    토: [...ELEMENT_GROUPS['토']],
    금: [...ELEMENT_GROUPS['금']],
    수: [...ELEMENT_GROUPS['수']],
  };
  const used = new Set(); const main = []; const mapping = {};
  const orderEls = Object.entries(baseWeights).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
  const weights = { ...baseWeights };
  for (let i=0;i<6;i++){
    let el = weightedPick(rng, weights) || orderEls[(i % orderEls.length)];
    weights[el] = Math.max(0, (weights[el]||0) * 0.88);
    let n = null, guard=0;
    while (guard++ < 16) {
      if (!pools[el]?.length) {
        const keys = Object.keys(pools).filter(k=>pools[k].length>0);
        if (!keys.length) break;
        el = keys[Math.floor(rng()*keys.length)];
      }
      const idx = Math.floor(rng()*pools[el].length);
      const cand = pools[el][idx];
      if (!used.has(cand)) { n = cand; pools[el].splice(idx,1); break; }
    }
    if (n!=null) { used.add(n); main.push(n); mapping[n]=el; }
  }
  main.sort((a,b)=>a-b);
  return { main, mapping };
}
const elements = ['목','화','토','금','수'];

function getScrollParent(node) {
  if (!node || typeof window === 'undefined') return null;
  let el = node.parentElement;
  while (el) {
    const style = window.getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(style.overflowY) || /(auto|scroll|overlay)/.test(style.overflow)) return el;
    el = el.parentElement;
  }
  return null;
}
function getScrollMetrics(root){
  if (root) return { scrollTop: root.scrollTop, clientHeight: root.clientHeight, scrollHeight: root.scrollHeight };
  const doc = document.scrollingElement || document.documentElement;
  return { scrollTop: doc.scrollTop, clientHeight: window.innerHeight || doc.clientHeight, scrollHeight: doc.scrollHeight };
}

const LottoPage = () => {
  const PAGE_TITLE = '로또 숫자';
  const [games, setGames] = useState([]);
  const [meta, setMeta] = useState(null);           // 숫자 가중치 설명용
  const [myPillars, setMyPillars] = useState(null);
  const [todayPillars, setTodayPillars] = useState(null);

  // 명리 메타
  const [birthMeta, setBirthMeta] = useState(null);

  // ✅ 안내 노출 여부(연/월/일이 없을 때만)
  const [needInputGuide, setNeedInputGuide] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const pageRef = useRef(null);
  const sentinelRef = useRef(null);
  const autoOpenedRef = useRef(false);
  const startTopRef = useRef(0);
  const scrolledEnoughRef = useRef(false);

  // KST 키
  const todayKey = useMemo(()=>todayKeyKST(), []);

  useEffect(() => {
    setSEO({
      title: `${PAGE_TITLE} | 운세뉴스`,
      description: '쿠키의 생년월일과 오늘 사주를 반영해 확률 가중 추출한 6/45 숫자(5세트).',
      path: '/#/lotto',
      image: '/og-image.png',
    });
  }, []);

  // 숫자 생성 + 메타 계산
  useEffect(()=>{
    let raw = null;
    try { raw = loadCalculationDataFromCookie(); } catch {}
    const hasDate = !!(raw && raw.year && raw.month && raw.day); // ⬅️ 연/월/일만 필수
    if (!hasDate) { setNeedInputGuide(true); return; }
    setNeedInputGuide(false);

    const tPillars = computeTodayPillars();
    setTodayPillars(tPillars);
    const todayCounts = countFiveElements(tPillars, { includeHidden: false });

    const ensured = ensureSajuComputed(raw); // 시간 모름이면 정오로 계산
    const myP = ensured.sajuResult;
    setMyPillars(myP);

    // 출생 메타 (용신/기신 등)
    const birthCtx = {
      y: ensured.year, m: ensured.month, d: ensured.day,
      hh: normalizeHour(ensured.hour) ?? 12, mm: Number(ensured.minute ?? 0),
      gender: ensured.gender || 'unknown',
      yearStem: myP?.year?.stem,
    };
    const bm = analyzeSajuMeta(myP, { birth: birthCtx });
    setBirthMeta(bm);

    // 숫자 가중치
    const myCounts = countFiveElements(myP, { includeHidden: true });
    const dm = getElementOfStem(myP?.day?.stem);
    const strength = inferDayMasterStrength(myP);

    // 용신 오행 우대
    const yongEls = []
      .concat(bm?.yongshin?.primary ? [bm.yongshin.primary] : [])
      .concat(bm?.yongshin?.secondary ? [bm.yongshin.secondary] : [])
      .filter(Boolean);

    const baseWeights = buildWeights(myCounts, dm, strength, todayCounts, yongEls);

    const sumW = elements.reduce((s,el)=>s+(baseWeights[el]||0),0) || 1;
    const probs = Object.fromEntries(elements.map(el => [el, (baseWeights[el]||0)/sumW]));
    const expected = Object.fromEntries(elements.map(el => [el, probs[el]*6]));

    const seedUserPart = [
      ensured.calendar || 'solar',
      `${ensured.year}-${ensured.month}-${ensured.day}`,
      `${pad2(normalizeHour(ensured.hour) ?? 12)}:${pad2(Number(ensured.minute||0))}`,
      ensured.gender || '',
      myP?.day?.stem || '',
    ].join('|');
    const seedBase = `lotto5-weighted|${todayKey}|${seedUserPart}`;

    const produced = [];
    for (let gi=1; gi<=5; gi++){
      const rng = mulberry32(hash32(`${seedBase}|G${gi}`));
      produced.push(generateWeightedGame(rng, baseWeights));
    }
    setGames(produced);

    const weakestOrder = Object.entries(myCounts).sort((a,b)=>a[1]-b[1]).map(([k])=>k);
    const todayTop = Object.entries(todayCounts).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
    setMeta({ baseWeights, probs, expected, myCounts, todayCounts, dm, strength, weakestOrder, todayTop, yongEls });

  }, [todayKey]);

  useEffect(() => {
    if (needInputGuide || typeof window === 'undefined') return;
    const root = getScrollParent(pageRef.current);
    const targets = Array.from(new Set([root, window])).filter(Boolean);
    const NEAR_BOTTOM_BUFFER = Math.max(48, Math.round((window.innerHeight || 0) * 0.08));

    const { scrollTop: initTop } = getScrollMetrics(root || null);
    startTopRef.current = initTop;
    scrolledEnoughRef.current = false;

    const isScrollable = (r) => {
      const { clientHeight, scrollHeight } = getScrollMetrics(r === window ? null : r);
      return scrollHeight - clientHeight > 80;
    };

    const tryOpenIfAllowed = (r) => {
      if (autoOpenedRef.current || !scrolledEnoughRef.current) return;
      if (!isScrollable(r)) return;
      if (isShareModalSeenToday()) return;
      const { scrollTop, clientHeight, scrollHeight } = getScrollMetrics(r === window ? null : r);
      if (scrollTop + clientHeight >= scrollHeight - NEAR_BOTTOM_BUFFER) {
        autoOpenedRef.current = true;
        setShareModalSeenToday();
        setShareOpen(true);
      }
    };

    let rafLock = false;
    const onScroll = () => {
      if (rafLock) return;
      rafLock = true;
      requestAnimationFrame(() => {
        rafLock = false;
        const { scrollTop, clientHeight, scrollHeight } = getScrollMetrics(root || null);
        const delta = Math.abs(scrollTop - startTopRef.current);
        const progress = scrollHeight > 0 ? (scrollTop + clientHeight) / scrollHeight : 0;
        if (!scrolledEnoughRef.current && (delta >= MIN_SCROLL_DELTA || progress >= MIN_PROGRESS)) {
          scrolledEnoughRef.current = true;
        }
        for (const t of targets) {
          tryOpenIfAllowed(t);
          if (autoOpenedRef.current) break;
        }
      });
    };

    const onResize = () => {
      if (!scrolledEnoughRef.current || autoOpenedRef.current) return;
      for (const t of targets) {
        tryOpenIfAllowed(t);
        if (autoOpenedRef.current) break;
      }
    };

    for (const t of targets) t.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    const observers = [];
    if ('IntersectionObserver' in window) {
      const sentinel = sentinelRef?.current;
      if (sentinel) {
        const makeObs = (r) => new IntersectionObserver((entries) => {
          const hit = entries.some(e => e.isIntersecting);
          if (
            hit &&
            !autoOpenedRef.current &&
            scrolledEnoughRef.current &&
            isScrollable(r) &&
            !isShareModalSeenToday()
          ) {
            autoOpenedRef.current = true;
            setShareModalSeenToday();
            setShareOpen(true);
            observers.forEach(o=>o.disconnect());
          }
        }, { root: r === window ? null : r, threshold: 1.0, rootMargin: '0px' });
        if (root) observers.push(makeObs(root));
        observers.push(makeObs(window));
        observers.forEach(o => o.observe(sentinel));
      }
    }

    return () => {
      for (const t of targets) t.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observers.forEach(o=>o.disconnect());
    };
  }, [needInputGuide]);

  if (needInputGuide) {
    return (
      <section className="calculator" aria-label="안내">
        <InputRequiredGuide homeHref="/" />
      </section>
    );
  }

  return (
    <section ref={pageRef} className="calculator" aria-label={`${PAGE_TITLE} 페이지`}>
      <div className="card result">
        <h2>{PAGE_TITLE}</h2>

        {/* 사주 기둥 — 궁합 페이지와 동일한 레이아웃 */}
        {(myPillars || todayPillars) && (
          <div className="row cols-2 sm-cols-1" style={{ marginTop: 16 }}>
            <section style={{ display: "grid", gap: 8 }}>
              <h3 className="h4" style={{ margin: 0 }}>내 사주 기둥</h3>
              {myPillars ? (
                <PillarDisplay pillars={myPillars} idPrefix="my" />
              ) : (
                <p className="muted" style={{ margin: 0 }}>내 정보가 없어 표시할 수 없습니다.</p>
              )}
            </section>

            <section style={{ display: "grid", gap: 8 }}>
              <h3 className="h4" style={{ margin: 0 }}>오늘 사주 기둥 (정오 기준)</h3>
              {todayPillars ? (
                <PillarDisplay pillars={todayPillars} idPrefix="today" />
              ) : (
                <p className="muted" style={{ margin: 0 }}>오늘 기둥 계산에 실패했습니다.</p>
              )}
            </section>
          </div>
        )}

        {/* 숫자 5줄 */}
        <div className="per-game" style={{marginTop: 12}}>
          {games.map((g, idx)=>(
            <div key={`pg-${idx}`} className="chips-line">
              <span className="chip-badge" aria-hidden>G{idx+1}</span>
              <div className="chips" role="list" aria-label={`게임 ${idx+1} 번호`}>
                {g.main.map((n)=>{
                  const el = g.mapping[n] || getElementForNumber(n);
                  return (
                    <span key={`n-${idx}-${n}`} className="chip" role="listitem" aria-label={`번호 ${n} • ${el}`}>
                      <b>{String(n).padStart(2,'0')}</b>
                      <i className={`ball ${elBgClass(el)}`} aria-hidden>{el}</i>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ⬇️ 확률표: 위로 이동 */}
        <div className="info-box" style={{marginTop:12}}>
          <div className="mini-title">오행 가중치·확률표 (초기 기준)</div>
          <div className="prob-wrap">
            <table className="prob-table" aria-label="오행 가중치 확률표">
              <thead>
                <tr>
                  <th>오행</th>
                  <th>번호 범위</th>
                  <th>가중치</th>
                  <th>확률</th>
                  <th>예상 개수 (6개 중)</th>
                </tr>
              </thead>
              <tbody>
                {elements.map(el=>(
                  <tr key={`row-${el}`}>
                    <td className={`elname ${elBgClass(el)}`}>{el}</td>
                    <td>{el==='목'?'1–9':el==='화'?'10–18':el==='토'?'19–27':el==='금'?'28–36':'37–45'}</td>
                    <td>{meta ? fmt2(meta.baseWeights[el]) : '0.00'}</td>
                    <td>{meta ? `${fmt2((meta.probs[el]||0)*100)}%` : '0.00%'}</td>
                    <td>{meta ? fmt2(meta.expected[el]) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>합계</td>
                  <td>{meta ? fmt2(elements.reduce((s,el)=>s+(meta.baseWeights[el]||0),0)) : '0.00'}</td>
                  <td>100.00%</td>
                  <td>6.00</td>
                </tr>
              </tfoot>
            </table>
            <p className="helper" style={{marginTop:6}}>
              * 표는 <em>초기 확률</em>을 나타냅니다. 실제 추출 중에는 같은 오행 반복을 줄이기 위해
              선택 직후 해당 오행 가중치가 감쇄(×0.88)되어 결과가 다소 달라질 수 있습니다.
            </p>
          </div>
        </div>

        {/* 왜 이 숫자인가요? */}
        <div className="info-box" style={{marginTop:12}}>
          <strong style={{display:'block', marginBottom:8}}>왜 이 숫자인가요?</strong>
          <ul className="why-list">
            <li>
              <b>가중치(Weights)</b>는 내 사주 오행 분포(간·지·장간)에서 상대적으로 부족한 오행을 보정하고,
              일간({meta?.dm || '—'})의 상태({meta?.strength?.level || '—'})에 따라
              {meta?.strength?.level === '신약' ? ' 인성·식상을 가산' :
               meta?.strength?.level === '신강' ? ' 재성·관성을 가산' : ' 순환 항목을 소폭 가산'}했으며,
              오늘(정오) 사주의 강한 오행({meta?.todayTop?.slice(0,2).join(', ') || '—'})과
              {meta?.yongEls?.length ? ` 용신(${meta.yongEls.join(', ')})` : ' '}에 소폭 가점을 더했습니다.
            </li>
            {meta?.myCounts && (
              <li>
                <b>내 오행 분포</b> (간·지·장간): 목 {fmt2(meta.myCounts?.목)}, 화 {fmt2(meta.myCounts?.화)}, 토 {fmt2(meta.myCounts?.토)}, 금 {fmt2(meta.myCounts?.금)}, 수 {fmt2(meta.myCounts?.수)}
                {meta?.weakestOrder ? <> · <em>부족순:</em> {meta.weakestOrder.join(' → ')} </> : null}
              </li>
            )}
            <li>
              <b>오늘 오행 분포</b> (정오 기준): 목 {fmt2(meta?.todayCounts?.목 ?? 0)}, 화 {fmt2(meta?.todayCounts?.화 ?? 0)}, 토 {fmt2(meta?.todayCounts?.토 ?? 0)}, 금 {fmt2(meta?.todayCounts?.금 ?? 0)}, 수 {fmt2(meta?.todayCounts?.수 ?? 0)}
            </li>
            <li>
              <b>추출 로직</b>: 오행을 확률적으로 선택→해당 오행의 번호군(목 1–9, 화 10–18, 토 19–27, 금 28–36, 수 37–45)에서 중복 없이 6개 추출(선택된 오행은 감쇄×0.88로 편중 억제).
            </li>
          </ul>
        </div>

        {/* 바닥 센티널 */}
        <div ref={sentinelRef} style={{height:1}} />
      </div>

      {/* 공유 모달 */}
      {shareOpen && (
        <ShareModal
          isOpen={shareOpen}
          onClose={()=>setShareOpen(false)}
          pageTitle={PAGE_TITLE}
          shareText="내용이 도움이 되셨다면 지금 공유해보시겠어요?"
        />
      )}

      <style>{`
        .muted{ color: var(--ink-soft,#6b7280); }

        .per-game .chips-line{ display:flex; align-items:center; gap:10px; padding: 6px 0; }
        .chip-badge{
          padding: 3px 8px; border:1px solid var(--border,#e5e7eb); border-radius:999px;
          font-size: 12px; background: var(--surface,#fff); color:var(--ink-soft,#6b7280); flex: none;
        }
        .chips{ display:grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap:8px; width:100%; }
        .chip{
          display:flex; align-items:center; justify-content:center; gap:8px;
          padding:10px 12px; border:1px solid var(--border,#e5e7eb); border-radius:12px; background:var(--surface,#fff);
          min-width:0; white-space: nowrap;
        }
        .chip b{ font-size:16px; letter-spacing:0.02em; line-height:1; }

        .ball{
          display:inline-flex; align-items:center; justify-content:center;
          width:22px; height:22px; border-radius:999px; line-height:1;
          font-style:normal; font-weight:800; font-size:12px;
          border:1px solid var(--border,#e5e7eb);
          background:var(--muted,#f3f4f6); color:var(--ink-soft,#6b7280);
          user-select:none;
        }

        .ball.el-wood, .elname.el-wood{ color:#166534; background:#E8F5E9; border-color:#BFE7CC; }
        .ball.el-fire, .elname.el-fire{ color:#7F1D1D; background:#FEE2E2; border-color:#FBC6C6; }
        .ball.el-earth, .elname.el-earth{ color:#713F12; background:#FEF3C7; border-color:#F3E2A6; }
        .ball.el-metal, .elname.el-metal{ color:#1F2937; background:#E5E7EB; border-color:#D1D5DB; }
        .ball.el-water, .elname.el-water{ color:#1E3A8A; background:#DBEAFE; border-color:#BFDBFE; }

        .info-box{ border:1px solid var(--border,#e5e7eb); border-radius:12px; padding:12px; background:var(--surface,#fff); }
        .why-list{ list-style:none; padding-left:0; margin:8px 0 0; }
        .why-list li{ margin:6px 0; line-height:1.6; color:var(--ink); }

        .prob-wrap{ margin-top:6px; overflow:auto; }
        .prob-table{ width:100%; border-collapse: collapse; font-size:14px; }
        .prob-table th, .prob-table td{ border:1px solid var(--border,#e5e7eb); padding:8px 10px; text-align:center; }
        .prob-table thead th{ background:var(--muted,#f9fafb); font-weight:800; }
        .prob-table tfoot td{ background:var(--muted,#fafafa); font-weight:700; }

        @media (max-width: 640px){
          .per-game .chips-line{ gap: clamp(6px, 1.6vw, 10px); }
          .chips{ gap: clamp(4px, 1.4vw, 8px); }
          .chip{ padding: clamp(5px, 1.4vw, 10px) clamp(6px, 1.8vw, 12px); gap: clamp(3px, 1.2vw, 8px); }
          .chip b{ font-size: clamp(11px, 3.2vw, 16px); }
          .ball{ width: clamp(14px, 4.2vw, 22px); height: clamp(14px, 4.2vw, 22px); font-size: clamp(8px, 2.6vw, 12px); }
          .prob-table{ font-size: 13px; }
          .prob-table th, .prob-table td{ padding:6px 8px; }
        }
        @media (max-width: 380px){ .chips{ grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 320px){
          .chips{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .chip{ padding: 3px 6px; gap: 2px; }
          .chip b{ font-size: 10px; }
          .ball{ width: 12px; height: 12px; font-size: 7px; }
          .prob-table{ font-size: 12px; }
        }
      `}</style>
    </section>
  );
};

export default LottoPage;
