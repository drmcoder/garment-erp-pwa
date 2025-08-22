# Firebase Setup Guide for Garment ERP

This guide will help you set up Firebase for the Garment ERP PWA application.

## Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

## Firebase Project Setup

1. **Create Firebase Project** (if not already created):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name (e.g., "garment-erp-pwa")
   - Enable Google Analytics if desired

2. **Initialize Firebase in your project**:
   ```bash
   firebase init
   ```
   
   Select the following services:
   - ✅ Firestore: Configure security rules and indexes files
   - ✅ Storage: Configure a security rules file for Firebase Storage
   - ✅ Hosting: Configure files for Firebase Hosting

## Database Permissions Issue Fix

If you're getting "Missing or insufficient permissions" error, choose one of these solutions:

### Option 1: Deploy Security Rules (Recommended)
```bash
firebase deploy --only firestore:rules,storage:rules
```

### Option 2: Temporary Test Mode (Development Only)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to your project → Firestore Database
3. Go to "Rules" tab
4. Replace rules with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
5. Click "Publish"

⚠️ **Warning**: Test mode rules allow anyone to read/write your database. Use only for development!

## Configuration Files Created

This setup created the following files:
- `firestore.rules` - Database security rules
- `storage.rules` - Storage security rules  
- `firebase.json` - Firebase configuration
- `firestore.indexes.json` - Database indexes for better performance

## Deploy to Firebase Hosting

1. **Build your app**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   ```bash
   firebase deploy
   ```

## Environment Variables

Make sure your `src/config/firebase.js` has the correct Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Database Structure

The app will automatically create these collections:
- `operators` - Operator user profiles
- `supervisors` - Supervisor user profiles  
- `management` - Management user profiles
- `bundles` - Work bundles/orders
- `notifications` - System notifications
- `production_stats` - Daily production statistics
- `quality_issues` - Quality control reports
- `size_configs` - Size configurations
- `machine_configs` - Machine type configurations
- `line_status` - Production line status
- `wage_records` - Wage calculation records

## Demo Users

After database initialization, these demo users will be available:

**Operators:**
- Username: `ram.singh` / Password: `password123`
- Username: `sita.devi` / Password: `password123`
- Username: `hari.bahadur` / Password: `password123`

**Supervisor:**
- Username: `supervisor` / Password: `super123`

**Management:**
- Username: `management` / Password: `mgmt123`

## Troubleshooting

1. **Permission Errors**: Deploy security rules or enable test mode
2. **Index Errors**: Firebase will provide links to create required indexes
3. **Network Errors**: Check Firebase configuration and network connection
4. **Auth Errors**: Verify Firebase Auth is enabled in console

## Production Security

Before going to production:
1. Review and update security rules in `firestore.rules`
2. Enable Firebase Authentication
3. Set up proper user roles and permissions
4. Enable Firebase App Check for additional security
5. Monitor usage in Firebase Console

For more details, see the [Firebase Documentation](https://firebase.google.com/docs).