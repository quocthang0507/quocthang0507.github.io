# Testing Documentation

This document describes the testing infrastructure and procedures for the GitHub Pages website.

## Overview

The project now includes comprehensive testing for both JavaScript functions and UI components:
- **Unit Tests**: Testing core JavaScript functions using Jest
- **UI Tests**: Testing user interface and interactions using Playwright
- **Build Tests**: Verifying Jekyll site builds successfully

## Test Structure

```
tests/
├── setup.js                    # Jest test setup and mocks
├── unit/                       # Unit tests
│   ├── main.test.js           # Utility function tests
│   ├── random-number.test.js  # Random number generator tests
│   └── password-generator.test.js # Password generator tests
└── ui/                        # UI/E2E tests
    └── basic-ui.spec.js       # Playwright UI tests
```

## Running Tests

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests in watch mode (for development):
```bash
npm run test:watch
```

Run tests with coverage report:
```bash
npm run test:coverage
```

### UI Tests

Run Playwright UI tests:
```bash
npm run test:ui
```

Run UI tests in headed mode (see the browser):
```bash
npm run test:ui:headed
```

Debug UI tests:
```bash
npm run test:ui:debug
```

### All Tests

Run both unit and UI tests:
```bash
npm run test:all
```

### Quick Test Script

A convenience script is provided that runs unit tests, checks Jekyll build, and validates JavaScript syntax:
```bash
./run-tests.sh
```

## Test Coverage

### Unit Tests (41 tests passing)

1. **Utility Functions** (`main.test.js`)
   - Alert display functionality
   - Clipboard operations
   - LocalStorage read/write operations
   - Dark mode toggle functionality

2. **Random Number Generator** (`random-number.test.js`)
   - Number generation within specified range
   - Multiple number generation
   - Unique number generation
   - Input validation (min/max, count limits)
   - History management (save, delete, limit to 50 items)
   - Statistics calculation (most common number)
   - Quick pick presets validation
   - Exclude history feature

3. **Password Generator** (`password-generator.test.js`)
   - Character set building (uppercase, lowercase, numbers, symbols)
   - Ambiguous character exclusion
   - Password generation with specified length
   - No-duplicate password generation
   - Character type enforcement
   - Password strength calculation (length, complexity, variety scores)
   - Option validation
   - Password history management (limit to 10 items)

### UI Tests

1. **Navigation Test Page**
   - Page loading and element visibility
   - URL display functionality

2. **Random Number Generator UI**
   - Form interaction and number generation
   - Input validation
   - Multiple number generation
   - Result display

3. **Password Generator UI**
   - Auto-generation on page load
   - Manual generation
   - Length adjustment
   - Password display

4. **Random Wheel UI**
   - Name addition and display
   - Name validation
   - List management

5. **Index Page (Home)**
   - Clock display and time updates
   - Calendar display
   - Time format toggle
   - Stopwatch/Timer controls

## Test Configuration Files

- `jest.config.js`: Jest configuration for unit tests
- `playwright.config.js`: Playwright configuration for UI tests
- `tests/setup.js`: Test environment setup and global mocks
- `package.json`: Test scripts and dependencies

## Dependencies

### Testing Libraries
- **Jest** (v29.7.0): JavaScript testing framework
- **jest-environment-jsdom** (v29.7.0): DOM environment for Jest
- **@playwright/test** (v1.40.0): End-to-end testing framework

### Development Tools
- **@types/jest** (v29.5.11): TypeScript types for Jest (IDE support)

## Continuous Integration

The test suite is designed to be run in CI/CD environments. Key features:
- Jekyll build validation
- JavaScript syntax checking
- Unit test execution
- UI test execution with headless browser
- Test failure reporting

## Known Issues and Limitations

### Sass Deprecation Warnings
The Jekyll build shows deprecation warnings about Sass @import rules. These are warnings from the CSS framework and don't affect functionality. They will be addressed in a future update when migrating to the newer `@use` syntax.

### CSS File Conflict
There's a conflict warning about `main.css` being generated from both `main.scss` and an existing `main.css`. This is a Jekyll configuration issue that doesn't affect the site's operation but should be resolved by removing the duplicate file.

## Future Improvements

1. **Add More UI Tests**
   - QR Generator functionality
   - Unit Converter functionality
   - World Clocks functionality
   - Complete user workflows

2. **Integration Tests**
   - Cross-page navigation
   - LocalStorage persistence across pages
   - Multi-language support testing

3. **Accessibility Tests**
   - ARIA label validation
   - Keyboard navigation
   - Screen reader compatibility

4. **Performance Tests**
   - Page load times
   - JavaScript execution performance
   - Memory usage

5. **Visual Regression Tests**
   - Screenshot comparison
   - Layout consistency across browsers

## Troubleshooting

### Unit Tests Failing
- Check if Node.js and npm are installed correctly
- Run `npm install` to ensure all dependencies are installed
- Clear Jest cache: `npx jest --clearCache`

### UI Tests Failing
- Ensure Jekyll server can start: `bundle exec jekyll serve`
- Check if port 4000 is available
- Install Playwright browsers: `npx playwright install`

### Jekyll Build Errors
- Run `bundle install` to install Ruby dependencies
- Check Ruby version: `ruby --version` (should be 3.x)
- Verify Gemfile dependencies are correct

## Contributing

When adding new features:
1. Write unit tests for new JavaScript functions
2. Add UI tests for new pages or interactions
3. Run all tests before submitting changes
4. Update this documentation if adding new test categories

## Test Results Summary

Latest test run results:
- ✅ **41/41 unit tests passing**
- ✅ **Jekyll build successful** (61 files generated)
- ✅ **All JavaScript files syntax valid**
- ✅ **Zero critical errors found**
