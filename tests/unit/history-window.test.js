const { selectHistoryWindow, isIsolatedPoint } = require('../../assets/js/main.js');

const day = (iso) => ({ date: iso, value: iso });

describe('selectHistoryWindow', () => {
  it('keeps entries within N calendar days of the latest entry, not the last N records', () => {
    const history = [day('2026-05-30'), day('2026-05-31'), day('2026-11-21'), day('2026-11-22'), day('2026-11-23')];
    const result = selectHistoryWindow(history, 7);
    expect(result.map(e => e && e.date)).toEqual(['2026-11-21', '2026-11-22', '2026-11-23']);
  });

  it('inserts a null gap marker where consecutive entries are far apart', () => {
    const history = [day('2026-05-31'), day('2026-06-01'), day('2026-11-13'), day('2026-11-14')];
    const result = selectHistoryWindow(history, 365);
    expect(result.map(e => e && e.date)).toEqual(['2026-05-31', '2026-06-01', null, '2026-11-13', '2026-11-14']);
  });

  it('does not treat short gaps (weekends, holidays) as breaks', () => {
    const history = [day('2026-11-06'), day('2026-11-09'), day('2026-11-10')];
    expect(selectHistoryWindow(history, 30)).toHaveLength(3);
  });

  it('accepts full ISO timestamps as dates', () => {
    const history = [day('2026-11-01T17:00:00.000Z'), day('2026-11-20T17:00:00.000Z'), day('2026-11-23T17:00:00.000Z')];
    expect(selectHistoryWindow(history, 7).map(e => e && e.date)).toEqual(['2026-11-20T17:00:00.000Z', '2026-11-23T17:00:00.000Z']);
  });

  it('handles empty or missing input', () => {
    expect(selectHistoryWindow([], 30)).toEqual([]);
    expect(selectHistoryWindow(null, 30)).toEqual([]);
  });
});

describe('isIsolatedPoint', () => {
  it('flags a value with no neighbours on either side', () => {
    const data = [135000, null, 138000, 137500];
    expect(isIsolatedPoint(data, 0)).toBe(true);
    expect(isIsolatedPoint(data, 2)).toBe(false);
    expect(isIsolatedPoint(data, 3)).toBe(false);
  });

  it('ignores gap markers themselves and handles single-value series', () => {
    expect(isIsolatedPoint([null, 1, null], 0)).toBe(false);
    expect(isIsolatedPoint([null, 1, null], 1)).toBe(true);
    expect(isIsolatedPoint([42], 0)).toBe(true);
  });
});

