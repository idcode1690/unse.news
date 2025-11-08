import { 
  setCookie, getCookie, deleteCookie, 
  saveFormDataToCookie, loadFormDataFromCookie, 
  saveCalculationDataToCookie, loadCalculationDataFromCookie,
  clearCalculationDataCookie
} from './cookieUtils';

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('Cookie Utils', () => {
  beforeEach(() => {
    // 각 테스트 전에 모든 쿠키 삭제
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
  });

  describe('setCookie and getCookie', () => {
    test('sets and gets a simple string value', () => {
      setCookie('testString', 'hello world');
      expect(getCookie('testString')).toBe('hello world');
    });

    test('sets and gets an object value', () => {
      const testObject = { name: 'test', value: 123, nested: { prop: 'value' } };
      setCookie('testObject', testObject);
      expect(getCookie('testObject')).toEqual(testObject);
    });

    test('returns null for non-existent cookie', () => {
      expect(getCookie('nonExistent')).toBeNull();
    });

    test('sets and gets an array value', () => {
      const testArray = ['item1', 'item2', { key: 'value' }];
      setCookie('testArray', testArray);
      expect(getCookie('testArray')).toEqual(testArray);
    });

    test('handles boolean values', () => {
      setCookie('testBool', true);
      expect(getCookie('testBool')).toBe(true);
      
      setCookie('testBoolFalse', false);
      expect(getCookie('testBoolFalse')).toBe(false);
    });

    test('handles number values', () => {
      setCookie('testNumber', 42);
      expect(getCookie('testNumber')).toBe(42);
      
      setCookie('testFloat', 3.14);
      expect(getCookie('testFloat')).toBe(3.14);
    });
  });

  describe('deleteCookie', () => {
    test('deletes an existing cookie', () => {
      setCookie('toDelete', 'value');
      expect(getCookie('toDelete')).toBe('value');
      
      deleteCookie('toDelete');
      expect(getCookie('toDelete')).toBeNull();
    });

    test('gracefully handles deleting non-existent cookie', () => {
      expect(() => deleteCookie('nonExistent')).not.toThrow();
    });
  });

  describe('Form data specific functions', () => {
    test('saves and loads form data', () => {
      const formData = {
        calendar: 'lunar',
        year: '1990',
        month: '5',
        day: '15',
        hour: '14',
        minute: 30,
        gender: 'female',
        leapMonth: 'common'
      };

      saveFormDataToCookie(formData);
      const loadedData = loadFormDataFromCookie();
      
      expect(loadedData).toEqual(formData);
    });

    test('saves and loads form data with MBTI', () => {
      const formData = {
        calendar: 'lunar',
        year: '1990',
        month: '5',
        day: '15',
        hour: '14',
        minute: 30,
        gender: 'female',
        leapMonth: 'common',
        mbti: 'INFP'
      };

      saveFormDataToCookie(formData);
      const loadedData = loadFormDataFromCookie();
      
      expect(loadedData).toEqual(formData);
      expect(loadedData.mbti).toBe('INFP');
    });

    test('saves and loads form data with empty MBTI', () => {
      const formData = {
        calendar: 'solar',
        year: '1985',
        month: '8',
        day: '20',
        hour: '10',
        minute: 0,
        gender: 'male',
        leapMonth: 'common',
        mbti: ''
      };

      saveFormDataToCookie(formData);
      const loadedData = loadFormDataFromCookie();
      
      expect(loadedData).toEqual(formData);
      expect(loadedData.mbti).toBe('');
    });

    test('returns null when no form data is saved', () => {
      expect(loadFormDataFromCookie()).toBeNull();
    });

    test('overwrites existing form data', () => {
      const firstData = { calendar: 'solar', year: '1980', mbti: 'INTJ' };
      const secondData = { calendar: 'lunar', year: '1990', mbti: 'ENFP' };

      saveFormDataToCookie(firstData);
      saveFormDataToCookie(secondData);
      
      expect(loadFormDataFromCookie()).toEqual(secondData);
    });
  });

  describe('Calculation data specific functions', () => {
    test('saves and loads calculation data', () => {
      const calculationData = {
        calendar: 'lunar',
        year: '1985',
        month: '3',
        day: '20',
        hour: '16',
        minute: '45',
        gender: 'male',
        leapMonth: 'leap'
      };

      saveCalculationDataToCookie(calculationData);
      const loadedData = loadCalculationDataFromCookie();
      
      expect(loadedData).toEqual(calculationData);
    });

    test('saves and loads calculation data with MBTI', () => {
      const calculationData = {
        calendar: 'lunar',
        year: '1985',
        month: '3',
        day: '20',
        hour: '16',
        minute: '45',
        gender: 'male',
        leapMonth: 'leap',
        mbti: 'ESTJ'
      };

      saveCalculationDataToCookie(calculationData);
      const loadedData = loadCalculationDataFromCookie();
      
      expect(loadedData).toEqual(calculationData);
      expect(loadedData.mbti).toBe('ESTJ');
    });

    test('returns null when no calculation data is saved', () => {
      expect(loadCalculationDataFromCookie()).toBeNull();
    });

    test('clears calculation data', () => {
      const calculationData = { calendar: 'solar', year: '1990', mbti: 'INFJ' };
      
      saveCalculationDataToCookie(calculationData);
      expect(loadCalculationDataFromCookie()).toEqual(calculationData);
      
      clearCalculationDataCookie();
      expect(loadCalculationDataFromCookie()).toBeNull();
    });

    test('calculation data and form data are independent', () => {
      const formData = { calendar: 'lunar', year: '1980', mbti: 'ISTP' };
      const calculationData = { calendar: 'solar', year: '1990', mbti: 'ESFP' };

      saveFormDataToCookie(formData);
      saveCalculationDataToCookie(calculationData);
      
      expect(loadFormDataFromCookie()).toEqual(formData);
      expect(loadCalculationDataFromCookie()).toEqual(calculationData);
      
      clearCalculationDataCookie();
      expect(loadFormDataFromCookie()).toEqual(formData);
      expect(loadCalculationDataFromCookie()).toBeNull();
    });
  });

  describe('MBTI specific tests', () => {
    test('handles all MBTI types correctly', () => {
      const mbtiTypes = [
        'INTJ', 'INTP', 'ENTJ', 'ENTP',
        'INFJ', 'INFP', 'ENFJ', 'ENFP',
        'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
        'ISTP', 'ISFP', 'ESTP', 'ESFP'
      ];

      mbtiTypes.forEach(mbti => {
        const testData = { mbti, calendar: 'lunar', year: '1990' };
        setCookie('testMBTI', testData);
        const loaded = getCookie('testMBTI');
        expect(loaded.mbti).toBe(mbti);
      });
    });

    test('handles mixed case MBTI values', () => {
      const testData = { mbti: 'infp', calendar: 'solar' };
      setCookie('testMBTI', testData);
      const loaded = getCookie('testMBTI');
      expect(loaded.mbti).toBe('infp');
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles empty values', () => {
      setCookie('empty', '');
      expect(getCookie('empty')).toBe('');
      
      setCookie('null', null);
      expect(getCookie('null')).toBe(null);
    });

    test('handles undefined values', () => {
      setCookie('undefined', undefined);
      expect(getCookie('undefined')).toBe(undefined);
    });

    test('handles special characters in cookie names', () => {
      setCookie('test-name_123', 'value');
      expect(getCookie('test-name_123')).toBe('value');
    });

    test('handles complex nested objects with MBTI', () => {
      const complexData = {
        user: {
          profile: {
            mbti: 'ENFJ',
            preferences: ['music', 'books']
          }
        },
        formData: {
          calendar: 'lunar',
          mbti: 'ISFJ'
        }
      };

      setCookie('complex', complexData);
      const loaded = getCookie('complex');
      expect(loaded).toEqual(complexData);
      expect(loaded.user.profile.mbti).toBe('ENFJ');
      expect(loaded.formData.mbti).toBe('ISFJ');
    });
  });
});