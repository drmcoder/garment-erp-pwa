// Quick Test - Execute this in browser console to add ONE WIP entry

console.log('🧪 Quick WIP Test - Adding single entry...');

// Single test entry
const testWipEntry = {
  id: Date.now(),
  lotNumber: 'LOT-8085-TEST',
  fabricName: 'Cotton Pique 180 GSM',
  nepaliDate: '२०८१/०५/०८',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'active',
  parsedStyles: [{
    articleNumber: '8085',
    styleName: 'Polo T-Shirt',
    colors: ['Navy Blue'],
    sizes: ['L', 'XL']
  }],
  rolls: [
    { rollNumber: 'R001', fabric: 'Cotton Pique', color: 'Navy Blue', pieces: 25 }
  ],
  totalPieces: 25,
  totalRolls: 1
};

// Get existing entries and add our test
const existing = JSON.parse(localStorage.getItem('wipEntries') || '[]');
const updated = [testWipEntry, ...existing];
localStorage.setItem('wipEntries', JSON.stringify(updated));

console.log('✅ Test WIP entry added!');
console.log('📋 Entry Details:');
console.log('  Lot Number:', testWipEntry.lotNumber);
console.log('  Fabric:', testWipEntry.fabricName);
console.log('  Total Entries in Storage:', updated.length);

// Verify by reading back
const verification = JSON.parse(localStorage.getItem('wipEntries') || '[]');
const ourEntry = verification.find(e => e.lotNumber === 'LOT-8085-TEST');

if (ourEntry) {
  console.log('✅ VERIFIED: Entry exists in localStorage');
  console.log('📊 WIP Data Manager should show:');
  console.log(`   Lot: ${ourEntry.lotNumber}`);
  console.log(`   Fabric: ${ourEntry.fabricName} | ${ourEntry.nepaliDate}`);
  console.log(`   Status: ${ourEntry.status}`);
  console.log(`   Articles: ${ourEntry.parsedStyles[0].articleNumber} - ${ourEntry.parsedStyles[0].styleName}`);
  console.log(`   Pieces: ${ourEntry.totalPieces} | Rolls: ${ourEntry.totalRolls}`);
  
  console.log('\n🎯 Now open WIP Data Manager to see this entry!');
} else {
  console.log('❌ ERROR: Entry not found after saving');
}