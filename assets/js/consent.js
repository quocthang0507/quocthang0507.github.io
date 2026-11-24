// Analytics consent (Google Consent Mode v2)
// The layout loads Google Tag Manager with analytics storage denied by default;
// this banner records the visitor's choice and updates consent accordingly.

const CONSENT_KEY = 'analytics_consent';

function getConsent() {
    let value = null;
    try { value = localStorage.getItem(CONSENT_KEY); } catch (e) { value = null; }
    if (value === 'granted') return true;
    if (value === 'denied') return false;
    return null;
}

// Remove first-party Google Analytics cookies (_ga, _ga_<id>, _gid, _gat...)
function clearAnalyticsCookies() {
    const domains = ['', location.hostname, `.${location.hostname}`];
    document.cookie.split(';').forEach(pair => {
        const name = pair.split('=')[0].trim();
        if (!/^_(ga|gid|gat|gcl)/.test(name)) return;
        domains.forEach(domain => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`;
        });
    });
}

function setConsent(granted) {
    try { localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied'); } catch (e) { /* storage blocked */ }
    if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    }
    if (!granted) clearAnalyticsCookies();
}

function consentText(key, fallback) {
    const value = typeof window.t === 'function' ? window.t(key) : null;
    return value && value !== key ? value : fallback;
}

function renderConsentBanner() {
    let banner = document.getElementById('consent-banner');
    if (!banner) {
        banner = document.createElement('section');
        banner.id = 'consent-banner';
        banner.className = 'consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'consent-banner-title');
        document.body.appendChild(banner);

        banner.addEventListener('click', (e) => {
            const button = e.target.closest('[data-consent]');
            if (!button) return;
            const granted = button.dataset.consent === 'accept';
            setConsent(granted);
            hideConsentBanner();
            if (typeof window.showAlert === 'function') {
                window.showAlert(granted
                    ? consentText('consent.toast_enabled', 'Đã bật cookie phân tích')
                    : consentText('consent.toast_disabled', 'Đã tắt cookie phân tích'), 'success');
            }
        });
    }

    const privacyUrl = (document.querySelector('a[href$="/privacy/"]') || {}).href || '/privacy/';
    const current = getConsent();
    banner.innerHTML = `
        <h2 id="consent-banner-title" class="consent-banner-title">${escapeHtml(consentText('consent.title', 'Thông báo về Cookie & Dữ liệu'))}</h2>
        <p class="consent-banner-text">${escapeHtml(consentText('consent.message', 'Website này sử dụng Google Analytics để cải thiện trải nghiệm người dùng.'))}
            <a href="${escapeHtml(privacyUrl)}">${escapeHtml(consentText('consent.learn_more', 'Tìm hiểu thêm'))}</a></p>
        <div class="consent-banner-actions">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-consent="decline" aria-pressed="${current === false}">${escapeHtml(consentText('consent.decline', 'Từ chối'))}</button>
            <button type="button" class="btn btn-sm btn-primary" data-consent="accept" aria-pressed="${current === true}">${escapeHtml(consentText('consent.accept', 'Đồng ý'))}</button>
        </div>`;
    return banner;
}

function showConsentBanner() {
    const banner = renderConsentBanner();
    banner.hidden = false;
    const focusTarget = banner.querySelector('[data-consent="accept"]');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
}

function hideConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) banner.hidden = true;
}

if (typeof document !== 'undefined' && typeof module === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // "Manage cookies" controls (privacy page button, footer link) reopen the banner
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('#manage-cookies, [data-action="manage-cookies"]');
            if (!trigger) return;
            e.preventDefault();
            showConsentBanner();
        });

        if (getConsent() === null) {
            // Wait for translations so the first render is in the visitor's language
            // (window.t exists before the language file loads, so check for a real translation)
            const translated = typeof window.t === 'function' && window.t('consent.title') !== 'consent.title';
            if (translated) {
                showConsentBanner();
            } else {
                window.addEventListener('translationsReady', showConsentBanner, { once: true });
                // Fallback text if the language file never loads (offline, blocked)
                setTimeout(() => {
                    if (getConsent() === null && !document.getElementById('consent-banner')) showConsentBanner();
                }, 3000);
            }
        }
    });

    window.addEventListener('languageChanged', () => {
        const banner = document.getElementById('consent-banner');
        if (banner && !banner.hidden) renderConsentBanner();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONSENT_KEY, getConsent, setConsent, clearAnalyticsCookies };
}
