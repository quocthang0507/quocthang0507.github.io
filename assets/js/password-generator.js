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
        const options = {
            uppercase: includeUppercase.checked,
            lowercase: includeLowercase.checked,
            numbers: includeNumbers.checked,
            symbols: includeSymbols.checked,
            excludeAmbiguous: excludeAmbiguous.checked,
            noDuplicate: noDuplicate.checked
        };
        updateStrength(parseInt(this.value), options);
    });
    
    [includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous, noDuplicate].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', generatePassword);
        }
    });
    
    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPassword);
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Generate password on Enter key (ignore command palette, buttons, links)
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        const target = e.target;
        if (target && (target.closest('#command-palette-overlay') || ['A', 'BUTTON', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
            return;
        }
        generatePassword();
    });

    function secureRandomInt(max) {
        if (max <= 1) return 0;
        const cryptoObj = window.crypto || window.msCrypto;
        if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
            const limit = 0x100000000 - (0x100000000 % max);
            const buf = new Uint32Array(1);
            let value;
            do {
                cryptoObj.getRandomValues(buf);
                value = buf[0];
            } while (value >= limit);
            return value % max;
        }
        return Math.floor(Math.random() * max);
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = secureRandomInt(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function filterAmbiguous(chars, exclude) {
        if (!exclude) return chars;
        return chars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
    }
    
    // Generate password function
    function generatePassword() {
        const length = parseInt(lengthSlider.value, 10) || 12;
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
        
        // Build active pools & combined character set respecting excludeAmbiguous
        const pools = [];
        if (options.uppercase) pools.push(filterAmbiguous(UPPERCASE, options.excludeAmbiguous));
        if (options.lowercase) pools.push(filterAmbiguous(LOWERCASE, options.excludeAmbiguous));
        if (options.numbers) pools.push(filterAmbiguous(NUMBERS, options.excludeAmbiguous));
        if (options.symbols) pools.push(filterAmbiguous(SYMBOLS, options.excludeAmbiguous));

        const nonEmptyPools = pools.filter(p => p.length > 0);
        const charset = nonEmptyPools.join('');
        
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
        
        // Generate password using CSPRNG and unbiased Fisher-Yates shuffle
        const passwordChars = [];

        if (options.noDuplicate) {
            const used = new Set();
            // Guarantee one character from each active pool when length permits
            if (length >= nonEmptyPools.length) {
                for (const pool of nonEmptyPools) {
                    const available = pool.split('').filter(c => !used.has(c));
                    if (available.length > 0) {
                        const chosen = available[secureRandomInt(available.length)];
                        passwordChars.push(chosen);
                        used.add(chosen);
                    }
                }
            }
            const remainingPool = charset.split('').filter(c => !used.has(c));
            shuffleArray(remainingPool);
            while (passwordChars.length < length && remainingPool.length > 0) {
                passwordChars.push(remainingPool.pop());
            }
        } else {
            if (length >= nonEmptyPools.length) {
                for (const pool of nonEmptyPools) {
                    passwordChars.push(pool[secureRandomInt(pool.length)]);
                }
            }
            const charArray = charset.split('');
            while (passwordChars.length < length) {
                passwordChars.push(charArray[secureRandomInt(charArray.length)]);
            }
        }

        const password = shuffleArray(passwordChars).join('');
        
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
    
    // Calculate password strength
    function updateStrength(passwordOrLength, options) {
        let score = 0;
        let length;
        let uniqueChars;
        
        if (typeof passwordOrLength === 'string') {
            length = passwordOrLength.length;
            uniqueChars = new Set(passwordOrLength).size;
        } else {
            length = passwordOrLength;
            // Estimate unique characters based on length and options
            let charsetLength = 0;
            if (options.uppercase) charsetLength += UPPERCASE.length;
            if (options.lowercase) charsetLength += LOWERCASE.length;
            if (options.numbers) charsetLength += NUMBERS.length;
            if (options.symbols) charsetLength += SYMBOLS.length;
            if (options.excludeAmbiguous) {
                charsetLength = Math.max(1, charsetLength - AMBIGUOUS.length);
            }
            
            if (options.noDuplicate) {
                uniqueChars = Math.min(length, charsetLength);
            } else {
                // A reasonable approximation for random choice:
                // unique = charsetLength * (1 - Math.exp(-length / charsetLength))
                if (charsetLength > 0) {
                    uniqueChars = Math.min(length, Math.round(charsetLength * (1 - Math.exp(-length / charsetLength))));
                } else {
                    uniqueChars = length;
                }
            }
        }
        
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
        if (length > 0) {
            const variety = (uniqueChars / length) * 20;
            score += variety;
        }
        
        // Apply length-based caps to avoid misleadingly high strength for short passwords
        if (length < 6) {
            // Force Very Weak
            score = Math.min(score, 15);
        } else if (length < 8) {
            // Force at most Weak
            score = Math.min(score, 35);
        } else if (length < 10) {
            // Force at most Good
            score = Math.min(score, 55);
        } else if (length < 12) {
            // Force at most Strong
            score = Math.min(score, 75);
        }
        
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
                        <code class="history-password">${escapeHtml(item.password)}</code>
                        <small class="text-muted d-block">${item.timestamp} • ${item.length} ${tr('password.characters', 'ký tự')}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary copy-history-btn" data-index="${index}">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to copy buttons
        document.querySelectorAll('.copy-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const entry = passwordHistory[parseInt(this.dataset.index, 10)];
                if (!entry) return;
                const password = entry.password;
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
