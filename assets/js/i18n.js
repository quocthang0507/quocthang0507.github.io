// Prevent double-loading
if (typeof window.TranslationSystem === 'undefined') {
class TranslationSystem {
    constructor() {
        this.currentLanguage = 'vi'; // Default to Vietnamese
        this.translations = {};
        this.supportedLanguages = {
            'vi': { name: 'Tiếng Việt', flag: '🇻🇳' },
            'en': { name: 'English', flag: '🇺🇸' },
            'zh': { name: '中文', flag: '🇨🇳' },
            'ko': { name: '한국어', flag: '🇰🇷' },
            'ja': { name: '日本語', flag: '🇯🇵' }
        };
        
        // Load saved language from localStorage (tolerate blocked storage)
        try {
            const savedLanguage = localStorage.getItem('preferredLanguage');
            if (savedLanguage && this.supportedLanguages[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }
        } catch (e) { /* ignore storage errors */ }
        
        // Add loading class to body to prevent FOUC (Flash of Untranslated Content)
        document.body.classList.add('i18n-loading');
        
        this.loadLanguages();
    }
    
    // Load all language files with priority for current language
    async loadLanguages() {
        try {
            // First, load the current language with high priority
            await this.loadLanguageFile(this.currentLanguage);
            
            // Set up initial translations for current language
            this.updateTranslationsFromGlobals();
            
            // Translate page immediately with current language
            this.initializeLanguageSelector();
            this.translatePage();
            
            // Remove loading class - content is now translated
            document.body.classList.remove('i18n-loading');
            
            // Load remaining languages in parallel (background)
            const otherLanguages = Object.keys(this.supportedLanguages).filter(lang => lang !== this.currentLanguage);
            await Promise.all(otherLanguages.map(lang => this.loadLanguageFile(lang).catch(() => {})));
            
            // Update translations object with all loaded languages
            this.updateTranslationsFromGlobals();
            
        } catch (error) {
            console.error('Error loading languages:', error);
            // Still remove loading class on error to show content
            document.body.classList.remove('i18n-loading');
        }
    }
    
    // Update translations object from global variables
    updateTranslationsFromGlobals() {
        this.translations = {
            'vi': typeof vietnameseTranslations !== 'undefined' ? vietnameseTranslations : {},
            'en': typeof englishTranslations !== 'undefined' ? englishTranslations : {},
            'zh': typeof chineseTranslations !== 'undefined' ? chineseTranslations : {},
            'ko': typeof koreanTranslations !== 'undefined' ? koreanTranslations : {},
            'ja': typeof japaneseTranslations !== 'undefined' ? japaneseTranslations : {}
        };
    }
    
    // Load individual language file
    loadLanguageFile(lang) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            const existingScript = document.querySelector(`script[src*="/languages/${lang}.js"]`);
            if (existingScript) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            // Get the base path from the current i18n.js script tag
            const currentScript = document.querySelector('script[src*="i18n.js"]');
            const basePath = currentScript ? currentScript.src.replace(/\/i18n\.js.*$/, '') : '/assets/js';
            script.src = `${basePath}/languages/${lang}.js`;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Initialize language selector
    initializeLanguageSelector() {
        const nav = document.querySelector('.navbar-nav');
        if (!nav) return;
        
        const languageDropdown = document.createElement('li');
        languageDropdown.className = 'nav-item dropdown';
        languageDropdown.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" id="languageDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-language"></i> ${this.supportedLanguages[this.currentLanguage].name}
            </a>
            <ul class="dropdown-menu" aria-labelledby="languageDropdown">
                ${Object.entries(this.supportedLanguages).map(([code, info]) => `
                    <li><a class="dropdown-item ${code === this.currentLanguage ? 'active' : ''}" href="#" data-lang="${code}">
                        ${info.name}
                    </a></li>
                `).join('')}
            </ul>
        `;
        
        nav.appendChild(languageDropdown);
        
        // Add event listeners
        languageDropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const newLang = e.target.dataset.lang;
                if (newLang && newLang !== this.currentLanguage) {
                    this.changeLanguage(newLang);
                }
            });
        });
    }
    
    // Change language
    changeLanguage(newLanguage) {
        if (!this.supportedLanguages[newLanguage]) return;
        
        const oldLanguage = this.currentLanguage;
        this.currentLanguage = newLanguage;
        try { localStorage.setItem('preferredLanguage', newLanguage); } catch (e) {}
        
        // Track language change
        if (typeof gtag !== 'undefined') {
            gtag('event', 'language_change', {
                event_category: 'user_interaction',
                event_label: `${oldLanguage}_to_${newLanguage}`,
                previous_language: oldLanguage,
                new_language: newLanguage
            });
        }
        
        // Update dropdown display
        const dropdownToggle = document.getElementById('languageDropdown');
        if (dropdownToggle) {
            dropdownToggle.innerHTML = `<i class="fas fa-language"></i> ${this.supportedLanguages[newLanguage].name}`;
        }
        
        // Update active state
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.classList.toggle('active', item.dataset.lang === newLanguage);
        });
        
        this.translatePage();
        
        // Trigger events for other components to update
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLanguage } }));
    }
    
    // Get translation for a key
    t(key, fallback = key) {
        const translation = this.translations[this.currentLanguage];
        return translation && translation[key] ? translation[key] : fallback;
    }
    
    // Translate the entire page
    translatePage() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'number')) {
                element.placeholder = translation;
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.hasAttribute('data-i18n-html') || translation.includes('<strong>') || translation.includes('<')) {
                // Use innerHTML for elements with HTML content
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update page title
        const titleKey = document.querySelector('meta[name="i18n-title"]');
        if (titleKey) {
            document.title = this.t(titleKey.content) + ' - ' + this.t('site.title');
        }
        
        // Update specific dynamic content
        this.updateDynamicContent();
    }
    
    // Update dynamic content that needs special handling
    updateDynamicContent() {
        // Update calendar if it exists
        if (typeof updateCalendar === 'function') {
            updateCalendar();
        }
        
        // Update clock if it exists
        if (typeof updateClock === 'function') {
            updateClock();
        }
        
        // Update any other dynamic content
        this.updateMonthNames();
        this.updateDayNames();
    }
    
    // Update month names in calendar
    updateMonthNames() {
        const calendarTitle = document.getElementById('calendar-title');
        if (calendarTitle && typeof currentMonth !== 'undefined' && typeof currentYear !== 'undefined') {
            const monthName = this.t(`month.${currentMonth + 1}`);
            calendarTitle.textContent = `${monthName} ${currentYear}`;
        }
    }
    
    // Update day names in calendar
    updateDayNames() {
        const calendarTable = document.querySelector('.calendar-table');
        if (calendarTable) {
            const headerRow = calendarTable.querySelector('tr');
            if (headerRow) {
                const days = ['cal.sunday', 'cal.monday', 'cal.tuesday', 'cal.wednesday', 'cal.thursday', 'cal.friday', 'cal.saturday'];
                const cells = headerRow.querySelectorAll('th');
                cells.forEach((cell, index) => {
                    if (days[index]) {
                        cell.textContent = this.t(days[index]);
                    }
                });
            }
        }
    }
    
    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // Get supported languages
    getSupportedLanguages() {
        return this.supportedLanguages;
    }
}
// Expose constructor for guard checks
window.TranslationSystem = TranslationSystem;
}

// Initialize translation system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.translationSystem) {
        try {
            window.translationSystem = new window.TranslationSystem();
            window.t = (key, fallback) => window.translationSystem.t(key, fallback);
        } catch (e) {
            console.error('Failed to initialize TranslationSystem:', e);
        }
    }
});

// Listen for language changes
window.addEventListener('languageChanged', (event) => {
    // Update any components that need to respond to language changes
    console.log('Language changed to:', event.detail.language);
});