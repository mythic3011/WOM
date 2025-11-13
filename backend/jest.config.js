export default {
  testEnvironment: 'node',
  transform: {},
  verbose: false,
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/services/**/*.js',
    '!src/**/index.js'
  ]
}
