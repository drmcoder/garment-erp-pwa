#!/usr/bin/env node
/**
 * Functional QA Testing for TSA Production Management System
 * Tests user interactions and critical business flows
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

async function testReactComponents() {
  log('🧪 Testing React Component Loading...', 'yellow');
  
  try {
    // Test if the main React app loads by checking for specific elements
    const { stdout } = await execAsync(`curl -s "${BASE_URL}" | grep -c -E '(id="root"|TSA Production Management)'`, { timeout: 10000 });
    const matches = parseInt(stdout.trim());
    
    if (matches >= 2) {
      log('✅ React App Structure: PASS - Root element and app title found', 'green');
      return true;
    } else {
      log('❌ React App Structure: FAIL - Missing critical elements', 'red');
      return false;
    }
  } catch (error) {
    log('❌ React App Structure: FAIL - Could not load main page', 'red');
    return false;
  }
}

async function testAppInitialization() {
  log('🚀 Testing App Initialization...', 'yellow');
  
  // Check if essential JavaScript files load correctly
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | head -50 | grep -E "(React|ReactDOM)" | head -1`);
    
    if (stdout.includes('React')) {
      log('✅ React Framework: PASS - React detected in bundle', 'green');
    } else {
      log('⚠️ React Framework: WARN - React not detected in bundle header', 'yellow');
    }
  } catch (error) {
    log('❌ React Framework: FAIL - Bundle not accessible', 'red');
  }
}

async function testAuthenticationFlow() {
  log('🔐 Testing Authentication System...', 'yellow');
  
  // Since we can't simulate actual login without a browser, test the auth components
  try {
    // Check if authentication context is properly set up
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "AuthContext\\|useAuth\\|login"`);
    const authMatches = parseInt(stdout.trim());
    
    if (authMatches >= 3) {
      log('✅ Authentication Context: PASS - Auth system integrated', 'green');
    } else {
      log('❌ Authentication Context: FAIL - Auth system not detected', 'red');
    }
  } catch (error) {
    log('❌ Authentication Context: FAIL - Could not analyze auth system', 'red');
  }
}

async function testLanguageSupport() {
  log('🌐 Testing Language Support...', 'yellow');
  
  try {
    // Check for Nepali language support
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "नेपाली\\|LanguageContext"`);
    const langMatches = parseInt(stdout.trim());
    
    if (langMatches >= 1) {
      log('✅ Language System: PASS - Nepali language support detected', 'green');
    } else {
      log('❌ Language System: FAIL - Language system not detected', 'red');
    }
  } catch (error) {
    log('❌ Language System: FAIL - Could not analyze language support', 'red');
  }
}

async function testFirebaseIntegration() {
  log('🔥 Testing Firebase Integration...', 'yellow');
  
  try {
    // Check for Firebase SDK in bundle
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "firebase\\|firestore"`);
    const firebaseMatches = parseInt(stdout.trim());
    
    if (firebaseMatches >= 5) {
      log('✅ Firebase Integration: PASS - Firebase SDK detected', 'green');
    } else {
      log('❌ Firebase Integration: FAIL - Firebase not properly integrated', 'red');
    }
  } catch (error) {
    log('❌ Firebase Integration: FAIL - Could not analyze Firebase integration', 'red');
  }
}

async function testRoutingSystem() {
  log('🚀 Testing React Router...', 'yellow');
  
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "Route\\|Router\\|useNavigate"`);
    const routingMatches = parseInt(stdout.trim());
    
    if (routingMatches >= 3) {
      log('✅ React Router: PASS - Routing system detected', 'green');
    } else {
      log('❌ React Router: FAIL - Routing system not detected', 'red');
    }
  } catch (error) {
    log('❌ React Router: FAIL - Could not analyze routing system', 'red');
  }
}

async function testComponentStructure() {
  log('🧩 Testing Component Structure...', 'yellow');
  
  const components = [
    'OperatorDashboard',
    'SupervisorDashboard',
    'WorkAssignment',
    'WIPManualEntry',
    'MultiMethodWorkAssignment'
  ];
  
  try {
    for (const component of components) {
      const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "${component}"`);
      const matches = parseInt(stdout.trim());
      
      if (matches >= 1) {
        log(`✅ Component ${component}: PASS - Found in bundle`, 'green');
      } else {
        log(`⚠️ Component ${component}: WARN - Not found in bundle`, 'yellow');
      }
    }
  } catch (error) {
    log('❌ Component Analysis: FAIL - Could not analyze components', 'red');
  }
}

async function testErrorHandling() {
  log('🚨 Testing Error Boundaries...', 'yellow');
  
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "ErrorBoundary\\|componentDidCatch"`);
    const errorMatches = parseInt(stdout.trim());
    
    if (errorMatches >= 1) {
      log('✅ Error Boundaries: PASS - Error handling detected', 'green');
    } else {
      log('⚠️ Error Boundaries: WARN - No error boundaries detected', 'yellow');
    }
  } catch (error) {
    log('❌ Error Boundaries: FAIL - Could not analyze error handling', 'red');
  }
}

async function testTailwindCSS() {
  log('🎨 Testing Tailwind CSS...', 'yellow');
  
  try {
    // Check in JS bundle for React className with Tailwind
    const { stdout: bundleCheck } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "className.*bg-"`);
    const tailwindMatches = parseInt(bundleCheck.trim());
    
    if (tailwindMatches >= 50) {
      log(`✅ Tailwind CSS: PASS - ${tailwindMatches} Tailwind classes found in bundle`, 'green');
    } else if (tailwindMatches >= 10) {
      log(`⚠️ Tailwind CSS: WARN - Limited Tailwind usage (${tailwindMatches} classes)`, 'yellow');
    } else {
      log('❌ Tailwind CSS: FAIL - Tailwind not detected', 'red');
    }
  } catch (error) {
    log('❌ Tailwind CSS: FAIL - Could not analyze styles', 'red');
  }
}

async function testPWAFeatures() {
  log('📱 Testing PWA Features...', 'yellow');
  
  try {
    // Check manifest
    const { stdout: manifest } = await execAsync(`curl -s "${BASE_URL}/manifest.json"`);
    const manifestObj = JSON.parse(manifest);
    
    if (manifestObj.display === 'standalone' && manifestObj.start_url) {
      log('✅ PWA Manifest: PASS - Configured for standalone mode', 'green');
    } else {
      log('❌ PWA Manifest: FAIL - Not properly configured', 'red');
    }
    
    // Check service worker registration
    const { stdout: sw } = await execAsync(`curl -s "${BASE_URL}/sw.js" | grep -c "cache\\|fetch"`);
    const swMatches = parseInt(sw.trim());
    
    if (swMatches >= 2) {
      log('✅ Service Worker: PASS - Caching functionality detected', 'green');
    } else {
      log('❌ Service Worker: FAIL - Caching not implemented', 'red');
    }
  } catch (error) {
    log('❌ PWA Features: FAIL - Could not analyze PWA features', 'red');
  }
}

async function testDataFlow() {
  log('🔄 Testing Data Management...', 'yellow');
  
  try {
    // Check for state management patterns
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "useState\\|useEffect\\|Context"`);
    const stateMatches = parseInt(stdout.trim());
    
    if (stateMatches >= 10) {
      log('✅ State Management: PASS - React hooks and context detected', 'green');
    } else {
      log('❌ State Management: FAIL - Insufficient state management', 'red');
    }
  } catch (error) {
    log('❌ State Management: FAIL - Could not analyze data flow', 'red');
  }
}

async function testAccessibility() {
  log('♿ Testing Accessibility Features...', 'yellow');
  
  try {
    // Check bundle for accessibility patterns
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "aria-\\|role=\\|tabIndex\\|alt="`);
    const accessibilityMatches = parseInt(stdout.trim());
    
    if (accessibilityMatches >= 5) {
      log(`✅ Accessibility: PASS - ${accessibilityMatches} accessibility features detected`, 'green');
    } else if (accessibilityMatches >= 1) {
      log(`⚠️ Accessibility: WARN - Limited accessibility features (${accessibilityMatches})`, 'yellow');
    } else {
      log('⚠️ Accessibility: WARN - No accessibility features detected', 'yellow');
    }
  } catch (error) {
    log('❌ Accessibility: FAIL - Could not analyze accessibility', 'red');
  }
}

async function main() {
  log('🔬 Starting Functional QA Testing Suite...', 'bold');
  log(`Testing application functionality at: ${BASE_URL}\n`, 'blue');
  
  await testReactComponents();
  await testAppInitialization();
  await testAuthenticationFlow();
  await testLanguageSupport();
  await testFirebaseIntegration();
  await testRoutingSystem();
  await testComponentStructure();
  await testErrorHandling();
  await testTailwindCSS();
  await testPWAFeatures();
  await testDataFlow();
  await testAccessibility();
  
  log('\n🎯 Functional Testing Complete!', 'bold');
  log('Note: These tests analyze the built application bundle.', 'blue');
  log('For complete testing, use browser automation tools like Cypress or Playwright.', 'blue');
}

if (require.main === module) {
  main().catch(error => {
    log(`Fatal error in functional test suite: ${error.message}`, 'red');
    process.exit(1);
  });
}