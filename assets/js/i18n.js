// Translation System
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
        
        // Load saved language from localStorage
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && this.supportedLanguages[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        
        this.loadLanguages();
    }
    
    // Load all language files
    async loadLanguages() {
        try {
            // Load language scripts dynamically
            await this.loadLanguageFile('vi');
            await this.loadLanguageFile('en');
            await this.loadLanguageFile('zh');
            await this.loadLanguageFile('ko');
            await this.loadLanguageFile('ja');
            
            // Set up translations object
            this.translations = {
                'vi': typeof vietnameseTranslations !== 'undefined' ? vietnameseTranslations : {},
                'en': typeof englishTranslations !== 'undefined' ? englishTranslations : {},
                'zh': typeof chineseTranslations !== 'undefined' ? chineseTranslations : {},
                'ko': typeof koreanTranslations !== 'undefined' ? koreanTranslations : {},
                'ja': typeof japaneseTranslations !== 'undefined' ? japaneseTranslations : {}
            };
            
            this.initializeLanguageSelector();
            this.translatePage();
        } catch (error) {
            console.error('Error loading languages:', error);
        }
    }
    
    // Load individual language file
    loadLanguageFile(lang) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `assets/js/languages/${lang}.js`;
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
                <i class="fas fa-language"></i> ${this.supportedLanguages[this.currentLanguage].flag} ${this.supportedLanguages[this.currentLanguage].name}
            </a>
            <ul class="dropdown-menu" aria-labelledby="languageDropdown">
                ${Object.entries(this.supportedLanguages).map(([code, info]) => `
                    <li><a class="dropdown-item ${code === this.currentLanguage ? 'active' : ''}" href="#" data-lang="${code}">
                        ${info.flag} ${info.name}
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
        
        this.currentLanguage = newLanguage;
        localStorage.setItem('preferredLanguage', newLanguage);
        
        // Update dropdown display
        const dropdownToggle = document.getElementById('languageDropdown');
        if (dropdownToggle) {
            dropdownToggle.innerHTML = `<i class="fas fa-language"></i> ${this.supportedLanguages[newLanguage].flag} ${this.supportedLanguages[newLanguage].name}`;
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

// Initialize translation system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.translationSystem = new TranslationSystem();
    
    // Make translation function globally available
    window.t = (key, fallback) => window.translationSystem.t(key, fallback);
});

// Listen for language changes
window.addEventListener('languageChanged', (event) => {
    // Update any components that need to respond to language changes
    console.log('Language changed to:', event.detail.language);
});