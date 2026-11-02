#!/usr/bin/env node

/**
 * CSS Build Script
 * Compiles assets/css/main.scss (+ _sass partials) into assets/css/main.css.
 * Jekyll is configured to skip main.scss, so the committed main.css is what gets deployed.
 *
 * Usage: node scripts/build-css.js [--check]
 *   --check  Exit with an error if main.css is out of date instead of writing it
 */

const fs = require('fs');
const path = require('path');
const sass = require('sass');

const ROOT = path.join(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'assets', 'css');
const ENTRY = path.join(CSS_DIR, 'main.scss');
const OUTPUT = path.join(CSS_DIR, 'main.css');
const MAP_OUTPUT = `${OUTPUT}.map`;

// Strip the Jekyll front matter block, which Sass cannot parse
const source = fs.readFileSync(ENTRY, 'utf8').replace(/^---\r?\n(?:[\s\S]*?\r?\n)?---\r?\n/, '');

const result = sass.compileString(source, {
  url: new URL(`file://${ENTRY}`),
  loadPaths: [path.join(ROOT, '_sass')],
  style: 'compressed',
  sourceMap: true
});

// Make source map paths relative to the CSS file
result.sourceMap.sources = result.sourceMap.sources.map(src =>
  src.startsWith('file://') ? path.relative(CSS_DIR, new URL(src).pathname).split(path.sep).join('/') : src
);
result.sourceMap.sourceRoot = '';

const css = `${result.css}\n\n/*# sourceMappingURL=${path.basename(MAP_OUTPUT)} */`;
const map = JSON.stringify(result.sourceMap);

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
  if (current !== css) {
    console.error('❌ assets/css/main.css is out of date. Run: npm run build:css');
    process.exit(1);
  }
  console.log('✅ assets/css/main.css is up to date');
} else {
  fs.writeFileSync(OUTPUT, css);
  fs.writeFileSync(MAP_OUTPUT, map);
  console.log(`✅ Compiled ${path.relative(ROOT, ENTRY)} → ${path.relative(ROOT, OUTPUT)} (${css.length} bytes)`);
}
