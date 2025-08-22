// scripts/build-sw.js
// Build script for service worker

const fs = require('fs');
const path = require('path');

console.log('🔧 Building service worker...');

try {
  // Ensure build directory exists
  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('📁 Created build directory');
  }

  // Copy service worker to build folder
  const swSource = path.join(__dirname, '../public/sw.js');
  const swDest = path.join(__dirname, '../build/sw.js');
  
  if (fs.existsSync(swSource)) {
    fs.copyFileSync(swSource, swDest);
    console.log('✅ Service worker copied to build folder');
  } else {
    console.log('ℹ️  No service worker found in public folder');
  }

  // Ensure manifest.json is in build
  const manifestSource = path.join(__dirname, '../public/manifest.json');
  const manifestDest = path.join(__dirname, '../build/manifest.json');
  
  if (fs.existsSync(manifestSource)) {
    fs.copyFileSync(manifestSource, manifestDest);
    console.log('✅ Manifest copied to build folder');
  } else {
    console.log('ℹ️  No manifest found in public folder');
  }

  // Copy any other PWA assets
  const assetsToCheck = [
    { src: 'favicon.ico', dest: 'favicon.ico' },
    { src: 'logo192.png', dest: 'logo192.png' },
    { src: 'logo512.png', dest: 'logo512.png' },
    { src: 'robots.txt', dest: 'robots.txt' }
  ];

  assetsToCheck.forEach(asset => {
    const srcPath = path.join(__dirname, '../public', asset.src);
    const destPath = path.join(__dirname, '../build', asset.dest);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ ${asset.src} copied to build folder`);
    }
  });

  console.log('🎉 Service worker build completed!');
  
} catch (error) {
  console.error('❌ Service worker build failed:', error.message);
  // Don't fail the build, just warn
  console.log('⚠️  Continuing build without service worker...');
}

process.exit(0);