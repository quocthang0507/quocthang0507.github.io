# Automatic Minification Setup

This project includes automatic minification of JavaScript files that runs in two scenarios:

## 🎯 When Does Minification Run?

### 1. **Pre-Commit Hook** (Local Development)
Minification runs automatically before every commit when JS files are changed.

#### How it works:
- When you commit changes to any `.js` file in `assets/js/`
- Husky runs the pre-commit hook
- The hook detects changed JS files
- Runs `npm run minify:js` to create `.min.js` versions
- Automatically stages the minified files
- Completes the commit with both original and minified files

#### Example:
```bash
# You edit assets/js/main.js
git add assets/js/main.js
git commit -m "Update main.js"

# Output:
# 🔨 JavaScript files changed, running minification...
# ✓ main.js → main.min.js (41.62% saved)
# ✅ Minified JS files added to commit
# ✅ Pre-commit checks passed!
```

### 2. **GitHub Actions** (CI/CD)
Minification runs automatically during the build process on GitHub.

#### How it works:
- Push or PR to the `main` branch triggers the workflow
- Node dependencies are installed (including Terser)
- `npm run minify:js` runs before Jekyll build
- Jekyll build uses the minified files in production
- Site is deployed with all optimizations

## 📋 Setup Instructions

### First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
   This automatically runs `npm run prepare` which sets up Husky hooks.

2. **Verify hook installation:**
   ```bash
   ls -la .husky/
   # Should show pre-commit file
   ```

### For New Contributors

When cloning the repository:

```bash
git clone <repository-url>
cd quocthang0507.github.io
npm install  # This sets up git hooks automatically
```

## 🛠️ Manual Minification

If you need to minify JS files manually:

```bash
npm run minify:js
```

## 📊 What Gets Minified?

- **All `.js` files** in `assets/js/` directory (excluding already minified `.min.js` files)
- **Average size reduction:** 42.86%
- **Process:** 
  - Dead code elimination
  - Variable name shortening
  - Whitespace and comment removal
  - Console logs preserved for debugging

## 🔧 Configuration

### Pre-commit Hook Location
`.husky/pre-commit`

### Minification Script
`scripts/minify-js.js`

### Package.json Scripts
```json
{
  "scripts": {
    "minify:js": "node scripts/minify-js.js",
    "build": "npm run minify:js && JEKYLL_ENV=production bundle exec jekyll build",
    "prepare": "husky"
  }
}
```

## ⚙️ How It Works Technically

### Pre-commit Hook Logic
```bash
1. Detects JS files in the staging area (git diff --cached)
2. Excludes already minified files (*.min.js)
3. If JS files found → runs minification
4. Stages the new .min.js files
5. Continues with commit
```

### GitHub Actions Workflow
```yaml
1. Checkout code
2. Setup Node.js (v18)
3. Install npm dependencies (npm ci)
4. Run minification (npm run minify:js)
5. Build Jekyll with JEKYLL_ENV=production
6. Deploy to GitHub Pages
```

## 🚫 Disabling Automatic Minification

### Temporarily Skip Pre-commit Hook
```bash
git commit --no-verify -m "Your message"
```

### Permanently Disable (Not Recommended)
Remove or rename the hook:
```bash
rm .husky/pre-commit
# or
mv .husky/pre-commit .husky/pre-commit.disabled
```

## 📝 Files Involved

- `.husky/pre-commit` - Git pre-commit hook
- `scripts/minify-js.js` - Minification script
- `.github/workflows/deploy.yml` - CI/CD workflow
- `package.json` - NPM scripts and dependencies

## 🐛 Troubleshooting

### Hook Not Running
```bash
# Reinstall hooks
npm run prepare

# Check if hook is executable
chmod +x .husky/pre-commit
```

### Minification Fails
```bash
# Check if terser is installed
npm list terser

# Reinstall if needed
npm install --save-dev terser
```

### Minified Files Not Staged
```bash
# The hook should auto-stage them, but you can manually stage:
git add assets/js/**/*.min.js
```

## ✅ Benefits

1. **Never forget to minify** - Automatic pre-commit hook ensures consistency
2. **Consistent builds** - GitHub Actions ensures deployed site is optimized
3. **Better performance** - 42.86% average file size reduction
4. **Environment-aware** - Development uses readable files, production uses minified
5. **Version controlled** - Both source and minified files are tracked

## 📚 Related Documentation

- [MINIFICATION_GUIDE.md](MINIFICATION_GUIDE.md) - Detailed minification guide
- [OPTIMIZATION.md](OPTIMIZATION.md) - General optimization strategies
- [Husky Documentation](https://typicode.github.io/husky/)
- [Terser Documentation](https://terser.org/)
