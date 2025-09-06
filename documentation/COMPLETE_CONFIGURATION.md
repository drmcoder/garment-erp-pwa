# Complete Configuration Documentation - Garment ERP PWA

## 1. Package Configuration & Dependencies

### Complete Package.json Structure
```json
{
  "name": "garment-erp-pwa",
  "version": "1.0.0",
  "description": "Garment ERP Production Management System with Nepali Language Support",
  "private": true,
  "homepage": "./",
  
  "dependencies": {
    "@netlify/functions": "^2.8.2",
    "date-fns": "^4.1.0", 
    "firebase": "^10.14.1",
    "lucide-react": "^0.263.1",
    "nepali-date-converter": "^3.4.0",
    "nepali-datepicker-reactjs": "^1.1.9",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.30.1",
    "react-scripts": "5.0.1",
    "recharts": "^3.1.2",
    "workbox-webpack-plugin": "^6.5.4",
    "workbox-window": "^6.5.4",
    "zustand": "^5.0.8"
  },
  
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.3",
    "@tailwindcss/typography": "^0.5.9",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^8.57.1",
    "netlify-cli": "^17.10.1",
    "postcss": "^8.5.6",
    "prettier": "^2.8.8",
    "tailwindcss": "^3.4.17"
  },

  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build && npm run build-sw",
    "build-sw": "node scripts/build-sw.js",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "deploy": "npm run build && netlify deploy --prod",
    "dev": "netlify dev",
    "netlify:dev": "netlify dev",
    "netlify:build": "netlify build",
    "netlify:deploy": "netlify deploy",
    "build:dev": "REACT_APP_ENVIRONMENT=development npm run build",
    "build:staging": "REACT_APP_ENVIRONMENT=staging npm run build",
    "build:prod": "REACT_APP_ENVIRONMENT=production npm run build",
    "deploy:dev": "npm run build:dev && netlify deploy --alias=dev",
    "deploy:staging": "npm run build:staging && netlify deploy --alias=staging",
    "deploy:prod": "npm run build:prod && netlify deploy --prod",
    "preview": "npx serve -s build -l 3000",
    "lint": "eslint src --ext .js,.jsx",
    "netlify:deploy:prod": "netlify deploy --prod",
    "lint:fix": "eslint src --ext .js,.jsx --fix",
    "format": "prettier --write src/**/*.{js,jsx,css,md}",
    "init-firestore": "node initialize_firestore_data.js",
    "clear-firestore": "node clear_firestore_data.js",
    "reset-firestore": "npm run clear-firestore -- --force && npm run init-firestore",
    "setup": "npm install && npm run init-firestore"
  },
  
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

## 2. Environment Configuration

### Development Environment (.env)
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M
REACT_APP_FIREBASE_AUTH_DOMAIN=code-for-erp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=code-for-erp
REACT_APP_FIREBASE_STORAGE_BUCKET=code-for-erp.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=490842962773
REACT_APP_FIREBASE_APP_ID=1:490842962773:web:b2a5688d22416ebc710ddc

# App Configuration
REACT_APP_ENVIRONMENT=production
REACT_APP_APP_NAME=गारमेन्ट ERP
REACT_APP_DEFAULT_LANGUAGE=np
REACT_APP_DEMO_MODE=false
REACT_APP_API_URL=/api

# Development Server
FAST_REFRESH=true
CI=false
```

### Production Environment (.env.production)
```bash
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_CONSOLE_LOGS=false
REACT_APP_DEMO_MODE=false
GENERATE_SOURCEMAP=false
```

## 3. Firebase Configuration

### Core Firebase Setup (src/config/firebase.js)
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M",
  authDomain: "code-for-erp.firebaseapp.com",
  projectId: "code-for-erp",
  storageBucket: "code-for-erp.firebasestorage.app",
  messagingSenderId: "490842962773",
  appId: "1:490842962773:web:b2a5688d22416ebc710ddc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app);

// Firestore Collection Names
export const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors", 
  MANAGEMENT: "management",
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  WORK_ITEMS: "workItems",
  WORK_COMPLETIONS: "workCompletions",
  WIP_ENTRIES: "wipEntries",
  WIP_ROLLS: "wipRolls",
  ASSIGNMENT_HISTORY: "assignmentHistory",
  QUALITY_ISSUES: "qualityIssues",
  PRODUCTION_STATS: "productionStats",
  EFFICIENCY_LOGS: "efficiencyLogs",
  OPERATOR_EARNINGS: "operatorEarnings",
  NOTIFICATIONS: "notifications",
  DAILY_REPORTS: "dailyReports",
  LINE_STATUS: "lineStatus",
  SIZE_CONFIGS: "sizeConfigs",
  MACHINE_CONFIGS: "machineConfigs",
  ARTICLE_TEMPLATES: "articleTemplates",
  DELETED_TEMPLATES: "deletedTemplates",
  SYSTEM_SETTINGS: "systemSettings",
  WAGE_RECORDS: "wageRecords"
};

export default app;
```

### Realtime Database Configuration (src/config/realtime-firebase.js)
```javascript
export const RT_PATHS = {
  OPERATOR_STATUS: 'operator_status',
  WORK_PROGRESS: 'work_progress',
  STATION_STATUS: 'station_status', 
  LIVE_METRICS: 'live_metrics',
  NOTIFICATIONS: 'notifications',
  SYSTEM_HEALTH: 'system_health',
  ACTIVE_SESSIONS: 'active_sessions',
  AVAILABLE_WORK: 'available_work',
  LINE_BALANCING: 'line_balancing'
};

export const REALTIME_CONFIG = {
  connectionTimeout: 10000,
  maxRetries: 3,
  retryDelay: 2000,
  heartbeatInterval: 30000
};
```

### Firestore Security Rules (firestore.rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Development rules - allow all reads/writes for now
    match /{document=**} {
      allow read, write: if true;
    }
    
    // Production rules (commented for development)
    /*
    // User collections with role-based access
    match /operators/{operatorId} {
      allow read, write: if request.auth != null 
        && (resource.data.id == request.auth.uid 
        || hasRole(request.auth.uid, ['supervisor', 'management']));
    }
    
    // Work data access control
    match /bundles/{bundleId} {
      allow read: if request.auth != null;
      allow write: if hasRole(request.auth.uid, ['supervisor', 'management']);
    }
    
    // Helper functions
    function hasRole(userId, roles) {
      return exists(/databases/$(database)/documents/users/$(userId)) 
        && get(/databases/$(database)/documents/users/$(userId)).data.role in roles;
    }
    */
  }
}
```

### Firestore Indexes (firestore.indexes.json)
```json
{
  "indexes": [
    {
      "collectionGroup": "bundles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "priority", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bundles", 
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "assignedOperator", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "assignedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workAssignments",
      "queryScope": "COLLECTION", 
      "fields": [
        { "fieldPath": "operatorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "assignedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "targetUser", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "qualityIssues",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "bundleId", "order": "ASCENDING" },
        { "fieldPath": "reportedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "operators",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "wipEntries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "machineType", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "wipRolls",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "wipEntryId", "order": "ASCENDING" },
        { "fieldPath": "rollNumber", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## 4. PWA Configuration

### Web App Manifest (public/manifest.json)
```json
{
  "name": "TSA Production Management System - AI Powered for Line Balancing",
  "short_name": "TSA Production",
  "description": "Garment ERP Production Management System with Nepali Language Support", 
  "version": "1.0.0",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#2563eb",
  "background_color": "#f8fafc",
  "scope": "/",
  "lang": "en",
  
  "icons": [
    {
      "src": "/logo192.png",
      "sizes": "192x192", 
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/logo512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  
  "shortcuts": [
    {
      "name": "Operator Dashboard",
      "short_name": "Operator",
      "description": "Access operator work dashboard",
      "url": "/operator",
      "icons": [{ "src": "/icons/operator-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Supervisor Dashboard", 
      "short_name": "Supervisor",
      "description": "Access supervisor management dashboard",
      "url": "/supervisor",
      "icons": [{ "src": "/icons/supervisor-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Complete Work",
      "short_name": "Complete",
      "description": "Complete current work assignment", 
      "url": "/operator?action=complete",
      "icons": [{ "src": "/icons/complete-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Quality Report",
      "short_name": "Quality",
      "description": "Report quality issues",
      "url": "/operator?action=quality", 
      "icons": [{ "src": "/icons/quality-192.png", "sizes": "192x192" }]
    }
  ],
  
  "categories": ["business", "productivity", "utilities"],
  "related_applications": [],
  "prefer_related_applications": false,
  
  "file_handlers": [
    {
      "action": "/import-data",
      "accept": {
        "application/json": [".json"],
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".xls", ".xlsx"]
      }
    }
  ],
  
  "custom": {
    "supported_languages": ["en", "ne"],
    "default_language": "ne",
    "size_configurations": {
      "standard-shirt": ["L", "XL", "2XL", "3XL"],
      "numeric-sizes": ["20", "22", "24", "26", "28", "30", "32"]
    },
    "machine_types": [
      "overlock", "flatlock", "single-needle", 
      "buttonhole", "button-attach", "iron", "cutting", "pressing"
    ],
    "features": {
      "offline_work": true,
      "push_notifications": true,
      "background_sync": true,
      "file_handling": true
    }
  }
}
```

### Service Worker Configuration (public/sw.js)
```javascript
const CACHE_NAME = "garment-erp-v2";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
  "/offline.html"
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event with different strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  
  // Network first for API calls
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
  // Cache first for static assets
  else {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
        .catch(() => caches.match('/offline.html'))
    );
  }
});

// Push notification handling
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const { title, body, icon, badge, tag, data: notificationData } = data;
  
  const options = {
    body: body || "नयाँ सूचना प्राप्त भयो",
    icon: icon || "/logo192.png", 
    badge: badge || "/badge-72x72.png",
    tag: tag || "general",
    data: notificationData,
    requireInteraction: true,
    actions: [
      { action: "view", title: "हेर्नुहोस्", icon: "/icons/view.png" },
      { action: "dismiss", title: "बन्द गर्नुहोस्", icon: "/icons/close.png" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title || "TSA Production", options)
  );
});

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "work-completion") {
    event.waitUntil(syncWorkCompletion());
  }
});

async function syncWorkCompletion() {
  // Sync pending work completion data
  const pendingData = await getStoredData("pendingWorkCompletions");
  
  for (const completion of pendingData) {
    try {
      await fetch("/api/work/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completion)
      });
      await removeStoredData("pendingWorkCompletions", completion.id);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
}
```

## 5. Styling Configuration

### Tailwind CSS Configuration (tailwind.config.js)
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0', 
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        warning: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171', 
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        }
      },
      fontFamily: {
        nepali: ['Noto Sans Devanagari', 'Arial Unicode MS', 'sans-serif'],
        sans: ['Inter', 'Noto Sans', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 1s infinite',
        'spin-slow': 'spin 3s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' }
        }
      },
      screens: {
        'xs': '375px',
        'sm': '640px', 
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('@tailwindcss/typography')
  ]
}
```

### PostCSS Configuration (postcss.config.js)
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

## 6. Application Constants

### Machine Types (src/constants/machineTypes.js)
```javascript
export const MACHINE_TYPES = {
  'single-needle': {
    name: 'Single Needle',
    nameNp: 'एकल सुई',
    nameEn: 'Single Needle',
    icon: '📍',
    category: 'sewing',
    averageSpeed: 35, // pieces per hour
    difficulty: 'medium'
  },
  'overlock': {
    name: 'Overlock',
    nameNp: 'ओभरलक',
    nameEn: 'Overlock',
    icon: '🔗',
    category: 'sewing', 
    averageSpeed: 45,
    difficulty: 'easy'
  },
  'flatlock': {
    name: 'Flatlock',
    nameNp: 'फ्ल्याटलक',
    nameEn: 'Flatlock', 
    icon: '📎',
    category: 'sewing',
    averageSpeed: 40,
    difficulty: 'easy'
  },
  'buttonhole': {
    name: 'Buttonhole',
    nameNp: 'बटनहोल',
    nameEn: 'Buttonhole',
    icon: '🕳️',
    category: 'finishing',
    averageSpeed: 25,
    difficulty: 'hard'
  },
  'cutting': {
    name: 'Cutting',
    nameNp: 'काट्ने',
    nameEn: 'Cutting',
    icon: '✂️', 
    category: 'preparation',
    averageSpeed: 50,
    difficulty: 'medium'
  },
  'pressing': {
    name: 'Pressing',
    nameNp: 'प्रेसिंग',
    nameEn: 'Pressing',
    icon: '🔥',
    category: 'finishing',
    averageSpeed: 60,
    difficulty: 'easy'
  },
  'kansai': {
    name: 'Kansai',
    nameNp: 'कान्साई',
    nameEn: 'Kansai',
    icon: '🏭',
    category: 'sewing',
    averageSpeed: 35,
    difficulty: 'hard'
  }
};

export const MACHINE_CATEGORIES = {
  preparation: { name: 'Preparation', nameNp: 'तयारी', order: 1 },
  sewing: { name: 'Sewing', nameNp: 'सिलाई', order: 2 },  
  finishing: { name: 'Finishing', nameNp: 'समाप्ति', order: 3 }
};
```

### Work Statuses (src/constants/workStatuses.js)
```javascript
export const WORK_STATUSES = {
  'pending': {
    name: 'Pending',
    nameNp: 'पर्खिरहेको',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: '⏳',
    order: 1
  },
  'ready': {
    name: 'Ready',
    nameNp: 'तयार',
    color: 'green', 
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✅',
    order: 2
  },
  'assigned': {
    name: 'Assigned',
    nameNp: 'तोकिएको',
    color: 'blue',
    bgColor: 'bg-blue-100', 
    textColor: 'text-blue-800',
    icon: '👤',
    order: 3
  },
  'self_assigned': {
    name: 'Self Assigned',
    nameNp: 'स्व-तोकिएको',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800', 
    icon: '🙋',
    order: 4
  },
  'in-progress': {
    name: 'In Progress',
    nameNp: 'काममा',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: '🔄',
    order: 5
  },
  'completed': {
    name: 'Completed',
    nameNp: 'सम्पन्न',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✨',
    order: 6
  },
  'quality-check': {
    name: 'Quality Check',
    nameNp: 'गुणस्तर जाँच',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: '🔍',
    order: 7
  },
  'rejected': {
    name: 'Rejected',
    nameNp: 'अस्वीकृत',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800', 
    icon: '❌',
    order: 8
  }
};
```

### Priority Levels (src/constants/priorities.js)
```javascript
export const PRIORITIES = {
  'low': {
    name: 'Low',
    nameNp: 'कम',
    level: 1,
    urgency: 'low',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '🟢',
    order: 1
  },
  'normal': {
    name: 'Normal',
    nameNp: 'सामान्य',
    level: 2,
    urgency: 'medium',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '🟡',
    order: 2
  },
  'high': {
    name: 'High',
    nameNp: 'उच्च',
    level: 3,
    urgency: 'high',
    color: 'orange',
    bgColor: 'bg-orange-100', 
    textColor: 'text-orange-800',
    icon: '🟠',
    order: 3
  },
  'urgent': {
    name: 'Urgent',
    nameNp: 'तुरुन्त',
    level: 4,
    urgency: 'critical',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '🔴',
    order: 4
  },
  'critical': {
    name: 'Critical',
    nameNp: 'अत्यन्त आवश्यक',
    level: 5,
    urgency: 'emergency',
    color: 'red',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    icon: '🚨',
    order: 5
  }
};
```

### Skill Levels (src/constants/skillLevels.js)
```javascript
export const SKILL_LEVELS = {
  'trainee': {
    name: 'Trainee',
    nameNp: 'प्रशिक्षु',
    level: 1,
    multiplier: 0.6,
    targetEfficiency: 60,
    color: 'gray',
    experience: '0-3 months'
  },
  'beginner': {
    name: 'Beginner', 
    nameNp: 'प्रारम्भिक',
    level: 2,
    multiplier: 0.8,
    targetEfficiency: 75,
    color: 'blue',
    experience: '3-12 months'
  },
  'intermediate': {
    name: 'Intermediate',
    nameNp: 'मध्यम',
    level: 3,
    multiplier: 1.0,
    targetEfficiency: 85,
    color: 'green',
    experience: '1-3 years'
  },
  'advanced': {
    name: 'Advanced',
    nameNp: 'उन्नत',
    level: 4,
    multiplier: 1.2,
    targetEfficiency: 90,
    color: 'purple',
    experience: '3-7 years'
  },
  'expert': {
    name: 'Expert',
    nameNp: 'विशेषज्ञ',
    level: 5,
    multiplier: 1.4,
    targetEfficiency: 95,
    color: 'yellow',
    experience: '7+ years'
  }
};
```

### Garment Sizes (src/constants/garmentSizes.js)
```javascript
export const GARMENT_SIZES = {
  // Adult sizes with detailed measurements  
  'XS': {
    name: 'Extra Small',
    nameNp: 'अति सानो',
    category: 'adult',
    measurements: { chest: 32, waist: 28, length: 26 },
    order: 1
  },
  'S': {
    name: 'Small', 
    nameNp: 'सानो',
    category: 'adult',
    measurements: { chest: 36, waist: 30, length: 27 },
    order: 2
  },
  'M': {
    name: 'Medium',
    nameNp: 'मध्यम',
    category: 'adult', 
    measurements: { chest: 38, waist: 32, length: 28 },
    order: 3
  },
  'L': {
    name: 'Large',
    nameNp: 'ठूलो',
    category: 'adult',
    measurements: { chest: 40, waist: 34, length: 29 },
    order: 4
  },
  'XL': {
    name: 'Extra Large',
    nameNp: 'अति ठूलो',
    category: 'adult',
    measurements: { chest: 42, waist: 36, length: 30 },
    order: 5
  },
  'XXL': {
    name: 'Double Extra Large',
    nameNp: 'दोहोरो अति ठूलो', 
    category: 'adult',
    measurements: { chest: 44, waist: 38, length: 31 },
    order: 6
  },
  'XXXL': {
    name: 'Triple Extra Large',
    nameNp: 'ट्रिपल अति ठूलो',
    category: 'adult',
    measurements: { chest: 46, waist: 40, length: 32 },
    order: 7
  },

  // Kids sizes
  '2T': { name: '2T', nameNp: '२ टी', category: 'kids', order: 101 },
  '3T': { name: '3T', nameNp: '३ टी', category: 'kids', order: 102 },
  '4T': { name: '4T', nameNp: '४ टी', category: 'kids', order: 103 },
  '5': { name: '5', nameNp: '५', category: 'kids', order: 104 },
  '6': { name: '6', nameNp: '६', category: 'kids', order: 105 },
  '7': { name: '7', nameNp: '७', category: 'kids', order: 106 },
  '8': { name: '8', nameNp: '८', category: 'kids', order: 107 },
  '10': { name: '10', nameNp: '१०', category: 'kids', order: 108 },
  '12': { name: '12', nameNp: '१२', category: 'kids', order: 109 },
  '14': { name: '14', nameNp: '१४', category: 'kids', order: 110 },
  '16': { name: '16', nameNp: '१६', category: 'kids', order: 111 },

  // Numeric sizes
  '20': { name: '20', nameNp: '२०', category: 'numeric', order: 201 },
  '22': { name: '22', nameNp: '२२', category: 'numeric', order: 202 },
  '24': { name: '24', nameNp: '२४', category: 'numeric', order: 203 },
  '26': { name: '26', nameNp: '२६', category: 'numeric', order: 204 },
  '28': { name: '28', nameNp: '२८', category: 'numeric', order: 205 },
  '30': { name: '30', nameNp: '३०', category: 'numeric', order: 206 },
  '32': { name: '32', nameNp: '३२', category: 'numeric', order: 207 },
  '34': { name: '34', nameNp: '३४', category: 'numeric', order: 208 },
  '36': { name: '36', nameNp: '३६', category: 'numeric', order: 209 },
  '38': { name: '38', nameNp: '३८', category: 'numeric', order: 210 },
  '40': { name: '40', nameNp: '४०', category: 'numeric', order: 211 },
  '42': { name: '42', nameNp: '४२', category: 'numeric', order: 212 }
};

export const SIZE_CATEGORIES = {
  adult: { name: 'Adult', nameNp: 'वयस्क', order: 1 },
  kids: { name: 'Kids', nameNp: 'बालबालिका', order: 2 },
  numeric: { name: 'Numeric', nameNp: 'संख्यात्मक', order: 3 }
};
```

### User Roles (src/constants/userRoles.js)
```javascript
export const USER_ROLES = {
  'admin': {
    name: 'Administrator', 
    nameNp: 'प्रशासक',
    level: 5,
    permissions: ['all'],
    color: 'red',
    icon: '👑'
  },
  'supervisor': {
    name: 'Supervisor',
    nameNp: 'सुपरभाइजर', 
    level: 4,
    permissions: ['assign_work', 'view_reports', 'manage_operators'],
    color: 'blue',
    icon: '👨‍💼'
  },
  'operator': {
    name: 'Operator',
    nameNp: 'ऑपरेटर',
    level: 2,
    permissions: ['view_work', 'complete_work', 'report_quality'],
    color: 'green',
    icon: '👷'
  },
  'quality-controller': {
    name: 'Quality Controller',
    nameNp: 'गुणस्तर नियन्त्रक',
    level: 3,
    permissions: ['quality_check', 'reject_work', 'approve_work'],
    color: 'purple',
    icon: '🔍'
  },
  'manager': {
    name: 'Manager',
    nameNp: 'व्यवस्थापक',
    level: 4,
    permissions: ['view_analytics', 'manage_schedules', 'approve_payments'],
    color: 'indigo', 
    icon: '💼'
  },
  'management': {
    name: 'Management',
    nameNp: 'व्यवस्थापन',
    level: 5,
    permissions: ['view_analytics', 'financial_access', 'system_settings'],
    color: 'yellow',
    icon: '🏢'
  }
};
```

## 7. Production Configuration Files

### Production Config (src/config/production-config.js)
```javascript
// Size configurations for different garment types
export const SIZE_CONFIGURATIONS = {
  "standard-shirt": {
    name: "Standard Shirt",
    nameNp: "मानक शर्ट",
    sizes: ["L", "XL", "2XL", "3XL"],
    defaultSize: "XL"
  },
  "numeric-sizes": {
    name: "Numeric Sizes",
    nameNp: "संख्यात्मक आकार",
    sizes: ["20", "22", "24", "26", "28", "30", "32"],
    defaultSize: "28"
  },
  "kids-sizes": {
    name: "Kids Sizes",
    nameNp: "बच्चाहरूको आकार",
    sizes: ["M", "L", "XL", "2XL"],
    defaultSize: "L"
  },
  "plus-sizes": {
    name: "Plus Sizes", 
    nameNp: "विशेष आकार",
    sizes: ["4XL", "5XL", "6XL", "7XL"],
    defaultSize: "4XL"
  }
};

// Machine configurations
export const MACHINE_TYPES = {
  overlock: {
    name: "Overlock",
    nameNp: "ओभरलक",
    operations: ["shoulderJoin", "sideSeam", "sleeves"],
    avgSpeed: 45, // pieces per hour
    efficiency: 85,
    difficulty: "easy"
  },
  flatlock: {
    name: "Flatlock", 
    nameNp: "फ्ल्याटलक",
    operations: ["hemFold", "hemming", "decorativeStitch"],
    avgSpeed: 40,
    efficiency: 80,
    difficulty: "easy"
  },
  singleNeedle: {
    name: "Single Needle",
    nameNp: "एकल सुई",
    operations: ["collar", "topStitch", "buttonhole"],
    avgSpeed: 35,
    efficiency: 90,
    difficulty: "medium"
  }
};

// Operation definitions
export const OPERATIONS = {
  shoulderJoin: {
    name: "Shoulder Join",
    nameNp: "काँधको जोडाई", 
    estimatedTime: 8, // minutes per piece
    difficulty: "medium",
    machineType: "overlock"
  },
  sideSeam: {
    name: "Side Seam",
    nameNp: "छेउको सिलाई",
    estimatedTime: 12,
    difficulty: "easy", 
    machineType: "overlock"
  },
  collar: {
    name: "Collar",
    nameNp: "कलर",
    estimatedTime: 20,
    difficulty: "hard",
    machineType: "singleNeedle"
  },
  sleeves: {
    name: "Sleeves",
    nameNp: "बाहुला",
    estimatedTime: 15,
    difficulty: "medium",
    machineType: "overlock"
  },
  hemming: {
    name: "Hemming",
    nameNp: "किनारा सिलाई",
    estimatedTime: 10,
    difficulty: "easy",
    machineType: "flatlock"
  },
  buttonhole: {
    name: "Buttonhole",
    nameNp: "बटन प्वाल",
    estimatedTime: 5,
    difficulty: "hard",
    machineType: "buttonhole"
  }
};

// Garment workflows
export const GARMENT_WORKFLOWS = {
  tshirt: {
    name: "T-Shirt",
    nameNp: "टि-शर्ट",
    operations: ["shoulderJoin", "sideSeam", "sleeves", "hemming"],
    estimatedTotalTime: 55, // minutes
    difficulty: "easy"
  },
  polo: {
    name: "Polo Shirt",
    nameNp: "पोलो शर्ट", 
    operations: ["shoulderJoin", "sideSeam", "collar", "sleeves", "buttonhole", "hemming"],
    estimatedTotalTime: 85,
    difficulty: "medium"
  },
  hoodie: {
    name: "Hoodie",
    nameNp: "हुडी",
    operations: ["shoulderJoin", "sideSeam", "sleeves", "hood", "kangarooPocket"],
    estimatedTotalTime: 120,
    difficulty: "hard"
  }
};
```

### WIP Feature Configuration (src/config/wipFeatureConfig.js)
```javascript
export const WIP_FEATURE_CONFIG = {
  version: "1.0.0",
  enabled: true,
  
  steps: {
    basicInfo: {
      enabled: true,
      required: true,
      fields: ['article', 'size', 'color', 'pieces']
    },
    procedureTemplate: {
      enabled: true,
      templates: {
        'shirt-basic': {
          name: 'Basic Shirt',
          nameNp: 'आधारभूत शर्ट',
          enabled: true,
          operations: ['shoulderJoin', 'sideSeam', 'sleeves', 'collar']
        },
        'tshirt-basic': {
          name: 'Basic T-Shirt',
          nameNp: 'आधारभूत टि-शर्ट',
          enabled: true,
          operations: ['shoulderJoin', 'sideSeam', 'sleeves', 'hemming']
        },
        'custom': {
          name: 'Custom Template',
          nameNp: 'कस्टम टेम्प्लेट',
          enabled: true,
          allowCustomOperations: true
        }
      }
    },
    rollsData: {
      enabled: true,
      features: {
        dynamicRollCount: { enabled: true },
        rollWeightTracking: { enabled: false }, // Disabled for trial
        rollQualityCheck: { enabled: true },
        rollSizeValidation: { enabled: true }
      },
      validations: {
        minRolls: 1,
        maxRolls: 50,
        requiredFields: ['rollNumber', 'pieces']
      }
    }
  },
  
  assignment: {
    bundleCard: {
      enabled: true,
      difficulty: 'beginner',
      features: ['basicInfo', 'statusTracking']
    },
    dragDrop: {
      enabled: true,
      difficulty: 'intermediate',
      features: ['visualAssignment', 'realTimeUpdates']
    },
    kanban: {
      enabled: true,
      difficulty: 'advanced', 
      features: ['workflows', 'advancedFiltering', 'bulkOperations']
    }
  },
  
  reporting: {
    enabled: true,
    formats: ['pdf', 'excel', 'csv'],
    scheduledReports: { enabled: false }, // Trial limitation
    realTimeCharts: { enabled: true }
  },
  
  integrations: {
    firebase: { enabled: true, realTime: true },
    notifications: { enabled: true, push: true },
    export: { enabled: true, formats: ['json', 'csv'] }
  }
};
```

## 8. Deployment Configuration

### Netlify Configuration (netlify.toml)
```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"
  CI = "false"

# Production environment
[context.production.environment]
  REACT_APP_ENVIRONMENT = "production"
  REACT_APP_API_URL = "https://garment-erp-nepal.netlify.app/api"
  REACT_APP_ENABLE_CONSOLE_LOGS = "false"
  GENERATE_SOURCEMAP = "false"

# Staging environment
[context.staging.environment]
  REACT_APP_ENVIRONMENT = "staging"
  REACT_APP_API_URL = "https://staging--garment-erp-nepal.netlify.app/api"
  REACT_APP_ENABLE_CONSOLE_LOGS = "true"

# Development environment
[context.dev.environment]
  REACT_APP_ENVIRONMENT = "development"
  REACT_APP_API_URL = "http://localhost:3000/api"
  REACT_APP_ENABLE_CONSOLE_LOGS = "true"

# Redirects for SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# API redirects
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache service worker
[[headers]] 
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# Functions configuration
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# Build plugins
[[plugins]]
  package = "@netlify/plugin-lighthouse"
  
  [plugins.inputs.settings]
    output_path = "reports/lighthouse.html"

[[plugins]]
  package = "netlify-plugin-submit-sitemap"
  
  [plugins.inputs]
    baseUrl = "https://garment-erp-nepal.netlify.app"
    sitemapPath = "/sitemap.xml"
    ignorePeriod = 0
    providers = [
      "google",
      "bing"
    ]
```

This comprehensive configuration documentation captures every detail needed to recreate the exact same Garment ERP PWA setup, including all dependencies, environment variables, build processes, database configurations, styling systems, and deployment settings.