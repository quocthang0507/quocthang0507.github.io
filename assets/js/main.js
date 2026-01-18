// Main JavaScript file for global functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dark mode
    initializeDarkMode();
    initializeCustomThemeToggle();
    // Footer theme badge removed
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active class to current navigation item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Utility functions
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        return;
    }
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');
    alertElement.appendChild(messageSpan);
    alertElement.appendChild(closeButton);
    alertContainer.appendChild(alertElement);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.remove();
        }
    }, 5000);
}

function copyToClipboard(text) {
    const onSuccess = () => {
        showAlert('Đã sao chép vào clipboard!', 'success');
        // Track copy to clipboard action
        if (typeof gtag !== 'undefined') {
            gtag('event', 'copy_to_clipboard', {
                event_category: 'user_interaction',
                event_label: 'clipboard_copy'
            });
        }
        return true;
    };
    const onError = () => {
        showAlert('Không thể sao chép. Vui lòng thử lại.', 'danger');
        // Track copy failure
        if (typeof gtag !== 'undefined') {
            gtag('event', 'copy_failed', {
                event_category: 'user_interaction',
                event_label: 'clipboard_copy_failed'
            });
        }
        return false;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(onSuccess).catch(onError);
    }
    const fallbackResult = fallbackCopyToClipboard(text);
    return Promise.resolve(fallbackResult ? onSuccess() : onError());
}

function fallbackCopyToClipboard(text) {
    if (!document.body) {
        return false;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
        copied = typeof document.execCommand === 'function' && document.execCommand('copy');
    } catch (e) {
        copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Cannot save to localStorage:', e);
        return false;
    }
}

function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Cannot load from localStorage:', e);
        return null;
    }
}

// Dark Mode Functionality
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeIcon = document.getElementById('dark-mode-icon');
    // Always initialize theme even if toggle is missing (e.g., minimal pages)
    // Check for saved theme preference or default to light mode
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch (e) { savedTheme = null; }
    // Only use browser preference if user hasn't set a preference yet
    // Default to light mode to prevent automatic dark mode on page load
    const currentTheme = savedTheme || 'light';
    
    // Apply the theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateDarkModeIcon(currentTheme);
    
    // Add click event listener if toggle exists
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            try { localStorage.setItem('theme', newTheme); } catch (e) {}
            updateDarkModeIcon(newTheme);
            
            // Track dark mode toggle
            if (typeof gtag !== 'undefined') {
                gtag('event', 'theme_change', {
                    event_category: 'user_interface',
                    event_label: newTheme,
                    theme_switched_to: newTheme
                });
            }
        });
    }
    
    // Listen for system theme changes only if user hasn't set a preference
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mediaQuery) {
        const handleThemeChange = function(e) {
            let hasPref = false; try { hasPref = !!localStorage.getItem('theme'); } catch (e2) { hasPref = false; }
            if (!hasPref) {
                const theme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                updateDarkModeIcon(theme);
            }
        };
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleThemeChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleThemeChange);
        }
    }
}

function updateDarkModeIcon(theme) {
    const darkModeIcon = document.getElementById('dark-mode-icon');
    if (!darkModeIcon) return;
    
    if (theme === 'dark') {
        darkModeIcon.className = 'fas fa-sun';
        darkModeIcon.parentElement.title = 'Switch to Light Mode';
    } else {
        darkModeIcon.className = 'fas fa-moon';
        darkModeIcon.parentElement.title = 'Switch to Dark Mode';
    }
}

// Custom Theme Toggle (switch body.custom-theme class)
function initializeCustomThemeToggle() {
    let stored = null; try { stored = localStorage.getItem('customTheme'); } catch (e) { stored = null; }
    if (stored === 'on') {
        document.body.classList.add('custom-theme');
    }
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="toggle-custom-theme"]');
        if (btn) {
            const enabled = document.body.classList.toggle('custom-theme');
            try { localStorage.setItem('customTheme', enabled ? 'on' : 'off'); } catch (e2) {}
            announceThemeChange(enabled);
            if (typeof gtag !== 'undefined') {
                gtag('event', 'custom_theme_toggle', { event_category: 'user_interface', enabled });
            }
        }
    });
}

function announceThemeChange(enabled) {
    let live = document.getElementById('global-live-region');
    if (!live) { return; }
    const key = enabled ? 'ui.custom_theme_on' : 'ui.custom_theme_off';
    const msg = (window.translationSystem && window.translationSystem.t) ? window.translationSystem.t(key) : (enabled ? 'Enhanced theme ON' : 'Enhanced theme OFF');
    live.textContent = msg;
}

function injectSettingsFloatingButton() {
    if (document.getElementById('settings-fab')) return;
    const btn = document.createElement('button');
    btn.id = 'settings-fab';
    btn.className = 'settings-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Settings');
    btn.innerHTML = '<i class="fas fa-gear"></i>';
    btn.addEventListener('click', openQuickSettingsPanel);
    document.body.appendChild(btn);
}

function openQuickSettingsPanel() {
    let panel = document.getElementById('quick-settings-panel');
    if (panel) { panel.classList.toggle('open'); return; }
    panel = document.createElement('div');
    panel.id = 'quick-settings-panel';
    panel.className = 'quick-settings-panel';
    panel.innerHTML = `
      <div class="qs-header">
        <strong>${window.t ? window.t('ui.settings') : 'Settings'}</strong>
        <button type="button" class="btn-close" aria-label="Close" data-action="close-qsp"></button>
      </div>
      <div class="qs-body">
        <button class="btn btn-sm btn-outline-primary w-100 mb-2" data-action="toggle-custom-theme">${window.t ? window.t('ui.toggle_custom_theme') : 'Toggle enhanced theme'}</button>
        <button class="btn btn-sm btn-outline-secondary w-100" data-action="close-qsp">${window.t ? window.t('ui.close') : 'Close'}</button>
      </div>`;
    panel.addEventListener('click', (e) => {
        if (e.target.matches('[data-action="close-qsp"]')) {
            panel.classList.remove('open');
        }
    });
    document.body.appendChild(panel);
    requestAnimationFrame(()=>panel.classList.add('open'));
}

// Footer theme badge and related listeners removed

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showAlert,
        copyToClipboard,
        fallbackCopyToClipboard,
        saveToLocalStorage,
        loadFromLocalStorage,
        initializeDarkMode,
        updateDarkModeIcon,
        initializeCustomThemeToggle,
        announceThemeChange,
        injectSettingsFloatingButton,
        openQuickSettingsPanel
    };
}
