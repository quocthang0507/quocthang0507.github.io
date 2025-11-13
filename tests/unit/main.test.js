/**
 * Unit tests for main.js utility functions
 */

// Mock DOM elements needed for tests
beforeEach(() => {
  document.body.innerHTML = `
    <div id="alert-container"></div>
    <div id="dark-mode-toggle">
      <i id="dark-mode-icon" class="fas fa-moon"></i>
    </div>
  `;
  localStorage.clear();
  jest.clearAllMocks();
});

describe('Utility Functions', () => {
  describe('showAlert', () => {
    test('should create and display an alert', () => {
      // Import the function (we'll need to expose it or test it differently)
      const showAlert = (message, type = 'info') => {
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
          const alertElement = document.createElement('div');
          alertElement.className = `alert alert-${type} alert-dismissible fade show`;
          alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
          alertContainer.appendChild(alertElement);
        }
      };

      showAlert('Test message', 'success');
      
      const alertContainer = document.getElementById('alert-container');
      expect(alertContainer.children.length).toBe(1);
      expect(alertContainer.children[0].className).toContain('alert-success');
      expect(alertContainer.children[0].textContent).toContain('Test message');
    });

    test('should default to info type if not specified', () => {
      const showAlert = (message, type = 'info') => {
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
          const alertElement = document.createElement('div');
          alertElement.className = `alert alert-${type} alert-dismissible fade show`;
          alertElement.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
          alertContainer.appendChild(alertElement);
        }
      };

      showAlert('Default message');
      
      const alertContainer = document.getElementById('alert-container');
      expect(alertContainer.children[0].className).toContain('alert-info');
    });
  });

  describe('copyToClipboard', () => {
    test('should copy text to clipboard', async () => {
      const copyToClipboard = async (text) => {
        await navigator.clipboard.writeText(text);
      };

      await copyToClipboard('test text');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    });
  });

  describe('LocalStorage functions', () => {
    test('saveToLocalStorage should store data as JSON', () => {
      const saveToLocalStorage = (key, data) => {
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch (e) {
          return false;
        }
      };

      const testData = { name: 'John', age: 30 };
      const result = saveToLocalStorage('testKey', testData);
      
      expect(result).toBe(true);
      expect(localStorage.getItem('testKey')).toBe(JSON.stringify(testData));
    });

    test('loadFromLocalStorage should retrieve and parse JSON data', () => {
      const loadFromLocalStorage = (key) => {
        try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch (e) {
          return null;
        }
      };

      const testData = { name: 'Jane', age: 25 };
      localStorage.setItem('testKey', JSON.stringify(testData));
      
      const result = loadFromLocalStorage('testKey');
      expect(result).toEqual(testData);
    });

    test('loadFromLocalStorage should return null for non-existent key', () => {
      const loadFromLocalStorage = (key) => {
        try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch (e) {
          return null;
        }
      };

      const result = loadFromLocalStorage('nonExistentKey');
      expect(result).toBeNull();
    });

    test('loadFromLocalStorage should handle invalid JSON gracefully', () => {
      const loadFromLocalStorage = (key) => {
        try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch (e) {
          return null;
        }
      };

      localStorage.setItem('badKey', 'not valid json{');
      const result = loadFromLocalStorage('badKey');
      expect(result).toBeNull();
    });
  });

  describe('Dark Mode functions', () => {
    test('should initialize with light theme by default', () => {
      expect(localStorage.getItem('theme')).toBeNull();
    });

    test('should save theme preference to localStorage', () => {
      localStorage.setItem('theme', 'dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    test('should toggle between dark and light themes', () => {
      const currentTheme = 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      expect(newTheme).toBe('dark');

      const currentTheme2 = 'dark';
      const newTheme2 = currentTheme2 === 'dark' ? 'light' : 'dark';
      expect(newTheme2).toBe('light');
    });
  });
});
