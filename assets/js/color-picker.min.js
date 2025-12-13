// Color Picker functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const colorPreview = document.getElementById('color-preview');
    const hexInput = document.getElementById('hex-input');
    const rgbInputs = {
        r: document.getElementById('rgb-r'),
        g: document.getElementById('rgb-g'),
        b: document.getElementById('rgb-b')
    };
    const hslInputs = {
        h: document.getElementById('hsl-h'),
        s: document.getElementById('hsl-s'),
        l: document.getElementById('hsl-l')
    };
    const hsvInputs = {
        h: document.getElementById('hsv-h'),
        s: document.getElementById('hsv-s'),
        v: document.getElementById('hsv-v')
    };
    const cmykInputs = {
        c: document.getElementById('cmyk-c'),
        m: document.getElementById('cmyk-m'),
        y: document.getElementById('cmyk-y'),
        k: document.getElementById('cmyk-k')
    };
    
    const colorWheel = document.getElementById('color-wheel');
    const ctx = colorWheel.getContext('2d');
    const harmonySelect = document.getElementById('harmony-select');
    const harmonyColors = document.getElementById('harmony-colors');
    const randomColorBtn = document.getElementById('random-color-btn');
    const addToPaletteBtn = document.getElementById('add-to-palette-btn');
    const clearPaletteBtn = document.getElementById('clear-palette-btn');
    const savedColorsContainer = document.getElementById('saved-colors');
    const alertContainer = document.getElementById('alert-container');
    
    const cssHex = document.getElementById('css-hex');
    const cssRgb = document.getElementById('css-rgb');
    const cssHsl = document.getElementById('css-hsl');
    const brightnessValue = document.getElementById('brightness-value');
    const luminanceValue = document.getElementById('luminance-value');
    const presetPaletteDisplay = document.getElementById('preset-palette-display');

    // Contrast checker elements
    const contrastTextColor = document.getElementById('contrast-text-color');
    const contrastTextHex = document.getElementById('contrast-text-hex');
    const contrastBgColor = document.getElementById('contrast-bg-color');
    const contrastBgHex = document.getElementById('contrast-bg-hex');
    const contrastPreview = document.getElementById('contrast-preview');
    const contrastRatioEl = document.getElementById('contrast-ratio');
    const contrastAaNormal = document.getElementById('contrast-aa-normal');
    const contrastAaaNormal = document.getElementById('contrast-aaa-normal');
    const contrastAaLarge = document.getElementById('contrast-aa-large');
    const contrastAaaLarge = document.getElementById('contrast-aaa-large');

    // Gradient generator elements
    const gradientAngle = document.getElementById('gradient-angle');
    const gradientAngleNumber = document.getElementById('gradient-angle-number');
    const gradientStopsEl = document.getElementById('gradient-stops');
    const gradientAddStopBtn = document.getElementById('gradient-add-stop');
    const gradientPreview = document.getElementById('gradient-preview');
    const gradientCss = document.getElementById('gradient-css');
    const gradientCopyBtn = document.getElementById('gradient-copy');

    let currentColor = { r: 255, g: 87, b: 51 };
    let savedColors = JSON.parse(localStorage.getItem('colorPalette') || '[]');
    let isUpdating = false;

    function tr(key, fallback) {
        try {
            if (window.translationSystem && typeof window.translationSystem.t === 'function') {
                return window.translationSystem.t(key, fallback ?? key);
            }
        } catch (e) { /* ignore */ }
        return fallback ?? key;
    }

    // Gradient state
    let gradientStops = [
        { color: '#667EEA', pos: 0 },
        { color: '#764BA2', pos: 100 }
    ];

    // Preset color palettes
    const presetPalettes = {
        pastel: ['FFB3BA', 'FFDFBA', 'FFFFBA', 'BAFFC9', 'BAE1FF', 'E8BAFF'],
        vintage: ['8B4513', 'A0522D', 'CD853F', 'DEB887', 'F5DEB3', '2F4F4F'],
        retro: ['FF6B6B', 'FFE66D', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7'],
        neon: ['FF00FF', '00FFFF', '00FF00', 'FFFF00', 'FF0080', '8000FF'],
        gold: ['FFD700', 'FFC125', 'FFB90F', 'DAA520', 'B8860B', '8B6914'],
        light: ['FFFFFF', 'F8F9FA', 'E9ECEF', 'DEE2E6', 'CED4DA', 'ADB5BD'],
        dark: ['212529', '343A40', '495057', '6C757D', '868E96', 'ADB5BD'],
        warm: ['FF6B6B', 'FF8E72', 'FFA07A', 'FFB347', 'FFCC5C', 'FFE66D'],
        cold: ['4A90D9', '5DADE2', '76D7EA', '7FDBFF', 'A8E6CF', 'B8D4E3'],
        summer: ['FF6B6B', 'FFA07A', 'FFD93D', '6BCB77', '4D96FF', 'F72585'],
        fall: ['D35400', 'E67E22', 'F39C12', 'FFC300', '8B4513', '654321'],
        winter: ['1E3A5F', '3D5A80', '98C1D9', 'E0FBFC', 'FFFFFF', '293241'],
        spring: ['98D8AA', 'C9F4AA', 'FCFFB2', 'FFD4D4', 'F0B3B3', 'E7A0C4'],
        happy: ['FFD93D', 'FF6B6B', '6BCB77', '4D96FF', 'C9B1FF', 'FF8FAB'],
        nature: ['228B22', '32CD32', '90EE90', '8FBC8F', '2E8B57', '006400'],
        earth: ['8B4513', 'A0522D', 'D2691E', 'DEB887', '8B8B00', '556B2F'],
        night: ['0D1B2A', '1B263B', '415A77', '778DA9', 'E0E1DD', '000814'],
        space: ['0B0C10', '1F2833', '45A29E', '66FCF1', 'C5C6C7', '5C2D91'],
        rainbow: ['FF0000', 'FF7F00', 'FFFF00', '00FF00', '0000FF', '8B00FF'],
        gradient: ['667EEA', '764BA2', 'F093FB', 'F5576C', 'FED6E3', '4FACFE'],
        sunset: ['FF512F', 'F09819', 'DD2476', 'FF512F', 'FDC830', 'F37335'],
        sky: ['87CEEB', '00BFFF', '1E90FF', '4169E1', '6495ED', 'B0E0E6'],
        sea: ['006994', '0077B6', '0096C7', '00B4D8', '48CAE4', '90E0EF'],
        kids: ['FF6B6B', 'FFD93D', '6BCB77', '4D96FF', 'C9B1FF', 'FF8FAB'],
        skin: ['FFE5D9', 'D4A574', 'C68642', '8D5524', '6B4423', '4A312C'],
        food: ['FF6347', 'FFD700', '32CD32', 'FF69B4', '8B4513', 'FFA500'],
        cream: ['FFFDD0', 'FFF8DC', 'FAEBD7', 'FFE4C4', 'FFDAB9', 'FFE4E1'],
        coffee: ['3C2415', '5C4033', '6F4E37', '8B7355', 'A0826D', 'D2B48C'],
        wedding: ['FFFFFF', 'FFFAF0', 'FFF0F5', 'FFE4E1', 'D4AF37', 'C0C0C0'],
        christmas: ['C41E3A', '165B33', 'FFD700', 'FFFFFF', 'BB0A21', '146B3A'],
        halloween: ['FF6600', '000000', '800080', '008000', 'FFD700', 'DC143C']
    };

    // Initialize
    drawColorWheel();
    updateFromRGB();
    displaySavedColors();
    initializeContrastChecker();
    initializeGradientGenerator();

    // Keep dynamic text in sync with language changes
    window.addEventListener('languageChanged', () => {
        displaySavedColors();
    });

    // Event Listeners
    hexInput.addEventListener('input', () => updateFromHex());
    Object.values(rgbInputs).forEach(input => input.addEventListener('input', () => updateFromRGB()));
    Object.values(hslInputs).forEach(input => input.addEventListener('input', () => updateFromHSL()));
    Object.values(hsvInputs).forEach(input => input.addEventListener('input', () => updateFromHSV()));
    Object.values(cmykInputs).forEach(input => input.addEventListener('input', () => updateFromCMYK()));
    
    colorWheel.addEventListener('click', handleWheelClick);
    harmonySelect.addEventListener('change', updateHarmony);
    randomColorBtn.addEventListener('click', generateRandomColor);
    addToPaletteBtn.addEventListener('click', addToPalette);
    clearPaletteBtn.addEventListener('click', clearPalette);
    colorPreview.addEventListener('click', () => hexInput.focus());

    // Preset palette buttons
    document.querySelectorAll('.preset-palette-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.preset-palette-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Display the palette
            const paletteName = this.getAttribute('data-palette');
            displayPresetPalette(paletteName);
        });
    });

    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const value = targetId === 'hex-input' ? '#' + input.value : input.value;
            copyToClipboard(value, this);
        });
    });

    // Display preset palette
    function displayPresetPalette(paletteName) {
        if (!presetPaletteDisplay || !presetPalettes[paletteName]) return;
        
        presetPaletteDisplay.innerHTML = '';
        presetPalettes[paletteName].forEach(hex => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'preset-color';
            colorDiv.style.backgroundColor = `#${hex}`;
            colorDiv.title = `#${hex}`;
            colorDiv.addEventListener('click', () => {
                currentColor = hexToRgb(hex);
                updateAllFormats();
            });
            
            const label = document.createElement('div');
            label.className = 'preset-color-label';
            label.textContent = `#${hex}`;
            colorDiv.appendChild(label);
            
            presetPaletteDisplay.appendChild(colorDiv);
        });
    }

    // Color Conversion Functions
    function rgbToHex(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    function normalizeHexColor(input) {
        if (!input) return null;
        let hex = String(input).trim();
        if (!hex) return null;
        if (hex[0] !== '#') hex = '#' + hex;
        const m3 = /^#([0-9A-Fa-f]{3})$/.exec(hex);
        if (m3) {
            const h = m3[1];
            return '#' + h.split('').map(c => c + c).join('').toUpperCase();
        }
        const m6 = /^#([0-9A-Fa-f]{6})$/.exec(hex);
        if (m6) return '#' + m6[1].toUpperCase();
        return null;
    }

    function hexToRgbObj(hex) {
        const n = normalizeHexColor(hex);
        if (!n) return null;
        const rgb = hexToRgb(n);
        return { r: rgb.r, g: rgb.g, b: rgb.b };
    }

    function srgbToLinear(channel) {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(rgb) {
        const r = srgbToLinear(rgb.r);
        const g = srgbToLinear(rgb.g);
        const b = srgbToLinear(rgb.b);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrastRatio(fgRgb, bgRgb) {
        const L1 = relativeLuminance(fgRgb);
        const L2 = relativeLuminance(bgRgb);
        const lighter = Math.max(L1, L2);
        const darker = Math.min(L1, L2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h, s = max === 0 ? 0 : d / max;
        const v = max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
    }

    function hsvToRgb(h, s, v) {
        h /= 360; s /= 100; v /= 100;
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    function rgbToCmyk(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const k = 1 - Math.max(r, g, b);
        const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
        const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
        const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }

    function cmykToRgb(c, m, y, k) {
        c /= 100; m /= 100; y /= 100; k /= 100;
        const r = 255 * (1 - c) * (1 - k);
        const g = 255 * (1 - m) * (1 - k);
        const b = 255 * (1 - y) * (1 - k);
        return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    }

    // Update Functions
    function updateFromHex() {
        if (isUpdating) return;
        isUpdating = true;
        
        const hex = hexInput.value.replace(/^#/, '');
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
            currentColor = hexToRgb(hex);
            updateAllFormats();
        }
        
        isUpdating = false;
    }

    function updateFromRGB() {
        if (isUpdating) return;
        isUpdating = true;
        
        currentColor = {
            r: parseInt(rgbInputs.r.value) || 0,
            g: parseInt(rgbInputs.g.value) || 0,
            b: parseInt(rgbInputs.b.value) || 0
        };
        updateAllFormats();
        
        isUpdating = false;
    }

    function updateFromHSL() {
        if (isUpdating) return;
        isUpdating = true;
        
        const h = parseInt(hslInputs.h.value) || 0;
        const s = parseInt(hslInputs.s.value) || 0;
        const l = parseInt(hslInputs.l.value) || 0;
        currentColor = hslToRgb(h, s, l);
        updateAllFormats();
        
        isUpdating = false;
    }

    function updateFromHSV() {
        if (isUpdating) return;
        isUpdating = true;
        
        const h = parseInt(hsvInputs.h.value) || 0;
        const s = parseInt(hsvInputs.s.value) || 0;
        const v = parseInt(hsvInputs.v.value) || 0;
        currentColor = hsvToRgb(h, s, v);
        updateAllFormats();
        
        isUpdating = false;
    }

    function updateFromCMYK() {
        if (isUpdating) return;
        isUpdating = true;
        
        const c = parseInt(cmykInputs.c.value) || 0;
        const m = parseInt(cmykInputs.m.value) || 0;
        const y = parseInt(cmykInputs.y.value) || 0;
        const k = parseInt(cmykInputs.k.value) || 0;
        currentColor = cmykToRgb(c, m, y, k);
        updateAllFormats();
        
        isUpdating = false;
    }

    function updateAllFormats() {
        const { r, g, b } = currentColor;
        
        // Update HEX
        const hex = rgbToHex(r, g, b);
        if (!isUpdating) hexInput.value = hex;
        else hexInput.value = hex;
        
        // Update RGB
        rgbInputs.r.value = r;
        rgbInputs.g.value = g;
        rgbInputs.b.value = b;
        
        // Update HSL
        const hsl = rgbToHsl(r, g, b);
        hslInputs.h.value = hsl.h;
        hslInputs.s.value = hsl.s;
        hslInputs.l.value = hsl.l;
        
        // Update HSV
        const hsv = rgbToHsv(r, g, b);
        hsvInputs.h.value = hsv.h;
        hsvInputs.s.value = hsv.s;
        hsvInputs.v.value = hsv.v;
        
        // Update CMYK
        const cmyk = rgbToCmyk(r, g, b);
        cmykInputs.c.value = cmyk.c;
        cmykInputs.m.value = cmyk.m;
        cmykInputs.y.value = cmyk.y;
        cmykInputs.k.value = cmyk.k;
        
        // Update preview
        const color = `rgb(${r}, ${g}, ${b})`;
        colorPreview.style.backgroundColor = color;
        
        // Update CSS formats
        cssHex.textContent = `#${hex}`;
        cssRgb.textContent = `rgb(${r}, ${g}, ${b})`;
        cssHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        
        // Calculate brightness and luminance
        const brightness = Math.round((r * 299 + g * 587 + b * 114) / 1000);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        brightnessValue.textContent = `${brightness} / 255 (${Math.round(luminance * 100)}%)`;
        luminanceValue.textContent = luminance.toFixed(3);
        
        // Update color wheel marker
        drawColorWheel();
        updateHarmony();
    }

    // Contrast Checker
    function initializeContrastChecker() {
        if (!contrastTextColor || !contrastBgColor || !contrastPreview) return;

        const syncFromPicker = (picker, hexInputEl) => {
            const hex = normalizeHexColor(picker.value);
            if (hex) hexInputEl.value = hex;
        };

        const syncFromHex = (hexInputEl, picker) => {
            const hex = normalizeHexColor(hexInputEl.value);
            if (hex) {
                hexInputEl.value = hex;
                picker.value = hex;
            }
        };

        contrastTextColor.addEventListener('input', () => {
            syncFromPicker(contrastTextColor, contrastTextHex);
            updateContrastUI();
        });
        contrastBgColor.addEventListener('input', () => {
            syncFromPicker(contrastBgColor, contrastBgHex);
            updateContrastUI();
        });
        contrastTextHex.addEventListener('input', () => {
            syncFromHex(contrastTextHex, contrastTextColor);
            updateContrastUI();
        });
        contrastBgHex.addEventListener('input', () => {
            syncFromHex(contrastBgHex, contrastBgColor);
            updateContrastUI();
        });

        // Normalize initial
        syncFromHex(contrastTextHex, contrastTextColor);
        syncFromHex(contrastBgHex, contrastBgColor);
        updateContrastUI();
    }

    function setBadgeState(el, pass) {
        if (!el) return;
        el.classList.remove('bg-secondary', 'bg-success', 'bg-danger');
        el.classList.add(pass ? 'bg-success' : 'bg-danger');
    }

    function updateContrastUI() {
        if (!contrastPreview) return;
        const fg = hexToRgbObj(contrastTextHex ? contrastTextHex.value : contrastTextColor.value);
        const bg = hexToRgbObj(contrastBgHex ? contrastBgHex.value : contrastBgColor.value);

        if (!fg || !bg) {
            if (contrastRatioEl) contrastRatioEl.textContent = '-';
            return;
        }

        const ratio = contrastRatio(fg, bg);
        if (contrastRatioEl) contrastRatioEl.textContent = ratio.toFixed(2) + ':1';

        contrastPreview.style.backgroundColor = normalizeHexColor(contrastBgColor.value) || '#ffffff';
        contrastPreview.style.color = normalizeHexColor(contrastTextColor.value) || '#111111';

        // WCAG thresholds
        const aaNormal = ratio >= 4.5;
        const aaaNormal = ratio >= 7;
        const aaLarge = ratio >= 3;
        const aaaLarge = ratio >= 4.5;

        setBadgeState(contrastAaNormal, aaNormal);
        setBadgeState(contrastAaaNormal, aaaNormal);
        setBadgeState(contrastAaLarge, aaLarge);
        setBadgeState(contrastAaaLarge, aaaLarge);
    }

    // Gradient Generator
    function initializeGradientGenerator() {
        if (!gradientAngle || !gradientStopsEl || !gradientPreview || !gradientCss) return;

        const angleChanged = (value) => {
            const n = Math.max(0, Math.min(360, parseInt(value, 10) || 0));
            gradientAngle.value = String(n);
            gradientAngleNumber.value = String(n);
            updateGradientUI();
        };

        gradientAngle.addEventListener('input', () => angleChanged(gradientAngle.value));
        gradientAngleNumber.addEventListener('input', () => angleChanged(gradientAngleNumber.value));

        if (gradientAddStopBtn) {
            gradientAddStopBtn.addEventListener('click', () => {
                if (gradientStops.length >= 5) return;
                // Add a stop in the middle with a reasonable default
                const pos = gradientStops.length === 2 ? 50 : Math.round(100 * (gradientStops.length / 4));
                gradientStops.push({ color: '#F093FB', pos: pos });
                updateGradientUI();
            });
        }

        if (gradientCopyBtn) {
            gradientCopyBtn.addEventListener('click', () => {
                copyToClipboard(gradientCss.value, gradientCopyBtn);
            });
        }

        updateGradientUI();
    }

    function getGradientCssText() {
        const angle = Math.max(0, Math.min(360, parseInt(gradientAngle.value, 10) || 0));
        const stops = [...gradientStops]
            .map(s => ({ color: normalizeHexColor(s.color) || '#000000', pos: Math.max(0, Math.min(100, parseInt(s.pos, 10) || 0)) }))
            .sort((a, b) => a.pos - b.pos);

        const stopText = stops.map(s => `${s.color} ${s.pos}%`).join(', ');
        return `background: linear-gradient(${angle}deg, ${stopText});`;
    }

    function updateGradientUI() {
        if (!gradientStopsEl) return;

        // Render stop rows
        gradientStopsEl.innerHTML = '';
        gradientStops
            .map((s, idx) => ({ ...s, idx }))
            .forEach((stop) => {
                const row = document.createElement('div');
                row.className = 'gradient-stop-row';

                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.className = 'form-control form-control-color';
                colorInput.value = normalizeHexColor(stop.color) || '#000000';
                colorInput.title = 'Stop color';

                const hexInput = document.createElement('input');
                hexInput.type = 'text';
                hexInput.className = 'form-control font-monospace';
                hexInput.value = normalizeHexColor(stop.color) || '#000000';
                hexInput.placeholder = '#000000';

                const posInput = document.createElement('input');
                posInput.type = 'number';
                posInput.className = 'form-control';
                posInput.min = '0';
                posInput.max = '100';
                posInput.value = String(Math.max(0, Math.min(100, parseInt(stop.pos, 10) || 0)));

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-outline-danger';
                removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
                removeBtn.disabled = gradientStops.length <= 2;

                const onChange = () => {
                    const hex = normalizeHexColor(hexInput.value) || normalizeHexColor(colorInput.value);
                    if (hex) {
                        hexInput.value = hex;
                        colorInput.value = hex;
                    }
                    const pos = Math.max(0, Math.min(100, parseInt(posInput.value, 10) || 0));
                    gradientStops[stop.idx] = { color: hex || '#000000', pos: pos };
                    updateGradientCssAndPreview();
                };

                colorInput.addEventListener('input', () => {
                    hexInput.value = normalizeHexColor(colorInput.value) || '#000000';
                    onChange();
                });
                hexInput.addEventListener('input', onChange);
                posInput.addEventListener('input', onChange);

                removeBtn.addEventListener('click', () => {
                    if (gradientStops.length <= 2) return;
                    gradientStops.splice(stop.idx, 1);
                    updateGradientUI();
                });

                row.appendChild(colorInput);
                row.appendChild(hexInput);
                row.appendChild(posInput);
                row.appendChild(removeBtn);
                gradientStopsEl.appendChild(row);
            });

        updateGradientCssAndPreview();
    }

    function updateGradientCssAndPreview() {
        if (!gradientCss || !gradientPreview) return;
        const cssText = getGradientCssText();
        gradientCss.value = cssText;

        const m = cssText.match(/linear-gradient\((.*)\);$/);
        const gradient = m ? `linear-gradient(${m[1]})` : 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';
        gradientPreview.style.backgroundImage = gradient;
    }

    // Color Wheel Functions
    function drawColorWheel() {
        const centerX = colorWheel.width / 2;
        const centerY = colorWheel.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, colorWheel.width, colorWheel.height);

        // Draw color wheel
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = (angle - 90) * Math.PI / 180;
            const endAngle = (angle + 1 - 90) * Math.PI / 180;
            
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            const hslColor = `hsl(${angle}, 100%, 50%)`;
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, hslColor);
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw current color marker
        const hsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
        const angle = (hsv.h - 90) * Math.PI / 180;
        const distance = (hsv.s / 100) * radius;
        const markerX = centerX + distance * Math.cos(angle);
        const markerY = centerY + distance * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(markerX, markerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function handleWheelClick(e) {
        const rect = colorWheel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = colorWheel.width / 2;
        const centerY = colorWheel.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
            let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;
            
            const saturation = Math.min(100, (distance / radius) * 100);
            const value = 100;
            
            currentColor = hsvToRgb(angle, saturation, value);
            updateAllFormats();
        }
    }

    // Color Harmony Functions
    function updateHarmony() {
        const harmonyType = harmonySelect.value;
        harmonyColors.innerHTML = '';
        
        if (harmonyType === 'none') return;
        
        const hsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
        let colors = [];
        
        switch (harmonyType) {
            case 'complementary':
                colors = [
                    hsv,
                    { h: (hsv.h + 180) % 360, s: hsv.s, v: hsv.v }
                ];
                break;
            case 'analogous':
                colors = [
                    { h: (hsv.h - 30 + 360) % 360, s: hsv.s, v: hsv.v },
                    hsv,
                    { h: (hsv.h + 30) % 360, s: hsv.s, v: hsv.v }
                ];
                break;
            case 'triadic':
                colors = [
                    hsv,
                    { h: (hsv.h + 120) % 360, s: hsv.s, v: hsv.v },
                    { h: (hsv.h + 240) % 360, s: hsv.s, v: hsv.v }
                ];
                break;
            case 'split-complementary':
                colors = [
                    hsv,
                    { h: (hsv.h + 150) % 360, s: hsv.s, v: hsv.v },
                    { h: (hsv.h + 210) % 360, s: hsv.s, v: hsv.v }
                ];
                break;
            case 'square':
                colors = [
                    hsv,
                    { h: (hsv.h + 90) % 360, s: hsv.s, v: hsv.v },
                    { h: (hsv.h + 180) % 360, s: hsv.s, v: hsv.v },
                    { h: (hsv.h + 270) % 360, s: hsv.s, v: hsv.v }
                ];
                break;
            case 'tetradic':
                colors = [
                    hsv,
                    { h: (hsv.h + 60) % 360, s: hsv.s, v: hsv.v },
                    { h: (hsv.h + 180) % 360, s: hsv.s, v: hsv.v },
                    { h: (hsv.h + 240) % 360, s: hsv.s, v: hsv.v }
                ];
                break;
            case 'monochromatic':
                colors = [
                    { h: hsv.h, s: hsv.s, v: Math.max(20, hsv.v - 40) },
                    { h: hsv.h, s: hsv.s, v: Math.max(40, hsv.v - 20) },
                    hsv,
                    { h: hsv.h, s: Math.max(0, hsv.s - 30), v: Math.min(100, hsv.v + 10) },
                    { h: hsv.h, s: Math.max(0, hsv.s - 50), v: Math.min(100, hsv.v + 20) }
                ];
                break;
            case 'shades':
                colors = [
                    { h: hsv.h, s: hsv.s, v: 20 },
                    { h: hsv.h, s: hsv.s, v: 40 },
                    { h: hsv.h, s: hsv.s, v: 60 },
                    { h: hsv.h, s: hsv.s, v: 80 },
                    { h: hsv.h, s: hsv.s, v: 100 }
                ];
                break;
        }
        
        colors.forEach(color => {
            const rgb = hsvToRgb(color.h, color.s, color.v);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            
            const colorDiv = document.createElement('div');
            colorDiv.className = 'harmony-color';
            colorDiv.style.backgroundColor = `#${hex}`;
            colorDiv.title = `#${hex}`;
            colorDiv.addEventListener('click', () => {
                currentColor = rgb;
                updateAllFormats();
            });
            
            const label = document.createElement('div');
            label.className = 'harmony-color-label';
            label.textContent = `#${hex}`;
            colorDiv.appendChild(label);
            
            harmonyColors.appendChild(colorDiv);
        });
    }

    // Palette Functions
    function addToPalette() {
        const hex = rgbToHex(currentColor.r, currentColor.g, currentColor.b);
        if (!savedColors.includes(hex)) {
            savedColors.push(hex);
            localStorage.setItem('colorPalette', JSON.stringify(savedColors));
            displaySavedColors();
            showAlert(tr('color.alert_added', 'Color added to palette!'), 'success');
        } else {
            showAlert(tr('color.alert_exists', 'Color already in palette'), 'info');
        }
    }

    function clearPalette() {
        if (confirm(tr('color.confirm_clear_palette', 'Are you sure you want to clear all saved colors?'))) {
            savedColors = [];
            localStorage.setItem('colorPalette', JSON.stringify(savedColors));
            displaySavedColors();
            showAlert(tr('color.alert_palette_cleared', 'Palette cleared'), 'success');
        }
    }

    function displaySavedColors() {
        if (savedColors.length === 0) {
            const emptyText = tr('color.no_saved', 'No saved colors yet. Click "Add to Palette" to save colors.');
            savedColorsContainer.innerHTML = `<div class="text-muted small">${emptyText}</div>`;
            return;
        }
        
        savedColorsContainer.innerHTML = '';
        savedColors.forEach((hex, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'saved-color';
            colorDiv.style.backgroundColor = `#${hex}`;
            colorDiv.title = `#${hex}`;
            colorDiv.addEventListener('click', () => {
                currentColor = hexToRgb(hex);
                updateAllFormats();
            });
            
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                savedColors.splice(index, 1);
                localStorage.setItem('colorPalette', JSON.stringify(savedColors));
                displaySavedColors();
            });
            
            colorDiv.appendChild(deleteBtn);
            savedColorsContainer.appendChild(colorDiv);
        });
    }

    function generateRandomColor() {
        currentColor = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
        updateAllFormats();
    }

    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 1500);
        } catch (error) {
            showAlert(tr('common.copy_error', tr('color.copy_failed', 'Failed to copy')), 'danger');
        }
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
});
