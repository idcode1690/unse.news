// worker/src/index.js

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Worker: OpenAI 프록시
//  - /about     : 키 존재/해시/길이 확인 (디버그용, 민감정보 노출 없음)
//  - /selftest  : 실제 OpenAI 최소 호출 테스트
//  - /chat [POST]: 클라이언트 → OpenAI Chat Completions 프록시
// 포인트:
//  1) env.OPENAI_API_KEY만 사용 + trim() (개행/공백 문제 방지)
//  2) 절대 클라이언트 Authorization을 OpenAI에 전달하지 않음
//  3) CORS 허용 (필요 시 화이트리스트로 변경)
//  4) 같은 cacheKey로 짧은 시간(기본 5초) 내 중복 요청 시 기존 응답을 즉시 재사용 (프론트 중복/리트라이 흡수)
// ─────────────────────────────────────────────────────────────────────────────

/** Base64URL 짧은 해시(키 지문) */
async function shortHash(s) {
  const buf = new TextEncoder().encode(s);
  const dig = await crypto.subtle.digest("SHA-256", buf);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(dig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64.slice(0, 10); // 앞 10자만 노출
}

/** 공통 CORS 헤더 (보안 강화시 allowlist 적용) */
function buildCors(req) {
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = origin || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin, accept-encoding",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

// ── 짧은 기간 중복요청 흡수용 메모리 캐시 ──
const RECENT = new Map(); // cacheKey -> { t, status, body, ct }
const DEDUP_MS = 5000;    // 동일 cacheKey 수신시 5초 내에는 이전 응답 재사용

function cleanupRecent() {
  const now = Date.now();
  for (const [k, v] of RECENT.entries()) {
    if (now - v.t > DEDUP_MS) RECENT.delete(k);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = buildCors(req);
    // ── 기본 진입 로깅 (경로/메서드) ──
    try { console.log('[worker] incoming', req.method, url.pathname); } catch {}

    // Preflight
    if (req.method === "OPTIONS") {
      return new Response("", { status: 204, headers: cors });
    }

    // /about: 키 정보 확인(존재/길이/짧은 해시)
    if (url.pathname === "/about") {
      const raw = env.OPENAI_API_KEY ?? "";
      const key = raw.trim();
      const has = !!key;
      const hash = has ? await shortHash(key) : null;
      const org = (env.OPENAI_ORG_ID || "").trim();
      const project = (env.OPENAI_PROJECT_ID || "").trim();
      return new Response(
        JSON.stringify({
          ok: true,
          hasOpenAIKey: has,
          keyLenRaw: raw.length,
          keyLenTrim: key.length,
          keyHash: hash,
          hasOrg: !!org,
          hasProject: !!project,
        }),
        { headers: { "content-type": "application/json", ...cors } }
      );
    }

    // /keycheck: 추가 디버그 — 앞/뒤 4글자 + 해시 (값 자체는 노출 안 함)
    if (url.pathname === "/keycheck") {
      const raw = env.OPENAI_API_KEY ?? "";
      const key = raw.trim();
      const has = !!key;
      const safe = has ? {
        start4: key.slice(0,4),
        end4: key.slice(-4),
        len: key.length,
        hash10: await shortHash(key),
      } : null;
      return new Response(JSON.stringify({ ok:true, has, meta: safe }), { headers: {"content-type":"application/json", ...cors } });
    }

    // /selftest: 실제 OpenAI 최소 호출 확인
    if (url.pathname === "/selftest") {
  const key = (env.OPENAI_API_KEY || "").trim();
  const org = (env.OPENAI_ORG_ID || "").trim();
  const project = (env.OPENAI_PROJECT_ID || "").trim();
      if (!key) {
        return new Response(
          JSON.stringify({ ok: false, status: 401, error: "OPENAI_API_KEY not set" }),
          { status: 401, headers: { "content-type": "application/json", ...cors } }
        );
      }
      try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini-2024-07-18",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        });
        const sample = await r.text();
        return new Response(JSON.stringify({ ok: r.ok, status: r.status, sample }), {
          status: r.status,
          headers: { "content-type": "application/json", ...cors },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ ok: false, status: 500, error: String(err?.message || err) }),
          { status: 500, headers: { "content-type": "application/json", ...cors } }
        );
      }
    }

    // /chat: OpenAI Chat Completions 프록시
    if (url.pathname === "/chat" && req.method === "POST") {
      const key = (env.OPENAI_API_KEY || "").trim();
      const org = (env.OPENAI_ORG_ID || "").trim();
      const project = (env.OPENAI_PROJECT_ID || "").trim();
      if (!key) {
        return new Response(
          JSON.stringify({ error: "OPENAI_API_KEY not set" }),
          { status: 401, headers: { "content-type": "application/json", ...cors } }
        );
      }

      // 🔧 본문 파서: text/plain 회피 전송도 허용
      let bodyJson = null;
      try {
        bodyJson = await req.json();
      } catch (e1) {
        try {
          const txt = await req.text();
          bodyJson = JSON.parse(txt);
          try { console.log('[worker] json(recovered) length', txt.length); } catch {}
        } catch (e2) {
          try { console.log('[worker] body parse failed', String(e1), String(e2)); } catch {}
          return new Response(
            JSON.stringify({ error: "Invalid JSON body" }),
            { status: 400, headers: { "content-type": "application/json", ...cors } }
          );
        }
      }

  const messages = bodyJson?.messages;
  const model = bodyJson?.model || "gpt-4o-mini-2024-07-18";
  const temperature = bodyJson?.temperature;
  const top_p = bodyJson?.top_p;
  const max_tokens = bodyJson?.max_tokens;
  const seed = bodyJson?.seed;
      const cacheKey = typeof bodyJson?.cacheKey === "string" ? bodyJson.cacheKey : null;

      if (!Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: "messages array required" }),
          { status: 400, headers: { "content-type": "application/json", ...cors } }
        );
      }

      // ⏱️ 중복요청 흡수
      cleanupRecent();
      if (cacheKey) {
        const hit = RECENT.get(cacheKey);
        const now = Date.now();
        if (hit && now - hit.t < DEDUP_MS) {
          return new Response(hit.body, {
            status: hit.status,
            headers: { ...cors, "content-type": hit.ct || "application/json" },
          });
        }
      }

      try {
        const headers = {
          "content-type": "application/json",
          // 클라이언트의 Authorization은 절대 전달하지 않음
          "authorization": `Bearer ${key}`,
        };
        if (org) headers["OpenAI-Organization"] = org;
        if (project) headers["OpenAI-Project"] = project;

        const payload = { model, messages };
        if (typeof temperature === 'number') payload.temperature = temperature;
        if (typeof top_p === 'number') payload.top_p = top_p;
        if (typeof max_tokens === 'number') payload.max_tokens = max_tokens;
        if (typeof seed !== 'undefined') payload.seed = seed;

        const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const txt = await upstream.text();
        const ct = upstream.headers.get("content-type") || "application/json";

        // 디버그용 상태 로그 (민감정보 미포함)
  try { console.log("[worker] /chat upstream status", upstream.status); } catch {}

        // ⏺️ 최근 결과 저장 (dedup)
        if (cacheKey) {
          RECENT.set(cacheKey, {
            t: Date.now(),
            status: upstream.status,
            body: txt,
            ct,
          });
        }

        return new Response(txt, {
          status: upstream.status,
          headers: { ...cors, "content-type": ct },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Upstream error", detail: String(err?.message || err) }),
          { status: 502, headers: { "content-type": "application/json", ...cors } }
        );
      }
    }

    // 기본 응답
    return new Response(JSON.stringify({ ok: true, note: "ready" }), {
      headers: { "content-type": "application/json", ...cors },
    });
  },
};
