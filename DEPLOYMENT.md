# 🚀 Deployment Guide - Garment ERP PWA

This guide explains the multi-environment deployment strategy similar to mobile app development cycles.

## 🌍 Environment Structure

```
📦 Production (Live Users)
├── URL: https://garment-erp-nepal.netlify.app
├── Branch: main
└── Purpose: Stable, tested features for end users

📦 Staging (Testing)
├── URL: https://staging--garment-erp-nepal.netlify.app  
├── Branch: staging
└── Purpose: Final testing before production release

📦 Development (Active Development)
├── URL: https://dev--garment-erp-nepal.netlify.app
├── Branch: develop
└── Purpose: Integration of new features

📦 Feature Previews
├── URL: https://deploy-preview-{PR#}--garment-erp-nepal.netlify.app
├── Branch: feature/*
└── Purpose: Preview specific features before merging
```

## 🔄 Development Workflow

### 1. **Feature Development**
```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/operator-avatars

# Develop your feature...
git add .
git commit -m "Add operator avatar system"
git push origin feature/operator-avatars
```

### 2. **Create Pull Request**
- Create PR from `feature/operator-avatars` → `develop`
- Netlify automatically creates preview deployment
- Review changes on preview URL
- Merge after approval

### 3. **Development Integration**  
```bash
# Feature merged to develop
# Automatically deploys to: https://dev--garment-erp-nepal.netlify.app
```

### 4. **Staging Deployment**
```bash
# When ready for testing
git checkout staging
git pull origin staging
git merge develop
git push origin staging
# Automatically deploys to: https://staging--garment-erp-nepal.netlify.app
```

### 5. **Production Deployment**
```bash
# After thorough testing on staging
git checkout main  
git pull origin main
git merge staging
git push origin main
# Automatically deploys to: https://garment-erp-nepal.netlify.app
```

## ⚙️ Environment Configuration

Each environment has specific settings in `src/config/environments.js`:

```javascript
// Development: Debug enabled, mock data, testing features
development: {
  debug: true,
  mockData: true,
  testingPanel: true
}

// Staging: Testing environment, no debug, real data
staging: {
  debug: false,
  mockData: false,
  testingPanel: true
}

// Production: Live environment, analytics enabled
production: {
  debug: false,
  analytics: true,
  mockData: false
}
```

## 🛠️ Setup Instructions

### 1. **Netlify Configuration**
- Connect GitHub repository to Netlify
- Set up branch-based deployments:
  - `main` branch → Production site
  - `staging` branch → Staging site  
  - `develop` branch → Development site
- Configure environment variables in Netlify dashboard

### 2. **GitHub Secrets** (if using GitHub Actions)
```
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id  
SLACK_WEBHOOK_URL=your_slack_webhook (optional)
```

### 3. **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm start  # http://localhost:3000

# Build for production
npm run build

# Test production build
npm run preview
```

## 🚨 Deployment Checklist

### Before Staging Deployment:
- [ ] All features tested locally
- [ ] No console errors in development
- [ ] Mobile responsiveness verified
- [ ] Nepali language support working
- [ ] Database connections configured

### Before Production Deployment:
- [ ] Staging thoroughly tested by team
- [ ] Performance optimized (< 3s load time)
- [ ] Security audit passed
- [ ] Backup procedures in place
- [ ] Rollback plan ready

## 🔥 Hotfix Process

For urgent production fixes:

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/urgent-payment-fix

# Fix the issue...
git add .
git commit -m "Fix payment calculation bug"

# Deploy directly to main (skip staging for urgent fixes)
git checkout main
git merge hotfix/urgent-payment-fix
git push origin main  # Auto-deploys immediately

# Don't forget to merge back to develop
git checkout develop
git merge hotfix/urgent-payment-fix
git push origin develop
```

## 📊 Monitoring & Analytics

### Environment-specific monitoring:
- **Production**: Full analytics, error tracking, performance monitoring
- **Staging**: Limited analytics, detailed error logs for debugging  
- **Development**: Console logs, debugging tools enabled

### Deployment notifications:
- Slack notifications for all deployments
- Email alerts for production deployments
- GitHub status checks for all environments

## 🔄 Benefits of This Setup

✅ **Zero Downtime**: Users always have access to stable version  
✅ **Parallel Development**: Multiple features developed simultaneously  
✅ **Thorough Testing**: Staging environment mirrors production  
✅ **Quick Rollbacks**: Easy to revert if issues arise  
✅ **Preview Features**: Stakeholders can preview features before release  
✅ **Continuous Integration**: Automated testing and deployment

This setup provides the same benefits as mobile app development with App Store releases - users get stable versions while development continues in the background!