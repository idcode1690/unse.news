// app/src/hooks/useEffectOnce.jsx
import { useEffect, useRef } from "react";

/**
 * React 18 개발 모드(StrictMode)에서 mount→unmount→re-mount 시뮬로
 * useEffect가 2회 실행되는 것을 방지하는 가드 훅.
 */
export default function useEffectOnce(effect) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
