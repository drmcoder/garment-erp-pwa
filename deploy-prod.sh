#!/bin/bash
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