module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'assets/js/**/*.js',
    '!assets/js/languages/*.js', // Exclude language files
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleDirectories: ['node_modules', 'assets/js'],
  testPathIgnorePatterns: ['/node_modules/', '/.git/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
};
