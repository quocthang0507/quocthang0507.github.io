// Unified Clock, Calendar, Stopwatch, Countdown Timer & Alarm Clock engine
// Shared directly across Home (/), Stopwatch (/stopwatch/), Countdown Timer (/countdown-timer/), and Alarm Clock (/alarm-clock/).

(function () {
    const padZero = (num) => String(Math.max(0, Math.floor(num))).padStart(2, '0');
    const padThree = (num) => String(Math.max(0, Math.floor(num))).padStart(3, '0');

    const tr = (key, fallback) => {
        if (typeof window.t === 'function') {
            const val = window.t(key, fallback);
            if (val && val !== key) return val;
        }
        return fallback !== undefined ? fallback : key;
    };

    const esc = (s) => {
        if (typeof window.escapeHtml === 'function') return window.escapeHtml(s);
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    // ═══════════════════════════════════════════
    // Shared Web Audio Ringtone Synthesizer (Offline-ready, zero external audio files)
    // ═══════════════════════════════════════════
    let audioCtx = null;
    let ringLoopTimer = null;
    let activeOscillators = [];

    function ensureAudioContext() {
        try {
            if (!audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return null;
                audioCtx = new AudioCtx();
            }
            if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
                audioCtx.resume().catch(() => {});
            }
            return audioCtx;
        } catch (_) {
            return null;
        }
    }

    function stopAudioNodes() {
        activeOscillators.forEach(node => {
            try {
                if (typeof node.stop === 'function') node.stop();
                if (typeof node.disconnect === 'function') node.disconnect();
            } catch (_) {}
        });
        activeOscillators = [];
    }

    function scheduleTone(ctx, freq, startOffset, duration, type, peakGain) {
        if (!ctx || typeof ctx.createOscillator !== 'function') return;
        const now = ctx.currentTime || 0;
        const t0 = now + startOffset;
        const safePeak = Math.max(0.001, peakGain);
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        env.gain.setValueAtTime(0.0001, t0);
        env.gain.exponentialRampToValueAtTime(safePeak, t0 + 0.012);
        env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(env);
        env.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
        activeOscillators.push(osc, env);
    }

    function playRingtoneOnce(soundType = 'digital', volume = 0.75) {
        const ctx = ensureAudioContext();
        if (!ctx || volume <= 0) return;
        const vol = Math.min(1, Math.max(0.05, volume));

        if (soundType === 'classic') {
            // Classic twin-bell metallic shimmer
            for (let i = 0; i < 8; i++) {
                scheduleTone(ctx, i % 2 === 0 ? 1180 : 1480, i * 0.09, 0.08, 'triangle', 0.3 * vol);
            }
            return;
        }

        if (soundType === 'gentle') {
            // Warm ascending morning melody C5 -> E5 -> G5 -> C6
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((f, idx) => {
                scheduleTone(ctx, f, idx * 0.18, 0.42, 'sine', 0.24 * vol);
                scheduleTone(ctx, f * 2, idx * 0.18, 0.22, 'sine', 0.07 * vol);
            });
            return;
        }

        if (soundType === 'bell') {
            // Bright chime triad
            [1046.5, 1318.51, 1567.98].forEach((f, idx) => {
                scheduleTone(ctx, f, idx * 0.14, 0.65, 'sine', 0.26 * vol);
            });
            return;
        }

        // Default 'digital': rhythmic alarm beeps (beep-beep-beep-beep)
        [0, 0.16, 0.32, 0.48].forEach(offset => {
            scheduleTone(ctx, 880, offset, 0.11, 'square', 0.18 * vol);
        });
    }

    function startRingtoneLoop(soundType = 'digital', volume = 0.75) {
        stopRingtoneLoop();
        playRingtoneOnce(soundType, volume);
        ringLoopTimer = setInterval(() => {
            playRingtoneOnce(soundType, volume);
        }, 1500);
    }

    function stopRingtoneLoop() {
        if (ringLoopTimer) {
            clearInterval(ringLoopTimer);
            ringLoopTimer = null;
        }
        stopAudioNodes();
    }

    function formatStopwatchMs(elapsedMs) {
        const clamped = Math.max(0, Math.floor(elapsedMs));
        const hours = Math.floor(clamped / 3600000);
        const minutes = Math.floor((clamped % 3600000) / 60000);
        const seconds = Math.floor((clamped % 60000) / 1000);
        const milliseconds = clamped % 1000;
        return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}.${padThree(milliseconds)}`;
    }

    function formatCountdownSeconds(totalSeconds, forceHours = false) {
        const clamped = Math.max(0, Math.ceil(totalSeconds));
        const hours = Math.floor(clamped / 3600);
        const minutes = Math.floor((clamped % 3600) / 60);
        const seconds = clamped % 60;
        if (hours > 0 || forceHours) {
            return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
        }
        return `${padZero(minutes)}:${padZero(seconds)}`;
    }

    function computeNextAlarmMs(timeStr, now = new Date()) {
        const [hh, mm] = String(timeStr || '07:00').split(':').map(Number);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
        if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 1);
        }
        return target.getTime() - now.getTime();
    }

    // ═══════════════════════════════════════════
    // 1. Digital Clock (Home + Alarm Clock)
    // ═══════════════════════════════════════════
    function initDigitalClock() {
        const clockEl = document.getElementById('digital-clock');
        const dateEl = document.getElementById('current-date');
        if (!clockEl) return;

        let is24HourFormat = true;
        let showSeconds = true;

        function updateClock() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            let timeString;
            if (is24HourFormat) {
                timeString = `${padZero(hours)}:${padZero(minutes)}`;
                if (showSeconds) timeString += `:${padZero(seconds)}`;
            } else {
                const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                const ampm = hours >= 12 ? 'PM' : 'AM';
                timeString = `${padZero(displayHours)}:${padZero(minutes)}`;
                if (showSeconds) timeString += `:${padZero(seconds)}`;
                timeString += ` ${ampm}`;
            }

            clockEl.textContent = timeString;

            if (dateEl) {
                const lang = (window.translationSystem && window.translationSystem.getCurrentLanguage()) || 'vi';
                const localeMap = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN', ko: 'ko-KR', ja: 'ja-JP' };
                dateEl.textContent = now.toLocaleDateString(localeMap[lang] || 'vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        }

        const toggleFormatBtn = document.getElementById('toggle-format');
        if (toggleFormatBtn) {
            toggleFormatBtn.addEventListener('click', function () {
                is24HourFormat = !is24HourFormat;
                updateClock();
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'clock_format_change', {
                        event_category: 'clock_tools',
                        event_label: is24HourFormat ? '24_hour' : '12_hour'
                    });
                }
            });
        }

        const toggleSecondsBtn = document.getElementById('toggle-seconds');
        if (toggleSecondsBtn) {
            toggleSecondsBtn.addEventListener('click', function () {
                showSeconds = !showSeconds;
                updateClock();
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'clock_seconds_toggle', {
                        event_category: 'clock_tools',
                        event_label: showSeconds ? 'show_seconds' : 'hide_seconds'
                    });
                }
            });
        }

        updateClock();
        setInterval(updateClock, 1000);
        window.addEventListener('languageChanged', updateClock);
    }

    // ═══════════════════════════════════════════
    // 2. Home Calendar & System Info
    // ═══════════════════════════════════════════
    function initHomeCalendarAndSystemInfo() {
        const displayEl = document.getElementById('calendar-display');
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();

        function computeDayOfYear(date) {
            if (window.CalendarCore) return window.CalendarCore.computeDayOfYear(date);
            const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
            const utcStart = Date.UTC(date.getFullYear(), 0, 0);
            return Math.round((utcDate - utcStart) / 86400000);
        }

        function computeISOWeek(date) {
            if (window.CalendarCore) return window.CalendarCore.computeISOWeek(date);
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }

        function showDateDetails(day, month, year) {
            if (window.CalendarCore && typeof window.CalendarCore.showDateDetails === 'function') {
                window.CalendarCore.showDateDetails(day, month, year);
            }
        }

        function updateCalendar() {
            if (!displayEl) return;
            const titleEl = document.getElementById('calendar-title');
            const monthName = window.CalendarCore
                ? window.CalendarCore.getMonthName(currentMonth + 1)
                : tr(`month.${currentMonth + 1}`, `Tháng ${currentMonth + 1}`);
            if (titleEl) titleEl.textContent = `${monthName} ${currentYear}`;

            if (window.CalendarCore) {
                displayEl.innerHTML = window.CalendarCore.renderMonthTableHTML(currentYear, currentMonth + 1, {
                    weekStartsOn: 0,
                    compact: false,
                    showGoodBad: true
                });
                window.CalendarCore.bindDayClickHandlers(displayEl, showDateDetails);
            }
        }

        if (displayEl) {
            const prevBtn = document.getElementById('prev-month');
            const nextBtn = document.getElementById('next-month');
            const todayBtn = document.getElementById('today-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentMonth--;
                    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
                    updateCalendar();
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentMonth++;
                    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
                    updateCalendar();
                });
            }
            if (todayBtn) {
                todayBtn.addEventListener('click', () => {
                    const today = new Date();
                    currentMonth = today.getMonth();
                    currentYear = today.getFullYear();
                    updateCalendar();
                });
            }

            window.addEventListener('languageChanged', updateCalendar);
            window.addEventListener('vietnamHolidaysLoaded', updateCalendar);
            window.updateCalendar = updateCalendar;
            updateCalendar();
        }

        const tzEl = document.getElementById('timezone');
        if (tzEl) {
            const now = new Date();
            tzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const doyEl = document.getElementById('day-of-year');
            const woyEl = document.getElementById('week-of-year');
            if (doyEl) doyEl.textContent = computeDayOfYear(now);
            if (woyEl) woyEl.textContent = computeISOWeek(now);
        }
    }

    // ═══════════════════════════════════════════
    // 3. Shared Stopwatch (Home + /stopwatch/)
    // ═══════════════════════════════════════════
    function initStopwatch() {
        const displayEl = document.getElementById('stopwatch-display');
        const startBtn = document.getElementById('start-stopwatch');
        const pauseBtn = document.getElementById('pause-stopwatch');
        const resetBtn = document.getElementById('reset-stopwatch');
        if (!displayEl || !startBtn) return;

        const lapBtn = document.getElementById('lap-stopwatch');
        const lapsBody = document.getElementById('stopwatch-laps');
        const lapsEmpty = document.getElementById('stopwatch-laps-empty');
        const exportLapsBtn = document.getElementById('export-laps-btn');
        const fullscreenBtn = document.getElementById('fullscreen-stopwatch-btn');

        let startTime = 0;
        let elapsed = 0;
        let intervalId = null;
        let running = false;
        let laps = [];

        function getCurrentElapsed() {
            return elapsed + (running ? Date.now() - startTime : 0);
        }

        function renderDisplay() {
            displayEl.textContent = formatStopwatchMs(getCurrentElapsed());
        }

        function renderLaps() {
            if (!lapsBody) return;
            if (laps.length === 0) {
                lapsBody.innerHTML = '';
                if (lapsEmpty) lapsEmpty.style.display = 'block';
                if (exportLapsBtn) exportLapsBtn.disabled = true;
                return;
            }
            if (lapsEmpty) lapsEmpty.style.display = 'none';
            if (exportLapsBtn) exportLapsBtn.disabled = false;

            const splits = laps.map(l => l.split);
            const fastest = laps.length > 1 ? Math.min(...splits) : -1;
            const slowest = laps.length > 1 ? Math.max(...splits) : -1;

            lapsBody.innerHTML = laps.slice().reverse().map(lap => {
                let badge = '';
                if (lap.split === fastest) {
                    badge = ` <span class="badge bg-success-subtle text-success-emphasis border">${esc(tr('stopwatch.fastest', 'Nhanh nhất'))}</span>`;
                } else if (lap.split === slowest) {
                    badge = ` <span class="badge bg-danger-subtle text-danger-emphasis border">${esc(tr('stopwatch.slowest', 'Chậm nhất'))}</span>`;
                }
                return `<tr>
                    <td class="fw-bold">#${lap.index}${badge}</td>
                    <td class="font-monospace">+${formatStopwatchMs(lap.split)}</td>
                    <td class="font-monospace fw-semibold">${formatStopwatchMs(lap.total)}</td>
                </tr>`;
            }).join('');
        }

        function start() {
            if (running) return;
            startTime = Date.now();
            running = true;
            intervalId = setInterval(renderDisplay, 10);
            startBtn.disabled = true;
            if (pauseBtn) pauseBtn.disabled = false;
            if (lapBtn) lapBtn.disabled = false;
            displayEl.classList.add('running');
            if (typeof gtag !== 'undefined') {
                gtag('event', 'stopwatch_start', { event_category: 'clock_tools', event_label: 'stopwatch_interaction' });
            }
        }

        function pause() {
            if (!running) return;
            elapsed += Date.now() - startTime;
            running = false;
            clearInterval(intervalId);
            intervalId = null;
            startBtn.disabled = false;
            if (pauseBtn) pauseBtn.disabled = true;
            if (lapBtn) lapBtn.disabled = true;
            displayEl.classList.remove('running');
            renderDisplay();
            if (typeof gtag !== 'undefined') {
                gtag('event', 'stopwatch_pause', {
                    event_category: 'clock_tools',
                    event_label: 'stopwatch_interaction',
                    elapsed_time: Math.round(elapsed / 1000)
                });
            }
        }

        function reset() {
            const previousElapsed = getCurrentElapsed();
            elapsed = 0;
            running = false;
            clearInterval(intervalId);
            intervalId = null;
            laps = [];
            startBtn.disabled = false;
            if (pauseBtn) pauseBtn.disabled = true;
            if (lapBtn) lapBtn.disabled = true;
            displayEl.classList.remove('running');
            renderDisplay();
            renderLaps();
            if (typeof gtag !== 'undefined') {
                gtag('event', 'stopwatch_reset', {
                    event_category: 'clock_tools',
                    event_label: 'stopwatch_interaction',
                    final_time: Math.round(previousElapsed / 1000)
                });
            }
        }

        function recordLap() {
            if (!running) return;
            const total = getCurrentElapsed();
            const prevTotal = laps.length > 0 ? laps[laps.length - 1].total : 0;
            laps.push({ index: laps.length + 1, split: total - prevTotal, total });
            renderLaps();
        }

        startBtn.addEventListener('click', start);
        if (pauseBtn) pauseBtn.addEventListener('click', pause);
        if (resetBtn) resetBtn.addEventListener('click', reset);
        if (lapBtn) lapBtn.addEventListener('click', recordLap);

        if (exportLapsBtn) {
            exportLapsBtn.addEventListener('click', () => {
                if (laps.length === 0) return;
                const csv = ['Lap,Split,Total']
                    .concat(laps.map(l => `${l.index},${formatStopwatchMs(l.split)},${formatStopwatchMs(l.total)}`))
                    .join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stopwatch-laps-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            });
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const card = displayEl.closest('.card') || document.documentElement;
                if (!document.fullscreenElement && card.requestFullscreen) {
                    card.requestFullscreen().catch(() => {});
                } else if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        // Dedicated stopwatch page keyboard shortcuts (Space: start/pause, L: lap, R: reset)
        if (document.querySelector('[data-time-tool="stopwatch"]')) {
            document.addEventListener('keydown', e => {
                const tag = (e.target && e.target.tagName) || '';
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                if (e.code === 'Space') {
                    e.preventDefault();
                    running ? pause() : start();
                } else if (e.key === 'l' || e.key === 'L') {
                    if (running) recordLap();
                } else if (e.key === 'r' || e.key === 'R') {
                    if (!running) reset();
                }
            });
        }

        renderDisplay();
        renderLaps();
    }

    // ═══════════════════════════════════════════
    // 4. Shared Countdown Timer (Home + /countdown-timer/)
    // ═══════════════════════════════════════════
    function initCountdownTimer() {
        const displayEl = document.getElementById('timer-display');
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const resetBtn = document.getElementById('reset-timer');
        const hoursInput = document.getElementById('timer-hours');
        const minutesInput = document.getElementById('timer-minutes');
        const secondsInput = document.getElementById('timer-seconds');
        if (!displayEl || !startBtn || !minutesInput || !secondsInput) return;

        const progressBar = document.getElementById('timer-progress-bar');
        const soundSelect = document.getElementById('timer-sound-select');
        const testSoundBtn = document.getElementById('timer-test-sound-btn');
        const ringingBanner = document.getElementById('timer-ringing-banner');
        const stopRingBtn = document.getElementById('timer-stop-ring-btn');
        const labelInput = document.getElementById('timer-label-input');
        const ringingLabelEl = document.getElementById('timer-ringing-label');
        const hasHoursField = Boolean(hoursInput);

        let totalDurationSec = 0;
        let remainingSec = 0;
        let endTimestamp = 0;
        let intervalId = null;
        let running = false;

        function readInputSeconds() {
            const h = hoursInput ? Math.max(0, parseInt(hoursInput.value, 10) || 0) : 0;
            const m = Math.max(0, parseInt(minutesInput.value, 10) || 0);
            const s = Math.max(0, parseInt(secondsInput.value, 10) || 0);
            return h * 3600 + m * 60 + s;
        }

        function render(sec) {
            const clamped = Math.max(0, sec);
            displayEl.textContent = formatCountdownSeconds(clamped, hasHoursField || totalDurationSec >= 3600);
            if (clamped > 0 && clamped <= 10) {
                displayEl.classList.add('warning-low');
            } else {
                displayEl.classList.remove('warning-low');
            }
            if (progressBar) {
                const pct = totalDurationSec > 0 ? Math.max(0, Math.min(100, (clamped / totalDurationSec) * 100)) : 0;
                progressBar.style.width = `${pct}%`;
                progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
            }
        }

        function dismissRinging() {
            stopRingtoneLoop();
            if (ringingBanner) ringingBanner.hidden = true;
        }

        function finishTimer() {
            clearInterval(intervalId);
            intervalId = null;
            running = false;
            remainingSec = 0;
            render(0);
            displayEl.classList.remove('running', 'warning-low');
            startBtn.disabled = false;
            if (pauseBtn) pauseBtn.disabled = true;

            const soundType = (soundSelect && soundSelect.value) || 'digital';
            const label = (labelInput && labelInput.value.trim()) || tr('timer.finished_default', 'Hết giờ đếm ngược!');

            if (soundType !== 'none') {
                startRingtoneLoop(soundType, 0.8);
                // Auto-stop loop after 30s if user is away on home page without banner
                if (!ringingBanner) {
                    setTimeout(stopRingtoneLoop, 6000);
                }
            }

            if (ringingBanner) {
                if (ringingLabelEl) ringingLabelEl.textContent = label;
                ringingBanner.hidden = false;
            }
            if (typeof window.showAlert === 'function') {
                window.showAlert(label, 'warning');
            }
        }

        function tick() {
            const left = Math.ceil((endTimestamp - Date.now()) / 1000);
            if (left > 0) {
                remainingSec = left;
                render(remainingSec);
            } else {
                finishTimer();
            }
        }

        startBtn.addEventListener('click', () => {
            if (running) return;
            dismissRinging();
            ensureAudioContext();

            if (remainingSec <= 0) {
                totalDurationSec = readInputSeconds();
                remainingSec = totalDurationSec;
            } else if (totalDurationSec <= 0) {
                totalDurationSec = remainingSec;
            }

            if (remainingSec <= 0) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert(tr('timer.invalid_time', 'Vui lòng nhập thời gian hợp lệ!'), 'danger');
                }
                return;
            }

            running = true;
            endTimestamp = Date.now() + remainingSec * 1000;
            render(remainingSec);
            intervalId = setInterval(tick, 250);
            startBtn.disabled = true;
            if (pauseBtn) pauseBtn.disabled = false;
            displayEl.classList.add('running');

            if (typeof gtag !== 'undefined') {
                gtag('event', 'timer_start', {
                    event_category: 'clock_tools',
                    event_label: 'timer_interaction',
                    timer_duration: totalDurationSec
                });
            }
        });

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (!running) return;
                remainingSec = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
                running = false;
                clearInterval(intervalId);
                intervalId = null;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                displayEl.classList.remove('running');
                render(remainingSec);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                dismissRinging();
                running = false;
                clearInterval(intervalId);
                intervalId = null;
                totalDurationSec = readInputSeconds();
                remainingSec = totalDurationSec;
                displayEl.classList.remove('running', 'warning-low');
                render(remainingSec);
                startBtn.disabled = false;
                if (pauseBtn) pauseBtn.disabled = true;
            });
        }

        // Sync display when user edits inputs while paused/stopped
        [hoursInput, minutesInput, secondsInput].filter(Boolean).forEach(inp => {
            inp.addEventListener('change', () => {
                if (running) return;
                totalDurationSec = readInputSeconds();
                remainingSec = totalDurationSec;
                render(remainingSec);
            });
        });

        document.querySelectorAll('#timer-presets button').forEach(btn => {
            btn.addEventListener('click', function () {
                if (running) return;
                dismissRinging();
                const h = parseInt(this.dataset.hours, 10) || 0;
                const m = parseInt(this.dataset.minutes, 10) || 0;
                const s = parseInt(this.dataset.seconds, 10) || 0;
                if (hoursInput) hoursInput.value = h;
                minutesInput.value = hoursInput ? m : (h * 60 + m);
                secondsInput.value = s;
                totalDurationSec = h * 3600 + m * 60 + s;
                remainingSec = totalDurationSec;
                render(remainingSec);
            });
        });

        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', () => {
                const soundType = (soundSelect && soundSelect.value) || 'digital';
                if (soundType !== 'none') {
                    playRingtoneOnce(soundType, 0.8);
                }
            });
        }

        if (stopRingBtn) {
            stopRingBtn.addEventListener('click', dismissRinging);
        }

        totalDurationSec = readInputSeconds();
        remainingSec = totalDurationSec;
        render(remainingSec);
    }

    // ═══════════════════════════════════════════
    // 5. Alarm Clock (/alarm-clock/)
    // ═══════════════════════════════════════════
    function initAlarmClock() {
        const panel = document.getElementById('alarm-panel');
        if (!panel) return;

        const STORAGE_KEY = 'utilityHubAlarms';
        const timeInput = document.getElementById('alarm-time-input');
        const labelInput = document.getElementById('alarm-label-input');
        const soundSelect = document.getElementById('alarm-sound-select');
        const repeatCheckbox = document.getElementById('alarm-repeat-daily');
        const addBtn = document.getElementById('add-alarm-btn');
        const testSoundBtn = document.getElementById('alarm-test-sound-btn');
        const listEl = document.getElementById('alarms-list');
        const nextCountdownEl = document.getElementById('next-alarm-countdown');
        const ringingPanel = document.getElementById('alarm-ringing-panel');
        const ringingTimeEl = document.getElementById('alarm-ringing-time');
        const ringingLabelEl = document.getElementById('alarm-ringing-label');
        const snoozeBtn = document.getElementById('alarm-snooze-btn');
        const stopBtn = document.getElementById('alarm-stop-btn');

        let alarms = [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) alarms = parsed;
        } catch (_) {
            alarms = [];
        }

        let activeRingingAlarm = null;

        function saveAlarms() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
            } catch (_) {}
        }

        function getSoundLabel(sound) {
            const map = {
                digital: tr('alarm.sound_digital', 'Chuông kỹ thuật số'),
                classic: tr('alarm.sound_classic', 'Chuông reo cổ điển'),
                gentle: tr('alarm.sound_gentle', 'Giai điệu nhẹ nhàng'),
                bell: tr('alarm.sound_bell', 'Chuông thanh thoát')
            };
            return map[sound] || sound;
        }

        function renderAlarms() {
            if (!listEl) return;
            if (alarms.length === 0) {
                listEl.innerHTML = `<p class="text-muted text-center py-3 mb-0" data-i18n="alarm.empty">${esc(tr('alarm.empty', 'Chưa có báo thức nào. Hãy chọn giờ và nhấn Thêm báo thức.'))}</p>`;
                updateNextCountdown();
                return;
            }

            const sorted = alarms.slice().sort((a, b) => a.time.localeCompare(b.time));
            listEl.innerHTML = sorted.map(alarm => `
                <div class="alarm-item d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 border rounded mb-2${alarm.enabled ? '' : ' opacity-50'}" data-alarm-id="${esc(alarm.id)}">
                    <div>
                        <div class="h4 mb-0 font-monospace fw-bold">${esc(alarm.time)}</div>
                        <div class="small fw-medium">${esc(alarm.label || tr('alarm.default_label', 'Báo thức'))}</div>
                        <div class="small text-muted">
                            <i class="fas fa-music me-1"></i>${esc(getSoundLabel(alarm.sound))}
                            ${alarm.repeat ? ` · <span class="badge bg-info-subtle text-info-emphasis border">${esc(tr('alarm.daily', 'Hằng ngày'))}</span>` : ` · <span class="badge bg-secondary-subtle text-secondary-emphasis border">${esc(tr('alarm.once', 'Một lần'))}</span>`}
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input alarm-toggle" type="checkbox" role="switch" data-id="${esc(alarm.id)}" ${alarm.enabled ? 'checked' : ''} aria-label="Toggle alarm ${esc(alarm.time)}">
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger alarm-delete-btn" data-id="${esc(alarm.id)}" aria-label="Delete alarm ${esc(alarm.time)}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            listEl.querySelectorAll('.alarm-toggle').forEach(sw => {
                sw.addEventListener('change', () => {
                    const target = alarms.find(a => a.id === sw.dataset.id);
                    if (target) {
                        target.enabled = sw.checked;
                        saveAlarms();
                        renderAlarms();
                    }
                });
            });

            listEl.querySelectorAll('.alarm-delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    alarms = alarms.filter(a => a.id !== btn.dataset.id);
                    saveAlarms();
                    renderAlarms();
                });
            });

            updateNextCountdown();
        }

        function updateNextCountdown() {
            if (!nextCountdownEl) return;
            const enabled = alarms.filter(a => a.enabled);
            if (enabled.length === 0) {
                nextCountdownEl.textContent = tr('alarm.no_active', 'Chưa có báo thức đang bật');
                return;
            }
            const now = new Date();
            let nearest = null;
            enabled.forEach(a => {
                const diff = computeNextAlarmMs(a.time, now);
                if (diff !== null && (!nearest || diff < nearest.diff)) {
                    nearest = { alarm: a, diff };
                }
            });
            if (!nearest) return;
            const totalSec = Math.ceil(nearest.diff / 1000);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            nextCountdownEl.textContent = `${tr('alarm.next_in', 'Chuông kế tiếp lúc')} ${nearest.alarm.time} (${padZero(h)}:${padZero(m)}:${padZero(s)})`;
        }

        function triggerAlarm(alarm) {
            activeRingingAlarm = alarm;
            if (!alarm.repeat) {
                alarm.enabled = false;
                saveAlarms();
                renderAlarms();
            }
            startRingtoneLoop(alarm.sound || 'digital', 0.85);

            if (ringingPanel) {
                if (ringingTimeEl) ringingTimeEl.textContent = alarm.time;
                if (ringingLabelEl) ringingLabelEl.textContent = alarm.label || tr('alarm.default_label', 'Báo thức');
                ringingPanel.hidden = false;
            }
            if (typeof window.showAlert === 'function') {
                window.showAlert(`⏰ ${alarm.time} — ${alarm.label || tr('alarm.default_label', 'Báo thức')}`, 'warning');
            }
        }

        function dismissAlarm() {
            stopRingtoneLoop();
            activeRingingAlarm = null;
            if (ringingPanel) ringingPanel.hidden = true;
        }

        function snoozeAlarm() {
            const prev = activeRingingAlarm;
            dismissAlarm();
            if (!prev) return;
            const snoozeDate = new Date(Date.now() + 5 * 60 * 1000);
            const snoozeTime = `${padZero(snoozeDate.getHours())}:${padZero(snoozeDate.getMinutes())}`;
            alarms.push({
                id: `snooze-${Date.now()}`,
                time: snoozeTime,
                label: `${prev.label || tr('alarm.default_label', 'Báo thức')} (${tr('alarm.snoozed', 'Báo lại +5p')})`,
                sound: prev.sound || 'digital',
                repeat: false,
                enabled: true,
                lastTriggeredKey: ''
            });
            saveAlarms();
            renderAlarms();
        }

        function checkAlarms() {
            const now = new Date();
            const hhmm = `${padZero(now.getHours())}:${padZero(now.getMinutes())}`;
            const dateKey = `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())} ${hhmm}`;

            alarms.forEach(alarm => {
                if (!alarm.enabled) return;
                if (alarm.time === hhmm && alarm.lastTriggeredKey !== dateKey && now.getSeconds() <= 2) {
                    alarm.lastTriggeredKey = dateKey;
                    saveAlarms();
                    triggerAlarm(alarm);
                }
            });
            updateNextCountdown();
        }

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                ensureAudioContext();
                const time = (timeInput && timeInput.value) || '';
                if (!/^\d{2}:\d{2}$/.test(time)) {
                    if (typeof window.showAlert === 'function') {
                        window.showAlert(tr('alarm.invalid_time', 'Vui lòng chọn giờ báo thức hợp lệ!'), 'danger');
                    }
                    return;
                }
                const newAlarm = {
                    id: `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    time,
                    label: (labelInput && labelInput.value.trim()) || tr('alarm.default_label', 'Báo thức'),
                    sound: (soundSelect && soundSelect.value) || 'digital',
                    repeat: Boolean(repeatCheckbox && repeatCheckbox.checked),
                    enabled: true,
                    lastTriggeredKey: ''
                };
                alarms.push(newAlarm);
                saveAlarms();
                renderAlarms();
                if (labelInput) labelInput.value = '';
                if (typeof window.showAlert === 'function') {
                    window.showAlert(`${tr('alarm.added', 'Đã đặt báo thức lúc')} ${time}`, 'success');
                }
            });
        }

        document.querySelectorAll('[data-alarm-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (timeInput) timeInput.value = btn.dataset.alarmPreset;
            });
        });

        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', () => {
                playRingtoneOnce((soundSelect && soundSelect.value) || 'digital', 0.8);
            });
        }

        if (stopBtn) stopBtn.addEventListener('click', dismissAlarm);
        if (snoozeBtn) snoozeBtn.addEventListener('click', snoozeAlarm);

        renderAlarms();
        setInterval(checkAlarms, 1000);
        window.addEventListener('languageChanged', renderAlarms);
    }

    // Export shared helpers for tests & extensions
    window.TimeTools = {
        formatStopwatchMs,
        formatCountdownSeconds,
        computeNextAlarmMs,
        playRingtoneOnce,
        startRingtoneLoop,
        stopRingtoneLoop
    };

    document.addEventListener('DOMContentLoaded', function () {
        initDigitalClock();
        initHomeCalendarAndSystemInfo();
        initStopwatch();
        initCountdownTimer();
        initAlarmClock();
    });
})();
