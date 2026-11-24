describe('random wheel timing and suspense settings', () => {
  it('uses a single continuous suspense deceleration on 5s spin (no mid-spin jump) and stops classic audio 0.5s early', async () => {
    jest.useFakeTimers();
    localStorage.setItem('wheelSpinDuration', JSON.stringify(5000));
    localStorage.setItem('wheelSuspenseEffect', JSON.stringify(true));
    localStorage.setItem('wheelSpinSound', JSON.stringify('classic'));
    localStorage.setItem('wheelWinnerSound', JSON.stringify('none'));

    document.body.innerHTML = `
      <select id="color-theme-selector"></select>
      <select id="spin-duration-selector">
        <option value="2000">Very Fast</option>
        <option value="3000">Fast</option>
        <option value="5000">Medium</option>
        <option value="7000">Slow</option>
        <option value="10000">Very Slow</option>
        <option value="15000">Dramatic</option>
        <option value="20000">Event</option>
        <option value="30000">Ultra</option>
      </select>
      <input id="suspense-effect" type="checkbox">
      <input id="remove-winner" type="checkbox">
      <input id="confetti-effect" type="checkbox">
      <input id="name-input"><textarea id="bulk-names"></textarea>
      <button id="add-name-btn"></button><button id="add-bulk-btn"></button>
      <button id="spin-btn"></button><button id="reset-wheel-btn"></button>
      <button id="clear-names-btn"></button><button id="clear-history-wheel-btn"></button>
      <button id="export-wheel-data-btn"></button>
      <div id="names-list"></div><div id="wheel-names"></div>
      <div id="wheel-result"></div><div id="spin-history"></div>
      <div id="total-spins"></div><div id="current-names-count"></div><div id="top-winners"></div>
      <audio id="wheel-spin-audio"></audio>
    `;

    const canvasContext = {
      setTransform: jest.fn(), clearRect: jest.fn(), beginPath: jest.fn(),
      moveTo: jest.fn(), arc: jest.fn(), closePath: jest.fn(), fill: jest.fn(),
      stroke: jest.fn(), save: jest.fn(), translate: jest.fn(), rotate: jest.fn(),
      measureText: jest.fn(() => ({ width: 20 })), fillText: jest.fn(), restore: jest.fn()
    };
    HTMLCanvasElement.prototype.getContext = jest.fn(() => canvasContext);
    HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({ width: 400, height: 400 }));

    const audio = document.getElementById('wheel-spin-audio');
    audio.canPlayType = jest.fn(() => 'probably');
    audio.play = jest.fn().mockResolvedValue();
    audio.pause = jest.fn();

    window.AudioContext = jest.fn(() => ({
      destination: {},
      createGain: () => ({ connect: jest.fn() })
    }));
    window.t = (key, fallback) => fallback || key;
    global.loadFromLocalStorage = jest.fn(key => key === 'wheelNames' ? ['A', 'B', 'C'] : []);
    global.saveToLocalStorage = jest.fn();
    global.showAlert = jest.fn();
    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    jest.isolateModules(() => {
      require('../../assets/js/random-wheel.js');
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('spin-duration-selector').value).toBe('5000');
    expect(document.getElementById('suspense-effect').checked).toBe(true);

    document.getElementById('spin-btn').click();
    const wheel = document.getElementById('wheel-names');
    const initialTransform = wheel.style.transform;
    expect(wheel.style.transition).toBe('transform 5000ms cubic-bezier(0.06, 0.92, 0.12, 1)');
    expect(audio.playbackRate).toBeCloseTo(2500 / 4500);

    // Must NOT perform a choppy second-phase transform jump mid-spin
    jest.advanceTimersByTime(4000);
    expect(wheel.style.transform).toBe(initialTransform);
    expect(document.getElementById('spin-btn').disabled).toBe(true);

    jest.advanceTimersByTime(499);
    expect(audio.pause).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(document.getElementById('spin-btn').disabled).toBe(true);

    jest.advanceTimersByTime(500);
    expect(document.getElementById('spin-btn').disabled).toBe(false);
    expect(document.getElementById('wheel-result').textContent).toBe('A');

    Math.random.mockRestore();
    jest.useRealTimers();
  });

  it('randomly either tips gently over the divider or holds at the edge in suspense mode, and supports 15s duration', () => {
    jest.useFakeTimers();
    localStorage.setItem('wheelSpinDuration', JSON.stringify(15000));
    localStorage.setItem('wheelSuspenseEffect', JSON.stringify(true));
    localStorage.setItem('wheelSpinSound', JSON.stringify('none'));
    localStorage.setItem('wheelWinnerSound', JSON.stringify('none'));

    document.body.innerHTML = `
      <select id="color-theme-selector"></select>
      <select id="spin-duration-selector">
        <option value="2000">2s</option>
        <option value="3000">3s</option>
        <option value="5000">5s</option>
        <option value="7000">7s</option>
        <option value="10000">10s</option>
        <option value="15000">15s</option>
        <option value="20000">20s</option>
        <option value="30000">30s</option>
      </select>
      <input id="suspense-effect" type="checkbox">
      <input id="remove-winner" type="checkbox">
      <input id="confetti-effect" type="checkbox">
      <input id="name-input"><textarea id="bulk-names"></textarea>
      <button id="add-name-btn"></button><button id="add-bulk-btn"></button>
      <button id="spin-btn"></button><button id="reset-wheel-btn"></button>
      <button id="clear-names-btn"></button><button id="clear-history-wheel-btn"></button>
      <button id="export-wheel-data-btn"></button>
      <div id="names-list"></div><div id="wheel-names"></div>
      <div id="wheel-result"></div><div id="spin-history"></div>
      <div id="total-spins"></div><div id="current-names-count"></div><div id="top-winners"></div>
      <audio id="wheel-spin-audio"></audio>
    `;

    window.t = (key, fallback) => fallback || key;
    global.loadFromLocalStorage = jest.fn(key => key === 'wheelNames' ? ['A', 'B', 'C', 'D'] : []);
    global.saveToLocalStorage = jest.fn();
    global.showAlert = jest.fn();

    const domLoadedCallbacks = [];
    const origAdd = document.addEventListener.bind(document);
    const addSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'DOMContentLoaded') domLoadedCallbacks.push(fn);
      else origAdd(type, fn, opts);
    });
    try {
      jest.isolateModules(() => {
        require('../../assets/js/random-wheel.js');
      });
    } finally {
      addSpy.mockRestore();
    }
    domLoadedCallbacks.forEach(fn => fn());

    expect(document.getElementById('spin-duration-selector').value).toBe('15000');
    const wheel = document.getElementById('wheel-names');

    // Spin 1: pushOverDivider = true (3rd random < 0.5) -> lands just past divider inside slice B (near 180 deg, offset ~87..89)
    const randSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.0)   // fullSpins = minSpins (~14 spins for 15s)
      .mockReturnValueOnce(0.3)   // selectedIndex = 1 ('B', slice [90, 180))
      .mockReturnValueOnce(0.2)   // pushOverDivider = true (< 0.5)
      .mockReturnValueOnce(0.5);  // pastMargin midpoint (~2.05 deg)

    document.getElementById('spin-btn').click();
    expect(wheel.style.transition).toBe('transform 15000ms cubic-bezier(0.06, 0.92, 0.12, 1)');
    const rot1 = parseFloat(wheel.style.transform.match(/rotate\(([-0-9.]+)deg\)/)[1]);
    expect(rot1).toBeGreaterThanOrEqual(13 * 360);
    const norm1 = ((360 - (rot1 % 360)) + 360) % 360;
    // Just past the 180 deg divider into slice B [90, 180)
    expect(norm1).toBeGreaterThan(176);
    expect(norm1).toBeLessThan(180);

    jest.advanceTimersByTime(15000);
    expect(document.getElementById('wheel-result').textContent).toBe('B');

    // Spin 2: pushOverDivider = false (3rd random >= 0.5) -> holds right before divider inside slice B (near 90 deg, offset ~0.6..1.8)
    randSpy
      .mockReturnValueOnce(0.0)   // fullSpins
      .mockReturnValueOnce(0.3)   // selectedIndex = 1 ('B', slice [90, 180))
      .mockReturnValueOnce(0.8)   // pushOverDivider = false (>= 0.5)
      .mockReturnValueOnce(0.5);  // holdMargin midpoint (~1.2 deg)

    document.getElementById('spin-btn').click();
    const rot2 = parseFloat(wheel.style.transform.match(/rotate\(([-0-9.]+)deg\)/)[1]);
    const norm2 = ((360 - (rot2 % 360)) + 360) % 360;
    // Holding right before the 90 deg divider inside slice B
    expect(norm2).toBeGreaterThan(90);
    expect(norm2).toBeLessThan(93);

    jest.advanceTimersByTime(15000);
    expect(document.getElementById('wheel-result').textContent).toBe('B');

    randSpy.mockRestore();
    jest.useRealTimers();
  });

  it('clamps playbackRate to >= 0.5 on 7s slow spins and resumes Web Audio fallback on playback error', async () => {
    jest.useFakeTimers();
    localStorage.setItem('wheelSpinDuration', JSON.stringify(7000));
    localStorage.setItem('wheelSuspenseEffect', JSON.stringify(false));
    localStorage.setItem('wheelSpinSound', JSON.stringify('classic'));
    localStorage.setItem('wheelWinnerSound', JSON.stringify('none'));

    document.body.innerHTML = `
      <select id="color-theme-selector"></select>
      <select id="spin-duration-selector">
        <option value="3000">Fast</option>
        <option value="5000">Medium</option>
        <option value="7000">Slow</option>
      </select>
      <input id="suspense-effect" type="checkbox">
      <input id="remove-winner" type="checkbox">
      <input id="confetti-effect" type="checkbox">
      <input id="name-input"><textarea id="bulk-names"></textarea>
      <button id="add-name-btn"></button><button id="add-bulk-btn"></button>
      <button id="spin-btn"></button><button id="reset-wheel-btn"></button>
      <button id="clear-names-btn"></button><button id="clear-history-wheel-btn"></button>
      <button id="export-wheel-data-btn"></button>
      <div id="names-list"></div><div id="wheel-names"></div>
      <div id="wheel-result"></div><div id="spin-history"></div>
      <div id="total-spins"></div><div id="current-names-count"></div><div id="top-winners"></div>
      <audio id="wheel-spin-audio"></audio>
    `;

    const audio = document.getElementById('wheel-spin-audio');
    audio.canPlayType = jest.fn(type => type === 'audio/wav' ? 'maybe' : '');
    audio.play = jest.fn().mockRejectedValue(new Error('NotAllowedError'));
    audio.pause = jest.fn();

    const resumeMock = jest.fn().mockResolvedValue();
    const oscStart = jest.fn();
    const oscStop = jest.fn();
    window.AudioContext = jest.fn(() => ({
      state: 'suspended',
      currentTime: 0,
      destination: {},
      resume: resumeMock,
      createGain: () => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
      }),
      createOscillator: () => ({
        type: 'triangle',
        frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: oscStart,
        stop: oscStop
      })
    }));
    window.t = (key, fallback) => fallback || key;
    global.loadFromLocalStorage = jest.fn(key => key === 'wheelNames' ? ['A', 'B', 'C'] : []);
    global.saveToLocalStorage = jest.fn();
    global.showAlert = jest.fn();

    const domLoadedCallbacks = [];
    const origAdd = document.addEventListener.bind(document);
    const addSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'DOMContentLoaded') domLoadedCallbacks.push(fn);
      else origAdd(type, fn, opts);
    });
    try {
      jest.isolateModules(() => {
        require('../../assets/js/random-wheel.js');
      });
    } finally {
      addSpy.mockRestore();
    }
    domLoadedCallbacks.forEach(fn => fn());

    document.getElementById('spin-btn').click();
    // 2500 / 6500 = 0.3846 would be muted by Chromium/Safari; must clamp to 0.5
    expect(audio.playbackRate).toBe(0.5);

    // Flush play() rejection promise to trigger Web Audio fallback
    await Promise.resolve();
    await Promise.resolve();
    expect(resumeMock).toHaveBeenCalledTimes(1);
    expect(oscStart).toHaveBeenCalled();

    jest.advanceTimersByTime(6500);
    expect(oscStop).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('defaults to Wheel-of-Names slice-synced ticking and plays celebratory winner sound on stop', () => {
    jest.useFakeTimers();
    localStorage.clear();

    document.body.innerHTML = `
      <div class="wheel-pointer"></div>
      <select id="color-theme-selector"></select>
      <select id="spin-duration-selector">
        <option value="3000">Fast</option>
        <option value="5000">Medium</option>
        <option value="7000">Slow</option>
      </select>
      <select id="spin-sound-selector">
        <option value="ticking">Ticking</option>
        <option value="piano">Piano</option>
        <option value="classic">Classic</option>
        <option value="none">None</option>
      </select>
      <select id="winner-sound-selector">
        <option value="applause">Applause</option>
        <option value="fanfare">Fanfare</option>
        <option value="chime">Chime</option>
        <option value="none">None</option>
      </select>
      <input id="wheel-volume-slider" type="range" value="75">
      <strong id="wheel-volume-value">75%</strong>
      <button id="test-wheel-sound-btn"></button>
      <input id="suspense-effect" type="checkbox">
      <input id="remove-winner" type="checkbox">
      <input id="confetti-effect" type="checkbox">
      <input id="name-input"><textarea id="bulk-names"></textarea>
      <button id="add-name-btn"></button><button id="add-bulk-btn"></button>
      <button id="spin-btn"></button><button id="reset-wheel-btn"></button>
      <button id="clear-names-btn"></button><button id="clear-history-wheel-btn"></button>
      <button id="export-wheel-data-btn"></button>
      <div id="names-list"></div><div id="wheel-names"></div>
      <div id="wheel-result"></div><div id="spin-history"></div>
      <div id="total-spins"></div><div id="current-names-count"></div><div id="top-winners"></div>
      <audio id="wheel-spin-audio"></audio>
    `;

    const oscStart = jest.fn();
    const noiseStart = jest.fn();
    window.AudioContext = jest.fn(() => ({
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createGain: () => ({
        gain: { value: 0.75, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn()
      }),
      createOscillator: () => ({
        type: 'triangle',
        frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: oscStart,
        stop: jest.fn()
      }),
      createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len) }),
      createBufferSource: () => ({
        buffer: null,
        connect: jest.fn(),
        start: noiseStart,
        stop: jest.fn()
      }),
      createBiquadFilter: () => ({
        type: 'bandpass',
        frequency: { setValueAtTime: jest.fn() },
        Q: { setValueAtTime: jest.fn() },
        connect: jest.fn()
      })
    }));
    window.t = (key, fallback) => fallback || key;
    global.loadFromLocalStorage = jest.fn(key => key === 'wheelNames' ? ['A', 'B', 'C', 'D'] : []);
    global.saveToLocalStorage = jest.fn();
    global.showAlert = jest.fn();

    const domLoadedCallbacks = [];
    const origAdd = document.addEventListener.bind(document);
    const addSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'DOMContentLoaded') domLoadedCallbacks.push(fn);
      else origAdd(type, fn, opts);
    });
    try {
      jest.isolateModules(() => {
        require('../../assets/js/random-wheel.js');
      });
    } finally {
      addSpy.mockRestore();
    }
    domLoadedCallbacks.forEach(fn => fn());

    expect(document.getElementById('spin-sound-selector').value).toBe('ticking');
    expect(document.getElementById('winner-sound-selector').value).toBe('applause');

    document.getElementById('spin-btn').click();
    // Immediate opening peg tick + pointer flick
    expect(oscStart.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(noiseStart.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('.wheel-pointer').classList.contains('is-ticking')).toBe(true);

    const oscBeforeWin = oscStart.mock.calls.length;
    const noiseBeforeWin = noiseStart.mock.calls.length;

    // Spin completes -> plays celebratory applause + chime winner sound
    jest.advanceTimersByTime(3000);
    expect(oscStart.mock.calls.length).toBeGreaterThan(oscBeforeWin);
    expect(noiseStart.mock.calls.length).toBeGreaterThan(noiseBeforeWin + 10);

    jest.useRealTimers();
  });
});
