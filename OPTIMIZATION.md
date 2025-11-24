# Performance Optimization Setup

This site uses several optimization techniques to improve loading speed and performance.

## Minification & Compression

### 1. **HTML Compression**
- Plugin: `jekyll-compress-html`
- Removes whitespace, comments, and unnecessary characters
- Configured in `_config.yml` under `compress_html`
- Applied via `_layouts/compress.html`

### 2. **CSS Minification**
- SASS/SCSS automatically compressed
- Configuration: `sass: style: compressed` in `_config.yml`
- Removes whitespace, comments, and shortens property names

### 3. **JavaScript**
For JavaScript minification, you have several options:

#### Option A: Manual Minification (Recommended for GitHub Pages)
Use online tools or local minifiers before committing:
- [JavaScript Minifier](https://www.toptal.com/developers/javascript-minifier)
- [UglifyJS](https://github.com/mishoo/UglifyJS)
- [Terser](https://github.com/terser/terser)

```bash
# Using Terser locally
npm install -g terser
terser assets/js/main.js -o assets/js/main.min.js -c -m
```

#### Option B: Build Process (For Local Development)
Create a build script using Node.js:

```bash
# Install dependencies
npm install --save-dev terser glob

# Run minification
npm run build
```

See `package.json` for build scripts.

#### Option C: GitHub Actions (Automated)
Use GitHub Actions to minify on push (requires Actions setup).

## Current Setup

### Files Configured:
- ✅ `_config.yml` - HTML compression & CSS minification
- ✅ `Gemfile` - Added jekyll-compress-html plugin
- ✅ `_layouts/compress.html` - HTML compression layout
- ✅ `_layouts/default.html` - Uses compress layout

### To Install Plugins:
```bash
bundle install
```

### To Build Locally:
```bash
# Development (uncompressed)
JEKYLL_ENV=development bundle exec jekyll serve

# Production (compressed)
JEKYLL_ENV=production bundle exec jekyll build
```

## Production Build

When GitHub Pages builds your site, it will automatically:
1. Compress all HTML files
2. Minify all CSS/SCSS files
3. Remove comments and whitespace

## Performance Tips

1. **Images**: Optimize images before uploading
   - Use WebP format when possible
   - Compress with tools like TinyPNG or ImageOptim

2. **Fonts**: Use system fonts or subset custom fonts

3. **Lazy Loading**: Add `loading="lazy"` to images

4. **Caching**: Leverage browser caching (configured via headers)

5. **CDN**: Consider using CDN for external libraries

## Verification

Test your site's performance:
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

## Notes

- HTML compression only works in `production` environment
- CSS is always compressed (change `style: compressed` to `style: expanded` for development)
- JavaScript minification must be done manually or via build process
