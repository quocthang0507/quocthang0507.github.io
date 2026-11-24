const fs = require('fs');
const path = require('path');

describe('delegate-nameplate Vietnamese administrative & office styles', () => {
  const htmlRaw = fs.readFileSync(path.resolve(__dirname, '../../delegate-nameplate.html'), 'utf8')
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<link[^>]+>/, '');

  beforeEach(() => {
    document.body.innerHTML = htmlRaw;
    document.fonts = { ready: Promise.resolve() };
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      font: '',
      measureText: (txt) => {
        const m = /(\d+(?:\.\d+)?)px/.exec(this.font || '') || [null, '20'];
        const px = Number(m[1]) || 20;
        const width = String(txt || '').length * px * 0.55;
        return {
          width,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: width,
          actualBoundingBoxAscent: px * 0.78,
          actualBoundingBoxDescent: px * 0.22
        };
      }
    }));
    // Bind ctx.font properly per instance
    HTMLCanvasElement.prototype.getContext = jest.fn(() => {
      const ctx = {
        font: '20px Arial',
        measureText(txt) {
          const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font || '');
          const px = m ? Number(m[1]) : 20;
          const width = String(txt || '').length * px * 0.52;
          return {
            width,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: width,
            actualBoundingBoxAscent: px * 0.78,
            actualBoundingBoxDescent: px * 0.22
          };
        }
      };
      return ctx;
    });
  });

  function loadScript() {
    const callbacks = [];
    const origAdd = document.addEventListener.bind(document);
    const spy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'DOMContentLoaded') callbacks.push(fn);
      else origAdd(type, fn, opts);
    });
    try {
      const code = fs.readFileSync(path.resolve(__dirname, '../../assets/js/delegate-nameplate.js'), 'utf8');
      window.eval(code);
    } finally {
      spy.mockRestore();
    }
    callbacks.forEach(fn => fn());
  }

  it('applies all 8 Vietnamese admin & office presets and preserves user name', () => {
    loadScript();
    const nameInput = document.getElementById('np-name');
    nameInput.value = 'TRẦN VĂN HÙNG';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    const presetButtons = document.querySelectorAll('#np-presets .np-preset-btn');
    expect(presetButtons.length).toBe(8);

    presetButtons.forEach(btn => {
      btn.click();
      expect(btn.classList.contains('is-active')).toBe(true);
      expect(nameInput.value).toBe('TRẦN VĂN HÙNG');
      const svg = document.querySelector('#np-preview svg');
      expect(svg).not.toBeNull();
      const texts = Array.from(svg.querySelectorAll('text')).map(n => n.textContent);
      expect(texts).toContain('TRẦN VĂN HÙNG');
    });
  });

  it('renders 3-tier layouts (admin, office, gov) with org field and star emblem for gov', () => {
    loadScript();
    const layoutSelect = document.getElementById('np-layout');

    for (const layout of ['admin', 'office', 'gov']) {
      layoutSelect.value = layout;
      layoutSelect.dispatchEvent(new Event('input', { bubbles: true }));
      expect(document.getElementById('np-org-controls').hidden).toBe(false);
      const svg = document.querySelector('#np-preview svg');
      expect(svg.querySelectorAll('text').length).toBe(3);
      if (layout === 'gov') {
        expect(svg.querySelectorAll('polygon').length).toBe(1);
      }
    }

    layoutSelect.value = 'two';
    layoutSelect.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.getElementById('np-org-controls').hidden).toBe(true);
    expect(document.querySelectorAll('#np-preview svg text').length).toBe(2);
  });

  it('supports optional 5th column for organization in batch mode', () => {
    loadScript();
    document.getElementById('np-mode').value = 'batch';
    document.getElementById('np-mode').dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('np-layout').value = 'admin';
    document.getElementById('np-layout').dispatchEvent(new Event('input', { bubbles: true }));

    const batchInput = document.getElementById('np-batch-input');
    batchInput.value = 'NGUYỄN MINH TÂM | PHÓ GIÁM ĐỐC | ĐẠI BIỂU | 01 | SỞ TÀI CHÍNH';
    batchInput.dispatchEvent(new Event('input', { bubbles: true }));

    const texts = Array.from(document.querySelectorAll('#np-preview svg text')).map(n => n.textContent);
    expect(texts).toContain('SỞ TÀI CHÍNH');
    expect(texts).toContain('NGUYỄN MINH TÂM');
    expect(texts).toContain('PHÓ GIÁM ĐỐC');
  });

  it('renders multi-line role text in both single mode and batch \\n mode with uniform font size', () => {
    loadScript();
    const roleEl = document.getElementById('np-role');
    expect(roleEl.tagName).toBe('TEXTAREA');
    roleEl.value = 'PHÓ CHỦ TỊCH\nỦY BAN NHÂN DÂN\nTHÀNH PHỐ HÀ NỘI';
    roleEl.dispatchEvent(new Event('input', { bubbles: true }));

    const roleNodes = Array.from(document.querySelectorAll('#np-preview svg text[data-field="role"]'));
    expect(roleNodes.map(n => n.textContent)).toEqual([
      'PHÓ CHỦ TỊCH',
      'ỦY BAN NHÂN DÂN',
      'THÀNH PHỐ HÀ NỘI'
    ]);
    const sizes = new Set(roleNodes.map(n => n.getAttribute('font-size')));
    expect(sizes.size).toBe(1);

    document.getElementById('np-mode').value = 'batch';
    document.getElementById('np-mode').dispatchEvent(new Event('input', { bubbles: true }));
    const batchInput = document.getElementById('np-batch-input');
    batchInput.value = 'LÊ MINH TUẤN | TRƯỞNG PHÒNG\\nPHÒNG TỔ CHỨC CÁN BỘ';
    batchInput.dispatchEvent(new Event('input', { bubbles: true }));
    const batchRoleNodes = Array.from(document.querySelectorAll('#np-preview svg text[data-field="role"]'));
    expect(batchRoleNodes.map(n => n.textContent)).toEqual([
      'TRƯỞNG PHÒNG',
      'PHÒNG TỔ CHỨC CÁN BỘ'
    ]);
  });

  it('defines every data-i18n key in delegate-nameplate.html across all 5 languages', () => {
    const keys = Array.from(document.querySelectorAll('[data-i18n]')).map(n => n.getAttribute('data-i18n'));
    const extraHelpKeys = ['np.help_one', 'np.help_two', 'np.help_admin', 'np.help_office', 'np.help_gov', 'np.help_logo', 'np.help_band', 'np.help_duplex', 'np.org_label'];
    const allKeys = [...new Set([...keys, ...extraHelpKeys])];

    for (const lang of ['vi', 'en', 'zh', 'ko', 'ja']) {
      const content = fs.readFileSync(path.resolve(__dirname, `../../assets/js/languages/${lang}.js`), 'utf8');
      for (const key of allKeys) {
        expect(content).toContain(`"${key}"`);
      }
    }
  });
});
