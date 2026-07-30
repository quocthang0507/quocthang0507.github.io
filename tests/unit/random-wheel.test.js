describe('random wheel timing and suspense settings', () => {
  it('uses a two-phase 5 second spin and stops audio 0.5 second early', async () => {
    jest.useFakeTimers();
    localStorage.setItem('wheelSpinDuration', JSON.stringify(5000));
    localStorage.setItem('wheelSuspenseEffect', JSON.stringify(true));

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
});
