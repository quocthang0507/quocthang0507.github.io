const { getConsent, setConsent, CONSENT_KEY } = require('../../assets/js/consent.js');

describe('analytics consent', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.gtag = function () { window.dataLayer.push(arguments); };
  });

  it('reports no choice until the visitor decides', () => {
    expect(getConsent()).toBeNull();
  });

  it('stores a grant and tells Google tag to allow analytics storage', () => {
    setConsent(true);
    expect(localStorage.getItem(CONSENT_KEY)).toBe('granted');
    expect(getConsent()).toBe(true);
    const last = Array.from(window.dataLayer.at(-1));
    expect(last).toEqual(['consent', 'update', { analytics_storage: 'granted' }]);
  });

  it('stores a refusal, denies storage and removes existing Google Analytics cookies', () => {
    document.cookie = '_ga=GA1.1.123; path=/';
    document.cookie = '_ga_ABC123=GS1.1.456; path=/';
    document.cookie = 'keep_me=1; path=/';
    setConsent(false);
    expect(getConsent()).toBe(false);
    expect(Array.from(window.dataLayer.at(-1))).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(document.cookie).not.toMatch(/_ga/);
    expect(document.cookie).toMatch(/keep_me=1/);
  });
});
