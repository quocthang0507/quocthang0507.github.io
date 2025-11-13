// Clock and Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    let is24HourFormat = true;
    let showSeconds = true;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    // Stopwatch variables
    let stopwatchStartTime = 0;
    let stopwatchElapsed = 0;
    let stopwatchInterval = null;
    let stopwatchRunning = false;
    
    // Timer variables
    let timerDuration = 0;
    let timerRemaining = 0;
    let timerInterval = null;
    let timerRunning = false;

    // Initialize all components
    updateClock();
    updateCalendar();
    updateSystemInfo();
    
    // Start clock updates
    setInterval(updateClock, 1000);
    
    // Clock functionality
    function updateClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        let timeString;
        if (is24HourFormat) {
            timeString = `${padZero(hours)}:${padZero(minutes)}`;
            if (showSeconds) {
                timeString += `:${padZero(seconds)}`;
            }
        } else {
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            timeString = `${padZero(displayHours)}:${padZero(minutes)}`;
            if (showSeconds) {
                timeString += `:${padZero(seconds)}`;
            }
            timeString += ` ${ampm}`;
        }
        
        document.getElementById('digital-clock').textContent = timeString;
        
        // Update date
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('current-date').textContent = now.toLocaleDateString('vi-VN', options);
    }
    
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    // Calendar functionality
    function updateCalendar() {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const today = new Date();
        
        // Update title with translation
        const monthKey = `month.${currentMonth + 1}`;
        const monthName = window.t ? window.t(monthKey) : `Tháng ${currentMonth + 1}`;
        document.getElementById('calendar-title').textContent = `${monthName} ${currentYear}`;
        
        // Create calendar table
        let calendarHTML = '<table class="calendar-table">';
        
        // Calendar header with translated day names
        const dayKeys = ['cal.sunday', 'cal.monday', 'cal.tuesday', 'cal.wednesday', 'cal.thursday', 'cal.friday', 'cal.saturday'];
        const dayNames = dayKeys.map(key => window.t ? window.t(key) : key.split('.')[1]);
        calendarHTML += `<tr>${dayNames.map(day => `<th>${day}</th>`).join('')}</tr>`;
        
        let date = 1;
        const startDay = firstDay.getDay();
        
        for (let week = 0; week < 6; week++) {
            calendarHTML += '<tr>';
            for (let day = 0; day < 7; day++) {
                if (week === 0 && day < startDay) {
                    // Previous month days
                    const prevMonth = new Date(currentYear, currentMonth, 0);
                    const prevDate = prevMonth.getDate() - (startDay - day - 1);
                    calendarHTML += `<td class="other-month">${prevDate}</td>`;
                } else if (date > lastDay.getDate()) {
                    // Next month days
                    const nextDate = date - lastDay.getDate();
                    calendarHTML += `<td class="other-month">${nextDate}</td>`;
                    date++;
                } else {
                    // Current month days
                    const isToday = currentYear === today.getFullYear() && 
                                   currentMonth === today.getMonth() && 
                                   date === today.getDate();
                    const className = isToday ? 'today' : '';
                    
                    // Get lunar date for this day
                    let lunarInfo = '';
                    if (window.LunarCalendar) {
                        try {
                            const lunar = window.LunarCalendar.solarToLunar(date, currentMonth + 1, currentYear);
                            if (lunar) {
                                lunarInfo = `<small class="lunar-date">${lunar.day}/${lunar.month}${lunar.isLeap ? '*' : ''}</small>`;
                            }
                        } catch (e) {
                            // Fallback if lunar calculation fails
                        }
                    }
                    
                    calendarHTML += `<td class="${className} calendar-day" data-date="${date}" data-month="${currentMonth + 1}" data-year="${currentYear}">
                        <a href="#" class="calendar-day-link d-block position-relative p-1" aria-label="${date}/${currentMonth + 1}/${currentYear}">
                            <div class="solar-date">${date}</div>
                            ${lunarInfo}
                        </a>
                    </td>`;
                    date++;
                }
            }
            calendarHTML += '</tr>';
            if (date > lastDay.getDate()) break;
        }
        calendarHTML += '</table>';
        
        document.getElementById('calendar-display').innerHTML = calendarHTML;
        
        // Add click handlers for calendar day links
        document.querySelectorAll('.calendar-day-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const cell = this.closest('.calendar-day');
                if (!cell) return;
                const day = parseInt(cell.dataset.date);
                const month = parseInt(cell.dataset.month);
                const year = parseInt(cell.dataset.year);
                showDateDetails(day, month, year);
            });
        });
    }
    
    function updateSystemInfo() {
        const now = new Date();
        
        // Timezone
        document.getElementById('timezone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Day of year
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        document.getElementById('day-of-year').textContent = dayOfYear;
        
        // Week of year
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now - startOfYear) / oneDay);
        const weekOfYear = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        document.getElementById('week-of-year').textContent = weekOfYear;
    }
    
    // Stopwatch functionality
    function updateStopwatch() {
        const elapsed = stopwatchElapsed + (stopwatchRunning ? Date.now() - stopwatchStartTime : 0);
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const milliseconds = elapsed % 1000;
        
        document.getElementById('stopwatch-display').textContent = 
            `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}.${padThree(milliseconds)}`;
    }
    
    function padThree(num) {
        return num.toString().padStart(3, '0');
    }
    
    // Timer functionality
    function updateTimer() {
        if (timerRemaining > 0) {
            const minutes = Math.floor(timerRemaining / 60);
            const seconds = timerRemaining % 60;
            document.getElementById('timer-display').textContent = 
                `${padZero(minutes)}:${padZero(seconds)}`;
            timerRemaining--;
        } else {
            clearInterval(timerInterval);
            timerRunning = false;
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
            showAlert('Timer đã kết thúc!', 'warning');
            
            // Play notification sound (if supported)
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance('Timer đã kết thúc');
                utterance.lang = 'vi-VN';
                speechSynthesis.speak(utterance);
            }
        }
    }
    
    // Event listeners
    document.getElementById('toggle-format').addEventListener('click', function() {
        is24HourFormat = !is24HourFormat;
        updateClock();
        
        // Track format change
        if (typeof gtag !== 'undefined') {
            gtag('event', 'clock_format_change', {
                event_category: 'clock_tools',
                event_label: is24HourFormat ? '24_hour' : '12_hour'
            });
        }
    });
    
    document.getElementById('toggle-seconds').addEventListener('click', function() {
        showSeconds = !showSeconds;
        updateClock();
        
        // Track seconds toggle
        if (typeof gtag !== 'undefined') {
            gtag('event', 'clock_seconds_toggle', {
                event_category: 'clock_tools',
                event_label: showSeconds ? 'show_seconds' : 'hide_seconds'
            });
        }
    });
    
    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });
    
    document.getElementById('today-btn').addEventListener('click', function() {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        updateCalendar();
    });
    
    // Stopwatch event listeners
    document.getElementById('start-stopwatch').addEventListener('click', function() {
        if (!stopwatchRunning) {
            stopwatchStartTime = Date.now();
            stopwatchRunning = true;
            stopwatchInterval = setInterval(updateStopwatch, 10); // Update every 10ms for millisecond precision
            this.disabled = true;
            document.getElementById('pause-stopwatch').disabled = false;
            
            // Track stopwatch start
            if (typeof gtag !== 'undefined') {
                gtag('event', 'stopwatch_start', {
                    event_category: 'clock_tools',
                    event_label: 'stopwatch_interaction'
                });
            }
        }
    });
    
    document.getElementById('pause-stopwatch').addEventListener('click', function() {
        if (stopwatchRunning) {
            stopwatchElapsed += Date.now() - stopwatchStartTime;
            stopwatchRunning = false;
            clearInterval(stopwatchInterval);
            document.getElementById('start-stopwatch').disabled = false;
            this.disabled = true;
            
            // Track stopwatch pause
            if (typeof gtag !== 'undefined') {
                gtag('event', 'stopwatch_pause', {
                    event_category: 'clock_tools',
                    event_label: 'stopwatch_interaction',
                    elapsed_time: Math.round(stopwatchElapsed / 1000)
                });
            }
        }
    });
    
    document.getElementById('reset-stopwatch').addEventListener('click', function() {
        const previousElapsed = stopwatchElapsed;
        stopwatchElapsed = 0;
        stopwatchRunning = false;
        clearInterval(stopwatchInterval);
        document.getElementById('start-stopwatch').disabled = false;
        document.getElementById('pause-stopwatch').disabled = true;
        updateStopwatch();
        
        // Track stopwatch reset
        if (typeof gtag !== 'undefined') {
            gtag('event', 'stopwatch_reset', {
                event_category: 'clock_tools',
                event_label: 'stopwatch_interaction',
                final_time: Math.round(previousElapsed / 1000)
            });
        }
    });
    
    // Timer event listeners
    document.getElementById('start-timer').addEventListener('click', function() {
        if (!timerRunning) {
            const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
            const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
            timerDuration = minutes * 60 + seconds;
            timerRemaining = timerDuration;
            
            if (timerRemaining > 0) {
                timerRunning = true;
                timerInterval = setInterval(updateTimer, 1000);
                this.disabled = true;
                document.getElementById('pause-timer').disabled = false;
                
                // Track timer start
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'timer_start', {
                        event_category: 'clock_tools',
                        event_label: 'timer_interaction',
                        timer_duration: timerDuration
                    });
                }
            } else {
                showAlert('Vui lòng nhập thời gian hợp lệ!', 'danger');
            }
        }
    });
    
    document.getElementById('pause-timer').addEventListener('click', function() {
        if (timerRunning) {
            timerRunning = false;
            clearInterval(timerInterval);
            document.getElementById('start-timer').disabled = false;
            this.disabled = true;
        }
    });
    
    document.getElementById('reset-timer').addEventListener('click', function() {
        timerRunning = false;
        clearInterval(timerInterval);
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 5;
        const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
        timerRemaining = minutes * 60 + seconds;
        updateTimer();
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
    });
    
    // Initialize displays
    updateStopwatch();
    const initialMinutes = parseInt(document.getElementById('timer-minutes').value) || 5;
    const initialSeconds = parseInt(document.getElementById('timer-seconds').value) || 0;
    timerRemaining = initialMinutes * 60 + initialSeconds;
    updateTimer();
    
    // Listen for language changes to update calendar
    window.addEventListener('languageChanged', function() {
        updateCalendar();
    });
    
    // Make updateCalendar globally available for i18n system
    window.updateCalendar = updateCalendar;
    
    // Show date details modal
    function showDateDetails(day, month, year) {
        // Helper translation function
        const t = window.t || ((key, fallback) => fallback || key);

        const solarDate = new Date(year, month - 1, day);
        const dayKeys = ['day.sunday', 'day.monday', 'day.tuesday', 'day.wednesday', 'day.thursday', 'day.friday', 'day.saturday'];
        const dayOfWeek = t(dayKeys[solarDate.getDay()], dayKeys[solarDate.getDay()]);

        // Compute day-of-year and ISO week for extra context
        const start = new Date(year, 0, 0);
        const diff = solarDate - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        const jan1 = new Date(year, 0, 1);
        const days = Math.floor((solarDate - jan1) / oneDay);
        const weekOfYear = Math.ceil((days + jan1.getDay() + 1) / 7);

        let lunar = null; let zodiac = ''; let canChi = ''; let lunarMonthName = ''; let lunarOk = false;
        if (window.LunarCalendar) {
            try {
                lunar = window.LunarCalendar.solarToLunar(day, month, year);
                if (lunar) {
                    zodiac = window.LunarCalendar.getZodiacAnimal(lunar.year) || '';
                    canChi = window.LunarCalendar.getCanChi(lunar.year) || '';
                    lunarMonthName = window.LunarCalendar.getLunarMonthName(lunar.month, lunar.isLeap) || '';
                    lunarOk = true;
                }
            } catch(err) {
                lunarOk = false;
            }
        }

        // Check for holidays
        let holiday = null;
        if (window.VietnamHolidays) {
            holiday = window.VietnamHolidays.getHoliday(day, month, year);
        }

        // Create (or reuse) modal container skeleton once
        let modal = document.getElementById('dateDetailsModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="dateDetailsModal" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content date-modal">
                  <div class="modal-header date-modal-header">
                    <h5 class="modal-title" id="dateDetailsTitle"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body" id="dateDetailsBody"></div>
                  <div class="modal-footer flex-wrap gap-2">
                    <div class="btn-group me-auto" role="group" aria-label="Navigation">
                      <button type="button" class="btn btn-outline-primary" id="datePrevBtn"><i class="fas fa-chevron-left"></i></button>
                      <button type="button" class="btn btn-outline-secondary" id="dateTodayBtn"><i class="fas fa-calendar-day"></i></button>
                      <button type="button" class="btn btn-outline-primary" id="dateNextBtn"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <button type="button" class="btn btn-outline-success" id="dateCopyBtn"><i class="fas fa-copy"></i> ${t('lunar.copy','Sao chép')}</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${t('lunar.close','Đóng')}</button>
                  </div>
                </div>
              </div>
            </div>`);
            modal = document.getElementById('dateDetailsModal');
        }

        // Fill content
        const titleEl = modal.querySelector('#dateDetailsTitle');
        titleEl.textContent = `${t('lunar.details_title','Chi tiết ngày')} ${day}/${month}/${year}`;

        // Build detail HTML
        let lunarSection = '';
        if (lunarOk) {
            lunarSection = `
            <div class="col-md-6">
                <div class="date-card lunar-card p-3 h-100">
                    <h6 class="text-muted mb-2"><i class="fas fa-moon"></i> ${t('lunar.lunar','Âm lịch')}</h6>
                    <div class="display-6 fw-bold mb-1">${lunar.day}</div>
                    <div class="fs-6">${lunarMonthName}</div>
                    <div class="small text-secondary mt-1">${t('lunar.year','Năm')}: ${lunar.year} (${canChi})</div>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <span class="badge bg-info-subtle text-info-emphasis border date-badge">${zodiac}</span>
                        <span class="badge bg-warning-subtle text-warning-emphasis border date-badge">${lunar.isLeap ? t('lunar.month_leap','Tháng nhuận') : t('lunar.month_normal','Tháng thường')}</span>
                    </div>
                </div>
            </div>`;
        } else {
            lunarSection = `<div class="col-md-6"><div class="alert alert-warning mb-0">${t('lunar.unavailable','Không có dữ liệu âm lịch')}</div></div>`;
        }

        // Build holiday section
        let holidaySection = '';
        if (holiday) {
            const holidayIcon = holiday.is_public_holiday ? '<i class="fas fa-star text-danger"></i>' : '<i class="fas fa-calendar-alt text-info"></i>';
            const holidayBadge = holiday.is_public_holiday ? 
                `<span class="badge bg-danger-subtle text-danger-emphasis border date-badge"><i class="fas fa-flag"></i> Ngày lễ chính thức</span>` : 
                `<span class="badge bg-info-subtle text-info-emphasis border date-badge">Ngày kỷ niệm</span>`;
            const holidayType = holiday.type === 'lunar' ? 
                `<span class="badge bg-secondary-subtle text-secondary-emphasis border date-badge"><i class="fas fa-moon"></i> Âm lịch</span>` : 
                `<span class="badge bg-primary-subtle text-primary-emphasis border date-badge"><i class="fas fa-sun"></i> Dương lịch</span>`;
            
            holidaySection = `
            <div class="col-12 mt-3">
                <div class="alert alert-${holiday.is_public_holiday ? 'danger' : 'info'} mb-0">
                    <h6 class="alert-heading mb-2">${holidayIcon} Ngày lễ</h6>
                    <p class="mb-2 fw-bold">${holiday.name}</p>
                    ${holiday.name_en ? `<p class="mb-2 small text-muted">${holiday.name_en}</p>` : ''}
                    ${holiday.description ? `<p class="mb-2 small">${holiday.description}</p>` : ''}
                    <div class="d-flex flex-wrap gap-2 mt-2">
                        ${holidayBadge}
                        ${holidayType}
                        ${holiday.duration_days ? `<span class="badge bg-success-subtle text-success-emphasis border date-badge">Nghỉ: ${holiday.duration_days} ngày</span>` : ''}
                    </div>
                </div>
            </div>`;
        }

        const bodyHTML = `
        <div class="row g-3 align-items-stretch">
            <div class="col-md-6">
                <div class="date-card solar-card p-3 h-100">
                    <h6 class="text-muted mb-2"><i class="fas fa-sun"></i> ${t('lunar.solar','Dương lịch')}</h6>
                    <div class="display-6 fw-bold mb-1">${day}</div>
                    <div class="fs-5">${dayOfWeek}</div>
                    <div class="small text-secondary mt-1">${t('lunar.full_date','Ngày')} ${day} / ${month} / ${year}</div>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <span class="badge bg-primary-subtle text-primary-emphasis border date-badge">${t('lunar.day_of_year','Ngày trong năm')}: ${dayOfYear}</span>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis border date-badge">${t('lunar.week_of_year','Tuần')}: ${weekOfYear}</span>
                    </div>
                </div>
            </div>
            ${lunarSection}
            ${holidaySection}
        </div>`;

        modal.querySelector('#dateDetailsBody').innerHTML = bodyHTML;

        // Store current shown date for navigation
        modal.dataset.day = day;
        modal.dataset.month = month;
        modal.dataset.year = year;

        // Navigation handlers (rebind each time to ensure updated references)
        modal.querySelector('#datePrevBtn').onclick = () => {
            const d = new Date(year, month - 1, day);
            d.setDate(d.getDate() - 1);
            showDateDetails(d.getDate(), d.getMonth() + 1, d.getFullYear());
        };
        modal.querySelector('#dateNextBtn').onclick = () => {
            const d = new Date(year, month - 1, day);
            d.setDate(d.getDate() + 1);
            showDateDetails(d.getDate(), d.getMonth() + 1, d.getFullYear());
        };
        modal.querySelector('#dateTodayBtn').onclick = () => {
            const today = new Date();
            showDateDetails(today.getDate(), today.getMonth() + 1, today.getFullYear());
        };
        modal.querySelector('#dateCopyBtn').onclick = () => {
            const parts = [
                `${t('lunar.solar','Dương lịch')}: ${day}/${month}/${year} (${dayOfWeek})`,
                lunarOk ? `${t('lunar.lunar','Âm lịch')}: ${lunar.day} ${lunarMonthName} ${lunar.year} (${canChi})` : '',
                lunarOk ? `${t('lunar.zodiac','Con giáp')}: ${zodiac}` : '',
                `${t('lunar.day_of_year','Ngày trong năm')}: ${dayOfYear}`,
                `${t('lunar.week_of_year','Tuần')}: ${weekOfYear}`
            ].filter(Boolean).join('\n');
            if (navigator.clipboard) {
                navigator.clipboard.writeText(parts).then(() => {
                    showAlert(t('lunar.copied','Đã sao chép!'), 'success');
                });
            }
        };

        // Show via Bootstrap API for proper backdrop & accessibility
        const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);
        bootstrapModal.show();
    }
    
    // Function to close date modal
    window.closeDateModal = function() {
        const modal = document.getElementById('dateDetailsModal');
        if (modal) {
            modal.remove();
        }
    }
});