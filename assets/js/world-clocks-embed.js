(function() {
    function init() {
        const embeds = document.querySelectorAll('.world-clock-embed');
        embeds.forEach(embed => {
            if (embed.dataset.initialized) return;
            embed.dataset.initialized = 'true';
            
            const canvas = embed.querySelector('.clock-canvas');
            const digitalDisplay = embed.querySelector('.clock-digital-time');
            const dateDisplay = embed.querySelector('.clock-date');
            
            if (!canvas) return;
            
            const timezone = embed.getAttribute('data-timezone') || 'UTC';
            const showSeconds = embed.getAttribute('data-seconds') !== 'false';
            const showNumbers = embed.getAttribute('data-numbers') !== 'false';
            const showDigital = embed.getAttribute('data-digital') !== 'false';
            const theme = embed.getAttribute('data-theme') || 'light';
            
            if (digitalDisplay) {
                digitalDisplay.style.display = showDigital ? 'block' : 'none';
            }
            
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
            
            function updateClock() {
                const now = new Date();
                let timeString = '';
                let dateString = '';
                try {
                    timeString = now.toLocaleString('en-US', { 
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    });
                    
                    dateString = now.toLocaleDateString('en-US', {
                        timeZone: timezone,
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    timeString = '00:00:00';
                    dateString = '';
                }
                
                // Parse time components
                const [hours, minutes, seconds] = timeString.split(':').map(Number);
                const timeDate = new Date();
                timeDate.setHours(hours);
                timeDate.setMinutes(minutes);
                timeDate.setSeconds(seconds);
                
                const ctx = canvas.getContext('2d');
                const radius = canvas.width / 2;
                const centerX = radius;
                const centerY = radius;
                
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                let bgColor, faceColor, handColor, numberColor, tickColor;
                switch(theme) {
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
                
                // Draw face
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
                ctx.fillStyle = faceColor;
                ctx.fill();
                ctx.strokeStyle = handColor;
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Hour markers
                ctx.strokeStyle = tickColor;
                ctx.lineWidth = 2;
                for (let i = 0; i < 12; i++) {
                    const angle = (i * 30 - 90) * Math.PI / 180;
                    const x1 = centerX + (radius - 30) * Math.cos(angle);
                    const y1 = centerY + (radius - 30) * Math.sin(angle);
                    const x2 = centerX + (radius - 20) * Math.cos(angle);
                    const y2 = centerY + (radius - 20) * Math.sin(angle);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                
                // Minute markers
                ctx.strokeStyle = tickColor;
                ctx.lineWidth = 1;
                for (let i = 0; i < 60; i++) {
                    if (i % 5 !== 0) {
                        const angle = (i * 6 - 90) * Math.PI / 180;
                        const x1 = centerX + (radius - 25) * Math.cos(angle);
                        const y1 = centerY + (radius - 25) * Math.sin(angle);
                        const x2 = centerX + (radius - 20) * Math.cos(angle);
                        const y2 = centerY + (radius - 20) * Math.sin(angle);
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                }
                
                if (showNumbers) {
                    ctx.fillStyle = numberColor;
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    for (let i = 1; i <= 12; i++) {
                        const angle = (i * 30 - 90) * Math.PI / 180;
                        const x = centerX + (radius - 45) * Math.cos(angle);
                        const y = centerY + (radius - 45) * Math.sin(angle);
                        ctx.fillText(i.toString(), x, y);
                    }
                }
                
                const hrAngle = ((hours % 12) * 30 + minutes * 0.5 - 90) * Math.PI / 180;
                drawHand(ctx, centerX, centerY, hrAngle, radius * 0.5, 6, handColor);
                
                const minAngle = (minutes * 6 - 90) * Math.PI / 180;
                drawHand(ctx, centerX, centerY, minAngle, radius * 0.7, 4, handColor);
                
                if (showSeconds) {
                    const secAngle = (seconds * 6 - 90) * Math.PI / 180;
                    drawHand(ctx, centerX, centerY, secAngle, radius * 0.75, 2, '#e74c3c');
                }
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
                ctx.fillStyle = handColor;
                ctx.fill();
                ctx.strokeStyle = faceColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                if (digitalDisplay) {
                    digitalDisplay.textContent = timeString;
                }
                if (dateDisplay) {
                    dateDisplay.textContent = dateString;
                }
            }
            
            updateClock();
            setInterval(updateClock, 1000);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
