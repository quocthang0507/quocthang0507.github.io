# Useful Online Tools & Utilities Hub 🛠️✨

[![Jekyll Build](https://img.shields.io/badge/Jekyll-build--passing-brightgreen.svg)](https://quocthang0507.github.io)
[![PWA Supported](https://img.shields.io/badge/PWA-offline--enabled-blue.svg)](https://quocthang0507.github.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Multi-language](https://img.shields.io/badge/i18n-VI%20%7C%20EN%20%7C%20ZH%20%7C%20KO%20%7C%20JA-orange)](https://quocthang0507.github.io)

A premium, modern collection of online utilities and productivity tools built with **Vanilla HTML/CSS/JavaScript**, **Jekyll**, and a custom **Neumorphic Design System**. The hub supports 5 languages and runs entirely in the browser, featuring full offline capability via Service Workers.

🔗 **Live Website:** [https://quocthang0507.github.io/](https://quocthang0507.github.io/)

---

## 🚀 Key Features & Built-in Tools

The hub is grouped into three main categories, offering **18 ready-to-use tools**:

### 🎲 Randomization
1. **Random Number Generator:** Generate unique or duplicate numbers within custom ranges with statistics, quick dice presets, coin flips, and lotto formats.
2. **Random Wheel:** Spin wheel selector for quick decisions with customizable names, color schemes, confetti effects, and spin statistics/history.
3. **Strong Password Generator:** Build secure, high-entropy passwords with custom parameters, strength levels, ambiguous character exclusion, and history log.

### ⏱️ Time & Date
4. **Digital Clock & Lunar Calendar:** Standard clock showing local solar time, current week/day numbers, and a fully interactive solar/lunar calendar.
5. **World Clocks:** Monitor times across multiple international cities concurrently with analog/digital hands and city presets.
6. **Date Calculator:** Calculate the precise duration between two dates, add or subtract days/weeks/months/years, and calculate exact age.

### ⚙️ Utilities & Developer Tools
7. **Unit Converter:** Convert units across length, weight, temperature, volume, area, speed, time, and data storage.
8. **Currency Converter:** Online currency converter using live exchange rates and historical trend charts from Vietcombank.
9. **Gold Price Tracker:** Domestic (SJC, PNJ) and global gold price chart viewer with timeline duration controls.
10. **QR Code Generator:** Custom QR code builder with colors, error correction levels, corner styles, custom logo overlays, and batch generation.
11. **Encoder/Decoder:** Safe, local base64, URL, and HTML entity encoder/decoder supporting both text input and files up to 10MB.
12. **Hash Generator:** Calculate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes locally on text or files up to 100MB.
13. **Case Converter:** Change text casing to UPPERCASE, lowercase, camelCase, snake_case, PascalCase, or sentence case with acronym preservation.
14. **Regex Tester:** Visual regular expression matcher and editor with flags, replacements, and quick explanations.
15. **Markdown Preview:** Real-time Markdown syntax editor and HTML formatter/previewer with one-click HTML copy.
16. **LaTeX Editor:** Write and render complex mathematical formulas in LaTeX with symbols references, templates, and image output (PNG/SVG).
17. **Color Picker & Palette:** Interactive color wheel and harmonies generator, WCAG contrast ratio checker, and CSS gradient builder.
18. **JSON Formatter & CSV Converter:** Beautify, validate, and minify JSON data, or bidirectionally convert between JSON and CSV.

---

## 🎨 Premium UI & Accessibility
- **Neumorphism Design System:** Harmonious HSL colors, deep inset and flat drop shadows, and responsive glassmorphism menus.
- **Unified Dark Mode:** Instant toggle between light and dark modes, fully integrated across charts, inputs, and components.
- **Command Palette:** Quick navigate anywhere on the site by pressing `Cmd/Ctrl + K` (includes search matching and arrow navigation).
- **Smooth Animations:** Glow-in animations for active states, red alert pulses for low timer counts, and rotating hover transitions.

---

## 🛠️ Architecture & Tech Stack

- **Static Site Generator:** [Jekyll](https://jekyllrb.com/) (configured for production-level Sass minification and HTML compression).
- **Styling:** Custom SCSS/CSS using Bootstrap 5 layout grid and neumorphic design components.
- **Offline Shell (PWA):** Custom Service Worker (`sw.js`) with a *Stale-While-Revalidate* strategy.
- **Multilingual System (i18n):** Proprietary JSON translation system supporting Vietnamese (`vi`), English (`en`), Chinese (`zh`), Korean (`ko`), and Japanese (`ja`).
- **Data Safety:** Zero server-side processing. All computations, hashing, QR rendering, and encoding occur 100% locally in the browser.

---

## 💻 Local Development & Build

### Prerequisites
- Ruby (with Bundler)
- Node.js (for minification and tests)

### Setup & Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/quocthang0507/quocthang0507.github.io.git
   cd quocthang0507.github.io
   ```
2. Install Ruby dependencies:
   ```bash
   bundle install
   ```
3. Install Node.js tools:
   ```bash
   npm install
   ```

### Development Commands
- **Minify Javascript files:**
  ```bash
  npm run minify:js
  ```
- **Start Jekyll dev server locally:**
  ```bash
  npm run serve
  # or: bundle exec jekyll serve
  ```
- **Build production bundle:**
  ```bash
  npm run build
  ```
- **Run JS unit tests (Jest):**
  ```bash
  npm run test
  ```

---

## 📁 Repository Structure

```
.
├── _includes/              # HTML layout components (navigation, footer, etc.)
├── _layouts/               # Core Jekyll page layouts
├── _sass/                  # Modular Sass styling files
├── assets/
│   ├── css/                # Main stylesheets (main.css generated from main.scss)
│   ├── images/             # Icons, logos, and PWA assets
│   └── js/                 # Tool logic scripts and translation files
│       └── languages/      # i18n locale scripts (en.js, vi.js, etc.)
├── scripts/                # Utility scripts (terser JS minification)
├── tests/                  # Unit and integration tests (Jest / Playwright)
├── index.html              # Main homepage entrypoint
├── sw.js                   # Service Worker script
└── package.json            # NPM configuration and dev scripts
```

---

## 🔒 Security
Please refer to [SECURITY.md](file:///Users/quocthang0507/GitHub/quocthang0507.github.io/SECURITY.md) for vulnerability reporting guidelines and details on implemented security headers (CSP, HSTS, X-Content-Type-Options).

---
*Created by [@quocthang0507](https://github.com/quocthang0507). Feel free to submit an issue or pull request!*
