#!/usr/bin/env node
/**
 * Responsive Design QA Testing for TSA Production Management System
 * Tests mobile-first design and touch-friendly interfaces
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

async function testViewportMeta() {
  log('📱 Testing Viewport Configuration...', 'yellow');
  
  try {
    const { stdout } = await execAsync(`curl -s "${BASE_URL}" | grep -c 'viewport.*width=device-width'`);
    const viewportMatches = parseInt(stdout.trim());
    
    if (viewportMatches >= 1) {
      log('✅ Viewport Meta: PASS - Mobile viewport properly configured', 'green');
    } else {
      log('❌ Viewport Meta: FAIL - Missing mobile viewport configuration', 'red');
    }
  } catch (error) {
    log('❌ Viewport Meta: FAIL - Could not analyze viewport', 'red');
  }
}

async function testTailwindResponsive() {
  log('📐 Testing Tailwind Responsive Classes...', 'yellow');
  
  const responsiveClasses = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  let passCount = 0;
  
  try {
    for (const prefix of responsiveClasses) {
      const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "${prefix}"`);
      const matches = parseInt(stdout.trim());
      
      if (matches >= 10) {
        log(`✅ ${prefix} Responsive: PASS - ${matches} responsive classes found`, 'green');
        passCount++;
      } else if (matches >= 1) {
        log(`⚠️ ${prefix} Responsive: WARN - Limited usage (${matches} classes)`, 'yellow');
      } else {
        log(`❌ ${prefix} Responsive: FAIL - No responsive classes found`, 'red');
      }
    }
    
    if (passCount >= 3) {
      log(`✅ Overall Responsive Design: PASS - ${passCount}/5 breakpoints well implemented`, 'green');
    } else {
      log(`⚠️ Overall Responsive Design: WARN - Only ${passCount}/5 breakpoints implemented`, 'yellow');
    }
  } catch (error) {
    log('❌ Responsive Classes: FAIL - Could not analyze responsive design', 'red');
  }
}

async function testTouchFriendly() {
  log('👆 Testing Touch-Friendly Design...', 'yellow');
  
  try {
    // Check for touch-friendly CSS classes from index.css
    const touchClasses = ['touch-button', 'touch-button-large', 'touch-button-xl', 'numpad-button'];
    let touchClassesFound = 0;
    
    for (const touchClass of touchClasses) {
      const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "${touchClass}"`);
      const matches = parseInt(stdout.trim());
      
      if (matches >= 1) {
        log(`✅ ${touchClass}: PASS - Found in bundle`, 'green');
        touchClassesFound++;
      }
    }
    
    // Check for minimum button sizes in CSS
    const { stdout: cssCheck } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "min-height.*44px\\|min-height.*48px\\|min-width.*44px"`);
    const minSizeMatches = parseInt(cssCheck.trim());
    
    if (touchClassesFound >= 2 || minSizeMatches >= 5) {
      log('✅ Touch-Friendly Interface: PASS - Touch-optimized buttons detected', 'green');
    } else {
      log('⚠️ Touch-Friendly Interface: WARN - Limited touch optimization', 'yellow');
    }
  } catch (error) {
    log('❌ Touch-Friendly Interface: FAIL - Could not analyze touch design', 'red');
  }
}

async function testFlexboxGrid() {
  log('🎯 Testing Flexbox and Grid Layout...', 'yellow');
  
  try {
    const { stdout: flexCount } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "flex\\|grid"`);
    const layoutMatches = parseInt(flexCount.trim());
    
    const { stdout: gridCount } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "grid-cols"`);
    const gridMatches = parseInt(gridCount.trim());
    
    if (layoutMatches >= 100 && gridMatches >= 10) {
      log(`✅ Modern Layout: PASS - Flexbox (${layoutMatches}) and Grid (${gridMatches}) extensively used`, 'green');
    } else if (layoutMatches >= 50) {
      log(`⚠️ Modern Layout: WARN - Moderate layout system usage`, 'yellow');
    } else {
      log('❌ Modern Layout: FAIL - Limited modern layout usage', 'red');
    }
  } catch (error) {
    log('❌ Modern Layout: FAIL - Could not analyze layout systems', 'red');
  }
}

async function testMobileNavigation() {
  log('📲 Testing Mobile Navigation Patterns...', 'yellow');
  
  try {
    // Check for mobile-friendly navigation patterns
    const navPatterns = ['hamburger', 'menu-toggle', 'mobile-menu', 'drawer', 'sidebar'];
    let mobileNavFound = 0;
    
    for (const pattern of navPatterns) {
      const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "${pattern}"`);
      const matches = parseInt(stdout.trim());
      
      if (matches >= 1) {
        mobileNavFound++;
      }
    }
    
    // Check for overflow-x-auto (horizontal scrolling)
    const { stdout: scrollCheck } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "overflow-x-auto\\|scroll"`);
    const scrollMatches = parseInt(scrollCheck.trim());
    
    if (mobileNavFound >= 1 || scrollMatches >= 3) {
      log('✅ Mobile Navigation: PASS - Mobile-friendly navigation detected', 'green');
    } else {
      log('⚠️ Mobile Navigation: WARN - Limited mobile navigation patterns', 'yellow');
    }
  } catch (error) {
    log('❌ Mobile Navigation: FAIL - Could not analyze navigation', 'red');
  }
}

async function testImageOptimization() {
  log('🖼️ Testing Image Optimization...', 'yellow');
  
  try {
    // Check for responsive image techniques
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "srcSet\\|sizes\\|loading=.*lazy"`);
    const imageOptMatches = parseInt(stdout.trim());
    
    if (imageOptMatches >= 3) {
      log('✅ Image Optimization: PASS - Responsive image techniques detected', 'green');
    } else if (imageOptMatches >= 1) {
      log('⚠️ Image Optimization: WARN - Limited image optimization', 'yellow');
    } else {
      log('⚠️ Image Optimization: WARN - No image optimization detected (using icons/emojis)', 'yellow');
    }
  } catch (error) {
    log('❌ Image Optimization: FAIL - Could not analyze images', 'red');
  }
}

async function testFormResponsiveness() {
  log('📝 Testing Responsive Forms...', 'yellow');
  
  try {
    // Check for responsive form patterns
    const formPatterns = ['input.*w-full', 'form.*space-y', 'grid.*gap', 'flex.*flex-col'];
    let responsiveFormCount = 0;
    
    for (const pattern of formPatterns) {
      const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "${pattern}"`);
      const matches = parseInt(stdout.trim());
      
      if (matches >= 5) {
        responsiveFormCount++;
      }
    }
    
    if (responsiveFormCount >= 2) {
      log('✅ Responsive Forms: PASS - Form layouts are responsive', 'green');
    } else {
      log('⚠️ Responsive Forms: WARN - Limited responsive form patterns', 'yellow');
    }
  } catch (error) {
    log('❌ Responsive Forms: FAIL - Could not analyze forms', 'red');
  }
}

async function testTypography() {
  log('📚 Testing Responsive Typography...', 'yellow');
  
  try {
    // Check for responsive text classes
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "text-.*sm:\\|text-.*md:\\|text-.*lg:"`);
    const respTextMatches = parseInt(stdout.trim());
    
    // Check for text sizing variety
    const { stdout: sizeVariety } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "text-xs\\|text-sm\\|text-base\\|text-lg\\|text-xl"`);
    const sizeMatches = parseInt(sizeVariety.trim());
    
    if (respTextMatches >= 5 && sizeMatches >= 20) {
      log(`✅ Responsive Typography: PASS - Good text scaling (${respTextMatches} responsive, ${sizeMatches} varied sizes)`, 'green');
    } else if (sizeMatches >= 10) {
      log('⚠️ Responsive Typography: WARN - Good variety but limited responsive scaling', 'yellow');
    } else {
      log('❌ Responsive Typography: FAIL - Limited typography system', 'red');
    }
  } catch (error) {
    log('❌ Responsive Typography: FAIL - Could not analyze typography', 'red');
  }
}

async function testMediaQueries() {
  log('📺 Testing CSS Media Queries...', 'yellow');
  
  try {
    // Check index.css for media queries
    const { stdout } = await execAsync(`curl -s "${BASE_URL}/static/css/main.*.css" 2>/dev/null | grep -c "@media" || echo "0"`);
    const mediaQueries = parseInt(stdout.trim());
    
    // Also check inline styles and CSS-in-JS
    const { stdout: jsMedia } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "max-width.*768px\\|min-width.*768px\\|@media"`);
    const jsMediaMatches = parseInt(jsMedia.trim());
    
    if (mediaQueries >= 3 || jsMediaMatches >= 2) {
      log('✅ Media Queries: PASS - Responsive breakpoints implemented', 'green');
    } else {
      log('⚠️ Media Queries: WARN - Limited media query usage (relying on Tailwind)', 'yellow');
    }
  } catch (error) {
    log('⚠️ Media Queries: WARN - Could not locate CSS files (using utility classes)', 'yellow');
  }
}

async function testPerformanceHints() {
  log('⚡ Testing Mobile Performance Hints...', 'yellow');
  
  try {
    // Check for performance optimizations
    const { stdout: lazyLoad } = await execAsync(`curl -s "${BASE_URL}/static/js/bundle.js" | grep -c "lazy\\|loading"`);
    const lazyMatches = parseInt(lazyLoad.trim());
    
    const { stdout: bundleSize } = await execAsync(`curl -s -I "${BASE_URL}/static/js/bundle.js" | grep "Content-Length" | awk '{print $2}' | tr -d '\\r'`);
    const bundleSizeBytes = parseInt(bundleSize.trim());
    const bundleSizeMB = bundleSizeBytes / (1024 * 1024);
    
    if (bundleSizeMB < 5) {
      log(`✅ Bundle Size: PASS - ${bundleSizeMB.toFixed(1)}MB (reasonable for mobile)`, 'green');
    } else if (bundleSizeMB < 10) {
      log(`⚠️ Bundle Size: WARN - ${bundleSizeMB.toFixed(1)}MB (could be optimized)`, 'yellow');
    } else {
      log(`❌ Bundle Size: FAIL - ${bundleSizeMB.toFixed(1)}MB (too large for mobile)`, 'red');
    }
  } catch (error) {
    log('⚠️ Performance Hints: WARN - Could not analyze performance', 'yellow');
  }
}

async function main() {
  log('📱 Starting Responsive Design QA Testing...', 'bold');
  log(`Testing mobile-first design at: ${BASE_URL}\n`, 'blue');
  
  await testViewportMeta();
  await testTailwindResponsive();
  await testTouchFriendly();
  await testFlexboxGrid();
  await testMobileNavigation();
  await testImageOptimization();
  await testFormResponsiveness();
  await testTypography();
  await testMediaQueries();
  await testPerformanceHints();
  
  log('\n📱 Responsive Design Testing Complete!', 'bold');
  log('💡 For complete testing, use browser dev tools to test actual breakpoints.', 'blue');
  log('💡 Test on real devices: iPhone, Android, tablets for best results.', 'blue');
}

if (require.main === module) {
  main().catch(error => {
    log(`Fatal error in responsive test suite: ${error.message}`, 'red');
    process.exit(1);
  });
}