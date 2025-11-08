// app/src/utils/seo.jsx
export const BRAND = "운세뉴스";

// 기본 사이트 URL: 환경변수 → 브라우저 origin → 마지막 안전 기본값
export const SITE =
  (import.meta?.env?.VITE_SITE_URL && String(import.meta.env.VITE_SITE_URL)) ||
  (typeof window !== "undefined" ? window.location.origin : "https://unse.news");

// 페이지별 기본 프리셋(타이틀/설명/이미지)
// - setSEO 호출 시 title/description/image를 넘기면 프리셋보다 우선합니다.
// - 넘기지 않으면 경로 기반 프리셋이 사용됩니다.
const SEO_PRESETS = {
  "/": {
    title: "홈",
    description:
      "사주팔자, 오늘의 운세, 궁합, 로또 추천을 한 곳에서. 생년월일/시간 입력만으로 간단하게 확인하세요.",
    image: "/og-image.png",
  },
  "/result": {
    title: "사주 결과",
    description:
      "출생 정보를 기반으로 사주팔자를 계산하고 연·월·일·시 4주를 자세히 풀이합니다.",
    image: "/og-image.png",
  },
  "/fortune": {
    title: "오늘의 운세",
    description:
      "오늘의 흐름을 사주 기둥과 일진 관점에서 간단히 확인해 보세요.",
    image: "/og-image.png",
  },
  "/compat": {
    title: "궁합",
    description:
      "상생·상극 밸런스와 소통 포인트를 사주 기둥 기반으로 확인하세요.",
    image: "/og-image.png",
  },
  "/lotto": {
    title: "로또 추천",
    description:
      "사주 기반 알고리즘으로 개인화된 로또 번호 추천을 받아보세요.",
    image: "/og-image.png",
  },
  "/ask": {
    title: "질문 풀이",
    description:
      "자유 질문을 보내면 사주 관점에서 핵심만 풀어드립니다.",
    image: "/og-image.png",
  },
};

// '#/result' 같이 들어와도 항상 '/result'로 정규화
function normalizePath(p) {
  if (!p) return "/";
  if (typeof p !== "string") return "/";
  if (p.startsWith("#/")) return p.slice(1);
  if (p[0] !== "/") return "/" + p;
  // 쿼리/해시는 제거해 canonical과 프리셋 매칭을 안정화
  try {
    const u = new URL(p, "https://x.example");
    return u.pathname || "/";
  } catch {
    // 간단히 해시/쿼리만 제거
    return p.split("?")[0].split("#")[0] || "/";
  }
}

function upsert(tag, attr) {
  const sel = Object.entries(attr)
    .map(([k, v]) => `[${k}="${v}"]`)
    .join("");
  let el = document.head.querySelector(`${tag}${sel}`);
  if (!el) {
    el = document.createElement(tag);
    Object.entries(attr).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  return el;
}

function pickPreset(path) {
  const p = normalizePath(path);
  if (SEO_PRESETS[p]) return SEO_PRESETS[p];
  // 동적 경로가 있다면 상위 depth로 폴백 (예: /compat/123 → /compat)
  const parts = p.split("/").filter(Boolean);
  while (parts.length > 0) {
    const probe = "/" + parts.join("/");
    if (SEO_PRESETS[probe]) return SEO_PRESETS[probe];
    parts.pop();
  }
  return SEO_PRESETS["/"]; // 최종 폴백: 홈
}

/**
 * setSEO
 * - title/description/image가 없으면 경로 프리셋으로 채웁니다.
 * - SPA에서도 페이지 이동마다 name="description"을 반드시 갱신합니다.
 * - canonical, og, twitter 메타를 모두 업데이트합니다.
 */
export function setSEO({ title, description, path = "/", image = "/og-image.png" }) {
  const p = normalizePath(path);
  const preset = pickPreset(p);

  const useTitle = title || preset.title || BRAND;
  const useDesc = description != null ? description : (preset.description || "");
  const useImage = image || preset.image || "/og-image.png";

  const finalTitle = useTitle ? `${useTitle} | ${BRAND}` : BRAND;

  // 유효한 절대 URL 생성
  let url = SITE;
  try {
    url = new URL(p, SITE).toString();
  } catch {
    try {
      url = new URL(p, window.location.href).toString();
    } catch {
      url = SITE;
    }
  }

  // 문서 타이틀
  document.title = finalTitle;

  // ✅ 페이지별 메타 설명 갱신 (검색 스니펫에 직접 반영되는 태그)
  upsert("meta", { name: "description" }).setAttribute("content", useDesc);

  // Canonical
  upsert("link", { rel: "canonical" }).setAttribute("href", url);

  // Open Graph
  upsert("meta", { property: "og:title" }).setAttribute("content", finalTitle);
  upsert("meta", { property: "og:description" }).setAttribute("content", useDesc);
  upsert("meta", { property: "og:type" }).setAttribute("content", "website");
  upsert("meta", { property: "og:url" }).setAttribute("content", url);
  upsert("meta", { property: "og:image" }).setAttribute("content", useImage);
  upsert("meta", { property: "og:site_name" }).setAttribute("content", BRAND);
  // 선택: 로케일을 페이지 공통으로 지정 (필요 없으면 제거 가능)
  upsert("meta", { property: "og:locale" }).setAttribute("content", "ko_KR");

  // Twitter
  upsert("meta", { name: "twitter:card" }).setAttribute("content", "summary_large_image");
  upsert("meta", { name: "twitter:title" }).setAttribute("content", finalTitle);
  upsert("meta", { name: "twitter:description" }).setAttribute("content", useDesc);
  upsert("meta", { name: "twitter:image" }).setAttribute("content", useImage);
}
