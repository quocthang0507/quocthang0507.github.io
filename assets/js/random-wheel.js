// Random Wheel functionality
document.addEventListener('DOMContentLoaded', function() {
    let names = loadFromLocalStorage('wheelNames') || [];
    let spinHistory = loadFromLocalStorage('wheelSpinHistory') || [];
    let isSpinning = false;
    let currentRotation = 0;
    
    const presets = {
        colors: ['Đỏ', 'Xanh lá', 'Xanh dương', 'Vàng', 'Tím', 'Cam', 'Hồng', 'Nâu'],
        animals: ['Chó', 'Mèo', 'Voi', 'Sư tử', 'Hổ', 'Gấu', 'Thỏ', 'Cáo'],
        fruits: ['Táo', 'Chuối', 'Cam', 'Nho', 'Dâu', 'Dứa', 'Xoài', 'Lê'],
        numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
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
    function playSpinSound() {
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
                    generateSpinSound();
                });
            } else {
                generateSpinSound();
            }
        }
    }
    
    // Generate spinning sound using Web Audio API
    function generateSpinSound() {
        if (!audioContext) return;
        
        // Stop any existing sound
        if (oscillator) {
            oscillator.stop();
        }
        
        // Create oscillator for spinning sound
        oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        
        oscillator.connect(envelope);
        envelope.connect(gainNode);
        
        // Configure sound
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 3);
        
        envelope.gain.setValueAtTime(0.1, audioContext.currentTime);
        envelope.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
        
        oscillator.type = 'sawtooth';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 3);
    }
    
    const wheelColors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
        '#ffeaa7', '#dda0dd', '#ff9ff3', '#54a0ff',
        '#5f27cd', '#00d2d3', '#ff9f43', '#ee5a24',
        '#0abde3', '#10ac84', '#f368e0', '#ff3838'
    ];
    
    // Initialize
    updateNamesDisplay();
    updateWheelDisplay();
    updateHistoryDisplay();
    updateStatistics();
    
    // Add name
    function addName(name) {
        name = name.trim();
        if (name === '') {
            showAlert('Vui lòng nhập tên!', 'warning');
            return;
        }
        
        if (name.length > 20) {
            showAlert('Tên không được dài quá 20 ký tự!', 'warning');
            return;
        }
        
        if (names.includes(name)) {
            showAlert('Tên này đã tồn tại!', 'warning');
            return;
        }
        
        if (names.length >= 16) {
            showAlert('Chỉ có thể thêm tối đa 16 tên!', 'warning');
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
        
        const anglePerSection = 360 / names.length;
        
        // Create SVG-based wheel segments for better control
        const svgSegments = names.map((name, index) => {
            const startAngle = index * anglePerSection;
            const endAngle = (index + 1) * anglePerSection;
            const color = wheelColors[index % wheelColors.length];
            
            // Convert angles to radians
            const startRad = (startAngle - 90) * Math.PI / 180; // -90 to start from top
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            // Calculate path coordinates for the slice
            const radius = 225; // Half of wheel size (450px / 2)
            const centerX = 225;
            const centerY = 225;
            
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);
            
            // Large arc flag
            const largeArcFlag = anglePerSection > 180 ? 1 : 0;
            
            // Create path for the slice
            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');
            
            // Calculate text position and rotation for pointing toward center
            const textAngle = (startAngle + endAngle) / 2;
            const textRad = (textAngle - 90) * Math.PI / 180;
            const textRadius = radius * 0.7; // 70% of radius
            const textX = centerX + textRadius * Math.cos(textRad);
            const textY = centerY + textRadius * Math.sin(textRad);
            
            // Calculate rotation angle so text points toward center
            // Text should be perpendicular to the radius line
            let textRotation = textAngle;
            
            // If text would be upside down, rotate it 180 degrees
            if (textAngle > 90 && textAngle < 270) {
                textRotation = textAngle + 180;
            }
            
            // For better readability, adjust text to point radially inward
            const radialAngle = textAngle + 90; // Perpendicular to radius
            let finalRotation = radialAngle;
            
            // Keep text right-side up
            if (radialAngle > 90 && radialAngle < 270) {
                finalRotation = radialAngle + 180;
            }
            
            // Adjust font size based on segment count and name length
            let fontSize = names.length > 12 ? '10px' : names.length > 8 ? '12px' : '14px';
            if (name.length > 10) fontSize = names.length > 8 ? '8px' : '10px';
            
            return `
                <g>
                    <path d="${pathData}" fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
                    <text x="${textX}" y="${textY}" 
                          text-anchor="middle" 
                          dominant-baseline="central"
                          transform="rotate(${finalRotation}, ${textX}, ${textY})"
                          fill="white" 
                          font-weight="bold" 
                          font-size="${fontSize}"
                          style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                        ${name}
                    </text>
                </g>
            `;
        }).join('');
        
        wheelNames.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 450 450" style="position: absolute; top: 0; left: 0;">
                ${svgSegments}
            </svg>
        `;
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
        
        // Play spinning sound
        playSpinSound();
        
        // Random rotation (multiple full rotations + random angle)
        const minSpins = 3;
        const maxSpins = 6;
        const randomSpins = Math.random() * (maxSpins - minSpins) + minSpins;
        const randomAngle = Math.random() * 360;
        const totalRotation = randomSpins * 360 + randomAngle;
        
        currentRotation += totalRotation;
        
        const wheel = document.getElementById('wheel');
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        
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
            document.getElementById('spin-btn').disabled = false;
            document.getElementById('spin-btn').innerHTML = '<i class="fas fa-play"></i> Quay bánh xe';
        }, 3000);
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
                if (confirm(`Xóa "${winner}" khỏi danh sách?`)) {
                    removeName(winnerIndex);
                }
            }, 1000);
        }
        
        showAlert(`🎉 Người thắng: ${winner}!`, 'success');
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
        
        showAlert('Đã xuất dữ liệu thành công!', 'success');
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
            if (name && !names.includes(name) && names.length < 16) {
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
            showAlert(`Đã thêm ${addedCount} tên!`, 'success');
        }
    });
    
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    
    document.getElementById('reset-wheel-btn').addEventListener('click', function() {
        const wheel = document.getElementById('wheel');
        currentRotation = 0;
        wheel.style.transform = 'rotate(0deg)';
        document.getElementById('wheel-result').textContent = 'Thêm tên và nhấn "Quay bánh xe"';
    });
    
    document.getElementById('clear-names-btn').addEventListener('click', function() {
        if (names.length > 0 && confirm('Bạn có chắc muốn xóa tất cả tên?')) {
            names = [];
            saveNames();
            updateNamesDisplay();
            updateWheelDisplay();
            updateStatistics();
            showAlert('Đã xóa tất cả tên!', 'success');
        }
    });
    
    document.getElementById('clear-history-wheel-btn').addEventListener('click', function() {
        if (spinHistory.length > 0 && confirm('Bạn có chắc muốn xóa lịch sử?')) {
            spinHistory = [];
            saveToLocalStorage('wheelSpinHistory', spinHistory);
            updateHistoryDisplay();
            updateStatistics();
            showAlert('Đã xóa lịch sử!', 'success');
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
                showAlert(`Đã tải preset: ${presetName}!`, 'success');
                
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