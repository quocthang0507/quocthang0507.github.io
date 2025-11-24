#!/usr/bin/env node

/**
 * JavaScript Minification Script
 * Minifies all JavaScript files in assets/js directory
 * Creates .min.js versions alongside original files
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuration
const JS_DIR = path.join(__dirname, '..', 'assets', 'js');
const EXCLUDED_PATTERNS = [
  /\.min\.js$/,           // Already minified
  /node_modules/,          // Dependencies
  /vendor/,                // Vendor files
];

// Files to skip (language files can be minified but are optional)
const SKIP_FILES = [
  // Add any files you want to skip here
];

/**
 * Check if file should be processed
 */
function shouldProcess(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip if in excluded list
  if (SKIP_FILES.includes(fileName)) {
    return false;
  }
  
  // Skip if matches excluded patterns
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get all JS files recursively
 */
function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getJsFiles(filePath, fileList);
    } else if (file.endsWith('.js') && shouldProcess(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Minify a single JS file
 */
async function minifyFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`Minifying: ${fileName}`);
    
    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false,  // Keep console.log for debugging
        drop_debugger: true,
        keep_classnames: false,
        keep_fnames: false,
      },
      mangle: {
        toplevel: false,
        keep_classnames: false,
        keep_fnames: false,
      },
      format: {
        comments: false,  // Remove comments
      },
      sourceMap: false,
    });
    
    if (result.code) {
      // Create minified version
      const minFilePath = filePath.replace(/\.js$/, '.min.js');
      fs.writeFileSync(minFilePath, result.code, 'utf8');
      
      // Calculate compression ratio
      const originalSize = Buffer.byteLength(code, 'utf8');
      const minifiedSize = Buffer.byteLength(result.code, 'utf8');
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
      
      console.log(`  ✓ ${fileName} → ${path.basename(minFilePath)}`);
      console.log(`    Original: ${formatBytes(originalSize)} | Minified: ${formatBytes(minifiedSize)} | Saved: ${savings}%`);
      
      return { success: true, file: fileName, savings };
    } else {
      console.error(`  ✗ Failed to minify ${fileName}`);
      return { success: false, file: fileName };
    }
  } catch (error) {
    console.error(`  ✗ Error minifying ${filePath}:`, error.message);
    return { success: false, file: path.basename(filePath), error: error.message };
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting JavaScript minification...\n');
  
  if (!fs.existsSync(JS_DIR)) {
    console.error(`Error: Directory not found: ${JS_DIR}`);
    process.exit(1);
  }
  
  const jsFiles = getJsFiles(JS_DIR);
  
  if (jsFiles.length === 0) {
    console.log('No JavaScript files found to minify.');
    return;
  }
  
  console.log(`Found ${jsFiles.length} JavaScript file(s) to minify.\n`);
  
  const results = [];
  for (const file of jsFiles) {
    const result = await minifyFile(file);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Minification Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`  ✓ Successfully minified: ${successful}`);
  if (failed > 0) {
    console.log(`  ✗ Failed: ${failed}`);
  }
  
  if (successful > 0) {
    const avgSavings = (results
      .filter(r => r.success && r.savings)
      .reduce((sum, r) => sum + parseFloat(r.savings), 0) / successful
    ).toFixed(2);
    console.log(`  📉 Average size reduction: ${avgSavings}%`);
  }
  
  console.log('\n✨ Minification complete!');
}

// Check if terser is installed
try {
  require.resolve('terser');
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
} catch (e) {
  console.error('❌ Error: terser is not installed.');
  console.error('Please run: npm install --save-dev terser');
  process.exit(1);
}
