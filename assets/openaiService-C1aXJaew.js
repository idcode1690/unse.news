import{j as t,r as v}from"./index-Ca4uGMNd.js";function b(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function j(e){return e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(r,n,o)=>`<a href="${b(o)}" target="_blank" rel="noopener noreferrer">${b(n)}</a>`),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e}function P(e){if(!e)return"";const r=String(e).replace(/\r\n/g,`
`).split(`
`);let n=0,o="";const a=d=>{const u=[];for(;n<r.length&&d(r[n]);)u.push(r[n++]);return u},f=d=>{const u=d.join(`
`).trim();if(!u)return;const x=u.split(/\n{2,}/).map(c=>`<p>${j(b(c))}</p>`);o+=x.join("")};for(;n<r.length;){const d=r[n];if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(d)){n++,o+="<hr/>";continue}const u=d.match(/^\s*(#{1,3})\s+(.+)$/);if(u){n++;const c=u[1].length,l=u[2].trim(),s=j(b(l));o+=`<h${c+1}>${s}</h${c+1}>`;continue}if(/^\s*>/.test(d)){const l=a(s=>/^\s*>/.test(s)).map(s=>s.replace(/^\s*>\s?/,"")).join(`
`).split(/\n{2,}/).map(s=>`<p>${j(b(s))}</p>`);o+=`<blockquote>${l.join("")}</blockquote>`;continue}if(/^\s*\d+\.\s+/.test(d)){const c=a(l=>/^\s*\d+\.\s+/.test(l)).map(l=>l.replace(/^\s*\d+\.\s+/,"")).map(l=>`<li>${j(b(l))}</li>`).join("");o+=`<ol>${c}</ol>`;continue}if(/^\s*([-*•])\s+/.test(d)){const c=a(l=>/^\s*([-*•])\s+/.test(l)).map(l=>l.replace(/^\s*([-*•])\s+/,"")).map(l=>`<li>${j(b(l))}</li>`).join("");o+=`<ul>${c}</ul>`;continue}const x=[];for(;n<r.length&&!/^\s*$/.test(r[n]);)x.push(r[n++]);for(f(x);n<r.length&&/^\s*$/.test(r[n]);)n++}return o}const F=()=>t.jsxs("div",{className:"ai-loading",role:"img","aria-label":"로딩 중",children:[t.jsxs("svg",{className:"ai-spinner",width:"96",height:"96",viewBox:"0 0 96 96",xmlns:"http://www.w3.org/2000/svg",children:[t.jsx("defs",{children:t.jsxs("linearGradient",{id:"aiGrad",x1:"0",y1:"0",x2:"1",y2:"1",children:[t.jsx("stop",{offset:"0%",stopColor:"#0a84ff"}),t.jsx("stop",{offset:"50%",stopColor:"#7a5af8"}),t.jsx("stop",{offset:"100%",stopColor:"#0fa958"})]})}),t.jsx("circle",{cx:"48",cy:"48",r:"32",fill:"none",stroke:"url(#aiGrad)",strokeWidth:"4",strokeLinecap:"round",strokeDasharray:"160 60",children:t.jsx("animate",{attributeName:"stroke-dashoffset",from:"0",to:"-440",dur:"1.2s",repeatCount:"indefinite"})}),t.jsx("circle",{cx:"48",cy:"48",r:"24",fill:"none",stroke:"rgba(0,0,0,.08)",strokeWidth:"2",strokeDasharray:"4 6",children:t.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0 48 48",to:"360 48 48",dur:"6s",repeatCount:"indefinite"})}),t.jsx("g",{transform:"translate(48,48)",children:t.jsxs("circle",{cx:"0",cy:"-24",r:"3.2",fill:"rgba(10,132,255,.85)",children:[t.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0",to:"360",dur:"1.6s",repeatCount:"indefinite"}),t.jsx("animate",{attributeName:"r",values:"3.2;5;3.2",dur:"1.6s",repeatCount:"indefinite"})]})}),t.jsx("g",{transform:"translate(48,48)",children:t.jsxs("circle",{cx:"0",cy:"18",r:"2.8",fill:"rgba(122,90,248,.9)",children:[t.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"360",to:"0",dur:"2.4s",repeatCount:"indefinite"}),t.jsx("animate",{attributeName:"r",values:"2.8;4;2.8",dur:"2.4s",repeatCount:"indefinite"})]})})]}),t.jsx("style",{children:`
      .ai-loading { display:grid; place-items:center; padding:10px 0 6px; }
      .ai-spinner { filter: drop-shadow(0 4px 18px rgba(122,90,248,.25)); }
      @media (prefers-reduced-motion: reduce){
        .ai-spinner animate, .ai-spinner animateTransform { display:none; }
      }
    `})]}),X=({content:e,isLoading:r,error:n})=>{if(r)return t.jsxs("div",{className:"ai-fortune",children:[t.jsxs("div",{className:"content",children:[t.jsx(F,{}),t.jsx("p",{"aria-live":"polite",children:"AI가 내용을 준비하는 중…"})]}),t.jsx("style",{children:`
          .ai-fortune .content { max-width:none; width:100%; margin:0; padding-right:0; box-sizing:border-box; }
          .ai-fortune .content p { margin: 10px 0; text-align:center; color: var(--ink-soft, #666); }
        `})]});if(n)return t.jsxs("div",{className:"ai-fortune",children:[t.jsxs("div",{className:"content",role:"alert",children:[t.jsx("p",{children:"사주 풀이 생성 중 오류가 발생했습니다."}),t.jsxs("p",{children:[t.jsx("strong",{children:"오류 내용:"})," ",String(n)]}),t.jsx("p",{children:"API 키/네트워크 또는 CORS 설정을 확인해주세요."})]}),t.jsx("style",{children:`
          .ai-fortune .content { max-width:none; width:100%; margin:0; padding-right:0; box-sizing:border-box; }
          .ai-fortune .content p { margin: 8px 0; line-height:1.7; }
        `})]});if(!e)return null;const o=P(e),a={"@context":"https://schema.org","@type":"Article",headline:"AI 사주 풀이",author:{"@type":"Person",name:"AI Fortune"},datePublished:new Date().toISOString(),articleSection:"Horoscope",inLanguage:"ko"};return t.jsxs("div",{className:"ai-fortune",children:[t.jsxs("article",{className:"content",itemScope:!0,itemType:"https://schema.org/Article",children:[t.jsx("div",{itemProp:"articleBody",dangerouslySetInnerHTML:{__html:o}}),t.jsx("meta",{itemProp:"author",content:"AI Fortune"})]}),t.jsx("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(a)}}),t.jsx("style",{children:`
        .ai-fortune .content {
          max-width: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding-right: 0 !important;
          box-sizing: border-box;
          line-height: 1.85;
          overflow-wrap: anywhere;
        }
        .ai-fortune .content h2,
        .ai-fortune .content h3,
        .ai-fortune .content h4 { text-align: left; }
        .ai-fortune .content p { margin: 10px 0; }
        .ai-fortune .content ul, 
        .ai-fortune .content ol { margin: 8px 0 8px 18px; }
        .ai-fortune .content a { color: var(--accent, #7a5af8); text-decoration: none; }
        .ai-fortune .content a:hover { text-decoration: underline; }
      `})]})};function Q({show:e=!1,title:r="준비 중입니다…",message:n="조금만 기다려 주세요.",respectReducedMotion:o=!0,forceHaptics:a=!1}){const f=typeof navigator<"u"&&typeof navigator.vibrate=="function",[d,u]=v.useState(!1);v.useEffect(()=>{if(o)try{const i=window.matchMedia("(prefers-reduced-motion: reduce)"),g=()=>u(!!i.matches);return g(),i.addEventListener?i.addEventListener("change",g):i.addListener(g),()=>{i.removeEventListener?i.removeEventListener("change",g):i.removeListener(g)}}catch{}},[o]);const x=v.useMemo(()=>{try{return a||navigator?.maxTouchPoints>0||window.matchMedia&&window.matchMedia("(hover: none) and (pointer: coarse)").matches}catch{return!!a}},[a]),[c,l]=v.useState(!1),s=()=>{try{const i=navigator.userActivation;return!!(i?.isActive||i?.hasBeenActive)}catch{return!1}};v.useEffect(()=>{e&&s()&&queueMicrotask(()=>l(!0))},[e]),v.useEffect(()=>{if(!e||c)return;const i=()=>{l(!0)};return window.addEventListener("pointerdown",i,{capture:!0,passive:!0}),window.addEventListener("keydown",i,{capture:!0}),window.addEventListener("touchstart",i,{capture:!0,passive:!0}),()=>{window.removeEventListener("pointerdown",i,{capture:!0}),window.removeEventListener("keydown",i,{capture:!0}),window.removeEventListener("touchstart",i,{capture:!0})}},[e,c]);const p=v.useRef(null),h=v.useRef(e),m=(i=20)=>{if(!f||!c&&!s()||d&&!a)return!1;try{return navigator.vibrate(i)?!0:Array.isArray(i)?navigator.vibrate(20)||!1:navigator.vibrate([20,30,20])||!1}catch{return!1}},w=()=>{if(p.current&&(clearInterval(p.current),p.current=null),f&&(c||s())&&!(d&&!a))try{navigator.vibrate(0)}catch{}};return v.useEffect(()=>(e&&x&&f&&(c||s())&&!(d&&!a)?(m(20),p.current||(p.current=setInterval(()=>{m(20)},2e3))):w(),h.current&&!e&&(m(0),setTimeout(()=>m([25,35,25]),0)),h.current=e,()=>{w()}),[e,x,f,c,d,a]),v.useEffect(()=>{if(!e)return;const i=()=>{document.visibilityState==="hidden"?w():e&&(c||s())&&(m(20),p.current||(p.current=setInterval(()=>m(20),2e3)))};return document.addEventListener("visibilitychange",i),()=>document.removeEventListener("visibilitychange",i)},[e,c]),v.useEffect(()=>{e&&(f||console.info("[FullScreenLoader] 이 환경은 navigator.vibrate를 지원하지 않습니다(iOS Safari 등)."))},[e,f]),e?t.jsxs("div",{role:"status","aria-live":"polite",className:`fs-loader ${d?"reduce":"animate"}`,children:[t.jsxs("div",{className:"fs-loader__inner",children:[t.jsxs("div",{className:"solarsys",role:"img","aria-label":"로딩 중: 태양계 애니메이션",children:[t.jsx("div",{className:"sun","aria-hidden":"true"}),t.jsx("div",{className:"orbit orbit--1","aria-hidden":"true",children:t.jsx("div",{className:"planet planet--1"})}),t.jsx("div",{className:"orbit orbit--2","aria-hidden":"true",children:t.jsx("div",{className:"planet planet--2"})}),t.jsx("div",{className:"orbit orbit--3","aria-hidden":"true",children:t.jsx("div",{className:"planet planet--3"})})]}),t.jsx("h3",{className:"fs-loader__title",children:r}),t.jsx("p",{className:"fs-loader__msg",children:n}),t.jsx("span",{style:{marginTop:2,fontSize:11,opacity:.45,userSelect:"none",display:"block"},children:f?c||s()?"진동 활성화됨":"화면을 한 번 터치하면 진동이 켜집니다":"이 기기는 진동 미지원"})]}),t.jsx("style",{children:`
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
      `})]}):null}const L=typeof navigator<"u"&&typeof navigator.vibrate=="function";function $(){try{const e=navigator.userActivation;return!!(e?.isActive||e?.hasBeenActive)}catch{return!1}}function A(e=20){if(!L||!$())return!1;try{return navigator.vibrate(e)?!0:Array.isArray(e)?navigator.vibrate(20)||!1:navigator.vibrate([20,35,20])||!1}catch{return!1}}function O(){if(L&&$())try{navigator.vibrate(0)}catch{}}function J(){A(20)}function E(){O(),A(30)}function I(){O(),A([25,40,25])}const z=!1,U="https://cool-shape-9570.idcode1690.workers.dev",q=typeof location<"u"&&/github\.io|workers\.dev|vercel\.app|netlify\.app|unse\.news/i.test(location.host),N=z&&!q?"/api/ai":`${U}/chat`;try{console.info("[openaiService] endpoint:",N,"mode=","production","dev=",z)}catch{}const C="ai_cache_v1:",k=new Map,_=60*1e3,M=60*_,y=24*M;function R(){return Date.now()+9*M}function B(){const e=R(),r=y-e%y;return r>0?r:_}function G(){const e=R(),n=new Date(e).getUTCDay(),o=e-e%y,a=(7-n)%7,d=o+(a===0?7:a)*y-e;return d>0?d:_}function D(e){const r=String(e||"").toUpperCase();return r.includes("TODAY")?B():r.includes("SAJU")?365*y:r.includes("COMPAT")?30*y:r.includes("LOTTO")?G():30*y}function V(e){try{return localStorage.getItem(e)}catch{return null}}function W(e,r){try{localStorage.setItem(e,r)}catch{}}function T(e){try{localStorage.removeItem(e)}catch{}}function H(e){if(!e)return null;const r=C+e,n=V(r);if(!n)return null;try{const{value:o,expireAt:a}=JSON.parse(n);return a&&Date.now()<a?String(o??""):(T(r),null)}catch{return T(r),null}}function Y(e,r,n){if(!e)return;const o=C+e,a=Date.now()+(n??D(e));W(o,JSON.stringify({value:String(r??""),expireAt:a}))}async function K({messages:e,cacheKey:r,model:n="gpt-5.1-mini",temperature:o=.1,top_p:a=1,max_tokens:f=1800,seed:d=777}={}){const u=r?H(r):null;if(u!=null&&u!==""){try{console.debug("[openaiService] cache HIT:",r)}catch{}return u}if(r&&k.has(r)){try{console.debug("[openaiService] inflight dedupe:",r)}catch{}return k.get(r)}const x={model:n,messages:e,cacheKey:r,temperature:o,top_p:a,max_tokens:f,seed:d},c=async s=>{const p=await fetch(s,{method:"POST",mode:"cors",credentials:"omit",cache:"no-store",headers:{"content-type":"text/plain;charset=UTF-8"},body:JSON.stringify(x),redirect:"follow",referrerPolicy:"no-referrer"}),h=await p.text();if(!p.ok){let g;try{g=JSON.parse(h)}catch{g={error:h}}const S=g?.error?.message||g?.error||h||"Unknown error";throw new Error(`OpenAI API 오류 (${p.status}): ${typeof S=="string"?S:JSON.stringify(S)}`)}let m;try{m=JSON.parse(h)}catch{m=null}const w=m?.choices?.[0]?.message?.content??(m?"":h),i=String(w??"");return r&&i&&Y(r,i,D(r)),i};try{J()}catch{}const l=(async()=>{try{const s=await c(N);try{E()}catch{}return s}catch(s){if((s?.name==="TypeError"||/Failed to fetch/i.test(String(s?.message||"")))&&N!=="/api/ai")try{console.warn("[openaiService] primary failed, fallback -> /api/ai",s);const h=await c("/api/ai");try{E()}catch{}return h}catch(h){try{I()}catch{}throw h}try{I()}catch{}throw s}})();r&&k.set(r,l);try{return await l}finally{r&&k.delete(r)}}export{X as A,Q as F,K as c};
