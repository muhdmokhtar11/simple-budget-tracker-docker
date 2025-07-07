import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  fixturesFolder: 'src/test/javascript/cypress/fixtures',
  screenshotsFolder: 'target/cypress/screenshots',
  downloadsFolder: 'target/cypress/downloads',
  videosFolder: 'target/cypress/videos',
  chromeWebSecurity: true,
  viewportWidth: 1200,
  viewportHeight: 720,
  retries: 2,
  scrollBehavior: 'center',
  env: {
    authenticationUrl: '/api/authenticate',
    jwtStorageName: 'jhi-authenticationToken',
    coverage: true,
    codeCoverage: {
      url: 'http://localhost:8080/__coverage__',
    },
    // Default test credentials (override with actual env vars if available)
    E2E_USERNAME: 'admin',
    E2E_PASSWORD: 'admin',
  },
  e2e: {
    async setupNodeEvents(on, config) {
      // Load code coverage plugin
      require('@cypress/code-coverage/task')(on, config);
      // Load existing plugins
      const existingConfig = (await import('./src/test/javascript/cypress/plugins/index')).default(on, config);
      // Merge configurations
      return { ...existingConfig, ...config };
    },
    baseUrl: 'http://localhost:8080/',
    specPattern: 'src/test/javascript/cypress/e2e/**/*.cy.ts',
    supportFile: 'src/test/javascript/cypress/support/index.ts',
    experimentalRunAllSpecs: true,
  },
});
