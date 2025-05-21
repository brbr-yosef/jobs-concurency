/**
 * JEST config with ESM
 */
export default {
  transform: {},

  testEnvironment: 'node',

  testMatch: [
    '**/tests/**/*.test.js',
  ],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/docs/**',
  ],

  testTimeout: 10000,

  verbose: true,

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
