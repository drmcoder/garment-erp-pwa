// Debug script to test infinite loop issue
// Run this with: node debug_infinite_loop.js

// Simulate the Zustand store behavior
const { create } = require('zustand');

console.log('Testing Zustand store infinite loop...');

const testStore = create((set, get) => ({
  data: [],
  loading: false,
  
  loadData: async () => {
    console.log('loadData called');
    const state = get();
    if (state.loading) {
      console.log('Already loading, returning...');
      return;
    }
    
    set({ loading: true });
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    set({ data: [1, 2, 3], loading: false });
  }
}));

// Test the store
const testComponent = () => {
  const { data, loading, loadData } = testStore();
  
  console.log('Component render:', { data: data.length, loading });
  
  // This simulates the useEffect pattern
  if (!loading && data.length === 0) {
    console.log('Triggering loadData...');
    loadData();
  }
};

// Run test multiple times to see if it loops
for (let i = 0; i < 5; i++) {
  console.log(`\n--- Test run ${i + 1} ---`);
  testComponent();
}

console.log('\nTest completed - check for infinite loop patterns above');