// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 빌드 산출물 무시
  globalIgnores(['dist']),

  // 일반 소스(.js/.jsx)
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // 대문자/언더스코어 시작 미사용 변수 허용 (프로젝트 기존 규칙 유지)
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // ✅ 테스트 파일(.test/.spec, setupTests) — Jest 전역 허용
  {
    files: [
      '**/*.{test,spec}.{js,jsx}',
      '**/setupTests.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest, // describe/test/expect/jest/beforeEach/afterAll 등
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    // 필요시 규칙 추가 가능
    // rules: { 'no-undef': 'off' },
  },
])
