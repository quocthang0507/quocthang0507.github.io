// Cookie Consent Management
class CookieConsent {
    constructor() {
        this.consentKey = 'analytics_consent';
        this.consentExpiry = 365; // days
        this.init();
    }

    init() {
        // Check if consent has already been given or denied
        const consent = this.getConsent();
        
        if (consent === null) {
            // Show consent banner if no previous consent
            this.showConsentBanner();
        } else if (consent === true) {
            // Load analytics if consent was given
            this.loadAnalytics();
        }
        
        // Add event listener for manage cookies button (if it exists)
        this.addManageCookiesListener();
    }

    showConsentBanner() {
        // Wait for i18n to be ready
        const showBanner = () => {
            if (typeof i18n === 'undefined' || !i18n.isReady) {
                console.log('Waiting for i18n to be ready...');
                setTimeout(showBanner, 100);
                return;
            }

            console.log('Showing cookie consent banner');
            const banner = this.createConsentBanner();
            document.body.appendChild(banner);
            
            // Show banner with animation
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);
        };
        
        // Also try to show immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showBanner);
        } else {
            showBanner();
        }
    }

    createConsentBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h5 class="cookie-consent-title">${i18n.t('consent.title')}</h5>
                    <p class="cookie-consent-message">${i18n.t('consent.message')}</p>
                </div>
                <div class="cookie-consent-actions">
                    <button type="button" class="btn btn-outline-secondary btn-sm me-2" id="consent-learn-more">
                        <i class="fas fa-info-circle me-1"></i>${i18n.t('consent.learn_more')}
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm me-2" id="consent-decline">
                        <i class="fas fa-times me-1"></i>${i18n.t('consent.decline')}
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" id="consent-accept">
                        <i class="fas fa-check me-1"></i>${i18n.t('consent.accept')}
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        banner.querySelector('#consent-accept').addEventListener('click', () => {
            this.acceptConsent();
            this.hideConsentBanner(banner);
        });

        banner.querySelector('#consent-decline').addEventListener('click', () => {
            this.declineConsent();
            this.hideConsentBanner(banner);
        });

        banner.querySelector('#consent-learn-more').addEventListener('click', () => {
            // Show privacy info modal instead of opening new tab
            this.showPrivacyInfo();
        });

        return banner;
    }

    hideConsentBanner(banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        }, 300);
    }

    acceptConsent() {
        this.setConsent(true);
        this.loadAnalytics();
        
        // Track consent acceptance
        this.trackConsentEvent('accept');
    }

    declineConsent() {
        this.setConsent(false);
        
        // Remove any existing analytics
        this.removeAnalytics();
        
        // Track consent decline (without analytics)
        console.log('Analytics consent declined');
    }

    setConsent(value) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.consentExpiry);
        
        document.cookie = `${this.consentKey}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    }

    getConsent() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === this.consentKey) {
                return value === 'true';
            }
        }
        return null;
    }

    loadAnalytics() {
        // Only load analytics if not already loaded
        if (typeof gtag === 'undefined') {
            // Create and load gtag script
            const gtagScript = document.createElement('script');
            gtagScript.async = true;
            gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-RN1G3R206V';
            document.head.appendChild(gtagScript);

            // Initialize gtag
            gtagScript.onload = () => {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                
                gtag('js', new Date());
                
                // Configure Google Analytics 4 (GA4)
                gtag('config', 'G-RN1G3R206V', {
                    anonymize_ip: true,
                    cookie_flags: 'SameSite=Lax;Secure',
                    page_title: document.title,
                    page_path: location.pathname
                });
                
                // Configure Google Tag Manager / Universal Analytics
                gtag('config', 'GT-NFDPGZZX', {
                    anonymize_ip: true,
                    cookie_flags: 'SameSite=Lax;Secure',
                    page_title: document.title,
                    page_path: location.pathname
                });
                
                // Track initial page view
                gtag('event', 'page_view', {
                    page_title: document.title,
                    page_location: location.href,
                    content_group1: document.body.dataset.layout || 'default'
                });
                
                console.log('Google Analytics loaded with user consent');
            };
        }
    }

    removeAnalytics() {
        // Remove gtag scripts and clear dataLayer
        const gtagScripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
        gtagScripts.forEach(script => script.remove());
        
        // Clear dataLayer
        if (window.dataLayer) {
            window.dataLayer = [];
        }
        
        // Remove gtag function
        if (window.gtag) {
            delete window.gtag;
        }
        
        // Clear Google Analytics cookies
        this.clearGoogleCookies();
    }

    clearGoogleCookies() {
        const cookies = ['_ga', '_ga_*', '_gid', '_gat', '_gat_*', '_gcl_*'];
        
        cookies.forEach(cookieName => {
            if (cookieName.includes('*')) {
                // Handle wildcard cookies
                const prefix = cookieName.replace('*', '');
                document.cookie.split(';').forEach(cookie => {
                    const name = cookie.split('=')[0].trim();
                    if (name.startsWith(prefix)) {
                        this.deleteCookie(name);
                    }
                });
            } else {
                this.deleteCookie(cookieName);
            }
        });
    }

    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    }

    trackConsentEvent(action) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cookie_consent', {
                event_category: 'privacy',
                event_label: action,
                value: action === 'accept' ? 1 : 0
            });
        }
    }

    showPrivacyInfo() {
        // Create modal with privacy information
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'privacy-info-modal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${i18n.t('consent.title')}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>What data do we collect?</h6>
                        <ul>
                            <li>Anonymous usage statistics</li>
                            <li>Page views and navigation patterns</li>
                            <li>Device and browser information</li>
                            <li>Geographic location (country/region level)</li>
                        </ul>
                        
                        <h6>How do we use this data?</h6>
                        <ul>
                            <li>Improve website performance and user experience</li>
                            <li>Understand which features are most useful</li>
                            <li>Analyze traffic patterns and optimize content</li>
                        </ul>
                        
                        <h6>Data sharing</h6>
                        <p>We share anonymous data with Google Analytics for analysis purposes. No personally identifiable information is collected or shared.</p>
                        
                        <h6>Your choices</h6>
                        <p>You can change your cookie preferences at any time using the "Manage Cookies" button in the footer.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18n.t('common.close')}</button>
                        <button type="button" class="btn btn-primary" id="accept-from-modal">${i18n.t('consent.accept')}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Handle accept from modal
        modal.querySelector('#accept-from-modal').addEventListener('click', () => {
            this.acceptConsent();
            bootstrapModal.hide();
            
            // Remove consent banner if still visible
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) {
                this.hideConsentBanner(banner);
            }
        });
        
        // Clean up modal after hiding
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    addManageCookiesListener() {
        // Add listener for manage cookies button in footer
        document.addEventListener('click', (e) => {
            if (e.target.id === 'manage-cookies' || e.target.closest('#manage-cookies')) {
                e.preventDefault();
                this.showManageCookiesModal();
            }
        });
    }

    showManageCookiesModal() {
        const currentConsent = this.getConsent();
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'manage-cookies-modal';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${i18n.t('consent.manage')}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Current status: <strong>${currentConsent === true ? 'Accepted' : currentConsent === false ? 'Declined' : 'Not set'}</strong></p>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="cookie-preference" id="cookie-accept" value="accept" ${currentConsent === true ? 'checked' : ''}>
                            <label class="form-check-label" for="cookie-accept">
                                ${i18n.t('consent.accept')} - Enable Google Analytics
                            </label>
                        </div>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="cookie-preference" id="cookie-decline" value="decline" ${currentConsent === false ? 'checked' : ''}>
                            <label class="form-check-label" for="cookie-decline">
                                ${i18n.t('consent.decline')} - Disable Google Analytics
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${i18n.t('common.close')}</button>
                        <button type="button" class="btn btn-primary" id="save-preferences">Save Preferences</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Handle save preferences
        modal.querySelector('#save-preferences').addEventListener('click', () => {
            const selectedPreference = modal.querySelector('input[name="cookie-preference"]:checked').value;
            
            if (selectedPreference === 'accept') {
                this.acceptConsent();
            } else {
                this.declineConsent();
            }
            
            bootstrapModal.hide();
        });
        
        // Clean up modal after hiding
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    // Public method to check if analytics is enabled
    isAnalyticsEnabled() {
        return this.getConsent() === true;
    }

    // Public method to get consent status
    getConsentStatus() {
        const consent = this.getConsent();
        return {
            hasConsent: consent !== null,
            analyticsEnabled: consent === true
        };
    }
}

// Initialize cookie consent when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing cookie consent system...');
    window.cookieConsent = new CookieConsent();
});

// Also initialize if document is already loaded
if (document.readyState !== 'loading') {
    console.log('Document already loaded, initializing cookie consent...');
    window.cookieConsent = new CookieConsent();
}

// Add global test functions for debugging
window.testCookieConsent = {
    showBanner: () => {
        if (window.cookieConsent) {
            // Clear any existing consent to force banner to show
            document.cookie = 'analytics_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            window.cookieConsent.showConsentBanner();
        }
    },
    checkConsent: () => {
        if (window.cookieConsent) {
            return window.cookieConsent.getConsentStatus();
        }
    },
    clearConsent: () => {
        document.cookie = 'analytics_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        console.log('Cookie consent cleared');
    }
};