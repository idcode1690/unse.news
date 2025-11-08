import { LUNAR_MONTH_DAYS, LUNAR_SOLAR_CHECKPOINTS } from './constants';

// Gregorian to Julian Day Number (JDN)
export function toJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

// 음력을 양력으로 변환
export function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap = false) {
  // 체크포인트에서 정확한 변환값이 있는지 확인
  const cp = LUNAR_SOLAR_CHECKPOINTS.find(x =>
    x.lunar.year === lunarYear && x.lunar.month === lunarMonth &&
    x.lunar.day === lunarDay && x.lunar.isLeap === isLeap
  );
  if (cp) return new Date(cp.solar.year, cp.solar.month - 1, cp.solar.day);

  // 범위를 벗어나면 근사치 계산
  if (lunarYear < 1900 || lunarYear > 2029) {
    const approx = new Date(lunarYear, lunarMonth - 1, lunarDay);
    approx.setDate(approx.getDate() + 30);
    return approx;
  }

  let totalDays = 0;
  for (let y = 1900; y < lunarYear; y++) {
    totalDays += getYearDays(y);
  }

  const leapMonth = getLeapMonth(lunarYear);
  for (let m = 1; m < lunarMonth; m++) {
    totalDays += getMonthDays(lunarYear, m);
    if (m === leapMonth && !isLeap) {
      totalDays += getLeapMonthDays(lunarYear);
    }
  }

  if (isLeap && lunarMonth === leapMonth) {
    totalDays += getMonthDays(lunarYear, lunarMonth);
  }

  totalDays += (lunarDay - 1);
  const base = new Date(1900, 0, 31); // 음력 1900.1.1 = 양력 1900.1.31
  return new Date(base.getTime() + totalDays * 86400000);
}

export function getYearDays(year) {
  let sum = 348;
  const data = LUNAR_MONTH_DAYS[year - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (data & i) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

export function getMonthDays(year, month) {
  const data = LUNAR_MONTH_DAYS[year - 1900];
  return (data & (0x10000 >> month)) ? 30 : 29;
}

export function getLeapMonth(year) {
  return LUNAR_MONTH_DAYS[year - 1900] & 0xf;
}

export function getLeapMonthDays(year) {
  if (getLeapMonth(year)) {
    return (LUNAR_MONTH_DAYS[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

// 날짜 범위 유틸리티
export function daysInSolarMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export function mod(a, b) {
  return ((a % b) + b) % b;
}