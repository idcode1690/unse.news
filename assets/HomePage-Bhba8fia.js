import{r as l,j as a}from"./index-Wku8L6wJ.js";import{l as ie,D as f,a as j,s as de,M as ue,b as me,c as he,C as q,S as z,d as w,B as G}from"./index-BSTa-Vbb.js";const k="home_form_locked_v1",E="home_allow_scroll_once";function ge(n){return n=Number(n),!Number.isFinite(n)||n<=0?!1:n%400===0||n%4===0&&n%100!==0}function H(n,d){const N=Number(n),s=Number(d);return!Number.isFinite(s)||s<1||s>12?31:s===2?ge(N)?29:28:[4,6,9,11].includes(s)?30:31}function K(n){try{return localStorage.getItem(n)}catch{return null}}function T(n,d){try{localStorage.setItem(n,d)}catch{}}function $(n){try{return sessionStorage.getItem(n)}catch{return null}}function D(n,d){try{sessionStorage.setItem(n,d)}catch{}}function fe(n){try{sessionStorage.removeItem(n)}catch{}}const pe=()=>{const[n,d]=l.useState(()=>{const e=ie();if(e)return{...f,...e,hour:e.hour||"",hourBranch:void 0};const t=j();if(t){const{calendar:o,year:r,month:i,day:p,hour:v,gender:g,leapMonth:c,mbti:m}=t;return{...f,calendar:o??f.calendar,year:r??"",month:i??"",day:p??"",hour:v??"",gender:g??f.gender,leapMonth:c??f.leapMonth,mbti:m??""}}return{...f,calendar:"solar",gender:"male",year:"1980",month:"3",day:"27",hour:"",leapMonth:f.leapMonth,mbti:""}}),N=()=>j()?!0:K(k)==="1",[s,L]=l.useState(N),[B,R]=l.useState(()=>!!j()),O=l.useRef(null);l.useEffect(()=>{const e=!!j(),t=K(k);e?(t!=="1"&&T(k,"1"),s||L(!0)):t===null&&T(k,"0"),$(E)===null&&D(E,"0")},[]);const F=l.useRef(!0);l.useEffect(()=>{if(F.current){F.current=!1;return}de(n)},[n]);const W=l.useMemo(()=>{const e=[];for(let t=1900;t<=2029;t++)e.push({value:String(t),label:`${t}년`});return e},[]),P=l.useMemo(()=>Array.from({length:12},(e,t)=>({value:String(t+1),label:`${t+1}월`})),[]),U=l.useMemo(()=>{const t=n.calendar==="lunar"?30:H(n.year,n.month);return Array.from({length:t},(o,r)=>({value:String(r+1),label:`${r+1}일`}))},[n.calendar,n.year,n.month]),Q=l.useMemo(()=>{const e=[{value:"",label:"모름"}];for(let t=0;t<24;t++)e.push({value:String(t),label:`${String(t).padStart(2,"0")}시`});return e},[]),_=l.useMemo(()=>ue.map(e=>({value:e.value,label:e.label})),[]),I=l.useCallback(e=>{const t={...e},r=t.calendar==="lunar"?30:H(t.year,t.month),i=Number(t.day);return(!i||i>r)&&(t.day=String(Math.min(i||1,r))),t},[]);l.useEffect(()=>{const t=n.calendar==="lunar"?30:H(n.year,n.month),o=Number(n.day);o&&o>t&&d(r=>({...r,day:String(t)}))},[n.calendar,n.year,n.month]);const V=e=>{s||d(t=>I({...t,calendar:e}))},J=e=>{s||d(t=>({...t,gender:e}))},y=(e,t)=>{s||d(e==="year"||e==="month"||e==="leapMonth"?o=>I({...o,[e]:t}):o=>({...o,[e]:t}))},X=e=>{if(!e||typeof window>"u")return null;let t=e.parentElement;for(;t;){const o=getComputedStyle(t),r=o.overflowY||o.overflow;if(/(auto|scroll|overlay)/i.test(r))return t;t=t.parentElement}return null},C=l.useCallback(()=>{try{const e=document.querySelector('header, .header, [role="banner"]');if(!e)return 0;const t=(getComputedStyle(e)?.position||"").toLowerCase();return t.includes("fixed")||t.includes("sticky")?Math.ceil(e.getBoundingClientRect().height||0):0}catch{return 0}},[]),M=l.useRef(0),h=l.useCallback(()=>{M.current&&(cancelAnimationFrame(M.current),M.current=0);try{const e=document.documentElement;e&&(e.style.scrollBehavior="")}catch{}},[]);l.useEffect(()=>{const e=["wheel","touchstart","keydown","mousedown"];return e.forEach(t=>window.addEventListener(t,h,{passive:!0})),()=>e.forEach(t=>window.removeEventListener(t,h))},[h]);const Z=e=>1-Math.pow(1-e,5),b=l.useCallback((e,t,o=1400)=>{h();const r=!e,i=document.scrollingElement||document.documentElement,p=r?i.scrollTop||window.pageYOffset||0:e.scrollTop,v=t-p;if(Math.abs(v)<1)return;let g=0;const c=document.documentElement,m=c?c.style.scrollBehavior:"";c&&(c.style.scrollBehavior="auto");const u=x=>{g||(g=x);const se=x-g,A=Math.min(1,se/o),ce=Z(A),Y=p+v*ce;r?window.scrollTo(0,Y):e.scrollTop=Y,A<1?M.current=requestAnimationFrame(u):(setTimeout(()=>{c&&(c.style.scrollBehavior=m||"")},10),M.current=0)};M.current=requestAnimationFrame(u)},[h]),S=l.useCallback(()=>{const e=O.current;if(!e)return;const t=X(e),o=C(),r=Math.max(14,Math.min(40,Math.round((window.innerHeight||600)*.04)));if(t){const i=t.getBoundingClientRect(),p=e.getBoundingClientRect(),v=t.scrollTop+(p.top-i.top)-o-r,g=Math.max(0,Math.min(v,t.scrollHeight-t.clientHeight));b(t,g,1400),setTimeout(()=>{const c=t.getBoundingClientRect(),m=e.getBoundingClientRect(),u=Math.max(0,Math.min(t.scrollTop+(m.top-c.top)-C()-r,t.scrollHeight-t.clientHeight));Math.abs(u-t.scrollTop)>20&&b(t,u,600)},350),setTimeout(()=>{const c=t.getBoundingClientRect(),m=e.getBoundingClientRect(),u=Math.max(0,Math.min(t.scrollTop+(m.top-c.top)-C()-r,t.scrollHeight-t.clientHeight));Math.abs(u-t.scrollTop)>20&&b(t,u,500)},800)}else{const i=document.scrollingElement||document.documentElement,p=e.getBoundingClientRect(),v=(i.scrollTop||window.pageYOffset||0)+p.top-o-r,g=Math.max(0,i.scrollHeight-(window.innerHeight||i.clientHeight)),c=Math.max(0,Math.min(v,g));b(null,c,1400),setTimeout(()=>{const m=e.getBoundingClientRect(),u=(document.scrollingElement||document.documentElement).scrollTop+m.top-C()-r,x=Math.max(0,Math.min(u,(document.scrollingElement||document.documentElement).scrollHeight-(window.innerHeight||(document.scrollingElement||document.documentElement).clientHeight)));Math.abs(x-(document.scrollingElement||document.documentElement).scrollTop)>20&&b(null,x,600)},350),setTimeout(()=>{const m=e.getBoundingClientRect(),u=(document.scrollingElement||document.documentElement).scrollTop+m.top-C()-r,x=Math.max(0,Math.min(u,(document.scrollingElement||document.documentElement).scrollHeight-(window.innerHeight||(document.scrollingElement||document.documentElement).clientHeight)));Math.abs(x-(document.scrollingElement||document.documentElement).scrollTop)>20&&b(null,x,500)},800)}},[C,b]),ee=l.useCallback(()=>{const e=!!(n.year&&n.month&&n.day),t=n.calendar==="solar"||!!n.leapMonth,o=!!n.gender;!e||!t||!o||(L(!0),T(k,"1"),me({calendar:n.calendar,year:n.year,month:n.month,day:n.day,hour:n.hour||"",minute:"0",gender:n.gender,leapMonth:n.leapMonth,mbti:n.mbti||""}),D(E,"1"),R(!0))},[n]);l.useEffect(()=>!B||$(E)!=="1"?void 0:(requestAnimationFrame(()=>{S(),setTimeout(S,900),setTimeout(S,1500),D(E,"0")}),()=>h()),[B,S,h]);const te=l.useCallback(()=>{d({...f,calendar:"solar",gender:"male",year:"1980",month:"3",day:"27",hour:"",leapMonth:f.leapMonth,mbti:""}),he(),L(!1),T(k,"0"),R(!1),fe(E),h()},[h]),ne=[{value:"solar",label:"양력"},{value:"lunar",label:"음력"}],ae=[{value:"male",label:"남성"},{value:"female",label:"여성"}],oe=[{value:"common",label:"평달"},{value:"leap",label:"윤달"}],le=n.calendar==="lunar",re=[{key:"result",icon:"📜",title:"사주팔자",desc:"정확한 사주 계산",href:"#/result"},{key:"fortune",icon:"🔮",title:"오늘의 운세",desc:"오늘 운세 한눈에",href:"#/fortune"},{key:"lotto",icon:"🎰",title:"로또운세",desc:"사주 기반 번호 추천",href:"#/lotto"},{key:"compat",icon:"❤️",title:"궁합",desc:"상대와의 궁합 확인",href:"#/compat"},{key:"ask",icon:"❓",title:"질문 풀이",desc:"사주로 궁금증 풀이",href:"#/ask"}];return a.jsxs("section",{className:"calculator",children:[a.jsxs(q,{className:"form-card",children:[a.jsx("h2",{className:"h2",style:{marginTop:0},children:"내 정보"}),a.jsxs("fieldset",{disabled:s,"aria-disabled":s,className:s?"fieldset-locked":void 0,style:{border:0,padding:0,margin:0},children:[a.jsxs("div",{className:"row cols-2",children:[a.jsx("div",{className:"field-calendar",children:a.jsx(z,{label:"달력",options:ne,value:n.calendar,onChange:V,ariaLabel:"달력 종류 선택"})}),le&&a.jsx("div",{className:"field-leap",children:a.jsx(w,{label:"윤달 여부",id:"leapMonth",options:oe,value:n.leapMonth,onChange:e=>y("leapMonth",e.target.value)})})]}),a.jsxs("div",{className:"row cols-2",children:[a.jsx("div",{className:"field-gender",children:a.jsx(z,{label:"성별",options:ae,value:n.gender,onChange:J,ariaLabel:"성별 선택"})}),a.jsx("div",{className:"field-mbti only-desktop",children:a.jsx(w,{label:"MBTI (선택사항)",id:"mbti-desktop",options:_,value:n.mbti||"",onChange:e=>y("mbti",e.target.value)})})]}),a.jsxs("div",{className:"row cols-4 sm-cols-2","aria-label":"생년월일 및 시간 선택",children:[a.jsx("div",{className:"field-year",children:a.jsx(w,{label:"년도",id:"year",options:W,value:n.year,onChange:e=>y("year",e.target.value)})}),a.jsx("div",{className:"field-month",children:a.jsx(w,{label:"월",id:"month",options:P,value:n.month,onChange:e=>y("month",e.target.value)})}),a.jsx("div",{className:"field-day",children:a.jsx(w,{label:"일",id:"day",options:U,value:n.day,onChange:e=>y("day",e.target.value)})}),a.jsx("div",{className:"field-hour",children:a.jsx(w,{label:"시간",id:"hour",options:Q,value:n.hour,onChange:e=>y("hour",e.target.value)})})]}),a.jsx("div",{className:"row only-mobile",children:a.jsx("div",{className:"field-mbti",children:a.jsx(w,{label:"MBTI (선택사항)",id:"mbti-mobile",options:_,value:n.mbti||"",onChange:e=>y("mbti",e.target.value)})})})]}),a.jsxs("div",{className:"actions",children:[a.jsx(G,{variant:"text",onClick:te,children:"초기화"}),a.jsx(G,{onClick:ee,disabled:s,children:s?"저장완료":"정보저장"})]})]}),B&&a.jsx("div",{className:"row cols-4 gx quick-grid","aria-label":"빠른 메뉴",children:re.map((e,t)=>a.jsx(q,{ref:t===0?O:null,role:"link",tabIndex:0,className:"nav-card-simple",onClick:()=>window.location.hash=e.href,onKeyDown:o=>{(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),window.location.hash=e.href)},children:a.jsxs("div",{className:"nav-simple",children:[a.jsx("div",{className:"nav-icon","aria-hidden":!0,children:e.icon}),a.jsxs("div",{className:"nav-body",children:[a.jsx("h3",{className:"h3 nav-title",children:e.title}),a.jsx("p",{className:"muted nav-desc",children:e.desc})]})]})},e.key))}),a.jsx("style",{children:`
        :root{ --row-gap: 14px; --col-gap: 12px; }

        .form-card { margin-bottom: 14px; }

        /* 행 간격을 '딱' 고정 */
        .form-card .row{
          display: grid;
          gap: var(--row-gap) var(--col-gap);
          margin: 0;                     /* 기본 여백 제거 */
        }
        .form-card .row + .row{ margin-top: var(--row-gap); } /* 행-행 간격 균일 */
        .form-card .row.only-mobile{ margin-top: var(--row-gap); }

        /* 필드 컨테이너 자체 여백 제거 (컴포넌트 내부 마진 영향 최소화) */
        .form-card .row > [class^="field-"]{ margin: 0; }

        /* 액션 영역도 동일한 상단 간격 적용 */
        .actions{
          margin-top: var(--row-gap);
          display: flex; gap: 10px;
        }

        .quick-grid { margin-top: 10px; }

        /* 락 시 포인터 차단 */
        .fieldset-locked { opacity: 0.98; }
        .fieldset-locked * {
          pointer-events: none !important;
          cursor: not-allowed !important;
        }

        /* 카드 레이아웃 */
        .nav-card-simple { cursor: pointer; }
        .nav-simple{
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
        }
        .nav-icon{
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
        }
        .nav-title{
          margin: 0;
          font-weight: 800;
          line-height: 1.22;
        }
        .nav-desc{
          margin: 2px 0 0;
          font-size: 13px;
          color: var(--ink-soft, #6b7280);
        }

        @media (max-width: 640px){
          .nav-title{ font-size: 18px; }
          .nav-desc{ font-size: 15px; margin-top: 0; }
        }
      `})]})},ye=()=>{const n=()=>{navigator.vibrate&&navigator.vibrate(10)};return a.jsx("section",{className:"calculator",children:a.jsx(pe,{onSuccess:n})})};export{ye as default};
