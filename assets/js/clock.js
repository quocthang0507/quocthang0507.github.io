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
        } else {
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            timeString = `${padZero(displayHours)}:${padZero(minutes)} ${ampm}`;
        }
        
        if (showSeconds) {
            timeString += is24HourFormat ? `:${padZero(seconds)}` : `:${padZero(seconds)}`;
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
        
        // Update title
        const monthNames = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        document.getElementById('calendar-title').textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Create calendar table
        let calendarHTML = '<table class="calendar-table">';
        calendarHTML += '<tr><th>CN</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th></tr>';
        
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
                    calendarHTML += `<td class="${className}">${date}</td>`;
                    date++;
                }
            }
            calendarHTML += '</tr>';
            if (date > lastDay.getDate()) break;
        }
        calendarHTML += '</table>';
        
        document.getElementById('calendar-display').innerHTML = calendarHTML;
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
        
        document.getElementById('stopwatch-display').textContent = 
            `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
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
    });
    
    document.getElementById('toggle-seconds').addEventListener('click', function() {
        showSeconds = !showSeconds;
        updateClock();
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
            stopwatchInterval = setInterval(updateStopwatch, 100);
            this.disabled = true;
            document.getElementById('pause-stopwatch').disabled = false;
        }
    });
    
    document.getElementById('pause-stopwatch').addEventListener('click', function() {
        if (stopwatchRunning) {
            stopwatchElapsed += Date.now() - stopwatchStartTime;
            stopwatchRunning = false;
            clearInterval(stopwatchInterval);
            document.getElementById('start-stopwatch').disabled = false;
            this.disabled = true;
        }
    });
    
    document.getElementById('reset-stopwatch').addEventListener('click', function() {
        stopwatchElapsed = 0;
        stopwatchRunning = false;
        clearInterval(stopwatchInterval);
        document.getElementById('start-stopwatch').disabled = false;
        document.getElementById('pause-stopwatch').disabled = true;
        updateStopwatch();
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
});