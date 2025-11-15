// vite.config.js
import { defineConfig } from "vite";
// Vitest 설정을 위해 타입 힌트 주석을 유지할 수 있습니다.
// @ts-check
import react from "@vitejs/plugin-react";

// ✅ unse.news(커스텀 도메인 루트) 배포용 설정
// - 해시 라우팅이 아니라 깔끔한 경로(/result 등)를 쓰려면
//   정적 파일들이 항상 절대경로(/assets/...)로 요청되어야 합니다.
// - GitHub Pages에서 커스텀 도메인(Root)로 쓰는 경우 base는 반드시 "/" 로!
export default defineConfig({
  plugins: [react()],

  // ◻️ 로컬 개발엔 영향 없음. 빌드 시 산출물의 URL 베이스만 결정.
  //    리포지토리 서브경로 배포라면 "/<repo>/" 로 바꿔주세요.
  base: "/",

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/ai": {
        target: "https://unse-openai-proxy.idcode1690.workers.dev",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/ai/, "/chat"),
      },
    },
  },

  build: {
    target: "es2019",
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false,
    // 절대경로 base("/")와 함께 사용할 때 캐시/경로 혼동 방지에 유리
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom"],
  },

  // Vitest 설정 (Jest 스타일 테스트 호환)
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.jsx"],
  },
});
