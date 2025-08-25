// Firebase Diagnostic Script - Run in Browser Console
console.log('🔍 FIREBASE DIAGNOSTICS STARTING...');

// Check if Firebase is properly imported
import { db, auth, COLLECTIONS } from './src/config/firebase.js';

async function diagnoseFirbase() {
  try {
    console.log('📊 Firebase Configuration Check:');
    console.log('   ✅ Database instance:', !!db);
    console.log('   ✅ Auth instance:', !!auth);
    console.log('   ✅ Collections config:', !!COLLECTIONS);

    // Check authentication status
    console.log('👤 Authentication Status:');
    console.log('   Current user:', auth.currentUser);
    console.log('   Auth state ready:', !!auth.currentUser);

    // Test basic Firestore connection
    console.log('🔗 Testing Firestore Connection:');
    
    // Import Firestore functions
    const { collection, getDocs } = await import('./src/config/firebase.js');
    
    // Try to read from a simple collection
    try {
      console.log('   📚 Attempting to read bundles collection...');
      const bundlesRef = collection(db, COLLECTIONS.BUNDLES);
      const snapshot = await getDocs(bundlesRef);
      console.log('   ✅ Success! Found', snapshot.docs.length, 'bundles');
      
      // Show first few documents
      snapshot.docs.slice(0, 3).forEach((doc, index) => {
        console.log(`   📦 Bundle ${index + 1}:`, doc.id, doc.data());
      });
      
    } catch (firestoreError) {
      console.error('   ❌ Firestore Error:', firestoreError);
      console.error('   Error code:', firestoreError.code);
      console.error('   Error message:', firestoreError.message);
      
      // Check common error causes
      if (firestoreError.code === 'permission-denied') {
        console.log('   🔐 Issue: Permission denied - check Firestore rules or authentication');
      } else if (firestoreError.code === 'unavailable') {
        console.log('   🌐 Issue: Network unavailable - check internet connection');
      } else if (firestoreError.code === 'unauthenticated') {
        console.log('   🔑 Issue: Not authenticated - user needs to sign in');
      }
    }

    // Test authentication if user is not signed in
    if (!auth.currentUser) {
      console.log('⚠️ No user signed in. Testing with demo credentials...');
      
      try {
        const { signInWithEmailAndPassword } = await import('./src/config/firebase.js');
        
        // Try signing in with demo credentials (you'll need to create these in Firebase Auth)
        console.log('   🔐 Attempting to sign in...');
        // Note: You'll need to create these users in Firebase Authentication console
        // await signInWithEmailAndPassword(auth, 'ram.singh@example.com', 'password123');
        
        console.log('   ⚠️ Demo sign-in skipped - create users in Firebase Auth console first');
        
      } catch (authError) {
        console.error('   ❌ Authentication Error:', authError);
      }
    }

    // Check network connectivity
    console.log('🌐 Network Connectivity:');
    console.log('   Online:', navigator.onLine);
    console.log('   Connection type:', navigator.connection?.effectiveType || 'unknown');

    // Test a simple fetch to Firebase
    try {
      const testUrl = `https://firestore.googleapis.com/v1/projects/code-for-erp/databases/(default)/documents/bundles?pageSize=1`;
      const response = await fetch(testUrl);
      console.log('   🌐 Direct API test status:', response.status);
      
      if (!response.ok) {
        console.log('   ❌ Direct API test failed:', response.statusText);
        console.log('   Response headers:', Object.fromEntries(response.headers.entries()));
      }
    } catch (fetchError) {
      console.error('   ❌ Direct API test error:', fetchError);
    }

  } catch (error) {
    console.error('❌ DIAGNOSTIC FAILED:', error);
  }
}

// Run diagnostics
diagnoseFirbase();