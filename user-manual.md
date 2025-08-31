# Garment ERP PWA - User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Operator Guide](#operator-guide)
3. [Supervisor Guide](#supervisor-guide)
4. [Admin Guide](#admin-guide)
5. [Management Guide](#management-guide)
6. [Common Features](#common-features)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Mobile device or computer
- Screen resolution: 320px+ (mobile friendly)

### First Time Login
1. Open your web browser
2. Navigate to the system URL provided by your administrator
3. Enter your email and password
4. Click "Login" or "लगइन" (for Nepali)
5. You'll be redirected to your role-specific dashboard

### Language Settings
- Click the language toggle in the top menu
- Choose between English and Nepali (नेपाली)
- Settings are saved automatically

### Installing as App (PWA)
1. Open the system in your browser
2. Look for "Install App" or "Add to Home Screen" prompt
3. Click "Install" to add to your device
4. Launch like any other app

## Operator Guide

### Dashboard Overview
Your dashboard shows:
- **Today's Work Queue** - Current assigned tasks
- **Production Metrics** - Your daily performance
- **Quality Score** - Current quality rating
- **Work Progress** - Completed vs pending tasks

### Managing Your Work Queue

#### Viewing Assigned Work
1. Go to **Work Queue** tab
2. See all your assigned tasks
3. Tasks are sorted by priority (High → Medium → Low)
4. Red items are urgent, yellow are medium priority

#### Starting Work
1. Find your task in the work queue
2. Click **"Start Work"** or **"काम सुरु गर्नुहोस्"**
3. Timer starts automatically
4. Status changes to "In Progress"

#### Pausing Work
1. Click **"Pause"** or **"रोक्नुहोस्"** on active work
2. Timer pauses automatically
3. Add reason for pause (optional)
4. Click **"Resume"** or **"जारी राख्नुहोस्"** to continue

#### Completing Work
1. Click **"Complete"** or **"सम्पन्न"** when finished
2. Enter actual pieces completed
3. Add notes if needed
4. Work moves to completed status

### Self-Assignment System

#### Requesting Work
1. Go to **Self Assignment** tab
2. Browse available work items
3. Filter by machine type or operation
4. Click **"Request"** or **"अनुरोध"** on desired work
5. Wait for supervisor approval

#### Checking Request Status
- **Pending** - Waiting for supervisor review
- **Approved** - Added to your work queue
- **Rejected** - Request denied (reason shown)

### Quality Reporting

#### Reporting Damage
1. Click **"Report Damage"** or **"क्षति रिपोर्ट"**
2. Fill out damage details:
   - Damage type (fabric tear, stain, etc.)
   - Severity (Low/Medium/High)
   - Description of damage
   - Number of affected pieces
3. Take photos if possible
4. Submit report

#### Quality Feedback
- View quality scores on your dashboard
- Check feedback from quality inspections
- See improvement suggestions

### Time Management

#### Break Management
1. Click **"Take Break"** or **"विश्राम"**
2. Select break type:
   - Tea Break (15 min)
   - Lunch Break (30 min)
   - Personal Break
3. Timer pauses automatically
4. Click **"End Break"** or **"विश्राम समाप्त"** when returning

#### Overtime Tracking
- System tracks hours automatically
- Overtime calculated after 8 hours
- View overtime hours in profile

### Performance Tracking

#### Daily Metrics
- **Pieces Completed** - Total items finished today
- **Efficiency** - Your speed vs standard time
- **Quality Score** - Average quality rating
- **Hours Worked** - Total time including overtime

#### Weekly/Monthly Trends
- View performance graphs
- Compare with previous periods
- Track improvement over time

## Supervisor Guide

### Dashboard Overview
Your dashboard displays:
- **Line Overview** - All operators status
- **Work Distribution** - Current assignments
- **Production Metrics** - Line performance
- **Quality Alerts** - Issues requiring attention

### Work Assignment

#### Assigning Work to Operators
1. Go to **Work Assignment** board
2. Drag work items from "Available" to operator columns
3. Or click work item and select operator
4. System checks:
   - Operator availability
   - Machine compatibility
   - Current workload
5. Assignment appears in operator's queue immediately

#### Bulk Assignment
1. Select multiple work items (checkbox)
2. Click **"Bulk Assign"**
3. Choose assignment method:
   - Auto-assign by efficiency
   - Auto-assign by availability
   - Manual selection
4. Review assignments and confirm

#### Smart Assignment Suggestions
- System suggests best operator matches
- Based on efficiency, workload, and skills
- Green suggestions are optimal
- Yellow are good alternatives

### Self-Assignment Approvals

#### Review Requests
1. Go to **Approval Queue**
2. See all pending self-assignment requests
3. Review operator details and work compatibility
4. Check current workload

#### Approving Requests
1. Click **"Approve"** or **"स्वीकृत"**
2. Work automatically added to operator queue
3. Operator receives notification
4. Request removed from pending list

#### Rejecting Requests
1. Click **"Reject"** or **"अस्वीकृत"**
2. Provide reason for rejection
3. Operator receives notification with reason

### Operator Monitoring

#### Real-time Status Tracking
- **Green** - Operator working efficiently
- **Yellow** - On break or idle
- **Red** - Issues requiring attention
- **Gray** - Offline or unavailable

#### Performance Monitoring
1. Click on any operator card
2. View detailed performance metrics
3. See current work progress
4. Check quality trends

#### Workload Balancing
- Visual workload indicators (1-5 scale)
- Redistribute work if overloaded
- Monitor for bottlenecks

### Quality Management

#### Reviewing Damage Reports
1. Go to **Quality Control** section
2. See all damage reports from your line
3. Review photos and descriptions
4. Investigate root causes
5. Assign corrective actions

#### Quality Inspections
1. Select work items for inspection
2. Record quality findings
3. Set quality scores
4. Flag items for rework if needed

#### Quality Trends
- Monitor line quality metrics
- Identify problem areas
- Track improvement initiatives

### Production Planning

#### Daily Planning
1. Review tomorrow's work requirements
2. Pre-assign critical items
3. Balance workload across operators
4. Schedule breaks and maintenance

#### Emergency Work Insertion
1. Click **"Emergency Work"**
2. Enter urgent work details
3. System suggests best operator
4. High priority assignment

### Reporting

#### Line Reports
- Daily production summary
- Operator performance
- Quality metrics
- Efficiency trends

#### Export Data
- Export reports to Excel/PDF
- Send to management
- Archive for records

## Admin Guide

### User Management

#### Creating New Users
1. Go to **User Management**
2. Click **"Add User"** or **"प्रयोगकर्ता थप्नुहोस्"**
3. Fill user details:
   - Name (English and Nepali)
   - Email address
   - Role (Operator/Supervisor/Admin/Management)
   - Machine types (for operators)
   - Location/Line assignment
4. System generates temporary password
5. Send credentials to user

#### Managing User Roles
1. Find user in user list
2. Click **"Edit"** or **"सम्पादन"**
3. Change role as needed
4. Update permissions
5. Save changes

#### Deactivating Users
1. Select user account
2. Click **"Deactivate"**
3. User cannot login but data preserved
4. Can reactivate later if needed

### System Configuration

#### Machine Type Management
1. Go to **System Settings** > **Machine Types**
2. Add/edit/remove machine types
3. Define compatible operations
4. Set standard times

#### Operation Management
1. Navigate to **Operations** section
2. Define operation types
3. Set standard times
4. Assign machine compatibility

#### Template Management
1. Go to **Templates** section
2. Create operation sequences
3. Define workflows
4. Set as default for article types

### System Monitoring

#### User Activity
- Monitor login/logout times
- Track user actions
- View usage patterns
- Generate activity reports

#### System Health
- Database performance metrics
- Error logs and monitoring
- User feedback tracking
- System uptime monitoring

### Data Management

#### Backup Management
- Schedule regular backups
- Verify backup integrity
- Test restore procedures
- Manage retention policies

#### Data Export/Import
- Export system data
- Import historical data
- Data migration tools
- Format conversions

## Management Guide

### Executive Dashboard

#### Key Performance Indicators
- **Overall Production** - Total pieces/day
- **Line Efficiency** - Average across all lines
- **Quality Score** - System-wide quality
- **On-time Delivery** - Target achievement
- **Cost per Piece** - Production economics

#### Production Analytics
- Real-time production monitoring
- Trend analysis and forecasting
- Comparative performance metrics
- Bottleneck identification

### Reporting and Analytics

#### Production Reports
1. Go to **Reports** > **Production**
2. Select date range
3. Choose report type:
   - Daily summary
   - Weekly trends
   - Monthly analytics
   - Custom period
4. Generate and download

#### Quality Analysis
- Quality trend reports
- Defect analysis by type
- Root cause analysis
- Improvement tracking

#### Cost Analysis
- Labor cost per piece
- Material utilization
- Waste analysis
- Profitability metrics

### Strategic Planning

#### Capacity Planning
- Production capacity analysis
- Resource utilization trends
- Future capacity requirements
- Investment planning

#### Performance Benchmarking
- Industry comparison
- Historical performance
- Target setting
- Improvement initiatives

## Common Features

### Notifications

#### Receiving Notifications
- **Bell icon** shows unread count
- **Red dot** indicates urgent notifications
- Click to see notification list

#### Managing Notifications
- Mark individual notifications as read
- Clear all notifications
- Set notification preferences

### Profile Management

#### Updating Profile
1. Click profile icon/name
2. Select **"Profile"** or **"प्रोफाइल"**
3. Update information:
   - Name and contact details
   - Profile picture
   - Language preference
   - Notification settings
4. Save changes

#### Changing Password
1. Go to Profile settings
2. Click **"Change Password"**
3. Enter current password
4. Enter new password (twice)
5. Save changes

### Search and Filters

#### Using Search
- Use search box in any list view
- Search by name, number, or description
- Results update as you type
- Clear search to see all items

#### Applying Filters
- Click filter icon
- Select filter criteria
- Multiple filters can be applied
- Clear filters to reset view

### Data Export

#### Exporting Lists
1. Select items to export (or all)
2. Click **"Export"** button
3. Choose format (Excel/CSV/PDF)
4. Download starts automatically

## Troubleshooting

### Common Issues

#### Login Problems
**Problem**: Cannot login / Invalid credentials
**Solution**: 
1. Check email and password spelling
2. Ensure caps lock is off
3. Try password reset
4. Contact administrator if still failing

#### Slow Performance
**Problem**: System running slowly
**Solution**:
1. Check internet connection
2. Clear browser cache
3. Close other browser tabs
4. Refresh the page
5. Try different browser

#### Missing Data
**Problem**: Data not showing up
**Solution**:
1. Refresh the page
2. Check date/time filters
3. Verify internet connection
4. Wait for data sync (up to 30 seconds)

#### Work Assignment Issues
**Problem**: Cannot assign work
**Solution**:
1. Check operator availability
2. Verify machine compatibility
3. Ensure work item not already assigned
4. Check your permissions

#### Notification Problems
**Problem**: Not receiving notifications
**Solution**:
1. Check notification settings
2. Ensure browser allows notifications
3. Check if notifications are blocked
4. Try logging out and back in

### Error Messages

#### Common Error Codes
- **AUTH001**: Invalid login credentials
- **PERM002**: Insufficient permissions
- **NET003**: Network connection error
- **DATA004**: Data synchronization error
- **WORK005**: Work assignment conflict

### Getting Help

#### Contact Support
- Email: support@garment-erp.com
- Phone: +977-1-XXXXXXX
- In-app help chat
- Submit bug reports through system

#### Training Resources
- Video tutorials available
- User training sessions
- Documentation downloads
- Best practices guide

## FAQ

### General Questions

**Q: Can I use this on my mobile phone?**
A: Yes, the system is fully mobile-responsive and can be installed as an app.

**Q: What happens if my internet goes down?**
A: The system works offline for basic functions and syncs when connection returns.

**Q: Can I change the language anytime?**
A: Yes, click the language toggle in the top menu to switch between English and Nepali.

### Operator Questions

**Q: How do I know what work is assigned to me?**
A: Check your work queue on the dashboard or receive push notifications.

**Q: Can I request specific work items?**
A: Yes, use the self-assignment feature to request available work.

**Q: What if I make a mistake in my work?**
A: Report it immediately using the damage/quality reporting feature.

### Supervisor Questions

**Q: How do I balance workload among operators?**
A: Use the workload indicators and drag-drop assignment board.

**Q: Can I see historical performance data?**
A: Yes, access reports section for historical analytics.

**Q: How do I handle urgent work?**
A: Use the emergency work insertion feature for high-priority items.

### Technical Questions

**Q: Which browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions recommended).

**Q: How often does data update?**
A: Real-time updates occur within seconds of changes.

**Q: Is my data secure?**
A: Yes, all data is encrypted and access is role-based with proper authentication.

**Q: Can I export data?**
A: Yes, most data can be exported to Excel, CSV, or PDF formats.

This user manual provides comprehensive guidance for all system users. For additional help, contact your system administrator or support team.