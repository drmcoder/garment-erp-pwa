// Debug localStorage - Copy and paste in browser console

console.log('🔍 DEBUGGING LOCALSTORAGE DATA');
console.log('=====================================');

// Check all WIP-related localStorage keys
const wipKeys = ['wipEntries', 'workItems', 'workAssignments', 'processTemplates'];

wipKeys.forEach(key => {
  console.log(`\n📋 ${key.toUpperCase()}:`);
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`  Count: ${Array.isArray(parsed) ? parsed.length : 'N/A (not array)'}`);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`  Sample entry:`, parsed[0]);
        console.log(`  All entries:`, parsed);
      } else if (parsed && typeof parsed === 'object') {
        console.log(`  Data:`, parsed);
      } else {
        console.log(`  Data: ${data}`);
      }
    } else {
      console.log(`  ❌ No data found`);
    }
  } catch (error) {
    console.log(`  ❌ Error parsing data:`, error.message);
  }
});

console.log('\n🔧 ACTIONS YOU CAN TRY:');
console.log('1. If wipEntries is empty, create a WIP entry through WIP Data Manager');
console.log('2. Check browser console for logs when you submit forms');
console.log('3. Clear localStorage and try again: localStorage.clear()');
console.log('4. Use the test scripts to add sample data');

console.log('\n📊 CURRENT LOCALSTORAGE SIZE:');
let totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += localStorage[key].length;
  }
}
console.log(`Total size: ${totalSize} characters`);

// Quick test to add a WIP entry
console.log('\n🧪 QUICK TEST - Adding a test WIP entry:');
const testWipEntry = {
  id: Date.now(),
  lotNumber: `LOT-DEBUG-${Date.now()}`,
  fabricName: 'Debug Test Fabric',
  nepaliDate: '२०८१/०५/०८',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  parsedStyles: [{
    articleNumber: 'DEBUG-001',
    styleName: 'Debug Test Style'
  }],
  rolls: [{
    rollNumber: 'R001',
    fabric: 'Debug Test Fabric',
    color: 'Blue',
    pieces: 25
  }],
  totalPieces: 25,
  totalRolls: 1
};

const existingWipEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
const updatedWipEntries = [testWipEntry, ...existingWipEntries];
localStorage.setItem('wipEntries', JSON.stringify(updatedWipEntries));

console.log('✅ Test WIP entry added!');
console.log('📋 Entry details:', testWipEntry);
console.log('📊 Total WIP entries now:', updatedWipEntries.length);
console.log('\n🎯 Now try opening WIP Data Manager to see if it shows!');