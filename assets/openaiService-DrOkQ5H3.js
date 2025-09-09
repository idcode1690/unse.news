import{j as n,r as g}from"./index-D43ed0fU.js";function y(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function k(e){return e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(t,r,i)=>`<a href="${y(i)}" target="_blank" rel="noopener noreferrer">${y(r)}</a>`),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e}function R(e){return String(e).toLowerCase().replace(/[^\w가-힣]+/g,"")}function P(e){if(!e)return"";const t=String(e).replace(/\r\n/g,`
`).split(`
`);let r=0,i="",s=null;const a=c=>{const u=[];for(;r<t.length&&c(t[r]);)u.push(t[r++]);return u},x=c=>{const u=c.join(`
`).trim();if(!u)return;const p=u.split(/\n{2,}/).map(h=>`<p>${k(y(h))}</p>`);i+=p.join("")};for(;r<t.length;){const c=t[r];if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(c)){r++,i+="<hr/>";continue}const u=c.match(/^\s*(#{1,3})\s+(.+)$/);if(u){r++;const h=u[1].length,o=u[2].trim(),f=R(o);if(f&&f===s)continue;s=f;const d=k(y(o));i+=`<h${h+1}>${d}</h${h+1}>`;continue}if(/^\s*>/.test(c)){const o=a(f=>/^\s*>/.test(f)).map(f=>f.replace(/^\s*>\s?/,"")).join(`
`).split(/\n{2,}/).map(f=>`<p>${k(y(f))}</p>`);i+=`<blockquote>${o.join("")}</blockquote>`;continue}if(/^\s*\d+\.\s+/.test(c)){const h=a(o=>/^\s*\d+\.\s+/.test(o)).map(o=>o.replace(/^\s*\d+\.\s+/,"")).map(o=>`<li>${k(y(o))}</li>`).join("");i+=`<ol>${h}</ol>`;continue}if(/^\s*([-*•])\s+/.test(c)){const h=a(o=>/^\s*([-*•])\s+/.test(o)).map(o=>o.replace(/^\s*([-*•])\s+/,"")).map(o=>`<li>${k(y(o))}</li>`).join("");i+=`<ul>${h}</ul>`;continue}const p=[];for(;r<t.length&&!/^\s*$/.test(t[r]);)p.push(t[r++]);for(x(p);r<t.length&&/^\s*$/.test(t[r]);)r++}return i}const D=()=>n.jsxs("div",{className:"ai-loading",role:"img","aria-label":"로딩 중",children:[n.jsxs("svg",{className:"ai-spinner",width:"96",height:"96",viewBox:"0 0 96 96",xmlns:"http://www.w3.org/2000/svg",children:[n.jsx("defs",{children:n.jsxs("linearGradient",{id:"aiGrad",x1:"0",y1:"0",x2:"1",y2:"1",children:[n.jsx("stop",{offset:"0%",stopColor:"#0a84ff"}),n.jsx("stop",{offset:"50%",stopColor:"#7a5af8"}),n.jsx("stop",{offset:"100%",stopColor:"#0fa958"})]})}),n.jsx("circle",{cx:"48",cy:"48",r:"32",fill:"none",stroke:"url(#aiGrad)",strokeWidth:"4",strokeLinecap:"round",strokeDasharray:"160 60",children:n.jsx("animate",{attributeName:"stroke-dashoffset",from:"0",to:"-440",dur:"1.2s",repeatCount:"indefinite"})}),n.jsx("circle",{cx:"48",cy:"48",r:"24",fill:"none",stroke:"rgba(0,0,0,.08)",strokeWidth:"2",strokeDasharray:"4 6",children:n.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0 48 48",to:"360 48 48",dur:"6s",repeatCount:"indefinite"})}),n.jsx("g",{transform:"translate(48,48)",children:n.jsxs("circle",{cx:"0",cy:"-24",r:"3.2",fill:"rgba(10,132,255,.85)",children:[n.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0",to:"360",dur:"1.6s",repeatCount:"indefinite"}),n.jsx("animate",{attributeName:"r",values:"3.2;5;3.2",dur:"1.6s",repeatCount:"indefinite"})]})}),n.jsx("g",{transform:"translate(48,48)",children:n.jsxs("circle",{cx:"0",cy:"18",r:"2.8",fill:"rgba(122,90,248,.9)",children:[n.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"360",to:"0",dur:"2.4s",repeatCount:"indefinite"}),n.jsx("animate",{attributeName:"r",values:"2.8;4;2.8",dur:"2.4s",repeatCount:"indefinite"})]})})]}),n.jsx("style",{children:`
      .ai-loading { display:grid; place-items:center; padding:10px 0 6px; }
      .ai-spinner { filter: drop-shadow(0 4px 18px rgba(122,90,248,.25)); }
      @media (prefers-reduced-motion: reduce){
        .ai-spinner animate, .ai-spinner animateTransform { display:none; }
      }
    `})]});function $(){try{const e=typeof window<"u"&&(window.location.hash||window.location.pathname)||""||"";return/compat/i.test(e)?"compat":/fortune|today/i.test(e)?"fortune":"saju"}catch{return"saju"}}const L={saju:["총평","초년운","청년운","중년운","말년운","재물운","애정운"],fortune:["총평","금전","관계","업무","건강·컨디션","시간대·팁","주의 포인트"],compat:["총평","소통 스타일","갈등 패턴","정서적 필요","생활 리듬","신뢰·약속","성장 포인트","주의 시기"]};function H(e){if(!e)return!1;const t=String(e).split(`
`);let r=0;for(const i of t){if(/^\s*#{1,3}\s+/.test(i)){r++;continue}if(/^\s*\d+\.\s+/.test(i)){r++;continue}if(/^\s*(총평|초년운|청년운|중년운|말년운|재물운|애정운|금전|관계|업무|건강|시간대|주의)\s*[:：]/.test(i)){r++;continue}}return r>=3}function F(e){const t=String(e||"").trim();let r=t.split(/\n{2,}/).map(i=>i.trim()).filter(Boolean);if(r.length<=2){const i=t.split(/\n\s*[-*•]\s+/).map(s=>s.trim()).filter(Boolean);i.length>r.length&&(r=i)}if(r.length<=2){const i=t.split(new RegExp("(?<=[.!?…]|다\\.|요\\.)\\s+")).map(s=>s.trim()).filter(Boolean);if(i.length>r.length){const s=[];for(let a=0;a<i.length;a+=4)s.push(i.slice(a,a+4).join(" "));s.length&&(r=s)}}return r}function U(e,t=$()){if(!e||H(e))return e;const r=L[t]||L.saju,i=F(e),s=[];for(let a=0;a<r.length;a++){const x=r[a],c=i[a]||a===0&&i[0]||"";c&&s.push(`### ${x}

${c}`)}if(i.length>r.length){const a=i.slice(r.length).join(`

`);a.trim()&&s.push(`### 추가 내용

${a}`)}return s.join(`

`)}const K=({content:e,isLoading:t,error:r})=>{if(t)return n.jsxs("div",{className:"ai-fortune",children:[n.jsx("h3",{children:"🔮 정확한 천문계산 기반 AI 사주 운세 풀이"}),n.jsxs("div",{className:"content",children:[n.jsx(D,{}),n.jsx("p",{children:"AI가 사주를 분석하고 있습니다..."})]}),n.jsx("style",{children:`
          /* 제목/소제목 좌측 정렬 */
          .ai-fortune h3 { text-align: left; }
          .ai-fortune .content h2,
          .ai-fortune .content h3,
          .ai-fortune .content h4 { text-align: left; }
        `})]});if(r)return n.jsxs("div",{className:"ai-fortune",children:[n.jsx("h3",{children:"⚠️ AI 사주 풀이 생성 오류"}),n.jsxs("div",{className:"content",children:[n.jsx("p",{children:"사주 풀이 생성 중 오류가 발생했습니다."}),n.jsxs("p",{children:[n.jsx("strong",{children:"오류 내용:"})," ",String(r)]}),n.jsx("p",{children:"API 키/네트워크 또는 CORS 설정을 확인해주세요."})]}),n.jsx("style",{children:`
          .ai-fortune h3 { text-align: left; }
          .ai-fortune .content h2,
          .ai-fortune .content h3,
          .ai-fortune .content h4 { text-align: left; }
        `})]});if(!e)return null;const i=U(e,$()),s=P(i),a={"@context":"https://schema.org","@type":"Article",headline:"AI 사주 풀이",author:{"@type":"Person",name:"AI Fortune"},datePublished:new Date().toISOString(),articleSection:"Horoscope",inLanguage:"ko"};return n.jsxs("div",{className:"ai-fortune",children:[n.jsx("h3",{children:"🔮 정확한 천문계산 기반 AI 사주 운세 풀이"}),n.jsxs("article",{className:"content",itemScope:!0,itemType:"https://schema.org/Article",children:[n.jsx("div",{itemProp:"articleBody",dangerouslySetInnerHTML:{__html:s}}),n.jsx("meta",{itemProp:"author",content:"AI Fortune"})]}),n.jsx("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(a)}}),n.jsx("style",{children:`
        /* 제목/소제목 좌측 정렬 */
        .ai-fortune h3 { text-align: left; }
        .ai-fortune .content h2,
        .ai-fortune .content h3,
        .ai-fortune .content h4 { text-align: left; }

        /* 우측 여백 제거: 폭 100% + 마진/패딩 해제 */
        .ai-fortune .content {
          max-width: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding-right: 0 !important;
          box-sizing: border-box;
          line-height: 1.85;
          overflow-wrap: anywhere;
        }

        .ai-fortune .content p { margin: 10px 0; }
        .ai-fortune .content ul, 
        .ai-fortune .content ol { margin: 8px 0 8px 18px; }

        .ai-fortune .content a { color: var(--accent, #7a5af8); text-decoration: none; }
        .ai-fortune .content a:hover { text-decoration: underline; }
      `})]})};function ee({show:e=!1,title:t="준비 중입니다…",message:r="조금만 기다려 주세요.",respectReducedMotion:i=!0,forceHaptics:s=!1}){const[a,x]=g.useState(!1);g.useEffect(()=>{if(i)try{const l=window.matchMedia("(prefers-reduced-motion: reduce)"),w=()=>x(!!l.matches);return w(),l.addEventListener?l.addEventListener("change",w):l.addListener(w),()=>{l.removeEventListener?l.removeEventListener("change",w):l.removeListener(w)}}catch{}},[i]);const c=g.useMemo(()=>{try{return s||navigator?.maxTouchPoints>0||window?.matchMedia&&window.matchMedia("(hover: none) and (pointer: coarse)").matches}catch{return s||!1}},[s]),u=typeof navigator<"u"&&"vibrate"in navigator,[p,h]=g.useState(!1),[o,f]=g.useState(()=>!!u),d=l=>{if(!u)return!1;try{return!!navigator.vibrate(l)}catch{return!1}};g.useEffect(()=>{if(!e)return;const l=()=>{d(15)?(h(!0),f(!0),window.removeEventListener("pointerdown",l,{capture:!0}),window.removeEventListener("keydown",l,{capture:!0}),window.removeEventListener("touchstart",l,{capture:!0})):f(!1)};return window.addEventListener("pointerdown",l,{capture:!0}),window.addEventListener("keydown",l,{capture:!0}),window.addEventListener("touchstart",l,{capture:!0}),()=>{window.removeEventListener("pointerdown",l,{capture:!0}),window.removeEventListener("keydown",l,{capture:!0}),window.removeEventListener("touchstart",l,{capture:!0})}},[e]);const m=g.useRef(null),N=g.useRef(e),v=[60,40,60],S=[80,40,80,40,80],b=()=>{m.current&&(clearInterval(m.current),m.current=null),d(0)};return g.useEffect(()=>{if(!e)return;const l=()=>{document.visibilityState==="hidden"?b():c&&!a&&p&&o&&!m.current&&(d(v),m.current=setInterval(()=>d(v),2e3))};return document.addEventListener("visibilitychange",l),()=>document.removeEventListener("visibilitychange",l)},[e,c,a,p,o]),g.useEffect(()=>(e&&c&&!a&&p&&o?(d(v),m.current=setInterval(()=>d(v),2e3)):b(),N.current&&!e&&c&&!a&&p&&o&&(d(0),setTimeout(()=>d(S),0)),N.current=e,()=>b()),[e,c,a,p,o]),g.useEffect(()=>{e&&(c||console.info("[FullScreenLoader] 모바일/터치 환경이 아니어서 진동을 건너뜁니다."),u||console.warn("[FullScreenLoader] navigator.vibrate 미지원(iOS Safari 등). 진동 없이 동작합니다."))},[e,c,u]),e?n.jsxs("div",{role:"status","aria-live":"polite",className:`fs-loader ${a?"reduce":"animate"}`,children:[n.jsxs("div",{className:"fs-loader__inner",children:[n.jsxs("div",{className:"solarsys",role:"img","aria-label":"로딩 중: 태양계 애니메이션",children:[n.jsx("div",{className:"sun","aria-hidden":"true"}),n.jsx("div",{className:"orbit orbit--1","aria-hidden":"true",children:n.jsx("div",{className:"planet planet--1"})}),n.jsx("div",{className:"orbit orbit--2","aria-hidden":"true",children:n.jsx("div",{className:"planet planet--2"})}),n.jsx("div",{className:"orbit orbit--3","aria-hidden":"true",children:n.jsx("div",{className:"planet planet--3"})})]}),n.jsx("h3",{className:"fs-loader__title",children:t}),n.jsx("p",{className:"fs-loader__msg",children:r}),n.jsx("span",{style:{marginTop:2,fontSize:11,opacity:.45,userSelect:"none",display:"block"},children:c?u?p?"진동 활성화됨":"화면을 한 번 터치하면 진동 활성화":"이 기기는 진동 미지원":"모바일 아님"})]}),n.jsx("style",{children:`
        .fs-loader {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
          display: grid;
          place-items: center;
          background: rgba(250, 250, 252, 0.88);
          backdrop-filter: blur(4px);
          contain: layout style paint;
        }
        @media (prefers-color-scheme: dark){
          .fs-loader { background: rgba(11, 15, 25, 0.72); }
        }

        .fs-loader__inner {
          display: grid;
          justify-items: center;
          gap: 14px;
          padding: 24px 28px;
          border-radius: 16px;
          background: var(--surface, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          box-shadow:
            0 1px 2px rgba(0,0,0,.04),
            0 18px 50px rgba(0,0,0,.10);
          text-align: center;
          max-width: min(88vw, 520px);
          transform: translateZ(0);
          will-change: transform;
        }
        @media (prefers-color-scheme: dark){
          .fs-loader__inner {
            background: #0b0f19;
            border-color: #253041;
          }
        }

        .fs-loader__title {
          margin: 2px 0 0;
          font-size: clamp(18px, 2.2vw, 20px);
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--ink-strong, #111827);
        }
        .fs-loader__msg {
          margin: 0;
          font-size: 14px;
          color: var(--ink-soft, #6b7280);
        }
        @media (prefers-color-scheme: dark){
          .fs-loader__title { color: #e5e7eb; }
          .fs-loader__msg { color: #9aa4b2; }
        }

        .solarsys {
          --size: clamp(84px, 16vw, 120px);
          --sun:  calc(var(--size) * 0.28);
          --o1:   calc(var(--size) * 0.40);
          --o2:   calc(var(--size) * 0.64);
          --o3:   calc(var(--size) * 0.84);
          --spin1: 7s;
          --spin2: 11s;
          --spin3: 16s;
          --pulse: 2.6s;

          position: relative;
          width: var(--size);
          height: var(--size);
          display: grid;
          place-items: center;
          user-select: none;
          pointer-events: none;

          transform: translateZ(0);
          will-change: transform;
        }
        .fs-loader.reduce .solarsys {
          --spin1: 11s;
          --spin2: 16s;
          --spin3: 24s;
          --pulse: 4.2s;
        }

        .solarsys .sun {
          width: var(--sun);
          height: var(--sun);
          border-radius: 50%;
          background: radial-gradient( circle at 30% 30%,
            #ffd166 0%,
            #fca311 45%,
            #f59e0b 60%,
            #ef7f00 100%
          );
          box-shadow:
            0 0 12px 4px rgba(255, 184, 0, 0.35),
            0 0 40px 8px rgba(255, 184, 0, 0.20);
          animation: sun-pulse var(--pulse) ease-in-out infinite;
        }

        .solarsys .orbit {
          position: absolute;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px dashed rgba(125, 130, 155, 0.25);
        }
        .solarsys .orbit--1 { width: var(--o1); height: var(--o1); animation: spin var(--spin1) linear infinite; }
        .solarsys .orbit--2 { width: var(--o2); height: var(--o2); animation: spin var(--spin2) linear infinite reverse; }
        .solarsys .orbit--3 { width: var(--o3); height: var(--o3); animation: spin var(--spin3) linear infinite; }

        .solarsys .planet {
          position: absolute;
          top: 0;
          transform: translateY(-50%);
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,.12);
        }
        .solarsys .planet--1 {
          width: calc(var(--size) * 0.08);
          height: calc(var(--size) * 0.08);
          background: radial-gradient(circle at 35% 35%, #9ae6b4 0%, #22c55e 70%);
        }
        .solarsys .planet--2 {
          width: calc(var(--size) * 0.10);
          height: calc(var(--size) * 0.10);
          background: radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 70%);
        }
        .solarsys .planet--3 {
          width: calc(var(--size) * 0.12);
          height: calc(var(--size) * 0.12);
          background: radial-gradient(circle at 35% 35%, #fca5a5 0%, #ef4444 70%);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sun-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
      `})]}):null}const T=!1,J="https://cool-shape-9570.idcode1690.workers.dev",B=typeof location<"u"&&/github\.io|workers\.dev|vercel\.app|netlify\.app|unse\.news/i.test(location.host),_=T&&!B?"/api/ai":`${J}/chat`;try{console.info("[openaiService] endpoint:",_,"mode=","production","dev=",T)}catch{}const C="ai_cache_v1:",E=new Map,I=60*1e3,O=60*I,j=24*O;function z(){return Date.now()+9*O}function G(){const e=z(),t=j-e%j;return t>0?t:I}function q(){const e=z(),r=new Date(e).getUTCDay(),i=e-e%j,s=(7-r)%7,x=i+(s===0?7:s)*j-e;return x>0?x:I}function M(e){const t=String(e||"").toUpperCase();return t.includes("TODAY")?G():t.includes("SAJU")?365*j:t.includes("COMPAT")?30*j:t.includes("LOTTO")?q():30*j}function V(e){try{return localStorage.getItem(e)}catch{return null}}function W(e,t){try{localStorage.setItem(e,t)}catch{}}function A(e){try{localStorage.removeItem(e)}catch{}}function Y(e){if(!e)return null;const t=C+e,r=V(t);if(!r)return null;try{const{value:i,expireAt:s}=JSON.parse(r);return s&&Date.now()<s?String(i??""):(A(t),null)}catch{return A(t),null}}function Z(e,t,r){if(!e)return;const i=C+e,s=Date.now()+(r??M(e));W(i,JSON.stringify({value:String(t??""),expireAt:s}))}async function te({messages:e,cacheKey:t,model:r="gpt-5.1-mini",temperature:i=.1,top_p:s=1,max_tokens:a=1800,seed:x=777}={}){const c=t?Y(t):null;if(c!=null&&c!==""){try{console.debug("[openaiService] cache HIT:",t)}catch{}return c}if(t&&E.has(t)){try{console.debug("[openaiService] inflight dedupe:",t)}catch{}return E.get(t)}const u={model:r,messages:e,cacheKey:t,temperature:i,top_p:s,max_tokens:a,seed:x},p=async o=>{const f=await fetch(o,{method:"POST",mode:"cors",credentials:"omit",cache:"no-store",headers:{"content-type":"text/plain;charset=UTF-8"},body:JSON.stringify(u),redirect:"follow",referrerPolicy:"no-referrer"}),d=await f.text();if(!f.ok){let S;try{S=JSON.parse(d)}catch{S={error:d}}const b=S?.error?.message||S?.error||d||"Unknown error";throw new Error(`OpenAI API 오류 (${f.status}): ${typeof b=="string"?b:JSON.stringify(b)}`)}let m;try{m=JSON.parse(d)}catch{m=null}const N=m?.choices?.[0]?.message?.content??(m?"":d),v=String(N??"");return t&&v&&Z(t,v,M(t)),v},h=(async()=>{try{return await p(_)}catch(o){if((o?.name==="TypeError"||/Failed to fetch/i.test(String(o?.message||"")))&&_!=="/api/ai")try{return console.warn("[openaiService] primary failed, fallback -> /api/ai",o),await p("/api/ai")}catch(d){throw d}throw o}})();t&&E.set(t,h);try{return await h}finally{t&&E.delete(t)}}export{K as A,ee as F,te as c};
