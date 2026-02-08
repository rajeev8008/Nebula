const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Exclude E2E tests (run separately with Playwright)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.next/',
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/ui/animated-shader-hero$': '<rootDir>/__mocks__/animated-shader-hero.js',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx}',
    'components/**/*.{js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  // Coverage thresholds (relaxed for development phase)
  coverageThreshold: {
    global: {
      branches: 3,
      functions: 6,
      lines: 10,
      statements: 10,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
