// scripts/postbuild-spa-routes.cjs
// 목적: Vite로 빌드된 dist/index.html을 SPA 라우트별 폴더에 복제하여
//       /result, /fortune, /lotto, /compat, /ask 경로 진입 시
//       정적 호스팅(예: GitHub Pages)에서도 200으로 index.html을 서빙하게 한다.

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

async function main() {
  // 이 스크립트 파일 기준으로 dist 경로 계산
  const distDir = path.resolve(__dirname, '..', 'dist');
  const srcIndex = path.join(distDir, 'index.html');

  // 빌드 산출물이 있는지 확인
  try {
    await fsp.access(srcIndex, fs.constants.R_OK);
  } catch {
    console.error(`[postbuild] dist/index.html을 찾을 수 없습니다: ${srcIndex}`);
    process.exit(1);
  }

  // SPA 라우트 목록 (끝 슬래시 없이 관리)
  const routes = ['result', 'fortune', 'lotto', 'compat', 'ask'];

  // 각 라우트 폴더에 index.html 복제
  for (const r of routes) {
    const targetDir = path.join(distDir, r);
    const targetIndex = path.join(targetDir, 'index.html');
    await copyFile(srcIndex, targetIndex);
    console.log(`[postbuild] ${path.relative(process.cwd(), targetIndex)} 생성`);
  }

  // 404.html이 없으면 index.html을 복제하여 생성 (GH Pages 직접 진입 대비)
  const dist404 = path.join(distDir, '404.html');
  try {
    await fsp.access(dist404, fs.constants.R_OK);
  } catch {
    await copyFile(srcIndex, dist404);
    console.log('[postbuild] dist/404.html 생성');
  }

  console.log('[postbuild] SPA 라우트 복제가 완료되었습니다.');
}

main().catch((err) => {
  console.error('[postbuild] 실패:', err);
  process.exit(1);
});
