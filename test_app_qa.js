#!/usr/bin/env node
/**
 * QA/QC Test Suite for TSA Production Management System
 * Professional Engineer Testing - Comprehensive Application Testing
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = [];

// ANSI Colors for output
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

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  log(`${statusSymbol} ${testName}: ${colors.bold}${status}${colors.reset}`, statusColor);
  if (details) {
    log(`   ${details}`, 'blue');
  }
  
  TEST_RESULTS.push({ testName, status, details });
}

async function testEndpoint(url, expectedStatus = 200, testName) {
  try {
    const { stdout } = await execAsync(`curl -s -w "%{http_code},%{time_total},%{size_download}" -o /dev/null "${url}"`);
    const [httpCode, responseTime, contentLength] = stdout.trim().split(',');
    
    if (parseInt(httpCode) === expectedStatus) {
      logTest(testName, 'PASS', `HTTP ${httpCode}, ${responseTime}s, ${contentLength} bytes`);
      return true;
    } else {
      logTest(testName, 'FAIL', `Expected HTTP ${expectedStatus}, got ${httpCode}`);
      return false;
    }
  } catch (error) {
    logTest(testName, 'FAIL', `Network error: ${error.message}`);
    return false;
  }
}

async function testJavaScriptErrors() {
  // Check if there are any obvious JavaScript syntax errors in the bundle
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | head -100 | grep -E "(SyntaxError|ReferenceError|TypeError)" || echo "no_errors"`);
    if (stdout.trim() === 'no_errors') {
      logTest('JavaScript Bundle Syntax Check', 'PASS', 'No syntax errors found');
      return true;
    } else {
      logTest('JavaScript Bundle Syntax Check', 'FAIL', 'JavaScript errors found in bundle');
      return false;
    }
  } catch (error) {
    logTest('JavaScript Bundle Syntax Check', 'WARN', 'Could not analyze bundle');
    return false;
  }
}

async function testSecurity() {
  // Check for security headers
  try {
    const { stdout } = await execAsync(`curl -s -I "${BASE_URL}" | grep -E "(X-Frame-Options|X-Content-Type-Options|Content-Security-Policy)"`);
    if (stdout.trim()) {
      logTest('Security Headers', 'PASS', 'Security headers present');
    } else {
      logTest('Security Headers', 'WARN', 'Consider adding security headers for production');
    }
  } catch (error) {
    logTest('Security Headers', 'WARN', 'Could not check security headers');
  }
}

async function testPerformance() {
  // Test page load performance
  try {
    const { stdout } = await execAsync(`curl -s -w "%{time_total},%{time_connect},%{time_starttransfer}" -o /dev/null "${BASE_URL}"`);
    const [totalTime, connectTime, firstByteTime] = stdout.trim().split(',').map(Number);
    
    if (totalTime < 2.0) {
      logTest('Page Load Performance', 'PASS', `Total: ${totalTime}s, Connect: ${connectTime}s, TTFB: ${firstByteTime}s`);
    } else if (totalTime < 5.0) {
      logTest('Page Load Performance', 'WARN', `Slow load time: ${totalTime}s`);
    } else {
      logTest('Page Load Performance', 'FAIL', `Very slow load time: ${totalTime}s`);
    }
  } catch (error) {
    logTest('Page Load Performance', 'FAIL', `Performance test failed: ${error.message}`);
  }
}

async function testPWAManifest() {
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/manifest.json"`);
    const manifest = JSON.parse(stdout);
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length === 0) {
      logTest('PWA Manifest Validation', 'PASS', `All required fields present`);
    } else {
      logTest('PWA Manifest Validation', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
    }
  } catch (error) {
    logTest('PWA Manifest Validation', 'FAIL', `Invalid JSON or network error`);
  }
}

async function testServiceWorker() {
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/sw.js" | grep -E "(addEventListener|install|fetch)" | wc -l`);
    const eventListenerCount = parseInt(stdout.trim());
    if (eventListenerCount >= 3) {
      logTest('Service Worker Implementation', 'PASS', `Service worker has ${eventListenerCount} event listeners`);
    } else {
      logTest('Service Worker Implementation', 'WARN', `Service worker has only ${eventListenerCount} event listeners`);
    }
  } catch (error) {
    logTest('Service Worker Implementation', 'FAIL', 'Could not load service worker');
  }
}

async function testAPIEndpoints() {
  // Test that SPA routing works for various paths
  const routes = [
    '/dashboard',
    '/operator',
    '/supervisor',
    '/management',
    '/login'
  ];
  
  for (const route of routes) {
    await testEndpoint(`${BASE_URL}${route}`, 200, `SPA Route: ${route}`);
  }
}

async function testStaticAssets() {
  const assets = [
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png',
    '/manifest.json',
    '/sw.js'
  ];
  
  for (const asset of assets) {
    await testEndpoint(`${BASE_URL}${asset}`, 200, `Static Asset: ${asset}`);
  }
}

async function testErrorHandling() {
  // Test how the app handles various error conditions
  await testEndpoint(`${BASE_URL}/api/nonexistent`, 200, 'Non-existent API Route (SPA fallback)');
  await testEndpoint(`${BASE_URL}/totally/fake/path`, 200, 'Deep Non-existent Route (SPA fallback)');
}

async function generateReport() {
  const passed = TEST_RESULTS.filter(t => t.status === 'PASS').length;
  const failed = TEST_RESULTS.filter(t => t.status === 'FAIL').length;
  const warnings = TEST_RESULTS.filter(t => t.status === 'WARN').length;
  const total = TEST_RESULTS.length;
  
  log('\n' + '='.repeat(60), 'blue');
  log('QA/QC TEST REPORT SUMMARY', 'bold');
  log('='.repeat(60), 'blue');
  
  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, 'red');
  log(`Warnings: ${warnings}`, 'yellow');
  
  const passRate = Math.round((passed / total) * 100);
  log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');
  
  if (failed > 0) {
    log('\nFAILED TESTS:', 'red');
    TEST_RESULTS.filter(t => t.status === 'FAIL').forEach(test => {
      log(`❌ ${test.testName}: ${test.details}`, 'red');
    });
  }
  
  if (warnings > 0) {
    log('\nWARNINGS:', 'yellow');
    TEST_RESULTS.filter(t => t.status === 'WARN').forEach(test => {
      log(`⚠️ ${test.testName}: ${test.details}`, 'yellow');
    });
  }
  
  log('\n' + '='.repeat(60), 'blue');
  
  return { total, passed, failed, warnings, passRate };
}

async function main() {
  log('🔬 Starting QA/QC Testing Suite...', 'bold');
  log(`Testing application at: ${BASE_URL}\n`, 'blue');
  
  // Basic connectivity and endpoint tests
  log('📡 Testing Basic Connectivity...', 'yellow');
  await testEndpoint(BASE_URL, 200, 'Main Application Load');
  
  // Static assets
  log('\n📁 Testing Static Assets...', 'yellow');
  await testStaticAssets();
  
  // PWA functionality
  log('\n📱 Testing PWA Functionality...', 'yellow');
  await testPWAManifest();
  await testServiceWorker();
  
  // SPA routing
  log('\n🚀 Testing SPA Routing...', 'yellow');
  await testAPIEndpoints();
  
  // Security
  log('\n🔒 Testing Security...', 'yellow');
  await testSecurity();
  
  // Performance
  log('\n⚡ Testing Performance...', 'yellow');
  await testPerformance();
  
  // Error handling
  log('\n🚨 Testing Error Handling...', 'yellow');
  await testErrorHandling();
  
  // JavaScript validation
  log('\n🔍 Testing JavaScript Quality...', 'yellow');
  await testJavaScriptErrors();
  
  // Generate final report
  const report = await generateReport();
  
  // Exit with appropriate code
  process.exit(report.failed > 0 ? 1 : 0);
}

// Run the test suite
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error in test suite: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testEndpoint, testJavaScriptErrors, testSecurity, testPerformance };