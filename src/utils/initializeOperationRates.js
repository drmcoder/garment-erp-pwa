// Initialize Operation Rates Utility
// Populates missing operation rates in Firestore

import OperationRateService from '../services/OperationRateService';

/**
 * Standard operation rates based on industry standards
 */
const STANDARD_RATES = {
  // Basic seam operations
  'side_seam': 2.5,
  'shoulder_join': 2.0,
  'sleeve_attach': 3.0,
  
  // Advanced operations
  'neck_bind': 4.0,
  'bottom_hem': 3.0,
  'collar_attach': 5.0,
  'pocket_attach': 4.0,
  'zipper_install': 8.0,
  'buttonhole': 6.0,
  'buttonhole_make': 6.0,
  
  // Finishing operations
  'hemming': 2.0,
  'topstitch': 2.5,
  'edge_finish': 1.5,
  'serging': 2.0,
  
  // Special operations
  'embroidery': 10.0,
  'applique': 8.0,
  'piping': 6.0,
  'pleating': 4.0,
};

/**
 * Initialize missing operation rates in Firestore
 */
export const initializeOperationRates = async () => {
  console.log('🔄 Initializing missing operation rates...');
  
  try {
    const operations = Object.entries(STANDARD_RATES);
    let created = 0;
    let updated = 0;
    
    for (const [operationId, rate] of operations) {
      console.log(`📝 Setting rate for ${operationId}: ₹${rate}`);
      
      const result = await OperationRateService.updateOperationRate(operationId, rate);
      if (result.success) {
        // Check if it was created or updated by checking if document existed
        const existing = await OperationRateService.getOperationRate(operationId);
        if (existing.success) {
          updated++;
        } else {
          created++;
        }
      }
    }
    
    console.log(`✅ Operation rates initialized: ${created} created, ${updated} updated`);
    return { success: true, created, updated };
    
  } catch (error) {
    console.error('❌ Failed to initialize operation rates:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update rates for specific work items that show ₹0
 */
export const fixZeroRateWorkItems = async () => {
  console.log('🔧 Fixing work items with zero rates...');
  
  const problematicOperations = ['side_seam', 'shoulder_join', 'sleeve_attach'];
  
  for (const operation of problematicOperations) {
    if (STANDARD_RATES[operation]) {
      console.log(`💰 Setting ${operation} rate to ₹${STANDARD_RATES[operation]}`);
      await OperationRateService.updateOperationRate(operation, STANDARD_RATES[operation]);
    }
  }
  
  console.log('✅ Zero rate work items should now display proper rates');
};

/**
 * Show current rate statistics
 */
export const showRateStatistics = async () => {
  console.log('📊 Getting current rate statistics...');
  const result = await OperationRateService.getRateStatistics();
  
  if (result.success) {
    const { stats } = result;
    console.log('📈 Rate Statistics:');
    console.log(`  Total Operations: ${stats.totalOperations}`);
    console.log(`  Average Rate: ₹${stats.averageRate.toFixed(2)}`);
    console.log(`  Rate Range: ₹${stats.minRate} - ₹${stats.maxRate}`);
    console.log('  By Machine:');
    Object.entries(stats.byMachine).forEach(([machine, data]) => {
      console.log(`    ${machine}: ${data.count} operations, avg ₹${data.avgRate.toFixed(2)}`);
    });
  }
  
  return result;
};

// Export for immediate use in console
window.initializeRates = initializeOperationRates;
window.fixZeroRates = fixZeroRateWorkItems;
window.showRateStats = showRateStatistics;

export default {
  initializeOperationRates,
  fixZeroRateWorkItems, 
  showRateStatistics,
  STANDARD_RATES
};