// Debug test to simulate React app initialization
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging React App Issues...');

// Check if main files exist
const mainFiles = [
  'src/index.js',
  'src/App.js', 
  'src/components/error/SentryErrorBoundary.jsx',
  'src/services/SentryService.js'
];

mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for problematic imports
    if (content.includes('@sentry')) {
      console.log(`❌ ${file} still contains @sentry imports!`);
    }
    
    // Check for infinite loop patterns
    if (content.includes('useEffect') && content.includes('[]')) {
      const matches = content.match(/useEffect.*\[\]/g);
      if (matches && matches.length > 0) {
        console.log(`⚠️  ${file} has ${matches.length} useEffect with empty deps`);
      }
    }
    
    // Check for circular dependencies
    if (content.includes('useCallback') && content.includes('useMemo')) {
      console.log(`⚠️  ${file} has both useCallback and useMemo (potential circular deps)`);
    }
    
  } else {
    console.log(`❌ ${file} missing`);
  }
});

console.log('🏁 Debug complete');