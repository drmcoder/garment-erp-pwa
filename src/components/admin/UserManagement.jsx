import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import BackButton from '../common/BackButton';
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, COLLECTIONS } from '../../config/firebase';

const UserManagement = ({ onBack }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const isNepali = currentLanguage === 'np';
  
  const [users, setUsers] = useState([]);

  // Load users from Firestore
  useEffect(() => {
    const loadUsersFromFirestore = async () => {
      try {
        const allUsers = [];
        
        // Load operators
        const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
        operatorsSnapshot.forEach((doc) => {
          const userData = doc.data();
          allUsers.push({
            id: doc.id,
            username: userData.username,
            name: userData.name || userData.nameEn,
            nameNp: userData.nameNepali || userData.name,
            role: 'operator',
            station: userData.station,
            stationNp: userData.stationNp || userData.station,
            machines: userData.assignedMachine ? [userData.assignedMachine] : userData.machines || [],
            skillLevel: userData.skillLevel || 'medium',
            active: userData.active !== false,
            createdAt: userData.createdAt?.toDate() || new Date()
          });
        });

        // Load supervisors
        const supervisorsSnapshot = await getDocs(collection(db, COLLECTIONS.SUPERVISORS));
        supervisorsSnapshot.forEach((doc) => {
          const userData = doc.data();
          allUsers.push({
            id: doc.id,
            username: userData.username,
            name: userData.name || userData.nameEn,
            nameNp: userData.nameNepali || userData.name,
            role: 'supervisor',
            station: userData.station || 'Supervisor Desk',
            stationNp: userData.stationNp || 'सुपरवाइजर डेस्क',
            machines: [],
            skillLevel: 'high',
            active: userData.active !== false,
            createdAt: userData.createdAt?.toDate() || new Date()
          });
        });

        // Load management
        const managementSnapshot = await getDocs(collection(db, COLLECTIONS.MANAGEMENT));
        managementSnapshot.forEach((doc) => {
          const userData = doc.data();
          allUsers.push({
            id: doc.id,
            username: userData.username,
            name: userData.name || userData.nameEn,
            nameNp: userData.nameNepali || userData.name,
            role: 'management',
            station: userData.station || 'Management Office',
            stationNp: userData.stationNp || 'व्यवस्थापन कार्यालय',
            machines: [],
            skillLevel: 'high',
            active: userData.active !== false,
            createdAt: userData.createdAt?.toDate() || new Date()
          });
        });

        setUsers(allUsers);
      } catch (error) {
        console.error('Error loading users from Firestore:', error);
        setUsers([]); // No fallback - use empty array
      }
    };

    loadUsersFromFirestore();
  }, []);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    nameNp: '',
    role: 'operator',
    station: '',
    stationNp: '',
    machines: [],
    skillLevel: 'medium',
    password: 'password123' // Default password
  });

  const machineTypes = [
    { id: 'overlock', nameEn: 'Overlock', nameNp: 'ओभरलक' },
    { id: 'flatlock', nameEn: 'Flatlock', nameNp: 'फ्ल्याटलक' },
    { id: 'singleNeedle', nameEn: 'Single Needle', nameNp: 'एकल सुई' },
    { id: 'buttonhole', nameEn: 'Buttonhole', nameNp: 'बटनहोल' },
    { id: 'cutting', nameEn: 'Cutting', nameNp: 'काट्ने' },
    { id: 'manual', nameEn: 'Manual Work', nameNp: 'म्यानुअल काम' }
  ];

  const skillLevels = [
    { id: 'beginner', nameEn: 'Beginner', nameNp: 'नयाँ' },
    { id: 'medium', nameEn: 'Medium', nameNp: 'मध्यम' },
    { id: 'high', nameEn: 'Expert', nameNp: 'विशेषज्ञ' }
  ];

  const roles = [
    { id: 'operator', nameEn: 'Operator', nameNp: 'अपरेटर' },
    { id: 'supervisor', nameEn: 'Supervisor', nameNp: 'सुपरवाइजर' },
    { id: 'management', nameEn: 'Manager', nameNp: 'म्यानेजर' }
  ];

  const handleCreateUser = async () => {
    try {
      const collectionName = formData.role === 'operator' ? COLLECTIONS.OPERATORS :
                           formData.role === 'supervisor' ? COLLECTIONS.SUPERVISORS :
                           COLLECTIONS.MANAGEMENT;

      const newUserData = {
        username: formData.username,
        name: formData.name,
        nameEn: formData.name,
        nameNepali: formData.nameNp,
        station: formData.station,
        stationNp: formData.stationNp,
        assignedMachine: formData.machines[0] || null,
        machines: formData.machines,
        skillLevel: formData.skillLevel,
        active: true,
        createdAt: new Date(),
        password: formData.password
      };

      // Add additional fields based on role
      if (formData.role === 'operator') {
        newUserData.dailyTarget = 50;
        newUserData.rate = 2.5;
        newUserData.shift = 'morning';
        newUserData.assignedLine = 'line-1';
        newUserData.department = 'sewing';
        newUserData.permissions = ['work_view', 'work_update', 'quality_report'];
      } else if (formData.role === 'supervisor') {
        newUserData.assignedLine = 'line-1';
        newUserData.department = 'sewing';
        newUserData.shift = 'morning';
        newUserData.permissions = ['all_view', 'work_assign', 'quality_manage', 'report_view'];
      } else if (formData.role === 'management') {
        newUserData.department = 'administration';
        newUserData.permissions = ['admin', 'all_view', 'all_manage', 'reports', 'analytics'];
      }

      const docRef = await addDoc(collection(db, collectionName), newUserData);
      
      // Add to local state
      const newUser = {
        id: docRef.id,
        username: formData.username,
        name: formData.name,
        nameNp: formData.nameNp,
        role: formData.role,
        station: formData.station,
        stationNp: formData.stationNp,
        machines: formData.machines,
        skillLevel: formData.skillLevel,
        active: true,
        createdAt: new Date()
      };

      setUsers(prev => [...prev, newUser]);
      setShowCreateForm(false);
      resetForm();

      addError({
        message: isNepali ? 'नयाँ प्रयोगकर्ता सिर्जना गरियो' : `User ${formData.name} created successfully`,
        component: 'UserManagement',
        action: 'Create User',
        data: { userId: docRef.id, username: newUser.username }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

    } catch (error) {
      addError({
        message: 'Failed to create user',
        component: 'UserManagement',
        action: 'Create User',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleUpdateUser = () => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id ? { ...user, ...formData } : user
      ));
      setEditingUser(null);
      resetForm();

      addError({
        message: isNepali ? 'प्रयोगकर्ता अपडेट गरियो' : `User updated successfully`,
        component: 'UserManagement',
        action: 'Update User'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

    } catch (error) {
      addError({
        message: 'Failed to update user',
        component: 'UserManagement',
        action: 'Update User',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleToggleActive = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, active: !user.active } : user
    ));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      nameNp: '',
      role: 'operator',
      station: '',
      stationNp: '',
      machines: [],
      skillLevel: 'medium',
      password: 'password123'
    });
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      nameNp: user.nameNp,
      role: user.role,
      station: user.station,
      stationNp: user.stationNp,
      machines: user.machines,
      skillLevel: user.skillLevel,
      password: 'password123'
    });
    setShowCreateForm(true);
  };

  const handleMachineToggle = (machineId) => {
    setFormData(prev => ({
      ...prev,
      machines: prev.machines.includes(machineId)
        ? prev.machines.filter(m => m !== machineId)
        : [...prev.machines, machineId]
    }));
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm(isNepali ? 'के तपाईं यस प्रयोगकर्तालाई मेटाउन चाहनुहुन्छ?' : 'Are you sure you want to delete this user?')) {
      try {
        setUsers(prev => prev.filter(user => user.id !== userId));
        
        addError({
          message: isNepali ? 'प्रयोगकर्ता सफलतापूर्वक मेटाइयो' : 'User deleted successfully',
          component: 'UserManagement',
          action: 'Delete User'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      } catch (error) {
        addError({
          message: 'Failed to delete user',
          component: 'UserManagement',
          action: 'Delete User',
          data: { error: error.message }
        }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      operator: 'bg-blue-100 text-blue-800',
      supervisor: 'bg-purple-100 text-purple-800',
      management: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getSkillBadgeColor = (skill) => {
    const colors = {
      beginner: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-green-100 text-green-800',
      high: 'bg-purple-100 text-purple-800'
    };
    return colors[skill] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <BackButton 
                  onClick={onBack} 
                  text={isNepali ? 'फिर्ता' : 'Back'} 
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  👥 {isNepali ? 'प्रयोगकर्ता व्यवस्थापन' : 'User Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isNepali 
                    ? 'अपरेटर, सुपरवाइजर र प्रशासकहरूको खाता व्यवस्थापन'
                    : 'Manage operator, supervisor and admin accounts'
                }
              </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ {isNepali ? 'नयाँ प्रयोगकर्ता' : 'New User'}
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {users.map(user => (
              <div key={user.id} className={`border rounded-lg p-4 ${!user.active ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      user.active ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900">
                          {isNepali ? user.nameNp : user.name}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {roles.find(r => r.id === user.role)?.[isNepali ? 'nameNp' : 'nameEn']}
                        </span>
                        {user.role === 'operator' && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSkillBadgeColor(user.skillLevel)}`}>
                            {skillLevels.find(s => s.id === user.skillLevel)?.[isNepali ? 'nameNp' : 'nameEn']}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        @{user.username} • {isNepali ? user.stationNp : user.station}
                      </p>
                      {user.machines.length > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs text-gray-500">{isNepali ? 'मेसिन:' : 'Machines:'}</span>
                          {user.machines.map(machineId => (
                            <span key={machineId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {machineTypes.find(m => m.id === machineId)?.[isNepali ? 'nameNp' : 'nameEn']}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        user.active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.active 
                        ? (isNepali ? 'सक्रिय' : 'Active')
                        : (isNepali ? 'निष्क्रिय' : 'Inactive')
                      }
                    </button>
                    <button
                      onClick={() => startEdit(user)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser 
                  ? (isNepali ? 'प्रयोगकर्ता सम्पादन' : 'Edit User')
                  : (isNepali ? 'नयाँ प्रयोगकर्ता' : 'New User')
                }
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'प्रयोगकर्ता नाम' : 'Username'}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="ram.singh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'भूमिका' : 'Role'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {isNepali ? role.nameNp : role.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'नाम (अंग्रेजी)' : 'Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Ram Bahadur Singh"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'नाम (नेपाली)' : 'Full Name (Nepali)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameNp}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameNp: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="राम बहादुर सिंह"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'स्टेसन (अंग्रेजी)' : 'Station (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.station}
                    onChange={(e) => setFormData(prev => ({ ...prev, station: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Station-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'स्टेसन (नेपाली)' : 'Station (Nepali)'}
                  </label>
                  <input
                    type="text"
                    value={formData.stationNp}
                    onChange={(e) => setFormData(prev => ({ ...prev, stationNp: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="स्टेसन-१"
                  />
                </div>
              </div>

              {formData.role === 'operator' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isNepali ? 'दक्षता स्तर' : 'Skill Level'}
                    </label>
                    <select
                      value={formData.skillLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, skillLevel: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {skillLevels.map(level => (
                        <option key={level.id} value={level.id}>
                          {isNepali ? level.nameNp : level.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isNepali ? 'मेसिनहरू' : 'Machines'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {machineTypes.map(machine => (
                        <label key={machine.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.machines.includes(machine.id)}
                            onChange={() => handleMachineToggle(machine.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {isNepali ? machine.nameNp : machine.nameEn}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'पासवर्ड' : 'Password'}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="password123"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingUser 
                  ? (isNepali ? 'अपडेट गर्नुहोस्' : 'Update')
                  : (isNepali ? 'सिर्जना गर्नुहोस्' : 'Create')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;