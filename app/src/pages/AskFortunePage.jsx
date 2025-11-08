// app/src/pages/AskFortunePage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui";
import FullScreenLoader from "../components/common/FullScreenLoader.jsx";
import AIFortune from "../components/sajoo/AIFortune.jsx";
import PillarDisplay from "../components/sajoo/PillarDisplay.jsx";
import { InputRequiredGuide } from "../components/common/Layout";
import { setSEO } from "../utils/seo.jsx";

import { loadCalculationDataFromCookie } from "../utils/cookieUtils.jsx";
import { lunarToSolar } from "../utils/lunarCalendar.jsx";
import { calculateSaju } from "../utils/sajooCalculator.jsx";
import { analyzeSajuMeta } from "../utils/sajuExtras.jsx";
import { callOpenAI } from "../services/openaiService.jsx";

/* ───────── 유틸 ───────── */
const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const BRANCH_TO_HOUR = { 자:0, 축:2, 인:4, 묘:6, 진:8, 사:10, 오:12, 미:14, 신:16, 유:18, 술:20, 해:22 };
function normalizeHour(raw){
  if (raw === '' || raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : null;
}
function resolveHourForCalc(hour, hourBranch){
  if (hourBranch && BRANCHES.includes(hourBranch)) return BRANCH_TO_HOUR[hourBranch];
  const n = normalizeHour(hour);
  return n == null ? 12 : n; // 모름이면 정오
}
function pad2(n){ return String(n).padStart(2, "0"); }
function todayKST(){
  const now = new Date(Date.now() + 9*3600*1000);
  return `${now.getUTCFullYear()}.${pad2(now.getUTCMonth()+1)}.${pad2(now.getUTCDate())}`;
}

/* 쿠키 입력만으로 사주 기둥 보장 계산(없으면 null) */
function ensureMySajuFromCookie(raw){
  if (!raw) return null;

  // 이미 4주가 있으면 그대로 사용(시간주 없어도 OK)
  if (raw.sajuResult?.year && raw.sajuResult?.month && raw.sajuResult?.day) {
    return raw;
  }

  // 최소 입력(연/월/일) 없으면 계산 불가
  if (!raw.year || !raw.month || !raw.day) return null;

  const calendar = raw.calendar || "solar";
  const y = Number(raw.year), m = Number(raw.month), d = Number(raw.day);
  const isLeap = raw.leapMonth === "leap" || raw.isLeap === true;

  const hourForCalc = resolveHourForCalc(raw.hour, raw.hourBranch);
  const minuteForCalc = Number(raw.minute || 0);

  let sY = y, sM = m, sD = d;
  if (calendar === "lunar") {
    const dt = lunarToSolar(y, m, d, isLeap);
    const solar = dt instanceof Date ? dt : new Date(dt);
    sY = solar.getFullYear(); sM = solar.getMonth()+1; sD = solar.getDate();
  }
  const saju = calculateSaju(sY, sM, sD, hourForCalc, minuteForCalc);

  return {
    ...raw,
    calendar,
    solarDate: `${sY}-${pad2(sM)}-${pad2(sD)}`,
    sajuResult: saju
  };
}

/* ───────── 소제목 보장 후처리 ─────────
   모델이 소제목(### )을 전혀 출력하지 않은 경우,
   문단을 분리해 각 문단 앞에 기본 소제목을 붙여준다. */
function ensureH3Headings(md) {
  try {
    const txt = String(md || "").replace(/\r\n/g, "\n").trim();
    if (!txt) return "";
    if (/^###\s+/m.test(txt)) return txt; // 이미 소제목 존재

    // 문단 단위로 쪼개기
    const paras = txt.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (!paras.length) return txt;

    const labeled = paras.map((p, i) => `### 사주 풀이 ${i+1}\n${p}`);
    return labeled.join("\n\n");
  } catch {
    return md;
  }
}

export default function AskFortunePage(){
  // SEO
  useEffect(() => {
    setSEO({
      title: "질문 풀이",
      description: "운세뉴스에 궁금한 점을 보내면 사주 관점에서 해석해 드립니다.",
      path: "/#/ask",
      image: "/og-image.png",
    });
  }, []);

  // 쿠키에서 내 정보 확보 → 필요 시 즉석 계산해 4주 보장
  const raw = loadCalculationDataFromCookie() || null;
  const me = useMemo(() => ensureMySajuFromCookie(raw), [raw]);
  const hasPillars = !!(me?.sajuResult?.year && me?.sajuResult?.month && me?.sajuResult?.day);

  // ❗ 쿠키 정보가 전혀 없거나(혹은 연/월/일 부족) → 사주팔자 안내 페이지와 동일한 가이드 노출
  if (!me) {
    return (
      <div className="calculator">
        <InputRequiredGuide homeHref="/" />
      </div>
    );
  }

  /* 폼 상태 */
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const resultRef = useRef(null);

  // 캐시 키
  const buildSignature = useCallback(() => {
    const keyParts = ["QNA_SAJU_ONLY_WITH_FORCED_H3", question.trim()];
    if (hasPillars) {
      keyParts.push(
        me.calendar, `${me.year}-${me.month}-${me.day}`,
        `${me.hour ?? ''}:${me.minute ?? ''}:${me.hourBranch ?? ''}`,
        me.gender ?? ''
      );
    } else {
      keyParts.push("NO_SAJU");
    }
    return keyParts.join("|");
  }, [question, hasPillars, me]);

  // 복귀 시 최근 결과 복원
  useEffect(() => {
    try {
      const last = JSON.parse(localStorage.getItem("ASK_QNA_LAST") || "null");
      if (last && last.question && typeof last.answer === "string" && last.answer.trim()) {
        setQuestion(last.question);
        setAnswer(ensureH3Headings(last.answer)); // 복원 시에도 소제목 강제
        setTimeout(() => { try { resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} }, 60);
      }
    } catch {}
  }, []);

  // 스크롤
  const scrollToResult = useCallback(() => {
    const el = resultRef.current;
    if (!el) return;
    try{
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }catch{
      const rect = el.getBoundingClientRect();
      const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top - 12;
      window.scrollTo(0, y);
    }
  }, []);

  // 제출
  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");
    setAnswer("");

    const q = question.trim();
    if (!q) {
      setError("질문을 먼저 입력해 주세요.");
      return;
    }

    // 캐시 확인
    const sig = buildSignature();
    try {
      const cached = JSON.parse(localStorage.getItem("ASK_QNA_CACHE") || "{}");
      if (cached[sig]) {
        const cachedText = ensureH3Headings(String(cached[sig] || ""));
        setAnswer(cachedText);
        try {
          localStorage.setItem("ASK_QNA_LAST", JSON.stringify({ question: q, answer: cachedText, signature: sig, ts: Date.now() }));
        } catch {}
        setTimeout(scrollToResult, 30);
        return;
      }
    } catch {}

    setLoading(true);
    try {
      // ▶︎ 사주 관점만, 쉬운 표현, 500자 이상, 반드시 h3 소제목 포함(문단마다)
      const baseSystem = [
        "당신은 '운세 뉴스'의 명리(사주) 풀이 도우미입니다.",
        "출력은 오직 사주 관점 풀이로 작성합니다.",
        "전체 분량은 최소 500자 이상으로 하세요.",
        "쉬운 한국어로, 불필요한 전문용어는 풀어서 설명하세요.",
        "각 문단 앞에 반드시 h3 소제목(### 짧고 명확한 제목)을 한 줄 넣고, 다음 줄부터 본문을 작성하세요.",
        "문단 수는 3~6개로 하세요.",
        "점수/별점/색상/표/목록은 사용하지 마세요. 표나 리스트 대신 문단으로 서술합니다.",
        "일반적/심리/의료/재정 조언, 서론·결론·면책·주의사항 등 비사주성 내용은 금지합니다.",
        "개인정보나 생년월일을 본문에 재기술하지 마세요.",
        "사주가 제공될 경우 근거 우선순위: 용신·기신 → 합/충/형/해/파/원진 → 신살 → 격국(요지) → 오행 분포/신강도 → 대운·세운 톤.",
        "제공된 JSON(pillars, meta) 밖의 임의 간지/표/추정은 생성하지 마세요."
      ].join(" ");

      const contextLines = [
        `- 질문 원문: """${q}"""`,
        `- 조회일(KST): ${todayKST()}`,
      ];

      const payload = { question: q };

      if (hasPillars) {
        const hh = resolveHourForCalc(me.hour, me.hourBranch);
        const birthCtx = {
          y: Number(me.year), m: Number(me.month), d: Number(me.day),
          hh, mm: Number(me.minute || 0),
          gender: me.gender || "unknown",
          yearStem: me.sajuResult?.year?.stem,
        };
        const meta = analyzeSajuMeta(me.sajuResult, { birth: birthCtx });

        payload.me = {
          input: {
            calendar: me.calendar,
            year: me.year, month: me.month, day: me.day,
            hour: me.hour ?? '', minute: me.minute ?? '',
            hourBranch: me.hourBranch || '',
            gender: me.gender || 'unknown',
            leapMonth: me.leapMonth || (me.isLeap ? 'leap' : 'common'),
            solarDate: me.solarDate || '',
          },
          pillars: me.sajuResult,
          meta,
        };
        contextLines.push("- 사주 정보: 제공됨(쿠키의 사주 기둥 + 신살/용신/격국/합충/대운·세운 메타)");
      } else {
        contextLines.push("- 사주 정보: 제공되지 않음");
      }

      const systemPrompt = baseSystem;
      const userPrompt = [
        "질문/컨텍스트:",
        ...contextLines,
        "",
        "요청:",
        "- 제공된 4주/메타만 근거로 질문과 직접 연결되는 풀이를 작성하세요.",
        "- 각 문단 앞에는 반드시 '### {짧은 소제목}'을 넣고, 다음 줄에 본문을 씁니다.",
        "- 전체 길이는 500자 이상, 문단은 3~6개.",
      ].join("\n");

      const jsonBlock = "```json\n" + JSON.stringify(payload, null, 2) + "\n```";

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt + "\n\n데이터:\n" + jsonBlock }
      ];

      const text = await callOpenAI({ messages, cacheKey: sig });

      // ⬇️ 소제목 보장 후처리
      const finalText = ensureH3Headings(String(text || "").trim());
      setAnswer(finalText);

      // 캐시 저장
      try {
        const prev = JSON.parse(localStorage.getItem("ASK_QNA_CACHE") || "{}");
        prev[sig] = finalText;
        localStorage.setItem("ASK_QNA_CACHE", JSON.stringify(prev));
      } catch {}

      // 최근 결과 저장(페이지 이동 후 복귀용)
      try {
        localStorage.setItem("ASK_QNA_LAST", JSON.stringify({ question: q, answer: finalText, signature: sig, ts: Date.now() }));
      } catch {}

      setTimeout(scrollToResult, 30);
    } catch (err) {
      setError(err?.message || "풀이 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setQuestion("");
    setAnswer("");
    setError("");
    try { localStorage.removeItem("ASK_QNA_LAST"); } catch {}
  };

  return (
    <div className="calculator ask-page" aria-label="질문 풀이">
      <FullScreenLoader
        show={loading}
        title="질문 풀이를 준비하고 있어요"
        message="질문을 분석하고 사주 정보를 반영하는 중입니다."
      />

      <div className="card result" aria-busy={loading ? "true" : "false"}>
        <h2>질문 풀이</h2>

        {/* 출생 사주 기둥 */}
        {hasPillars && (
          <div style={{ marginTop: 0 }}>
            <h3 style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>
              출생 사주 기둥
            </h3>
            <PillarDisplay pillars={me.sajuResult} idPrefix="ask" />
          </div>
        )}

        {/* 질문 입력 폼 */}
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div>
            <label htmlFor="q-body" className="label">질문</label>
            <textarea
              id="q-body"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예) 올해 이직 타이밍이 제 사주에 어떤가요?"
              rows={6}
              style={{
                width: "100%",
                resize: "vertical",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                구체적으로 적을수록 더 도움이 돼요. 개인정보는 적지 마세요.
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {question.trim().length}자
              </div>
            </div>
          </div>

          <div className="actions" style={{ display: "flex", gap: 10, marginTop: 2 }}>
            <Button type="button" variant="text" onClick={onReset}>초기화</Button>
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? "풀이 중…" : "풀이 받기"}
            </Button>
          </div>
        </form>

        {/* 결과 — AIFortune 기본 스타일(사주팔자와 동일) */}
        <section ref={resultRef} style={{ marginTop: 16 }}>
          {error ? (
            <div className="info-box" role="alert" style={{ color: "var(--danger, #b91c1c)" }}>
              {error}
            </div>
          ) : null}

          {!loading && answer && (
            <AIFortune content={answer} isLoading={false} error="" />
          )}
        </section>
      </div>

      <style>{`
        .label{ display:block; font-weight:700; margin-bottom:6px; }
        .muted{ color: var(--ink-soft, #6b7280); }
      `}</style>
    </div>
  );
}
