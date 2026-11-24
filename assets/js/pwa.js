// Progressive Web App (PWA) install prompt, Service Worker updates, theme-color sync & offline banner
(function () {
    const tr = (key, fallback) => {
        if (typeof window.t === 'function') {
            const val = window.t(key);
            if (val && val !== key) return val;
        }
        return fallback;
    };

    let deferredPrompt = null;
    let swRegistration = null;

    function isStandaloneMode() {
        return (
            (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
            window.navigator.standalone === true
        );
    }

    function isIosSafari() {
        const ua = window.navigator.userAgent || '';
        const isIos = /iPad|iPhone|iPod/.test(ua) ||
            (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
        const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
        return isIos && isSafari;
    }

    function syncThemeColorMeta() {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        meta.setAttribute('content', isDark ? '#1e2028' : '#6750A4');
    }

    function setInstallButtonsVisible(visible) {
        const navBtn = document.getElementById('pwa-install-btn');
        if (navBtn) {
            navBtn.hidden = !visible;
            navBtn.style.display = visible ? '' : 'none';
        }
        document.querySelectorAll('[data-action="install-pwa"]').forEach(el => {
            el.hidden = !visible;
            const sep = el.previousElementSibling;
            if (sep && sep.classList.contains('pwa-footer-sep')) {
                sep.hidden = !visible;
            }
        });
    }

    function showIosInstallModal() {
        let modalEl = document.getElementById('pwaIosInstallModal');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'pwaIosInstallModal';
            modalEl.className = 'modal fade';
            modalEl.tabIndex = -1;
            modalEl.setAttribute('aria-hidden', 'true');
            modalEl.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-mobile-alt me-2" aria-hidden="true"></i>
                                <span data-i18n="pwa.ios_title">Cài đặt trên iPhone / iPad</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <ol class="mb-0 ps-3">
                                <li class="mb-2" data-i18n="pwa.ios_step1">Nhấn vào nút <strong>Chia sẻ</strong> (biểu tượng mũi tên đi lên) ở thanh dưới Safari.</li>
                                <li data-i18n="pwa.ios_step2">Cuộn xuống và chọn <strong>Thêm vào Màn hình chính</strong> (Add to Home Screen), sau đó nhấn <strong>Thêm</strong>.</li>
                            </ol>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal" data-i18n="pwa.got_it">Đã hiểu</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalEl);
            if (window.translationSystem && typeof window.translationSystem.updatePageTranslations === 'function') {
                window.translationSystem.updatePageTranslations();
            }
        }

        if (window.bootstrap && typeof window.bootstrap.Modal === 'function') {
            window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        } else {
            const msg = `${tr('pwa.ios_title', 'Cài đặt trên iPhone / iPad')}: ${tr('pwa.ios_step1', 'Nhấn Chia sẻ')} → ${tr('pwa.ios_step2', 'Thêm vào Màn hình chính')}`;
            if (typeof window.showAlert === 'function') {
                window.showAlert(msg, 'info');
            }
        }
    }

    async function handleInstallClick(e) {
        if (e) e.preventDefault();

        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    setInstallButtonsVisible(false);
                    if (typeof window.trackEvent === 'function') {
                        window.trackEvent('pwa_install_accepted', 'pwa', 'browser_prompt');
                    }
                }
            } catch (err) {
                console.warn('PWA install prompt failed:', err);
            } finally {
                deferredPrompt = null;
            }
            return;
        }

        if (isIosSafari() && !isStandaloneMode()) {
            showIosInstallModal();
        }
    }

    function showUpdateToast(waitingWorker) {
        if (document.getElementById('pwa-update-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'pwa-update-toast';
        toast.className = 'pwa-status-toast pwa-update-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        const msg = document.createElement('span');
        msg.textContent = tr('pwa.update_available', 'Đã có phiên bản ứng dụng mới.');

        const updateBtn = document.createElement('button');
        updateBtn.type = 'button';
        updateBtn.className = 'btn btn-sm btn-primary ms-2';
        updateBtn.textContent = tr('pwa.update_now', 'Cập nhật');
        updateBtn.addEventListener('click', () => {
            if (waitingWorker) {
                waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            } else {
                window.location.reload();
            }
        });

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close btn-sm ms-2';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.addEventListener('click', () => toast.remove());

        toast.append(msg, updateBtn, closeBtn);
        document.body.appendChild(toast);
    }

    function updateOfflineBanner() {
        const offline = window.navigator.onLine === false;
        let banner = document.getElementById('pwa-offline-banner');

        if (offline) {
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'pwa-offline-banner';
                banner.className = 'pwa-status-toast pwa-offline-toast';
                banner.setAttribute('role', 'status');
                banner.setAttribute('aria-live', 'polite');
                banner.innerHTML = `<i class="fas fa-wifi-slash me-2" aria-hidden="true"></i><span></span>`;
                document.body.appendChild(banner);
            }
            const span = banner.querySelector('span');
            if (span) {
                span.textContent = tr('pwa.offline_banner', 'Đang ngoại tuyến — các công cụ cục bộ vẫn hoạt động bình thường.');
            }
        } else if (banner) {
            banner.remove();
        }
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in window.navigator)) return;

        let refreshing = false;
        window.navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });

        window.addEventListener('load', () => {
            const swScript = document.getElementById('pwa-script');
            const swUrl = (swScript && swScript.dataset.swUrl) || '/sw.js';

            window.navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' })
                .then(reg => {
                    swRegistration = reg;
                    if (reg.waiting && window.navigator.serviceWorker.controller) {
                        showUpdateToast(reg.waiting);
                    }
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (!newWorker) return;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && window.navigator.serviceWorker.controller) {
                                showUpdateToast(newWorker);
                            }
                        });
                    });
                })
                .catch(err => {
                    console.warn('ServiceWorker registration failed:', err);
                });
        });
    }

    function init() {
        if (isStandaloneMode()) {
            document.documentElement.classList.add('pwa-standalone');
        }

        syncThemeColorMeta();
        if (typeof MutationObserver === 'function') {
            const themeObserver = new MutationObserver(syncThemeColorMeta);
            themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }

        // Bind install triggers in navbar & footer
        const navBtn = document.getElementById('pwa-install-btn');
        if (navBtn) {
            navBtn.addEventListener('click', handleInstallClick);
        }
        document.querySelectorAll('[data-action="install-pwa"]').forEach(el => {
            el.addEventListener('click', handleInstallClick);
        });

        // Show install option immediately on iOS Safari if not already installed
        if (isIosSafari() && !isStandaloneMode()) {
            setInstallButtonsVisible(true);
        } else {
            setInstallButtonsVisible(false);
        }

        window.addEventListener('beforeinstallprompt', event => {
            event.preventDefault();
            deferredPrompt = event;
            if (!isStandaloneMode()) {
                setInstallButtonsVisible(true);
            }
        });

        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            setInstallButtonsVisible(false);
            document.documentElement.classList.add('pwa-standalone');
            if (typeof window.showAlert === 'function') {
                window.showAlert(tr('pwa.installed_success', 'Đã cài đặt ứng dụng thành công!'), 'success');
            }
        });

        window.addEventListener('online', updateOfflineBanner);
        window.addEventListener('offline', updateOfflineBanner);
        updateOfflineBanner();

        registerServiceWorker();
    }

    window.PWAHelper = {
        isStandalone: isStandaloneMode,
        isIosSafari,
        canInstall: () => Boolean(deferredPrompt) || (isIosSafari() && !isStandaloneMode()),
        promptInstall: handleInstallClick,
        getRegistration: () => swRegistration
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
