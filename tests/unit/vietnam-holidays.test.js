const fs = require('fs');
const path = require('path');

describe('Vietnam Holidays 2026 data and lookup logic', () => {
  const assetsJsonPath = path.join(__dirname, '../../assets/data/vietnam_holidays.json');
  const dataJsonPath = path.join(__dirname, '../../_data/vietnam_holidays.json');
  let holidaysData;

  beforeAll(() => {
    const rawAssets = fs.readFileSync(assetsJsonPath, 'utf8');
    const rawData = fs.readFileSync(dataJsonPath, 'utf8');
    expect(rawAssets).toBe(rawData);
    holidaysData = JSON.parse(rawAssets);

    // Load lunar calendar + vietnam-holidays into jsdom window
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => holidaysData
    });

    jest.isolateModules(() => {
      require('../../assets/js/lunar-calendar.js');
      require('../../assets/js/vietnam-holidays.js');
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));
    window.VietnamHolidays._setHolidaysData(holidaysData);
  });

  it('includes Ngày Văn hóa Việt Nam (24/11) as an official public holiday starting from 2026', () => {
    const h2026 = window.VietnamHolidays.getHoliday(24, 11, 2026);
    expect(h2026).not.toBeNull();
    expect(h2026.name).toBe('Ngày Văn hóa Việt Nam');
    expect(h2026.is_public_holiday).toBe(true);
    expect(h2026.duration_days).toBe(1);
    expect(window.VietnamHolidays.isPublicHoliday(24, 11, 2026)).toBe(true);

    // Recurring in 2027+
    const h2027 = window.VietnamHolidays.getHoliday(24, 11, 2027);
    expect(h2027).not.toBeNull();
    expect(h2027.name).toBe('Ngày Văn hóa Việt Nam');
    expect(h2027.is_public_holiday).toBe(true);

    // Not yet active prior to 2026
    expect(window.VietnamHolidays.getHoliday(24, 11, 2025)).toBeNull();
    expect(window.VietnamHolidays.isPublicHoliday(24, 11, 2025)).toBe(false);
  });

  it('marks all official 2026 public holidays, substitute days, and makeup workdays accurately', () => {
    // New Year 2026: Jan 1 + swapped Jan 2 off, Jan 10 makeup workday
    expect(window.VietnamHolidays.isPublicHoliday(1, 1, 2026)).toBe(true);
    expect(window.VietnamHolidays.isPublicHoliday(2, 1, 2026)).toBe(true);
    const jan10 = window.VietnamHolidays.getHoliday(10, 1, 2026);
    expect(jan10.is_workday_swap).toBe(true);
    expect(jan10.is_public_holiday).toBe(false);

    // Lunar New Year 2026 (Bính Ngọ): Feb 16..20 (5 official paid days)
    for (const d of [16, 17, 18, 19, 20]) {
      const tetDay = window.VietnamHolidays.getHoliday(d, 2, 2026);
      expect(tetDay).not.toBeNull();
      expect(tetDay.is_public_holiday).toBe(true);
      expect(tetDay.type).toBe('lunar');
    }

    // Hung Kings' Day 2026: Sun Apr 26 + Mon Apr 27 substitute day off
    expect(window.VietnamHolidays.isPublicHoliday(26, 4, 2026)).toBe(true);
    expect(window.VietnamHolidays.isPublicHoliday(27, 4, 2026)).toBe(true);

    // Apr 30 & May 1
    expect(window.VietnamHolidays.isPublicHoliday(30, 4, 2026)).toBe(true);
    expect(window.VietnamHolidays.isPublicHoliday(1, 5, 2026)).toBe(true);

    // National Day 2026: Aug 31 swapped, Sep 1 adjacent, Sep 2 main, Aug 22 makeup workday
    expect(window.VietnamHolidays.isPublicHoliday(31, 8, 2026)).toBe(true);
    expect(window.VietnamHolidays.isPublicHoliday(1, 9, 2026)).toBe(true);
    expect(window.VietnamHolidays.isPublicHoliday(2, 9, 2026)).toBe(true);
    const aug22 = window.VietnamHolidays.getHoliday(22, 8, 2026);
    expect(aug22.is_workday_swap).toBe(true);
    expect(aug22.is_public_holiday).toBe(false);
  });

  it('computes floating Mother\'s Day and Father\'s Day accurately for 2026 without duplicates', () => {
    // 2026 Mother's Day = 2nd Sunday of May = May 10, 2026 (not hardcoded May 13)
    const mothersDay = window.VietnamHolidays.getHoliday(10, 5, 2026);
    expect(mothersDay).not.toBeNull();
    expect(mothersDay.name).toBe('Ngày của Mẹ');
    expect(window.VietnamHolidays.getHoliday(13, 5, 2026)).toBeNull();

    // 2026 Father's Day = 3rd Sunday of June = June 21, 2026 (coincides with Vietnamese Press Day)
    const june21All = window.VietnamHolidays.getHolidays(21, 6, 2026);
    const names = june21All.map(h => h.name);
    expect(names).toContain('Ngày Báo chí Cách mạng Việt Nam');
    expect(names).toContain('Ngày của Cha');
    expect(window.VietnamHolidays.getHoliday(17, 6, 2026)).toBeNull();

    // 24/11/2026 should not duplicate Ngày Văn hóa Việt Nam between year_schedules and solar_holidays
    const nov24All = window.VietnamHolidays.getHolidays(24, 11, 2026);
    expect(nov24All).toHaveLength(1);
    expect(nov24All[0].name).toBe('Ngày Văn hóa Việt Nam');
  });
});
