// scripts/update-sw-version.js
// Update service worker cache version for new deployments

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔄 Updating service worker version...');

try {
  const swPath = path.join(__dirname, '../public/sw.js');
  
  if (!fs.existsSync(swPath)) {
    console.log('ℹ️  No service worker found, skipping version update');
    process.exit(0);
  }

  // Read current service worker
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Generate new version based on current timestamp and content hash
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const contentHash = crypto.createHash('md5').update(swContent).digest('hex').slice(0, 8);
  const newVersion = `v${timestamp}-${contentHash}`;
  
  // Update cache version in service worker
  const versionRegex = /const CACHE_VERSION = ['"`]([^'"`]+)['"`]/;
  
  if (versionRegex.test(swContent)) {
    const oldVersion = swContent.match(versionRegex)[1];
    swContent = swContent.replace(versionRegex, `const CACHE_VERSION = '${newVersion}'`);
    
    fs.writeFileSync(swPath, swContent);
    console.log(`✅ Service worker version updated: ${oldVersion} → ${newVersion}`);
  } else {
    console.log('ℹ️  No CACHE_VERSION found in service worker, skipping update');
  }
  
} catch (error) {
  console.error('❌ Failed to update service worker version:', error.message);
  // Don't fail the build
  console.log('⚠️  Continuing without version update...');
}

process.exit(0);