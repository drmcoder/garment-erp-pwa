// Clear Specific Bundle from Firestore - Run in app context with Firebase access
// This script should be run in your app's browser console where Firebase is initialized

async function clearBundleFromFirestore() {
  console.log('🔥 CLEARING BUNDLE FROM FIRESTORE: 43 - shoulderJoin');
  
  try {
    // Import Firebase functions (adjust path as needed)
    const { db, collection, query, where, getDocs, deleteDoc, doc } = window.firebaseModules || {};
    
    if (!db) {
      console.error('❌ Firebase not available. Make sure you\'re running this in the app context.');
      return;
    }
    
    const COLLECTIONS = {
      BUNDLES: "bundles",
      WORK_ASSIGNMENTS: "workAssignments", 
      ASSIGNMENT_HISTORY: "assignmentHistory"
    };
    
    // Search and delete from bundles collection
    console.log('📦 Searching bundles collection...');
    const bundlesRef = collection(db, COLLECTIONS.BUNDLES);
    
    // Query for bundles that match our criteria
    const bundleQueries = [
      query(bundlesRef, where("bundleNumber", "==", "43")),
      query(bundlesRef, where("bundleNumber", "==", 43)),
      query(bundlesRef, where("article", "==", 43)),
      query(bundlesRef, where("articleNumber", "==", 43)),
      query(bundlesRef, where("operation", "==", "shoulderJoin")),
      query(bundlesRef, where("currentOperation", "==", "shoulderJoin"))
    ];
    
    let deletedBundles = 0;
    
    for (const q of bundleQueries) {
      try {
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.docs.length} bundles matching query`);
        
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          console.log(`🗑️ Deleting bundle:`, docSnapshot.id, data);
          
          await deleteDoc(doc(db, COLLECTIONS.BUNDLES, docSnapshot.id));
          deletedBundles++;
        }
      } catch (error) {
        console.log('⚠️ Query failed (may be normal):', error.message);
      }
    }
    
    // Search and delete from work assignments
    console.log('📋 Searching work assignments...');
    const assignmentsRef = collection(db, COLLECTIONS.WORK_ASSIGNMENTS);
    const assignmentQueries = [
      query(assignmentsRef, where("bundleId", "==", "43")),
      query(assignmentsRef, where("bundleNumber", "==", "43"))
    ];
    
    let deletedAssignments = 0;
    
    for (const q of assignmentQueries) {
      try {
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.docs.length} assignments matching query`);
        
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          console.log(`🗑️ Deleting assignment:`, docSnapshot.id, data);
          
          await deleteDoc(doc(db, COLLECTIONS.WORK_ASSIGNMENTS, docSnapshot.id));
          deletedAssignments++;
        }
      } catch (error) {
        console.log('⚠️ Assignment query failed (may be normal):', error.message);
      }
    }
    
    // Search and delete from assignment history
    console.log('📜 Searching assignment history...');
    const historyRef = collection(db, COLLECTIONS.ASSIGNMENT_HISTORY);
    const historyQueries = [
      query(historyRef, where("bundleId", "==", "43")),
      query(historyRef, where("bundleNumber", "==", "43"))
    ];
    
    let deletedHistory = 0;
    
    for (const q of historyQueries) {
      try {
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.docs.length} history records matching query`);
        
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          console.log(`🗑️ Deleting history:`, docSnapshot.id, data);
          
          await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENT_HISTORY, docSnapshot.id));
          deletedHistory++;
        }
      } catch (error) {
        console.log('⚠️ History query failed (may be normal):', error.message);
      }
    }
    
    console.log('✅ CLEANUP COMPLETE');
    console.log(`   📦 Bundles deleted: ${deletedBundles}`);
    console.log(`   📋 Assignments deleted: ${deletedAssignments}`);
    console.log(`   📜 History records deleted: ${deletedHistory}`);
    
    if (deletedBundles + deletedAssignments + deletedHistory > 0) {
      if (confirm('Bundle cleared from Firestore! Reload page to refresh the application?')) {
        window.location.reload();
      }
    } else {
      console.log('ℹ️ No matching documents found in Firestore');
    }
    
  } catch (error) {
    console.error('❌ Error clearing bundle from Firestore:', error);
  }
}

// Run the function
clearBundleFromFirestore();