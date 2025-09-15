import{r as t,j as a}from"./index-Cq4ejKLT.js";function w({show:r=!1,title:b="준비 중입니다…",message:g="조금만 기다려 주세요.",respectReducedMotion:p=!0,forceHaptics:s=!1}){const n=typeof navigator<"u"&&typeof navigator.vibrate=="function",[u,x]=t.useState(!1);t.useEffect(()=>{if(p)try{const e=window.matchMedia("(prefers-reduced-motion: reduce)"),d=()=>x(!!e.matches);return d(),e.addEventListener?e.addEventListener("change",d):e.addListener(d),()=>{e.removeEventListener?e.removeEventListener("change",d):e.removeListener(d)}}catch{}},[p]);const v=t.useMemo(()=>{try{return s||navigator?.maxTouchPoints>0||window.matchMedia&&window.matchMedia("(hover: none) and (pointer: coarse)").matches}catch{return!!s}},[s]),[i,m]=t.useState(!1),l=()=>{try{const e=navigator.userActivation;return!!(e?.isActive||e?.hasBeenActive)}catch{return!1}};t.useEffect(()=>{r&&l()&&queueMicrotask(()=>m(!0))},[r]),t.useEffect(()=>{if(!r||i)return;const e=()=>{m(!0)};return window.addEventListener("pointerdown",e,{capture:!0,passive:!0}),window.addEventListener("keydown",e,{capture:!0}),window.addEventListener("touchstart",e,{capture:!0,passive:!0}),()=>{window.removeEventListener("pointerdown",e,{capture:!0}),window.removeEventListener("keydown",e,{capture:!0}),window.removeEventListener("touchstart",e,{capture:!0})}},[r,i]);const o=t.useRef(null),h=t.useRef(r),c=(e=20)=>{if(!n||!i&&!l()||u&&!s)return!1;try{return navigator.vibrate(e)?!0:Array.isArray(e)?navigator.vibrate(20)||!1:navigator.vibrate([20,30,20])||!1}catch{return!1}},f=()=>{if(o.current&&(clearInterval(o.current),o.current=null),n&&(i||l())&&!(u&&!s))try{navigator.vibrate(0)}catch{}};return t.useEffect(()=>(r&&v&&n&&(i||l())&&!(u&&!s)?(c(20),o.current||(o.current=setInterval(()=>{c(20)},2e3))):f(),h.current&&!r&&(c(0),setTimeout(()=>c([25,35,25]),0)),h.current=r,()=>{f()}),[r,v,n,i,u,s]),t.useEffect(()=>{if(!r)return;const e=()=>{document.visibilityState==="hidden"?f():r&&(i||l())&&(c(20),o.current||(o.current=setInterval(()=>c(20),2e3)))};return document.addEventListener("visibilitychange",e),()=>document.removeEventListener("visibilitychange",e)},[r,i]),t.useEffect(()=>{r&&(n||console.info("[FullScreenLoader] 이 환경은 navigator.vibrate를 지원하지 않습니다(iOS Safari 등)."))},[r,n]),r?a.jsxs("div",{role:"status","aria-live":"polite",className:`fs-loader ${u?"reduce":"animate"}`,children:[a.jsxs("div",{className:"fs-loader__inner",children:[a.jsxs("div",{className:"solarsys",role:"img","aria-label":"로딩 중: 태양계 애니메이션",children:[a.jsx("div",{className:"sun","aria-hidden":"true"}),a.jsx("div",{className:"orbit orbit--1","aria-hidden":"true",children:a.jsx("div",{className:"planet planet--1"})}),a.jsx("div",{className:"orbit orbit--2","aria-hidden":"true",children:a.jsx("div",{className:"planet planet--2"})}),a.jsx("div",{className:"orbit orbit--3","aria-hidden":"true",children:a.jsx("div",{className:"planet planet--3"})})]}),a.jsx("h3",{className:"fs-loader__title",children:b}),a.jsx("p",{className:"fs-loader__msg",children:g}),a.jsx("span",{style:{marginTop:2,fontSize:11,opacity:.45,userSelect:"none",display:"block"},children:n?i||l()?"진동 활성화됨":"화면을 한 번 터치하면 진동이 켜집니다":"이 기기는 진동 미지원"})]}),a.jsx("style",{children:`
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
      `})]}):null}export{w as F};
