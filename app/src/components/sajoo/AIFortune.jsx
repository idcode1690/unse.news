// app/src/components/sajoo/AIFortune.jsx
import React from 'react';

/**
 * 가벼운 Markdown → HTML 렌더러
 * - 지원: #, ##, ###, 굵게(**), 기울임(*), 인라인코드(`), 구분선(---),
 *        블록인용(>), 글머리(-/*), 번호목록(1.), 링크([t](url))
 * - 보안: 사용자 텍스트는 escapeHtml로 이스케이프하고, 우리가 만든 태그만 출력
 * - 디자인: 기존 .ai-fortune / .content 스타일을 그대로 사용(추가 스타일 최소화)
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormat(s) {
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, text, url) =>
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function mdToHtml(md) {
  if (!md) return '';
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let html = '';

  const takeWhile = (fn) => {
    const buf = [];
    while (i < lines.length && fn(lines[i])) buf.push(lines[i++]);
    return buf;
  };

  const flushParagraph = (buf) => {
    const raw = buf.join('\n').trim();
    if (!raw) return;
    const parts = raw.split(/\n{2,}/).map((p) => `<p>${inlineFormat(escapeHtml(p))}</p>`);
    html += parts.join('');
  };

  while (i < lines.length) {
    const line = lines[i];

    // hr
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      i++;
      html += `<hr/>`;
      continue;
    }

    // headings (#,##,###) → 원본 그대로 (레벨 유지)
    const h = line.match(/^\s*(#{1,3})\s+(.+)$/);
    if (h) {
      i++;
      const level = h[1].length; // 1~3
      const raw = h[2].trim();
      const text = inlineFormat(escapeHtml(raw));
      html += `<h${level + 1}>${text}</h${level + 1}>`; // h2~h4 (페이지 h1 보호)
      continue;
    }

    // blockquote
    if (/^\s*>/.test(line)) {
      const block = takeWhile((ln) => /^\s*>/.test(ln))
        .map((ln) => ln.replace(/^\s*>\s?/, ''))
        .join('\n');
      const parts = block.split(/\n{2,}/).map((p) => `<p>${inlineFormat(escapeHtml(p))}</p>`);
      html += `<blockquote>${parts.join('')}</blockquote>`;
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = takeWhile((ln) => /^\s*\d+\.\s+/.test(ln))
        .map((ln) => ln.replace(/^\s*\d+\.\s+/, ''))
        .map((x) => `<li>${inlineFormat(escapeHtml(x))}</li>`)
        .join('');
      html += `<ol>${items}</ol>`;
      continue;
    }

    // unordered list (-, *, •)
    if (/^\s*([-*•])\s+/.test(line)) {
      const items = takeWhile((ln) => /^\s*([-*•])\s+/.test(ln))
        .map((ln) => ln.replace(/^\s*([-*•])\s+/, ''))
        .map((x) => `<li>${inlineFormat(escapeHtml(x))}</li>`)
        .join('');
      html += `<ul>${items}</ul>`;
      continue;
    }

    // paragraph (collect until blank line)
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i])) buf.push(lines[i++]);
    flushParagraph(buf);
    while (i < lines.length && /^\s*$/.test(lines[i])) i++; // skip blank lines
  }

  return html;
}

/* 🎨 가벼운 SVG 로더 */
const LoadingArt = () => (
  <div className="ai-loading" role="img" aria-label="로딩 중">
    <svg className="ai-spinner" width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a84ff"/>
          <stop offset="50%" stopColor="#7a5af8"/>
          <stop offset="100%" stopColor="#0fa958"/>
        </linearGradient>
      </defs>

      <circle cx="48" cy="48" r="32" fill="none" stroke="url(#aiGrad)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray="160 60">
        <animate attributeName="stroke-dashoffset" from="0" to="-440" dur="1.2s" repeatCount="indefinite" />
      </circle>

      <circle cx="48" cy="48" r="24" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="2" strokeDasharray="4 6">
        <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur="6s" repeatCount="indefinite" />
      </circle>

      <g transform="translate(48,48)">
        <circle cx="0" cy="-24" r="3.2" fill="rgba(10,132,255,.85)">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="r" values="3.2;5;3.2" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>

      <g transform="translate(48,48)">
        <circle cx="0" cy="18" r="2.8" fill="rgba(122,90,248,.9)">
          <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="r" values="2.8;4;2.8" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
    <style>{`
      .ai-loading { display:grid; place-items:center; padding:10px 0 6px; }
      .ai-spinner { filter: drop-shadow(0 4px 18px rgba(122,90,248,.25)); }
      @media (prefers-reduced-motion: reduce){
        .ai-spinner animate, .ai-spinner animateTransform { display:none; }
      }
    `}</style>
  </div>
);

const AIFortune = ({ content, isLoading, error }) => {
  // 로딩 상태: 고정된 제목/항목 없이 심플하게
  if (isLoading) {
    return (
      <div className="ai-fortune ai-fortune--loading">
        <div className="fortune-shell">
          <LoadingArt />
          <p className="fortune-hint" aria-live="polite">AI가 오늘의 사주 흐름을 정리하고 있습니다…</p>
        </div>
      </div>
    );
  }

  // 오류 상태: 제목 없이 메시지만
  if (error) {
    return (
      <div className="ai-fortune ai-fortune--error" role="alert">
        <div className="fortune-shell fortune-shell--error">
          <h3>풀이 생성 실패</h3>
          <p className="fortune-error-msg">{String(error)}</p>
          <p className="fortune-error-hint">잠시 후 다시 시도하거나 네트워크 / 키 설정을 확인해주세요.</p>
        </div>
      </div>
    );
  }

  if (!content) return null;

  // ✅ 고정 소제목/항목 "모두 제거": 입력 마크다운을 가공 없이 그대로 렌더
  const html = mdToHtml(content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'AI 사주 풀이',
    author: { '@type': 'Person', name: 'AI Fortune' },
    datePublished: new Date().toISOString(),
    articleSection: 'Horoscope',
    inLanguage: 'ko',
  };

  return (
    <div className="ai-fortune ai-fortune--ready">
      <article className="fortune-article" itemScope itemType="https://schema.org/Article">
        <div itemProp="articleBody" className="fortune-body" dangerouslySetInnerHTML={{ __html: html }} />
        <meta itemProp="author" content="AI Fortune" />
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
};

export default AIFortune;

/* 스타일: 컴포넌트 하단에 인라인 정의 (CSS 파일 이동 가능) */
const fortuneStyles = `
  .ai-fortune { position: relative; margin-top: 14px; }
  .fortune-shell { display:grid; place-items:center; padding:32px 20px; border:1px solid var(--border); border-radius:18px; background:var(--muted); box-shadow:var(--shadow); }
  .fortune-hint { margin:12px 0 0; font-size:14px; color:var(--ink-soft); }
  .fortune-shell--error { background: var(--muted); border-color:#ffb4b4; }
  .fortune-shell--error h3 { margin:0 0 6px; font-size:16px; font-weight:700; letter-spacing:-.5px; }
  .fortune-error-msg { margin:4px 0 8px; white-space:pre-wrap; color:#b91c1c; font-size:13px; }
  .fortune-error-hint { margin:0; font-size:12px; color:var(--ink-soft); }

  /* 본문 */
  .fortune-article { padding: 24px 22px 30px; border:1px solid var(--border); border-radius:20px; background:var(--surface); line-height:1.78; position:relative; box-shadow:var(--shadow); }

  .fortune-body h2, .fortune-body h3, .fortune-body h4 { position:relative; font-weight:700; letter-spacing:-.5px; line-height:1.3; margin:28px 0 12px; }
  .fortune-body h2:first-child, .fortune-body h3:first-child { margin-top:4px; }
  .fortune-body h2 { font-size:20px; }
  .fortune-body h3 { font-size:18px; }
  .fortune-body h4 { font-size:16px; }
  .fortune-body h2:before, .fortune-body h3:before, .fortune-body h4:before { content:''; position:absolute; left:-14px; top:4px; width:4px; height:70%; border-radius:2px; background:linear-gradient(180deg,#7a5af8,#0fa958); box-shadow:0 0 0 3px rgba(122,90,248,.15); }
  @media (max-width:640px){ .fortune-body h2:before, .fortune-body h3:before, .fortune-body h4:before { left:-10px; } }

  .fortune-body p { margin:12px 0; font-size:14.5px; color:var(--ink); }
  .fortune-body p + p { margin-top:14px; }

  .fortune-body strong { color:var(--accent); font-weight:600; }
  .fortune-body em { color:#0fa958; font-style:normal; font-weight:500; }

  .fortune-body ul, .fortune-body ol { padding-left:20px; margin:10px 0 18px; }
  .fortune-body li { margin:4px 0; line-height:1.6; }
  .fortune-body li::marker { color:var(--accent); }

  .fortune-body code { font-size:12.5px; background:var(--muted); color:var(--ink); padding:2px 6px; border-radius:6px; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; }

  .fortune-body blockquote { margin:18px 0; padding:12px 16px 12px 18px; border-left:4px solid var(--accent); background:var(--muted); border-radius:10px; font-size:14px; color:var(--ink-soft); }
  .fortune-body blockquote p { margin:6px 0; }

  .fortune-body hr { border:none; height:1px; background:linear-gradient(90deg,#d4dae2,#ffffff); margin:30px 0; position:relative; }
  .fortune-body hr:after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,rgba(122,90,248,.35),rgba(15,169,88,.35)); mix-blend-mode:overlay; opacity:.35; }
  @media (prefers-color-scheme: dark){ .fortune-body hr { background:#243140; } }

  .fortune-body a { color:var(--accent); text-decoration:none; font-weight:500; }
  .fortune-body a:hover { text-decoration:underline; }

  .ai-fortune--ready { animation: fortune-fade .5s ease; }
  @keyframes fortune-fade { from { opacity:.0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @media (prefers-reduced-motion: reduce){ .ai-fortune--ready { animation:none; } }
`;

if (typeof document !== 'undefined') {
  const EXISTING = document.getElementById('fortune-styles');
  if (!EXISTING) {
    const el = document.createElement('style');
    el.id = 'fortune-styles';
    el.textContent = fortuneStyles;
    document.head.appendChild(el);
  }
}
