// Vietnam Holidays functionality
// Load and display Vietnam holidays in calendar

(function() {
    let holidaysData = null;
    
    // Load holidays data
    async function loadHolidays() {
        try {
            const response = await fetch('/_data/vietnam_holidays.json');
            if (!response.ok) {
                // Try alternative path
                const altResponse = await fetch('/assets/data/vietnam_holidays.json');
                if (!altResponse.ok) {
                    throw new Error('Could not load holidays data');
                }
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
    
    // Check if a date is a holiday
    function getHoliday(day, month, year) {
        if (!holidaysData) return null;
        
        // Check solar holidays
        const solarHoliday = holidaysData.solar_holidays.find(h => 
            h.day === day && h.month === month
        );
        
        if (solarHoliday) {
            return {
                ...solarHoliday,
                type: 'solar'
            };
        }
        
        // Check lunar holidays if LunarCalendar is available
        if (window.LunarCalendar) {
            try {
                const lunar = window.LunarCalendar.solarToLunar(day, month, year);
                if (lunar) {
                    const lunarHoliday = holidaysData.lunar_holidays.find(h => 
                        h.day === lunar.day && h.month === lunar.month
                    );
                    
                    if (lunarHoliday) {
                        return {
                            ...lunarHoliday,
                            type: 'lunar'
                        };
                    }
                }
            } catch (e) {
                console.warn('Error checking lunar holiday:', e);
            }
        }
        
        return null;
    }
    
    // Add holiday indicator to calendar cell
    function addHolidayIndicator(cell, holiday) {
        if (!holiday) return;
        
        // Add holiday class
        cell.classList.add('has-holiday');
        if (holiday.is_public_holiday) {
            cell.classList.add('public-holiday');
        }
        
        // Add holiday indicator dot or icon
        const holidayDot = document.createElement('span');
        holidayDot.className = 'holiday-indicator';
        holidayDot.title = holiday.name;
        if (holiday.is_public_holiday) {
            holidayDot.innerHTML = '<i class="fas fa-star"></i>';
        } else {
            holidayDot.innerHTML = '<i class="fas fa-circle"></i>';
        }
        
        cell.appendChild(holidayDot);
    }
    
    // Enhance calendar with holidays
    function enhanceCalendar() {
        if (!holidaysData) return;
        
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(cell => {
            const day = parseInt(cell.dataset.date);
            const month = parseInt(cell.dataset.month);
            const year = parseInt(cell.dataset.year);
            
            const holiday = getHoliday(day, month, year);
            if (holiday) {
                addHolidayIndicator(cell, holiday);
            }
        });
    }
    
    // Override the original updateCalendar to include holidays
    function patchCalendarUpdate() {
        // Wait for the original calendar to be updated
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.target.id === 'calendar-display') {
                    // Calendar has been updated, enhance it with holidays
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
            // Enhance current calendar if already rendered
            setTimeout(enhanceCalendar, 100);
        }
    }
    
    // Public API
    window.VietnamHolidays = {
        getHoliday,
        getAllHolidays: () => holidaysData,
        isPublicHoliday: (day, month, year) => {
            const holiday = getHoliday(day, month, year);
            return holiday ? holiday.is_public_holiday : false;
        }
    };
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
