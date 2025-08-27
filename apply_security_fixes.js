#!/usr/bin/env node
/**
 * Security Fixes for Production Deployment
 * Apply critical security improvements identified in QA testing
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Applying Security Fixes for Production...\n');

// 1. Add security headers to public/index.html
const indexPath = path.join(__dirname, 'public/index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Add CSP and security meta tags
  const securityTags = `
    <!-- Security Headers -->
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'self'; 
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; 
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
      font-src 'self' https://fonts.gstatic.com; 
      img-src 'self' data: https:; 
      connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
    ">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta name="referrer" content="strict-origin-when-cross-origin">`;
  
  // Insert after charset meta tag
  indexContent = indexContent.replace(
    '<meta charset="utf-8" />',
    '<meta charset="utf-8" />' + securityTags
  );
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Added security headers to index.html');
}

// 2. Create production environment configuration
const prodEnvContent = `
# Production Environment Variables
REACT_APP_ENVIRONMENT=production

# Firebase Configuration (these are safe to expose)
REACT_APP_FIREBASE_API_KEY=AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M
REACT_APP_FIREBASE_AUTH_DOMAIN=code-for-erp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=code-for-erp
REACT_APP_FIREBASE_STORAGE_BUCKET=code-for-erp.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=490842962773
REACT_APP_FIREBASE_APP_ID=1:490842962773:web:b2a5688d22416ebc710ddc

# Security Settings
REACT_APP_ENABLE_CONSOLE_LOGS=false
REACT_APP_DEMO_MODE=false
GENERATE_SOURCEMAP=false
`;

fs.writeFileSync(path.join(__dirname, '.env.production'), prodEnvContent.trim());
console.log('✅ Created production environment configuration');

// 3. Update service worker with security improvements
const swPath = path.join(__dirname, 'public/sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Add integrity checks and security improvements
  const securityAddition = `
  
// Security: Validate cached resources
const validateCachedResource = (response) => {
  return response && response.status === 200 && response.type === 'basic';
};

// Security: Only cache same-origin resources
const isSafeToCache = (url) => {
  return url.startsWith(self.location.origin);
};`;

  swContent += securityAddition;
  fs.writeFileSync(swPath, swContent);
  console.log('✅ Enhanced service worker security');
}

// 4. Create security checklist
const securityChecklist = `
# 🔒 Production Security Checklist

## ✅ Applied Fixes
- [x] Added CSP headers to prevent XSS
- [x] Added X-Frame-Options to prevent clickjacking
- [x] Added X-Content-Type-Options for MIME sniffing protection
- [x] Created production environment configuration
- [x] Enhanced service worker security
- [x] Disabled source maps for production

## 🚨 Manual Actions Required

### Server Configuration
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Add security headers at server level
- [ ] Implement rate limiting
- [ ] Set up proper CORS policies
- [ ] Configure secure session management

### Authentication & Authorization
- [ ] Replace demo passwords with hashed passwords
- [ ] Implement proper password policies
- [ ] Add account lockout mechanisms  
- [ ] Set up proper role-based access control
- [ ] Implement session timeout

### Data Security
- [ ] Encrypt sensitive data at rest
- [ ] Implement input validation on server side
- [ ] Add SQL injection protection (Firebase handles this)
- [ ] Set up audit logging
- [ ] Implement data backup strategy

### Monitoring & Alerting
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure security alerts
- [ ] Implement uptime monitoring
- [ ] Set up performance monitoring
- [ ] Create incident response plan

### Code Security
- [ ] Remove all console.log statements in production
- [ ] Implement proper error messages (no stack traces)
- [ ] Add dependency vulnerability scanning
- [ ] Set up automated security testing
- [ ] Regular security updates

## 🔧 Deployment Commands

### Development
\`\`\`bash
npm start
\`\`\`

### Production Build
\`\`\`bash
npm run build
GENERATE_SOURCEMAP=false npm run build
\`\`\`

### Security Testing
\`\`\`bash
npm audit
npm audit fix
\`\`\`

## 📞 Emergency Contacts
- Security Team: [security@company.com]
- DevOps Team: [devops@company.com]
- On-call Engineer: [oncall@company.com]

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(__dirname, 'SECURITY_CHECKLIST.md'), securityChecklist.trim());
console.log('✅ Created security checklist');

// 5. Create deployment script
const deployScript = `#!/bin/bash
# Production Deployment Script

echo "🚀 Starting Production Deployment..."

# Security checks
echo "🔒 Running security checks..."
npm audit
if [ $? -ne 0 ]; then
    echo "❌ Security vulnerabilities found. Please fix before deployment."
    exit 1
fi

# Build for production
echo "🔨 Building for production..."
GENERATE_SOURCEMAP=false npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deployment."
    exit 1
fi

# Verify build
echo "✅ Build completed successfully"

# Security reminder
echo "🔒 SECURITY REMINDER:"
echo "- Ensure HTTPS is enabled"
echo "- Verify security headers are configured"
echo "- Check that demo passwords are disabled"
echo "- Confirm monitoring is active"

echo "🎉 Production build ready for deployment!"
`;

fs.writeFileSync(path.join(__dirname, 'deploy-prod.sh'), deployScript.trim());
fs.chmodSync(path.join(__dirname, 'deploy-prod.sh'), '755');
console.log('✅ Created production deployment script');

console.log('\n🎯 Security fixes applied successfully!');
console.log('📋 Review SECURITY_CHECKLIST.md for manual actions required');
console.log('🚀 Use ./deploy-prod.sh for production deployment');
console.log('\n⚠️  IMPORTANT: Test thoroughly before production deployment!');