// app/src/utils/haptics.jsx

/**
 * 보수적인 햅틱(진동) 유틸:
 * - iOS Safari 등 미지원 환경은 자동 무시
 * - 사용자 제스처(activation) 전에는 호출하지 않음 → 브라우저 경고 방지
 * - 짧은 단일값(호환↑) 우선, 실패 시 짧은 배열 폴백
 */

const isVibrateSupported =
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

function hasActivation() {
  try {
    const ua = navigator.userActivation;
    return !!(ua?.isActive || ua?.hasBeenActive);
  } catch {
    return false;
  }
}

function vibrateOnce(msOrPattern = 20) {
  if (!isVibrateSupported) return false;
  if (!hasActivation()) return false; // 사용자 제스처 전에는 호출 금지
  try {
    const ok = navigator.vibrate(msOrPattern);
    if (ok) return true;
    // 단일값 실패 시 간단한 배열 재시도
    if (Array.isArray(msOrPattern)) {
      return navigator.vibrate(20) || false;
    } else {
      return navigator.vibrate([20, 35, 20]) || false;
    }
  } catch {
    return false;
  }
}

function vibrateStop() {
  if (!isVibrateSupported) return;
  if (!hasActivation()) return;
  try { navigator.vibrate(0); } catch {}
}

/** API 시작 시: 짧게 한 번 */
export function hapticsApiStart() {
  vibrateOnce(20);
}

/** API 정상 종료 시: 약간 더 길게 한 번 */
export function hapticsApiDone() {
  vibrateStop();
  vibrateOnce(30);
}

/** API 오류 종료 시: 짧-멈-짧 패턴 */
export function hapticsApiError() {
  vibrateStop();
  vibrateOnce([25, 40, 25]);
}
