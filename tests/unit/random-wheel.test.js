describe('random wheel timing and suspense settings', () => {
  it('uses a two-phase 5 second spin and stops audio 0.5 second early', async () => {
    jest.useFakeTimers();
    localStorage.setItem('wheelSpinDuration', JSON.stringify(5000));
    localStorage.setItem('wheelSuspenseEffect', JSON.stringify(true));
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
    const mainPhaseTransform = wheel.style.transform;
    expect(audio.playbackRate).toBeCloseTo(2500 / 4500);

    jest.advanceTimersByTime(4000);
    expect(wheel.style.transform).not.toBe(mainPhaseTransform);
    expect(document.getElementById('spin-btn').disabled).toBe(true);

    jest.advanceTimersByTime(499);
    expect(audio.pause).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(document.getElementById('spin-btn').disabled).toBe(true);

    jest.advanceTimersByTime(500);
    expect(document.getElementById('spin-btn').disabled).toBe(false);
    expect(document.getElementById('wheel-result').textContent).toBe('A');

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
