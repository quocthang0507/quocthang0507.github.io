const fs = require('fs');
const path = require('path');

function loadClockScript() {
  const domLoadedCallbacks = [];
  const origAdd = document.addEventListener.bind(document);
  const addSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
    if (type === 'DOMContentLoaded') domLoadedCallbacks.push(fn);
    else origAdd(type, fn, opts);
  });
  try {
    jest.isolateModules(() => {
      require('../../assets/js/clock.js');
    });
  } finally {
    addSpy.mockRestore();
  }
  domLoadedCallbacks.forEach(fn => fn());
}

describe('Shared clock.js Time Tools (Stopwatch, Countdown Timer, Alarm Clock)', () => {
  const rootDir = path.join(__dirname, '../..');

  afterEach(() => {
    if (window.TimeTools) window.TimeTools.stopRingtoneLoop();
    jest.useRealTimers();
    localStorage.clear();
  });

  it('reuses clock.js across Home, Stopwatch, Countdown Timer, and Alarm Clock pages', () => {
    for (const file of ['index.html', 'stopwatch.html', 'countdown-timer.html', 'alarm-clock.html']) {
      const src = fs.readFileSync(path.join(rootDir, file), 'utf8');
      expect(src).toMatch(/custom_js:.*'clock\.js'/);
    }
  });

  it('runs Stopwatch with lap splits, fastest/slowest highlights, and clean reset', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 24, 10, 0, 0, 0));

    document.body.innerHTML = `
      <div data-time-tool="stopwatch">
        <div id="stopwatch-display">00:00:00.000</div>
        <button id="start-stopwatch"></button>
        <button id="pause-stopwatch" disabled></button>
        <button id="lap-stopwatch" disabled></button>
        <button id="reset-stopwatch"></button>
        <button id="export-laps-btn" disabled></button>
        <p id="stopwatch-laps-empty"></p>
        <table><tbody id="stopwatch-laps"></tbody></table>
      </div>
    `;
    loadClockScript();

    document.getElementById('start-stopwatch').click();
    expect(document.getElementById('lap-stopwatch').disabled).toBe(false);

    jest.advanceTimersByTime(1500);
    document.getElementById('lap-stopwatch').click();

    jest.advanceTimersByTime(800);
    document.getElementById('lap-stopwatch').click();

    const rows = document.querySelectorAll('#stopwatch-laps tr');
    expect(rows).toHaveLength(2);
    expect(document.getElementById('stopwatch-laps').textContent).toContain('Nhanh nhất');
    expect(document.getElementById('stopwatch-laps').textContent).toContain('Chậm nhất');
    expect(document.getElementById('export-laps-btn').disabled).toBe(false);

    document.getElementById('pause-stopwatch').click();
    expect(document.getElementById('stopwatch-display').textContent).toBe('00:00:02.300');

    document.getElementById('reset-stopwatch').click();
    expect(document.getElementById('stopwatch-display').textContent).toBe('00:00:00.000');
    expect(document.querySelectorAll('#stopwatch-laps tr')).toHaveLength(0);
  });

  it('runs Countdown Timer with HH:MM:SS, presets, completion banner, and Web Audio ringtone', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 24, 10, 0, 0, 0));

    const oscStart = jest.fn();
    window.AudioContext = jest.fn(() => ({
      state: 'running',
      currentTime: 0,
      destination: {},
      createGain: () => ({
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn()
      }),
      createOscillator: () => ({
        type: 'square',
        frequency: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: oscStart,
        stop: jest.fn()
      })
    }));
    window.showAlert = jest.fn();

    document.body.innerHTML = `
      <div data-time-tool="timer">
        <div id="timer-ringing-banner" hidden>
          <strong id="timer-ringing-label"></strong>
          <button id="timer-stop-ring-btn"></button>
        </div>
        <div id="timer-display">00:05:00</div>
        <div id="timer-progress-bar"></div>
        <input id="timer-hours" type="number" value="0">
        <input id="timer-minutes" type="number" value="0">
        <input id="timer-seconds" type="number" value="3">
        <input id="timer-label-input" value="Pomodoro Done">
        <select id="timer-sound-select"><option value="digital" selected>Digital</option></select>
        <div id="timer-presets">
          <button data-hours="0" data-minutes="25" data-seconds="0">25m</button>
        </div>
        <button id="start-timer"></button>
        <button id="pause-timer" disabled></button>
        <button id="reset-timer"></button>
      </div>
    `;
    loadClockScript();

    expect(document.getElementById('timer-display').textContent).toBe('00:00:03');
    document.getElementById('start-timer').click();
    jest.advanceTimersByTime(3200);

    expect(document.getElementById('timer-display').textContent).toBe('00:00:00');
    expect(document.getElementById('timer-ringing-banner').hidden).toBe(false);
    expect(document.getElementById('timer-ringing-label').textContent).toBe('Pomodoro Done');
    expect(oscStart).toHaveBeenCalled();

    document.getElementById('timer-stop-ring-btn').click();
    expect(document.getElementById('timer-ringing-banner').hidden).toBe(true);
  });

  it('adds, persists, triggers, and snoozes alarms in Alarm Clock mode', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 24, 6, 59, 58, 0));

    const oscStart = jest.fn();
    window.AudioContext = jest.fn(() => ({
      state: 'running',
      currentTime: 0,
      destination: {},
      createGain: () => ({
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn()
      }),
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: oscStart,
        stop: jest.fn()
      })
    }));
    window.showAlert = jest.fn();

    document.body.innerHTML = `
      <div id="alarm-panel" data-time-tool="alarm">
        <div id="digital-clock"></div>
        <div id="current-date"></div>
        <span id="next-alarm-countdown"></span>
        <div id="alarm-ringing-panel" hidden>
          <span id="alarm-ringing-time"></span>
          <span id="alarm-ringing-label"></span>
          <button id="alarm-snooze-btn"></button>
          <button id="alarm-stop-btn"></button>
        </div>
        <input id="alarm-time-input" type="time" value="07:00">
        <input id="alarm-label-input" value="Wake up">
        <select id="alarm-sound-select"><option value="gentle" selected>Gentle</option></select>
        <input id="alarm-repeat-daily" type="checkbox">
        <button id="add-alarm-btn"></button>
        <div id="alarms-list"></div>
      </div>
    `;
    loadClockScript();

    document.getElementById('add-alarm-btn').click();
    expect(document.querySelectorAll('.alarm-item')).toHaveLength(1);
    expect(document.getElementById('next-alarm-countdown').textContent).toContain('07:00');

    // Advance 2 seconds -> hits 07:00:00 -> alarm rings!
    jest.advanceTimersByTime(2500);
    expect(document.getElementById('alarm-ringing-panel').hidden).toBe(false);
    expect(document.getElementById('alarm-ringing-time').textContent).toBe('07:00');
    expect(document.getElementById('alarm-ringing-label').textContent).toBe('Wake up');
    expect(oscStart).toHaveBeenCalled();

    // Snooze adds a +5 minute alarm (07:05) and hides ringing banner
    document.getElementById('alarm-snooze-btn').click();
    expect(document.getElementById('alarm-ringing-panel').hidden).toBe(true);
    expect(document.getElementById('alarms-list').textContent).toContain('07:05');
  });
});
