# 🚀 Netlify Deployment Guide - Garment ERP PWA

## Phase 1: Backend Setup & API Integration (Week 1-2)

### 📋 Prerequisites

Before deploying, ensure you have:

- [x] Node.js 18+ installed
- [x] Netlify account created
- [x] Git repository set up
- [x] All Netlify functions implemented
- [x] netlify.toml configuration file
- [x] API service integration

### 🛠️ Local Development Setup

1. **Install Netlify CLI globally:**
```bash
npm install -g netlify-cli
```

2. **Login to your Netlify account:**
```bash
netlify login
```

3. **Install project dependencies:**
```bash
npm install
```

4. **Start local development server:**
```bash
npm run netlify:dev
```

This will start your React app and Netlify functions at:
- Frontend: http://localhost:3000
- Functions: http://localhost:8888/.netlify/functions/
- API endpoints: http://localhost:8888/api/

### 🧪 Test Your Functions Locally

Test each endpoint to ensure they're working:

```bash
# Test authentication
curl -X POST http://localhost:8888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ram.singh","password":"password123","role":"operator"}'

# Test bundles
curl http://localhost:8888/api/bundles?machine=overlock

# Test notifications
curl http://localhost:8888/api/notifications?userId=op001&unreadOnly=true
```

### 🌐 Production Deployment

#### Method 1: Automatic Deployment via Git

1. **Connect your repository to Netlify:**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Select your repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `build`

2. **Configure environment variables:**
   In Netlify dashboard → Site settings → Environment variables:
   ```
   REACT_APP_ENVIRONMENT=production
   REACT_APP_API_URL=https://your-site-name.netlify.app/api
   JWT_SECRET=your-jwt-secret-here
   PUSH_NOTIFICATION_ENABLED=true
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy Garment ERP with Netlify Functions"
   git push origin main
   ```

#### Method 2: Manual Deployment

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to Netlify:**
```bash
netlify deploy --prod --dir=build
```

### 🔧 Function Endpoints

After deployment, your API endpoints will be available at:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/verify` | GET | Token verification |
| `/api/bundles` | GET | Get all bundles |
| `/api/bundles` | POST | Create new bundle |
| `/api/bundles/{id}` | PUT | Update bundle |
| `/api/bundles/{id}` | DELETE | Delete bundle |
| `/api/notifications` | GET | Get notifications |
| `/api/notifications` | POST | Create notification |
| `/api/notifications/{id}` | PUT | Mark as read |

### 🧪 Production Testing

Test your production deployment:

```bash
# Replace with your actual Netlify URL
export SITE_URL="https://your-site-name.netlify.app"

# Test authentication
curl -X POST $SITE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ram.singh","password":"password123"}'

# Test bundles endpoint
curl $SITE_URL/api/bundles

# Test notifications
curl $SITE_URL/api/notifications?role=operator
```

### 📊 Monitor Your Functions

1. **Function logs:**
   - Go to Netlify dashboard
   - Navigate to Functions tab
   - Click on individual functions to view logs

2. **Analytics:**
   - Monitor function invocations
   - Check error rates
   - View performance metrics

### 🐛 Troubleshooting

#### Common Issues:

1. **Build fails:**
   ```bash
   # Check build logs in Netlify dashboard
   # Ensure all dependencies are in package.json
   npm install --save-exact
   ```

2. **Functions not working:**
   ```bash
   # Verify netlify.toml configuration
   # Check function paths in config
   # Ensure TypeScript compilation works
   ```

3. **CORS errors:**
   ```bash
   # Functions should include CORS headers
   # Check netlify.toml headers configuration
   ```

4. **Environment variables:**
   ```bash
   # Set in Netlify dashboard: Site settings → Environment variables
   # Restart deployment after adding variables
   ```

### 🔒 Security Considerations

1. **JWT Secret:** Use a strong, random JWT secret in production
2. **HTTPS:** Netlify automatically provides HTTPS
3. **Headers:** Security headers are configured in netlify.toml
4. **Rate limiting:** Consider implementing in functions for production use

### 📈 Performance Optimization

1. **Function optimization:**
   - Keep functions lightweight
   - Use efficient data structures
   - Implement caching where appropriate

2. **Asset optimization:**
   - Images optimized via Netlify
   - Static assets cached automatically
   - Service worker enabled for PWA

### 🔄 Continuous Integration

Set up automatic deployments:

1. **Branch deploys:**
   - Main branch → Production
   - Develop branch → Staging
   - Feature branches → Preview

2. **Build hooks:**
   - Set up webhooks for external triggers
   - Configure build notifications

### 📱 PWA Features

Ensure PWA features work in production:

1. **Service Worker:** Automatically generated
2. **Manifest:** Configured in public/manifest.json
3. **Offline support:** Enabled via workbox
4. **Install prompt:** Available on mobile devices

### 🚨 Error Handling

Monitor and handle errors:

1. **Function errors:** Check Netlify function logs
2. **Frontend errors:** Implement error boundaries
3. **API errors:** Handle in ApiService.js
4. **Offline handling:** PWA service worker handles offline scenarios

### 📞 Support

For issues:

1. Check Netlify status: https://www.netlifystatus.com/
2. Netlify documentation: https://docs.netlify.com/
3. Community forum: https://answers.netlify.com/
4. Function logs in dashboard

---

## 🎯 Next Steps

After successful deployment:

1. **Test all user flows** with different roles (operator, supervisor)
2. **Configure monitoring** and alerts
3. **Set up backup** and disaster recovery
4. **Implement additional functions** (quality, production, wages)
5. **Scale based on usage** patterns

Your Garment ERP system is now ready for production use with full backend API support! 🎉