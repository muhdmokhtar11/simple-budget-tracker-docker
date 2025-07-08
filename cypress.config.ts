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
      url: '/api/__coverage__',
      exclude: ['src/test/**/*', 'src/main/webapp/app/**/*.spec.ts', 'src/main/webapp/app/**/*.test.ts'],
    },
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    async setupNodeEvents(on, config) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return require('./src/test/javascript/cypress/plugins/index.ts').default(on, config);
    },
    baseUrl: 'http://localhost:8080/',
    specPattern: 'src/test/javascript/cypress/e2e/**/*.cy.ts',
    supportFile: 'src/test/javascript/cypress/support/index.ts',
  },
});
