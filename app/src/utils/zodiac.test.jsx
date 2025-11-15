import { describe, it, expect } from 'vitest';
import { getZodiacAnimal, getZodiacBranch } from './zodiac.jsx';
import { lunarToSolar } from './lunarCalendar.jsx';

// Helper to derive lunar new year solar date for a year
function solarLunarNY(year){
  const d = lunarToSolar(year,1,1,false);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

describe('zodiac (띠) calculation', () => {
  it('returns animal for a mid-year date (2024-06-15 → 2024 Dragon year)', () => {
    expect(getZodiacAnimal(2024,6,15)).toBe('용띠');
  });

  it('switches after lunar new year (2024 Feb after Feb 10 is 용띠)', () => {
    // 2024 lunar new year known: Feb 10 2024
    expect(getZodiacAnimal(2024,2,15)).toBe('용띠');
  });

  it('before lunar new year uses previous year (2024 Jan 30 still 토끼띠)', () => {
    expect(getZodiacAnimal(2024,1,30)).toBe('토끼띠');
  });
  
  it('1992 mid year is Monkey', () => {
    expect(getZodiacAnimal(1992,6,10)).toBe('원숭이띠');
  });
  it('1992 Jan 15 still Sheep', () => {
    expect(getZodiacAnimal(1992,1,15)).toBe('양띠');
  });

  it('boundary day: day before lunar NY 2025 (expected Dragon)', () => {
    const ny2025 = solarLunarNY(2025); // e.g., Jan 29 2025
    const dayBefore = new Date(ny2025.getFullYear(), ny2025.getMonth(), ny2025.getDate()-1);
    expect(getZodiacAnimal(dayBefore.getFullYear(), dayBefore.getMonth()+1, dayBefore.getDate())).toBe('용띠');
  });

  it('boundary day: day of lunar NY 2025 (Snake)', () => {
    const ny2025 = solarLunarNY(2025);
    expect(getZodiacAnimal(ny2025.getFullYear(), ny2025.getMonth()+1, ny2025.getDate())).toBe('뱀띠');
  });

  it('returns branch code parity with animal mapping', () => {
    const branch = getZodiacBranch(2024,6,15);
    expect(['辰']).toContain(branch); // Dragon branch
  });

  it('invalid input returns placeholder', () => {
    expect(getZodiacAnimal(NaN,2,10)).toBe('—');
    expect(getZodiacBranch(NaN,2,10)).toBeNull();
  });
});
