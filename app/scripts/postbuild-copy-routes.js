// scripts/postbuild-copy-routes.js
// dist/index.html을 라우트별로 복제해 검색엔진이 경로 URL을 직접 색인 가능하도록 만듭니다.
// - 각 라우트의 base/canonical/og:url/title을 적절히 보정
// - 서비스워커 상대경로 등록을 base에 의존하도록 그대로 둠

const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../dist');

const ROUTES = [
  { dir: 'result',  title: '사주 결과 | 운세뉴스',   canonical: 'https://unse.news/result/'  },
  { dir: 'fortune', title: '오늘의 운세 | 운세뉴스', canonical: 'https://unse.news/fortune/' },
  { dir: 'lotto',   title: '로또 운세 | 운세뉴스',   canonical: 'https://unse.news/lotto/'   },
  { dir: 'compat',  title: '궁합 풀이 | 운세뉴스',   canonical: 'https://unse.news/compat/'  },
  { dir: 'ask',     title: '질문 풀이 | 운세뉴스',   canonical: 'https://unse.news/ask/'     },
];

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, txt) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, txt);
}

(function main() {
  const indexFile = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error('[postbuild] dist/index.html을 찾을 수 없습니다. 먼저 `npm run build`를 실행하세요.');
    process.exit(1);
  }
  const src = read(indexFile);

  ROUTES.forEach(({ dir, title, canonical }) => {
    let html = src;

    // 1) base를 한 단계 상위로
    html = html.replace(
      /<base\s+href=(['"])[^'"]*\1\s*>\s*/i,
      `<base href="../">`
    );

    // 2) <title> 교체
    html = html.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${title}</title>`
    );

    // 3) canonical 교체
    html = html.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
      `<link rel="canonical" href="${canonical}" />`
    );

    // 4) og:url 교체
    html = html.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="og:url" content="${canonical}" />`
    );

    // 5) 기본 OG 이미지는 그대로 사용 (필요시 라우트별로 커스터마이즈 가능)

    // 6) 저장
    const out = path.join(DIST, dir, 'index.html');
    write(out, html);
    console.log(`[postbuild] wrote ${out}`);
  });

  console.log('[postbuild] route copies complete.');
})();
