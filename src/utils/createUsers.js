// Quick User Creation Utility
// Use this to add missing users to the system

import { db, collection, addDoc, getDocs, query, where } from '../config/firebase';

const createMissingUsers = async () => {
  try {
    const usersToCreate = [
      {
        username: 'button',
        name: 'Button Operator',
        nameEn: 'Button Operator',
        nameNepali: 'बटन अपरेटर',
        role: 'supervisor',
        machine: 'buttonhole',
        station: 'Station-3',
        speciality: 'buttonhole',
        active: true,
        status: 'active',
        password: '123456', // Default password
        createdAt: new Date(),
        updatedAt: new Date(),
        efficiency: 88,
        qualityScore: 95,
        profileColor: '#8B5CF6'
      }
    ];

    for (const userData of usersToCreate) {
      // Check if user already exists
      const existingUserQuery = query(
        collection(db, 'operators'), 
        where('username', '==', userData.username)
      );
      const existingOperator = await getDocs(existingUserQuery);

      const existingSupervisorQuery = query(
        collection(db, 'supervisors'), 
        where('username', '==', userData.username)
      );
      const existingSupervisor = await getDocs(existingSupervisorQuery);

      if (existingOperator.empty && existingSupervisor.empty) {
        // Determine collection based on role
        const collectionName = userData.role === 'supervisor' ? 'supervisors' : 'operators';
        
        // Add user to appropriate collection
        const docRef = await addDoc(collection(db, collectionName), userData);
        console.log(`✅ User created: ${userData.username} (${userData.name}) in ${collectionName} with ID: ${docRef.id}`);
      } else {
        console.log(`⚠️ User already exists: ${userData.username}`);
      }
    }

    console.log('🎉 User creation process completed!');
    return { success: true, message: 'Users created successfully' };

  } catch (error) {
    console.error('❌ Error creating users:', error);
    return { success: false, error: error.message };
  }
};

// Export for use in console or admin interface
export { createMissingUsers };

// For console usage, uncomment the line below:
// createMissingUsers();