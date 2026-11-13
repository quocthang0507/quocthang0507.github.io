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
        
        // Update date using current i18n locale
        const lang = (window.translationSystem && window.translationSystem.getCurrentLanguage()) || 'vi';
        const localeMap = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN', ko: 'ko-KR', ja: 'ja-JP' };
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('current-date').textContent = now.toLocaleDateString(localeMap[lang] || 'vi-VN', options);
    }
    
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }

    function computeDayOfYear(date) {
        const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        const utcStart = Date.UTC(date.getFullYear(), 0, 0);
        return Math.round((utcDate - utcStart) / 86400000);
    }

    function computeISOWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
                                lunarInfo = `<small class="lunar-date mt-auto">${lunar.day}/${lunar.month}${lunar.isLeap ? '*' : ''}</small>`;
                            }
                        } catch (e) {
                            // Fallback if lunar calculation fails
                        }
                    }
                    
                    calendarHTML += `<td class="${className} calendar-day" data-date="${date}" data-month="${currentMonth + 1}" data-year="${currentYear}">
                        <a href="#" class="calendar-day-link d-flex flex-column align-items-center p-1" aria-label="${date}/${currentMonth + 1}/${currentYear}">
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
        
        // Day of year and ISO week of year (DST-safe UTC calculation)
        document.getElementById('day-of-year').textContent = computeDayOfYear(now);
        document.getElementById('week-of-year').textContent = computeISOWeek(now);
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
    function renderTimerDisplay(secondsLeft) {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;
        const clamped = Math.max(0, secondsLeft);
        const minutes = Math.floor(clamped / 60);
        const seconds = clamped % 60;
        timerDisplay.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
        if (clamped > 0 && clamped <= 10) {
            timerDisplay.classList.add('warning-low');
        } else {
            timerDisplay.classList.remove('warning-low');
        }
    }

    function updateTimer() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerRemaining > 1) {
            timerRemaining--;
            renderTimerDisplay(timerRemaining);
        } else {
            timerRemaining = 0;
            clearInterval(timerInterval);
            timerRunning = false;
            renderTimerDisplay(0);
            timerDisplay.classList.remove('running');
            timerDisplay.classList.remove('warning-low');
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
            showAlert('Timer đã kết thúc!', 'warning');
            
            // Play notification sound (if supported)
            if ('speechSynthesis' in window) {
                try {
                    const utterance = new SpeechSynthesisUtterance('Timer đã kết thúc');
                    utterance.lang = 'vi-VN';
                    speechSynthesis.speak(utterance);
                } catch (_) {}
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
            document.getElementById('stopwatch-display').classList.add('running');
            
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
            document.getElementById('stopwatch-display').classList.remove('running');
            
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
        document.getElementById('stopwatch-display').classList.remove('running');
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
                renderTimerDisplay(timerRemaining);
                timerInterval = setInterval(updateTimer, 1000);
                this.disabled = true;
                document.getElementById('pause-timer').disabled = false;
                document.getElementById('timer-display').classList.add('running');
                
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
            document.getElementById('timer-display').classList.remove('running');
        }
    });
    
    document.getElementById('reset-timer').addEventListener('click', function() {
        timerRunning = false;
        clearInterval(timerInterval);
        const parsedMin = parseInt(document.getElementById('timer-minutes').value, 10);
        const parsedSec = parseInt(document.getElementById('timer-seconds').value, 10);
        const minutes = Number.isNaN(parsedMin) ? 5 : Math.max(0, parsedMin);
        const seconds = Number.isNaN(parsedSec) ? 0 : Math.max(0, parsedSec);
        timerRemaining = minutes * 60 + seconds;
        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.classList.remove('running');
        renderTimerDisplay(timerRemaining);
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
    });
    
    // Timer presets
    const presetButtons = document.querySelectorAll('#timer-presets button');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (timerRunning) return; // Don't allow changing presets while running
            const mins = this.dataset.minutes;
            const secs = this.dataset.seconds;
            document.getElementById('timer-minutes').value = mins;
            document.getElementById('timer-seconds').value = secs;
            timerRemaining = parseInt(mins) * 60 + parseInt(secs);
            
            // Update display
            const minutesDisplay = Math.floor(timerRemaining / 60);
            const secondsDisplay = timerRemaining % 60;
            const timerDisplay = document.getElementById('timer-display');
            timerDisplay.textContent = `${padZero(minutesDisplay)}:${padZero(secondsDisplay)}`;
            timerDisplay.classList.remove('warning-low');
        });
    });
    
    // Initialize displays
    updateStopwatch();
    const parsedInitMin = parseInt(document.getElementById('timer-minutes').value, 10);
    const parsedInitSec = parseInt(document.getElementById('timer-seconds').value, 10);
    const initialMinutes = Number.isNaN(parsedInitMin) ? 5 : Math.max(0, parsedInitMin);
    const initialSeconds = Number.isNaN(parsedInitSec) ? 0 : Math.max(0, parsedInitSec);
    timerRemaining = initialMinutes * 60 + initialSeconds;
    renderTimerDisplay(timerRemaining);
    
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
        const lang = (window.translationSystem && window.translationSystem.getCurrentLanguage()) || 'vi';

        const solarDate = new Date(year, month - 1, day);
        const dayKeys = ['day.sunday', 'day.monday', 'day.tuesday', 'day.wednesday', 'day.thursday', 'day.friday', 'day.saturday'];
        const dayOfWeek = t(dayKeys[solarDate.getDay()], dayKeys[solarDate.getDay()]);

        // Compute day-of-year and ISO week for extra context (DST-safe UTC calculation)
        const dayOfYear = computeDayOfYear(solarDate);
        const weekOfYear = computeISOWeek(solarDate);
        const esc = typeof escapeHtml === 'function'
            ? escapeHtml
            : (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        let lunar = null; let zodiac = ''; let canChi = ''; let lunarMonthName = ''; let lunarOk = false;
        let goodBadInfo = null;
        if (window.LunarCalendar) {
            try {
                lunar = window.LunarCalendar.solarToLunar(day, month, year);
                if (lunar) {
                    zodiac = window.LunarCalendar.getZodiacAnimal(lunar.year) || '';
                    canChi = window.LunarCalendar.getCanChi(lunar.year) || '';
                    lunarMonthName = window.LunarCalendar.getLunarMonthName(lunar.month, lunar.isLeap) || '';
                    lunarOk = true;
                    goodBadInfo = window.LunarCalendar.getGoodBadDayInfo(day, month, year);
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
                    <button type="button" class="btn btn-outline-success" id="dateCopyBtn"><i class="fas fa-copy"></i> ${esc(t('lunar.copy','Sao chép'))}</button>
                    <button type="button" class="btn btn-secondary" id="dateCloseBtn" data-bs-dismiss="modal">${esc(t('lunar.close','Đóng'))}</button>
                  </div>
                </div>
              </div>
            </div>`);
            modal = document.getElementById('dateDetailsModal');
        }

        const copyBtnEl = modal.querySelector('#dateCopyBtn');
        if (copyBtnEl) {
            copyBtnEl.innerHTML = `<i class="fas fa-copy"></i> ${esc(t('lunar.copy','Sao chép'))}`;
        }
        const closeBtnEl = modal.querySelector('#dateCloseBtn');
        if (closeBtnEl) {
            closeBtnEl.textContent = t('lunar.close','Đóng');
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
                    <h6 class="text-muted mb-2"><i class="fas fa-moon"></i> ${esc(t('lunar.lunar','Âm lịch'))}</h6>
                    <div class="display-6 fw-bold mb-1">${esc(lunar.day)}</div>
                    <div class="fs-6">${esc(lunarMonthName)}</div>
                    <div class="small text-secondary mt-1">${esc(t('lunar.year','Năm'))}: ${esc(lunar.year)} (${esc(canChi)})</div>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <span class="badge bg-info-subtle text-info-emphasis border date-badge">${esc(zodiac)}</span>
                        <span class="badge bg-warning-subtle text-warning-emphasis border date-badge">${esc(lunar.isLeap ? t('lunar.month_leap','Tháng nhuận') : t('lunar.month_normal','Tháng thường'))}</span>
                    </div>
                </div>
            </div>`;
        } else {
            lunarSection = `<div class="col-md-6"><div class="alert alert-warning mb-0">${esc(t('lunar.unavailable','Không có dữ liệu âm lịch'))}</div></div>`;
        }

        // Build good/bad day section
        let goodBadSection = '';
        if (lunarOk && goodBadInfo) {
            const isVi = lang === 'vi';
            const statusLabel = goodBadInfo.status === 'tốt' ? t('lunar.status_good', 'Ngày Hoàng Đạo (Tốt)') :
                                (goodBadInfo.status === 'xấu' ? t('lunar.status_bad', 'Ngày Hắc Đạo (Xấu/Kiêng kỵ)') : t('lunar.status_normal', 'Ngày Bình Thường'));
            const statusClass = goodBadInfo.status === 'tốt' ? 'success' : (goodBadInfo.status === 'xấu' ? 'danger' : 'secondary');
            const starText = isVi ? goodBadInfo.starName : goodBadInfo.starNameEn;
            const activeWarnings = isVi ? goodBadInfo.warnings : goodBadInfo.warningsEn;
            
            let warningsHtml = '';
            if (activeWarnings.length > 0) {
                warningsHtml = `
                <div class="mt-3 text-danger small">
                    <strong><i class="fas fa-exclamation-triangle"></i> ${esc(t('lunar.warnings', 'Cảnh báo kỵ'))}:</strong>
                    <ul class="mb-0 ps-3 mt-1">
                        ${activeWarnings.map(w => `<li>${esc(w)}</li>`).join('')}
                    </ul>
                </div>`;
            }
            
            let descText = t('lunar.details_normal_desc', 'Thích hợp cho các công việc thường nhật, công việc lớn cần cân nhắc kỹ lưỡng.');
            if (goodBadInfo.status === 'tốt') {
                descText = t('lunar.details_good_desc', 'Thích hợp cho các công việc quan trọng như khởi công, cưới hỏi, khai trương, giao dịch.');
            } else if (goodBadInfo.status === 'xấu') {
                descText = t('lunar.details_bad_desc', 'Hạn chế làm các việc lớn như xuất hành đi xa, ký kết đại sự, khởi công xây dựng.');
            }
            
            let shouldDo = '';
            let shouldAvoid = '';
            if (goodBadInfo.status === 'tốt') {
                shouldDo = isVi ? 'Cưới hỏi, khai trương, mở cửa hàng, giao dịch ký kết, động thổ, xuất hành đi xa.' : 'Weddings, grand openings, business transactions, groundbreaking, long journeys.';
                shouldAvoid = isVi ? 'Tranh chấp khiếu nại, kiện tụng.' : 'Disputes, lawsuits.';
            } else if (goodBadInfo.status === 'xấu') {
                shouldDo = isVi ? 'Dọn dẹp nhà cửa, quét dọn, nghỉ ngơi.' : 'House cleaning, resting, routine maintenance.';
                shouldAvoid = isVi ? 'Khởi công xây nhà, cưới hỏi, khai trương, ký hợp đồng lớn, xuất hành hướng xấu.' : 'Starting construction, weddings, grand openings, signing major contracts, travelling.';
            } else {
                shouldDo = isVi ? 'Làm các việc thường nhật, đi chùa, làm việc thiện.' : 'Routine work, visiting temples, charity work.';
                shouldAvoid = isVi ? 'Tránh quyết định vội vàng đối với các giao dịch có tính rủi ro cao.' : 'Avoid rushed decisions for high-risk transactions.';
            }
            
            goodBadSection = `
            <div class="col-12 mt-3">
                <div class="date-card p-3">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h6 class="mb-0 text-primary"><i class="fas fa-balance-scale"></i> ${esc(t('lunar.day_status', 'Đánh giá ngày'))}</h6>
                        <span class="badge bg-${statusClass}-subtle text-${statusClass}-emphasis border date-badge">${esc(statusLabel)}</span>
                    </div>
                    <p class="small text-secondary mb-3">${esc(descText)}</p>
                    <div class="row g-2 mb-2">
                        <div class="col-sm-6">
                            <div class="p-2 border rounded bg-light-subtle h-100">
                                <strong class="small text-secondary d-block mb-1">${esc(t('lunar.day_canchi', 'Can Chi ngày'))}</strong>
                                <span class="fs-6 fw-bold text-dark">${esc(goodBadInfo.dayCanChi)}</span>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="p-2 border rounded bg-light-subtle h-100">
                                <strong class="small text-secondary d-block mb-1">${esc(t('lunar.zodiac_star', 'Sao hoàng đạo'))}</strong>
                                <span class="fs-6 fw-bold text-dark">${esc(starText)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row g-2 mt-1">
                        <div class="col-sm-6">
                            <div class="p-2 rounded bg-success-subtle border-start border-success border-4 h-100">
                                <strong class="small text-success-emphasis d-block mb-1"><i class="fas fa-check-circle"></i> ${esc(t('lunar.should_do', 'Nên làm'))}</strong>
                                <span class="small text-dark-emphasis d-block mt-1">${esc(shouldDo)}</span>
                            </div>
                        </div>
                        <div class="col-sm-6">
                            <div class="p-2 rounded bg-danger-subtle border-start border-danger border-4 h-100">
                                <strong class="small text-danger-emphasis d-block mb-1"><i class="fas fa-times-circle"></i> ${esc(t('lunar.should_avoid', 'Kiêng kỵ'))}</strong>
                                <span class="small text-dark-emphasis d-block mt-1">${esc(shouldAvoid)}</span>
                            </div>
                        </div>
                    </div>
                    ${warningsHtml}
                </div>
            </div>`;
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
                    <p class="mb-2 fw-bold">${esc(holiday.name)}</p>
                    ${holiday.name_en ? `<p class="mb-2 small text-muted">${esc(holiday.name_en)}</p>` : ''}
                    ${holiday.description ? `<p class="mb-2 small">${esc(holiday.description)}</p>` : ''}
                    <div class="d-flex flex-wrap gap-2 mt-2">
                        ${holidayBadge}
                        ${holidayType}
                        ${holiday.duration_days ? `<span class="badge bg-success-subtle text-success-emphasis border date-badge">Nghỉ: ${esc(holiday.duration_days)} ngày</span>` : ''}
                    </div>
                </div>
            </div>`;
        }

        const bodyHTML = `
        <div class="row g-3 align-items-stretch">
            <div class="col-md-6">
                <div class="date-card solar-card p-3 h-100">
                    <h6 class="text-muted mb-2"><i class="fas fa-sun"></i> ${esc(t('lunar.solar','Dương lịch'))}</h6>
                    <div class="display-6 fw-bold mb-1">${esc(day)}</div>
                    <div class="fs-5">${esc(dayOfWeek)}</div>
                    <div class="small text-secondary mt-1">${esc(t('lunar.full_date','Ngày'))} ${esc(day)} / ${esc(month)} / ${esc(year)}</div>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <span class="badge bg-primary-subtle text-primary-emphasis border date-badge">${esc(t('lunar.day_of_year','Ngày trong năm'))}: ${esc(dayOfYear)}</span>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis border date-badge">${esc(t('lunar.week_of_year','Tuần'))}: ${esc(weekOfYear)}</span>
                    </div>
                </div>
            </div>
            ${lunarSection}
            ${goodBadSection}
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
                lunarOk && goodBadInfo ? `${t('lunar.day_canchi', 'Can Chi ngày')}: ${goodBadInfo.dayCanChi}` : '',
                lunarOk && goodBadInfo ? `${t('lunar.day_status', 'Đánh giá ngày')}: ${goodBadInfo.status === 'tốt' ? t('lunar.status_good') : (goodBadInfo.status === 'xấu' ? t('lunar.status_bad') : t('lunar.status_normal'))}` : '',
                lunarOk && goodBadInfo ? `${t('lunar.zodiac_star', 'Sao hoàng đạo')}: ${lang === 'vi' ? goodBadInfo.starName : goodBadInfo.starNameEn}` : '',
                lunarOk && goodBadInfo && goodBadInfo.warnings.length > 0 ? `${t('lunar.warnings', 'Cảnh báo kỵ')}: ${(lang === 'vi' ? goodBadInfo.warnings : goodBadInfo.warningsEn).join(', ')}` : '',
                `${t('lunar.day_of_year','Ngày trong năm')}: ${dayOfYear}`,
                `${t('lunar.week_of_year','Tuần')}: ${weekOfYear}`
            ].filter(Boolean).join('\n');
            if (navigator.clipboard) {
                navigator.clipboard.writeText(parts).then(() => {
                    showAlert(t('lunar.copied','Đã sao chép!'), 'success');
                }).catch(() => {
                    if (typeof copyToClipboard === 'function') copyToClipboard(parts);
                });
            } else if (typeof copyToClipboard === 'function') {
                copyToClipboard(parts);
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