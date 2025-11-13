#!/bin/bash

echo "========================================="
echo "Console and HTML Validation Test Runner"
echo "========================================="
echo ""

# Set up paths
export PATH="$HOME/.local/share/gem/ruby/3.2.0/bin:$PATH"
cd /home/runner/work/quocthang0507.github.io/quocthang0507.github.io

# Kill any existing Jekyll servers
pkill -f "jekyll serve" 2>/dev/null
sleep 2

# Start Jekyll server in background
echo "Starting Jekyll server..."
nohup bundle exec jekyll serve --port 4000 --host 0.0.0.0 > /tmp/jekyll-console-test.log 2>&1 &
JEKYLL_PID=$!
echo "Jekyll PID: $JEKYLL_PID"

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:4000/ > /dev/null 2>&1; then
        echo "✓ Jekyll server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "✗ Jekyll server failed to start"
        cat /tmp/jekyll-console-test.log
        exit 1
    fi
    sleep 1
done

echo ""
echo "Running console validation tests..."
echo ""

# Run the tests
npx playwright test --config=playwright-noserver.config.js tests/ui/console-validation.spec.js

TEST_EXIT_CODE=$?

# Kill Jekyll server
echo ""
echo "Stopping Jekyll server..."
kill $JEKYLL_PID 2>/dev/null

exit $TEST_EXIT_CODE
