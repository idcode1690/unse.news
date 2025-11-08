// app/src/services/openaiService.jsx

import { hapticsApiStart, hapticsApiDone, hapticsApiError } from "../utils/haptics.jsx";

// === Environment & Endpoint ===
const DEV = Boolean(import.meta?.env?.DEV);
const WORKER_ORIGIN = "https://unse-openai-proxy.idcode1690.workers.dev";
const DEFAULT_MODEL = import.meta?.env?.VITE_OPENAI_MODEL || "gpt-4o-mini-2024-07-18";

const onHosted =
  typeof location !== "undefined" &&
  /github\.io|workers\.dev|vercel\.app|netlify\.app|unse\.news/i.test(location.host);

// 개발(로컬)에서만 Vite 프록시 사용 가능
const CAN_USE_PROXY = DEV && !onHosted;

// 개발(로컬)에서는 Vite 프록시(/api/ai -> /chat) 사용, 그 외에는 워커 직접 호출
export const API_ENDPOINT = CAN_USE_PROXY ? "/api/ai" : `${WORKER_ORIGIN}/chat`;

try {
  console.info("[openaiService] endpoint:", API_ENDPOINT, "mode=", import.meta.env.MODE, "dev=", DEV);
} catch {}

// === localStorage cache ===
const CACHE_PREFIX = "ai_cache_v1:";
const inflight = new Map(); // cacheKey -> Promise<string>

const MS_MIN = 60 * 1000;
const MS_HOUR = 60 * MS_MIN;
const MS_DAY = 24 * MS_HOUR;

function nowMsKST() { return Date.now() + 9 * MS_HOUR; }
function msUntilNextKstMidnight() {
  const now = nowMsKST();
  const rem = MS_DAY - (now % MS_DAY);
  return rem > 0 ? rem : MS_MIN;
}
function msUntilNextKstSunday() {
  const now = nowMsKST();
  const d = new Date(now);
  const w = d.getUTCDay(); // 0=Sun
  const startOfToday = now - (now % MS_DAY);
  const daysToSun = (7 - w) % 7;
  const target = startOfToday + (daysToSun === 0 ? 7 : daysToSun) * MS_DAY;
  const diff = target - now;
  return diff > 0 ? diff : MS_MIN;
}
function ttlMsFromCacheKey(cacheKey) {
  const key = String(cacheKey || "").toUpperCase();
  if (key.includes("TODAY"))  return msUntilNextKstMidnight();
  if (key.includes("SAJU"))   return 365 * MS_DAY;   // 사주는 1년 캐시
  if (key.includes("COMPAT")) return 30 * MS_DAY;
  if (key.includes("LOTTO"))  return msUntilNextKstSunday();
  return 30 * MS_DAY;
}

function lsGetRaw(k){ try { return localStorage.getItem(k); } catch { return null; } }
function lsSetRaw(k,v){ try { localStorage.setItem(k,v); } catch {} }
function lsRemove(k){ try { localStorage.removeItem(k); } catch {} }

function readCache(cacheKey) {
  if (!cacheKey) return null;
  const k = CACHE_PREFIX + cacheKey;
  const raw = lsGetRaw(k);
  if (!raw) return null;
  try {
    const { value, expireAt } = JSON.parse(raw);
    if (expireAt && Date.now() < expireAt) return String(value ?? "");
    lsRemove(k);
    return null;
  } catch { lsRemove(k); return null; }
}
function writeCache(cacheKey, value, ttlMs) {
  if (!cacheKey) return;
  const k = CACHE_PREFIX + cacheKey;
  const expireAt = Date.now() + (ttlMs ?? ttlMsFromCacheKey(cacheKey));
  lsSetRaw(k, JSON.stringify({ value: String(value ?? ""), expireAt }));
}

export function clearAICache(cacheKey) {
  if (!cacheKey) return;
  lsRemove(CACHE_PREFIX + cacheKey);
}

/**
 * callOpenAI — 동일 cacheKey면 항상 동일 결과 재사용
 * - 시작 시: hapticsApiStart() 1회
 * - 정상 완료: hapticsApiDone() 1회
 * - 오류 종료: hapticsApiError() 1회
 */
export async function callOpenAI({
  messages,
  cacheKey,
  model = DEFAULT_MODEL,
  temperature = 0.1,   // 🔒 거의 결정적
  top_p = 1,           // 🔒 보수적
  max_tokens = 1800,
  seed = 777,          // 워커/모델이 지원하면 결정성 강화(지원 안 하면 무시됨)
} = {}) {
  // 1) cache hit
  const cached = cacheKey ? readCache(cacheKey) : null;
  if (cached != null && cached !== "") {
    try { console.debug("[openaiService] cache HIT:", cacheKey); } catch {}
    return cached;
  }
  // 2) in-flight dedupe
  if (cacheKey && inflight.has(cacheKey)) {
    try { console.debug("[openaiService] inflight dedupe:", cacheKey); } catch {}
    return inflight.get(cacheKey);
  }

  const body = { model, messages, cacheKey, temperature, top_p, max_tokens, seed };

  // 프리플라이트(OPTIONS) 없이 보내기 위해 text/plain 사용
  const makeReq = async (endpoint) => {
    const res = await fetch(endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      // ✅ preflight 회피: Simple Request (text/plain)
      headers: { "content-type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(body),
      redirect: "follow",
      referrerPolicy: "no-referrer",
    });

    const text = await res.text();
    if (!res.ok) {
      let bodyJson;
      try { bodyJson = JSON.parse(text); } catch { bodyJson = { error: text }; }
      const msg = bodyJson?.error?.message || bodyJson?.error || text || "Unknown error";
      try {
        console.warn('[openaiService] FAIL', {
          endpoint,
          status: res.status,
          statusText: res.statusText,
          contentType: res.headers.get('content-type'),
          length: text.length,
          snippet: typeof text === 'string' ? text.slice(0, 160) : ''
        });
      } catch {}
      const err = new Error(`OpenAI API 오류 (${res.status}): ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
      // 에러 객체에 보조 정보 부착 (상태/본문 일부/엔드포인트)
      err.status = res.status;
      try { err.endpoint = endpoint; } catch {}
      try { err.raw = typeof text === 'string' ? text.slice(0, 300) : ''; } catch {}
      throw err;
    }

    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    const content = data?.choices?.[0]?.message?.content ?? (data ? "" : text);
    const value = String(content ?? "");

    if (cacheKey && value) writeCache(cacheKey, value, ttlMsFromCacheKey(cacheKey));
    return value;
  };

  // 🔔 시작 진동 (사용자 제스처 이후 환경에서만 실제로 울림)
  try { hapticsApiStart(); } catch {}

  const req = (async () => {
    try {
      // 1차: 현재 설정된 엔드포인트로
      const value = await makeReq(API_ENDPOINT);
      // 🔔 정상 완료 진동
      try { hapticsApiDone(); } catch {}
      return value;
    } catch (e) {
      const msg = String(e?.message || "");
      const isNetErr = e?.name === "TypeError" || /Failed to fetch/i.test(msg);
      const is405 = /\(405\)/.test(msg) || /405 Not Allowed/i.test(msg) || /Method Not Allowed/i.test(msg);
      const startedWithProxy = API_ENDPOINT === "/api/ai";
      if (startedWithProxy) {
        // 프록시에서 실패 → 워커로 폴백 허용 (net/405 모두)
        if (isNetErr || is405) {
          try {
            const alt = `${WORKER_ORIGIN}/chat`;
            console.warn("[openaiService] proxy failed (net/405), fallback ->", alt, e);
            const value = await makeReq(alt);
            try { hapticsApiDone(); } catch {}
            return value;
          } catch (e2) {
            try { hapticsApiError(); } catch {}
            throw e2;
          }
        }
      } else {
        // 워커에서 실패 → 개발 환경에서만 /api/ai 폴백 허용 (405에선 폴백 금지)
        if (CAN_USE_PROXY && isNetErr) {
          try {
            const alt = "/api/ai";
            console.warn("[openaiService] worker failed (net), fallback ->", alt, e);
            const value = await makeReq(alt);
            try { hapticsApiDone(); } catch {}
            return value;
          } catch (e2) {
            try { hapticsApiError(); } catch {}
            throw e2;
          }
        }
      }
      // 🔔 오류 진동(네트워크 외 에러 혹은 폴백 불가)
      try { hapticsApiError(); } catch {}
      throw e;
    }
  })();

  if (cacheKey) inflight.set(cacheKey, req);
  try { return await req; }
  finally { if (cacheKey) inflight.delete(cacheKey); }
}
