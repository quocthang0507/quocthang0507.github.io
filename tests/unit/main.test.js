const {
  showAlert,
  copyToClipboard,
  saveToLocalStorage,
  loadFromLocalStorage,
  initializeDarkMode,
  updateDarkModeIcon,
  initializeCustomThemeToggle,
  announceThemeChange
} = require('../../assets/js/main.js');

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete window.gtag;
  delete navigator.clipboard;
  delete document.execCommand;
});

describe('showAlert', () => {
  it('renders an alert and auto-dismisses it', () => {
    document.body.innerHTML = '<div id="alert-container"></div>';

    showAlert('Hello world', 'success');

    const alertElement = document.querySelector('#alert-container .alert');
    expect(alertElement).not.toBeNull();
    expect(alertElement.classList.contains('alert-success')).toBe(true);
    expect(alertElement.querySelector('span').textContent).toBe('Hello world');

    jest.advanceTimersByTime(5000);
    expect(document.querySelector('#alert-container .alert')).toBeNull();
  });

  it('gracefully handles missing container', () => {
    expect(() => showAlert('No container')).not.toThrow();
  });
});

describe('copyToClipboard', () => {
  it('uses the Clipboard API when available', async () => {
    document.body.innerHTML = '<div id="alert-container"></div>';
    const writeText = jest.fn().mockResolvedValue();
    navigator.clipboard = { writeText };
    window.gtag = jest.fn();

    const result = await copyToClipboard('clipboard text');

    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith('clipboard text');
    expect(document.querySelector('#alert-container .alert')).not.toBeNull();
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'copy_to_clipboard',
      expect.objectContaining({ event_category: 'user_interaction' })
    );
  });

  it('falls back to execCommand when Clipboard API is unavailable', async () => {
    document.body.innerHTML = '<div id="alert-container"></div>';
    document.execCommand = jest.fn().mockReturnValue(true);

    const result = await copyToClipboard('fallback text');

    expect(result).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('#alert-container .alert')).not.toBeNull();
  });

  it('reports a failure when fallback copy fails', async () => {
    document.body.innerHTML = '<div id="alert-container"></div>';
    document.execCommand = jest.fn().mockReturnValue(false);
    window.gtag = jest.fn();

    const result = await copyToClipboard('bad text');

    expect(result).toBe(false);
    const alertElement = document.querySelector('#alert-container .alert');
    expect(alertElement.classList.contains('alert-danger')).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'copy_failed',
      expect.objectContaining({ event_category: 'user_interaction' })
    );
  });
});

describe('localStorage helpers', () => {
  it('stores and loads structured data', () => {
    const payload = { theme: 'dark' };

    expect(saveToLocalStorage('prefs', payload)).toBe(true);
    expect(loadFromLocalStorage('prefs')).toEqual(payload);
  });

  it('returns false when save fails', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('fail');
    });

    expect(saveToLocalStorage('prefs', { theme: 'light' })).toBe(false);
  });

  it('returns null when stored data is invalid JSON', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('prefs', '{bad json');

    expect(loadFromLocalStorage('prefs')).toBeNull();
  });
});

describe('theme utilities', () => {
  it('initializes dark mode and toggles via the button', () => {
    document.body.innerHTML = `
      <button id="dark-mode-toggle" title="">
        <i id="dark-mode-icon"></i>
      </button>
    `;
    localStorage.setItem('theme', 'dark');
    const mediaQuery = { matches: false, addEventListener: jest.fn() };
    window.matchMedia = jest.fn().mockReturnValue(mediaQuery);

    initializeDarkMode();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.getElementById('dark-mode-icon').className).toBe('fas fa-sun');

    document.getElementById('dark-mode-toggle').click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('handles missing matchMedia without errors', () => {
    document.body.innerHTML = `
      <button id="dark-mode-toggle" title="">
        <i id="dark-mode-icon"></i>
      </button>
    `;
    window.matchMedia = undefined;

    expect(() => initializeDarkMode()).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles custom theme class and announces changes', () => {
    document.body.innerHTML = `
      <div id="global-live-region"></div>
      <button data-action="toggle-custom-theme">Toggle</button>
    `;
    initializeCustomThemeToggle();

    document.querySelector('[data-action="toggle-custom-theme"]').click();

    expect(document.body.classList.contains('custom-theme')).toBe(true);
    expect(localStorage.getItem('customTheme')).toBe('on');
    expect(document.getElementById('global-live-region').textContent).toContain('Enhanced theme ON');
  });

  it('announces theme changes with translation fallback', () => {
    document.body.innerHTML = '<div id="global-live-region"></div>';

    announceThemeChange(false);

    expect(document.getElementById('global-live-region').textContent).toContain('Enhanced theme OFF');
  });

  it('still toggles custom theme when storage is blocked', () => {
    document.body.innerHTML = `
      <div id="global-live-region"></div>
      <button data-action="toggle-custom-theme">Toggle</button>
    `;
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    initializeCustomThemeToggle();

    document.querySelector('[data-action="toggle-custom-theme"]').click();

    expect(document.body.classList.contains('custom-theme')).toBe(true);
    expect(document.getElementById('global-live-region').textContent).toContain('Enhanced theme ON');
  });
});
