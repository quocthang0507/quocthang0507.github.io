#!/bin/bash

echo "==================================="
echo "Running Tests for GitHub Pages Site"
echo "==================================="
echo ""

# Run unit tests
echo "1. Running Unit Tests..."
echo "-----------------------------------"
npm test 2>&1 | grep -E "(PASS|FAIL|Test Suites|Tests:|Snapshots)"
echo ""

# Check if Jekyll can build
echo "2. Checking Jekyll Build..."
echo "-----------------------------------"
export PATH="$HOME/.local/share/gem/ruby/3.2.0/bin:$PATH"
cd /home/runner/work/quocthang0507.github.io/quocthang0507.github.io
if bundle exec jekyll build > /tmp/jekyll-build.log 2>&1; then
    echo "✓ Jekyll build successful"
    echo "  Built $(find _site -type f | wc -l) files"
else
    echo "✗ Jekyll build failed"
    tail -20 /tmp/jekyll-build.log
fi
echo ""

# Check for common issues in JavaScript files
echo "3. Checking JavaScript Syntax..."
echo "-----------------------------------"
for jsfile in assets/js/*.js; do
    if node -c "$jsfile" 2>/dev/null; then
        echo "✓ $jsfile"
    else
        echo "✗ $jsfile has syntax errors"
    fi
done
echo ""

# Summary
echo "==================================="
echo "Test Summary Complete"
echo "==================================="
