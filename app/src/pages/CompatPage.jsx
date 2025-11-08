// app/src/pages/CompatPage.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Button, Select, SegmentedControl } from "../components/ui";
import { setSEO } from "../utils/seo.jsx";
import { DEFAULT_VALUES, MBTI_TYPES } from "../utils/constants.jsx";
import { lunarToSolar } from "../utils/lunarCalendar.jsx";
import {
  loadCalculationDataFromCookie,
  saveCompatDataToCookie,
  loadCompatDataFromCookie,
  // 하루 1회 모달 전역 플래그
  isShareModalSeenToday,
  setShareModalSeenToday,
} from "../utils/cookieUtils.jsx";
import PillarDisplay from "../components/sajoo/PillarDisplay.jsx";
import AIFortune from "../components/sajoo/AIFortune.jsx";
import { calculateSaju } from "../utils/sajooCalculator.jsx";
import { callOpenAI } from "../services/openaiService.jsx";
import { InputRequiredGuide } from "../components/common/Layout";
import FullScreenLoader from "../components/common/FullScreenLoader.jsx";
import ShareModal from "../components/common/ShareModal.jsx";
// ✅ 추가: 용신/기신/십성/신살·격국 등 메타 분석기
import { analyzeSajuMeta } from "../utils/sajuExtras.jsx";

const LOCK_STORAGE_KEY = "compat_locked";
const PARTNER_STORAGE_KEY = "compat_partner";
const SKIP_SCROLL_ON_RETURN_KEY = "compat_skip_scroll_on_return";

function safeLSGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeLSSet(key, val) { try { localStorage.setItem(key, val); } catch {} }
function safeLSRemove(key) { try { localStorage.removeItem(key); } catch {} }
function safeSSGet(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
function safeSSSet(key, val) { try { sessionStorage.setItem(key, val); } catch {} }

/* ── ✅ 31일/모름 대응 유틸 ─────────────────────────────── */
function isLeapYear(y) {
  y = Number(y);
  if (!Number.isFinite(y) || y <= 0) return false;
  return (y % 400 === 0) || (y % 4 === 0 && y % 100 !== 0);
}
function solarDaysInMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(m) || m < 1 || m > 12) return 31; // 연/월 미선택 시 기본 31일 노출
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  if ([4, 6, 9, 11].includes(m)) return 30;
  return 31;
}
// 시간 표준화: '', null, undefined, NaN -> null
function normalizeHour(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 23 ? n : null;
}

// ── 동일 입력 서명 유틸 ──
function normMBTI(v){ return (v==null?"":String(v).trim().toUpperCase()); }
function sigFromInput(p){
  const calendar = p?.calendar || "solar";
  const y = p?.year ?? "";
  const m = p?.month ?? "";
  const d = p?.day ?? "";
  const hh = p?.hour ?? "";        // ← 모름(빈 문자열) 보존
  const mm = p?.minute ?? "0";
  const gender = p?.gender || "";
  const leap = p?.leapMonth || (p?.isLeap ? "leap" : "common");
  const mbti = normMBTI(p?.mbti);
  return [calendar, `${y}-${m}-${d}`, `${hh}:${mm}`, gender, leap, mbti].join("|");
}
function buildCompatSignature(me, partner){
  return `ME:${sigFromInput(me)}||PARTNER:${sigFromInput(partner)}`;
}
function getPrevSignature(prev){
  if (!prev) return null;
  if (prev.signature) return prev.signature;
  if (prev.me && prev.partner) return buildCompatSignature(prev.me, prev.partner);
  return null;
}

function getInitialLockFromStorageOrCookie() {
  const flag = safeLSGet(LOCK_STORAGE_KEY);
  if (flag === "1") return true;
  if (flag === "0") return false;
  try {
    const prev = loadCompatDataFromCookie();
    if (prev && (prev.text || prev.myPillars || prev.partnerPillars)) return true;
  } catch {}
  return false;
}

function normalizePartnerInput(raw) {
  const v = raw || {};
  return {
    calendar: v.calendar || "solar",
    leapMonth: v.leapMonth || "common",
    gender: v.gender || "female",
    mbti: v.mbti || "",
    year: v.year ? String(v.year) : "",
    month: v.month ? String(v.month) : "",
    day: v.day ? String(v.day) : "",
    hour: v.hour != null ? String(v.hour) : "",     // ← 모름 지원
    minute: v.minute != null ? String(v.minute) : "",
  };
}

export default function CompatPage() {
  // SEO
  useEffect(() => {
    setSEO({
      title: "궁합",
      description: "상생·상극 밸런스와 소통 팁을 사주 기둥 기반으로 확인하세요.",
      path: "/#/compat",
      image: "/og-image.png",
    });
  }, []);

  // 내 정보(쿠키)
  const me = loadCalculationDataFromCookie();
  const hasInput = !!me;

  const [isLocked, setIsLocked] = useState(getInitialLockFromStorageOrCookie);
  const [savedState, setSavedState] = useState(() => (getInitialLockFromStorageOrCookie() ? "saved" : ""));

  const initialPartnerGender = useMemo(() => {
    if (me?.gender === "male") return "female";
    if (me?.gender === "female") return "male";
    return "female";
  }, [me]);

  const myInlineFields = useMemo(() => {
    if (!me) return [];
    const isLunar = me.calendar === "lunar";
    const calendar = isLunar ? "음력" : "양력";
    const leap = isLunar && (me.leapMonth === "leap" || me.isLeap) ? " (윤달)" : "";
    const ymd = [me.year, me.month, me.day].filter(Boolean).join(".");
    const hour = (me?.hour ?? "") !== "" ? `${me.hour}시` : "—"; // 모름이면 —
    const gender = me.gender === "male" ? "남성" : me.gender === "female" ? "여성" : "—";
    const mbti = me.mbti ? String(me.mbti).toUpperCase() : "—";
    return [
      { label: "달력", value: `${calendar}${leap}`.trim() },
      { label: "생년월일", value: ymd || "—" },
      { label: "시간", value: hour },
      { label: "성별", value: gender },
      { label: "MBTI", value: mbti },
    ];
  }, [me]);

  // ===== 상대방 폼 =====
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_VALUES,
    calendar: "solar",
    gender: initialPartnerGender,
    mbti: "",
  }));

  const [myPillars, setMyPillars] = useState(null);
  const [partnerPillars, setPartnerPillars] = useState(null);

  // ✅ 추가: 메타(용신·기신·십성·신살·격국/오행분포/대운·세운 등)
  const [myMeta, setMyMeta] = useState(null);
  const [partnerMeta, setPartnerMeta] = useState(null);

  const [compatText, setCompatText] = useState("");
  const [compatLoading, setCompatLoading] = useState(false);
  const [compatError, setCompatError] = useState("");

  // 모달(하루 1회) + 스크롤 타깃
  const [shareOpen, setShareOpen] = useState(false);
  const shownRef = useRef(false);
  const userInteractedRef = useRef(false);
  const bottomSentinelRef = useRef(null);

  // 이번에 “사용자가 제출”해서 생긴 결과인지(= 자동 스크롤 허용)
  const justSubmittedRef = useRef(false);
  const didScrollToApiRef = useRef(false);

  // 돌아오기 플래그
  useEffect(() => {
    const cameBack = safeSSGet(SKIP_SCROLL_ON_RETURN_KEY) === "1";
    if (cameBack) { /* justSubmittedRef 로 제어 */ }
    safeSSSet(SKIP_SCROLL_ON_RETURN_KEY, "0");
    return () => { safeSSSet(SKIP_SCROLL_ON_RETURN_KEY, "1"); };
  }, []);

  // 복원
  useEffect(() => {
    const v = loadCompatDataFromCookie();
    if (v) {
      if (v.myPillars) setMyPillars(v.myPillars);
      if (v.partnerPillars) setPartnerPillars(v.partnerPillars);
      if (v.text) setCompatText(v.text);
      if (v.myMeta) setMyMeta(v.myMeta);
      if (v.partnerMeta) setPartnerMeta(v.partnerMeta);
    }
    let restored = null;
    const ls = safeLSGet(PARTNER_STORAGE_KEY);
    if (ls) { try { restored = JSON.parse(ls); } catch {} }
    if (!restored && v && v.partner) restored = v.partner;
    if (restored) setFormData((prev) => ({ ...prev, ...normalizePartnerInput(restored) }));
  }, []);

  // 옵션들
  const mbtiOptions = useMemo(
    () => MBTI_TYPES.map((m) => ({ value: m.value, label: m.label })),
    []
  );
  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = 1900; y <= 2029; y++) arr.push({ value: String(y), label: `${y}년` });
    return arr;
  }, []);
  const monthOptions = useMemo(() => {
    const arr = [];
    for (let m = 1; m <= 12; m++) arr.push({ value: String(m), label: `${m}월` });
    return arr;
  }, []);
  // ✅ 31일 반영 + 연/월 미선택 시에도 31 노출
  const dayOptions = useMemo(() => {
    const isLunar = formData.calendar === "lunar";
    const maxDays = isLunar ? 30 : solarDaysInMonth(formData.year, formData.month);
    const arr = [];
    for (let d = 1; d <= maxDays; d++) arr.push({ value: String(d), label: `${d}일` });
    return arr;
  }, [formData.calendar, formData.year, formData.month]);

  // ✅ 시간: 모름 + 00~23시
  const hourOptions = useMemo(() => {
    const arr = [{ value: "", label: "모름" }];
    for (let h = 0; h < 24; h++) arr.push({ value: String(h), label: `${String(h).padStart(2,'0')}시` });
    return arr;
  }, []);

  // 값 보정
  const setWithClamp = (next) => {
    const n = { ...next };
    const isLunar = n.calendar === "lunar";
    const maxDays = isLunar ? 30 : solarDaysInMonth(n.year, n.month);
    const curDay = Number(n.day);
    if (!curDay || curDay > maxDays) n.day = String(Math.min(curDay || 1, maxDays));
    return n;
  };

  // 입력 핸들러
  const handleCalendarChange = (value) => setFormData((p) => setWithClamp({ ...p, calendar: value }));
  const handleGenderChange = (gender) => setFormData((p) => ({ ...p, gender }));
  const handleFieldChange = (field, value) => {
    if (field === "year" || field === "month" || field === "leapMonth") {
      setFormData((p) => setWithClamp({ ...p, [field]: value }));
    } else {
      setFormData((p) => ({ ...p, [field]: value }));
    }
  };

  // 제출 가능 여부
  const partnerReady = useMemo(() => {
    const hasDate = formData.year && formData.month && formData.day;
    const lunarOk = formData.calendar === "solar" || !!formData.leapMonth;
    return !!(hasDate && lunarOk && formData.gender);
  }, [formData]);

  // 입력→사주 기둥
  function calcPillarsFromInput(input) {
    const calendar = input.calendar || "solar";
    const year = Number(input.year);
    const month = Number(input.month);
    const day = Number(input.day);

    // ⬇️ 계산용: 모름(null)이면 기본 12시 사용 (표시는 별개)
    const hNorm = normalizeHour(input.hour);
    const hour = hNorm ?? 12;
    const minute = input.minute != null ? Number(input.minute) : 0;

    const isLeap = input.leapMonth === "leap" || input.isLeap;

    let sY = year, sM = month, sD = day;
    if (calendar === "lunar") {
      const d = lunarToSolar(year, month, day, isLeap);
      const solar = d instanceof Date ? d : new Date(d);
      sY = solar.getFullYear(); sM = solar.getMonth() + 1; sD = solar.getDate();
    }
    return calculateSaju(sY, sM, sD, hour, minute);
  }

  // ───────── 스크롤 유틸 ─────────
  const getHeaderOffset = useCallback(() => {
    try {
      const header = document.querySelector("header, .header, [role='banner']");
      if (!header) return 0;
      const pos = getComputedStyle(header).position || "";
      return /fixed|sticky/i.test(pos) ? Math.ceil(header.getBoundingClientRect().height || 0) : 0;
    } catch { return 0; }
  }, []);

  const getScrollParent = useCallback((node) => {
    if (!node || typeof window === 'undefined') return null;
    let el = node.parentElement;
    while (el) {
      const style = window.getComputedStyle(el);
      const oy = style.overflowY || style.overflow;
      if (/(auto|scroll|overlay)/i.test(oy)) return el;
      el = el.parentElement;
    }
    return null; // window
  }, []);

  const scrollToElement = useCallback((el) => {
    if (!el) return false;
    const REVEAL_MARGIN = 14;
    const headerH = getHeaderOffset();
    const root = getScrollParent(el) || window;

    let absoluteTop;
    if (root === window) {
      const rect = el.getBoundingClientRect();
      absoluteTop = (window.scrollY || window.pageYOffset) + rect.top;
    } else {
      const rectEl = el.getBoundingClientRect();
      const rectRoot = root.getBoundingClientRect();
      absoluteTop = root.scrollTop + (rectEl.top - rectRoot.top);
    }

    const desiredTop = Math.max(0, absoluteTop - headerH - REVEAL_MARGIN);
    const doc = document.scrollingElement || document.documentElement;
    const height = root === window ? (window.innerHeight || doc.clientHeight) : root.clientHeight;
    const scrollHeight = root === window ? (doc.scrollHeight) : root.scrollHeight;
    const maxTop = Math.max(0, scrollHeight - height);
    const finalTop = Math.min(desiredTop, maxTop);

    try {
      if (root === window) window.scrollTo({ top: finalTop, behavior: "smooth" });
      else root.scrollTo({ top: finalTop, behavior: "smooth" });
    } catch {
      if (root === window) window.scrollTo(0, finalTop);
      else root.scrollTop = finalTop;
    }
    return true;
  }, [getHeaderOffset, getScrollParent]);

  // API/캐시 텍스트가 준비되면 **이번 제출에 한해서만** 스크롤
  useEffect(() => {
    if (didScrollToApiRef.current) return;
    if (!compatLoading && compatText && justSubmittedRef.current) {
      const target = document.getElementById("compat-my-header") || document.querySelector("h3.h4, h3");
      if (target) {
        requestAnimationFrame(() =>
          setTimeout(() => {
            const ok = scrollToElement(target);
            if (ok) {
              didScrollToApiRef.current = true;
              justSubmittedRef.current = false;
            }
          }, 80)
        );
      }
    }
  }, [compatLoading, compatText, scrollToElement]);

  // ✅ 메타(용신·기신/십성/신살…) 계산 헬퍼
  function buildBirthCtxFrom(meLike, pillars) {
    const y = Number(meLike?.year), m = Number(meLike?.month), d = Number(meLike?.day);
    const hh = normalizeHour(meLike?.hour) ?? 12; // 메타 계산도 모름이면 12시
    const mm = meLike?.minute != null ? Number(meLike.minute) : 0;
    return {
      y, m, d, hh, mm,
      gender: meLike?.gender || "unknown",
      yearStem: pillars?.year?.stem,
    };
  }

  // ✅ 실제 분석 호출 (캐시 미스 때만) — 메타 포함
  async function analyzeCompatibility(mineObj, partnerObj, minePillars, partnerPillars, signature) {
    setCompatLoading(true);
    setCompatError("");
    setCompatText("");

    try {
      const meDesc = {
        calendar: mineObj?.calendar,
        year: mineObj?.year, month: mineObj?.month, day: mineObj?.day,
        hour: mineObj?.hour ?? "", minute: mineObj?.minute ?? "0", // 표시/캐시용: 모름 보존
        gender: mineObj?.gender, leapMonth: mineObj?.leapMonth, mbti: normMBTI(mineObj?.mbti),
      };
      const partnerDesc = {
        calendar: partnerObj?.calendar,
        year: partnerObj?.year, month: partnerObj?.month, day: partnerObj?.day,
        hour: partnerObj?.hour ?? "", minute: partnerObj?.minute ?? "0",
        gender: partnerObj?.gender, leapMonth: partnerObj?.leapMonth, mbti: normMBTI(partnerObj?.mbti),
      };

      // 🔹 메타 계산
      const myBirthCtx = buildBirthCtxFrom(mineObj, minePillars);
      const partnerBirthCtx = buildBirthCtxFrom(partnerObj, partnerPillars);
      const myMetaCalc = analyzeSajuMeta(minePillars, { birth: myBirthCtx, mode: "compat" });
      const partnerMetaCalc = analyzeSajuMeta(partnerPillars, { birth: partnerBirthCtx, mode: "compat" });

      // 🔹 AI 프롬프트 페이로드
      const payload = {
        me: { input: meDesc, pillars: minePillars, meta: myMetaCalc },
        partner: { input: partnerDesc, pillars: partnerPillars, meta: partnerMetaCalc },
        guidance: {
          must_use: ["오행 분포/균형", "용신·기신", "십성(육친)", "신살", "합·충·형·해·파·원진", "격국(요지)", "대운·세운 톤(과도한 단정 금지)"],
          avoid: ["JSON 외 임의 간지/점수 생성", "과장/공포 유발 표현", "개인정보/생년월일 재기술"],
        }
      };

      const systemPrompt = [
        '당신은 명리·사주 풀이 무당입니다. 궁합을 풀이하고 다음 규칙을 반드시 지킵니다.',
        '모르거나 부정확한 풀이는 허위로 작성하지 말고 완전히 작성하지 마세요',
        '소제목은 h3(###) 형식으로 작성하고, 추가 소제목/서론/결론/요약 금지',
        "오직 제공된 JSON(양측의 4주와 meta: 용신·기신·십성·신살·오행분포·합충형해파·격국 등)만을 근거로 서술하세요.",
        "새 간지/점수/절기 생성 금지, 외부 추정 금지, 단정/공포 금지.",
        "궁합 총평, 성격풀이, 겉궁합 풀이, 속궁합 풀이, 섹스풀이로 소제목을 작성해줘.",
        "각 항목 500자 이상 작성하고, 반복/상투어 금지, 구체 사례/상호작용 중심.",
        "조언, 해결책제시는 금지. 오로지 사주풀이만 작성해주세요",
        "생년월일/시각은 본문에 재기술하지 마세요(이미 별도로 제공됨)."
      ].join(" ");

      const userPrompt = [
        "분석 JSON:",
        "```json",
        JSON.stringify(payload, null, 2),
        "```",
        "",
        "지침:",
        "- 용신과 기신의 상호작용(상생/상극)으로 관계의 균형·보완 포인트를 설명하세요.",
        "- 양측 십성(육친)과 신살을 비교하여 소통/신뢰/갈등 포인트를 구체화하세요.",
        "- 합·충·형·해·파·원진이 성립하면 해당 영역에 미칠 가능성을 사례로 연결하세요.",
        "- 과한 점괘식 표현/점수화/별점/색상 표기는 금지합니다."
      ].join("\n");

      const text = await callOpenAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const finalText = String(text || "").trim();
      setCompatText(finalText);

      // 결과 저장 (+ signature, + 메타)
      saveCompatDataToCookie({
        me: meDesc,
        partner: partnerDesc,
        myPillars: minePillars,
        partnerPillars: partnerPillars,
        myMeta: myMetaCalc,
        partnerMeta: partnerMetaCalc,
        text: finalText,
        signature,
        ts: Date.now(),
      });

      // 🔒 저장완료 상태
      setIsLocked(true);
      setSavedState("saved");
      safeLSSet(LOCK_STORAGE_KEY, "1");
      safeLSSet(PARTNER_STORAGE_KEY, JSON.stringify(normalizePartnerInput(partnerDesc)));
    } catch (err) {
      setCompatError(err?.message || String(err));
    } finally {
      setCompatLoading(false);
    }
  }

  // 제출
  const onSubmit = async (e) => {
    e.preventDefault();

    // 이번 제출 스크롤 허용
    justSubmittedRef.current = true;
    didScrollToApiRef.current = false;

    // 클릭 즉시 잠금 + 스냅샷
    setIsLocked(true);
    setSavedState("");
    const snapshot = normalizePartnerInput(formData);
    safeLSSet(LOCK_STORAGE_KEY, "1");
    safeLSSet(PARTNER_STORAGE_KEY, JSON.stringify(snapshot));

    // 기둥 계산
    let mine = null;
    if (me?.year && me?.month && me?.day) {
      mine = calcPillarsFromInput(me);
      setMyPillars(mine);
    } else {
      setMyPillars(null);
    }

    let partner = null;
    if (formData?.year && formData?.month && formData?.day) {
      partner = calcPillarsFromInput(formData);
      setPartnerPillars(partner);
    } else {
      setPartnerPillars(null);
    }

    if (!(mine && partner)) {
      setCompatText("");
      setCompatError("내 정보와 상대방 정보를 모두 입력해야 궁합 풀이가 가능합니다.");
      setIsLocked(false);
      setSavedState("");
      safeLSSet(LOCK_STORAGE_KEY, "0");
      safeLSRemove(PARTNER_STORAGE_KEY);
      justSubmittedRef.current = false;
      return;
    }

    // 캐시 체크: 같은 입력이면 API 호출 스킵
    const signature = buildCompatSignature(me, formData);
    const prev = loadCompatDataFromCookie();
    const prevSig = getPrevSignature(prev);

    if (prev && prev.text && prevSig === signature) {
      setCompatText(prev.text);
      setMyPillars(prev.myPillars || mine);
      setPartnerPillars(prev.partnerPillars || partner);
      if (prev.myMeta) setMyMeta(prev.myMeta);
      if (prev.partnerMeta) setPartnerMeta(prev.partnerMeta);

      setIsLocked(true);
      setSavedState("saved");
      safeLSSet(LOCK_STORAGE_KEY, "1");
      return;
    }

    // 캐시 미스 → 실제 호출(메타 포함)
    await analyzeCompatibility(me, formData, mine, partner, signature);
  };

  // 초기화
  const onReset = () => {
    setFormData({
      ...DEFAULT_VALUES,
      calendar: "solar",
      gender: initialPartnerGender,
      mbti: "",
    });
    setMyPillars(null);
    setPartnerPillars(null);
    setMyMeta(null);
    setPartnerMeta(null);
    setCompatText("");
    setCompatError("");

    setIsLocked(false);
    setSavedState("");
    safeLSSet(LOCK_STORAGE_KEY, "0");
    safeLSRemove(PARTNER_STORAGE_KEY);

    didScrollToApiRef.current = false;
    justSubmittedRef.current = false;
  };

  const calendarOptions = [
    { value: "solar", label: "양력" },
    { value: "lunar", label: "음력" },
  ];
  const genderOptions = [
    { value: "male", label: "남성" },
    { value: "female", label: "여성" },
  ];
  const isLunarSelected = formData.calendar === "lunar";

  if (!hasInput) {
    return (
      <div className="calculator">
        <InputRequiredGuide homeHref="/" />
      </div>
    );
  }

  const showFullLoader = compatLoading;

  // 모달: 페이지 바닥 감시(하루 1회)
  useEffect(() => {
    const markScroll = () => { if (window.pageYOffset > 8) userInteractedRef.current = true; };
    const markWheel  = () => { userInteractedRef.current = true; };
    const markTouch  = () => { userInteractedRef.current = true; };
    const markKey    = (e) => {
      if (['PageDown', 'End', ' ', 'Spacebar'].includes(e.key)) userInteractedRef.current = true;
    };

    window.addEventListener('scroll', markScroll, { passive: true });
    window.addEventListener('wheel',  markWheel,  { passive: true });
    window.addEventListener('touchstart', markTouch, { passive: true });
    window.addEventListener('keydown', markKey);

    const el = bottomSentinelRef.current;
    let observer;
    if (el) {
      observer = new IntersectionObserver(
        (entries) => {
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
              setShareOpen(true);
            }
          }
        },
        { root: null, threshold: [0.99] }
      );
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

  return (
    <>
      <div className="calculator" aria-label="궁합">
        <FullScreenLoader
          show={showFullLoader}
          title="궁합 해석을 준비하고 있어요"
          message="두 사람의 사주 기둥과 메타를 분석하는 중입니다."
        />

        <div className="card result" aria-busy={showFullLoader ? "true" : "false"}>
          <h2>궁합</h2>

          {/* 내정보 요약 바 */}
          {me ? (
            <div
              aria-label="내정보 요약"
              style={{
                marginTop: 8,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                rowGap: 6,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  background: "var(--muted)",
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                내정보
              </span>
              {myInlineFields.map(({ label, value }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && (
                    <span aria-hidden="true" style={{ opacity: 0.35, margin: "0 4px" }}>|</span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{label}</span>
                    <span style={{ fontSize: 15, letterSpacing: "-0.01em" }}>{value}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          ) : null}

          {/* 상대방 정보 폼 — ✅ 홈 폼과 동일한 간격/레이아웃 */}
          <form onSubmit={onSubmit} className="form-compat" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 className="h4" style={{ margin: 0 }}>상대방 정보</h3>
              {isLocked && (savedState === "saved") && (
                <span
                  role="status"
                  aria-live="polite"
                  style={{
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                    color: "var(--ink-strong)",
                  }}
                >
                  저장완료
                </span>
              )}
            </div>

            <fieldset
              disabled={isLocked || compatLoading}
              aria-disabled={isLocked || compatLoading}
              className={(isLocked || compatLoading) ? "fieldset-locked" : undefined}
              style={{ border: 0, padding: 0, margin: 0 }}
            >
              <div className="row cols-2">
                <div className="field-calendar">
                  <SegmentedControl
                    label="달력"
                    options={calendarOptions}
                    value={formData.calendar}
                    onChange={handleCalendarChange}
                    ariaLabel="달력 종류 선택"
                  />
                </div>
                {isLunarSelected && (
                  <div className="field-leap">
                    <Select
                      label="윤달 여부"
                      id="p-leapMonth"
                      options={[
                        { value: "common", label: "평달" },
                        { value: "leap", label: "윤달" },
                      ]}
                      value={formData.leapMonth}
                      onChange={(e) => handleFieldChange("leapMonth", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="row cols-2">
                <div className="field-gender">
                  <SegmentedControl
                    label="성별"
                    options={genderOptions}
                    value={formData.gender}
                    onChange={handleGenderChange}
                    ariaLabel="성별 선택"
                  />
                </div>
                <div className="field-mbti only-desktop">
                  <Select
                    label="MBTI (선택사항)"
                    id="p-mbti-desktop"
                    options={MBTI_TYPES.map((m) => ({ value: m.value, label: m.label }))}
                    value={formData.mbti || ""}
                    onChange={(e) => handleFieldChange("mbti", e.target.value)}
                  />
                </div>
              </div>

              <div className="row cols-4 sm-cols-2" aria-label="생년월일 및 시간 선택">
                <div className="field-year">
                  <Select
                    label="년도"
                    id="p-year"
                    options={yearOptions}
                    value={formData.year}
                    onChange={(e) => handleFieldChange("year", e.target.value)}
                  />
                </div>
                <div className="field-month">
                  <Select
                    label="월"
                    id="p-month"
                    options={monthOptions}
                    value={formData.month}
                    onChange={(e) => handleFieldChange("month", e.target.value)}
                  />
                </div>
                <div className="field-day">
                  <Select
                    label="일"
                    id="p-day"
                    options={dayOptions}
                    value={formData.day}
                    onChange={(e) => handleFieldChange("day", e.target.value)}
                  />
                </div>
                <div className="field-hour">
                  <Select
                    label="시간"
                    id="p-hour"
                    options={hourOptions}   // ✅ 모름 + 00~23시
                    value={formData.hour}
                    onChange={(e) => handleFieldChange("hour", e.target.value)}
                  />
                </div>
              </div>

              {/* 모바일 전용 MBTI — ✅ 여백 통일(인라인 마진 제거) */}
              <div className="row only-mobile">
                <div className="field-mbti">
                  <Select
                    label="MBTI (선택사항)"
                    id="p-mbti-mobile"
                    options={mbtiOptions}
                    value={formData.mbti || ""}
                    onChange={(e) => handleFieldChange("mbti", e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* ✅ 액션 영역 상단 간격 통일 */}
            <div className="actions">
              <Button variant="text" type="button" onClick={onReset}>초기화</Button>
              <Button
                type="submit"
                disabled={isLocked || compatLoading || !partnerReady}
                aria-disabled={isLocked || compatLoading || !partnerReady}
                title={
                  isLocked ? "이전 결과가 저장되었습니다. 초기화를 누르면 해제됩니다."
                  : (!partnerReady ? "필수 정보를 먼저 입력하세요." : undefined)
                }
              >
                {compatLoading ? "분석 중…" : (isLocked ? "저장완료" : "궁합 보기")}
              </Button>
            </div>
          </form>

          {(myPillars || partnerPillars) && (
            <div className="row cols-2 sm-cols-1" style={{ marginTop: 16 }}>
              <section style={{ display: "grid", gap: 8 }}>
                {/* ⬇️ 스크롤 타겟 */}
                <h3 id="compat-my-header" className="h4" style={{ margin: 0 }}>내 사주 기둥</h3>
                {myPillars ? (
                  <PillarDisplay pillars={myPillars} idPrefix="my" />
                ) : (
                  <p className="muted" style={{ margin: 0 }}>내 정보가 없어 표시할 수 없습니다.</p>
                )}
              </section>

              <section style={{ display: "grid", gap: 8 }}>
                <h3 className="h4" style={{ margin: 0 }}>상대방 사주 기둥</h3>
                {partnerPillars ? (
                  <PillarDisplay pillars={partnerPillars} idPrefix="partner" />
                ) : (
                  <p className="muted" style={{ margin: 0 }}>상대방 정보를 먼저 입력해 주세요.</p>
                )}
              </section>
            </div>
          )}

          {(myPillars && partnerPillars) && (
            <section style={{ display: "grid", gap: 8, marginTop: 16 }}>
              <h3 id="compat-analysis-header" className="h4" style={{ margin: 0 }}>궁합 풀이</h3>
              {!compatLoading && (
                <AIFortune content={compatText} isLoading={false} error={compatError} />
              )}
            </section>
          )}
        </div>
      </div>

      {/* 바닥 센티넬 (하루 1회 모달) */}
      <div ref={bottomSentinelRef} aria-hidden style={{ height: 1 }} />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        pageTitle="궁합"
        shareText="궁합 결과가 도움이 되셨다면 지인과 공유해 보세요."
      />

      {/* ✅ 홈 입력폼과 동일한 간격/레이아웃 스타일 */}
      <style>{`
        :root{ --row-gap: 14px; --col-gap: 12px; }

        .form-compat .row{
          display: grid;
          gap: var(--row-gap) var(--col-gap);
          margin: 0;
        }
        .form-compat .row + .row{
          margin-top: var(--row-gap);
        }
        .form-compat .row > [class^="field-"]{
          margin: 0;
        }

        .form-compat .actions{
          margin-top: var(--row-gap);
          display: flex;
          gap: 10px;
        }

        /* 홈 폼과 동일: 락 시 포인터 차단 */
        .fieldset-locked { opacity: 0.98; }
        .fieldset-locked * {
          pointer-events: none !important;
          cursor: not-allowed !important;
        }
      `}</style>
    </>
  );
}
