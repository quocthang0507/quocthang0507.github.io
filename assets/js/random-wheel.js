// Random Wheel functionality
document.addEventListener('DOMContentLoaded', function() {
    const SOUND_END_LEAD_MS = 500;
    const SUSPENSE_SETTLE_MS = 1000;
    const ALLOWED_SPIN_DURATIONS = [3000, 5000, 7000];

    let names = loadFromLocalStorage('wheelNames') || [];
    let spinHistory = loadFromLocalStorage('wheelSpinHistory') || [];
    let isSpinning = false;
    let currentRotation = 0;
    let currentColorTheme = 'classic';
    let spinDurationMs = 3000;
    let suspenseEffectEnabled = false;
    try {
        currentColorTheme = localStorage.getItem('wheelColorTheme') || 'classic';
    } catch (e) {
        console.warn('localStorage is blocked or unavailable:', e);
    }
    try {
        const savedDuration = Number(JSON.parse(localStorage.getItem('wheelSpinDuration')));
        if (ALLOWED_SPIN_DURATIONS.includes(savedDuration)) {
            spinDurationMs = savedDuration;
        }
        suspenseEffectEnabled = JSON.parse(localStorage.getItem('wheelSuspenseEffect')) === true;
    } catch (e) {
        console.warn('Spin settings could not be restored:', e);
    }
    
    const presets = {
        colors: ['Đỏ', 'Xanh lá', 'Xanh dương', 'Vàng', 'Tím', 'Cam', 'Hồng', 'Nâu'],
        animals: ['Chó', 'Mèo', 'Voi', 'Sư tử', 'Hổ', 'Gấu', 'Thỏ', 'Cáo'],
        fruits: ['Táo', 'Chuối', 'Cam', 'Nho', 'Dâu', 'Dứa', 'Xoài', 'Lê'],
        numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    };
    
    // Color theme presets
    const colorThemes = {
        classic: {
            name: 'Classic',
            colors: [
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
                '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
                '#f1c40f', '#e91e63', '#673ab7', '#00bcd4',
                '#4caf50', '#ff5722', '#795548', '#607d8b'
            ]
        },
        vibrant: {
            name: 'Vibrant',
            colors: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
                '#F8B739', '#52B788', '#F48FB1', '#4DB8FF',
                '#FFD93D', '#6BCF7F', '#A78BFA', '#FB8B24'
            ]
        },
        pastel: {
            name: 'Pastel',
            colors: [
                '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
                '#E0BBE4', '#FFDFD3', '#D4F1F4', '#FFE5B4',
                '#C7CEEA', '#FFC8DD', '#CCD5AE', '#E0AFA0',
                '#B4E7CE', '#F6BD60', '#E5B8F4', '#A8DADC'
            ]
        },
        neon: {
            name: 'Neon',
            colors: [
                '#FF10F0', '#39FF14', '#FFFF00', '#FF3F00',
                '#00F0FF', '#BC13FE', '#FF073A', '#7FFF00',
                '#FE4EDA', '#4D4DFF', '#FFB900', '#FE019A',
                '#39FF14', '#FF6EC7', '#08F7FE', '#DEFE47'
            ]
        },
        ocean: {
            name: 'Ocean',
            colors: [
                '#006994', '#1E88A8', '#3FA7D6', '#59C3F0',
                '#7AD8F5', '#89CFF0', '#4FA3CC', '#2E8BC0',
                '#0077B6', '#00B4D8', '#90E0EF', '#48CAE4',
                '#00A3C4', '#0096C7', '#0288D1', '#029ACA'
            ]
        },
        sunset: {
            name: 'Sunset',
            colors: [
                '#FF6B35', '#F7931E', '#FDC830', '#F37335',
                '#FFA07A', '#FF7F50', '#FF8C42', '#FF6F61',
                '#FF5E5B', '#D64545', '#FA8072', '#E9573F',
                '#FF6B6B', '#EE6352', '#FF9A76', '#FFA384'
            ]
        },
        forest: {
            name: 'Forest',
            colors: [
                '#2D5016', '#406343', '#4A7C59', '#56A36C',
                '#6BB77B', '#7EC488', '#90D399', '#A7DBA9',
                '#50723C', '#73A24E', '#8FBC66', '#A8D08D',
                '#C7E9C0', '#87B87F', '#6DA76A', '#4F9153'
            ]
        },
        candy: {
            name: 'Candy',
            colors: [
                '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB',
                '#FF85C1', '#FF6B9D', '#FF1493', '#C71585',
                '#DA70D6', '#EE82EE', '#DDA0DD', '#D8BFD8',
                '#FF77FF', '#F754E1', '#FF00FF', '#FF69EB'
            ]
        },
        autumn: {
            name: 'Autumn',
            colors: [
                '#8B4513', '#A0522D', '#D2691E', '#CD853F',
                '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F',
                '#B8860B', '#DAA520', '#CD5C5C', '#A0522D',
                '#8B7355', '#C19A6B', '#B87333', '#966919'
            ]
        },
        monochrome: {
            name: 'Monochrome',
            colors: [
                '#1A1A1A', '#333333', '#4D4D4D', '#666666',
                '#808080', '#999999', '#B3B3B3', '#CCCCCC',
                '#2B2B2B', '#404040', '#595959', '#737373',
                '#8C8C8C', '#A6A6A6', '#BFBFBF', '#D9D9D9'
            ]
        },
        rainbow: {
            name: 'Rainbow',
            colors: [
                '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
                '#0000FF', '#4B0082', '#9400D3', '#FF1493',
                '#FF4500', '#FFD700', '#7FFF00', '#00FFFF',
                '#1E90FF', '#8A2BE2', '#FF69B4', '#DC143C'
            ]
        },
        earth: {
            name: 'Earth',
            colors: [
                '#8B7355', '#A0826D', '#C19A6B', '#D2B48C',
                '#8B4513', '#A0522D', '#B87333', '#CD853F',
                '#7B6043', '#93785B', '#AB8F76', '#C4A88F',
                '#6B5344', '#86705D', '#9D8777', '#B39D8F'
            ]
        }
    };
    
    // Audio context for generating spinning sound
    let audioContext;
    let gainNode;
    let oscillator;
    
    // Initialize audio context
    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    // Play spinning sound
    function playSpinSound(soundDurationMs) {
        if (!audioContext) {
            initAudio();
        }
        
        if (audioContext) {
            // Try to play HTML audio first
            const audioElement = document.getElementById('wheel-spin-audio');
            if (audioElement && audioElement.canPlayType && audioElement.canPlayType('audio/mpeg') !== '') {
                audioElement.currentTime = 0;
                audioElement.play().catch(() => {
                    // Fallback to Web Audio API
                    generateSpinSound(soundDurationMs);
                });
            } else {
                generateSpinSound(soundDurationMs);
            }
        }
    }
    
    // Stop spinning sound
    function stopSpinSound() {
        // Stop HTML audio element
        const audioElement = document.getElementById('wheel-spin-audio');
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        
        // Stop Web Audio API oscillator
        if (oscillator) {
            try {
                oscillator.stop();
                oscillator.disconnect();
                oscillator = null;
            } catch (e) {
                // Oscillator may already be stopped
                oscillator = null;
            }
        }
    }
    
    // Generate spinning sound using Web Audio API
    function generateSpinSound(soundDurationMs) {
        if (!audioContext) return;

        const soundDurationSeconds = soundDurationMs / 1000;
        
        // Stop any existing sound
        if (oscillator) {
            try {
                oscillator.stop();
                oscillator.disconnect();
            } catch (e) {
                // Oscillator may already be stopped
            }
        }
        
        // Create oscillator for spinning sound
        oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        
        oscillator.connect(envelope);
        envelope.connect(gainNode);
        
        // Configure sound
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + soundDurationSeconds);
        
        envelope.gain.setValueAtTime(0.1, audioContext.currentTime);
        envelope.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundDurationSeconds);
        
        oscillator.type = 'sawtooth';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + soundDurationSeconds);
    }
    
    // Get current wheel colors based on selected theme
    function getWheelColors() {
        return colorThemes[currentColorTheme]?.colors || colorThemes.classic.colors;
    }
    
    // Change color theme
    function changeColorTheme(theme) {
        if (colorThemes[theme]) {
            currentColorTheme = theme;
            try {
                localStorage.setItem('wheelColorTheme', theme);
            } catch (e) {
                console.warn('localStorage is blocked:', e);
            }
            updateNamesDisplay();
            updateWheelDisplay();
            
            // Update theme selector
            const themeSelector = document.getElementById('color-theme-selector');
            if (themeSelector) {
                themeSelector.value = theme;
            }
            
            // Track theme change
            if (typeof gtag !== 'undefined') {
                gtag('event', 'color_theme_change', {
                    event_category: 'random_wheel_customization',
                    event_label: theme
                });
            }
        }
    }
    
    // Initialize color theme selector
    function initializeColorThemeSelector() {
        const themeSelector = document.getElementById('color-theme-selector');
        if (themeSelector) {
            // Populate theme options
            themeSelector.innerHTML = Object.entries(colorThemes).map(([key, theme]) => 
                `<option value="${key}" ${key === currentColorTheme ? 'selected' : ''}>${theme.name}</option>`
            ).join('');
            
            // Add change event listener
            themeSelector.addEventListener('change', function() {
                changeColorTheme(this.value);
            });
        }
    }

    function initializeSpinSettings() {
        const durationSelector = document.getElementById('spin-duration-selector');
        const suspenseCheckbox = document.getElementById('suspense-effect');

        if (durationSelector) {
            durationSelector.value = String(spinDurationMs);
            durationSelector.addEventListener('change', function() {
                const selectedDuration = Number(this.value);
                if (!ALLOWED_SPIN_DURATIONS.includes(selectedDuration)) return;
                spinDurationMs = selectedDuration;
                saveToLocalStorage('wheelSpinDuration', spinDurationMs);
            });
        }

        if (suspenseCheckbox) {
            suspenseCheckbox.checked = suspenseEffectEnabled;
            suspenseCheckbox.addEventListener('change', function() {
                suspenseEffectEnabled = this.checked;
                saveToLocalStorage('wheelSuspenseEffect', suspenseEffectEnabled);
            });
        }
    }

    function setSpinControlsDisabled(disabled) {
        ['spin-duration-selector', 'suspense-effect', 'reset-wheel-btn'].forEach(id => {
            const control = document.getElementById(id);
            if (control) control.disabled = disabled;
        });
    }
    
    // Initialize
    initializeColorThemeSelector();
    initializeSpinSettings();
    updateNamesDisplay();
    updateWheelDisplay();
    updateHistoryDisplay();
    updateStatistics();
    
    // Add name
    function addName(name) {
        name = name.trim();
        if (name === '') {
            showAlert(window.t('wheel.warn.enter_name', 'Vui lòng nhập tên!'), 'warning');
            return;
        }
        
        if (name.length > 20) {
            showAlert(window.t('wheel.warn.name_too_long', 'Tên không được dài quá 20 ký tự!'), 'warning');
            return;
        }
        
        if (names.includes(name)) {
            showAlert(window.t('wheel.warn.name_exists', 'Tên này đã tồn tại!'), 'warning');
            return;
        }
        
        if (names.length >= 200) {
            showAlert(window.t('wheel.warn.limit_reached', 'Chỉ có thể thêm tối đa 200 tên!'), 'warning');
            return;
        }
        
        names.push(name);
        saveNames();
        updateNamesDisplay();
        updateWheelDisplay();
        updateStatistics();
        
        // Clear input
        document.getElementById('name-input').value = '';
    }
    
    // Remove name
    function removeName(index) {
        names.splice(index, 1);
        saveNames();
        updateNamesDisplay();
        updateWheelDisplay();
        updateStatistics();
    }
    
    // Save names to localStorage
    function saveNames() {
        saveToLocalStorage('wheelNames', names);
    }
    
    // Update names display
    function updateNamesDisplay() {
        const namesList = document.getElementById('names-list');
        
        if (names.length === 0) {
            namesList.innerHTML = '<p class="text-muted text-center">Chưa có tên nào</p>';
            document.getElementById('spin-btn').disabled = true;
            return;
        }
        
        document.getElementById('spin-btn').disabled = false;
        
        const wheelColors = getWheelColors();
        namesList.innerHTML = names.map((name, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <span class="name-item" style="color: ${wheelColors[index % wheelColors.length]}">
                    <i class="fas fa-circle"></i> ${name}
                </span>
                <button class="btn btn-outline-danger btn-sm remove-name-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.remove-name-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                removeName(index);
            });
        });
    }
    
    // Update wheel display
    function updateWheelDisplay() {
        const wheelNames = document.getElementById('wheel-names');
        
        if (names.length === 0) {
            wheelNames.innerHTML = '';
            return;
        }
        
        // Create canvas if it doesn't exist
        let canvas = wheelNames.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            wheelNames.innerHTML = '';
            wheelNames.appendChild(canvas);
        }

        // Match canvas backing store to displayed size (fixes blurry / stretched / clipped wheel)
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const cssSize = Math.max(1, Math.floor(Math.min(rect.width, rect.height) || 400));

        // Keep canvas square
        canvas.width = Math.round(cssSize * dpr);
        canvas.height = Math.round(cssSize * dpr);

        const ctx = canvas.getContext('2d');
        // Clear using device pixels, then draw in CSS pixels
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const centerX = cssSize / 2;
        const centerY = cssSize / 2;
        const radius = cssSize / 2;
        const anglePerSection = (2 * Math.PI) / names.length;
        const wheelColors = getWheelColors();
        
        // Draw wheel segments
        names.forEach((name, index) => {
            const startAngle = index * anglePerSection - Math.PI / 2; // Start from top
            const endAngle = (index + 1) * anglePerSection - Math.PI / 2;
            
            let colorIndex = index % wheelColors.length;
            // Avoid color clash at the boundary (first and last slice)
            if (index === names.length - 1 && names.length > 1) {
                const prevColorIndex = (index - 1) % wheelColors.length;
                const firstColorIndex = 0;
                // If it matches either, find a different one
                if (colorIndex === firstColorIndex || colorIndex === prevColorIndex) {
                    colorIndex = (colorIndex + 1) % wheelColors.length;
                    // If it still matches prev (e.g. C is very small), try another shift
                    if (colorIndex === prevColorIndex || colorIndex === firstColorIndex) {
                        colorIndex = (colorIndex + 2) % wheelColors.length;
                    }
                }
            }
            const color = wheelColors[colorIndex];
            
            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text
            ctx.save();
            
            // Calculate text angle (bisector of the segment)
            const textAngle = startAngle + anglePerSection / 2;
            
            // Translate to center and rotate by textAngle
            ctx.translate(centerX, centerY);
            ctx.rotate(textAngle);
            
            // Determine base font size based on the number of items
            let baseFontSize = 16;
            if (names.length > 120) {
                baseFontSize = 7;
            } else if (names.length > 80) {
                baseFontSize = 8;
            } else if (names.length > 50) {
                baseFontSize = 10;
            } else if (names.length > 30) {
                baseFontSize = 12;
            } else if (names.length > 16) {
                baseFontSize = 14;
            }
            
            // Scale font size based on current wheel radius (standardizing at radius=200)
            let fontSize = Math.max(6, Math.floor(baseFontSize * (radius / 200)));
            
            ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            
            // Truncate name if it's too long to prevent it from overlapping near the center
            const maxTextWidth = radius * 0.7;
            let displayName = name;
            if (ctx.measureText(displayName).width > maxTextWidth) {
                while (displayName.length > 0 && ctx.measureText(displayName + '...').width > maxTextWidth) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '...';
            }
            
            // Draw text near the outer rim (e.g. at 88% of radius) flowing inwards
            ctx.fillText(displayName, radius * 0.88, 0);
            
            ctx.restore();
        });
    }
    
    // Spin wheel
    function spinWheel() {
        if (isSpinning || names.length === 0) return;
        
        isSpinning = true;
        document.getElementById('spin-btn').disabled = true;
        document.getElementById('spin-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang quay...';
        
        // Track wheel spin start
        if (typeof gtag !== 'undefined') {
            gtag('event', 'wheel_spin_start', {
                event_category: 'random_wheel_tools',
                event_label: 'wheel_interaction',
                total_options: names.length
            });
        }
        
        const activeSpinDurationMs = spinDurationMs;
        const activeSuspenseEffect = suspenseEffectEnabled;
        const soundDurationMs = Math.max(0, activeSpinDurationMs - SOUND_END_LEAD_MS);
        setSpinControlsDisabled(true);

        // Play spinning sound. It ends 0.5 second before the result.
        playSpinSound(soundDurationMs);

        // Select a fair random section, then calculate a matching rotation.
        const minSpins = 3;
        const maxSpins = 6;
        const fullSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
        const anglePerSection = 360 / names.length;
        const selectedIndex = Math.floor(Math.random() * names.length);
        const boundaryOffset = Math.min(3, Math.max(0.5, anglePerSection * 0.04));
        const targetOffset = activeSuspenseEffect
            ? boundaryOffset
            : anglePerSection * (0.2 + Math.random() * 0.6);
        const targetNormalizedAngle = (selectedIndex * anglePerSection + targetOffset) % 360;
        const targetRotationModulo = (360 - targetNormalizedAngle) % 360;
        const currentRotationModulo = ((currentRotation % 360) + 360) % 360;
        const rotationToTarget = (targetRotationModulo - currentRotationModulo + 360) % 360;
        const totalRotation = fullSpins * 360 + rotationToTarget;

        currentRotation += totalRotation;

        // Rotate only the wheel content, not the center button.
        const wheelNames = document.getElementById('wheel-names');
        const mainSpinDurationMs = activeSuspenseEffect
            ? activeSpinDurationMs - SUSPENSE_SETTLE_MS
            : activeSpinDurationMs;
        wheelNames.style.transition = `transform ${mainSpinDurationMs}ms cubic-bezier(0.23, 1, 0.32, 1)`;
        wheelNames.style.transform = `rotate(${currentRotation}deg)`;

        if (activeSuspenseEffect) {
            const shouldCreepToPreviousSection = Math.random() < 0.5;
            setTimeout(() => {
                if (!shouldCreepToPreviousSection) return;

                // Cross the nearby divider slowly, changing the final result.
                const creepDegrees = Math.max(
                    boundaryOffset * 2,
                    Math.min(12, anglePerSection * 0.35)
                );
                currentRotation += creepDegrees;
                wheelNames.style.transition = `transform ${SUSPENSE_SETTLE_MS}ms cubic-bezier(0.16, 0.72, 0.2, 1)`;
                wheelNames.style.transform = `rotate(${currentRotation}deg)`;
            }, mainSpinDurationMs);
        }

        // Let the wheel coast silently for the final 0.5 second.
        setTimeout(stopSpinSound, soundDurationMs);
        
        // Calculate winner after animation
        setTimeout(() => {
            const normalizedAngle = (360 - (currentRotation % 360)) % 360;
            const anglePerSection = 360 / names.length;
            const winnerIndex = Math.floor(normalizedAngle / anglePerSection);
            const winner = names[winnerIndex];
            
            // Track wheel spin result
            if (typeof gtag !== 'undefined') {
                gtag('event', 'wheel_spin_complete', {
                    event_category: 'random_wheel_tools',
                    event_label: 'wheel_result',
                    winner_index: winnerIndex,
                    total_options: names.length
                });
            }
            
            showWinner(winner, winnerIndex);
            
            isSpinning = false;
            setSpinControlsDisabled(false);
            document.getElementById('spin-btn').disabled = false;
            document.getElementById('spin-btn').innerHTML = '<i class="fas fa-play"></i> Quay bánh xe';
        }, activeSpinDurationMs);
    }
    
    // Show winner
    function showWinner(winner, winnerIndex) {
        const resultElement = document.getElementById('wheel-result');
        if (resultElement) {
            resultElement.textContent = winner;
        }
        
        // Add to history
        const historyItem = {
            winner: winner,
            timestamp: new Date().toLocaleString('vi-VN'),
            totalNames: names.length
        };
        
        spinHistory.unshift(historyItem);
        if (spinHistory.length > 50) {
            spinHistory = spinHistory.slice(0, 50);
        }
        
        saveToLocalStorage('wheelSpinHistory', spinHistory);
        updateHistoryDisplay();
        updateStatistics();
        
        // Show confetti effect
        const confettiElement = document.getElementById('confetti-effect');
        if (confettiElement && confettiElement.checked) {
            showConfetti();
        }
        
        // Remove winner if option is checked
        const removeWinnerElement = document.getElementById('remove-winner');
        if (removeWinnerElement && removeWinnerElement.checked) {
            setTimeout(() => {
                if (confirm(window.t('wheel.warn.remove_winner_confirm', 'Xóa "{name}" khỏi danh sách?').replace('{name}', winner))) {
                    removeName(winnerIndex);
                }
            }, 1000);
        }
        
        showAlert(window.t('wheel.warn.winner_alert', '🎉 Người thắng: {name}!').replace('{name}', winner), 'success');
    }
    
    // Show confetti effect
    function showConfetti() {
        // Simple confetti effect using CSS animation
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '9999';
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.innerHTML = ['🎉', '🎊', '⭐', '✨', '🌟'][Math.floor(Math.random() * 5)];
            confetti.style.position = 'absolute';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.fontSize = Math.random() * 20 + 20 + 'px';
            confetti.style.animation = `confetti-fall ${Math.random() * 2 + 2}s linear forwards`;
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 4000);
        
        // Add CSS animation if not exists
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Update history display
    function updateHistoryDisplay() {
        const historyDiv = document.getElementById('spin-history');
        
        if (!historyDiv) return; // Safety check for missing element
        
        if (spinHistory.length === 0) {
            historyDiv.innerHTML = '<p class="text-muted text-center">Chưa có lịch sử</p>';
            return;
        }
        
        historyDiv.innerHTML = spinHistory.map((item, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border-start border-4 border-primary bg-light rounded">
                <div>
                    <strong>${item.winner}</strong>
                    <small class="text-muted d-block">${item.timestamp}</small>
                    <small class="text-muted">Từ ${item.totalNames} tên</small>
                </div>
                <button class="btn btn-outline-danger btn-sm delete-history-item-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Add delete event listeners
        document.querySelectorAll('.delete-history-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                spinHistory.splice(index, 1);
                saveToLocalStorage('wheelSpinHistory', spinHistory);
                updateHistoryDisplay();
                updateStatistics();
            });
        });
    }
    
    // Update statistics
    function updateStatistics() {
        const totalSpinsElement = document.getElementById('total-spins');
        const currentNamesElement = document.getElementById('current-names-count');
        const topWinnersElement = document.getElementById('top-winners');
        
        if (totalSpinsElement) totalSpinsElement.textContent = spinHistory.length;
        if (currentNamesElement) currentNamesElement.textContent = names.length;
        
        if (!topWinnersElement) return; // Safety check
        
        // Calculate top winners
        if (spinHistory.length > 0) {
            const winnerCounts = {};
            spinHistory.forEach(item => {
                winnerCounts[item.winner] = (winnerCounts[item.winner] || 0) + 1;
            });
            
            const sortedWinners = Object.entries(winnerCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
            
            const topWinnersHTML = sortedWinners.map(([name, count]) => 
                `<div class="d-flex justify-content-between">
                    <span>${name}</span>
                    <span class="badge bg-primary">${count}</span>
                </div>`
            ).join('');
            
            topWinnersElement.innerHTML = topWinnersHTML;
        } else {
            topWinnersElement.innerHTML = '<p class="text-muted">Chưa có dữ liệu</p>';
        }
    }
    
    // Export data
    function exportData() {
        const data = {
            names: names,
            history: spinHistory,
            exportDate: new Date().toISOString()
        };
        
        const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement('a');
        link.setAttribute('href', jsonContent);
        link.setAttribute('download', `wheel-data-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert(window.t('wheel.warn.export_success', 'Đã xuất dữ liệu thành công!'), 'success');
    }
    
    // Event listeners
    document.getElementById('add-name-btn').addEventListener('click', function() {
        const nameInput = document.getElementById('name-input');
        addName(nameInput.value);
    });
    
    document.getElementById('name-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addName(this.value);
        }
    });
    
    document.getElementById('add-bulk-btn').addEventListener('click', function() {
        const bulkNames = document.getElementById('bulk-names').value;
        const nameList = bulkNames.split('\n').filter(name => name.trim() !== '');
        
        let addedCount = 0;
        nameList.forEach(name => {
            name = name.trim();
            if (name && !names.includes(name) && names.length < 200) {
                names.push(name);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            saveNames();
            updateNamesDisplay();
            updateWheelDisplay();
            updateStatistics();
            document.getElementById('bulk-names').value = '';
            showAlert(window.t('wheel.warn.added_count', 'Đã thêm {count} tên!').replace('{count}', addedCount), 'success');
        }
    });
    
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    
    document.getElementById('reset-wheel-btn').addEventListener('click', function() {
        const wheelNames = document.getElementById('wheel-names');
        currentRotation = 0;
        wheelNames.style.transition = 'none';
        wheelNames.style.transform = 'rotate(0deg)';
        document.getElementById('wheel-result').textContent = 'Thêm tên và nhấn "Quay bánh xe"';
    });
 
    // Redraw on resize to keep canvas aligned with responsive wheel size
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!isSpinning) {
                updateWheelDisplay();
            }
        }, 150);
    });
    
    document.getElementById('clear-names-btn').addEventListener('click', function() {
        if (names.length > 0 && confirm(window.t('wheel.warn.clear_all_confirm', 'Bạn có chắc muốn xóa tất cả tên?'))) {
            names = [];
            saveNames();
            updateNamesDisplay();
            updateWheelDisplay();
            updateStatistics();
            showAlert(window.t('wheel.warn.clear_all_success', 'Đã xóa tất cả tên!'), 'success');
        }
    });
    
    document.getElementById('clear-history-wheel-btn').addEventListener('click', function() {
        if (spinHistory.length > 0 && confirm(window.t('wheel.warn.clear_history_confirm', 'Bạn có chắc muốn xóa lịch sử?'))) {
            spinHistory = [];
            saveToLocalStorage('wheelSpinHistory', spinHistory);
            updateHistoryDisplay();
            updateStatistics();
            showAlert(window.t('wheel.warn.clear_history_success', 'Đã xóa lịch sử!'), 'success');
        }
    });
    
    document.getElementById('export-wheel-data-btn').addEventListener('click', exportData);
    
    // Preset buttons
    document.querySelectorAll('.preset-names-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const presetName = this.dataset.preset;
            if (presets[presetName]) {
                names = [...presets[presetName]];
                saveNames();
                updateNamesDisplay();
                updateWheelDisplay();
                updateStatistics();
                showAlert(window.t('wheel.warn.preset_loaded', 'Đã tải preset: {name}!').replace('{name}', presetName), 'success');
                
                // Track preset usage
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'wheel_preset_load', {
                        event_category: 'random_wheel_tools',
                        event_label: presetName,
                        preset_type: presetName,
                        preset_size: presets[presetName].length
                    });
                }
            }
        });
    });
});
