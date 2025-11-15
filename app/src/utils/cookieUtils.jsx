// src/utils/cookieUtils.jsx

// ====== (과거 호환) 쿠키 키들 ======
const FORM_DATA_COOKIE = 'saju_form_data';
const CALC_COOKIE = 'saju_calc_data';
const SAJU_META_COOKIE = 'saju_meta';

// 과거에 텍스트를 쿠키에 넣었던 키들 — 이제 완전 금지 & 자동삭제
const LEGACY_LARGE_COOKIES = [
  'today_ai_result',
  'lotto_ai_result',
  'saju_result_ai',
  'compat_data',
  'lotto_data',
];

// ====== localStorage 키 ======
const LS_FORM_DATA_KEY = 'saju_form_data_v2';
const LS_CALC_DATA_KEY = 'saju_calc_data_v2';
const LS_TODAY_AI_RESULT_KEY = 'today_ai_result_v2';
const LS_SAJU_RESULT_KEY = 'saju_result_ai_v1';
const LS_COMPAT_KEY = 'compat_data_v1';
const LS_LOTTO_AI_KEY = 'lotto_ai_result_v1';
const LS_LOTTO_KEY = 'lotto_data_v1';

// ====== 공용 유틸 ======
const squelch = (e) => e && (e.message || e.name);
const jsonStringifySafe = (v) => { try { return JSON.stringify(v); } catch(e){ squelch(e); return String(v); } };
const jsonParseSafe = (s) => { try { return JSON.parse(s); } catch(e){ squelch(e); return s; } };

const lsSet = (k,v) => { try { localStorage.setItem(k, jsonStringifySafe(v)); } catch(e){ squelch(e);} };
const lsGet = (k,f=null) => { try { const r=localStorage.getItem(k); return r==null?f:jsonParseSafe(r);} catch(e){ squelch(e); return f; } };
const lsDel = (k) => { try { localStorage.removeItem(k); } catch(e){ squelch(e);} };

// KST 날짜 유틸
const pad2 = (n)=>String(n).padStart(2,'0');
const nowMsKST = ()=> Date.now() + 9*60*60*1000;
const todayKeyKST = ()=>{
  const d=new Date(nowMsKST());
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())}`;
};
const currentYearKST = ()=> new Date(nowMsKST()).getUTCFullYear();
const nextSundayKeyKST = ()=>{
  const MS=86400000, now=nowMsKST();
  const d=new Date(now), w=d.getUTCDay();
  const daysToSun=(7-w)%7;
  const start=now - (now%MS);
  const target=new Date(start + (daysToSun===0?7:daysToSun)*MS);
  return `${target.getUTCFullYear()}-${pad2(target.getUTCMonth()+1)}-${pad2(target.getUTCDate())}`;
};

// ====== 쿠키 helpers (읽기/삭제 전용만 남김) ======
function getCookieRaw(name){
  if (typeof document==='undefined') return null;
  const ca = document.cookie ? document.cookie.split(';') : [];
  const p = `${name}=`;
  for (let c of ca){
    c = c.trim();
    if (c.startsWith(p)){
      const v=c.substring(p.length);
      try { return decodeURIComponent(v); } catch(e){ squelch(e); return v; }
    }
  }
  return null;
}
export function getCookie(name){
  const raw = getCookieRaw(name);
  if (raw == null) return null;
  // Special-case sentinel for undefined values
  if (raw === 'undefined') return undefined;
  return jsonParseSafe(raw);
}
export function deleteCookie(name, path='/'){
  if (typeof document==='undefined') return;
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}; SameSite=Lax`;
}

// ====== setCookie 구현 (테스트 및 소형 데이터 전용) ======
export function setCookie(name, value, days=7, path='/'){
  if (typeof document==='undefined') return;
  try {
    // JSON 직렬화하되, undefined는 sentinel로 저장하여 복원
    let serialized;
    if (value === undefined) serialized = 'undefined';
    else serialized = jsonStringifySafe(value);

    // 쿠키 만료
    let expires = '';
    if (typeof days === 'number' && isFinite(days)){
      const d = new Date();
      d.setTime(d.getTime() + days*24*60*60*1000);
      expires = `; Expires=${d.toUTCString()}`;
    }

    const cookieStr = `${name}=${encodeURIComponent(serialized)}${expires}; Path=${path}; SameSite=Lax`;
    document.cookie = cookieStr;
  } catch(e){ squelch(e); }
}

// ====== 모듈 로드 시: 큰 쿠키 싹 정리 + saju_* 프리픽스 쿠키 정리 ======
(function purgeLargeCookies(){
  try {
    // 알려진 대용량 쿠키 키 제거
    LEGACY_LARGE_COOKIES.forEach(n => { if (getCookieRaw(n)!=null) deleteCookie(n); });
    // 현재 도메인의 모든 쿠키 중 큰 값(>512B) 제거
    if (typeof document!=='undefined'){
      (document.cookie || '').split(';').map(s=>s.trim()).filter(Boolean).forEach(pair=>{
        const eq = pair.indexOf('=');
        if (eq<0) return;
        const name = pair.slice(0, eq);
        const val = pair.slice(eq+1);
        if (/^saju_/i.test(name) || val.length > 512){
          deleteCookie(name);
        }
      });
    }
  } catch(e){ squelch(e); }
})();

// ------------------------------------------------------------------
// 폼 임시 입력값 — LS만 사용
// ------------------------------------------------------------------
export function saveFormDataToCookie(form){ lsSet(LS_FORM_DATA_KEY, form); }
export function loadFormDataFromCookie(){ return lsGet(LS_FORM_DATA_KEY, null); }
export function clearFormDataCookie(){ lsDel(LS_FORM_DATA_KEY); }

// ------------------------------------------------------------------
// 사주팔자 계산 데이터 — LS만 사용
// ------------------------------------------------------------------
export function saveCalculationDataToCookie(calc){
  const data = { ...calc };
  if (Object.prototype.hasOwnProperty.call(calc||{}, 'mbti')){
    const raw = calc.mbti;
    data.mbti = raw==null ? '' : String(raw).trim().toUpperCase();
  }
  // 혹시 sajuResult 같은 큰 필드 있으면 제거
  delete data.sajuResult;
  lsSet(LS_CALC_DATA_KEY, data);
}
export function loadCalculationDataFromCookie(){ return lsGet(LS_CALC_DATA_KEY, null); }
export function clearCalculationDataCookie(){ lsDel(LS_CALC_DATA_KEY); }

// ------------------------------------------------------------------
// 오늘의 운세 — 날짜 바뀌면 무효 (LS)
// ------------------------------------------------------------------
export function saveTodayAiResultToCookie(text, meta={}){
  const payload = { text: String(text??''), meta: { ...meta, dateKey: todayKeyKST(), ts: Date.now() } };
  lsSet(LS_TODAY_AI_RESULT_KEY, payload);
}
export function loadTodayAiResultFromCookie(){
  const k = todayKeyKST();
  const v = lsGet(LS_TODAY_AI_RESULT_KEY, null);
  return (v?.meta?.dateKey === k) ? v : null;
}
export function clearTodayAiResultCookie(){ lsDel(LS_TODAY_AI_RESULT_KEY); }

// ------------------------------------------------------------------
// 사주 결과(AI) — 연말 무효 (LS)
// ------------------------------------------------------------------
export function saveSajuResultToCookie(text, meta={}){
  const payload = { text: String(text??''), meta: { ...meta, yearKey: String(currentYearKST()), ts: Date.now() } };
  lsSet(LS_SAJU_RESULT_KEY, payload);
}
export function loadSajuResultFromCookie(){
  const v = lsGet(LS_SAJU_RESULT_KEY, null);
  return (v?.meta?.yearKey === String(currentYearKST())) ? v : null;
}
export function clearSajuResultCookie(){ lsDel(LS_SAJU_RESULT_KEY); }

// ------------------------------------------------------------------
// 궁합 — 1시간 유지(호출부에서 ts 체크) (LS)
// ------------------------------------------------------------------
export function saveCompatDataToCookie(data){ lsSet(LS_COMPAT_KEY, { ...data, ts: Date.now() }); }
export function loadCompatDataFromCookie(){ return lsGet(LS_COMPAT_KEY, null); }
export function clearCompatDataCookie(){ lsDel(LS_COMPAT_KEY); }

// ------------------------------------------------------------------
// 로또 — 다음 일요일 00:00(KST)까지 유지 (LS)
// ------------------------------------------------------------------
export function saveLottoAiResultToCookie(text, meta={}){
  const payload = { text: String(text??''), meta: { ...meta, weekKey: nextSundayKeyKST(), ts: Date.now() } };
  lsSet(LS_LOTTO_AI_KEY, payload);
}
export function loadLottoAiResultFromCookie(){
  const v = lsGet(LS_LOTTO_AI_KEY, null);
  return (v?.meta?.weekKey === nextSundayKeyKST()) ? v : null;
}
export function clearLottoAiResultCookie(){ lsDel(LS_LOTTO_AI_KEY); }

export function saveLottoDataToCookie(data){
  const payload = { ...data, weekKey: nextSundayKeyKST(), ts: Date.now() };
  lsSet(LS_LOTTO_KEY, payload);
}
export function loadLottoDataFromCookie(){
  const v = lsGet(LS_LOTTO_KEY, null);
  return (v?.weekKey === nextSundayKeyKST()) ? v : null;
}
export function clearLottoDataCookie(){ lsDel(LS_LOTTO_KEY); }

// ------------------------------------------------------------------
// 메타(짧은 값) — 필요 시 LS로만
// ------------------------------------------------------------------
export function setSajuMeta(meta){ /* 쿠키 금지 */ lsSet('saju_meta_ls', meta); }
export function getSajuMeta(){ return lsGet('saju_meta_ls', null); }
export function clearSajuMeta(){ lsDel('saju_meta_ls'); }

// ------------------------------------------------------------------
// 레거시 별칭 (기존 import 호환)
// ------------------------------------------------------------------
export { loadTodayAiResultFromCookie as loadAiResultFromCookie };
export { saveTodayAiResultToCookie as saveAiResultToCookie };
export { setSajuMeta as saveSajuMetaToCookie };
export { getSajuMeta as loadSajuMetaFromCookie };

// ------------------------------------------------------------------
// 디버그
// ------------------------------------------------------------------
export function __readAllCookiesParsed(){
  try{
    const raw = typeof document==='undefined' ? '' : String(document.cookie||'');
    const out={};
    raw.split(';').map(s=>s.trim()).filter(Boolean).forEach(pair=>{
      const eq=pair.indexOf('=');
      if (eq<0) return;
      const name=pair.slice(0,eq);
      out[name] = decodeURIComponent(pair.slice(eq+1));
    });
    return out;
  }catch(e){ squelch(e); return {}; }
}
export function __forceClearAllProjectCookies(){
  try{
    const all = __readAllCookiesParsed();
    Object.keys(all).forEach((name)=>{
      if (/^saju_/i.test(name) || LEGACY_LARGE_COOKIES.includes(name) || all[name].length>0){
        deleteCookie(name);
      }
    });
  }catch(e){ squelch(e); }
}

// ====== ✅ 하루 1회 모달 노출 플래그 (전역) ======
const LS_SHARE_MODAL_SEEN_KEY = 'share_modal_seen_v1';

export function setShareModalSeenToday(){
  lsSet(LS_SHARE_MODAL_SEEN_KEY, { dateKey: todayKeyKST(), ts: Date.now() });
}
export function isShareModalSeenToday(){
  const v = lsGet(LS_SHARE_MODAL_SEEN_KEY, null);
  return v?.dateKey === todayKeyKST();
}
export function clearShareModalSeen(){
  lsDel(LS_SHARE_MODAL_SEEN_KEY);
}
