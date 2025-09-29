// Random Number Generator functionality
document.addEventListener('DOMContentLoaded', function() {
    let history = loadFromLocalStorage('randomNumberHistory') || [];
    let sessionCount = 0;
    let currentResult = null;
    
    // Initialize display
    updateHistoryDisplay();
    updateStatistics();
    
    // Generate single random number
    function generateRandomNumber() {
        const min = parseInt(document.getElementById('min-number').value);
        const max = parseInt(document.getElementById('max-number').value);
        
        if (isNaN(min) || isNaN(max)) {
            showAlert('Vui lòng nhập số hợp lệ!', 'danger');
            return;
        }
        
        if (min >= max) {
            showAlert('Số nhỏ nhất phải nhỏ hơn số lớn nhất!', 'danger');
            return;
        }
        
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        displayResult([randomNum], min, max);
        saveToHistory([randomNum], min, max);
        sessionCount++;
        updateStatistics();
        
        // Track number generation
        if (typeof gtag !== 'undefined') {
            gtag('event', 'generate_single_number', {
                event_category: 'random_number_tools',
                event_label: 'single_generation',
                number_range: `${min}-${max}`,
                generated_number: randomNum
            });
        }
    }
    
    // Generate multiple random numbers
    function generateMultipleNumbers() {
        const min = parseInt(document.getElementById('min-number').value);
        const max = parseInt(document.getElementById('max-number').value);
        const count = parseInt(document.getElementById('count-numbers').value);
        const unique = document.getElementById('unique-numbers').checked;
        
        if (isNaN(min) || isNaN(max) || isNaN(count)) {
            showAlert('Vui lòng nhập số hợp lệ!', 'danger');
            return;
        }
        
        if (min >= max) {
            showAlert('Số nhỏ nhất phải nhỏ hơn số lớn nhất!', 'danger');
            return;
        }
        
        if (count < 1 || count > 100) {
            showAlert('Số lượng phải từ 1 đến 100!', 'danger');
            return;
        }
        
        if (unique && count > (max - min + 1)) {
            showAlert('Không thể tạo nhiều số không trùng lặp hơn phạm vi cho phép!', 'danger');
            return;
        }
        
        let numbers = [];
        
        if (unique) {
            // Generate unique numbers
            let availableNumbers = [];
            for (let i = min; i <= max; i++) {
                availableNumbers.push(i);
            }
            
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * availableNumbers.length);
                numbers.push(availableNumbers.splice(randomIndex, 1)[0]);
            }
        } else {
            // Generate non-unique numbers
            for (let i = 0; i < count; i++) {
                numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
            }
        }
        
        displayResult(numbers, min, max);
        saveToHistory(numbers, min, max);
        sessionCount++;
        updateStatistics();
    }
    
    // Quick pick function (random ranges)
    function quickPick() {
        const presets = [
            { min: 1, max: 6, name: 'Xúc xắc' },
            { min: 1, max: 100, name: 'Phần trăm' },
            { min: 1, max: 45, name: 'Lotto' },
            { min: 0, max: 1, name: 'Tung đồng xu' },
            { min: 1, max: 20, name: 'Số nhỏ' },
            { min: 1, max: 1000, name: 'Số lớn' }
        ];
        
        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
        document.getElementById('min-number').value = randomPreset.min;
        document.getElementById('max-number').value = randomPreset.max;
        
        showAlert(`Đã chọn preset: ${randomPreset.name} (${randomPreset.min}-${randomPreset.max})`, 'info');
        generateRandomNumber();
    }
    
    // Display result
    function displayResult(numbers, min, max) {
        currentResult = numbers;
        const resultDiv = document.getElementById('result-display');
        
        if (numbers.length === 1) {
            resultDiv.textContent = numbers[0];
            resultDiv.className = 'result-display';
        } else {
            resultDiv.innerHTML = `
                <div class="d-flex flex-wrap justify-content-center gap-2">
                    ${numbers.map(num => `<span class="badge bg-primary fs-6">${num}</span>`).join('')}
                </div>
            `;
            resultDiv.className = 'result-display';
        }
        
        // Enable action buttons
        document.getElementById('copy-result-btn').disabled = false;
        document.getElementById('save-result-btn').disabled = false;
        
        // Add animation
        resultDiv.style.animation = 'none';
        setTimeout(() => {
            resultDiv.style.animation = 'pulse 0.5s ease-in-out';
        }, 10);
    }
    
    // Save to history
    function saveToHistory(numbers, min, max) {
        const historyItem = {
            numbers: numbers,
            range: `${min}-${max}`,
            timestamp: new Date().toLocaleString('vi-VN'),
            count: numbers.length
        };
        
        history.unshift(historyItem);
        
        // Keep only last 50 items
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        saveToLocalStorage('randomNumberHistory', history);
        updateHistoryDisplay();
    }
    
    // Update history display
    function updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        
        if (history.length === 0) {
            historyList.innerHTML = '<p class="text-muted text-center">Chưa có lịch sử</p>';
            document.getElementById('export-history-btn').disabled = true;
            return;
        }
        
        document.getElementById('export-history-btn').disabled = false;
        
        historyList.innerHTML = history.map((item, index) => `
            <div class="history-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${item.numbers.length === 1 ? item.numbers[0] : item.numbers.join(', ')}</strong>
                        <small class="text-muted d-block">Phạm vi: ${item.range}</small>
                        <small class="text-muted">${item.timestamp}</small>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm copy-history-btn" data-numbers="${item.numbers.join(',')}">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm delete-history-btn" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for history item buttons
        document.querySelectorAll('.copy-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const numbers = this.dataset.numbers;
                copyToClipboard(numbers);
            });
        });
        
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                deleteHistoryItem(index);
            });
        });
    }
    
    // Delete single history item
    function deleteHistoryItem(index) {
        history.splice(index, 1);
        saveToLocalStorage('randomNumberHistory', history);
        updateHistoryDisplay();
        updateStatistics();
        showAlert('Đã xóa mục khỏi lịch sử', 'success');
    }
    
    // Update statistics
    function updateStatistics() {
        // Total generated
        document.getElementById('total-generated').textContent = history.length;
        
        // Session count
        document.getElementById('session-count').textContent = sessionCount;
        
        // Last range
        const lastRange = history.length > 0 ? history[0].range : '-';
        document.getElementById('last-range').textContent = lastRange;
        
        // Most common number
        if (history.length > 0) {
            const allNumbers = history.flatMap(item => item.numbers);
            const numberCounts = {};
            
            allNumbers.forEach(num => {
                numberCounts[num] = (numberCounts[num] || 0) + 1;
            });
            
            const mostCommon = Object.keys(numberCounts).reduce((a, b) => 
                numberCounts[a] > numberCounts[b] ? a : b
            );
            
            document.getElementById('most-common').textContent = `${mostCommon} (${numberCounts[mostCommon]}x)`;
        } else {
            document.getElementById('most-common').textContent = '-';
        }
    }
    
    // Export history
    function exportHistory() {
        if (history.length === 0) {
            showAlert('Không có lịch sử để xuất!', 'warning');
            return;
        }
        
        const csvContent = 'data:text/csv;charset=utf-8,' + 
            'Số,Phạm vi,Thời gian,Số lượng\n' +
            history.map(item => 
                `"${item.numbers.join(', ')}","${item.range}","${item.timestamp}",${item.count}`
            ).join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `random-numbers-history-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Đã xuất lịch sử thành công!', 'success');
    }
    
    // Event listeners
    document.getElementById('generate-btn').addEventListener('click', generateRandomNumber);
    document.getElementById('generate-multiple-btn').addEventListener('click', generateMultipleNumbers);
    document.getElementById('quick-pick-btn').addEventListener('click', quickPick);
    
    document.getElementById('copy-result-btn').addEventListener('click', function() {
        if (currentResult) {
            const text = currentResult.length === 1 ? currentResult[0].toString() : currentResult.join(', ');
            copyToClipboard(text);
        }
    });
    
    document.getElementById('save-result-btn').addEventListener('click', function() {
        if (currentResult) {
            showAlert('Kết quả đã được lưu vào lịch sử!', 'success');
        }
    });
    
    document.getElementById('clear-history-btn').addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
            history = [];
            saveToLocalStorage('randomNumberHistory', history);
            updateHistoryDisplay();
            updateStatistics();
            showAlert('Đã xóa toàn bộ lịch sử!', 'success');
        }
    });
    
    document.getElementById('export-history-btn').addEventListener('click', exportHistory);
    
    document.getElementById('reset-stats-btn').addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn reset toàn bộ thống kê?')) {
            sessionCount = 0;
            updateStatistics();
            showAlert('Đã reset thống kê!', 'success');
        }
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const min = this.dataset.min;
            const max = this.dataset.max;
            document.getElementById('min-number').value = min;
            document.getElementById('max-number').value = max;
            
            // Track preset usage
            if (typeof gtag !== 'undefined') {
                gtag('event', 'preset_button_click', {
                    event_category: 'random_number_tools',
                    event_label: `preset_${min}_${max}`,
                    preset_range: `${min}-${max}`
                });
            }
            
            generateRandomNumber();
        });
    });
    
    // Enter key support
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateRandomNumber();
        }
    });
});