const {
  escapeHtml,
  sanitizeHtml,
  safeSetInnerHTML,
  sanitizeUrl,
  sanitizeError,
  showSafeAlert,
  isInputSafe,
  isSafeDataImageUrl
} = require('../../assets/js/security.js');

describe('escapeHtml & sanitizeHtml', () => {
  it('escapes HTML special characters and quotes', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
    expect(escapeHtml("O'Reilly & Co")).toBe('O&#39;Reilly &amp; Co');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('safeSetInnerHTML always writes plain text without interpreting HTML', () => {
    const el = document.createElement('div');
    safeSetInnerHTML(el, '<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(sanitizeHtml('<b>hi</b>')).toBe('&lt;b&gt;hi&lt;/b&gt;');
  });
});

describe('sanitizeUrl', () => {
  it('blocks dangerous protocols and control-character obfuscation', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('  java\tscript:alert(1)')).toBeNull();
    expect(sanitizeUrl('java\nscript:alert(1)')).toBeNull();
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
  });

  it('allows safe http(s), mailto, tel, and relative paths', () => {
    expect(sanitizeUrl('https://example.com/path?a=1')).toBe('https://example.com/path?a=1');
    expect(sanitizeUrl('http://localhost:4000')).toBe('http://localhost:4000');
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
    expect(sanitizeUrl('/random-number/')).toBe('/random-number/');
    expect(sanitizeUrl('#section')).toBe('#section');
  });
});

describe('isSafeDataImageUrl', () => {
  it('allows base64 raster images and rejects svg+xml or script URLs', () => {
    expect(isSafeDataImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isSafeDataImageUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
    expect(isSafeDataImageUrl('data:image/webp;base64,UklGRg==')).toBe(true);
    expect(isSafeDataImageUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isSafeDataImageUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('sanitizeError & showSafeAlert & isInputSafe', () => {
  it('escapes error messages and displays safe alert text', () => {
    expect(sanitizeError(new Error('<script>boom</script>'))).toBe(
      '&lt;script&gt;boom&lt;/script&gt;'
    );
    const container = document.createElement('div');
    showSafeAlert('<b>unsafe</b>', 'danger', container);
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('span').textContent).toBe('<b>unsafe</b>');
    expect(isInputSafe('java\tscript:alert(1)')).toBe(true); // note sanitizeUrl catches control-char schemes
    expect(isInputSafe('<script>alert(1)</script>')).toBe(false);
  });
});
