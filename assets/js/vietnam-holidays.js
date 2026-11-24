// Vietnam Holidays functionality
// Load and display Vietnam holidays (including annual official schedules & floating holidays) in calendar

(function() {
    let holidaysData = null;

    // Load holidays data
    async function loadHolidays() {
        try {
            // Prefer the public assets path to avoid 404 noise on GitHub Pages
            const response = await fetch('/assets/data/vietnam_holidays.json');
            if (!response.ok) {
                // Fallback (for local dev where _data may be served)
                const altResponse = await fetch('/_data/vietnam_holidays.json');
                if (!altResponse.ok) throw new Error('Could not load holidays data');
                holidaysData = await altResponse.json();
            } else {
                holidaysData = await response.json();
            }
            return holidaysData;
        } catch (error) {
            console.warn('Could not load Vietnam holidays:', error);
            return null;
        }
    }

    // Compute the day-of-month for the nth occurrence of weekday (0=Sun..6=Sat) in a given month (1..12)
    function getNthWeekdayOfMonth(year, month, weekday, nth) {
        if (!year || !month || nth < 1) return null;
        const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
        const offset = (weekday - firstDow + 7) % 7;
        const targetDay = 1 + offset + (nth - 1) * 7;
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return targetDay <= daysInMonth ? targetDay : null;
    }

    function isActiveInYear(holiday, year) {
        if (!holiday) return false;
        if (holiday.since_year && year && year < holiday.since_year) return false;
        if (holiday.until_year && year && year > holiday.until_year) return false;
        return true;
    }

    // Return all matching holiday/schedule entries for a date (sorted by importance)
    function getHolidays(day, month, year) {
        if (!holidaysData) return [];

        const matches = [];
        const hasScheduledPublic = new Set();

        // 1. Official year-specific schedule (e.g. 2026 official holidays, substitute days, swapped workdays)
        const yearKey = String(year);
        const yearSchedule = holidaysData.year_schedules && Array.isArray(holidaysData.year_schedules[yearKey])
            ? holidaysData.year_schedules[yearKey]
            : [];
        yearSchedule.forEach(h => {
            if (h.day === day && h.month === month) {
                matches.push({
                    ...h,
                    type: h.type || 'solar',
                    from_year_schedule: true
                });
                if (h.is_public_holiday) {
                    hasScheduledPublic.add(`${h.day}-${h.month}`);
                }
            }
        });

        // 2. Fixed solar holidays
        const solarHolidays = Array.isArray(holidaysData.solar_holidays) ? holidaysData.solar_holidays : [];
        solarHolidays.forEach(h => {
            if (h.day !== day || h.month !== month) return;
            if (!isActiveInYear(h, year)) return;
            // Avoid duplicate public holiday card when already covered by the year-specific schedule
            if (h.is_public_holiday && hasScheduledPublic.has(`${day}-${month}`)) return;
            matches.push({
                ...h,
                type: 'solar'
            });
        });

        // 3. Floating solar holidays (e.g. Mother's Day, Father's Day)
        const floatingHolidays = Array.isArray(holidaysData.floating_solar_holidays)
            ? holidaysData.floating_solar_holidays
            : [];
        floatingHolidays.forEach(h => {
            if (h.month !== month) return;
            if (!isActiveInYear(h, year)) return;
            const targetDay = getNthWeekdayOfMonth(year, month, h.weekday, h.nth);
            if (targetDay === day) {
                matches.push({
                    ...h,
                    day: targetDay,
                    type: 'solar'
                });
            }
        });

        // 4. Lunar holidays if LunarCalendar is available
        if (window.LunarCalendar) {
            try {
                const lunar = window.LunarCalendar.solarToLunar(day, month, year);
                if (lunar && !lunar.isLeap) {
                    const lunarHolidays = Array.isArray(holidaysData.lunar_holidays) ? holidaysData.lunar_holidays : [];
                    lunarHolidays.forEach(h => {
                        if (h.day !== lunar.day || h.month !== lunar.month) return;
                        if (!isActiveInYear(h, year)) return;
                        if (h.is_public_holiday && hasScheduledPublic.has(`${day}-${month}`)) return;
                        matches.push({
                            ...h,
                            type: 'lunar'
                        });
                    });
                }
            } catch (e) {
                console.warn('Error checking lunar holiday:', e);
            }
        }

        // Priority: public holidays first, then workday swaps, then commemorative holidays
        const rank = (h) => (h.is_public_holiday ? 0 : (h.is_workday_swap ? 1 : 2));
        matches.sort((a, b) => rank(a) - rank(b));
        return matches;
    }

    // Check if a date is a holiday (returns primary holiday with optional extra_holidays)
    function getHoliday(day, month, year) {
        const matches = getHolidays(day, month, year);
        if (matches.length === 0) return null;
        if (matches.length === 1) return matches[0];
        return {
            ...matches[0],
            extra_holidays: matches.slice(1)
        };
    }

    // Add holiday indicator to calendar cell
    function addHolidayIndicator(cell, holiday) {
        if (!holiday) return;

        cell.classList.add('has-holiday');
        if (holiday.is_public_holiday) {
            cell.classList.add('public-holiday');
        } else if (holiday.is_workday_swap) {
            cell.classList.add('workday-swap');
        }

        const allNames = [holiday.name]
            .concat(Array.isArray(holiday.extra_holidays) ? holiday.extra_holidays.map(h => h.name) : [])
            .filter(Boolean);
        const label = allNames.join(' • ');

        cell.title = label;
        cell.setAttribute('aria-label', label);
    }

    // Enhance calendar with holidays
    function enhanceCalendar() {
        if (!holidaysData) return;

        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(cell => {
            const day = parseInt(cell.dataset.date, 10);
            const month = parseInt(cell.dataset.month, 10);
            const year = parseInt(cell.dataset.year, 10);

            const holiday = getHoliday(day, month, year);
            if (holiday) {
                addHolidayIndicator(cell, holiday);
            }
        });
    }

    // Observe calendar updates to re-apply holiday indicators
    function patchCalendarUpdate() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.target.id === 'calendar-display') {
                    setTimeout(enhanceCalendar, 50);
                    break;
                }
            }
        });

        const calendarDisplay = document.getElementById('calendar-display');
        if (calendarDisplay) {
            observer.observe(calendarDisplay, {
                childList: true,
                subtree: false
            });
        }
    }

    // Initialize
    async function init() {
        await loadHolidays();
        if (holidaysData) {
            patchCalendarUpdate();
            setTimeout(enhanceCalendar, 100);
        }
    }

    // Public API
    window.VietnamHolidays = {
        getHoliday,
        getHolidays,
        getAllHolidays: () => holidaysData,
        getYearSchedule: (year) => {
            if (!holidaysData || !holidaysData.year_schedules) return [];
            return holidaysData.year_schedules[String(year)] || [];
        },
        isPublicHoliday: (day, month, year) => {
            const holiday = getHoliday(day, month, year);
            return holiday ? Boolean(holiday.is_public_holiday) : false;
        },
        _setHolidaysData: (data) => {
            holidaysData = data;
        }
    };

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
