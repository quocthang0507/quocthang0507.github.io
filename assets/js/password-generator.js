// Password Generator functionality
document.addEventListener('DOMContentLoaded', function() {
    // Character sets
    const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
    const NUMBERS = '0123456789';
    const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const AMBIGUOUS = '0Ol1I';
    
    // Elements
    const passwordDisplay = document.getElementById('password-display');
    const copyBtn = document.getElementById('copy-password-btn');
    const generateBtn = document.getElementById('generate-btn');
    const lengthSlider = document.getElementById('password-length');
    const lengthValue = document.getElementById('length-value');
    const strengthBadge = document.getElementById('strength-badge');
    const strengthBar = document.getElementById('strength-bar');
    const historyContainer = document.getElementById('password-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    
    // Checkboxes
    const includeUppercase = document.getElementById('include-uppercase');
    const includeLowercase = document.getElementById('include-lowercase');
    const includeNumbers = document.getElementById('include-numbers');
    const includeSymbols = document.getElementById('include-symbols');
    const excludeAmbiguous = document.getElementById('exclude-ambiguous');
    const noDuplicate = document.getElementById('no-duplicate');
    
    // State
    let currentPassword = '';
    let passwordHistory = loadFromLocalStorage('passwordHistory') || [];

    function tr(key, fallback) {
        try {
            if (typeof window.t !== 'function') return fallback;
            const value = window.t(key);
            if (!value || value === key) return fallback;
            return value;
        } catch (_) {
            return fallback;
        }
    }
    
    // Initialize
    updateHistoryDisplay();
    
    // Event listeners
    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
    });
    
    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPassword);
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Generate password on Enter key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            generatePassword();
        }
    });
    
    // Generate password function
    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        const options = {
            uppercase: includeUppercase.checked,
            lowercase: includeLowercase.checked,
            numbers: includeNumbers.checked,
            symbols: includeSymbols.checked,
            excludeAmbiguous: excludeAmbiguous.checked,
            noDuplicate: noDuplicate.checked
        };
        
        // Validate at least one option is selected
        if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
            showAlert(tr('password.error_no_options', 'Vui lòng chọn ít nhất một loại ký tự!'), 'warning');
            return;
        }
        
        // Build character set
        let charset = '';
        if (options.uppercase) charset += UPPERCASE;
        if (options.lowercase) charset += LOWERCASE;
        if (options.numbers) charset += NUMBERS;
        if (options.symbols) charset += SYMBOLS;
        
        // Remove ambiguous characters if requested
        if (options.excludeAmbiguous) {
            charset = charset.split('').filter(char => !AMBIGUOUS.includes(char)).join('');
        }
        
        // Check if enough unique characters for no duplicate option
        if (options.noDuplicate && charset.length < length) {
            showAlert(
                tr('password.error_not_enough_chars',
                `Không đủ ký tự duy nhất (${charset.length}) cho độ dài mật khẩu (${length})!`, 
                ),
                'warning'
            );
            return;
        }
        
        // Generate password
        let password = '';
        const charArray = charset.split('');
        
        if (options.noDuplicate) {
            // Shuffle array and take first n characters
            const shuffled = charArray.sort(() => Math.random() - 0.5);
            password = shuffled.slice(0, length).join('');
        } else {
            // Random selection with possible duplicates
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charArray.length);
                password += charArray[randomIndex];
            }
        }
        
        // Ensure at least one character from each selected type
        if (!options.noDuplicate) {
            password = ensureCharacterTypes(password, options, length);
        }
        
        currentPassword = password;
        passwordDisplay.textContent = password;
        passwordDisplay.classList.add('generated');
        copyBtn.disabled = false;
        
        // Update strength indicator
        updateStrength(password, options);
        
        // Add to history
        addToHistory(password);
        
        // Track password generation
        if (typeof gtag !== 'undefined') {
            gtag('event', 'password_generated', {
                event_category: 'password_tools',
                event_label: 'password_creation',
                password_length: length,
                has_uppercase: options.uppercase,
                has_lowercase: options.lowercase,
                has_numbers: options.numbers,
                has_symbols: options.symbols
            });
        }
    }
    
    // Ensure password has at least one character from each selected type
    function ensureCharacterTypes(password, options, length) {
        const chars = password.split('');
        let hasUppercase = !options.uppercase;
        let hasLowercase = !options.lowercase;
        let hasNumber = !options.numbers;
        let hasSymbol = !options.symbols;
        
        // Check what we have
        for (const char of chars) {
            if (UPPERCASE.includes(char)) hasUppercase = true;
            if (LOWERCASE.includes(char)) hasLowercase = true;
            if (NUMBERS.includes(char)) hasNumber = true;
            if (SYMBOLS.includes(char)) hasSymbol = true;
        }
        
        // Add missing types
        let index = 0;
        if (!hasUppercase && options.uppercase) {
            chars[index++] = UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
        }
        if (!hasLowercase && options.lowercase) {
            chars[index++] = LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
        }
        if (!hasNumber && options.numbers) {
            chars[index++] = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
        }
        if (!hasSymbol && options.symbols) {
            chars[index++] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        }
        
        // Shuffle to randomize position of enforced characters
        return chars.sort(() => Math.random() - 0.5).join('');
    }
    
    // Calculate password strength
    function updateStrength(password, options) {
        let score = 0;
        const length = password.length;
        
        // Length score (max 40 points)
        if (length >= 16) score += 40;
        else if (length >= 12) score += 30;
        else if (length >= 8) score += 20;
        else if (length >= 6) score += 10;
        else score += 5;
        
        // Complexity score (max 40 points)
        let complexity = 0;
        if (options.uppercase) complexity += 10;
        if (options.lowercase) complexity += 10;
        if (options.numbers) complexity += 10;
        if (options.symbols) complexity += 10;
        score += complexity;
        
        // Variety score (max 20 points)
        const uniqueChars = new Set(password).size;
        const variety = (uniqueChars / length) * 20;
        score += variety;
        
        // Determine strength level
        let strengthText, strengthClass, strengthWidth;
        
        if (score >= 80) {
            strengthText = tr('password.very_strong', 'Rất mạnh');
            strengthClass = 'bg-success';
            strengthWidth = 100;
        } else if (score >= 60) {
            strengthText = tr('password.strong', 'Mạnh');
            strengthClass = 'bg-info';
            strengthWidth = 80;
        } else if (score >= 40) {
            strengthText = tr('password.good', 'Tốt');
            strengthClass = 'bg-primary';
            strengthWidth = 60;
        } else if (score >= 20) {
            strengthText = tr('password.weak', 'Yếu');
            strengthClass = 'bg-warning';
            strengthWidth = 40;
        } else {
            strengthText = tr('password.very_weak', 'Rất yếu');
            strengthClass = 'bg-danger';
            strengthWidth = 20;
        }
        
        // Update UI
        strengthBadge.textContent = strengthText;
        strengthBadge.className = `badge ${strengthClass}`;
        strengthBar.className = `progress-bar ${strengthClass}`;
        strengthBar.style.width = `${strengthWidth}%`;
        strengthBar.setAttribute('aria-valuenow', strengthWidth);
    }
    
    // Copy password to clipboard
    function copyPassword() {
        if (!currentPassword) return;
        
        navigator.clipboard.writeText(currentPassword).then(() => {
            showAlert(
                tr('password.copied', 'Đã sao chép mật khẩu!'),
                'success'
            );
            
            // Visual feedback
            copyBtn.innerHTML = '<i class="fas fa-check"></i> ' + 
                tr('password.copied_short', 'Đã sao chép');
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> ' + 
                    tr('password.copy', 'Sao chép');
            }, 2000);
            
            // Track copy action
            if (typeof gtag !== 'undefined') {
                gtag('event', 'password_copied', {
                    event_category: 'password_tools',
                    event_label: 'clipboard_copy'
                });
            }
        }).catch(() => {
            showAlert(
                tr('password.copy_error', 'Không thể sao chép!'),
                'danger'
            );
        });
    }
    
    // Add password to history
    function addToHistory(password) {
        const timestamp = new Date().toLocaleString('vi-VN');
        const historyItem = {
            password: password,
            timestamp: timestamp,
            length: password.length
        };
        
        passwordHistory.unshift(historyItem);
        
        // Keep only last 10
        if (passwordHistory.length > 10) {
            passwordHistory = passwordHistory.slice(0, 10);
        }
        
        saveToLocalStorage('passwordHistory', passwordHistory);
        updateHistoryDisplay();
    }
    
    // Update history display
    function updateHistoryDisplay() {
        if (passwordHistory.length === 0) {
            historyContainer.innerHTML = `
                <p class="text-muted text-center small" data-i18n="password.no_history">Chưa có lịch sử</p>
            `;
            return;
        }
        
        historyContainer.innerHTML = passwordHistory.map((item, index) => `
            <div class="history-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <code class="history-password">${item.password}</code>
                        <small class="text-muted d-block">${item.timestamp} • ${item.length} ${tr('password.characters', 'ký tự')}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary copy-history-btn" data-password="${item.password}">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to copy buttons
        document.querySelectorAll('.copy-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const password = this.dataset.password;
                navigator.clipboard.writeText(password).then(() => {
                    showAlert(
                        tr('password.copied', 'Đã sao chép mật khẩu!'),
                        'success'
                    );
                });
            });
        });
    }
    
    // Clear history
    function clearHistory() {
        if (passwordHistory.length === 0) return;
        
        if (confirm(tr('password.confirm_clear', 'Xóa toàn bộ lịch sử?'))) {
            passwordHistory = [];
            saveToLocalStorage('passwordHistory', passwordHistory);
            updateHistoryDisplay();
            showAlert(
                tr('password.history_cleared', 'Đã xóa lịch sử!'),
                'info'
            );
        }
    }
    
    // Auto-generate on load
    generatePassword();
});
