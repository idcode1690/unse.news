// src/utils/zodiac.jsx
// Lunar New Year boundary based zodiac (띠) determination.
// If solar birth date precedes that year's Lunar New Year (음력 1월 1일), use previous year.
// Otherwise use birth year. Returns Korean animal label like '용띠'.

import { lunarToSolar } from './lunarCalendar';

// Branch order anchored at 1984 (甲子, Rat/자) per existing pillar base.
const BRANCHES_HAN = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const BRANCH_TO_ANIMAL = {
  '子': '쥐띠', '丑': '소띠', '寅': '호랑이띠', '卯': '토끼띠', '辰': '용띠', '巳': '뱀띠',
  '午': '말띠', '未': '양띠', '申': '원숭이띠', '酉': '닭띠', '戌': '개띠', '亥': '돼지띠'
};

function zodiacYearBoundaryAdjusted(year, month, day) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  try {
    const ny = lunarToSolar(year, 1, 1, false);
    const nyY = ny.getFullYear(); // should equal year
    const nyM = ny.getMonth() + 1;
    const nyD = ny.getDate();
    // 출생일이 설날 이전이면 전년도, 설날 당일 및 이후는 해당년도
    if (month < nyM || (month === nyM && day < nyD)) return year - 1;
    return year;
  } catch {
    return year; // 실패 시 보수적으로 해당년도
  }
}

export function getZodiacAnimal(year, month, day) {
  const zy = zodiacYearBoundaryAdjusted(year, month, day);
  if (zy == null) return '—';
  const branch = BRANCHES_HAN[((zy - 1984) % 12 + 12) % 12];
  return BRANCH_TO_ANIMAL[branch] || '—';
}

export function getZodiacBranch(year, month, day) {
  const zy = zodiacYearBoundaryAdjusted(year, month, day);
  if (zy == null) return null;
  return BRANCHES_HAN[((zy - 1984) % 12 + 12) % 12];
}
