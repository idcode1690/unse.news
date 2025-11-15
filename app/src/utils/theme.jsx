// app/src/utils/theme.jsx

const THEME_KEY = 'theme'; // 'light' | 'dark' | 'system'

export function getSystemTheme() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export function getSavedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

function applyColorSchemeMeta(effective) {
  try {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    // Align address bar color with theme
    meta.setAttribute('content', effective === 'dark' ? '#1e1e1e' : '#f3f3f3');
  } catch {}
}

export function applyTheme(theme) {
  const root = document.documentElement;
  const target = theme === 'light' || theme === 'dark' ? theme : getSystemTheme();
  try { root.setAttribute('data-theme', target); } catch {}
  try { root.style.colorScheme = target; } catch {}
  applyColorSchemeMeta(target);
}

function listenSystemChangeIfNeeded(state) {
  // If user chose 'system', track changes and re-apply
  if (!window.matchMedia) return;
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getSavedTheme() === 'system') applyTheme('system');
    };
    mql.addEventListener?.('change', handler);
  } catch {}
}

export function initTheme() {
  const saved = getSavedTheme();
  applyTheme(saved);
  listenSystemChangeIfNeeded();
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getSystemTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  applyTheme(next);
  return next;
}

export function setTheme(mode) {
  const val = mode === 'light' || mode === 'dark' ? mode : 'system';
  try { localStorage.setItem(THEME_KEY, val); } catch {}
  applyTheme(val);
}
