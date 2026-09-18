/**
 * Jest configuration for ToplineShop backend.
 *
 * This is the P7-008 Testing Foundation baseline. Future task scopes may
 * extend it (e.g., add coverage thresholds, integration test project, or
 * e2e setup) but must not silently weaken the contract below.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  // Default pattern: files named `*.spec.ts` anywhere under src/.
  testRegex: '.*\\.spec\\.ts$',
  // Exclude the dist/ build output and the node_modules tree.
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Keep test runs deterministic.
  randomize: false,
  // Surface meaningful failures; do not silently swallow.
  verbose: false,
  // Force Jest to leave compiled output out of the build dir.
  testTimeout: 10000,
};
