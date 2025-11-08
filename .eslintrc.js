// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  extends: ["react-app", "react-app/jest"],

  // ✅ JSON을 ESLint 대상으로 삼지 않아서
  //    JS/JSX 파일이 JSON 파서로 잘못 파싱되는 문제를 원천 차단
  ignorePatterns: [
    "**/*.json",
    "node_modules/",
    "build/",
    "coverage/",
  ],

  // 필요 시 규칙 커스터마이징
  rules: {
    // 예: 개발 편의상 경고만
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  },
};
