const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const { showAlert, saveToLocalStorage, loadFromLocalStorage } = require('../../assets/js/main.js');

function runDomScript(relPath) {
  const callbacks = [];
  const origAdd = document.addEventListener.bind(document);
  const spy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
    if (type === 'DOMContentLoaded') {
      callbacks.push(fn);
    } else {
      origAdd(type, fn, opts);
    }
  });
  try {
    const code = fs.readFileSync(path.resolve(__dirname, '../..', relPath), 'utf8');
    window.eval(code);
  } finally {
    spy.mockRestore();
  }
  callbacks.forEach(fn => fn());
}

beforeAll(() => {
  window.saveToLocalStorage = saveToLocalStorage;
  window.loadFromLocalStorage = loadFromLocalStorage;
  window.showAlert = showAlert;
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  Element.prototype.scrollIntoView = jest.fn();
});

describe('main.js showAlert XSS protection', () => {
  it('renders HTML payloads safely as textContent and sanitizes alert type', () => {
    document.body.innerHTML = '';
    showAlert('<img src=x onerror=alert(1)>', 'danger" onclick="alert(1)');
    const toast = document.querySelector('#global-toast-container .global-toast');
    expect(toast).not.toBeNull();
    expect(toast.querySelector('img')).toBeNull();
    expect(toast.querySelector('span').textContent).toBe('<img src=x onerror=alert(1)>');
    expect(toast.classList.contains('toast-info')).toBe(true);
    expect(toast.className).not.toContain('onclick');
  });
});

describe('lunar-calendar.js logic & edge cases', () => {
  beforeAll(() => {
    document.body.innerHTML = '';
    delete window.LunarCalendar;
    runDomScript('assets/js/lunar-calendar.js');
  });

  it('handles negative/early years and out-of-range month names safely', () => {
    expect(window.LunarCalendar.getZodiacAnimal(1)).not.toContain('undefined');
    expect(window.LunarCalendar.getCanChi(1)).not.toContain('undefined');
    expect(window.LunarCalendar.getZodiacAnimal(-4)).not.toContain('undefined');
    expect(window.LunarCalendar.getLunarMonthName(99)).toBe('Tháng 99');
  });

  it('classifies days into good, neutral (binh thuong), and bad rather than dropping neutral', () => {
    const statuses = new Set();
    for (let d = 1; d <= 30; d++) {
      const info = window.LunarCalendar.getGoodBadDayInfo(d, 5, 2026);
      statuses.add(info.status);
    }
    expect(statuses.has('tốt')).toBe(true);
    expect(statuses.has('bình thường')).toBe(true);
    expect(statuses.has('xấu')).toBe(true);
  });
});

describe('password-generator.js security & ambiguous exclusion', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <input id="password-length" type="range" value="16" />
      <span id="length-value">16</span>
      <input id="include-uppercase" type="checkbox" checked />
      <input id="include-lowercase" type="checkbox" checked />
      <input id="include-numbers" type="checkbox" checked />
      <input id="include-symbols" type="checkbox" checked />
      <input id="exclude-ambiguous" type="checkbox" checked />
      <input id="no-duplicate" type="checkbox" />
      <button id="generate-btn">Generate</button>
      <button id="copy-password-btn" disabled>Copy</button>
      <button id="clear-history-btn">Clear</button>
      <div id="password-display"></div>
      <span id="strength-badge"></span>
      <div id="strength-bar"></div>
      <div id="password-history"></div>
      <div id="alert-container"></div>
    `;
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (arr) => crypto.randomFillSync(arr)
      }
    });
  });

  it('excludes ambiguous chars (0, O, l, 1, I) across many generations and includes all classes', () => {
    runDomScript('assets/js/password-generator.js');

    const display = document.getElementById('password-display');
    const generateBtn = document.getElementById('generate-btn');

    for (let i = 0; i < 40; i++) {
      generateBtn.click();
      const pw = display.textContent;
      expect(pw).toHaveLength(16);
      expect(pw).not.toMatch(/[0Ol1I]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?/~`]/);
    }
  });
});

describe('hash-generator.js MD5 RFC 1321 vectors & whitespace handling', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <textarea id="input-text"></textarea>
      <div id="input-char-count">0</div>
      <div id="input-byte-count">0</div>
      <input id="file-input" type="file" />
      <button id="generate-btn"></button>
      <button id="paste-input-btn"></button>
      <button id="clear-input-btn"></button>
      <button id="clear-file-btn"></button>
      <button id="copy-all-btn"></button>
      <button id="select-all-algorithms"></button>
      <div id="file-hash-progress"><div id="progress-bar"></div><span id="progress-text"></span><span id="file-size-info"></span></div>
      <div id="file-info-display"><span id="file-name"></span><span id="file-size"></span><span id="file-type"></span><span id="processing-time"></span></div>
      <input id="check-md5" type="checkbox" checked />
      <input id="check-sha1" type="checkbox" />
      <input id="check-sha256" type="checkbox" />
      <input id="check-sha384" type="checkbox" />
      <input id="check-sha512" type="checkbox" />
      <div id="hash-results">
        <div class="mb-3"><input id="md5-hash" /></div>
        <div class="mb-3"><input id="sha1-hash" /></div>
        <div class="mb-3"><input id="sha256-hash" /></div>
        <div class="mb-3"><input id="sha384-hash" /></div>
        <div class="mb-3"><input id="sha512-hash" /></div>
      </div>
      <div id="alert-container"></div>
    `;
  });

  it('computes exact MD5 digests including 55/56-byte padding boundaries and preserves whitespace', async () => {
    runDomScript('assets/js/hash-generator.js');

    const input = document.getElementById('input-text');
    const generateBtn = document.getElementById('generate-btn');
    const md5Out = document.getElementById('md5-hash');

    const cases = [
      'abc',
      'message digest',
      'a'.repeat(55),
      'a'.repeat(56),
      '  leading and trailing  '
    ];

    for (const sample of cases) {
      input.value = sample;
      generateBtn.click();
      await new Promise(r => setTimeout(r, 10));
      const expected = crypto.createHash('md5').update(sample, 'utf8').digest('hex');
      expect(md5Out.value).toBe(expected);
    }
  });
});

describe('json-formatter.js CSV safety & copy handler', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <textarea id="json-input"></textarea>
      <textarea id="json-output"></textarea>
      <select id="indent-select"><option value="2" selected>2</option></select>
      <div id="json-validation-status"></div>
      <span id="label-json-indent"></span>
      <span id="label-json-input"></span>
      <span id="label-json-output"></span>
      <button id="format-json-btn"></button>
      <button id="minify-json-btn"></button>
      <button id="validate-json-btn"></button>
      <button id="json-to-csv-btn"></button>
      <button id="csv-to-json-btn"></button>
      <button id="load-json-sample-btn"></button>
      <button id="load-csv-sample-btn"></button>
      <button id="clear-btn"></button>
      <button id="copy-output-btn"><i class="fas fa-copy"></i><span>Copy</span></button>
    `;
  });

  it('ignores prototype-polluting CSV headers and preserves leading zeros', () => {
    runDomScript('assets/js/json-formatter.js');

    document.getElementById('json-input').value = 'code,__proto__,constructor,name\n00123,polluted,bad,Alice\n';
    document.getElementById('csv-to-json-btn').click();

    const parsed = JSON.parse(document.getElementById('json-output').value);
    expect(parsed).toEqual([{ code: '00123', name: 'Alice' }]);
    expect(({}).polluted).toBeUndefined();
  });

  it('copyOutput succeeds without throwing ReferenceError', async () => {
    navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };
    runDomScript('assets/js/json-formatter.js');

    document.getElementById('json-output').value = '{"ok":true}';
    document.getElementById('copy-output-btn').click();
    await new Promise(r => setTimeout(r, 10));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{"ok":true}');
    expect(document.querySelector('#copy-output-btn span').textContent).toBe('Đã sao chép');
  });
});

describe('encoder-decoder.js whitespace preservation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="base64-format" type="radio" name="format" value="base64" checked />
      <input id="hex-format" type="radio" name="format" value="hex" />
      <input id="url-format" type="radio" name="format" value="url" />
      <textarea id="input-text"></textarea>
      <textarea id="output-text"></textarea>
      <input id="file-input" type="file" />
      <button id="encode-btn"></button>
      <button id="decode-btn"></button>
      <button id="swap-btn"></button>
      <button id="copy-output-btn"></button>
      <button id="download-output-btn"></button>
      <button id="paste-input-btn"></button>
      <button id="clear-input-btn"></button>
      <button id="clear-file-btn"></button>
      <div id="input-char-count">0</div>
      <div id="input-byte-count">0</div>
      <div id="output-char-count">0</div>
      <div id="output-byte-count">0</div>
      <div id="alert-container"></div>
    `;
  });

  it('preserves intentional leading and trailing spaces during Base64 encoding', () => {
    runDomScript('assets/js/encoder-decoder.js');

    document.getElementById('input-text').value = '  hello  ';
    document.getElementById('encode-btn').click();
    expect(document.getElementById('output-text').value).toBe(Buffer.from('  hello  ', 'utf8').toString('base64'));
  });
});
