// Simple test to check if the operator dashboard is loading
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🧪 Testing Operator Dashboard...');
    
    const browser = await puppeteer.launch({ 
      headless: false, // Show browser
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Navigate to localhost
    console.log('📍 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Wait for React app to load
    await page.waitForTimeout(3000);
    
    // Check if login screen is visible
    const loginTitle = await page.$eval('body', body => body.innerText);
    if (loginTitle.includes('TSA Production Management System')) {
      console.log('✅ App loaded successfully');
      
      // Try to find operator login
      const operatorLogin = await page.$('input[placeholder*="username"], input[type="text"]');
      if (operatorLogin) {
        console.log('✅ Login form found');
        
        // Test operator login
        await operatorLogin.type('ram.singh');
        const passwordField = await page.$('input[type="password"]');
        if (passwordField) {
          await passwordField.type('password123');
          
          const loginButton = await page.$('button[type="submit"], button:contains("Login")');
          if (loginButton) {
            console.log('🔑 Attempting operator login...');
            await loginButton.click();
            
            // Wait for dashboard to load
            await page.waitForTimeout(5000);
            
            // Check if operator dashboard loaded
            const dashboardContent = await page.$eval('body', body => body.innerText);
            if (dashboardContent.includes('Welcome') || dashboardContent.includes('operator') || dashboardContent.includes('Today')) {
              console.log('✅ OPERATOR DASHBOARD LOADED SUCCESSFULLY!');
              console.log('📊 Dashboard contains expected content');
            } else {
              console.log('❌ Operator dashboard not found');
              console.log('Current content:', dashboardContent.slice(0, 200));
            }
          } else {
            console.log('❌ Login button not found');
          }
        } else {
          console.log('❌ Password field not found');
        }
      } else {
        console.log('❌ Login form not found');
      }
    } else {
      console.log('❌ App not loaded properly');
    }
    
    // Keep browser open for manual testing
    console.log('🔍 Browser left open for manual inspection');
    // await browser.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();