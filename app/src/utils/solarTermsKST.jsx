// src/utils/solarTermsKST.js
// KST(UTC+9) 기준 24절기 계산 유틸
// - 태양 겉보기 황경(λ) 근사값으로 절입을 판정
// - 외부 라이브러리 없이 동작

const TERMS = [
  '춘분', '청명', '곡우',
  '입하', '소만', '망종',
  '하지', '소서', '대서',
  '입추', '처서', '백로',
  '추분', '한로', '상강',
  '입동', '소설', '대설',
  '동지', '소한', '대한',
  '입춘', '우수', '경칩',
];

function toJulianDay(dateUTC) {
  // JS Date(UTC 순간) → JD
  const t = dateUTC.getTime();          // ms
  return t / 86400000 + 2440587.5;      // Unix epoch → JD
}

function deg2rad(d) {
  return (Math.PI / 180) * d;
}

function norm360(d) {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

// 태양 겉보기 황경 λ (deg) 근사
function solarLongitudeDeg(dateUTC) {
  const JD = toJulianDay(dateUTC);
  const T = (JD - 2451545.0) / 36525.0; // J2000 기준 줄리안 세기

  // 평균 황경 L0, 평균 근점이각 M
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M  = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);

  // 근점이각 보정 항 (Meeus 근사식)
  const Mr = deg2rad(M);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr);

  const trueLong = L0 + C;

  // 겉보기 황경 보정(세차/광행차 근사)
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(deg2rad(omega));

  return norm360(lambda); // 0..360, 0°=춘분
}

// "KST의 y-m-d hh:mm"을 UTC 시각으로 환산
export function makeKSTDateUTC(y, m, d, hh = 0, mm = 0) {
  // UTC = KST - 9h
  return new Date(Date.UTC(y, m - 1, d, hh - 9, mm, 0));
}

// KST 기준 절기 정보 반환
export function getSolarTermKST(dateKST_UTC) {
  // 인자로 받는 Date는 "KST 시각을 UTC로 환산한 값"이어야 합니다.
  const lambda = solarLongitudeDeg(dateKST_UTC);     // 0°=춘분
  const index = Math.floor(lambda / 15) % 24;        // 각 15° 구간
  const name = TERMS[index];

  return {
    index,           // 0..23
    name,            // 절기명
    lambda,          // 황경(deg)
    at: new Date(dateKST_UTC.getTime() + 9 * 3600000), // 표시용 KST Date
  };
}
