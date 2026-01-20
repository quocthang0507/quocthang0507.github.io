// LaTeX Editor functionality
document.addEventListener('DOMContentLoaded', function() {
    // Configuration constants
    const RENDER_DEBOUNCE_MS = 500; // Debounce delay for auto-render
    const HISTORY_SAVE_DELAY_MS = 1000; // Delay before saving to history
    const MAX_HISTORY_ITEMS = 20; // Maximum number of history items

    const t = (key, fallback) => {
        try {
            if (window.translationSystem && typeof window.translationSystem.t === 'function') {
                return window.translationSystem.t(key, fallback ?? key);
            }
        } catch (e) {
            // ignore i18n errors
        }
        return fallback ?? key;
    };
    
    let latexHistory = loadFromLocalStorage('latexHistory') || [];
    const latexInput = document.getElementById('latex-input');
    const latexOutput = document.getElementById('latex-output');
    let renderTimeout = null;
    
    // Initialize
    renderHistory();
    renderLatex();
    
    // Auto-render on input with debounce
    latexInput.addEventListener('input', function() {
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(renderLatexAndSaveHistory, RENDER_DEBOUNCE_MS);
    });
    
    // Render button
    document.getElementById('render-btn').addEventListener('click', renderLatex);
    
    // Insert symbol at cursor position
    document.querySelectorAll('.insert-symbol').forEach(button => {
        button.addEventListener('click', function() {
            const symbol = this.getAttribute('data-symbol');
            insertAtCursor(latexInput, symbol);
            renderLatex();
        });
    });
    
    // Copy LaTeX code
    document.getElementById('copy-latex-btn').addEventListener('click', function() {
        const latex = latexInput.value;
        if (!latex.trim()) {
            showAlert(t('latex.alert.no_code', 'Chưa có mã LaTeX để sao chép!'), 'warning');
            return;
        }
        
        navigator.clipboard.writeText(latex).then(function() {
            showAlert(t('latex.alert.copied', 'Đã sao chép mã LaTeX!'), 'success');
            
            // Track copy event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'latex_copied', {
                    event_category: 'latex_editor'
                });
            }
        }).catch(function(err) {
            showAlert(t('latex.alert.copy_error', 'Lỗi khi sao chép: ') + err, 'error');
        });
    });
    
    // Save as image
    document.getElementById('save-image-btn').addEventListener('click', async function() {
        const output = document.getElementById('latex-preview');
        const latex = latexInput.value.trim();
        
        if (!latex) {
            showAlert(t('latex.alert.no_content', 'Chưa có nội dung để lưu!'), 'warning');
            return;
        }
        
        try {
            // Wait for MathJax to finish rendering
            if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
                await MathJax.typesetPromise([output]);
            }
            
            // Use html2canvas to capture the preview
            const canvas = await html2canvas(output, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false
            });
            
            // Convert to blob and download
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `latex-${Date.now()}.png`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                showAlert(t('latex.alert.saved', 'Đã lưu hình ảnh!'), 'success');
                
                // Track save event
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'latex_image_saved', {
                        event_category: 'latex_editor'
                    });
                }
            });
        } catch (error) {
            showAlert(t('latex.alert.save_error', 'Lỗi khi lưu hình: ') + error.message, 'error');
        }
    });
    
    // Clear button
    document.getElementById('clear-btn').addEventListener('click', function() {
        latexInput.value = '';
        latexOutput.innerHTML = '';
        latexInput.focus();
    });
    
    // Clear history
    document.getElementById('clear-history-btn').addEventListener('click', function() {
        if (confirm(t('latex.alert.clear_history_confirm', 'Bạn có chắc muốn xóa toàn bộ lịch sử?'))) {
            latexHistory = [];
            saveToLocalStorage('latexHistory', latexHistory);
            renderHistory();
            showAlert(t('latex.alert.history_cleared', 'Đã xóa lịch sử!'), 'success');
        }
    });
    
    // Render LaTeX using MathJax
    function renderLatex() {
        const latex = latexInput.value.trim();
        
        if (!latex) {
            latexOutput.innerHTML = `<span class="text-muted">${t('latex.preview_placeholder', 'Nhập mã LaTeX để xem trước...')}</span>`;
            return;
        }
        
        // Wrap in display math mode
        latexOutput.innerHTML = `$$${latex}$$`;
        
        // Trigger MathJax rendering
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetClear([latexOutput]);
            MathJax.typesetPromise([latexOutput]).catch(function(err) {
                latexOutput.innerHTML = `<span class="text-danger">${t('latex.error_syntax', 'Lỗi cú pháp')}: ${err.message}</span>`;
            });
        }
    }
    
    // Insert text at cursor position
    function insertAtCursor(textarea, text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        textarea.value = value.substring(0, start) + text + value.substring(end);
        
        // Move cursor to end of inserted text
        const newPos = start + text.length;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
        textarea.focus();
    }
    
    // Add to history
    function addToHistory(latex) {
        if (!latex.trim()) return;
        
        // Check if already in history
        const exists = latexHistory.find(item => item.latex === latex);
        if (exists) return;
        
        const historyItem = {
            latex: latex,
            timestamp: new Date().toISOString()
        };
        
        latexHistory.unshift(historyItem);
        
        // Keep only last N items
        if (latexHistory.length > MAX_HISTORY_ITEMS) {
            latexHistory = latexHistory.slice(0, MAX_HISTORY_ITEMS);
        }
        
        saveToLocalStorage('latexHistory', latexHistory);
        renderHistory();
    }
    
    // Render history
    function renderHistory() {
        const container = document.getElementById('latex-history');
        
        if (latexHistory.length === 0) {
            container.innerHTML = `<p class="text-muted text-center" data-i18n="latex.no_history">${t('latex.no_history', 'Chưa có lịch sử')}</p>`;
            return;
        }
        
        container.innerHTML = '';
        
        latexHistory.forEach((item, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-4 col-lg-3';
            
            const historyItem = document.createElement('div');
            historyItem.className = 'latex-history-item';
            
            const preview = document.createElement('div');
            preview.className = 'mb-2 text-center';
            preview.innerHTML = `$$${item.latex}$$`;
            
            const code = document.createElement('code');
            code.className = 'small d-block mb-2';
            code.textContent = item.latex.length > 50 ? item.latex.substring(0, 50) + '...' : item.latex;
            
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group w-100';
            
            const useBtn = document.createElement('button');
            useBtn.className = 'btn btn-sm btn-primary';
            useBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            useBtn.title = t('latex.history.use', 'Sử dụng');
            useBtn.onclick = function() {
                latexInput.value = item.latex;
                renderLatex();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = t('latex.history.delete', 'Xóa');
            deleteBtn.onclick = function() {
                latexHistory.splice(index, 1);
                saveToLocalStorage('latexHistory', latexHistory);
                renderHistory();
            };
            
            btnGroup.appendChild(useBtn);
            btnGroup.appendChild(deleteBtn);
            
            historyItem.appendChild(preview);
            historyItem.appendChild(code);
            historyItem.appendChild(btnGroup);
            
            col.appendChild(historyItem);
            container.appendChild(col);
        });
        
        // Render MathJax in history
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise([container]).catch(err => console.error(err));
        }
    }
    
    // Render LaTeX and save to history
    function renderLatexAndSaveHistory() {
        renderLatex();
        const latex = latexInput.value.trim();
        if (latex) {
            setTimeout(() => addToHistory(latex), HISTORY_SAVE_DELAY_MS);
        }
    }
    
    // Keyboard shortcuts
    latexInput.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to render
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            renderLatex();
        }
        
        // Ctrl/Cmd + S to save image
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            document.getElementById('save-image-btn').click();
        }
    });

    // Update translatable UI when language changes
    window.addEventListener('languageChanged', function() {
        renderHistory();
        renderLatex();
    });
    
    // Helper functions
    function saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }
    
    function loadFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return null;
        }
    }
    
    function showAlert(message, type = 'info') {
        const container = document.getElementById('alert-container');
        if (!container) return;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        container.appendChild(alertDiv);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
});
