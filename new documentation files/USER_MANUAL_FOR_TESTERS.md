# 👥 Garment ERP PWA - Complete User Manual for Testers

## 🎯 **For App Testers & New Users**
This manual is written for people who have never used the app before. Everything is explained in simple terms with step-by-step instructions.

---

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Understanding User Roles](#understanding-user-roles)
- [Operator Guide](#operator-guide)
- [Supervisor Guide](#supervisor-guide)
- [Admin/Management Guide](#adminmanagement-guide)
- [Common Features](#common-features)
- [Troubleshooting](#troubleshooting)
- [Test Scenarios](#test-scenarios)

---

## 🚀 Getting Started

### **Step 1: Open the App**
1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to the website address: `https://your-app-url.com`
3. Wait for the app to load (should take 2-5 seconds)

### **Step 2: First Time Setup**
When you first open the app, you'll see a login screen.

**For Testing, use these accounts:**
- **Operator**: Username: `operator1` | Password: `test123`
- **Supervisor**: Username: `supervisor1` | Password: `test123`
- **Admin**: Username: `admin1` | Password: `test123`

### **Step 3: Login Process**
1. Click on the username field (the empty box at the top)
2. Type the username (example: `operator1`)
3. Click on the password field
4. Type the password (example: `test123`)
5. Click the "Login" button
6. Wait for the dashboard to load

### **Language Selection**
- The app works in **English** and **Nepali**
- Look for a language toggle button (🌐) in the top right
- Click it to switch between languages

---

## 👤 Understanding User Roles

The app has different types of users, like different jobs in a factory:

### **🔧 Operator (Factory Worker)**
- **What they do**: Sew clothes, complete work tasks
- **What they see**: Their work assignments, payment info, damage reports
- **Main tasks**: Complete work, report problems, check earnings

### **👨‍💼 Supervisor (Team Leader)**
- **What they do**: Give work to operators, fix problems
- **What they see**: All workers' progress, damage reports, work assignment tools
- **Main tasks**: Assign work, handle damage reports, monitor progress

### **🏢 Admin/Manager (Boss)**
- **What they do**: Manage the whole system, see reports
- **What they see**: Everything - all users, all work, all reports
- **Main tasks**: Add users, view reports, manage system settings

---

## 🔧 Operator Guide (Factory Worker Instructions)

### **What You'll See When You Login**
After logging in as an operator, you'll see your **Dashboard** with these sections:

#### **A. Work Queue (Your Tasks)**
This shows work that's assigned to you.

**How to View Your Work:**
1. Look for a section called "Work Queue" or "My Tasks"
2. You'll see a list of work items like:
   - Bundle B001 - Sleeve Attachment - 20 pieces - Rs 15 per piece
   - Bundle B002 - Button Sewing - 15 pieces - Rs 8 per piece

**Understanding Work Cards:**
Each work item shows:
- **Bundle Number**: Like "B001" (this is the batch ID)
- **Operation**: What you need to do (like "Sleeve Attachment")
- **Pieces**: How many items to complete
- **Rate**: How much money per piece
- **Total Value**: Total money you'll earn

#### **B. How to Start Work**
1. Click on a work item from your queue
2. Click the "Start Work" button
3. The status will change to "In Progress"
4. You can now start working on those pieces

#### **C. How to Complete Work**
1. Click on work item that's "In Progress"
2. Click "Complete Work" button
3. Fill in the completion form:
   - **Pieces Completed**: How many pieces you finished
   - **Quality Score**: Rate your work quality (1-100)
   - **Time Spent**: How long it took
   - **Any Problems**: If you had any issues
4. Click "Submit" button
5. The work is now marked as "Completed"

#### **D. How to Report Damage**
If some pieces get damaged while working:

1. Click on the work item
2. Look for "Report Damage" button (usually red)
3. Click it to open the damage report form
4. Fill in the damage report:
   - **Select Damaged Pieces**: Click on piece numbers that are damaged (example: pieces 5, 8, 12)
   - **Damage Type**: Choose from dropdown (Cutting Error, Stitch Problem, etc.)
   - **Description**: Write what happened ("Thread broke during sewing")
   - **Priority**: How urgent (Normal, High, Urgent)
5. Click "Send to Supervisor"

**⚠️ IMPORTANT**: When you report damage, your payment for the ENTIRE bundle gets HELD until the damage is fixed. This is normal.

#### **E. How to Check Your Earnings**
1. Look for "Wallet" or "Earnings" section
2. You'll see:
   - **Available**: Money you can withdraw now
   - **Held**: Money held because of damage reports
   - **Total Earned**: All money you've earned
3. **Available money** is what you can actually withdraw
4. **Held money** will be released when damage is fixed

#### **F. Self-Assignment (Taking Work Yourself)**
Instead of waiting for supervisor to give you work:

1. Look for "Available Work" or "Self-Assign" section
2. Browse work that's available
3. Click "Take This Work" on work you want
4. It gets added to your work queue
5. Start working on it

**Limits**: You can usually only self-assign 3 items at a time.

### **Common Operator Tasks - Step by Step**

#### **Task 1: Complete a Bundle**
1. Login as operator
2. Go to "My Work" or "Work Queue"
3. Click on any work item (example: "Bundle B001")
4. Click "Start Work"
5. Work on your pieces in real life
6. Come back to app, click "Complete Work"
7. Enter completed pieces (example: 20 pieces)
8. Enter quality score (example: 95)
9. Enter time spent (example: 120 minutes)
10. Click "Submit"
11. Check your earnings - money should be added to "Available"

#### **Task 2: Report Damage**
1. Start working on a bundle (same as Task 1, steps 1-5)
2. Imagine 2 pieces got damaged
3. Click "Report Damage" button
4. Select damaged piece numbers (example: pieces 7 and 15)
5. Choose damage type: "Cutting Error"
6. Write description: "Fabric tore while cutting"
7. Set priority: "Normal"
8. Click "Send to Supervisor"
9. Notice: Your bundle payment is now "Held"
10. Wait for supervisor to fix the damage
11. You'll get notification when pieces are ready

---

## 👨‍💼 Supervisor Guide (Team Leader Instructions)

### **What You'll See When You Login**
The supervisor dashboard has more sections than operator:

#### **A. Damage Reports Queue**
This shows damage reports from operators that need your attention.

**How to Handle Damage Reports:**
1. Look for "Damage Reports" or "Supervisor Queue" section
2. You'll see reports like:
   - "Operator: John | Bundle: B001 | 2 pieces damaged | Cutting Error"
3. Click on a damage report to see details
4. You have these options:
   - **Start Rework**: Begin fixing the damaged pieces
   - **Assign to Another**: Give the repair work to someone else
   - **More Info**: Ask operator for more details

#### **B. How to Fix Damage (Rework Process)**
1. Click on a damage report
2. Click "Start Rework" button
3. The status changes to "Rework in Progress"
4. Fix the damaged pieces in real life
5. Come back to app
6. Click "Complete Rework"
7. Fill in the rework completion form:
   - **Time Spent**: How long the fix took (example: 45 minutes)
   - **Parts Replaced**: What materials you used
   - **Quality Check**: Did the repair pass quality check? (Yes/No)
   - **Notes**: Any comments about the repair
8. Click "Submit Rework"
9. The pieces are now ready to return to operator

#### **C. How to Return Fixed Pieces**
After completing rework:
1. Click "Return to Operator" button
2. The operator gets a notification
3. Operator can now complete their remaining work
4. When operator completes ALL work, payment gets released

#### **D. Work Assignment**
You can assign work to operators:

**Method 1: Direct Assignment**
1. Go to "Work Assignment" section
2. See list of available work bundles
3. See list of available operators
4. Drag work item to an operator, or
5. Click work item, then click operator name
6. Click "Assign Work"
7. Operator gets notification of new work

**Method 2: Bulk Assignment**
1. Select multiple work items (click checkboxes)
2. Select multiple operators
3. Click "Auto-Assign" button
4. System assigns work based on skills and availability

#### **E. Monitoring Progress**
1. Go to "Progress Monitor" or "Live Dashboard"
2. See real-time status of all work:
   - Who's working on what
   - How many pieces completed
   - Any delays or problems
   - Estimated completion times

### **Common Supervisor Tasks - Step by Step**

#### **Task 1: Handle a Damage Report**
1. Login as supervisor
2. Go to "Damage Reports" section
3. Click on any damage report (example: "John - B001 - 2 pieces")
4. Read the details of what went wrong
5. Click "Start Rework"
6. Status changes to "Rework in Progress"
7. Spend some time "fixing" the pieces (for testing, just wait 2-3 minutes)
8. Click "Complete Rework"
9. Enter time spent: "45 minutes"
10. Enter parts replaced: "Thread, small fabric patch"
11. Mark quality check as "Passed"
12. Add notes: "Fixed cutting error, pieces look good"
13. Click "Submit"
14. Click "Return to Operator"
15. Check that operator gets notification

#### **Task 2: Assign Work to Operator**
1. Login as supervisor
2. Go to "Work Assignment" section
3. Look at "Available Work" list
4. Look at "Available Operators" list
5. Click on a work item (example: "Bundle B005 - Button Sewing")
6. Click on an operator name (example: "Sarah")
7. Click "Assign Work" button
8. Check that work appears in that operator's queue
9. Operator should get notification

#### **Task 3: Monitor Production**
1. Go to "Live Dashboard" or "Progress Monitor"
2. Look at the overview of all ongoing work
3. Check for any delays or problems
4. Look for overdue items (items taking too long)
5. Check quality scores of completed work

---

## 🏢 Admin/Management Guide (Boss Instructions)

### **What You'll See When You Login**
Admin dashboard shows everything in the system:

#### **A. User Management**
Add, remove, or modify user accounts.

**How to Add a New User:**
1. Go to "User Management" section
2. Click "Add New User" button
3. Fill in the form:
   - **Name**: Full name (example: "John Smith")
   - **Username**: Login name (example: "john123")
   - **Password**: Login password (example: "password123")
   - **Role**: Choose from dropdown (Operator, Supervisor, Admin)
   - **Skills**: What they can do (example: "Overlock, Button Sewing")
   - **Location**: Where they work (example: "Floor 2, Line A")
4. Click "Create User"
5. New user can now login with their username/password

**How to Modify a User:**
1. Go to "User Management"
2. Find the user in the list
3. Click "Edit" button next to their name
4. Change any information needed
5. Click "Save Changes"

#### **B. Reports and Analytics**
See detailed reports about production.

**How to View Production Reports:**
1. Go to "Reports" or "Analytics" section
2. Choose report type:
   - **Daily Production**: What was completed today
   - **Quality Report**: Quality scores and damage reports
   - **Operator Performance**: How well each operator is doing
   - **Financial Summary**: Payment information
3. Select date range (example: Last 7 days)
4. Click "Generate Report"
5. View the charts and numbers

#### **C. System Settings**
Change app configuration.

**Common Settings to Check:**
1. Go to "System Settings"
2. **Payment Rates**: How much operators get paid per piece
3. **Quality Standards**: Minimum quality scores required
4. **Notification Settings**: When to send alerts
5. **Language Settings**: Default language for the app
6. **Work Assignment Rules**: How work gets assigned automatically

### **Common Admin Tasks - Step by Step**

#### **Task 1: Add a New Operator**
1. Login as admin
2. Go to "User Management"
3. Click "Add New User"
4. Fill in details:
   - Name: "Test Operator"
   - Username: "testop1"
   - Password: "test123"
   - Role: "Operator"
   - Skills: "Basic Sewing, Quality Check"
5. Click "Create User"
6. Test: Logout and try logging in as the new user

#### **Task 2: View Production Report**
1. Go to "Reports" section
2. Choose "Daily Production Report"
3. Select date: "Today"
4. Click "Generate Report"
5. Look at the numbers:
   - How many bundles completed
   - How many pieces finished
   - Total earnings paid out
   - Any quality issues

#### **Task 3: Check System Performance**
1. Go to "System Dashboard"
2. Look at key metrics:
   - **Active Users**: How many people online now
   - **Work in Progress**: How many items being worked on
   - **Pending Issues**: Any problems that need attention
   - **System Health**: Is everything working properly

---

## 🔄 Common Features (All Users)

### **A. Notifications**
All users get notifications for important events.

**Where to Find Notifications:**
1. Look for a bell icon (🔔) in the top right
2. Red number shows how many unread notifications
3. Click the bell to see all notifications
4. Click on a notification to see details

**Types of Notifications:**
- **Work Assigned**: "New work assigned to you"
- **Work Completed**: "John completed Bundle B001"
- **Damage Reported**: "Sarah reported damage in B002"
- **Payment Released**: "Payment of Rs 300 added to your wallet"

### **B. Language Switching**
**How to Change Language:**
1. Look for language icon (🌐) in top right
2. Click it to switch between English/Nepali
3. Entire app changes language immediately
4. Your choice is remembered for next time

### **C. User Profile**
**How to View/Edit Your Profile:**
1. Click on your name in top right corner
2. Select "Profile" from dropdown menu
3. View your information:
   - Name, Role, Skills
   - Work history
   - Performance metrics
4. Edit any information if allowed
5. Click "Save Changes"

### **D. Logout**
**How to Logout:**
1. Click on your name in top right
2. Click "Logout" from dropdown menu
3. You're taken back to login screen
4. Your work progress is automatically saved

---

## 🚨 Troubleshooting (When Things Go Wrong)

### **Problem 1: Can't Login**
**If login doesn't work:**
1. Check that you typed username correctly (no extra spaces)
2. Check that you typed password correctly (case sensitive)
3. Try refreshing the page (F5 or Ctrl+R)
4. Clear browser cache and try again
5. Try a different browser

### **Problem 2: Page Won't Load**
**If app is slow or doesn't load:**
1. Check your internet connection
2. Refresh the page (F5)
3. Wait 30 seconds and try again
4. Try closing and reopening browser
5. Check if other websites work

### **Problem 3: Buttons Don't Work**
**If clicking doesn't do anything:**
1. Try clicking again after waiting 2 seconds
2. Check if there's an error message on screen
3. Refresh the page
4. Make sure you have permission to do that action
5. Try logging out and logging back in

### **Problem 4: Data Not Updating**
**If information seems old:**
1. Refresh the page (F5)
2. The app updates automatically, but sometimes needs a refresh
3. Check your internet connection
4. If using mobile, try switching between WiFi and mobile data

### **Problem 5: Payment Issues**
**If money isn't showing correctly:**
1. Remember that damaged work holds ALL bundle payment
2. Check "Held Amount" - this is money waiting for damage to be fixed
3. "Available Amount" is what you can actually withdraw
4. Payment releases only after ALL work in bundle is completed
5. Contact supervisor if payment seems wrong

---

## 🧪 Test Scenarios (For Testers)

### **Basic Test Scenario 1: Complete Work Flow**
**Goal**: Test the complete process from work assignment to payment

**Steps:**
1. Login as **Admin**
2. Add a new operator (name: "Test Worker")
3. Logout, login as **Supervisor**
4. Assign work to "Test Worker" (Bundle with 5 pieces, Rs 10 per piece)
5. Logout, login as **Test Worker**
6. Check that work appears in queue
7. Start the work
8. Complete the work (all 5 pieces, quality 90)
9. Check that Rs 50 is added to available balance
10. Logout

**Expected Result**: Work flows from assignment → completion → payment correctly

### **Basic Test Scenario 2: Damage Report Flow**
**Goal**: Test damage reporting and bundle payment hold

**Steps:**
1. Login as **Operator**
2. Start work on a bundle (20 pieces, Rs 15 per piece = Rs 300 total)
3. Complete 18 pieces, report 2 pieces as damaged
4. Fill damage report: "Cutting Error", "Fabric tore during cutting"
5. Submit damage report
6. Check wallet: Rs 300 should be in "Held Amount", not "Available"
7. Logout, login as **Supervisor**
8. Check damage report appears in supervisor queue
9. Start rework on the 2 damaged pieces
10. Complete rework (time: 30 minutes, quality passed)
11. Return pieces to operator
12. Logout, login as **Operator**
13. Check notification that pieces are ready
14. Complete the final 2 pieces
15. Check wallet: Rs 300 should now be in "Available Amount"

**Expected Result**: Payment held during damage, released after completion

### **Advanced Test Scenario 3: Multiple Users Working**
**Goal**: Test real-time updates between users

**Steps:**
1. Open app in 3 different browser tabs/windows
2. Login as **Operator** in tab 1
3. Login as **Supervisor** in tab 2  
4. Login as **Admin** in tab 3
5. In admin tab: Create new work bundle
6. In supervisor tab: Assign work to operator
7. In operator tab: Check that work appears immediately (real-time)
8. In operator tab: Start work
9. In supervisor tab: Check that status shows "In Progress" (real-time)
10. In operator tab: Report damage
11. In supervisor tab: Check damage report appears immediately
12. In admin tab: Check that dashboard shows the activity

**Expected Result**: All changes appear in real-time across all tabs

### **Language Test Scenario**
**Goal**: Test bilingual functionality

**Steps:**
1. Login as any user
2. Note current language (English/Nepali)
3. Click language toggle button (🌐)
4. Check that ALL text changes to other language
5. Perform some actions (assign work, complete task, etc.)
6. Switch language again
7. Check that everything still works properly

**Expected Result**: App works perfectly in both languages

### **Error Handling Test Scenario**
**Goal**: Test how app handles problems

**Steps:**
1. Login as operator
2. Try to complete work with 0 pieces (should show error)
3. Try to report damage without selecting pieces (should show error)
4. Try to complete more pieces than assigned (should show error)
5. Login as supervisor
6. Try to assign work to non-existent operator (should show error)
7. Try to complete rework without filling required fields (should show error)

**Expected Result**: App shows helpful error messages, doesn't crash

---

## 📞 Getting Help

### **For Testers:**
- If something doesn't work as described in this manual, that's a bug
- Take screenshots of any errors
- Note exactly what you clicked and what happened
- Report issues with the specific test scenario that failed

### **Contact Information:**
- **Technical Issues**: Report in the testing feedback form
- **Questions about this manual**: Contact the development team
- **Suggestions**: Welcome! Tell us how to make the app better

---

## ✅ Quick Checklist for Testers

### **Must Test Items:**
- [ ] Login/logout works for all user types
- [ ] Work assignment from supervisor to operator
- [ ] Work completion and payment calculation
- [ ] Damage reporting holds entire bundle payment  
- [ ] Rework process releases payment after completion
- [ ] Real-time notifications work
- [ ] Language switching works completely
- [ ] Self-assignment works for operators
- [ ] Admin can add/modify users
- [ ] Reports show correct data
- [ ] App works on mobile devices
- [ ] App works offline (basic functions)

### **Performance Check:**
- [ ] App loads in less than 5 seconds
- [ ] Buttons respond within 2 seconds
- [ ] Real-time updates appear within 5 seconds
- [ ] No error messages in browser console (F12 → Console)

---

**Remember**: This app is for managing garment factory work. The most important thing is that operators get paid fairly and work flows smoothly from person to person. Everything else supports these core goals!

**Happy Testing!** 🎉