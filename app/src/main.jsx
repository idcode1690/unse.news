// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";   // App 확장자 맞춰 유지
import { initTheme } from "./utils/theme.jsx";

// 초기 진입 시 사용자 선호(또는 시스템) 테마 적용
try { initTheme(); } catch {}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
