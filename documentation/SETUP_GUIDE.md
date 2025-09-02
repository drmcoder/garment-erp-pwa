# 🚀 Garment ERP PWA - Setup & Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Firebase Configuration](#firebase-configuration)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Testing Setup](#testing-setup)
- [Troubleshooting](#troubleshooting)

---

## ⚙️ Prerequisites

### **System Requirements**
- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (or Yarn 3.x)
- **Git**: Latest version
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+

### **Required Accounts**
- **Firebase Account**: For backend services
- **GitHub Account**: For version control
- **Netlify Account**: For deployment (optional)

### **Development Tools (Recommended)**
- **VS Code**: With React/JavaScript extensions
- **Firebase CLI**: For Firebase management
- **Git**: For version control

---

## 💻 Development Setup

### **1. Clone the Repository**
```bash
# Clone the repository
git clone https://github.com/your-username/garment-erp-pwa.git
cd garment-erp-pwa

# Check Node.js version
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

### **2. Install Dependencies**
```bash
# Install all project dependencies
npm install

# If you encounter permission issues on macOS/Linux
sudo npm install

# Alternative: Use Yarn
yarn install
```

### **3. Verify Installation**
```bash
# Check if all dependencies installed correctly
npm list --depth=0

# Check for security vulnerabilities
npm audit

# Fix any vulnerabilities
npm audit fix
```

---

## 🔥 Firebase Configuration

### **1. Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `garment-erp-production` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Create project

### **2. Enable Firebase Services**

#### **Authentication**
1. Go to Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Enable "Email link (passwordless sign-in)" if needed

#### **Firestore Database**
1. Go to Firestore Database
2. Click "Create database"
3. Start in **Production mode** (we'll configure rules later)
4. Choose location closest to your users

#### **Hosting (Optional)**
1. Go to Hosting
2. Click "Get started"
3. Follow the setup instructions

### **3. Get Firebase Configuration**
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app (</>) 
4. Enter app nickname: "Garment ERP PWA"
5. Check "Also set up Firebase Hosting"
6. Copy the configuration object:

```javascript
// This is what you'll get (example)
const firebaseConfig = {
  apiKey: "AIzaSyC9...",
  authDomain: "garment-erp-xxxx.firebaseapp.com",
  projectId: "garment-erp-xxxx",
  storageBucket: "garment-erp-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### **4. Create Firebase Service Account (For Admin Operations)**
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Store it securely (never commit to Git)

---

## 🔧 Environment Configuration

### **1. Create Environment Files**
Create these files in your project root:

```bash
# Development environment
touch .env.development

# Production environment  
touch .env.production

# Local environment (for sensitive data)
touch .env.local
```

### **2. Configure .env.development**
```bash
# .env.development
REACT_APP_ENV=development
REACT_APP_APP_NAME=Garment ERP PWA
REACT_APP_VERSION=2.0.0

# Firebase Config (Development)
REACT_APP_FIREBASE_API_KEY=your_development_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-dev-project
REACT_APP_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_API_TIMEOUT=30000

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_PERFORMANCE_MONITORING=false
REACT_APP_DEBUG_MODE=true
```

### **3. Configure .env.production**
```bash
# .env.production
REACT_APP_ENV=production
REACT_APP_APP_NAME=Garment ERP PWA
REACT_APP_VERSION=2.0.0

# Firebase Config (Production)
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-prod-project
REACT_APP_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=987654321
REACT_APP_FIREBASE_APP_ID=1:987654321:web:fedcba654321

# API Configuration
REACT_APP_API_BASE_URL=https://your-production-domain.com
REACT_APP_API_TIMEOUT=30000

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_DEBUG_MODE=false
```

### **4. Update Firebase Configuration File**
Update `src/config/firebase.js`:

```javascript
// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connect to emulators in development
if (process.env.REACT_APP_ENV === 'development' && !auth._delegate._config.emulator) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.log('⚠️ Firebase emulators not available, using production');
  }
}

export default app;
```

---

## 🗄️ Database Setup

### **1. Configure Firestore Security Rules**
Create `firestore.rules`:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can read their own profile, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      request.auth.token.role in ['admin', 'manager']);
      allow write: if request.auth != null && 
                      (request.auth.uid == userId || 
                       request.auth.token.role in ['admin']);
    }
    
    // Work items - operators can read their assigned work, supervisors can read all
    match /workItems/{workItemId} {
      allow read: if request.auth != null && 
                     (resource.data.operatorId == request.auth.uid ||
                      request.auth.token.role in ['supervisor', 'admin', 'manager']);
      allow create: if request.auth != null && 
                       request.auth.token.role in ['supervisor', 'admin'];
      allow update: if request.auth != null && 
                       (resource.data.operatorId == request.auth.uid ||
                        request.auth.token.role in ['supervisor', 'admin']);
    }
    
    // Damage reports - operators can create, supervisors can handle
    match /damage_reports/{reportId} {
      allow read: if request.auth != null && 
                     (resource.data.operatorId == request.auth.uid ||
                      resource.data.supervisorId == request.auth.uid ||
                      request.auth.token.role in ['admin', 'manager']);
      allow create: if request.auth != null && 
                       request.auth.token.role in ['operator', 'supervisor', 'admin'];
      allow update: if request.auth != null && 
                       (resource.data.supervisorId == request.auth.uid ||
                        request.auth.token.role in ['admin']);
    }
    
    // Operator wallets - users can read their own wallet
    match /operatorWallets/{operatorId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == operatorId ||
                      request.auth.token.role in ['admin', 'manager']);
      allow write: if request.auth != null && 
                      request.auth.token.role in ['admin', 'system'];
    }
    
    // Wage records - operators can read their own records
    match /wageRecords/{recordId} {
      allow read: if request.auth != null && 
                     (resource.data.operatorId == request.auth.uid ||
                      request.auth.token.role in ['admin', 'manager']);
      allow create: if request.auth != null && 
                       request.auth.token.role in ['admin', 'system'];
    }
    
    // Notifications - users can read their own notifications
    match /notifications/{notificationId} {
      allow read, update: if request.auth != null && 
                             resource.data.recipientId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### **2. Configure Firestore Indexes**
Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "workItems",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "operatorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "assignedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workItems",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "selfAssignedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "damage_reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "supervisorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "reportedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "damage_reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "operatorId", "order": "ASCENDING" },
        { "fieldPath": "reportedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "wageRecords",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "operatorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recipientId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### **3. Deploy Security Rules and Indexes**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore (Configure security rules and indexes)
# - Hosting (Configure hosting)

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### **4. Create Initial Data**
Create `scripts/setup-initial-data.js`:

```javascript
// scripts/setup-initial-data.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const db = admin.firestore();

const createInitialData = async () => {
  try {
    // Create sample users
    const users = [
      {
        id: 'admin1',
        email: 'admin@garment-erp.com',
        name: 'System Admin',
        role: 'admin',
        permissions: ['*'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'supervisor1', 
        email: 'supervisor@garment-erp.com',
        name: 'Floor Supervisor',
        role: 'supervisor',
        department: 'sewing',
        permissions: ['assign_work', 'handle_damage', 'view_reports'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'operator1',
        email: 'operator1@garment-erp.com', 
        name: 'John Smith',
        role: 'operator',
        skills: ['overlock', 'single_needle', 'basic_sewing'],
        permissions: ['complete_work', 'report_damage', 'self_assign'],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    // Create users in Firestore
    for (const user of users) {
      await db.collection('users').doc(user.id).set(user);
      console.log(`✅ Created user: ${user.name}`);
    }

    // Create sample work items
    const workItems = [
      {
        bundleNumber: 'B001',
        articleNumber: '8085',
        articleName: 'Blue T-Shirt',
        operation: 'Sleeve Attachment', 
        pieces: 20,
        rate: 15,
        totalValue: 300,
        status: 'pending',
        machineType: 'overlock',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        bundleNumber: 'B002',
        articleNumber: '8086',
        articleName: 'Red Polo Shirt',
        operation: 'Button Sewing',
        pieces: 15,
        rate: 8,
        totalValue: 120,
        status: 'pending', 
        machineType: 'single_needle',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    // Create work items
    for (const workItem of workItems) {
      const docRef = await db.collection('workItems').add(workItem);
      console.log(`✅ Created work item: ${workItem.bundleNumber} (${docRef.id})`);
    }

    console.log('🎉 Initial data setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up initial data:', error);
    process.exit(1);
  }
};

createInitialData();
```

Run the script:
```bash
node scripts/setup-initial-data.js
```

---

## 🏃‍♂️ Local Development

### **1. Start Development Server**
```bash
# Start the development server
npm start

# Or with custom port
PORT=3001 npm start

# The app will open at http://localhost:3000 (or your custom port)
```

### **2. Development Commands**
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### **3. Firebase Emulator Setup (Optional but Recommended)**
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Start Firebase emulators
firebase emulators:start

# This will start:
# - Firestore emulator on port 8080
# - Authentication emulator on port 9099  
# - Hosting emulator on port 5000
```

### **4. Environment-Specific Builds**
```bash
# Development build
npm run build:dev

# Production build  
npm run build:prod

# Staging build
npm run build:staging
```

---

## 🚀 Production Deployment

### **1. Build for Production**
```bash
# Create production build
npm run build

# The build folder will contain optimized production files
ls build/
```

### **2. Firebase Hosting Deployment**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting (if not done already)
firebase init hosting

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy with custom message
firebase deploy --only hosting -m "Version 2.0.0 release"
```

### **3. Netlify Deployment**

#### **Option A: Git Integration**
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Set environment variables in Netlify dashboard

#### **Option B: Manual Deployment**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to Netlify
netlify deploy --prod --dir=build

# Or deploy with build command
netlify deploy --prod --build
```

### **4. Custom Server Deployment**

#### **Using PM2 (Process Manager)**
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
touch ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'garment-erp-pwa',
    script: 'serve',
    args: '-s build -l 3000',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### **5. Docker Deployment**
Create `Dockerfile`:

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:
```bash
# Build Docker image
docker build -t garment-erp-pwa .

# Run Docker container
docker run -p 80:80 garment-erp-pwa
```

---

## 🧪 Testing Setup

### **1. Unit Testing Setup**
```bash
# Install testing dependencies (if not already installed)
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### **2. E2E Testing Setup**
```bash
# Install Cypress
npm install --save-dev cypress

# Open Cypress test runner
npx cypress open

# Run Cypress tests headless
npm run test:e2e
```

### **3. Performance Testing Setup**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Or use the Chrome DevTools Lighthouse tab
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Firebase Configuration Errors**
```bash
# Error: Firebase config not found
# Solution: Check environment variables
echo $REACT_APP_FIREBASE_API_KEY

# If empty, check .env file exists and has correct variables
cat .env.local
```

#### **2. Build Failures**
```bash
# Error: Out of memory during build
# Solution: Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Error: Module not found  
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **3. Firebase Rules Permission Denied**
```bash
# Check if user has proper authentication and role
# In browser console:
firebase.auth().currentUser.getIdTokenResult().then(result => {
  console.log('User role:', result.claims.role);
  console.log('User permissions:', result.claims.permissions);
});
```

#### **4. Firestore Index Errors**
```bash
# Deploy missing indexes
firebase deploy --only firestore:indexes

# Check index status in Firebase console
# Go to Firestore → Indexes tab
```

#### **5. PWA Installation Issues**
```bash
# Check service worker registration
# In browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service workers:', registrations);
});

# Clear service worker cache
# In Application tab → Storage → Clear storage
```

### **Debug Mode**
Enable debug mode in development:

```javascript
// In .env.development
REACT_APP_DEBUG_MODE=true

// This enables:
// - Detailed console logging
// - Firebase debug mode
// - Performance monitoring
// - Error boundary details
```

### **Health Check Endpoint**
Create a health check for monitoring:

```javascript
// src/utils/healthCheck.js
export const healthCheck = async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.REACT_APP_VERSION,
    environment: process.env.REACT_APP_ENV,
    checks: {
      firebase: false,
      database: false,
      authentication: false
    }
  };

  try {
    // Test Firebase connection
    await import('../config/firebase');
    checks.checks.firebase = true;
    
    // Test Firestore
    const db = (await import('../config/firebase')).db;
    await db.collection('health').doc('test').get();
    checks.checks.database = true;
    
    // Test Authentication
    const auth = (await import('../config/firebase')).auth;
    checks.checks.authentication = !!auth;
    
  } catch (error) {
    checks.status = 'unhealthy';
    checks.error = error.message;
  }

  return checks;
};
```

### **Performance Monitoring**
Monitor app performance in production:

```javascript
// src/utils/monitoring.js
export const trackPerformance = (metricName, value, tags = {}) => {
  if (process.env.REACT_APP_ENV === 'production') {
    // Send to monitoring service
    console.log(`Performance metric: ${metricName}`, { value, tags });
  }
};

// Usage
trackPerformance('page_load_time', loadTime, { page: 'dashboard' });
trackPerformance('api_response_time', responseTime, { endpoint: 'work_items' });
```

---

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Firebase security rules deployed
- [ ] Database indexes created
- [ ] All tests passing
- [ ] Build successful
- [ ] Performance audit passed (Lighthouse score > 85)
- [ ] Security audit passed
- [ ] Accessibility compliance checked

### **Deployment**
- [ ] Production build created
- [ ] Deployed to hosting service
- [ ] SSL certificate configured
- [ ] Custom domain configured (if applicable)
- [ ] CDN configured (if applicable)
- [ ] Monitoring enabled

### **Post-Deployment**
- [ ] Health check endpoint responding
- [ ] Critical user flows tested
- [ ] Performance monitoring active
- [ ] Error tracking enabled
- [ ] User feedback mechanism active
- [ ] Documentation updated

---

This setup guide provides comprehensive instructions for getting the Garment ERP PWA running in both development and production environments, with proper Firebase integration and deployment options.