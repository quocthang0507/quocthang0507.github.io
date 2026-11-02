// Page scripts rely on globals from security.js (loaded by the layout)
global.escapeHtml = require('../assets/js/security.js').escapeHtml;

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
  if (!global.bootstrap) {
    global.bootstrap = { Tooltip: jest.fn() };
  }
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (callback) => callback();
  }
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    }))
  });
});
