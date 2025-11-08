// 천간, 지지
export const STEMS_HAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
export const BRANCHES_HAN = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

// 오행 매핑
export const FIVE = {
  "甲":"oh-wood","乙":"oh-wood","丙":"oh-fire","丁":"oh-fire","戊":"oh-earth","己":"oh-earth",
  "庚":"oh-metal","辛":"oh-metal","壬":"oh-water","癸":"oh-water",
  "子":"oh-water","丑":"oh-earth","寅":"oh-wood","卯":"oh-wood","辰":"oh-earth","巳":"oh-fire",
  "午":"oh-fire","未":"oh-earth","申":"oh-metal","酉":"oh-metal","戌":"oh-earth","亥":"oh-water"
};

// 오행 이름 매핑
export const ELEMENT_NAMES = { 
  "oh-wood":"목(木)","oh-fire":"화(火)","oh-earth":"토(土)","oh-metal":"금(金)","oh-water":"수(水)" 
};

// MBTI 목록
export const MBTI_TYPES = [
  { value: '', label: 'MBTI 선택' },
  { value: 'INTJ', label: 'INTJ - 건축가' },
  { value: 'INTP', label: 'INTP - 논리술사' },
  { value: 'ENTJ', label: 'ENTJ - 통솔자' },
  { value: 'ENTP', label: 'ENTP - 토론자' },
  { value: 'INFJ', label: 'INFJ - 옹호자' },
  { value: 'INFP', label: 'INFP - 중재자' },
  { value: 'ENFJ', label: 'ENFJ - 선도자' },
  { value: 'ENFP', label: 'ENFP - 활동가' },
  { value: 'ISTJ', label: 'ISTJ - 현실주의자' },
  { value: 'ISFJ', label: 'ISFJ - 수호자' },
  { value: 'ESTJ', label: 'ESTJ - 경영자' },
  { value: 'ESFJ', label: 'ESFJ - 집정관' },
  { value: 'ISTP', label: 'ISTP - 만능재주꾼' },
  { value: 'ISFP', label: 'ISFP - 모험가' },
  { value: 'ESTP', label: 'ESTP - 사업가' },
  { value: 'ESFP', label: 'ESFP - 연예인' }
];

// 24절기 정보 (근사 경계)
export const SOLAR_TERMS = [
  { name: "소한", month: 1, approxDay: 5 },
  { name: "대한", month: 1, approxDay: 20 },
  { name: "입춘", month: 2, approxDay: 4 },
  { name: "우수", month: 2, approxDay: 19 },
  { name: "경칩", month: 3, approxDay: 5 },
  { name: "춘분", month: 3, approxDay: 20 },
  { name: "청명", month: 4, approxDay: 4 },
  { name: "곡우", month: 4, approxDay: 20 },
  { name: "입하", month: 5, approxDay: 5 },
  { name: "소만", month: 5, approxDay: 21 },
  { name: "망종", month: 6, approxDay: 5 },
  { name: "하지", month: 6, approxDay: 21 },
  { name: "소서", month: 7, approxDay: 7 },
  { name: "대서", month: 7, approxDay: 22 },
  { name: "입추", month: 8, approxDay: 7 },
  { name: "처서", month: 8, approxDay: 23 },
  { name: "백로", month: 9, approxDay: 7 },
  { name: "추분", month: 9, approxDay: 23 },
  { name: "한로", month: 10, approxDay: 8 },
  { name: "상강", month: 10, approxDay: 23 },
  { name: "입동", month: 11, approxDay: 7 },
  { name: "소설", month: 11, approxDay: 22 },
  { name: "대설", month: 12, approxDay: 7 },
  { name: "동지", month: 12, approxDay: 21 }
];

// 음력 데이터 - 1900-2029
export const LUNAR_MONTH_DAYS = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530
];

export const LUNAR_SOLAR_CHECKPOINTS = [
  { lunar: {year: 1980, month: 2, day: 11, isLeap: false}, solar: {year: 1980, month: 3, day: 27} },
  { lunar: {year: 2000, month: 1, day: 1, isLeap: false}, solar: {year: 2000, month: 2, day: 5} },
  { lunar: {year: 2024, month: 1, day: 1, isLeap: false}, solar: {year: 2024, month: 2, day: 10} }
];

// JDN 앵커 (1912-02-18 = 甲子일)
export const JDN_ANCHOR_DATE = { year: 1912, month: 2, day: 18 };

// 기본값
export const DEFAULT_VALUES = {
  calendar: 'lunar',
  year: '1980',
  month: '2',
  day: '11',
  hour: '13',
  minute: 10,
  gender: 'male',
  leapMonth: 'common',
  mbti: ''
};