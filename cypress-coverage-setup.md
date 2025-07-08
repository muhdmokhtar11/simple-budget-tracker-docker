# Setting Up Cypress Frontend Code Coverage in CI/CD Pipeline

## Objective

Add reliable frontend code coverage reporting to our JHipster project's CI/CD pipeline using Cypress's runtime instrumentation approach.

## Key Requirements

### 1. Coverage Configuration

- Use `@cypress/code-coverage` for runtime instrumentation (no webpack modifications needed)
- Use existing `.nycrc.json` configuration:

```json
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "all": true,
  "include": ["src/main/webapp/app/**/*.{js,ts,tsx}"],
  "reporter": ["html", "lcov", "json", "text"],
  "report-dir": "target/cypress/coverage",
  "temp-dir": "target/cypress/.nyc_output"
}
```

### 2. Maven Build Control

- Add to pom.xml:

```xml
<properties>
  <skip.npm>false</skip.npm>
</properties>

<dependencyManagement>
    <dependencies>
        <!-- Fix dependency convergence warnings -->
        <dependency>
            <groupId>javax.xml.bind</groupId>
            <artifactId>jaxb-api</artifactId>
            <version>2.3.1</version>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-text</artifactId>
            <version>1.12.0</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

- Configure frontend-maven-plugin:

```xml
<configuration>
  <skip>${skip.npm}</skip>
</configuration>
```

### 3. Package.json Scripts

Update CI scripts:

```json
{
  "scripts": {
    "java:jar:e2e": "npm run java:jar -- -Pe2e,webapp",
    "ci:e2e:package": "npm run java:jar:e2e -Dskip.npm=true",
    "ci:e2e:prepare": "npm run ci:e2e:prepare:docker",
    "ci:e2e:prepare:docker": "npm run services:up --if-present && docker ps -a",
    "preci:e2e:server:start": "npm run services:db:await --if-present && npm run services:others:await --if-present",
    "ci:e2e:server:start": "java -jar target/e2e.jar --spring.profiles.active=e2e,$npm_package_config_default_environment -Dlogging.level.ROOT=OFF -Dlogging.level.tech.jhipster=OFF -Dlogging.level.com.mycompany.myapp=OFF -Dlogging.level.org.springframework=OFF -Dlogging.level.org.springframework.web=OFF -Dlogging.level.org.springframework.security=OFF --logging.level.org.springframework.web=ERROR",
    "ci:e2e:run": "npm run ci:server:await && npm run e2e:cypress:coverage",
    "ci:server:await": "echo \"Waiting for server at port $npm_package_config_backend_port to start\" && wait-on -t 180000 http-get://127.0.0.1:$npm_package_config_backend_port/management/health && echo \"Server at port $npm_package_config_backend_port started\"",
    "ci:e2e:report": "nyc report --reporter=html --reporter=text"
  },
  "config": {
    "backend_port": "8080",
    "default_environment": "prod"
  },
  "overrides": {
    "cypress-audit": {
      "lighthouse": "^10.0.0",
      "pa11y": "^7.0.0"
    },
    "sourcemap-istanbul-instrumenter-loader": {
      "loader-utils": "^2.0.0",
      "json5": "^2.0.0"
    }
  }
}
```

### 4. GitHub Workflow (.github/workflows/main.yml)

Required Steps (in exact order):

1. Setup Environment

   - Cache npm and Maven dependencies
   - Setup Node.js and Java versions
   - Install dependencies

2. Build & Test

```yaml
- name: Build Frontend
  run: npm run webapp:build:dev
  env:
    NODE_ENV: development

- name: Package Application
  run: npm run ci:e2e:package

- name: Start Backend Services
  run: |
    npm run ci:e2e:prepare
    npm run ci:e2e:server:start &
    echo "Waiting for backend server to start..."
    npm run ci:server:await
  env:
    SPRING_PROFILES_ACTIVE: e2e
    SPRING_DATASOURCE_URL: jdbc:mysql://localhost:3306/simple_budget_tracker?useUnicode=true&characterEncoding=utf8&useSSL=false&useLegacyDatetimeCode=false&serverTimezone=UTC&createDatabaseIfNotExist=true
    SPRING_DATASOURCE_USERNAME: root
    SPRING_DATASOURCE_PASSWORD: root

- name: Run E2E Tests with Coverage
  run: npm run e2e:cypress:coverage
  env:
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
    CYPRESS_RETRIES: 2

- name: Generate Coverage Report
  if: always()
  run: npm run ci:e2e:report

- name: Upload Coverage Reports
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: target/cypress/coverage/
```

## Implementation Notes

1. **Runtime Instrumentation**

   - Uses Cypress's built-in code coverage capabilities
   - No webpack configuration changes needed
   - More reliable than build-time instrumentation

2. **Test Reliability**

   - Includes retry mechanisms for flaky tests
   - Proper server health checks before running tests
   - Preserves source maps for accurate reporting

3. **Report Generation**

   - HTML reports for human readability
   - Text summary in CI logs
   - Reports preserved as build artifacts

4. **Error Handling**

   - Coverage reports generate even on test failure
   - Detailed error logging
   - Artifact preservation for failed runs

5. **Server Management**

   - Proper server startup sequence with health checks
   - Database and dependency services started first
   - Configurable timeouts for service availability
   - Background process management for the backend server
   - Environment-specific configuration handling

6. **Test Stability**

   - Added retries for potentially flaky tests
   - Explicit wait for server health check
   - Proper cleanup of background processes
   - Detailed logging for debugging CI issues

7. **Environment Configuration**

   - Explicit backend port configuration
   - Environment-specific database settings
   - Reduced logging noise in CI environment
   - Proper handling of Spring profiles

8. **Dependency Management**
   - Explicit version management for Maven dependencies
   - npm package overrides to resolve vulnerabilities
   - Updated testing dependencies to latest stable versions

## Success Criteria

- ✅ Coverage reports generated for all frontend code
- ✅ Reports available as build artifacts
- ✅ Coverage summary in CI logs
- ✅ Stable test execution in CI environment
- ✅ Proper server startup and health verification
- ✅ Clean dependency resolution without conflicts

## Troubleshooting

Common issues and solutions:

1. **Server Connection Issues**

   - Verify server health endpoint is accessible
   - Check for correct port configuration
   - Ensure database is running and accessible
   - Review server logs for startup errors

2. **Test Failures**

   - Check for environment-specific configurations
   - Review Cypress retry settings
   - Verify test data prerequisites
   - Examine browser console logs

3. **Coverage Issues**

   - Verify source map generation
   - Check instrumentation configuration
   - Review include/exclude patterns
   - Ensure proper file paths in reports

4. **Dependency Problems**
   - Update package overrides as needed
   - Check for conflicting versions
   - Review npm audit reports
   - Verify Maven dependency resolution
