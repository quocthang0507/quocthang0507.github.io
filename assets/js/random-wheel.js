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
        
        wheelNames.innerHTML = names.map((name, index) => {
            const rotation = index * anglePerSection;
            const color = wheelColors[index % wheelColors.length];
            
            return `
                <div class="wheel-name" style="
                    transform: rotate(${rotation}deg);
                    background: ${color};
                    clip-path: polygon(0 0, 50% 0, 50% 50%, 0 50%);
                    border-right: 1px solid rgba(255,255,255,0.3);
                ">
                    <span style="
                        transform: rotate(${anglePerSection/2}deg);
                        margin-left: 20%;
                        font-size: ${names.length > 8 ? '0.7rem' : '0.9rem'};
                    ">${name}</span>
                </div>
            `;
        }).join('');
        
        // Update wheel background
        const wheel = document.getElementById('wheel');
        const gradientStops = names.map((_, index) => {
            const color = wheelColors[index % wheelColors.length];
            const startAngle = (index * anglePerSection);
            const endAngle = ((index + 1) * anglePerSection);
            return `${color} ${startAngle}deg ${endAngle}deg`;
        }).join(', ');
        
        wheel.style.background = `conic-gradient(${gradientStops})`;
    }
    
    // Spin wheel
    function spinWheel() {
        if (isSpinning || names.length === 0) return;
        
        isSpinning = true;
        document.getElementById('spin-btn').disabled = true;
        document.getElementById('spin-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang quay...';
        
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
            
            showWinner(winner, winnerIndex);
            
            isSpinning = false;
            document.getElementById('spin-btn').disabled = false;
            document.getElementById('spin-btn').innerHTML = '<i class="fas fa-play"></i> Quay bánh xe';
        }, 3000);
    }
    
    // Show winner
    function showWinner(winner, winnerIndex) {
        document.getElementById('wheel-result').textContent = winner;
        
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
        if (document.getElementById('confetti-effect').checked) {
            showConfetti();
        }
        
        // Remove winner if option is checked
        if (document.getElementById('remove-winner').checked) {
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
        document.getElementById('total-spins').textContent = spinHistory.length;
        document.getElementById('current-names-count').textContent = names.length;
        
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
            
            document.getElementById('top-winners').innerHTML = topWinnersHTML;
        } else {
            document.getElementById('top-winners').innerHTML = '<p class="text-muted">Chưa có dữ liệu</p>';
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
            }
        });
    });
});