// World Clocks functionality
document.addEventListener('DOMContentLoaded', function() {
    let clocks = loadFromLocalStorage('worldClocks') || [];
    let updateInterval;
    
    // Settings
    let settings = {
        showSeconds: true,
        showNumbers: true,
        showDigital: true,
        theme: 'light'
    };
    
    // Load settings
    const savedSettings = loadFromLocalStorage('worldClocksSettings');
    if (savedSettings) {
        settings = { ...settings, ...savedSettings };
    }
    
    // Apply saved settings
    document.getElementById('show-seconds').checked = settings.showSeconds;
    document.getElementById('show-numbers').checked = settings.showNumbers;
    document.getElementById('show-digital').checked = settings.showDigital;
    document.getElementById('clock-theme').value = settings.theme;
    
    // City names for timezones
    const cityNames = {
        'Asia/Ho_Chi_Minh': 'Hanoi',
        'Asia/Tokyo': 'Tokyo',
        'Asia/Shanghai': 'Beijing',
        'Asia/Seoul': 'Seoul',
        'Asia/Singapore': 'Singapore',
        'Asia/Bangkok': 'Bangkok',
        'Asia/Dubai': 'Dubai',
        'Europe/London': 'London',
        'Europe/Paris': 'Paris',
        'Europe/Berlin': 'Berlin',
        'Europe/Moscow': 'Moscow',
        'America/New_York': 'New York',
        'America/Los_Angeles': 'Los Angeles',
        'America/Chicago': 'Chicago',
        'America/Toronto': 'Toronto',
        'America/Sao_Paulo': 'São Paulo',
        'Australia/Sydney': 'Sydney',
        'Pacific/Auckland': 'Auckland'
    };
    
    // Initialize
    initializeClocks();
    updateSelectedTimeDisplay();
    startClockUpdates();
    
    // Update selected time display
    function updateSelectedTimeDisplay() {
        const timezone = document.getElementById('timezone-selector').value;
        const now = new Date();
        const timeString = now.toLocaleString('en-US', { 
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        document.getElementById('selected-time-display').value = timeString;
    }
    
    // Update time display every second
    setInterval(updateSelectedTimeDisplay, 1000);
    
    // Add clock
    function addClock(timezone, cityName) {
        // Check if clock already exists
        if (clocks.some(clock => clock.timezone === timezone)) {
            showAlert('Đồng hồ này đã tồn tại!', 'warning');
            return;
        }
        
        // Check maximum clocks
        if (clocks.length >= 12) {
            showAlert('Chỉ có thể thêm tối đa 12 đồng hồ!', 'warning');
            return;
        }
        
        const clock = {
            id: Date.now(),
            timezone: timezone,
            cityName: cityName || cityNames[timezone] || timezone
        };
        
        clocks.push(clock);
        saveClocks();
        renderClocks();
        showAlert(`Đã thêm đồng hồ ${clock.cityName}!`, 'success');
        
        // Track clock addition
        if (typeof gtag !== 'undefined') {
            gtag('event', 'clock_added', {
                event_category: 'world_clocks',
                event_label: timezone,
                city_name: clock.cityName
            });
        }
    }
    
    // Remove clock
    function removeClock(id) {
        clocks = clocks.filter(clock => clock.id !== id);
        saveClocks();
        renderClocks();
        showAlert('Đã xóa đồng hồ!', 'success');
    }
    
    // Save clocks to localStorage
    function saveClocks() {
        saveToLocalStorage('worldClocks', clocks);
    }
    
    // Initialize clocks with default cities if empty
    function initializeClocks() {
        if (clocks.length === 0) {
            // Add default clocks
            const defaultTimezones = [
                'Asia/Ho_Chi_Minh',
                'Asia/Tokyo',
                'Europe/London',
                'America/New_York'
            ];
            
            defaultTimezones.forEach(timezone => {
                clocks.push({
                    id: Date.now() + Math.random(),
                    timezone: timezone,
                    cityName: cityNames[timezone]
                });
            });
            
            saveClocks();
        }
        
        renderClocks();
    }
    
    // Render all clocks
    function renderClocks() {
        const container = document.getElementById('clocks-container');
        
        if (clocks.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-clock fa-3x mb-3"></i>
                        <p>Chưa có đồng hồ nào. Hãy thêm đồng hồ từ danh sách bên dưới!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = clocks.map(clock => `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="clock-item">
                    <canvas class="clock-canvas" id="clock-${clock.id}" width="250" height="250"></canvas>
                    <div class="clock-city-name">${clock.cityName}</div>
                    <div class="clock-digital-time" id="digital-${clock.id}">00:00:00</div>
                    <div class="clock-date" id="date-${clock.id}">Loading...</div>
                    <div class="clock-timezone">${clock.timezone}</div>
                    <button class="btn btn-sm btn-outline-danger clock-remove-btn" onclick="window.worldClocksRemove(${clock.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update all clocks immediately
        updateAllClocks();
    }
    
    // Draw analog clock on canvas
    function drawAnalogClock(canvas, time) {
        const ctx = canvas.getContext('2d');
        const radius = canvas.width / 2;
        const centerX = radius;
        const centerY = radius;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply theme
        let bgColor, faceColor, handColor, numberColor, tickColor;
        
        switch(settings.theme) {
            case 'dark':
                bgColor = '#1a1a1a';
                faceColor = '#2a2a2a';
                handColor = '#ffffff';
                numberColor = '#ffffff';
                tickColor = '#666666';
                break;
            case 'colorful':
                bgColor = '#f0f8ff';
                faceColor = '#ffffff';
                handColor = '#ff6b6b';
                numberColor = '#4ecdc4';
                tickColor = '#95e1d3';
                break;
            default: // light
                bgColor = '#f8f9fa';
                faceColor = '#ffffff';
                handColor = '#333333';
                numberColor = '#333333';
                tickColor = '#cccccc';
        }
        
        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw clock face
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
        ctx.fillStyle = faceColor;
        ctx.fill();
        ctx.strokeStyle = handColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw hour markers
        ctx.strokeStyle = tickColor;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const startRadius = radius - 30;
            const endRadius = radius - 20;
            
            const x1 = centerX + startRadius * Math.cos(angle);
            const y1 = centerY + startRadius * Math.sin(angle);
            const x2 = centerX + endRadius * Math.cos(angle);
            const y2 = centerY + endRadius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Draw minute markers
        ctx.strokeStyle = tickColor;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 60; i++) {
            if (i % 5 !== 0) { // Skip hour markers
                const angle = (i * 6 - 90) * Math.PI / 180;
                const startRadius = radius - 25;
                const endRadius = radius - 20;
                
                const x1 = centerX + startRadius * Math.cos(angle);
                const y1 = centerY + startRadius * Math.sin(angle);
                const x2 = centerX + endRadius * Math.cos(angle);
                const y2 = centerY + endRadius * Math.sin(angle);
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        // Draw numbers if enabled
        if (settings.showNumbers) {
            ctx.fillStyle = numberColor;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 1; i <= 12; i++) {
                const angle = (i * 30 - 90) * Math.PI / 180;
                const numberRadius = radius - 45;
                const x = centerX + numberRadius * Math.cos(angle);
                const y = centerY + numberRadius * Math.sin(angle);
                
                ctx.fillText(i.toString(), x, y);
            }
        }
        
        // Get time components
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const seconds = time.getSeconds();
        
        // Draw hour hand
        const hourAngle = ((hours % 12) * 30 + minutes * 0.5 - 90) * Math.PI / 180;
        drawHand(ctx, centerX, centerY, hourAngle, radius * 0.5, 6, handColor);
        
        // Draw minute hand
        const minuteAngle = (minutes * 6 - 90) * Math.PI / 180;
        drawHand(ctx, centerX, centerY, minuteAngle, radius * 0.7, 4, handColor);
        
        // Draw second hand if enabled
        if (settings.showSeconds) {
            const secondAngle = (seconds * 6 - 90) * Math.PI / 180;
            drawHand(ctx, centerX, centerY, secondAngle, radius * 0.75, 2, '#e74c3c');
        }
        
        // Draw center dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = handColor;
        ctx.fill();
        ctx.strokeStyle = faceColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Draw clock hand
    function drawHand(ctx, x, y, angle, length, width, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + length * Math.cos(angle),
            y + length * Math.sin(angle)
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    
    // Update all clocks
    function updateAllClocks() {
        clocks.forEach(clock => {
            const canvas = document.getElementById(`clock-${clock.id}`);
            const digitalDisplay = document.getElementById(`digital-${clock.id}`);
            const dateDisplay = document.getElementById(`date-${clock.id}`);
            
            if (!canvas) return;
            
            // Get time in timezone
            const now = new Date();
            const timeString = now.toLocaleString('en-US', { 
                timeZone: clock.timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const dateString = now.toLocaleDateString('en-US', {
                timeZone: clock.timezone,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Parse time string to get components
            const [hours, minutes, seconds] = timeString.split(':').map(Number);
            const timeDate = new Date();
            timeDate.setHours(hours);
            timeDate.setMinutes(minutes);
            timeDate.setSeconds(seconds);
            
            // Draw analog clock
            drawAnalogClock(canvas, timeDate);
            
            // Update digital display if enabled
            if (digitalDisplay) {
                digitalDisplay.style.display = settings.showDigital ? 'block' : 'none';
                digitalDisplay.textContent = timeString;
            }
            
            // Update date display
            if (dateDisplay) {
                dateDisplay.textContent = dateString;
            }
        });
    }
    
    // Start clock updates
    function startClockUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        updateInterval = setInterval(() => {
            updateAllClocks();
        }, 1000);
    }
    
    // Save settings
    function saveSettings() {
        saveToLocalStorage('worldClocksSettings', settings);
    }
    
    // Event listeners
    document.getElementById('add-clock-btn').addEventListener('click', function() {
        const timezone = document.getElementById('timezone-selector').value;
        const cityName = cityNames[timezone] || timezone;
        addClock(timezone, cityName);
    });
    
    document.getElementById('timezone-selector').addEventListener('change', function() {
        updateSelectedTimeDisplay();
    });
    
    document.getElementById('clear-all-clocks-btn').addEventListener('click', function() {
        if (clocks.length > 0 && confirm('Bạn có chắc muốn xóa tất cả đồng hồ?')) {
            clocks = [];
            saveClocks();
            renderClocks();
            showAlert('Đã xóa tất cả đồng hồ!', 'success');
        }
    });
    
    // Settings event listeners
    document.getElementById('show-seconds').addEventListener('change', function() {
        settings.showSeconds = this.checked;
        saveSettings();
        updateAllClocks();
    });
    
    document.getElementById('show-numbers').addEventListener('change', function() {
        settings.showNumbers = this.checked;
        saveSettings();
        updateAllClocks();
    });
    
    document.getElementById('show-digital').addEventListener('change', function() {
        settings.showDigital = this.checked;
        saveSettings();
        updateAllClocks();
    });
    
    document.getElementById('clock-theme').addEventListener('change', function() {
        settings.theme = this.value;
        saveSettings();
        updateAllClocks();
    });
    
    // Preset city buttons
    document.querySelectorAll('.preset-city-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const timezone = this.dataset.timezone;
            const cityName = this.dataset.city;
            addClock(timezone, cityName);
        });
    });
    
    // Expose remove function globally for inline onclick
    window.worldClocksRemove = removeClock;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    });
});
