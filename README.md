# Utility Hub — Useful Online Tools 🛠️✨

[![Jekyll Build](https://img.shields.io/badge/Jekyll-build--passing-brightgreen.svg)](https://quocthang0507.github.io)
[![PWA Installable](https://img.shields.io/badge/PWA-installable%20%26%20offline-blue.svg)](https://quocthang0507.github.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Multi-language](https://img.shields.io/badge/i18n-VI%20%7C%20EN%20%7C%20ZH%20%7C%20KO%20%7C%20JA-orange)](https://quocthang0507.github.io)

A fast, privacy-first collection of **26 online utilities and calendar/time tools** built with **Vanilla HTML/CSS/JavaScript**, **Jekyll**, and a custom **Neumorphic Design System**. The hub supports **5 languages**, installs cleanly as a **Progressive Web App (PWA)** on Desktop, Android, and iOS, and runs almost entirely client-side with offline support.

🔗 **Live Website:** [https://quocthang0507.github.io/](https://quocthang0507.github.io/)

---

## 🚀 Key Features & Built-in Tools

Every tool page includes a consistent **Usage Tips & Quick Info** guide and full Light/Dark Mode support.

### 📅 Calendar Suite (Shared `CalendarCore` Engine + Vietnam Holidays 2026)
1. **Daily Calendar — Vietnamese Lịch Bloc (`/daily-calendar/`):** Traditional tear-off bloc calendar UI featuring large sculptural solar/lunar dates, curated Wikimedia Commons *Featured Pictures of Vietnam*, 12 Zodiac emblems, Day/Month/Year/First-hour Can Chi, all 6 auspicious hours (*Giờ Hoàng Đạo*), daily proverbs, and a clickable 7-day strip.
2. **Weekly Calendar (`/weekly-calendar/`):** Detailed 7-day ISO week view (Mon–Sun) with lunar dates, Can Chi, auspicious ratings, and Vietnam holidays.
3. **Monthly Calendar (`/monthly-calendar/`):** Full lunar-solar monthly grid with ISO week numbers, inline holiday chips, Monday/Sunday week-start toggle, filters (Auspicious / Holidays), and monthly summaries.
4. **Yearly Calendar (`/yearly-calendar/`):** 12-month lunar-solar overview (1950–2100) with Can Chi, 60-year Five Elements (*Ngũ hành Nạp âm*, e.g. 2026 **Bính Ngọ — Thiên Hà Thủy**), Tết & lunar-year span, leap month info, and Vietnam's **2026 official holiday schedule** (including **Ngày Văn hóa Việt Nam — Nov 24** under Resolution 28/2026/QH16, substitute days, and makeup workdays).

### ⏱️ Time & Clocks (Shared `clock.js` Engine)
5. **Home — Digital Clock, Calendar & Quick Timers (`/`):** Real-time 12/24h digital clock, current solar/lunar calendar, quick stopwatch & countdown timer, and ISO week/day-of-year stats.
6. **Stopwatch (`/stopwatch/`):** Drift-free millisecond online stopwatch with Lap recording, fastest/slowest highlights, keyboard shortcuts (`Space`, `L`, `R`), fullscreen mode, and CSV export.
7. **Countdown Timer (`/countdown-timer/`):** Hours/minutes/seconds countdown with wall-clock accuracy, progress bar, Pomodoro presets, custom labels, and 4 offline Web Audio alarm tones.
8. **Alarm Clock (`/alarm-clock/`):** Multi-alarm browser clock persisted in `localStorage` with quick time presets, daily repeat, live countdown to next ring, 4 Web Audio ringtones, and 5-minute Snooze.
9. **World Clocks (`/world-clocks/`):** Live multi-city timezone dashboard with analog/digital views, city presets, and embeddable view.
10. **Date Calculator (`/date-calculator/`):** Date difference, add/subtract periods (month-end clamping), exact age with birthday countdown, and weekday / ISO week lookup.

### 🎲 Randomization
11. **Random Number Generator (`/random-number/`):** Custom ranges with unique/duplicate modes, statistics, dice presets, coin flips, and lottery draws.
12. **Random Wheel (`/random-wheel/`):** Decision spinner with 12 color themes, 8 spin durations (`2s`–`30s`), continuous edge-hover suspense effect (fair 50/50 hold or gentle tip-over), real-time slice-synced ticking & celebratory Web Audio sounds inspired by Wheel of Names, volume & preview controls, confetti, and spin history.

### ⚙️ Utilities & Developer Tools
13. **Delegate Nameplate Designer (`/delegate-nameplate/`):** Actual-size event, administrative, and office desk nameplate studio with 8 Vietnamese administrative/office quick templates, 3-tier layouts, custom borders & themes, multi-line role/organization support, logo upload, batch Excel/text ZIP export, and crisp SVG/PNG/JPG/Print output.
14. **Strong Password Generator (`/password-generator/`):** Cryptographically secure passwords via Web Crypto CSPRNG with entropy strength meter and local history.
15. **Unit Converter (`/unit-converter/`):** Length, weight, temperature, volume, area, speed, time, and data storage with live formula display and history.
16. **Currency Converter (`/currency-converter/`):** Live Vietcombank exchange rates with historical charts and offline snapshot fallback.
17. **Gold Price Tracker (`/gold-price/`):** Domestic (SJC, PNJ) and global gold price charts with timeline filtering and local history fallback.
18. **QR Code Generator (`/qr-generator/`):** Custom colors, dot/corner styles, logo overlays, WiFi/vCard formats, PNG/SVG export, and batch ZIP generation.
19. **Encoder / Decoder (`/encoder-decoder/`):** Local Base64, URL, and HTML entity encoding/decoding for text and files up to 10 MB.
20. **Hash Generator (`/hash-generator/`):** Local MD5, SHA-1, SHA-256, SHA-384, and SHA-512 digests for text or files up to 100 MB, with auto-expanding single/multi-line output boxes.
21. **Case Converter (`/case-converter/`):** Instant UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, and kebab-case conversion.
22. **Regex Tester (`/regex-tester/`):** Interactive JavaScript regular expression matcher with flags, syntax explanations, and live replacement preview.
23. **Markdown Preview (`/markdown-preview/`):** Real-time GitHub Flavored Markdown editor/previewer sanitized with DOMPurify and one-click HTML copy.
24. **LaTeX Editor (`/latex-editor/`):** MathJax-powered equation editor with symbol library, templates, auto-saved history, and crisp 2× black-on-white PNG export.
25. **Color Picker & Palette (`/color-picker/`):** Interactive color wheel, HEX/RGB/HSL/HSV/CMYK converter, harmonies, WCAG contrast checker, and CSS gradient builder.
26. **JSON Formatter & CSV Converter (`/json-formatter/`):** Format, minify, validate JSON, and bidirectionally convert JSON ↔ CSV.

---

## 📱 Progressive Web App (PWA) & UI Highlights
- **Installable App:** Valid `site.webmanifest` with `192×192`, `512×512`, and `maskable` PNG icons, multi-resolution `favicon.ico`, app shortcuts, active `beforeinstallprompt` install button, iOS Safari install guide, and dynamic `theme-color` syncing with Dark Mode.
- **Offline Ready:** Service Worker (`sw.js`) caches the app shell, core scripts, holiday JSON, and static CDN libraries (`cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, Google Fonts), with a dedicated `/offline.html` fallback and live update toast.
- **Neumorphism & Accessible Dark Mode:** WCAG AA verified contrast in both Light and Dark themes.
- **Command Palette:** Press `Cmd/Ctrl + K` anywhere to search and jump to any of the 26 tools.
- **5-Language i18n:** Client-side localization for Vietnamese (`vi`), English (`en`), Chinese (`zh`), Korean (`ko`), and Japanese (`ja`).

---

## 💻 Local Development & Build

### Prerequisites
- Ruby (with Bundler) for Jekyll local preview
- Node.js (v18+) for CSS compilation, JS minification, and tests

### Setup
```bash
git clone https://github.com/quocthang0507/quocthang0507.github.io.git
cd quocthang0507.github.io
bundle install
npm install
```

### Scripts
- **Compile SCSS (`_sass/` → `assets/css/main.css`):**
  ```bash
  npm run build:css
  npm run check:css
  ```
- **Minify JavaScript files (`assets/js/*.js` → `*.min.js`):**
  ```bash
  npm run minify:js
  ```
- **Run Jest unit test suite (13 suites / 69 tests):**
  ```bash
  npm test
  ```
- **Run Playwright E2E tests:**
  ```bash
  npx playwright test
  ```
- **Serve locally with Jekyll:**
  ```bash
  npm run serve
  # or: bundle exec jekyll serve
  ```

> A Husky `pre-commit` hook automatically minifies modified JS files, compiles SCSS, verifies `assets/css/main.css`, and runs `npm test` before every commit.

---

## 📁 Repository Structure

```text
.
├── _data/                  # Source data files (vietnam_holidays.json, gold/currency history)
├── _includes/              # Reusable partials (navigation, footer, tool-tips-card, calendar/time tabs)
├── _layouts/               # Core Jekyll layouts (default, compress)
├── _sass/                  # Modular Neumorphism SCSS (_variables, _base, _components, _dark, _navigation, ...)
├── assets/
│   ├── audio/              # Normalized 16-bit PCM audio assets
│   ├── css/                # Compiled main.css & delegate-nameplate.css
│   ├── data/               # Public JSON datasets (vietnam_holidays.json, rates)
│   ├── images/             # PNG/maskable PWA icons & favicons
│   └── js/                 # Shared engines (calendar-core, calendar-views, clock, pwa, i18n, tools)
│       └── languages/      # 5 locale dictionaries (vi, en, zh, ko, ja) + minified builds
├── scripts/                # Build scripts (build-css.js, minify-js.js)
├── tests/                  # Jest unit tests & Playwright E2E specs
├── daily-calendar.html     # Vietnamese Lịch Bloc daily calendar
├── weekly-calendar.html    # Weekly calendar
├── monthly-calendar.html   # Monthly calendar
├── yearly-calendar.html    # Yearly 12-month calendar
├── stopwatch.html          # Online Stopwatch
├── countdown-timer.html    # Online Countdown Timer
├── alarm-clock.html        # Online Alarm Clock
├── offline.html            # PWA offline fallback page
├── site.webmanifest        # PWA Web App Manifest
├── sw.js                   # Service Worker
└── package.json            # NPM scripts & tooling
```

---

## 🔒 Security & Privacy
Please see [SECURITY.md](SECURITY.md) for vulnerability reporting and security policy details (CSP headers, zero server-side tracking/processing, Consent Mode v2).

---
*Created by [@quocthang0507](https://github.com/quocthang0507). Issues and pull requests are welcome!*
