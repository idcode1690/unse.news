// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ✅ GitHub Pages(서브경로)·커스텀 도메인 모두 안전
  base: "./",

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
    assetsInlineLimit: 0,

    // ✅ modulepreload 폴리필 비활성 (new URL(...) 문제 회피)
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

  optimizeDeps: { include: ["react", "react-dom"] },
});
