#!/usr/bin/env node

/**
 * Security Scanning Script
 * 
 * This script runs various security checks against the codebase,
 * focusing on OWASP Top 10 vulnerabilities.
 * 
 * Usage:
 *   node scripts/security-scan.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Configuration
const config = {
  appUrl: 'http://localhost:3000',  // URL for app when running locally
  scanDir: path.resolve(__dirname, '..'),
  reportDir: path.resolve(__dirname, '../reports/security'),
  snykToken: process.env.SNYK_TOKEN,
};

// Create reports directory
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

console.log(`${colors.bold}${colors.blue}=== Table Stakes Security Scanner ====${colors.reset}\n`);
console.log(`${colors.yellow}Running security checks based on OWASP Top 10...${colors.reset}\n`);

async function runSecurityScans() {
  // Track overall status
  let failedChecks = 0;
  
  try {
    // 1. Dependency scanning (A9: Using Components with Known Vulnerabilities)
    console.log(`${colors.bold}[1/7]${colors.reset} Scanning dependencies for vulnerabilities...`);
    try {
      if (config.snykToken) {
        // If Snyk token is available, use Snyk for more comprehensive scanning
        execSync(`snyk test --json > "${path.join(config.reportDir, 'snyk-report.json')}"`, { stdio: 'inherit' });
      } else {
        // Fall back to npm audit if Snyk isn't configured
        execSync(`npm audit --json > "${path.join(config.reportDir, 'npm-audit.json')}"`, { stdio: 'inherit' });
      }
      console.log(`${colors.green}✓ Dependency scan completed${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Vulnerabilities found in dependencies${colors.reset}`);
      failedChecks++;
    }

    // 2. Security-focused linting (Various OWASP categories)
    console.log(`\n${colors.bold}[2/7]${colors.reset} Running security linting...`);
    try {
      execSync(`npx eslint --config=.eslintrc.security.js --ext .ts,.tsx,.js,.jsx --format json . > "${path.join(config.reportDir, 'eslint-security.json')}"`, { stdio: 'pipe' });
      console.log(`${colors.green}✓ Security linting passed${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Security linting found issues${colors.reset}`);
      failedChecks++;
    }

    // 3. SQL Injection Tests (A1: Injection)
    console.log(`\n${colors.bold}[3/7]${colors.reset} Running SQL injection tests...`);
    try {
      execSync(`npx jest --testPathPattern=security/sql-injection`, { stdio: 'inherit' });
      console.log(`${colors.green}✓ SQL injection tests passed${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ SQL injection tests failed${colors.reset}`);
      failedChecks++;
    }

    // 4. Secrets scanning (A3: Sensitive Data Exposure)
    console.log(`\n${colors.bold}[4/7]${colors.reset} Scanning for exposed secrets...`);
    try {
      // Basic grep for potential secrets in code
      // Note: In a real scenario, you would use a dedicated secrets scanner like GitLeaks
      const { stdout } = await exec(`grep -E "(password|secret|token|key).*[=:].*[\\\"\\'\\w]+" --include="*.{js,ts,tsx,json,env,env.example}" -r . | grep -v "node_modules" || echo "No secrets found"`);
      
      if (stdout.includes("No secrets found")) {
        console.log(`${colors.green}✓ No potential secrets found${colors.reset}`);
      } else {
        fs.writeFileSync(path.join(config.reportDir, 'potential-secrets.txt'), stdout);
        console.log(`${colors.red}✗ Potential secrets found in code${colors.reset}`);
        console.log(`${colors.yellow}  Details saved to reports/security/potential-secrets.txt${colors.reset}`);
        failedChecks++;
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error during secrets scanning${colors.reset}`);
      failedChecks++;
    }

    // 5. Content Security Policy Check (A7: XSS)
    console.log(`\n${colors.bold}[5/7]${colors.reset} Checking Content Security Policy...`);
    // In a real scenario, you would start the app and check the CSP headers
    console.log(`${colors.yellow}⚠ Content Security Policy check skipped - manual review required${colors.reset}`);

    // 6. CSRF Protection Check (A8: Cross-Site Request Forgery)
    console.log(`\n${colors.bold}[6/7]${colors.reset} Checking CSRF protections...`);
    // In a real scenario, you would verify that CSRF tokens are used properly
    console.log(`${colors.yellow}⚠ CSRF protection check skipped - manual review required${colors.reset}`);
    
    // 7. Authentication and Authorization Check (A2: Broken Authentication, A5: Broken Access Control)
    console.log(`\n${colors.bold}[7/7]${colors.reset} Checking authentication and authorization...`);
    // In a real scenario, you would check for proper auth implementation
    console.log(`${colors.yellow}⚠ Authentication/authorization check skipped - manual review required${colors.reset}`);

    // Summary
    console.log(`\n${colors.bold}${colors.blue}=== Security Scan Complete ====${colors.reset}`);
    if (failedChecks > 0) {
      console.log(`${colors.red}${failedChecks} check(s) failed. Review reports in the reports/security directory.${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`${colors.green}All automated checks passed! Remember to also perform manual security testing.${colors.reset}`);
      console.log(`${colors.yellow}Some checks were skipped and require manual review.${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}An unexpected error occurred during security scanning:${colors.reset}`, error);
    process.exit(1);
  }
}

runSecurityScans().catch(error => {
  console.error('Security scan failed:', error);
  process.exit(1);
});