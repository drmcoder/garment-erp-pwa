// Test script to verify login functionality and check for infinite loops
const puppeteer = require('puppeteer');

async function testSupervisorLogin() {
  let browser;
  try {
    console.log('🚀 Starting login test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null
    });
    
    const page = await browser.newPage();
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    console.log('📖 Navigating to app...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Wait for login form to load
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });
    
    // Check for infinite loop errors immediately
    await page.waitForTimeout(2000);
    if (consoleErrors.some(error => error.includes('Maximum update depth'))) {
      console.log('❌ INFINITE LOOP DETECTED!');
      return false;
    }
    
    console.log('✅ No infinite loop detected');
    
    // Fill in supervisor credentials
    console.log('📝 Entering supervisor credentials...');
    await page.type('input[type="text"]', 'supervisor');
    await page.type('input[type="password"]', 'super123');
    
    // Submit login
    console.log('🔐 Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or dashboard to load
    await page.waitForTimeout(3000);
    
    // Check if we're logged in (look for navigation elements)
    const isLoggedIn = await page.$('nav') !== null;
    
    if (isLoggedIn) {
      console.log('✅ Login successful!');
      console.log('✅ Dashboard loaded successfully');
      
      // Wait a bit more to check for any delayed errors
      await page.waitForTimeout(5000);
      
      // Check final error count
      const errorCount = consoleErrors.filter(error => 
        !error.includes('Warning') && !error.includes('DevTools')
      ).length;
      
      if (errorCount === 0) {
        console.log('✅ No critical errors detected');
        console.log('🎉 TEST PASSED: App is working correctly!');
        return true;
      } else {
        console.log(`❌ Found ${errorCount} errors`);
        return false;
      }
    } else {
      console.log('❌ Login failed - still on login page');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available, if not just test with basic fetch
async function testBasic() {
  try {
    console.log('🧪 Running basic test...');
    
    // Just check if the app responds
    const response = await fetch('http://localhost:3001');
    if (response.ok) {
      console.log('✅ App server is responding');
      console.log('ℹ️ Manual test required: Open http://localhost:3001 and login with:');
      console.log('   Username: supervisor');
      console.log('   Password: super123');
      return true;
    } else {
      console.log('❌ App server not responding');
      return false;
    }
  } catch (error) {
    console.log('❌ Basic test failed:', error.message);
    return false;
  }
}

// Run the appropriate test
if (typeof require !== 'undefined') {
  try {
    require('puppeteer');
    testSupervisorLogin();
  } catch (e) {
    console.log('ℹ️ Puppeteer not available, running basic test...');
    testBasic();
  }
} else {
  testBasic();
}