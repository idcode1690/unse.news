import { clamp, mod, daysInSolarMonth } from './lunarCalendar';

describe('Lunar Calendar Utils', () => {
  describe('clamp function', () => {
    test('returns value when within range', () => {
      expect(clamp(5, 1, 10)).toBe(5);
    });

    test('returns min when value is below range', () => {
      expect(clamp(-1, 1, 10)).toBe(1);
    });

    test('returns max when value is above range', () => {
      expect(clamp(15, 1, 10)).toBe(10);
    });

    test('works with equal min and max', () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe('mod function', () => {
    test('returns correct modulo for positive numbers', () => {
      expect(mod(5, 3)).toBe(2);
      expect(mod(7, 3)).toBe(1);
      expect(mod(9, 3)).toBe(0);
    });

    test('returns correct modulo for negative numbers', () => {
      expect(mod(-1, 3)).toBe(2);
      expect(mod(-4, 3)).toBe(2);
      expect(mod(-7, 3)).toBe(2);
    });

    test('handles zero correctly', () => {
      expect(mod(0, 3)).toBe(0);
    });
  });

  describe('daysInSolarMonth function', () => {
    test('returns correct days for regular months', () => {
      expect(daysInSolarMonth(2023, 1)).toBe(31); // January
      expect(daysInSolarMonth(2023, 4)).toBe(30); // April
      expect(daysInSolarMonth(2023, 6)).toBe(30); // June
      expect(daysInSolarMonth(2023, 12)).toBe(31); // December
    });

    test('returns correct days for February in non-leap year', () => {
      expect(daysInSolarMonth(2023, 2)).toBe(28);
    });

    test('returns correct days for February in leap year', () => {
      expect(daysInSolarMonth(2024, 2)).toBe(29);
      expect(daysInSolarMonth(2020, 2)).toBe(29);
    });

    test('handles century years correctly', () => {
      expect(daysInSolarMonth(1900, 2)).toBe(28); // Not a leap year
      expect(daysInSolarMonth(2000, 2)).toBe(29); // Leap year
    });
  });
});