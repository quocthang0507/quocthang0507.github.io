# Minification Setup - Quick Start Guide

## What Was Added

✅ **HTML Compression** - Automatic via Jekyll plugin  
✅ **CSS Minification** - Automatic via SASS compression  
✅ **JavaScript Minification** - Via npm script  
✅ **GitHub Actions** - Automated build & deployment

## Installation

### 1. Install Ruby Dependencies

```bash
bundle install
```

This installs the `jekyll-compress-html` plugin.

### 2. Install Node Dependencies (for JS minification)

```bash
npm install
npm install --save-dev terser
```

## Usage

### Local Development (Uncompressed)

```bash
# Serve with live reload (CSS minified, HTML/JS uncompressed)
npm run serve
# or
bundle exec jekyll serve
```

### Production Build (Everything Minified)

```bash
# Build with all optimizations
npm run build
```

This will:
1. Minify all JavaScript files (creates .min.js versions)
2. Build Jekyll site with HTML compression and CSS minification

### Just Minify JavaScript

```bash
npm run minify:js
```

## What Gets Minified

### HTML (Automatic)
- ✅ Removes whitespace between tags
- ✅ Removes HTML comments
- ✅ Removes optional closing tags
- ✅ Only in production environment

### CSS (Automatic)
- ✅ Removes whitespace and comments
- ✅ Shortens property names
- ✅ Combines rules
- ✅ Always minified (change in `_config.yml` if needed)

### JavaScript (Manual Trigger)
- ✅ Removes whitespace and comments
- ✅ Shortens variable names
- ✅ Dead code elimination
- ✅ Creates `.min.js` files alongside originals

## Files Modified

```
_config.yml                 # Added HTML compression & CSS settings
Gemfile                     # Added jekyll-compress-html plugin
_layouts/default.html       # Uses compress layout
_layouts/compress.html      # HTML compression layout (new)
package.json                # Added minification scripts
scripts/minify-js.js        # JS minification script (new)
.github/workflows/deploy.yml # Automated deployment (new)
```

## GitHub Pages Deployment

### Option 1: Use GitHub Actions (Recommended)

1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to main branch - automatic build & deploy!

The workflow will:
- Install dependencies
- Minify JavaScript
- Build Jekyll with compression
- Deploy to GitHub Pages

### Option 2: Standard GitHub Pages

If you prefer standard GitHub Pages (without Actions):
1. Keep Source as "Deploy from a branch"
2. HTML compression will work automatically
3. CSS minification will work automatically
4. JS minification must be done manually before commit:
   ```bash
   npm run minify:js
   git add assets/js/**/*.min.js
   git commit -m "Update minified JS"
   ```

## Testing Optimization

After deployment, test your site:

```bash
# Google Lighthouse (Chrome DevTools)
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run audit

# Or use online tools:
- https://pagespeed.web.dev/
- https://gtmetrix.com/
```

## Troubleshooting

### HTML not compressed?
- Check JEKYLL_ENV is set to "production"
- Verify `_layouts/default.html` has `layout: compress` in front matter

### CSS not minified?
- Check `_config.yml` has `sass: style: compressed`

### JS minification fails?
- Ensure terser is installed: `npm install --save-dev terser`
- Check for syntax errors in JS files
- Run with: `node scripts/minify-js.js` to see errors

### GitHub Actions not running?
- Ensure workflow file is in `.github/workflows/`
- Check Actions tab in repository for errors
- Verify GitHub Pages source is set to "GitHub Actions"

## Performance Tips

1. **Use minified files in production**
   - Update HTML to reference `.min.js` files
   - Use conditional logic: `{% if jekyll.environment == "production" %}`

2. **Optimize images**
   - Use WebP format
   - Compress before uploading
   - Add lazy loading: `loading="lazy"`

3. **Leverage CDN**
   - Use CDN for libraries (Bootstrap, Font Awesome)
   - Enable caching headers

4. **Reduce HTTP requests**
   - Combine CSS files
   - Combine JS files where possible
   - Use CSS sprites for icons

## Rollback

To disable minification:

```yaml
# _config.yml
sass:
  style: expanded  # CSS readable

compress_html:
  ignore:
    envs: [production, development]  # Disable HTML compression
```

## Need Help?

- [Jekyll Compress HTML](https://github.com/penibelst/jekyll-compress-html)
- [Terser Documentation](https://terser.org/)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
