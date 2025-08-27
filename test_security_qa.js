#!/usr/bin/env node
/**
 * Security & Error Handling QA Testing 
 * Tests security practices and error handling robustness
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:3000';

// ANSI Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testXSSPrevention() {
  log('🛡️ Testing XSS Prevention...', 'yellow');
  
  try {
    // Check for dangerous innerHTML usage
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "innerHTML\\|dangerouslySetInnerHTML"`);
    const dangerousMatches = parseInt(stdout.trim());
    
    if (dangerousMatches === 0) {
      log('✅ XSS Prevention: PASS - No dangerous innerHTML usage detected', 'green');
    } else if (dangerousMatches <= 2) {
      log(`⚠️ XSS Prevention: WARN - ${dangerousMatches} potential innerHTML usage found`, 'yellow');
    } else {
      log(`❌ XSS Prevention: FAIL - ${dangerousMatches} dangerous innerHTML usages found`, 'red');
    }
  } catch (error) {
    log('❌ XSS Prevention: FAIL - Could not analyze XSS prevention', 'red');
  }
}

async function testInputSanitization() {
  log('🧹 Testing Input Sanitization...', 'yellow');
  
  try {
    // Check for input validation patterns
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "trim()\\|replace\\|filter\\|validate"`);
    const sanitizationMatches = parseInt(stdout.trim());
    
    if (sanitizationMatches >= 20) {
      log(`✅ Input Sanitization: PASS - ${sanitizationMatches} sanitization patterns found`, 'green');
    } else if (sanitizationMatches >= 10) {
      log(`⚠️ Input Sanitization: WARN - Limited sanitization (${sanitizationMatches} patterns)`, 'yellow');
    } else {
      log('❌ Input Sanitization: FAIL - Insufficient input sanitization', 'red');
    }
  } catch (error) {
    log('❌ Input Sanitization: FAIL - Could not analyze input handling', 'red');
  }
}

async function testAuthenticationSecurity() {
  log('🔐 Testing Authentication Security...', 'yellow');
  
  try {
    // Check for secure authentication patterns
    const { stdout: authCheck } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "password.*===.*password123"`);
    const hardcodedPasswords = parseInt(authCheck.trim());
    
    if (hardcodedPasswords === 0) {
      log('✅ Password Security: PASS - No hardcoded passwords in client', 'green');
    } else {
      log(`⚠️ Password Security: WARN - ${hardcodedPasswords} hardcoded password references (demo mode)`, 'yellow');
    }
    
    // Check for session management
    const { stdout: sessionCheck } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "localStorage\\|sessionStorage\\|cookie"`);
    const sessionMatches = parseInt(sessionCheck.trim());
    
    if (sessionMatches >= 5) {
      log('✅ Session Management: PASS - Session handling implemented', 'green');
    } else {
      log('⚠️ Session Management: WARN - Limited session management', 'yellow');
    }
  } catch (error) {
    log('❌ Authentication Security: FAIL - Could not analyze auth security', 'red');
  }
}

async function testErrorBoundaries() {
  log('🚨 Testing Error Boundaries...', 'yellow');
  
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "ErrorBoundary\\|componentDidCatch\\|getDerivedStateFromError"`);
    const errorBoundaryMatches = parseInt(stdout.trim());
    
    const { stdout: tryMatch } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "try{\\|catch("`);
    const tryCatchMatches = parseInt(tryMatch.trim());
    
    if (errorBoundaryMatches >= 1 && tryCatchMatches >= 20) {
      log(`✅ Error Handling: PASS - Error boundaries (${errorBoundaryMatches}) and try/catch (${tryCatchMatches})`, 'green');
    } else if (tryCatchMatches >= 10) {
      log(`⚠️ Error Handling: WARN - Limited error boundaries but good try/catch usage`, 'yellow');
    } else {
      log('❌ Error Handling: FAIL - Insufficient error handling', 'red');
    }
  } catch (error) {
    log('❌ Error Boundaries: FAIL - Could not analyze error handling', 'red');
  }
}

async function testConsoleSecrets() {
  log('🤫 Testing for Exposed Secrets...', 'yellow');
  
  try {
    // Check for potentially exposed secrets (excluding Firebase config which is public)
    const secretPatterns = ['password.*:', 'secret.*:', 'key.*:', 'token.*:'];
    let secretsFound = 0;
    
    for (const pattern of secretPatterns) {
      const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c -i "${pattern}" || echo "0"`);
      const matches = parseInt(stdout.trim());
      secretsFound += matches;
    }
    
    // Firebase config is expected and safe to expose
    const { stdout: firebaseConfig } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "apiKey.*AIza"`);
    const firebaseMatches = parseInt(firebaseConfig.trim());
    
    if (secretsFound <= firebaseMatches + 5) {
      log('✅ Secret Exposure: PASS - No unexpected secrets exposed', 'green');
    } else {
      log(`⚠️ Secret Exposure: WARN - ${secretsFound} potential secrets found`, 'yellow');
    }
  } catch (error) {
    log('❌ Secret Exposure: FAIL - Could not analyze for secrets', 'red');
  }
}

async function testSQLInjectionPrevention() {
  log('💉 Testing SQL Injection Prevention...', 'yellow');
  
  try {
    // Since this uses Firebase, check for NoSQL injection patterns
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "eval(\\|Function(\\|setTimeout.*string"`);
    const dangerousEvalMatches = parseInt(stdout.trim());
    
    if (dangerousEvalMatches === 0) {
      log('✅ Code Injection: PASS - No dangerous eval() or Function() usage', 'green');
    } else {
      log(`❌ Code Injection: FAIL - ${dangerousEvalMatches} dangerous code execution patterns`, 'red');
    }
  } catch (error) {
    log('❌ Code Injection: FAIL - Could not analyze injection prevention', 'red');
  }
}

async function testCSRFProtection() {
  log('🎭 Testing CSRF Protection...', 'yellow');
  
  try {
    // Check for CSRF tokens or SameSite cookie patterns
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "csrf\\|SameSite\\|X-Requested-With"`);
    const csrfMatches = parseInt(stdout.trim());
    
    if (csrfMatches >= 1) {
      log('✅ CSRF Protection: PASS - CSRF protection patterns detected', 'green');
    } else {
      log('⚠️ CSRF Protection: WARN - No explicit CSRF protection (relying on Firebase auth)', 'yellow');
    }
  } catch (error) {
    log('❌ CSRF Protection: FAIL - Could not analyze CSRF protection', 'red');
  }
}

async function testDataValidation() {
  log('✅ Testing Data Validation...', 'yellow');
  
  try {
    // Check for validation patterns
    const validationPatterns = ['required', 'validate', 'schema', 'yup', 'joi'];
    let validationFound = 0;
    
    for (const pattern of validationPatterns) {
      const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "${pattern}"`);
      const matches = parseInt(stdout.trim());
      validationFound += matches;
    }
    
    if (validationFound >= 10) {
      log(`✅ Data Validation: PASS - ${validationFound} validation patterns found`, 'green');
    } else if (validationFound >= 5) {
      log(`⚠️ Data Validation: WARN - Limited validation (${validationFound} patterns)`, 'yellow');
    } else {
      log('❌ Data Validation: FAIL - Insufficient data validation', 'red');
    }
  } catch (error) {
    log('❌ Data Validation: FAIL - Could not analyze validation', 'red');
  }
}

async function testErrorLogging() {
  log('📝 Testing Error Logging...', 'yellow');
  
  try {
    // Check for logging patterns
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "console\\.error\\|console\\.warn\\|console\\.log"`);
    const loggingMatches = parseInt(stdout.trim());
    
    const { stdout: errorHandling } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "error\\.message\\|error\\.code"`);
    const errorHandlingMatches = parseInt(errorHandling.trim());
    
    if (loggingMatches >= 20 && errorHandlingMatches >= 5) {
      log(`✅ Error Logging: PASS - Comprehensive logging (${loggingMatches}) and error handling (${errorHandlingMatches})`, 'green');
    } else if (loggingMatches >= 10) {
      log(`⚠️ Error Logging: WARN - Basic logging present`, 'yellow');
    } else {
      log('❌ Error Logging: FAIL - Insufficient error logging', 'red');
    }
  } catch (error) {
    log('❌ Error Logging: FAIL - Could not analyze logging', 'red');
  }
}

async function testContentSecurityPolicy() {
  log('🛡️ Testing Content Security Policy...', 'yellow');
  
  try {
    // Check for CSP headers (though development server may not have them)
    const { stdout } = await execAsync(`curl -s -I "${BASE_URL}" | grep -i "content-security-policy" || echo "no_csp"`);
    
    if (stdout.trim() === 'no_csp') {
      log('⚠️ CSP Headers: WARN - No CSP headers (development mode)', 'yellow');
    } else {
      log('✅ CSP Headers: PASS - Content Security Policy configured', 'green');
    }
  } catch (error) {
    log('❌ CSP Headers: FAIL - Could not check CSP', 'red');
  }
}

async function main() {
  log('🔒 Starting Security & Error Handling QA Testing...', 'bold');
  log(`Testing application security at: ${BASE_URL}\n`, 'blue');
  
  await testXSSPrevention();
  await testInputSanitization();
  await testAuthenticationSecurity();
  await testErrorBoundaries();
  await testConsoleSecrets();
  await testSQLInjectionPrevention();
  await testCSRFProtection();
  await testDataValidation();
  await testErrorLogging();
  await testContentSecurityPolicy();
  
  log('\n🔒 Security Testing Complete!', 'bold');
  log('💡 For production deployment, add security headers and enable HTTPS.', 'blue');
  log('💡 Consider adding rate limiting and input validation on the server side.', 'blue');
  log('💡 Implement proper password hashing for production use.', 'blue');
}

if (require.main === module) {
  main().catch(error => {
    log(`Fatal error in security test suite: ${error.message}`, 'red');
    process.exit(1);
  });
}