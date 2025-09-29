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
                        <div class="solar-date">${date}</div>
                        ${lunarInfo}
                    </td>`;
                    date++;
                }
            }
            calendarHTML += '</tr>';
            if (date > lastDay.getDate()) break;
        }
        calendarHTML += '</table>';
        
        document.getElementById('calendar-display').innerHTML = calendarHTML;
        
        // Add click handlers for calendar days
        document.querySelectorAll('.calendar-day').forEach(cell => {
            cell.addEventListener('click', function() {
                const day = parseInt(this.dataset.date);
                const month = parseInt(this.dataset.month);
                const year = parseInt(this.dataset.year);
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
        if (!window.LunarCalendar) {
            showAlert('Lunar calendar not loaded', 'warning');
            return;
        }
        
        try {
            const lunar = window.LunarCalendar.solarToLunar(day, month, year);
            if (!lunar) {
                showAlert('Unable to calculate lunar date', 'error');
                return;
            }
            
            const zodiac = window.LunarCalendar.getZodiacAnimal(lunar.year);
            const canChi = window.LunarCalendar.getCanChi(lunar.year);
            const lunarMonthName = window.LunarCalendar.getLunarMonthName(lunar.month, lunar.isLeap);
            
            const solarDate = new Date(year, month - 1, day);
            const dayKeys = ['day.sunday', 'day.monday', 'day.tuesday', 'day.wednesday', 'day.thursday', 'day.friday', 'day.saturday'];
            const dayOfWeek = window.t ? window.t(dayKeys[solarDate.getDay()]) : dayKeys[solarDate.getDay()];
            
            // Translation helper
            const t = window.t || ((key, fallback) => fallback || key);
            
            const modalHTML = `
                <div class="modal fade show" id="dateDetailsModal" style="display: block; background: rgba(0,0,0,0.5);">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title">${t('lunar.details_title', 'Chi tiết ngày')} ${day}/${month}/${year}</h5>
                                <button type="button" class="btn-close btn-close-white" onclick="closeDateModal()">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-calendar"></i> ${t('lunar.solar', 'Dương lịch:')}</h6>
                                        <p><strong>${dayOfWeek}</strong><br>Ngày ${day} tháng ${month} năm ${year}</p>
                                        
                                        <h6><i class="fas fa-moon"></i> ${t('lunar.lunar', 'Âm lịch:')}</h6>
                                        <p>Ngày ${lunar.day} ${lunarMonthName}<br>Năm ${lunar.year} (${canChi})</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6><i class="fas fa-dragon"></i> ${t('lunar.zodiac', 'Con giáp:')}</h6>
                                        <p class="text-primary">${zodiac}</p>
                                        
                                        <h6><i class="fas fa-info-circle"></i> ${t('lunar.info', 'Thông tin:')}</h6>
                                        <ul class="list-unstyled">
                                            <li><small>${t(lunar.isLeap ? 'lunar.year_leap' : 'lunar.year_normal', lunar.isLeap ? 'Năm âm lịch nhuận' : 'Năm âm lịch thường')}</small></li>
                                            <li><small>${t(lunar.isLeap ? 'lunar.month_leap' : 'lunar.month_normal', lunar.isLeap ? 'Tháng nhuận' : 'Tháng thường')}</small></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeDateModal()">${t('lunar.close', 'Đóng')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('dateDetailsModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
        } catch (error) {
            console.error('Error showing date details:', error);
            showAlert('Lỗi khi hiển thị thông tin ngày', 'error');
        }
    }
    
    // Function to close date modal
    window.closeDateModal = function() {
        const modal = document.getElementById('dateDetailsModal');
        if (modal) {
            modal.remove();
        }
    }
});