# Firestore Setup Guide

This guide explains how to initialize your Firestore database with sample data for the Garment ERP system.

## Quick Start

### 1. Initialize Firestore with Sample Data
```bash
npm run init-firestore
```

### 2. Complete Setup (Install dependencies + Initialize Firestore)
```bash
npm run setup
```

## Available Scripts

### `npm run init-firestore`
Initializes Firestore with sample data including:
- **3 Operators**: ram.singh, sita.devi, hari.bahadur
- **2 Supervisors**: supervisor, sup (your created user)
- **1 Manager**: admin.manager
- **2 Machines**: Overlock and Single Needle machines
- **6 Operation Types**: shoulder_join, side_seam, collar, placket, buttonhole, hem_fold
- **2 Sample Bundles**: Polo T-Shirt and Ladies Pants
- **2 Production Lines**: Line 1 and Line 2
- **System Settings**: Company configuration and defaults

### `npm run clear-firestore`
Safely clears all Firestore data (requires --force flag):
```bash
npm run clear-firestore -- --force
```

### `npm run reset-firestore`
Clears and re-initializes Firestore with fresh data:
```bash
npm run reset-firestore
```

## Sample Users Created

All users have the default password: **password123**

### Operators
- **ram.singh** - Overlock specialist (राम बहादुर सिंह)
- **sita.devi** - Single Needle specialist (सीता देवी शर्मा)
- **hari.bahadur** - Flatlock specialist (हरि बहादुर थापा)

### Supervisors
- **supervisor** - Line 1 supervisor (श्याम पोखरेल)
- **sup** - Line 2 supervisor (सुपरवाइजर प्रयोगकर्ता)

### Management
- **admin.manager** - Production Manager (उत्पादन व्यवस्थापक)

## Firestore Collections Created

The initialization script creates the following collections:

| Collection | Purpose |
|------------|---------|
| `operators` | Operator user accounts and profiles |
| `supervisors` | Supervisor user accounts and profiles |
| `management` | Management user accounts and profiles |
| `machineConfigs` | Machine configurations and specifications |
| `operationTypes` | Available garment operations |
| `bundles` | Work bundles and production orders |
| `lineStatus` | Production line configurations |
| `systemSettings` | Application configuration |

## Data Structure

### Operators
```javascript
{
  username: "ram.singh",
  name: "Ram Bahadur Singh",
  nameNepali: "राम बहादुर सिंह",
  assignedMachine: "overlock",
  station: "Station-1",
  dailyTarget: 50,
  rate: 2.5,
  active: true,
  // ... more fields
}
```

### Bundles
```javascript
{
  bundleNumber: "B001",
  article: "8085", 
  articleName: "Polo T-Shirt",
  color: "Blue",
  quantity: 50,
  status: "pending",
  machineType: "overlock",
  currentOperation: "shoulder_join",
  // ... more fields
}
```

## Safety Features

- **Duplicate Prevention**: Script checks if data already exists and skips initialization
- **Confirmation Required**: Clear script requires --force flag to prevent accidental deletion
- **Batch Operations**: Uses Firestore batched writes for efficiency
- **Error Handling**: Comprehensive error handling and rollback on failures

## Troubleshooting

### "Firestore already has data"
This means the database already contains data. Use one of these options:
- Use existing data as-is
- Clear and reinitialize: `npm run reset-firestore`
- Clear manually: `npm run clear-firestore -- --force`

### Permission Errors
Ensure your Firebase project has:
- Firestore Database enabled
- Proper security rules configured
- Service account permissions (if using in production)

### Network Issues
The script requires internet connectivity to reach Firebase. Check:
- Internet connection
- Firebase project accessibility
- Firestore security rules

## Production Deployment

⚠️ **Warning**: These scripts are designed for development and testing. For production:

1. Remove or secure the initialization scripts
2. Implement proper user authentication
3. Set up appropriate Firestore security rules
4. Use environment-specific configurations
5. Implement proper backup and recovery procedures

## Next Steps

After initialization:
1. Start the application: `npm start`
2. Login with any of the sample users
3. Explore the different user roles and features
4. Create your own users through the User Management interface
5. Import real production data as needed

The system is now ready for use with realistic sample data that demonstrates all the core features of the Garment ERP system!