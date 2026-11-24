// Random Wheel functionality
document.addEventListener('DOMContentLoaded', function() {
    const SOUND_END_LEAD_MS = 500;
    const BASE_SOUND_WINDOW_MS = 2500;
    const ALLOWED_SPIN_DURATIONS = [2000, 3000, 5000, 7000, 10000, 15000, 20000, 30000];
    const ALLOWED_SPIN_SOUNDS = ['ticking', 'piano', 'classic', 'none'];
    const ALLOWED_WINNER_SOUNDS = ['applause', 'fanfare', 'chime', 'none'];
    const PIANO_TICK_FREQS = [
        523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51,
        1174.66, 1046.50, 880.00, 783.99, 659.25, 587.33
    ];

    const tr = (key, fallback) => (typeof window.t === 'function' ? window.t(key, fallback) : fallback);

    const rawNames = loadFromLocalStorage('wheelNames');
    let names = Array.isArray(rawNames) ? rawNames.filter(n => typeof n === 'string' && n.trim()) : [];
    const rawSpinHistory = loadFromLocalStorage('wheelSpinHistory');
    let spinHistory = Array.isArray(rawSpinHistory) ? rawSpinHistory : [];
    let isSpinning = false;
    let currentRotation = 0;
    let currentColorTheme = 'classic';
    let spinDurationMs = 3000;
    let suspenseEffectEnabled = false;
    let spinSoundMode = 'ticking';
    let winnerSoundMode = 'applause';
    let soundVolume = 0.75;
    try {
        currentColorTheme = localStorage.getItem('wheelColorTheme') || 'classic';
    } catch (e) {
        console.warn('localStorage is blocked or unavailable:', e);
    }
    try {
        const savedDuration = Number(JSON.parse(localStorage.getItem('wheelSpinDuration')));
        if (ALLOWED_SPIN_DURATIONS.includes(savedDuration)) {
            spinDurationMs = savedDuration;
        }
        suspenseEffectEnabled = JSON.parse(localStorage.getItem('wheelSuspenseEffect')) === true;
        const savedSpinSound = JSON.parse(localStorage.getItem('wheelSpinSound'));
        if (ALLOWED_SPIN_SOUNDS.includes(savedSpinSound)) {
            spinSoundMode = savedSpinSound;
        }
        const savedWinnerSound = JSON.parse(localStorage.getItem('wheelWinnerSound'));
        if (ALLOWED_WINNER_SOUNDS.includes(savedWinnerSound)) {
            winnerSoundMode = savedWinnerSound;
        }
        const rawSavedVolume = localStorage.getItem('wheelSoundVolume');
        if (rawSavedVolume !== null) {
            const savedVolume = Number(JSON.parse(rawSavedVolume));
            if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100) {
                soundVolume = savedVolume / 100;
            }
        }
    } catch (e) {
        console.warn('Spin settings could not be restored:', e);
    }
    
    const presets = {
        colors: ['Đỏ', 'Xanh lá', 'Xanh dương', 'Vàng', 'Tím', 'Cam', 'Hồng', 'Nâu'],
        animals: ['Chó', 'Mèo', 'Voi', 'Sư tử', 'Hổ', 'Gấu', 'Thỏ', 'Cáo'],
        fruits: ['Táo', 'Chuối', 'Cam', 'Nho', 'Dâu', 'Dứa', 'Xoài', 'Lê'],
        numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    };
    
    // Color theme presets
    const colorThemes = {
        classic: {
            name: 'Classic',
            colors: [
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
                '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
                '#f1c40f', '#e91e63', '#673ab7', '#00bcd4',
                '#4caf50', '#ff5722', '#795548', '#607d8b'
            ]
        },
        vibrant: {
            name: 'Vibrant',
            colors: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
                '#F8B739', '#52B788', '#F48FB1', '#4DB8FF',
                '#FFD93D', '#6BCF7F', '#A78BFA', '#FB8B24'
            ]
        },
        pastel: {
            name: 'Pastel',
            colors: [
                '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
                '#E0BBE4', '#FFDFD3', '#D4F1F4', '#FFE5B4',
                '#C7CEEA', '#FFC8DD', '#CCD5AE', '#E0AFA0',
                '#B4E7CE', '#F6BD60', '#E5B8F4', '#A8DADC'
            ]
        },
        neon: {
            name: 'Neon',
            colors: [
                '#FF10F0', '#39FF14', '#FFFF00', '#FF3F00',
                '#00F0FF', '#BC13FE', '#FF073A', '#7FFF00',
                '#FE4EDA', '#4D4DFF', '#FFB900', '#FE019A',
                '#39FF14', '#FF6EC7', '#08F7FE', '#DEFE47'
            ]
        },
        ocean: {
            name: 'Ocean',
            colors: [
                '#006994', '#1E88A8', '#3FA7D6', '#59C3F0',
                '#7AD8F5', '#89CFF0', '#4FA3CC', '#2E8BC0',
                '#0077B6', '#00B4D8', '#90E0EF', '#48CAE4',
                '#00A3C4', '#0096C7', '#0288D1', '#029ACA'
            ]
        },
        sunset: {
            name: 'Sunset',
            colors: [
                '#FF6B35', '#F7931E', '#FDC830', '#F37335',
                '#FFA07A', '#FF7F50', '#FF8C42', '#FF6F61',
                '#FF5E5B', '#D64545', '#FA8072', '#E9573F',
                '#FF6B6B', '#EE6352', '#FF9A76', '#FFA384'
            ]
        },
        forest: {
            name: 'Forest',
            colors: [
                '#2D5016', '#406343', '#4A7C59', '#56A36C',
                '#6BB77B', '#7EC488', '#90D399', '#A7DBA9',
                '#50723C', '#73A24E', '#8FBC66', '#A8D08D',
                '#C7E9C0', '#87B87F', '#6DA76A', '#4F9153'
            ]
        },
        candy: {
            name: 'Candy',
            colors: [
                '#FF1493', '#FF69B4', '#FFB6C1', '#FFC0CB',
                '#FF85C1', '#FF6B9D', '#FF1493', '#C71585',
                '#DA70D6', '#EE82EE', '#DDA0DD', '#D8BFD8',
                '#FF77FF', '#F754E1', '#FF00FF', '#FF69EB'
            ]
        },
        autumn: {
            name: 'Autumn',
            colors: [
                '#8B4513', '#A0522D', '#D2691E', '#CD853F',
                '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F',
                '#B8860B', '#DAA520', '#CD5C5C', '#A0522D',
                '#8B7355', '#C19A6B', '#B87333', '#966919'
            ]
        },
        monochrome: {
            name: 'Monochrome',
            colors: [
                '#1A1A1A', '#333333', '#4D4D4D', '#666666',
                '#808080', '#999999', '#B3B3B3', '#CCCCCC',
                '#2B2B2B', '#404040', '#595959', '#737373',
                '#8C8C8C', '#A6A6A6', '#BFBFBF', '#D9D9D9'
            ]
        },
        rainbow: {
            name: 'Rainbow',
            colors: [
                '#FF0000', '#FF7F00', '#FFFF00', '#00FF00',
                '#0000FF', '#4B0082', '#9400D3', '#FF1493',
                '#FF4500', '#FFD700', '#7FFF00', '#00FFFF',
                '#1E90FF', '#8A2BE2', '#FF69B4', '#DC143C'
            ]
        },
        earth: {
            name: 'Earth',
            colors: [
                '#8B7355', '#A0826D', '#C19A6B', '#D2B48C',
                '#8B4513', '#A0522D', '#B87333', '#CD853F',
                '#7B6043', '#93785B', '#AB8F76', '#C4A88F',
                '#6B5344', '#86705D', '#9D8777', '#B39D8F'
            ]
        }
    };
    
    // Audio context, noise buffer, and timers for Wheel-of-Names-style sounds
    let audioContext;
    let gainNode;
    let cachedNoiseBuffer = null;
    let activeAudioNodes = [];
    let spinSoundToken = 0;
    let soundStopTimer = null;
    let tickTrackerRafId = null;
    let pointerFlickTimer = null;
    let previewTimers = [];
    let pianoNoteIndex = 0;

    // Initialize or unlock Web Audio context (must be called inside a user gesture)
    function initAudio() {
        try {
            if (!audioContext) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return null;
                audioContext = new AudioCtx();
                gainNode = audioContext.createGain();
                if (gainNode.gain) {
                    gainNode.gain.value = soundVolume;
                }
                gainNode.connect(audioContext.destination);
            }
            if (gainNode && gainNode.gain) {
                gainNode.gain.value = soundVolume;
            }
            if (audioContext.state === 'suspended' && typeof audioContext.resume === 'function') {
                audioContext.resume().catch(() => {});
            }
            return audioContext;
        } catch (e) {
            console.log('Web Audio API not supported');
            return null;
        }
    }

    // Lazily create a 1-second mono white noise buffer for realistic ticks & applause
    function getNoiseBuffer() {
        if (cachedNoiseBuffer) return cachedNoiseBuffer;
        if (!audioContext || typeof audioContext.createBuffer !== 'function') return null;
        try {
            const sampleRate = audioContext.sampleRate || 44100;
            const buffer = audioContext.createBuffer(1, sampleRate, sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            cachedNoiseBuffer = buffer;
            return cachedNoiseBuffer;
        } catch (_) {
            return null;
        }
    }

    function flickPointer() {
        const pointer = document.querySelector('.wheel-pointer');
        if (!pointer) return;
        pointer.classList.add('is-ticking');
        if (pointerFlickTimer) clearTimeout(pointerFlickTimer);
        pointerFlickTimer = setTimeout(() => {
            pointer.classList.remove('is-ticking');
            pointerFlickTimer = null;
        }, 50);
    }

    // Play a single crisp peg tick (Wheel of Names style) or musical note
    function playTickSound(mode = spinSoundMode, timeOffset = 0) {
        if (soundVolume <= 0 || mode === 'none') return;
        const ctx = initAudio();
        if (!ctx || typeof ctx.createOscillator !== 'function') return;

        const now = (ctx.currentTime || 0) + timeOffset;
        const dest = gainNode || ctx.destination;

        if (mode === 'piano') {
            const freq = PIANO_TICK_FREQS[pianoNoteIndex % PIANO_TICK_FREQS.length];
            pianoNoteIndex++;

            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            env.gain.setValueAtTime(0.0001, now);
            env.gain.exponentialRampToValueAtTime(0.28, now + 0.004);
            env.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
            osc.connect(env);
            env.connect(dest);
            osc.start(now);
            osc.stop(now + 0.15);

            // Soft octave harmonic for bell-like sparkle
            const harm = ctx.createOscillator();
            const harmEnv = ctx.createGain();
            harm.type = 'sine';
            harm.frequency.setValueAtTime(freq * 2, now);
            harmEnv.gain.setValueAtTime(0.0001, now);
            harmEnv.gain.exponentialRampToValueAtTime(0.08, now + 0.003);
            harmEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
            harm.connect(harmEnv);
            harmEnv.connect(dest);
            harm.start(now);
            harm.stop(now + 0.1);
            return;
        }

        // Default 'ticking': crisp woody-plastic peg snap (body pitch drop + filtered click burst)
        const pitchJitter = 0.96 + Math.random() * 0.08;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(840 * pitchJitter, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.022);
        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(0.38, now + 0.002);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
        osc.connect(env);
        env.connect(dest);
        osc.start(now);
        osc.stop(now + 0.036);

        const noiseBuffer = getNoiseBuffer();
        if (noiseBuffer && typeof ctx.createBufferSource === 'function' && typeof ctx.createBiquadFilter === 'function') {
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2500 * pitchJitter, now);
            filter.Q.setValueAtTime(2.4, now);
            const nEnv = ctx.createGain();
            nEnv.gain.setValueAtTime(0.0001, now);
            nEnv.gain.exponentialRampToValueAtTime(0.28, now + 0.0015);
            nEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);
            noise.connect(filter);
            filter.connect(nEnv);
            nEnv.connect(dest);
            noise.start(now, Math.random() * 0.5, 0.02);
        }
    }

    function readElementRotationDegrees(el) {
        if (!el || typeof window.getComputedStyle !== 'function') return null;
        const transform = window.getComputedStyle(el).transform;
        if (!transform || transform === 'none') return null;
        const match = transform.match(/^matrix\(([^)]+)\)$/);
        if (match) {
            const parts = match[1].split(',').map(Number);
            if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
                return ((Math.atan2(parts[1], parts[0]) * 180 / Math.PI) + 360) % 360;
            }
        }
        return null;
    }

    // Track live wheel rotation via requestAnimationFrame and trigger ticks on every slice crossing
    function startSliceTickTracker(mode) {
        const wheelNames = document.getElementById('wheel-names');
        if (!wheelNames || typeof window.requestAnimationFrame !== 'function') return;

        const sliceCount = names.length > 1 ? names.length : 12;
        const sliceAngle = 360 / sliceCount;
        let lastSliceIndex = null;
        let lastTickTime = 0;

        const initialAngle = readElementRotationDegrees(wheelNames);
        if (initialAngle !== null) {
            const norm = ((360 - initialAngle) % 360 + 360) % 360;
            lastSliceIndex = Math.floor(norm / sliceAngle) % sliceCount;
        }

        const step = (timestamp) => {
            if (!isSpinning) {
                tickTrackerRafId = null;
                return;
            }
            const angle = readElementRotationDegrees(wheelNames);
            if (angle !== null) {
                const norm = ((360 - angle) % 360 + 360) % 360;
                const sliceIdx = Math.floor(norm / sliceAngle) % sliceCount;
                if (lastSliceIndex !== null && sliceIdx !== lastSliceIndex) {
                    if (timestamp - lastTickTime >= 28) {
                        playTickSound(mode);
                        flickPointer();
                        lastTickTime = timestamp;
                    }
                    lastSliceIndex = sliceIdx;
                } else if (lastSliceIndex === null) {
                    lastSliceIndex = sliceIdx;
                }
            }
            tickTrackerRafId = window.requestAnimationFrame(step);
        };

        tickTrackerRafId = window.requestAnimationFrame(step);
    }

    // Celebratory winner sound (Wheel of Names inspired: applause, fanfare, chime)
    function playWinnerSound(mode = winnerSoundMode) {
        if (soundVolume <= 0 || mode === 'none') return;
        const ctx = initAudio();
        if (!ctx || typeof ctx.createOscillator !== 'function') return;

        const now = ctx.currentTime || 0;
        const dest = gainNode || ctx.destination;

        const scheduleTone = (freq, startOffset, duration, type, peakGain, filterFreq) => {
            const safePeak = Math.max(0.001, peakGain);
            const t0 = now + startOffset;
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t0);
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.exponentialRampToValueAtTime(safePeak, t0 + 0.015);
            env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

            if (filterFreq && typeof ctx.createBiquadFilter === 'function') {
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.setValueAtTime(filterFreq, t0);
                osc.connect(lp);
                lp.connect(env);
            } else {
                osc.connect(env);
            }
            env.connect(dest);
            osc.start(t0);
            osc.stop(t0 + duration + 0.02);
        };

        if (mode === 'chime') {
            [1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, i) => {
                scheduleTone(freq, i * 0.09, 0.7, 'sine', 0.22);
                scheduleTone(freq * 2, i * 0.09, 0.35, 'sine', 0.06);
            });
            return;
        }

        if (mode === 'fanfare') {
            // Classic C5 -> E5 -> G5 -> C6 brass/chime victory fanfare
            scheduleTone(523.25, 0.00, 0.14, 'sawtooth', 0.16, 2400);
            scheduleTone(659.25, 0.11, 0.14, 'sawtooth', 0.16, 2400);
            scheduleTone(783.99, 0.22, 0.14, 'sawtooth', 0.18, 2600);
            // Final triumphant major chord
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                scheduleTone(freq, 0.34, 0.95, idx === 3 ? 'triangle' : 'sawtooth', idx === 3 ? 0.24 : 0.12, 2800);
            });
            return;
        }

        // Default 'applause': bright victory ding + realistic layered crowd applause
        scheduleTone(783.99, 0.02, 0.35, 'triangle', 0.22);
        scheduleTone(1046.50, 0.12, 0.65, 'triangle', 0.26);
        scheduleTone(2093.00, 0.12, 0.45, 'sine', 0.08);

        const noiseBuffer = getNoiseBuffer();
        if (noiseBuffer && typeof ctx.createBufferSource === 'function' && typeof ctx.createBiquadFilter === 'function') {
            const clapCount = 34;
            for (let i = 0; i < clapCount; i++) {
                const progress = i / clapCount;
                const offset = 0.06 + progress * 1.95 + Math.random() * 0.07;
                // Natural crowd envelope: quick swell then gradual fade (always > 0 for exponentialRamp)
                const swell = progress < 0.15
                    ? Math.max(0.25, progress / 0.15)
                    : Math.max(0.12, 1 - (progress - 0.15) / 0.92);
                const clapGain = Math.max(0.001, (0.14 + Math.random() * 0.14) * swell);
                const clapDuration = 0.028 + Math.random() * 0.026;
                const t0 = now + offset;

                const src = ctx.createBufferSource();
                src.buffer = noiseBuffer;
                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.setValueAtTime(950 + Math.random() * 1400, t0);
                bp.Q.setValueAtTime(1.4 + Math.random() * 1.3, t0);
                const env = ctx.createGain();
                env.gain.setValueAtTime(0.0001, t0);
                env.gain.exponentialRampToValueAtTime(clapGain, t0 + 0.004);
                env.gain.exponentialRampToValueAtTime(0.0001, t0 + clapDuration);

                src.connect(bp);
                bp.connect(env);
                env.connect(dest);
                src.start(t0, Math.random() * 0.6, clapDuration + 0.01);
            }
        }
    }

    function previewSelectedSounds() {
        previewTimers.forEach(clearTimeout);
        previewTimers = [];
        initAudio();
        pianoNoteIndex = 0;

        if (spinSoundMode === 'classic') {
            playSpinSound(1200);
            previewTimers.push(setTimeout(() => {
                stopSpinSound();
                playWinnerSound(winnerSoundMode);
            }, 900));
            return;
        }

        if (spinSoundMode === 'ticking' || spinSoundMode === 'piano') {
            [0, 95, 220, 380].forEach(delay => {
                previewTimers.push(setTimeout(() => {
                    playTickSound(spinSoundMode);
                    flickPointer();
                }, delay));
            });
            previewTimers.push(setTimeout(() => {
                playWinnerSound(winnerSoundMode);
            }, 560));
            return;
        }

        playWinnerSound(winnerSoundMode);
    }

    // Play spinning sound
    function playSpinSound(soundDurationMs) {
        if (!soundDurationMs || soundDurationMs <= 0 || soundVolume <= 0 || spinSoundMode === 'none') return;

        const token = ++spinSoundToken;
        if (soundStopTimer) {
            clearTimeout(soundStopTimer);
            soundStopTimer = null;
        }
        if (tickTrackerRafId && typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(tickTrackerRafId);
            tickTrackerRafId = null;
        }

        // Wheel of Names mode: real-time slice-synced peg ticks (or musical ticks)
        if (spinSoundMode === 'ticking' || spinSoundMode === 'piano') {
            pianoNoteIndex = 0;
            initAudio();
            // Fire an immediate crisp opening tick on spin launch
            playTickSound(spinSoundMode);
            flickPointer();
            startSliceTickTracker(spinSoundMode);
            return;
        }

        // Classic mode: HTML5 audio element with Web Audio fallback
        const audioElement = document.getElementById('wheel-spin-audio');
        const canPlayAudio = audioElement
            && !audioElement.error
            && audioElement.networkState !== 3
            && typeof audioElement.play === 'function'
            && (!audioElement.canPlayType
                || audioElement.canPlayType('audio/wav') !== ''
                || audioElement.canPlayType('audio/mpeg') !== '');

        if (canPlayAudio) {
            try {
                if (!audioElement.paused) {
                    audioElement.pause();
                }
                audioElement.currentTime = 0;
                audioElement.volume = soundVolume;
                // Keep playbackRate within [0.5, 4.0] because Chromium/Safari mute media below 0.5x.
                const rawRate = BASE_SOUND_WINDOW_MS / soundDurationMs;
                audioElement.playbackRate = Math.min(4, Math.max(0.5, rawRate));
                audioElement.preservesPitch = false;
                audioElement.webkitPreservesPitch = false;
                const playPromise = audioElement.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch((err) => {
                        if (token !== spinSoundToken || !isSpinning) return;
                        if (err && err.name === 'AbortError') return;
                        generateSpinSound(soundDurationMs);
                    });
                }
                return;
            } catch (_) {
                // Fall through to Web Audio API fallback
            }
        }

        generateSpinSound(soundDurationMs);
    }

    // Stop spinning sound
    function stopSpinSound() {
        spinSoundToken++;
        if (soundStopTimer) {
            clearTimeout(soundStopTimer);
            soundStopTimer = null;
        }
        if (tickTrackerRafId && typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(tickTrackerRafId);
            tickTrackerRafId = null;
        }
        if (pointerFlickTimer) {
            clearTimeout(pointerFlickTimer);
            pointerFlickTimer = null;
        }
        const pointer = document.querySelector('.wheel-pointer');
        if (pointer) pointer.classList.remove('is-ticking');

        // Stop HTML audio element
        const audioElement = document.getElementById('wheel-spin-audio');
        if (audioElement) {
            try {
                audioElement.pause();
                audioElement.currentTime = 0;
                audioElement.playbackRate = 1;
            } catch (_) {
                // Ignore media reset errors when media isn't loaded yet
            }
        }

        // Stop any scheduled Web Audio API nodes
        if (activeAudioNodes.length > 0) {
            activeAudioNodes.forEach(node => {
                try {
                    if (typeof node.stop === 'function') node.stop();
                    if (typeof node.disconnect === 'function') node.disconnect();
                } catch (_) {
                    // Node may already be stopped
                }
            });
            activeAudioNodes = [];
        }
    }

    // Generate realistic decelerating wheel-peg ticks using Web Audio API fallback
    function generateSpinSound(soundDurationMs) {
        initAudio();
        if (!audioContext || typeof audioContext.createOscillator !== 'function') return;

        // Clear any previous Web Audio nodes
        if (activeAudioNodes.length > 0) {
            activeAudioNodes.forEach(node => {
                try {
                    if (typeof node.stop === 'function') node.stop();
                    if (typeof node.disconnect === 'function') node.disconnect();
                } catch (_) {}
            });
            activeAudioNodes = [];
        }

        const soundDurationSeconds = Math.max(0.2, soundDurationMs / 1000);
        const now = audioContext.currentTime || 0;
        const tickCount = Math.max(12, Math.min(48, Math.round(soundDurationSeconds * 10)));

        for (let i = 0; i < tickCount; i++) {
            const progress = i / tickCount;
            // Quadratic easing spaces ticks further apart as the wheel slows down
            const offset = soundDurationSeconds * (progress * progress);
            const startTime = now + offset;
            const osc = audioContext.createOscillator();
            const env = audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(950 - progress * 350, startTime);
            osc.frequency.exponentialRampToValueAtTime(240, startTime + 0.035);

            env.gain.setValueAtTime(0.0001, startTime);
            env.gain.exponentialRampToValueAtTime(0.26 * (1 - progress * 0.4), startTime + 0.003);
            env.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.038);

            osc.connect(env);
            env.connect(gainNode || audioContext.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.042);
            activeAudioNodes.push(osc, env);
        }
    }
    
    // Get current wheel colors based on selected theme
    function getWheelColors() {
        return colorThemes[currentColorTheme]?.colors || colorThemes.classic.colors;
    }
    
    // Change color theme
    function changeColorTheme(theme) {
        if (colorThemes[theme]) {
            currentColorTheme = theme;
            try {
                localStorage.setItem('wheelColorTheme', theme);
            } catch (e) {
                console.warn('localStorage is blocked:', e);
            }
            updateNamesDisplay();
            updateWheelDisplay();
            
            // Update theme selector
            const themeSelector = document.getElementById('color-theme-selector');
            if (themeSelector) {
                themeSelector.value = theme;
            }
            
            // Track theme change
            if (typeof gtag !== 'undefined') {
                gtag('event', 'color_theme_change', {
                    event_category: 'random_wheel_customization',
                    event_label: theme
                });
            }
        }
    }
    
    // Initialize color theme selector
    function initializeColorThemeSelector() {
        const themeSelector = document.getElementById('color-theme-selector');
        if (themeSelector) {
            // Populate theme options
            themeSelector.innerHTML = Object.entries(colorThemes).map(([key, theme]) => 
                `<option value="${key}" ${key === currentColorTheme ? 'selected' : ''}>${theme.name}</option>`
            ).join('');
            
            // Add change event listener
            themeSelector.addEventListener('change', function() {
                changeColorTheme(this.value);
            });
        }
    }

    function initializeSpinSettings() {
        const durationSelector = document.getElementById('spin-duration-selector');
        const suspenseCheckbox = document.getElementById('suspense-effect');
        const spinSoundSelector = document.getElementById('spin-sound-selector');
        const winnerSoundSelector = document.getElementById('winner-sound-selector');
        const volumeSlider = document.getElementById('wheel-volume-slider');
        const volumeValue = document.getElementById('wheel-volume-value');
        const testSoundBtn = document.getElementById('test-wheel-sound-btn');

        if (durationSelector) {
            durationSelector.value = String(spinDurationMs);
            durationSelector.addEventListener('change', function() {
                const selectedDuration = Number(this.value);
                if (!ALLOWED_SPIN_DURATIONS.includes(selectedDuration)) return;
                spinDurationMs = selectedDuration;
                saveToLocalStorage('wheelSpinDuration', spinDurationMs);
            });
        }

        if (suspenseCheckbox) {
            suspenseCheckbox.checked = suspenseEffectEnabled;
            suspenseCheckbox.addEventListener('change', function() {
                suspenseEffectEnabled = this.checked;
                saveToLocalStorage('wheelSuspenseEffect', suspenseEffectEnabled);
            });
        }

        if (spinSoundSelector) {
            spinSoundSelector.value = spinSoundMode;
            spinSoundSelector.addEventListener('change', function() {
                if (!ALLOWED_SPIN_SOUNDS.includes(this.value)) return;
                spinSoundMode = this.value;
                saveToLocalStorage('wheelSpinSound', spinSoundMode);
            });
        }

        if (winnerSoundSelector) {
            winnerSoundSelector.value = winnerSoundMode;
            winnerSoundSelector.addEventListener('change', function() {
                if (!ALLOWED_WINNER_SOUNDS.includes(this.value)) return;
                winnerSoundMode = this.value;
                saveToLocalStorage('wheelWinnerSound', winnerSoundMode);
            });
        }

        if (volumeSlider) {
            const pct = Math.round(soundVolume * 100);
            volumeSlider.value = String(pct);
            if (volumeValue) volumeValue.textContent = `${pct}%`;
            volumeSlider.addEventListener('input', function() {
                const nextPct = Math.max(0, Math.min(100, Number(this.value) || 0));
                soundVolume = nextPct / 100;
                if (volumeValue) volumeValue.textContent = `${nextPct}%`;
                if (gainNode && gainNode.gain) {
                    gainNode.gain.value = soundVolume;
                }
                const audioElement = document.getElementById('wheel-spin-audio');
                if (audioElement) audioElement.volume = soundVolume;
                saveToLocalStorage('wheelSoundVolume', nextPct);
            });
        }

        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', previewSelectedSounds);
        }
    }

    function setSpinControlsDisabled(disabled) {
        ['spin-duration-selector', 'suspense-effect', 'reset-wheel-btn'].forEach(id => {
            const control = document.getElementById(id);
            if (control) control.disabled = disabled;
        });
    }
    
    // Initialize
    initializeColorThemeSelector();
    initializeSpinSettings();
    updateNamesDisplay();
    updateWheelDisplay();
    updateHistoryDisplay();
    updateStatistics();
    
    // Add name
    function addName(name) {
        if (isSpinning) return;
        name = name.trim();
        if (name === '') {
            showAlert(tr('wheel.warn.enter_name', 'Vui lòng nhập tên!'), 'warning');
            return;
        }
        
        if (name.length > 20) {
            showAlert(tr('wheel.warn.name_too_long', 'Tên không được dài quá 20 ký tự!'), 'warning');
            return;
        }
        
        if (names.includes(name)) {
            showAlert(tr('wheel.warn.name_exists', 'Tên này đã tồn tại!'), 'warning');
            return;
        }
        
        if (names.length >= 200) {
            showAlert(tr('wheel.warn.limit_reached', 'Chỉ có thể thêm tối đa 200 tên!'), 'warning');
            return;
        }
        
        names.push(name);
        saveNames();
        updateNamesDisplay();
        updateWheelDisplay();
        updateStatistics();
        
        // Clear input
        document.getElementById('name-input').value = '';
    }
    
    // Remove name
    function removeName(index, allowDuringSpin = false) {
        if (isSpinning && !allowDuringSpin) return;
        if (index < 0 || index >= names.length) return;
        names.splice(index, 1);
        saveNames();
        updateNamesDisplay();
        updateWheelDisplay();
        updateStatistics();
    }
    
    // Save names to localStorage
    function saveNames() {
        saveToLocalStorage('wheelNames', names);
    }
    
    // Update names display
    function updateNamesDisplay() {
        const namesList = document.getElementById('names-list');
        
        if (names.length === 0) {
            namesList.innerHTML = '<p class="text-muted text-center">Chưa có tên nào</p>';
            document.getElementById('spin-btn').disabled = true;
            return;
        }
        
        document.getElementById('spin-btn').disabled = false;
        
        const wheelColors = getWheelColors();
        namesList.innerHTML = names.map((name, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <span class="name-item" style="color: ${wheelColors[index % wheelColors.length]}">
                    <i class="fas fa-circle"></i> ${escapeHtml(name)}
                </span>
                <button class="btn btn-outline-danger btn-sm remove-name-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.remove-name-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                removeName(index);
            });
        });
    }
    
    // Update wheel display
    function updateWheelDisplay() {
        const wheelNames = document.getElementById('wheel-names');
        
        if (names.length === 0) {
            wheelNames.innerHTML = '';
            return;
        }
        
        // Create canvas if it doesn't exist
        let canvas = wheelNames.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            wheelNames.innerHTML = '';
            wheelNames.appendChild(canvas);
        }

        // Match canvas backing store to displayed size (fixes blurry / stretched / clipped wheel)
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const cssSize = Math.max(1, Math.floor(Math.min(rect.width, rect.height) || 400));

        // Keep canvas square
        canvas.width = Math.round(cssSize * dpr);
        canvas.height = Math.round(cssSize * dpr);

        const ctx = canvas.getContext('2d');
        // Clear using device pixels, then draw in CSS pixels
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const centerX = cssSize / 2;
        const centerY = cssSize / 2;
        const radius = cssSize / 2;
        const anglePerSection = (2 * Math.PI) / names.length;
        const wheelColors = getWheelColors();
        
        // Draw wheel segments
        names.forEach((name, index) => {
            const startAngle = index * anglePerSection - Math.PI / 2; // Start from top
            const endAngle = (index + 1) * anglePerSection - Math.PI / 2;
            
            let colorIndex = index % wheelColors.length;
            // Avoid color clash at the boundary (first and last slice)
            if (index === names.length - 1 && names.length > 1) {
                const prevColorIndex = (index - 1) % wheelColors.length;
                const firstColorIndex = 0;
                // If it matches either, find a different one
                if (colorIndex === firstColorIndex || colorIndex === prevColorIndex) {
                    colorIndex = (colorIndex + 1) % wheelColors.length;
                    // If it still matches prev (e.g. C is very small), try another shift
                    if (colorIndex === prevColorIndex || colorIndex === firstColorIndex) {
                        colorIndex = (colorIndex + 2) % wheelColors.length;
                    }
                }
            }
            const color = wheelColors[colorIndex];
            
            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text
            ctx.save();
            
            // Calculate text angle (bisector of the segment)
            const textAngle = startAngle + anglePerSection / 2;
            
            // Translate to center and rotate by textAngle
            ctx.translate(centerX, centerY);
            ctx.rotate(textAngle);
            
            // Determine base font size based on the number of items
            let baseFontSize = 16;
            if (names.length > 120) {
                baseFontSize = 7;
            } else if (names.length > 80) {
                baseFontSize = 8;
            } else if (names.length > 50) {
                baseFontSize = 10;
            } else if (names.length > 30) {
                baseFontSize = 12;
            } else if (names.length > 16) {
                baseFontSize = 14;
            }
            
            // Scale font size based on current wheel radius (standardizing at radius=200)
            let fontSize = Math.max(6, Math.floor(baseFontSize * (radius / 200)));
            
            ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            
            // Truncate name if it's too long to prevent it from overlapping near the center
            const maxTextWidth = radius * 0.7;
            let displayName = name;
            if (ctx.measureText(displayName).width > maxTextWidth) {
                while (displayName.length > 0 && ctx.measureText(displayName + '...').width > maxTextWidth) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '...';
            }
            
            // Draw text near the outer rim (e.g. at 88% of radius) flowing inwards
            ctx.fillText(displayName, radius * 0.88, 0);
            
            ctx.restore();
        });
    }
    
    // Spin wheel
    function spinWheel() {
        if (isSpinning || names.length === 0) return;
        
        isSpinning = true;
        document.getElementById('spin-btn').disabled = true;
        document.getElementById('spin-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang quay...';
        
        // Track wheel spin start
        if (typeof gtag !== 'undefined') {
            gtag('event', 'wheel_spin_start', {
                event_category: 'random_wheel_tools',
                event_label: 'wheel_interaction',
                total_options: names.length
            });
        }
        
        const activeSpinDurationMs = spinDurationMs;
        const activeSuspenseEffect = suspenseEffectEnabled;
        const soundDurationMs = Math.max(0, activeSpinDurationMs - SOUND_END_LEAD_MS);
        setSpinControlsDisabled(true);

        // Play spinning sound. It ends 0.5 second before the result.
        playSpinSound(soundDurationMs);

        // Select a fair random section, then calculate a matching rotation.
        // Scale full spins naturally with duration (2s -> 3-4 spins, 30s -> 24-30 spins).
        const durationSec = activeSpinDurationMs / 1000;
        const minSpins = Math.max(3, Math.round(durationSec * 0.8 + 1.5));
        const maxSpins = minSpins + Math.max(1, Math.round(durationSec * 0.25));
        const fullSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
        const anglePerSection = 360 / names.length;
        const selectedIndex = Math.floor(Math.random() * names.length);

        let finalOffsetWithinSection;
        if (activeSuspenseEffect && names.length > 1) {
            // 50/50 fair suspense outcome while preserving uniform 1/N win probability:
            // - pushOverDivider = false: creeps right to the divider edge and halts without crossing.
            // - pushOverDivider = true: creeps onto the divider center, then gently tips just across.
            const pushOverDivider = Math.random() < 0.5;
            if (pushOverDivider) {
                const maxPast = Math.min(3.0, anglePerSection * 0.28);
                const minPast = Math.min(1.1, maxPast * 0.5);
                const pastMargin = minPast + Math.random() * Math.max(0, maxPast - minPast);
                finalOffsetWithinSection = anglePerSection - pastMargin;
            } else {
                const maxHold = Math.min(1.8, anglePerSection * 0.22);
                const minHold = Math.min(0.6, maxHold * 0.5);
                const holdMargin = minHold + Math.random() * Math.max(0, maxHold - minHold);
                finalOffsetWithinSection = holdMargin;
            }
        } else {
            finalOffsetWithinSection = anglePerSection * (0.2 + Math.random() * 0.6);
        }

        const targetNormalizedAngle = (selectedIndex * anglePerSection + finalOffsetWithinSection) % 360;
        const targetRotationModulo = (360 - targetNormalizedAngle) % 360;
        const currentRotationModulo = ((currentRotation % 360) + 360) % 360;
        const rotationToTarget = (targetRotationModulo - currentRotationModulo + 360) % 360;
        const totalRotation = fullSpins * 360 + rotationToTarget;

        currentRotation += totalRotation;

        // Rotate only the wheel content using one continuous, smooth deceleration curve (no unnatural stop-then-jump).
        const wheelNames = document.getElementById('wheel-names');
        const easing = activeSuspenseEffect
            ? 'cubic-bezier(0.06, 0.92, 0.12, 1)'
            : 'cubic-bezier(0.22, 1, 0.36, 1)';
        wheelNames.style.transition = `transform ${activeSpinDurationMs}ms ${easing}`;
        wheelNames.style.transform = `rotate(${currentRotation}deg)`;

        // In classic WAV mode, stop 0.5s early; in slice-synced ticking modes, track until spin ends.
        if (spinSoundMode === 'classic') {
            soundStopTimer = setTimeout(stopSpinSound, soundDurationMs);
        }
        
        // Calculate winner after animation
        setTimeout(() => {
            stopSpinSound();
            if (names.length === 0) {
                isSpinning = false;
                setSpinControlsDisabled(false);
                return;
            }
            const normalizedAngle = ((360 - (currentRotation % 360)) + 360) % 360;
            const anglePerSection = 360 / names.length;
            const winnerIndex = Math.floor(normalizedAngle / anglePerSection) % names.length;
            const winner = names[winnerIndex];
            
            // Track wheel spin result
            if (typeof gtag !== 'undefined') {
                gtag('event', 'wheel_spin_complete', {
                    event_category: 'random_wheel_tools',
                    event_label: 'wheel_result',
                    winner_index: winnerIndex,
                    total_options: names.length
                });
            }
            
            showWinner(winner, winnerIndex);
            
            isSpinning = false;
            setSpinControlsDisabled(false);
            document.getElementById('spin-btn').disabled = names.length === 0;
            document.getElementById('spin-btn').innerHTML = '<i class="fas fa-play"></i> Quay bánh xe';
        }, activeSpinDurationMs);
    }
    
    // Show winner
    function showWinner(winner, winnerIndex) {
        try {
            playWinnerSound(winnerSoundMode);
        } catch (e) {
            console.warn('Winner sound failed:', e);
        }

        const resultElement = document.getElementById('wheel-result');
        if (resultElement) {
            resultElement.textContent = winner;
        }
        
        // Add to history
        const historyItem = {
            winner: winner,
            timestamp: new Date().toLocaleString('vi-VN'),
            totalNames: names.length
        };
        
        spinHistory.unshift(historyItem);
        if (spinHistory.length > 50) {
            spinHistory = spinHistory.slice(0, 50);
        }
        
        saveToLocalStorage('wheelSpinHistory', spinHistory);
        updateHistoryDisplay();
        updateStatistics();
        
        // Show confetti effect
        const confettiElement = document.getElementById('confetti-effect');
        if (confettiElement && confettiElement.checked) {
            showConfetti();
        }
        
        // Remove winner if option is checked (look up by name to avoid stale index shifts)
        const removeWinnerElement = document.getElementById('remove-winner');
        if (removeWinnerElement && removeWinnerElement.checked) {
            setTimeout(() => {
                if (confirm(tr('wheel.warn.remove_winner_confirm', 'Xóa "{name}" khỏi danh sách?').replace('{name}', winner))) {
                    const currentIdx = names.indexOf(winner);
                    if (currentIdx !== -1) {
                        removeName(currentIdx, true);
                    }
                }
            }, 1000);
        }
        
        showAlert(tr('wheel.warn.winner_alert', '🎉 Người thắng: {name}!').replace('{name}', winner), 'success');
    }
    
    // Show confetti effect
    function showConfetti() {
        // Simple confetti effect using CSS animation
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '9999';
        
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.innerHTML = ['🎉', '🎊', '⭐', '✨', '🌟'][Math.floor(Math.random() * 5)];
            confetti.style.position = 'absolute';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.fontSize = Math.random() * 20 + 20 + 'px';
            confetti.style.animation = `confetti-fall ${Math.random() * 2 + 2}s linear forwards`;
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 4000);
        
        // Add CSS animation if not exists
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Update history display
    function updateHistoryDisplay() {
        const historyDiv = document.getElementById('spin-history');
        
        if (!historyDiv) return; // Safety check for missing element
        
        if (spinHistory.length === 0) {
            historyDiv.innerHTML = '<p class="text-muted text-center">Chưa có lịch sử</p>';
            return;
        }
        
        historyDiv.innerHTML = spinHistory.map((item, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <div>
                    <strong>${escapeHtml(item.winner)}</strong>
                    <small class="text-muted d-block">${escapeHtml(item.timestamp)}</small>
                    <small class="text-muted">Từ ${item.totalNames} tên</small>
                </div>
                <button class="btn btn-outline-danger btn-sm delete-history-item-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Add delete event listeners
        document.querySelectorAll('.delete-history-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                spinHistory.splice(index, 1);
                saveToLocalStorage('wheelSpinHistory', spinHistory);
                updateHistoryDisplay();
                updateStatistics();
            });
        });
    }
    
    // Update statistics
    function updateStatistics() {
        const totalSpinsElement = document.getElementById('total-spins');
        const currentNamesElement = document.getElementById('current-names-count');
        const topWinnersElement = document.getElementById('top-winners');
        
        if (totalSpinsElement) totalSpinsElement.textContent = spinHistory.length;
        if (currentNamesElement) currentNamesElement.textContent = names.length;
        
        if (!topWinnersElement) return; // Safety check
        
        // Calculate top winners using null-prototype map to avoid prototype key collisions (e.g. "toString")
        if (spinHistory.length > 0) {
            const winnerCounts = Object.create(null);
            spinHistory.forEach(item => {
                if (!item || typeof item.winner !== 'string') return;
                winnerCounts[item.winner] = (winnerCounts[item.winner] || 0) + 1;
            });
            
            const sortedWinners = Object.entries(winnerCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
            
            const topWinnersHTML = sortedWinners.map(([name, count]) => 
                `<div class="d-flex justify-content-between">
                    <span>${escapeHtml(name)}</span>
                    <span class="badge bg-primary">${count}</span>
                </div>`
            ).join('');
            
            topWinnersElement.innerHTML = topWinnersHTML;
        } else {
            topWinnersElement.innerHTML = '<p class="text-muted">Chưa có dữ liệu</p>';
        }
    }
    
    // Export data
    function exportData() {
        const data = {
            names: names,
            history: spinHistory,
            exportDate: new Date().toISOString()
        };
        
        const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement('a');
        link.setAttribute('href', jsonContent);
        link.setAttribute('download', `wheel-data-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert(tr('wheel.warn.export_success', 'Đã xuất dữ liệu thành công!'), 'success');
    }
    
    // Event listeners
    document.getElementById('add-name-btn').addEventListener('click', function() {
        const nameInput = document.getElementById('name-input');
        addName(nameInput.value);
    });
    
    document.getElementById('name-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addName(this.value);
        }
    });
    
    document.getElementById('add-bulk-btn').addEventListener('click', function() {
        if (isSpinning) return;
        const bulkNames = document.getElementById('bulk-names').value;
        const nameList = bulkNames.split('\n').filter(name => name.trim() !== '');
        
        let addedCount = 0;
        let skippedLong = 0;
        nameList.forEach(name => {
            name = name.trim();
            if (name.length > 20) {
                skippedLong++;
                return;
            }
            if (name && !names.includes(name) && names.length < 200) {
                names.push(name);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            saveNames();
            updateNamesDisplay();
            updateWheelDisplay();
            updateStatistics();
            document.getElementById('bulk-names').value = '';
            showAlert(tr('wheel.warn.added_count', 'Đã thêm {count} tên!').replace('{count}', addedCount), 'success');
        } else if (skippedLong > 0) {
            showAlert(tr('wheel.warn.name_too_long', 'Tên không được dài quá 20 ký tự!'), 'warning');
        }
    });
    
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    
    document.getElementById('reset-wheel-btn').addEventListener('click', function() {
        if (isSpinning) return;
        const wheelNames = document.getElementById('wheel-names');
        currentRotation = 0;
        wheelNames.style.transition = 'none';
        wheelNames.style.transform = 'rotate(0deg)';
        document.getElementById('wheel-result').textContent = 'Thêm tên và nhấn "Quay bánh xe"';
    });
 
    // Redraw on resize to keep canvas aligned with responsive wheel size
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!isSpinning) {
                updateWheelDisplay();
            }
        }, 150);
    });
    
    document.getElementById('clear-names-btn').addEventListener('click', function() {
        if (isSpinning) return;
        if (names.length > 0 && confirm(tr('wheel.warn.clear_all_confirm', 'Bạn có chắc muốn xóa tất cả tên?'))) {
            names = [];
            saveNames();
            updateNamesDisplay();
            updateWheelDisplay();
            updateStatistics();
            showAlert(tr('wheel.warn.clear_all_success', 'Đã xóa tất cả tên!'), 'success');
        }
    });
    
    document.getElementById('clear-history-wheel-btn').addEventListener('click', function() {
        if (spinHistory.length > 0 && confirm(tr('wheel.warn.clear_history_confirm', 'Bạn có chắc muốn xóa lịch sử?'))) {
            spinHistory = [];
            saveToLocalStorage('wheelSpinHistory', spinHistory);
            updateHistoryDisplay();
            updateStatistics();
            showAlert(tr('wheel.warn.clear_history_success', 'Đã xóa lịch sử!'), 'success');
        }
    });
    
    document.getElementById('export-wheel-data-btn').addEventListener('click', exportData);
    
    // Preset buttons
    document.querySelectorAll('.preset-names-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (isSpinning) return;
            const presetName = this.dataset.preset;
            if (presets[presetName]) {
                names = [...presets[presetName]];
                saveNames();
                updateNamesDisplay();
                updateWheelDisplay();
                updateStatistics();
                showAlert(tr('wheel.warn.preset_loaded', 'Đã tải preset: {name}!').replace('{name}', presetName), 'success');
                
                // Track preset usage
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'wheel_preset_load', {
                        event_category: 'random_wheel_tools',
                        event_label: presetName,
                        preset_type: presetName,
                        preset_size: presets[presetName].length
                    });
                }
            }
        });
    });
});
