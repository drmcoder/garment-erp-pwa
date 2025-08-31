# Garment ERP PWA - Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the Garment ERP PWA system across different environments.

## Environment Setup

### Prerequisites
- Node.js 18+ 
- npm 8+
- Firebase CLI
- Git
- Domain access (for production)

### Environment Types
- **Development** - Local development environment
- **Staging** - Testing environment with production-like setup
- **Production** - Live production environment

## Firebase Project Setup

### 1. Create Firebase Projects
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create projects for each environment
firebase projects:create garment-erp-dev
firebase projects:create garment-erp-staging  
firebase projects:create garment-erp-prod
```

### 2. Initialize Firebase in Project
```bash
# In your project root
firebase init

# Select:
# - Firestore
# - Authentication  
# - Hosting
# - Functions (if needed)
```

### 3. Configure Firebase Projects
```javascript
// src/config/firebase.js
const firebaseConfigs = {
  development: {
    apiKey: "dev-api-key",
    authDomain: "garment-erp-dev.firebaseapp.com",
    projectId: "garment-erp-dev",
    storageBucket: "garment-erp-dev.appspot.com",
    messagingSenderId: "123456789",
    appId: "dev-app-id"
  },
  staging: {
    apiKey: "staging-api-key", 
    authDomain: "garment-erp-staging.firebaseapp.com",
    projectId: "garment-erp-staging",
    storageBucket: "garment-erp-staging.appspot.com",
    messagingSenderId: "123456789",
    appId: "staging-app-id"
  },
  production: {
    apiKey: "prod-api-key",
    authDomain: "garment-erp-prod.firebaseapp.com", 
    projectId: "garment-erp-prod",
    storageBucket: "garment-erp-prod.appspot.com",
    messagingSenderId: "123456789",
    appId: "prod-app-id"
  }
};

const config = firebaseConfigs[process.env.REACT_APP_ENVIRONMENT || 'development'];
```

## Environment Variables

### Development (.env.development)
```env
REACT_APP_ENVIRONMENT=development
REACT_APP_FIREBASE_API_KEY=your-dev-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=garment-erp-dev.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=garment-erp-dev
REACT_APP_FIREBASE_STORAGE_BUCKET=garment-erp-dev.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-dev-app-id
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug
```

### Production (.env.production)
```env
REACT_APP_ENVIRONMENT=production
REACT_APP_FIREBASE_API_KEY=your-prod-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain.com
REACT_APP_FIREBASE_PROJECT_ID=garment-erp-prod
REACT_APP_FIREBASE_STORAGE_BUCKET=garment-erp-prod.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-prod-app-id
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error
```

## Build Process

### Development Build
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run with specific environment
REACT_APP_ENVIRONMENT=development npm start
```

### Production Build
```bash
# Clean install
npm ci

# Run tests
npm test

# Build for production
npm run build

# Verify build
npm run build:analyze
```

This deployment guide ensures a secure, performant, and maintainable deployment process for your Garment ERP PWA across all environments.