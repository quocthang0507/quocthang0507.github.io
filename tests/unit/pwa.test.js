const fs = require('fs');
const path = require('path');

describe('PWA manifest, icons, and install lifecycle', () => {
  const rootDir = path.join(__dirname, '../..');

  it('has a valid installable site.webmanifest with real PNG 192x192, 512x512, and maskable icons', () => {
    const manifestPath = path.join(rootDir, 'site.webmanifest');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest.id).toBe('/');
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(4);

    const has192 = manifest.icons.some(i => i.sizes === '192x192' && i.type === 'image/png' && i.purpose === 'any');
    const has512 = manifest.icons.some(i => i.sizes === '512x512' && i.type === 'image/png' && i.purpose === 'any');
    const hasMaskable512 = manifest.icons.some(i => i.sizes === '512x512' && i.type === 'image/png' && i.purpose === 'maskable');
    expect(has192).toBe(true);
    expect(has512).toBe(true);
    expect(hasMaskable512).toBe(true);

    // Every manifest icon must exist on disk and start with the real PNG magic bytes
    const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    for (const icon of manifest.icons) {
      const filePath = path.join(rootDir, icon.src.replace(/^\//, ''));
      expect(fs.existsSync(filePath)).toBe(true);
      const buf = fs.readFileSync(filePath);
      expect(buf.subarray(0, 8).equals(pngSig)).toBe(true);
    }

    // favicon.ico must be a real ICO container
    const icoBuf = fs.readFileSync(path.join(rootDir, 'favicon.ico'));
    expect(icoBuf.readUInt16LE(0)).toBe(0);
    expect(icoBuf.readUInt16LE(2)).toBe(1);
    expect(icoBuf.readUInt16LE(4)).toBeGreaterThanOrEqual(2);
  });

  it('reveals install buttons on beforeinstallprompt, prompts on click, and syncs theme-color & offline banner', async () => {
    document.head.innerHTML = '<meta name="theme-color" content="#6750A4">';
    document.documentElement.removeAttribute('data-theme');
    document.body.innerHTML = `
      <button id="pwa-install-btn" hidden style="display: none;">Install</button>
      <span class="pwa-footer-sep" hidden>·</span>
      <a href="#" data-action="install-pwa" hidden>Install</a>
      <script id="pwa-script" data-sw-url="/sw.js"></script>
    `;

    const registerMock = jest.fn().mockResolvedValue({
      addEventListener: jest.fn()
    });
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: registerMock,
        addEventListener: jest.fn()
      }
    });
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    window.showAlert = jest.fn();

    const domLoadedCallbacks = [];
    const origAdd = document.addEventListener.bind(document);
    const addSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'DOMContentLoaded') domLoadedCallbacks.push(fn);
      else origAdd(type, fn, opts);
    });
    try {
      jest.isolateModules(() => {
        require('../../assets/js/pwa.js');
      });
    } finally {
      addSpy.mockRestore();
    }
    domLoadedCallbacks.forEach(fn => fn());

    const navBtn = document.getElementById('pwa-install-btn');
    const footerLink = document.querySelector('[data-action="install-pwa"]');
    expect(navBtn.hidden).toBe(true);
    expect(footerLink.hidden).toBe(true);

    // Fire beforeinstallprompt
    const promptMock = jest.fn();
    const bipEvent = new Event('beforeinstallprompt');
    bipEvent.preventDefault = jest.fn();
    bipEvent.prompt = promptMock;
    bipEvent.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(bipEvent);

    expect(bipEvent.preventDefault).toHaveBeenCalled();
    expect(navBtn.hidden).toBe(false);
    expect(footerLink.hidden).toBe(false);
    expect(window.PWAHelper.canInstall()).toBe(true);

    // Click install button -> prompts and hides after acceptance
    navBtn.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(navBtn.hidden).toBe(true);

    // Toggle dark mode -> theme-color updates dynamically
    document.documentElement.setAttribute('data-theme', 'dark');
    await Promise.resolve();
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#1e2028');

    // Offline event -> shows offline banner; online event -> removes it
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
    expect(document.getElementById('pwa-offline-banner')).not.toBeNull();

    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    window.dispatchEvent(new Event('online'));
    expect(document.getElementById('pwa-offline-banner')).toBeNull();
  });
});
