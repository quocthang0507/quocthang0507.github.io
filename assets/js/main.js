// Main JavaScript file for global functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dark mode
    initializeDarkMode();
    
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
    if (alertContainer) {
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertContainer.appendChild(alertElement);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 5000);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Đã sao chép vào clipboard!', 'success');
    }).catch(() => {
        showAlert('Không thể sao chép. Vui lòng thử lại.', 'danger');
    });
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
    
    if (!darkModeToggle) return;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    // Apply the theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateDarkModeIcon(currentTheme);
    
    // Add click event listener
    darkModeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateDarkModeIcon(newTheme);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            updateDarkModeIcon(theme);
        }
    });
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