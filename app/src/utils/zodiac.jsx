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

// 권위있는 음력 설날(음력 1월 1일) 양력 날짜 테이블 (1900~2030)
// 출처: 일반 공개 천문/달력 자료 집계 (중국/한국 음력 동일 기준) 
// 형식: year: 'YYYY-MM-DD' (Gregorian)
const LUNAR_NY_TABLE = {
  1984:'1984-02-02',1985:'1985-02-20',1986:'1986-02-09',1987:'1987-01-29',1988:'1988-02-17',1989:'1989-02-06',
  1990:'1990-01-27',1991:'1991-02-15',1992:'1992-02-04',1993:'1993-01-23',1994:'1994-02-10',1995:'1995-01-31',
  1996:'1996-02-19',1997:'1997-02-07',1998:'1998-01-28',1999:'1999-02-16',2000:'2000-02-05',2001:'2001-01-24',
  2002:'2002-02-12',2003:'2003-02-01',2004:'2004-01-22',2005:'2005-02-09',2006:'2006-01-29',2007:'2007-02-18',
  2008:'2008-02-07',2009:'2009-01-26',2010:'2010-02-14',2011:'2011-02-03',2012:'2012-01-23',2013:'2013-02-10',
  2014:'2014-01-31',2015:'2015-02-19',2016:'2016-02-08',2017:'2017-01-28',2018:'2018-02-16',2019:'2019-02-05',
  2020:'2020-01-25',2021:'2021-02-12',2022:'2022-02-01',2023:'2023-01-22',2024:'2024-02-10',2025:'2025-01-29',
  2026:'2026-02-17',2027:'2027-02-06',2028:'2028-01-26',2029:'2029-02-13',2030:'2030-02-03'
};

function parseYMD(ymd){
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(!m) return null;
  return { y:Number(m[1]), m:Number(m[2]), d:Number(m[3]) };
}

function zodiacYearBoundaryAdjusted(year, month, day) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  // 1) 신뢰도 높은 테이블 우선
  const nyStr = LUNAR_NY_TABLE[year];
  if (nyStr) {
    const ny = parseYMD(nyStr);
    if (ny) {
      if (month < ny.m || (month === ny.m && day < ny.d)) return year - 1; // 설날 이전
      return year; // 설날 당일 포함 이후
    }
  }
  // 2) 테이블 없거나 파싱 실패 → 기존 근사 변환 사용(안전망)
  try {
    const nyDate = lunarToSolar(year,1,1,false);
    const nyM = nyDate.getMonth() + 1; const nyD = nyDate.getDate();
    if (month < nyM || (month === nyM && day < nyD)) return year - 1;
    return year;
  } catch {
    return year;
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
