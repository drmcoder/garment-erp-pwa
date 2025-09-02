// Test utility to verify Firestore rates are working
import { loadAllRatesFromFirestore, getFirestoreRate } from './firestoreRateLoader';

export const testFirestoreRates = async () => {
  console.log('🧪 Testing Firestore rate loading...');
  
  try {
    // Test loading all rates
    const result = await loadAllRatesFromFirestore();
    console.log('✅ Load all rates result:', result.success);
    
    if (result.success) {
      console.log('📊 Total rates loaded:', Object.keys(result.rates).length);
      console.log('📋 Available operations:', Object.keys(result.rates));
      
      // Test specific operations
      const testOperations = ['side_seam', 'sleeve_attach', 'shoulder_join'];
      
      for (const operation of testOperations) {
        const rate = await getFirestoreRate(operation);
        console.log(`💰 ${operation}: ₹${rate}`);
      }
      
      return {
        success: true,
        totalOperations: Object.keys(result.rates).length,
        rates: result.rates
      };
    } else {
      console.error('❌ Failed to load rates:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Run test if called directly
if (typeof window !== 'undefined' && window.location.search.includes('test-rates')) {
  testFirestoreRates();
}