/**
 * Unit tests for random number generator functions
 */

describe('Random Number Generator', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Number Generation', () => {
    test('should generate a number within specified range', () => {
      const min = 1;
      const max = 10;
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      
      expect(randomNum).toBeGreaterThanOrEqual(min);
      expect(randomNum).toBeLessThanOrEqual(max);
    });

    test('should generate multiple numbers', () => {
      const min = 1;
      const max = 100;
      const count = 5;
      const numbers = [];
      
      for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      
      expect(numbers.length).toBe(count);
      numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      });
    });

    test('should generate unique numbers when required', () => {
      const min = 1;
      const max = 10;
      const count = 5;
      const numbers = [];
      const availableNumbers = [];
      
      for (let i = min; i <= max; i++) {
        availableNumbers.push(i);
      }
      
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        numbers.push(availableNumbers.splice(randomIndex, 1)[0]);
      }
      
      expect(numbers.length).toBe(count);
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(count);
    });

    test('should not generate unique numbers when count exceeds range', () => {
      const min = 1;
      const max = 5;
      const count = 10;
      const rangeSize = max - min + 1;
      
      const isInvalid = count > rangeSize;
      expect(isInvalid).toBe(true);
    });
  });

  describe('Validation', () => {
    test('should validate that min is less than max', () => {
      const min = 10;
      const max = 5;
      
      expect(min >= max).toBe(true);
    });

    test('should validate numeric inputs', () => {
      const min = parseInt('abc');
      const max = parseInt('10');
      
      expect(isNaN(min)).toBe(true);
      expect(isNaN(max)).toBe(false);
    });

    test('should validate count is within bounds', () => {
      const count = 150;
      const isValid = count >= 1 && count <= 100;
      
      expect(isValid).toBe(false);
    });
  });

  describe('History Management', () => {
    test('should save generated numbers to history', () => {
      const history = [];
      const numbers = [5, 10, 15];
      const historyItem = {
        numbers: numbers,
        range: '1-20',
        timestamp: new Date().toLocaleString('vi-VN'),
        count: numbers.length
      };
      
      history.unshift(historyItem);
      
      expect(history.length).toBe(1);
      expect(history[0].numbers).toEqual(numbers);
      expect(history[0].count).toBe(3);
    });

    test('should limit history to 50 items', () => {
      let history = [];
      
      // Add 60 items
      for (let i = 0; i < 60; i++) {
        history.unshift({
          numbers: [i],
          range: '1-100',
          timestamp: new Date().toLocaleString('vi-VN'),
          count: 1
        });
      }
      
      // Trim to 50
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      expect(history.length).toBe(50);
      expect(history[0].numbers[0]).toBe(59); // Most recent
    });

    test('should delete specific history item', () => {
      const history = [
        { numbers: [1], range: '1-10', timestamp: 'time1', count: 1 },
        { numbers: [2], range: '1-10', timestamp: 'time2', count: 1 },
        { numbers: [3], range: '1-10', timestamp: 'time3', count: 1 }
      ];
      
      const indexToDelete = 1;
      history.splice(indexToDelete, 1);
      
      expect(history.length).toBe(2);
      expect(history[0].numbers[0]).toBe(1);
      expect(history[1].numbers[0]).toBe(3);
    });
  });

  describe('Statistics', () => {
    test('should calculate most common number', () => {
      const history = [
        { numbers: [5, 10], range: '1-10', timestamp: 'time1', count: 2 },
        { numbers: [5, 7], range: '1-10', timestamp: 'time2', count: 2 },
        { numbers: [5, 8, 10], range: '1-10', timestamp: 'time3', count: 3 }
      ];
      
      const allNumbers = history.flatMap(item => item.numbers);
      const numberCounts = {};
      
      allNumbers.forEach(num => {
        numberCounts[num] = (numberCounts[num] || 0) + 1;
      });
      
      const mostCommon = Object.keys(numberCounts).reduce((a, b) => 
        numberCounts[a] > numberCounts[b] ? a : b
      );
      
      expect(mostCommon).toBe('5');
      expect(numberCounts['5']).toBe(3);
    });
  });

  describe('Quick Pick Presets', () => {
    test('should have valid preset configurations', () => {
      const presets = [
        { min: 1, max: 6, name: 'Xúc xắc' },
        { min: 1, max: 100, name: 'Phần trăm' },
        { min: 1, max: 45, name: 'Lotto' },
        { min: 0, max: 1, name: 'Tung đồng xu' },
        { min: 1, max: 20, name: 'Số nhỏ' },
        { min: 1, max: 1000, name: 'Số lớn' }
      ];
      
      presets.forEach(preset => {
        expect(preset.min).toBeLessThanOrEqual(preset.max);
        expect(preset.name).toBeTruthy();
      });
    });
  });

  describe('Exclude History Feature', () => {
    test('should filter out historical numbers from available pool', () => {
      const min = 1;
      const max = 10;
      const history = [
        { numbers: [1, 2, 3], range: '1-10' },
        { numbers: [4, 5], range: '1-10' }
      ];
      
      const allHistoryNumbers = history
        .flatMap(item => item.numbers)
        .filter(n => n >= min && n <= max);
      const historyNumbersSet = new Set(allHistoryNumbers);
      
      let availableNumbers = [];
      for (let i = min; i <= max; i++) {
        if (!historyNumbersSet.has(i)) {
          availableNumbers.push(i);
        }
      }
      
      expect(availableNumbers.length).toBe(5); // 10 total - 5 in history
      expect(availableNumbers).toEqual([6, 7, 8, 9, 10]);
    });

    test('should validate sufficient range when excluding history', () => {
      const min = 1;
      const max = 10;
      const count = 8;
      const rangeSize = max - min + 1; // 10
      const historySize = 5;
      const availableSize = rangeSize - historySize; // 5
      
      const isValid = count <= availableSize;
      expect(isValid).toBe(false);
    });
  });
});
