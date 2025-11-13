module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/unit/**/*.spec.js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.git/', '/tests/ui/', '/_site/'],
  collectCoverageFrom: [
    'assets/js/**/*.js',
    '!assets/js/languages/*.js', // Exclude language files
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleDirectories: ['node_modules', 'assets/js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
};
