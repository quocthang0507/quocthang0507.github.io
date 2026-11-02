const {
  parseLocalDate,
  toInputValue,
  daysBetween,
  ymdBetween,
  shiftDate,
  getDayOfYear
} = require('../../assets/js/date-calculator.js');

describe('date-calculator helpers', () => {
  test('parseLocalDate keeps the calendar day regardless of timezone', () => {
    const d = parseLocalDate('2024-03-05');
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(5);
    expect(toInputValue(d)).toBe('2024-03-05');
  });

  test('ymdBetween borrows days from the previous month', () => {
    expect(ymdBetween(parseLocalDate('2024-01-10'), parseLocalDate('2024-03-15')))
      .toEqual({ years: 0, months: 2, days: 5 });
    expect(ymdBetween(parseLocalDate('2023-12-31'), parseLocalDate('2024-03-01')))
      .toEqual({ years: 0, months: 2, days: 1 });
  });

  test('shiftDate clamps to the end of shorter months', () => {
    expect(toInputValue(shiftDate(parseLocalDate('2024-01-31'), 0, 1, 0))).toBe('2024-02-29');
    expect(toInputValue(shiftDate(parseLocalDate('2023-01-31'), 0, 1, 0))).toBe('2023-02-28');
    expect(toInputValue(shiftDate(parseLocalDate('2024-03-31'), 0, -1, 0))).toBe('2024-02-29');
    expect(toInputValue(shiftDate(parseLocalDate('2024-02-29'), 1, 0, 0))).toBe('2025-02-28');
    expect(toInputValue(shiftDate(parseLocalDate('2024-01-01'), 0, -1, -1))).toBe('2023-11-30');
  });

  test('daysBetween counts whole calendar days', () => {
    expect(daysBetween(parseLocalDate('2024-01-01'), parseLocalDate('2025-01-01'))).toBe(366);
    expect(daysBetween(parseLocalDate('2024-03-10'), parseLocalDate('2024-03-01'))).toBe(-9);
  });

  test('getDayOfYear', () => {
    expect(getDayOfYear(parseLocalDate('2024-01-01'))).toBe(1);
    expect(getDayOfYear(parseLocalDate('2024-12-31'))).toBe(366);
  });
});
