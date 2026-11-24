const fs = require('fs');
const path = require('path');

describe('Shared CalendarCore engine & Weekly/Monthly/Yearly calendar views', () => {
  const rootDir = path.join(__dirname, '../..');
  let holidaysData;

  beforeAll(() => {
    holidaysData = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'assets/data/vietnam_holidays.json'), 'utf8')
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => holidaysData
    });

    const domLoadedCallbacks = [];
    const origAdd = document.addEventListener.bind(document);
    const addSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'DOMContentLoaded') domLoadedCallbacks.push(fn);
      else origAdd(type, fn, opts);
    });
    try {
      jest.isolateModules(() => {
        require('../../assets/js/lunar-calendar.js');
        require('../../assets/js/vietnam-holidays.js');
        require('../../assets/js/calendar-core.js');
      });
    } finally {
      addSpy.mockRestore();
    }
    domLoadedCallbacks.forEach(fn => fn());
    window.VietnamHolidays._setHolidaysData(holidaysData);
  });

  it('computes accurate 2026 Bính Ngọ overview matching Vietnamese lunar calendar standards', () => {
    const overview2026 = window.CalendarCore.getYearOverview(2026);
    expect(overview2026.year).toBe(2026);
    expect(overview2026.canChi).toBe('Bính Ngọ');
    expect(overview2026.napAm.name).toBe('Thiên Hà Thủy');
    expect(overview2026.napAm.meaning).toBe('Nước trên trời');
    expect(overview2026.totalSolarDays).toBe(365);
    expect(overview2026.leapMonth).toBeNull();

    // Lunar year 2026 spans 17/02/2026 -> 05/02/2027
    expect(overview2026.tetSolar).not.toBeNull();
    expect(overview2026.tetSolar.day).toBe(17);
    expect(overview2026.tetSolar.month).toBe(2);
    expect(overview2026.lunarYearEndSolar).toEqual({ day: 5, month: 2, year: 2027 });

    // Includes Nov 24 Vietnamese Culture Day in 2026 public holidays
    const hasCultureDay = overview2026.publicHolidays.some(
      info => info.day === 24 && info.month === 11 && info.holiday.name === 'Ngày Văn hóa Việt Nam'
    );
    expect(hasCultureDay).toBe(true);

    // 2025 has lunar leap month 6 (Ất Tỵ nhuận tháng 6)
    const overview2025 = window.CalendarCore.getYearOverview(2025);
    expect(overview2025.canChi).toBe('Ất Tỵ');
    expect(overview2025.leapMonth).toBe(6);
  });

  it('computes ISO week dates (Mon–Sun) and renders shared month grid with holidays & good/bad dots', () => {
    const week = window.CalendarCore.getWeekDates(new Date(2026, 10, 24), 1);
    expect(week).toHaveLength(7);
    expect(week[0].getDate()).toBe(23); // Monday Nov 23, 2026
    expect(week[6].getDate()).toBe(29); // Sunday Nov 29, 2026
    expect(window.CalendarCore.computeISOWeek(week[0])).toBe(48);

    const html = window.CalendarCore.renderMonthTableHTML(2026, 11, {
      weekStartsOn: 1,
      showWeekNumbers: true,
      showGoodBad: true,
      showHolidayLabels: true
    });
    expect(html).toContain('calendar-table-detailed');
    expect(html).toContain('data-date="24" data-month="11" data-year="2026"');
    expect(html).toContain('public-holiday');
    expect(html).toContain('Ngày Văn hóa Việt Nam');
    expect(html).toContain('day-auspicious-dot');
  });

  it('renders the Yearly Calendar 12-month grid and overview banner via calendar-views.js', () => {
    window.history.replaceState({}, '', '/yearly-calendar/?year=2026');
    document.body.innerHTML = `
      <div data-calendar-view="year" data-monthly-url="/monthly-calendar/">
        <button id="yearly-prev-btn"></button>
        <button id="yearly-current-btn"></button>
        <button id="yearly-next-btn"></button>
        <select id="yearly-year-select"></select>
        <select id="yearly-filter"><option value="all">All</option><option value="holidays">Holidays</option></select>
        <div id="yearly-overview-banner"></div>
        <div id="yearly-months-grid"></div>
        <div id="yearly-public-holidays"></div>
        <div id="yearly-lunar-events"></div>
      </div>
    `;

    const domLoadedCallbacks = [];
    const origAdd = document.addEventListener.bind(document);
    const addSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'DOMContentLoaded') domLoadedCallbacks.push(fn);
      else origAdd(type, fn, opts);
    });
    try {
      jest.isolateModules(() => {
        require('../../assets/js/calendar-views.js');
      });
    } finally {
      addSpy.mockRestore();
    }
    domLoadedCallbacks.forEach(fn => fn());

    expect(document.getElementById('yearly-overview-banner').textContent).toContain('Bính Ngọ');
    expect(document.getElementById('yearly-overview-banner').textContent).toContain('Thiên Hà Thủy');
    expect(document.querySelectorAll('.year-month-card')).toHaveLength(12);
    expect(document.getElementById('yearly-public-holidays').textContent).toContain('Ngày Văn hóa Việt Nam');
  });

  it('computes exact traditional Vietnamese Lịch Bloc details (verified against Jan 6, 2027 printed bloc)', () => {
    // Jan 6, 2027 = 29/11 Bính Ngọ, Ngày Ất Dậu, Tháng Canh Tý, Giờ Bính Tý,
    // Giờ Hoàng Đạo: Tý, Dần, Mão, Ngọ, Mùi, Dậu
    const bloc = window.CalendarCore.getBlocDetails(6, 1, 2027);
    expect(bloc.lunar.day).toBe(29);
    expect(bloc.lunar.month).toBe(11);
    expect(bloc.dayCanChi).toBe('Ất Dậu');
    expect(bloc.monthCanChi).toBe('Canh Tý');
    expect(bloc.yearCanChi).toBe('Bính Ngọ');
    expect(bloc.firstHourCanChi).toBe('Bính Tý');
    expect(bloc.dayZodiac.chi).toBe('Dậu');
    expect(bloc.hoangDaoHours.map(h => h.chi)).toEqual(['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu']);
    expect(bloc.photo.url).toContain('upload.wikimedia.org/wikipedia/commons/thumb/');
    expect(bloc.totalPhotos).toBe(12);
  });
});
