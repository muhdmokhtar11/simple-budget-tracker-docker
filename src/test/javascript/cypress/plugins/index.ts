// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { lighthouse as lighthouseTask, pa11y as pa11yTask, prepareAudit as prepareAuditTask } from 'cypress-audit';
import codeCoverage from '@cypress/code-coverage/task';

export default (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  // Initialize code coverage plugin
  codeCoverage(on, config);

  on('before:browser:launch', (browser, launchOptions) => {
    prepareAuditTask(launchOptions);
    if (browser.name === 'chrome' && browser.isHeadless) {
      launchOptions.args.push('--disable-gpu');
      return launchOptions;
    }
  });

  // Allows logging with cy.task('log', 'message') or cy.task('table', object)
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    table(message) {
      console.table(message);
      return null;
    },
  });

  on('task', {
    lighthouse: lighthouseTask(async lighthouseReport => {
      const reportGenerator = await import('lighthouse/report/generator/report-generator.js');
      if (!existsSync('target/cypress/')) {
        mkdirSync('target/cypress/', { recursive: true });
      }
      writeFileSync('target/cypress/lhreport.html', reportGenerator.default.generateReport(lighthouseReport.lhr, 'html'));
    }),
    pa11y: pa11yTask(),
  });

  return config;
};
