import{j as n,r as x}from"./index-j3GZsSL5.js";function b(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function j(e){return e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(t,r,i)=>`<a href="${b(i)}" target="_blank" rel="noopener noreferrer">${b(r)}</a>`),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e}function U(e){return String(e).toLowerCase().replace(/[^\w가-힣]+/g,"")}function J(e){if(!e)return"";const t=String(e).replace(/\r\n/g,`
`).split(`
`);let r=0,i="",a=null;const o=u=>{const h=[];for(;r<t.length&&u(t[r]);)h.push(t[r++]);return h},p=u=>{const h=u.join(`
`).trim();if(!h)return;const d=h.split(/\n{2,}/).map(f=>`<p>${j(b(f))}</p>`);i+=d.join("")};for(;r<t.length;){const u=t[r];if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(u)){r++,i+="<hr/>";continue}const h=u.match(/^\s*(#{1,3})\s+(.+)$/);if(h){r++;const f=h[1].length,s=h[2].trim(),l=U(s);if(l&&l===a)continue;a=l;const m=j(b(s));i+=`<h${f+1}>${m}</h${f+1}>`;continue}if(/^\s*>/.test(u)){const s=o(l=>/^\s*>/.test(l)).map(l=>l.replace(/^\s*>\s?/,"")).join(`
`).split(/\n{2,}/).map(l=>`<p>${j(b(l))}</p>`);i+=`<blockquote>${s.join("")}</blockquote>`;continue}if(/^\s*\d+\.\s+/.test(u)){const f=o(s=>/^\s*\d+\.\s+/.test(s)).map(s=>s.replace(/^\s*\d+\.\s+/,"")).map(s=>`<li>${j(b(s))}</li>`).join("");i+=`<ol>${f}</ol>`;continue}if(/^\s*([-*•])\s+/.test(u)){const f=o(s=>/^\s*([-*•])\s+/.test(s)).map(s=>s.replace(/^\s*([-*•])\s+/,"")).map(s=>`<li>${j(b(s))}</li>`).join("");i+=`<ul>${f}</ul>`;continue}const d=[];for(;r<t.length&&!/^\s*$/.test(t[r]);)d.push(t[r++]);for(p(d);r<t.length&&/^\s*$/.test(t[r]);)r++}return i}const B=()=>n.jsxs("div",{className:"ai-loading",role:"img","aria-label":"로딩 중",children:[n.jsxs("svg",{className:"ai-spinner",width:"96",height:"96",viewBox:"0 0 96 96",xmlns:"http://www.w3.org/2000/svg",children:[n.jsx("defs",{children:n.jsxs("linearGradient",{id:"aiGrad",x1:"0",y1:"0",x2:"1",y2:"1",children:[n.jsx("stop",{offset:"0%",stopColor:"#0a84ff"}),n.jsx("stop",{offset:"50%",stopColor:"#7a5af8"}),n.jsx("stop",{offset:"100%",stopColor:"#0fa958"})]})}),n.jsx("circle",{cx:"48",cy:"48",r:"32",fill:"none",stroke:"url(#aiGrad)",strokeWidth:"4",strokeLinecap:"round",strokeDasharray:"160 60",children:n.jsx("animate",{attributeName:"stroke-dashoffset",from:"0",to:"-440",dur:"1.2s",repeatCount:"indefinite"})}),n.jsx("circle",{cx:"48",cy:"48",r:"24",fill:"none",stroke:"rgba(0,0,0,.08)",strokeWidth:"2",strokeDasharray:"4 6",children:n.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0 48 48",to:"360 48 48",dur:"6s",repeatCount:"indefinite"})}),n.jsx("g",{transform:"translate(48,48)",children:n.jsxs("circle",{cx:"0",cy:"-24",r:"3.2",fill:"rgba(10,132,255,.85)",children:[n.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0",to:"360",dur:"1.6s",repeatCount:"indefinite"}),n.jsx("animate",{attributeName:"r",values:"3.2;5;3.2",dur:"1.6s",repeatCount:"indefinite"})]})}),n.jsx("g",{transform:"translate(48,48)",children:n.jsxs("circle",{cx:"0",cy:"18",r:"2.8",fill:"rgba(122,90,248,.9)",children:[n.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"360",to:"0",dur:"2.4s",repeatCount:"indefinite"}),n.jsx("animate",{attributeName:"r",values:"2.8;4;2.8",dur:"2.4s",repeatCount:"indefinite"})]})})]}),n.jsx("style",{children:`
      .ai-loading { display:grid; place-items:center; padding:10px 0 6px; }
      .ai-spinner { filter: drop-shadow(0 4px 18px rgba(122,90,248,.25)); }
      @media (prefers-reduced-motion: reduce){
        .ai-spinner animate, .ai-spinner animateTransform { display:none; }
      }
    `})]});function T(){try{const e=typeof window<"u"&&(window.location.hash||window.location.pathname)||""||"";return/compat/i.test(e)?"compat":/fortune|today/i.test(e)?"fortune":"saju"}catch{return"saju"}}const E={saju:["총평","초년운","청년운","중년운","말년운","재물운","애정운"],fortune:["총평","금전","관계","업무","건강·컨디션","시간대·팁","주의 포인트"],compat:["총평","소통 스타일","갈등 패턴","정서적 필요","생활 리듬","신뢰·약속","성장 포인트","주의 시기"]};function H(e){if(!e)return!1;const t=String(e).split(`
`);let r=0;for(const i of t){if(/^\s*#{1,3}\s+/.test(i)){r++;continue}if(/^\s*\d+\.\s+/.test(i)){r++;continue}if(/^\s*(총평|초년운|청년운|중년운|말년운|재물운|애정운|금전|관계|업무|건강|시간대|주의)\s*[:：]/.test(i)){r++;continue}}return r>=3}function G(e){const t=String(e||"").trim();let r=t.split(/\n{2,}/).map(i=>i.trim()).filter(Boolean);if(r.length<=2){const i=t.split(/\n\s*[-*•]\s+/).map(a=>a.trim()).filter(Boolean);i.length>r.length&&(r=i)}if(r.length<=2){const i=t.split(new RegExp("(?<=[.!?…]|다\\.|요\\.)\\s+")).map(a=>a.trim()).filter(Boolean);if(i.length>r.length){const a=[];for(let o=0;o<i.length;o+=4)a.push(i.slice(o,o+4).join(" "));a.length&&(r=a)}}return r}function q(e,t=T()){if(!e||H(e))return e;const r=E[t]||E.saju,i=G(e),a=[];for(let o=0;o<r.length;o++){const p=r[o],u=i[o]||o===0&&i[0]||"";u&&a.push(`### ${p}

${u}`)}if(i.length>r.length){const o=i.slice(r.length).join(`

`);o.trim()&&a.push(`### 추가 내용

${o}`)}return a.join(`

`)}const re=({content:e,isLoading:t,error:r})=>{if(t)return n.jsxs("div",{className:"ai-fortune",children:[n.jsx("h3",{children:"🔮 정확한 천문계산 기반 AI 사주 운세 풀이"}),n.jsxs("div",{className:"content",children:[n.jsx(B,{}),n.jsx("p",{children:"AI가 사주를 분석하고 있습니다..."})]}),n.jsx("style",{children:`
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
        `})]});if(!e)return null;const i=q(e,T()),a=J(i),o={"@context":"https://schema.org","@type":"Article",headline:"AI 사주 풀이",author:{"@type":"Person",name:"AI Fortune"},datePublished:new Date().toISOString(),articleSection:"Horoscope",inLanguage:"ko"};return n.jsxs("div",{className:"ai-fortune",children:[n.jsx("h3",{children:"🔮 정확한 천문계산 기반 AI 사주 운세 풀이"}),n.jsxs("article",{className:"content",itemScope:!0,itemType:"https://schema.org/Article",children:[n.jsx("div",{itemProp:"articleBody",dangerouslySetInnerHTML:{__html:a}}),n.jsx("meta",{itemProp:"author",content:"AI Fortune"})]}),n.jsx("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(o)}}),n.jsx("style",{children:`
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
      `})]})};function ie({show:e=!1,title:t="준비 중입니다…",message:r="조금만 기다려 주세요.",respectReducedMotion:i=!0,forceHaptics:a=!1}){const o=typeof navigator<"u"&&typeof navigator.vibrate=="function",[p,u]=x.useState(!1);x.useEffect(()=>{if(i)try{const c=window.matchMedia("(prefers-reduced-motion: reduce)"),v=()=>u(!!c.matches);return v(),c.addEventListener?c.addEventListener("change",v):c.addListener(v),()=>{c.removeEventListener?c.removeEventListener("change",v):c.removeListener(v)}}catch{}},[i]);const h=x.useMemo(()=>{try{return a||navigator?.maxTouchPoints>0||window.matchMedia&&window.matchMedia("(hover: none) and (pointer: coarse)").matches}catch{return!!a}},[a]),[d,f]=x.useState(!1),s=()=>{try{const c=navigator.userActivation;return!!(c?.isActive||c?.hasBeenActive)}catch{return!1}};x.useEffect(()=>{e&&s()&&queueMicrotask(()=>f(!0))},[e]),x.useEffect(()=>{if(!e||d)return;const c=()=>{f(!0)};return window.addEventListener("pointerdown",c,{capture:!0,passive:!0}),window.addEventListener("keydown",c,{capture:!0}),window.addEventListener("touchstart",c,{capture:!0,passive:!0}),()=>{window.removeEventListener("pointerdown",c,{capture:!0}),window.removeEventListener("keydown",c,{capture:!0}),window.removeEventListener("touchstart",c,{capture:!0})}},[e,d]);const l=x.useRef(null),m=x.useRef(e),g=(c=20)=>{if(!o||!d&&!s()||p&&!a)return!1;try{return navigator.vibrate(c)?!0:Array.isArray(c)?navigator.vibrate(20)||!1:navigator.vibrate([20,30,20])||!1}catch{return!1}},w=()=>{if(l.current&&(clearInterval(l.current),l.current=null),o&&(d||s())&&!(p&&!a))try{navigator.vibrate(0)}catch{}};return x.useEffect(()=>(e&&h&&o&&(d||s())&&!(p&&!a)?(g(20),l.current||(l.current=setInterval(()=>{g(20)},2e3))):w(),m.current&&!e&&(g(0),setTimeout(()=>g([25,35,25]),0)),m.current=e,()=>{w()}),[e,h,o,d,p,a]),x.useEffect(()=>{if(!e)return;const c=()=>{document.visibilityState==="hidden"?w():e&&(d||s())&&(g(20),l.current||(l.current=setInterval(()=>g(20),2e3)))};return document.addEventListener("visibilitychange",c),()=>document.removeEventListener("visibilitychange",c)},[e,d]),x.useEffect(()=>{e&&(o||console.info("[FullScreenLoader] 이 환경은 navigator.vibrate를 지원하지 않습니다(iOS Safari 등)."))},[e,o]),e?n.jsxs("div",{role:"status","aria-live":"polite",className:`fs-loader ${p?"reduce":"animate"}`,children:[n.jsxs("div",{className:"fs-loader__inner",children:[n.jsxs("div",{className:"solarsys",role:"img","aria-label":"로딩 중: 태양계 애니메이션",children:[n.jsx("div",{className:"sun","aria-hidden":"true"}),n.jsx("div",{className:"orbit orbit--1","aria-hidden":"true",children:n.jsx("div",{className:"planet planet--1"})}),n.jsx("div",{className:"orbit orbit--2","aria-hidden":"true",children:n.jsx("div",{className:"planet planet--2"})}),n.jsx("div",{className:"orbit orbit--3","aria-hidden":"true",children:n.jsx("div",{className:"planet planet--3"})})]}),n.jsx("h3",{className:"fs-loader__title",children:t}),n.jsx("p",{className:"fs-loader__msg",children:r}),n.jsx("span",{style:{marginTop:2,fontSize:11,opacity:.45,userSelect:"none",display:"block"},children:o?d||s()?"진동 활성화됨":"화면을 한 번 터치하면 진동이 켜집니다":"이 기기는 진동 미지원"})]}),n.jsx("style",{children:`
        .fs-loader { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 9999;
          display: grid; place-items: center; background: rgba(250,250,252,.88); backdrop-filter: blur(4px);
          contain: layout style paint; }
        @media (prefers-color-scheme: dark){ .fs-loader { background: rgba(11,15,25,.72); } }

        .fs-loader__inner { display: grid; justify-items: center; gap: 14px; padding: 24px 28px; border-radius: 16px;
          background: var(--surface,#fff); border: 1px solid var(--border,#e5e7eb);
          box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 18px 50px rgba(0,0,0,.10);
          text-align: center; max-width: min(88vw,520px); transform: translateZ(0); will-change: transform; }
        @media (prefers-color-scheme: dark){ .fs-loader__inner { background: #0b0f19; border-color: #253041; } }

        .fs-loader__title { margin: 2px 0 0; font-size: clamp(18px,2.2vw,20px); font-weight: 800;
          letter-spacing: -0.01em; color: var(--ink-strong,#111827); }
        .fs-loader__msg { margin: 0; font-size: 14px; color: var(--ink-soft,#6b7280); }
        @media (prefers-color-scheme: dark){
          .fs-loader__title { color: #e5e7eb; }
          .fs-loader__msg { color: #9aa4b2; }
        }

        .solarsys { --size: clamp(84px,16vw,120px); --sun: calc(var(--size)*0.28);
          --o1: calc(var(--size)*0.40); --o2: calc(var(--size)*0.64); --o3: calc(var(--size)*0.84);
          --spin1: 7s; --spin2: 11s; --spin3: 16s; --pulse: 2.6s;
          position: relative; width: var(--size); height: var(--size);
          display: grid; place-items: center; user-select: none; pointer-events: none;
          transform: translateZ(0); will-change: transform; }
        .fs-loader.reduce .solarsys { --spin1: 11s; --spin2: 16s; --spin3: 24s; --pulse: 4.2s; }

        .solarsys .sun { width: var(--sun); height: var(--sun); border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffd166 0%, #fca311 45%, #f59e0b 60%, #ef7f00 100%);
          box-shadow: 0 0 12px 4px rgba(255,184,0,.35), 0 0 40px 8px rgba(255,184,0,.20);
          animation: sun-pulse var(--pulse) ease-in-out infinite; }

        .solarsys .orbit { position: absolute; display: grid; place-items: center; border-radius: 50%;
          border: 1px dashed rgba(125,130,155,.25); }
        .solarsys .orbit--1 { width: var(--o1); height: var(--o1); animation: spin var(--spin1) linear infinite; }
        .solarsys .orbit--2 { width: var(--o2); height: var(--o2); animation: spin var(--spin2) linear infinite reverse; }
        .solarsys .orbit--3 { width: var(--o3); height: var(--o3); animation: spin var(--spin3) linear infinite; }

        .solarsys .planet { position: absolute; top: 0; transform: translateY(-50%); border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,.12); }
        .solarsys .planet--1 { width: calc(var(--size)*0.08); height: calc(var(--size)*0.08);
          background: radial-gradient(circle at 35% 35%, #9ae6b4 0%, #22c55e 70%); }
        .solarsys .planet--2 { width: calc(var(--size)*0.10); height: calc(var(--size)*0.10);
          background: radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 70%); }
        .solarsys .planet--3 { width: calc(var(--size)*0.12); height: calc(var(--size)*0.12);
          background: radial-gradient(circle at 35% 35%, #fca5a5 0%, #ef4444 70%); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes sun-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `})]}):null}const O=typeof navigator<"u"&&typeof navigator.vibrate=="function";function C(){try{const e=navigator.userActivation;return!!(e?.isActive||e?.hasBeenActive)}catch{return!1}}function A(e=20){if(!O||!C())return!1;try{return navigator.vibrate(e)?!0:Array.isArray(e)?navigator.vibrate(20)||!1:navigator.vibrate([20,35,20])||!1}catch{return!1}}function z(){if(O&&C())try{navigator.vibrate(0)}catch{}}function V(){A(20)}function I(){z(),A(30)}function $(){z(),A([25,40,25])}const M=!1,W="https://cool-shape-9570.idcode1690.workers.dev",Y=typeof location<"u"&&/github\.io|workers\.dev|vercel\.app|netlify\.app|unse\.news/i.test(location.host),N=M&&!Y?"/api/ai":`${W}/chat`;try{console.info("[openaiService] endpoint:",N,"mode=","production","dev=",M)}catch{}const R="ai_cache_v1:",S=new Map,_=60*1e3,D=60*_,y=24*D;function F(){return Date.now()+9*D}function Z(){const e=F(),t=y-e%y;return t>0?t:_}function X(){const e=F(),r=new Date(e).getUTCDay(),i=e-e%y,a=(7-r)%7,p=i+(a===0?7:a)*y-e;return p>0?p:_}function P(e){const t=String(e||"").toUpperCase();return t.includes("TODAY")?Z():t.includes("SAJU")?365*y:t.includes("COMPAT")?30*y:t.includes("LOTTO")?X():30*y}function Q(e){try{return localStorage.getItem(e)}catch{return null}}function K(e,t){try{localStorage.setItem(e,t)}catch{}}function L(e){try{localStorage.removeItem(e)}catch{}}function ee(e){if(!e)return null;const t=R+e,r=Q(t);if(!r)return null;try{const{value:i,expireAt:a}=JSON.parse(r);return a&&Date.now()<a?String(i??""):(L(t),null)}catch{return L(t),null}}function te(e,t,r){if(!e)return;const i=R+e,a=Date.now()+(r??P(e));K(i,JSON.stringify({value:String(t??""),expireAt:a}))}async function ae({messages:e,cacheKey:t,model:r="gpt-5.1-mini",temperature:i=.1,top_p:a=1,max_tokens:o=1800,seed:p=777}={}){const u=t?ee(t):null;if(u!=null&&u!==""){try{console.debug("[openaiService] cache HIT:",t)}catch{}return u}if(t&&S.has(t)){try{console.debug("[openaiService] inflight dedupe:",t)}catch{}return S.get(t)}const h={model:r,messages:e,cacheKey:t,temperature:i,top_p:a,max_tokens:o,seed:p};try{V()}catch{}const d=async s=>{const l=await fetch(s,{method:"POST",mode:"cors",credentials:"omit",cache:"no-store",headers:{"content-type":"text/plain;charset=UTF-8"},body:JSON.stringify(h),redirect:"follow",referrerPolicy:"no-referrer"}),m=await l.text();if(!l.ok){let v;try{v=JSON.parse(m)}catch{v={error:m}}const k=v?.error?.message||v?.error||m||"Unknown error";throw new Error(`OpenAI API 오류 (${l.status}): ${typeof k=="string"?k:JSON.stringify(k)}`)}let g;try{g=JSON.parse(m)}catch{g=null}const w=g?.choices?.[0]?.message?.content??(g?"":m),c=String(w??"");return t&&c&&te(t,c,P(t)),c},f=(async()=>{try{const s=await d(N);try{I()}catch{}return s}catch(s){if((s?.name==="TypeError"||/Failed to fetch/i.test(String(s?.message||"")))&&N!=="/api/ai")try{console.warn("[openaiService] primary failed, fallback -> /api/ai",s);const m=await d("/api/ai");try{I()}catch{}return m}catch(m){try{$()}catch{}throw m}try{$()}catch{}throw s}})();t&&S.set(t,f);try{return await f}finally{t&&S.delete(t)}}export{re as A,ie as F,ae as c};
