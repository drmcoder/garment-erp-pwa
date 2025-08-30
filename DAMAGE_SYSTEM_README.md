# 🔧 Damage Reporting & Rework System

A comprehensive system for handling damaged pieces in garment production with fair payment calculation and real-time notifications.

## 🎯 System Overview

This system handles the complete workflow when operators discover damaged pieces during production:

1. **Operator discovers damage** → Reports via system
2. **Continues working** → Works on remaining good pieces  
3. **Supervisor gets notified** → Receives damage in queue
4. **Supervisor fixes damage** → Replaces parts, quality checks
5. **Returns fixed pieces** → Notifies operator when ready
6. **Operator completes work** → Finishes all pieces including rework
7. **Fair payment calculated** → Full payment for non-operator faults

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Core system is already integrated into your existing React app
# No additional dependencies needed
```

### 2. Set up Firebase
```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy security rules  
firebase deploy --only firestore:rules

# Run setup script (optional - creates sample data)
node setup_damage_system.js
```

### 3. Test the System
```bash
# Start your React app
npm start

# Navigate to Ashika's Demo
# Go to /demo/ashika-workflow to see the complete workflow
```

## 📱 Components

### **For Operators**
- `DamageReportModal.jsx` - Report damaged pieces during work
- `EnhancedWorkCard.jsx` - Updated with "🔧 Report Damage" button
- `DamageNotificationSystem.jsx` - Get notified when rework is complete

### **For Supervisors** 
- `DamageQueue.jsx` - Manage all damage reports and rework
- `SupervisorDashboard.jsx` - Updated with damage queue access
- Real-time notifications for new damage reports

### **Demo & Testing**
- `AshikaDamageWorkflowDemo.jsx` - Complete interactive demo
- `setup_damage_system.js` - Database setup script

## 🗄️ Database Schema

### Collections
- `damage_reports` - Main damage report documents
- `damage_notifications` - Real-time notifications  
- `damage_analytics` - Daily/monthly analytics
- `damage_settings` - System configuration

### Key Fields
```javascript
// Damage Report Document
{
  reportId: "DR_20250130_143025_B001",
  bundleNumber: "B001-8085-BL-XL-22P", 
  operatorId: "ashika_devi",
  supervisorId: "hari_supervisor",
  damageType: "fabric_hole",
  pieceNumbers: [15],
  status: "reported_to_supervisor",
  urgency: "normal",
  
  // Payment calculation
  paymentImpact: {
    operatorAtFault: false,        // Not operator's fault
    paymentAdjustment: 0,          // No penalty
    adjustmentReason: "Material defect - no penalty"
  }
}
```

## 🎨 Damage Types Configuration

### Categories
- **Fabric Defects** (Not operator fault): holes, stains, tears, color bleeding
- **Cutting Issues** (Not operator fault): wrong pattern, size mismatch  
- **Color Issues** (Not operator fault): shade mismatch, fading
- **Machine Issues** (Not operator fault): needle marks, oil stains
- **Stitching Defects** (Operator fault): skip stitch, thread breaks, wrong stitch
- **Handling Damage** (Operator fault): wrinkles, stretching, dirt

### Payment Rules
```javascript
// Ashika's scenario: Fabric hole
{
  damageType: "fabric_hole",
  operatorFault: false,          // Material defect
  paymentReduction: 0,           // No penalty
  result: "Full payment for all 22 pieces + efficiency bonus"
}

// Operator error scenario: Skip stitch  
{
  damageType: "skip_stitch", 
  operatorFault: true,           // Stitching error
  paymentReduction: 0.1,         // 10% penalty
  result: "Reduced payment for affected pieces only"
}
```

## 📊 Payment System

### Fair Payment Calculator
```javascript
import { calculateFairPayment } from './utils/damageAwarePaymentCalculator';

const payment = calculateFairPayment(bundleData, completionData);

// Result for Ashika's 22-piece bundle with 1 fabric damage:
{
  totalPieces: 22,
  basePieces: 22,
  basePayment: 55.00,           // 22 × 2.50
  reworkPayment: 2.50,          // Full payment for rework piece
  efficiencyBonus: 2.75,        // 5% bonus for handling complications
  totalEarned: 60.25            // ₹60.25 total
}
```

## 🔔 Notification System

### Real-time Notifications
- **For Supervisors**: New damage reports, urgent cases
- **For Operators**: Rework completed, pieces ready
- **Priority Levels**: Low (4hr), Normal (2hr), High (1hr), Urgent (15min)

### Notification Types
- `damage_reported` - New damage report submitted
- `rework_started` - Supervisor started fixing
- `rework_completed` - Fixed pieces ready for pickup
- `piece_returned` - Pieces returned to operator

## 🧪 Testing Scenarios

### Ashika's Complete Workflow
```javascript
// Run the interactive demo
// Navigate to: /demo/ashika-workflow

// Test steps:
1. Bundle assigned (22 pieces sleeve join)
2. Start work
3. Discover fabric damage (piece #15)
4. Report damage via system
5. Continue working (21 good pieces)
6. Supervisor notified & starts rework
7. Supervisor replaces fabric
8. Fixed piece returned
9. Complete final piece
10. Calculate fair payment (₹60.25)
```

### Test Cases
```bash
# Test damage reporting
- Fabric defects (no penalty)
- Operator errors (with penalty)  
- Urgent vs normal priority
- Multiple pieces (max 3 per report)

# Test supervisor workflow
- Receive notifications
- Start rework
- Complete rework with quality check
- Return pieces to operator

# Test payment calculation
- Non-operator faults (full payment)
- Operator errors (reduced payment)
- Efficiency bonuses
- Time tracking
```

## 🛠️ Configuration

### Damage System Settings
```javascript
// In damage_settings collection
{
  limits: {
    maxPiecesPerReport: 3,        // Max pieces per damage report
    maxReportsPerDay: 10,         // Daily limit per operator
    maxUrgentReportsPerDay: 3     // Urgent report limit
  },
  
  urgencyResponseTimes: {
    low: 4,      // 4 hours
    normal: 2,   // 2 hours
    high: 1,     // 1 hour  
    urgent: 0.25 // 15 minutes
  },
  
  paymentRules: {
    enablePenalties: true,
    enableBonuses: true,
    supervisorHourlyRate: 30      // ₹30/hour for rework
  }
}
```

## 📈 Analytics & Reporting

### Available Metrics
- Total damage reports by category
- Operator fault rates
- Average resolution times
- Cost impact analysis
- Most common damage types
- Prevention effectiveness

### Dashboard Views
- Daily damage summary
- Operator performance (fault rates)
- Supervisor workload
- Cost analysis
- Trend analysis

## 🔒 Security & Permissions

### Role-based Access
- **Operators**: Create reports, view own reports
- **Supervisors**: View assigned reports, update rework status
- **Managers**: View all analytics, modify settings
- **Admin**: Full system access

### Data Privacy
- Operators cannot see others' damage reports
- Payment adjustments require supervisor/manager approval
- Audit trail for all payment calculations

## 🚨 Troubleshooting

### Common Issues

**Problem**: Damage report not submitting
**Solution**: Check required fields (damage type, piece numbers, supervisor assignment)

**Problem**: Notifications not appearing
**Solution**: Verify Firestore real-time listeners are active

**Problem**: Payment calculation incorrect
**Solution**: Check damage type configuration and operator fault assignment

**Problem**: Supervisor queue not loading
**Solution**: Verify supervisor ID matches in damage reports

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('damage_debug', 'true');

// Check console for detailed logs:
// - Damage report submissions
// - Payment calculations  
// - Notification delivery
// - Real-time updates
```

## 🎉 Success Metrics

### System Goals
- ✅ **Zero work stoppage** - Operators continue with good pieces
- ✅ **Fair payment** - Full payment for non-operator faults  
- ✅ **Fast resolution** - Real-time supervisor notifications
- ✅ **Quality tracking** - Complete audit trail
- ✅ **Prevention insights** - Analytics for process improvement

### Expected Results
- **50% faster** damage resolution (real-time notifications)
- **100% fair** payment calculation (automated fault detection)
- **Zero operator downtime** (continue working on good pieces)
- **Complete visibility** (real-time status tracking)

## 📞 Support

For questions or issues:
1. Check the demo workflow: `/demo/ashika-workflow`
2. Review the test scenarios in `AshikaDamageWorkflowDemo.jsx`
3. Examine the payment calculator: `damageAwarePaymentCalculator.js`
4. Check Firestore security rules and indexes

---

**🧵 Built for real garment production workflows - ensuring fair treatment for operators like Ashika while providing supervisors efficient tools for quality management! 🏭✨**