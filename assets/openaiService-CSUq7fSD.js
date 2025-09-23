import{r as g,j as t}from"./index-DJS0M77R.js";function re({show:e=!1,title:r="준비 중입니다…",message:i="조금만 기다려 주세요.",respectReducedMotion:s=!0,forceHaptics:o=!1}){const p=typeof navigator!="undefined"&&typeof navigator.vibrate=="function",[d,u]=g.useState(!1);g.useEffect(()=>{if(s)try{const n=window.matchMedia("(prefers-reduced-motion: reduce)"),x=()=>u(!!n.matches);return x(),n.addEventListener?n.addEventListener("change",x):n.addListener(x),()=>{n.removeEventListener?n.removeEventListener("change",x):n.removeListener(x)}}catch{}},[s]);const v=g.useMemo(()=>{try{return o||(navigator==null?void 0:navigator.maxTouchPoints)>0||window.matchMedia&&window.matchMedia("(hover: none) and (pointer: coarse)").matches}catch{return!!o}},[o]),[c,l]=g.useState(!1),a=()=>{try{const n=navigator.userActivation;return!!(n!=null&&n.isActive||n!=null&&n.hasBeenActive)}catch{return!1}};g.useEffect(()=>{e&&a()&&queueMicrotask(()=>l(!0))},[e]),g.useEffect(()=>{if(!e||c)return;const n=()=>{l(!0)};return window.addEventListener("pointerdown",n,{capture:!0,passive:!0}),window.addEventListener("keydown",n,{capture:!0}),window.addEventListener("touchstart",n,{capture:!0,passive:!0}),()=>{window.removeEventListener("pointerdown",n,{capture:!0}),window.removeEventListener("keydown",n,{capture:!0}),window.removeEventListener("touchstart",n,{capture:!0})}},[e,c]);const h=g.useRef(null),m=g.useRef(e),f=(n=20)=>{if(!p||!c&&!a()||d&&!o)return!1;try{return navigator.vibrate(n)?!0:Array.isArray(n)?navigator.vibrate(20)||!1:navigator.vibrate([20,30,20])||!1}catch{return!1}},y=()=>{if(h.current&&(clearInterval(h.current),h.current=null),p&&(c||a())&&!(d&&!o))try{navigator.vibrate(0)}catch{}};return g.useEffect(()=>(e&&v&&p&&(c||a())&&!(d&&!o)?(f(20),h.current||(h.current=setInterval(()=>{f(20)},2e3))):y(),m.current&&!e&&(f(0),setTimeout(()=>f([25,35,25]),0)),m.current=e,()=>{y()}),[e,v,p,c,d,o]),g.useEffect(()=>{if(!e)return;const n=()=>{document.visibilityState==="hidden"?y():e&&(c||a())&&(f(20),h.current||(h.current=setInterval(()=>f(20),2e3)))};return document.addEventListener("visibilitychange",n),()=>document.removeEventListener("visibilitychange",n)},[e,c]),g.useEffect(()=>{e&&(p||console.info("[FullScreenLoader] 이 환경은 navigator.vibrate를 지원하지 않습니다(iOS Safari 등)."))},[e,p]),e?t.jsxs("div",{role:"status","aria-live":"polite",className:`fs-loader ${d?"reduce":"animate"}`,children:[t.jsxs("div",{className:"fs-loader__inner",children:[t.jsxs("div",{className:"solarsys",role:"img","aria-label":"로딩 중: 태양계 애니메이션",children:[t.jsx("div",{className:"sun","aria-hidden":"true"}),t.jsx("div",{className:"orbit orbit--1","aria-hidden":"true",children:t.jsx("div",{className:"planet planet--1"})}),t.jsx("div",{className:"orbit orbit--2","aria-hidden":"true",children:t.jsx("div",{className:"planet planet--2"})}),t.jsx("div",{className:"orbit orbit--3","aria-hidden":"true",children:t.jsx("div",{className:"planet planet--3"})})]}),t.jsx("h3",{className:"fs-loader__title",children:r}),t.jsx("p",{className:"fs-loader__msg",children:i}),t.jsx("span",{style:{marginTop:2,fontSize:11,opacity:.45,userSelect:"none",display:"block"},children:p?c||a()?"진동 활성화됨":"화면을 한 번 터치하면 진동이 켜집니다":"이 기기는 진동 미지원"})]}),t.jsx("style",{children:`
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
      `})]}):null}function w(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function k(e){return e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(r,i,s)=>`<a href="${w(s)}" target="_blank" rel="noopener noreferrer">${w(i)}</a>`),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e}function G(e){if(!e)return"";const r=String(e).replace(/\r\n/g,`
`).split(`
`);let i=0,s="";const o=d=>{const u=[];for(;i<r.length&&d(r[i]);)u.push(r[i++]);return u},p=d=>{const u=d.join(`
`).trim();if(!u)return;const v=u.split(/\n{2,}/).map(c=>`<p>${k(w(c))}</p>`);s+=v.join("")};for(;i<r.length;){const d=r[i];if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(d)){i++,s+="<hr/>";continue}const u=d.match(/^\s*(#{1,3})\s+(.+)$/);if(u){i++;const c=u[1].length,l=u[2].trim(),a=k(w(l));s+=`<h${c+1}>${a}</h${c+1}>`;continue}if(/^\s*>/.test(d)){const l=o(a=>/^\s*>/.test(a)).map(a=>a.replace(/^\s*>\s?/,"")).join(`
`).split(/\n{2,}/).map(a=>`<p>${k(w(a))}</p>`);s+=`<blockquote>${l.join("")}</blockquote>`;continue}if(/^\s*\d+\.\s+/.test(d)){const c=o(l=>/^\s*\d+\.\s+/.test(l)).map(l=>l.replace(/^\s*\d+\.\s+/,"")).map(l=>`<li>${k(w(l))}</li>`).join("");s+=`<ol>${c}</ol>`;continue}if(/^\s*([-*•])\s+/.test(d)){const c=o(l=>/^\s*([-*•])\s+/.test(l)).map(l=>l.replace(/^\s*([-*•])\s+/,"")).map(l=>`<li>${k(w(l))}</li>`).join("");s+=`<ul>${c}</ul>`;continue}const v=[];for(;i<r.length&&!/^\s*$/.test(r[i]);)v.push(r[i++]);for(p(v);i<r.length&&/^\s*$/.test(r[i]);)i++}return s}const J=()=>t.jsxs("div",{className:"ai-loading",role:"img","aria-label":"로딩 중",children:[t.jsxs("svg",{className:"ai-spinner",width:"96",height:"96",viewBox:"0 0 96 96",xmlns:"http://www.w3.org/2000/svg",children:[t.jsx("defs",{children:t.jsxs("linearGradient",{id:"aiGrad",x1:"0",y1:"0",x2:"1",y2:"1",children:[t.jsx("stop",{offset:"0%",stopColor:"#0a84ff"}),t.jsx("stop",{offset:"50%",stopColor:"#7a5af8"}),t.jsx("stop",{offset:"100%",stopColor:"#0fa958"})]})}),t.jsx("circle",{cx:"48",cy:"48",r:"32",fill:"none",stroke:"url(#aiGrad)",strokeWidth:"4",strokeLinecap:"round",strokeDasharray:"160 60",children:t.jsx("animate",{attributeName:"stroke-dashoffset",from:"0",to:"-440",dur:"1.2s",repeatCount:"indefinite"})}),t.jsx("circle",{cx:"48",cy:"48",r:"24",fill:"none",stroke:"rgba(0,0,0,.08)",strokeWidth:"2",strokeDasharray:"4 6",children:t.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0 48 48",to:"360 48 48",dur:"6s",repeatCount:"indefinite"})}),t.jsx("g",{transform:"translate(48,48)",children:t.jsxs("circle",{cx:"0",cy:"-24",r:"3.2",fill:"rgba(10,132,255,.85)",children:[t.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0",to:"360",dur:"1.6s",repeatCount:"indefinite"}),t.jsx("animate",{attributeName:"r",values:"3.2;5;3.2",dur:"1.6s",repeatCount:"indefinite"})]})}),t.jsx("g",{transform:"translate(48,48)",children:t.jsxs("circle",{cx:"0",cy:"18",r:"2.8",fill:"rgba(122,90,248,.9)",children:[t.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"360",to:"0",dur:"2.4s",repeatCount:"indefinite"}),t.jsx("animate",{attributeName:"r",values:"2.8;4;2.8",dur:"2.4s",repeatCount:"indefinite"})]})})]}),t.jsx("style",{children:`
      .ai-loading { display:grid; place-items:center; padding:10px 0 6px; }
      .ai-spinner { filter: drop-shadow(0 4px 18px rgba(122,90,248,.25)); }
      @media (prefers-reduced-motion: reduce){
        .ai-spinner animate, .ai-spinner animateTransform { display:none; }
      }
    `})]}),ne=({content:e,isLoading:r,error:i})=>{if(r)return t.jsxs("div",{className:"ai-fortune",children:[t.jsxs("div",{className:"content",children:[t.jsx(J,{}),t.jsx("p",{"aria-live":"polite",children:"AI가 내용을 준비하는 중…"})]}),t.jsx("style",{children:`
          .ai-fortune .content { max-width:none; width:100%; margin:0; padding-right:0; box-sizing:border-box; }
          .ai-fortune .content p { margin: 10px 0; text-align:center; color: var(--ink-soft, #666); }
        `})]});if(i)return t.jsxs("div",{className:"ai-fortune",children:[t.jsxs("div",{className:"content",role:"alert",children:[t.jsx("p",{children:"사주 풀이 생성 중 오류가 발생했습니다."}),t.jsxs("p",{children:[t.jsx("strong",{children:"오류 내용:"})," ",String(i)]}),t.jsx("p",{children:"API 키/네트워크 또는 CORS 설정을 확인해주세요."})]}),t.jsx("style",{children:`
          .ai-fortune .content { max-width:none; width:100%; margin:0; padding-right:0; box-sizing:border-box; }
          .ai-fortune .content p { margin: 8px 0; line-height:1.7; }
        `})]});if(!e)return null;const s=G(e),o={"@context":"https://schema.org","@type":"Article",headline:"AI 사주 풀이",author:{"@type":"Person",name:"AI Fortune"},datePublished:new Date().toISOString(),articleSection:"Horoscope",inLanguage:"ko"};return t.jsxs("div",{className:"ai-fortune",children:[t.jsxs("article",{className:"content",itemScope:!0,itemType:"https://schema.org/Article",children:[t.jsx("div",{itemProp:"articleBody",dangerouslySetInnerHTML:{__html:s}}),t.jsx("meta",{itemProp:"author",content:"AI Fortune"})]}),t.jsx("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(o)}}),t.jsx("style",{children:`
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
      `})]})},R=typeof navigator!="undefined"&&typeof navigator.vibrate=="function";function M(){try{const e=navigator.userActivation;return!!(e!=null&&e.isActive||e!=null&&e.hasBeenActive)}catch{return!1}}function _(e=20){if(!R||!M())return!1;try{return navigator.vibrate(e)?!0:Array.isArray(e)?navigator.vibrate(20)||!1:navigator.vibrate([20,35,20])||!1}catch{return!1}}function D(){if(R&&M())try{navigator.vibrate(0)}catch{}}function V(){_(20)}function O(){D(),_(30)}function z(){D(),_([25,40,25])}const P=!1,W="https://cool-shape-9570.idcode1690.workers.dev",H=typeof location!="undefined"&&/github\.io|workers\.dev|vercel\.app|netlify\.app|unse\.news/i.test(location.host),A=P&&!H?"/api/ai":`${W}/chat`;try{console.info("[openaiService] endpoint:",A,"mode=","production","dev=",P)}catch{}const F="ai_cache_v1:",S=new Map,E=60*1e3,U=60*E,j=24*U;function q(){return Date.now()+9*U}function Y(){const e=q(),r=j-e%j;return r>0?r:E}function Z(){const e=q(),i=new Date(e).getUTCDay(),s=e-e%j,o=(7-i)%7,d=s+(o===0?7:o)*j-e;return d>0?d:E}function B(e){const r=String(e||"").toUpperCase();return r.includes("TODAY")?Y():r.includes("SAJU")?365*j:r.includes("COMPAT")?30*j:r.includes("LOTTO")?Z():30*j}function X(e){try{return localStorage.getItem(e)}catch{return null}}function Q(e,r){try{localStorage.setItem(e,r)}catch{}}function C(e){try{localStorage.removeItem(e)}catch{}}function K(e){if(!e)return null;const r=F+e,i=X(r);if(!i)return null;try{const{value:s,expireAt:o}=JSON.parse(i);return o&&Date.now()<o?String(s!=null?s:""):(C(r),null)}catch{return C(r),null}}function ee(e,r,i){if(!e)return;const s=F+e,o=Date.now()+(i!=null?i:B(e));Q(s,JSON.stringify({value:String(r!=null?r:""),expireAt:o}))}async function ie({messages:e,cacheKey:r,model:i="gpt-5.1-mini",temperature:s=.1,top_p:o=1,max_tokens:p=1800,seed:d=777}={}){const u=r?K(r):null;if(u!=null&&u!==""){try{console.debug("[openaiService] cache HIT:",r)}catch{}return u}if(r&&S.has(r)){try{console.debug("[openaiService] inflight dedupe:",r)}catch{}return S.get(r)}const v={model:i,messages:e,cacheKey:r,temperature:s,top_p:o,max_tokens:p,seed:d},c=async a=>{var x,I,T,L,$;const h=await fetch(a,{method:"POST",mode:"cors",credentials:"omit",cache:"no-store",headers:{"content-type":"text/plain;charset=UTF-8"},body:JSON.stringify(v),redirect:"follow",referrerPolicy:"no-referrer"}),m=await h.text();if(!h.ok){let b;try{b=JSON.parse(m)}catch{b={error:m}}const N=((x=b==null?void 0:b.error)==null?void 0:x.message)||(b==null?void 0:b.error)||m||"Unknown error";throw new Error(`OpenAI API 오류 (${h.status}): ${typeof N=="string"?N:JSON.stringify(N)}`)}let f;try{f=JSON.parse(m)}catch{f=null}const y=($=(L=(T=(I=f==null?void 0:f.choices)==null?void 0:I[0])==null?void 0:T.message)==null?void 0:L.content)!=null?$:f?"":m,n=String(y!=null?y:"");return r&&n&&ee(r,n,B(r)),n};try{V()}catch{}const l=(async()=>{try{const a=await c(A);try{O()}catch{}return a}catch(a){if(((a==null?void 0:a.name)==="TypeError"||/Failed to fetch/i.test(String((a==null?void 0:a.message)||"")))&&A!=="/api/ai")try{console.warn("[openaiService] primary failed, fallback -> /api/ai",a);const m=await c("/api/ai");try{O()}catch{}return m}catch(m){try{z()}catch{}throw m}try{z()}catch{}throw a}})();r&&S.set(r,l);try{return await l}finally{r&&S.delete(r)}}export{ne as A,re as F,ie as c};
