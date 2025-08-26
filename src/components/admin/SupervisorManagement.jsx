import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { OperatorService } from '../../services/firebase-services';
import { db, collection, getDocs, COLLECTIONS } from '../../config/firebase';

const SupervisorManagement = ({ onStatsUpdate }) => {
  const { currentLanguage } = useLanguage();
  const [supervisors, setSupervisors] = useState([]);
  const [operators, setOperators] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newSupervisor, setNewSupervisor] = useState({
    id: '',
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    password: '',
    department: 'sewing',
    assignedOperators: [],
    permissions: {
      canViewAllBundles: true,
      canAssignBundles: true,
      canViewReports: true,
      canManageOperators: false,
      canUpdatePricing: false
    },
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    shift: 'day',
    monthlyTarget: 0,
    photo: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // No localStorage loading - use empty arrays
      const [supervisorsSnapshot, operatorsResult] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.SUPERVISORS)),
        OperatorService.getActiveOperators()
      ]);
      
      const savedSupervisors = supervisorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const savedOperators = operatorsResult.success ? operatorsResult.operators : [];
      
      setSupervisors(savedSupervisors);
      setOperators(savedOperators);
      
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error loading supervisor data:', error);
    }
  };

  const saveSupervisors = (updatedSupervisors) => {
    try {
      // No localStorage saving - only update state
      setSupervisors(updatedSupervisors);
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error saving supervisors:', error);
    }
  };

  const generateSupervisorId = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `SUP${timestamp}`;
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8).toUpperCase();
  };

  const generateUsername = (name, employeeId) => {
    // Generate username from name and employee ID
    const cleanName = name.toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .replace(/\s+/g, '.'); // Replace spaces with dots
    return `${cleanName}.${employeeId}`.toLowerCase();
  };

  const handleCreateSupervisor = () => {
    if (!newSupervisor.name || !newSupervisor.employeeId) {
      alert('Name and Employee ID are required');
      return;
    }

    const supervisorId = generateSupervisorId();
    const password = generatePassword();
    const username = generateUsername(newSupervisor.name, newSupervisor.employeeId);

    const supervisor = {
      ...newSupervisor,
      id: supervisorId,
      username: username,
      password: password,
      nameEn: newSupervisor.name, // Store English name
      nameNepali: newSupervisor.name, // Can be updated later with Nepali name
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      performance: {
        totalOperatorsManaged: newSupervisor.assignedOperators.length,
        teamProductivity: 0,
        bundlesCompleted: 0,
        teamQualityScore: 100,
        monthlyTarget: newSupervisor.monthlyTarget,
        monthlyAchievement: 0
      }
    };

    const updatedSupervisors = [...supervisors, supervisor];
    saveSupervisors(updatedSupervisors);

    // Reset form
    setNewSupervisor({
      id: '',
      name: '',
      employeeId: '',
      email: '',
      phone: '',
      password: '',
      department: 'sewing',
      assignedOperators: [],
      permissions: {
        canViewAllBundles: true,
        canAssignBundles: true,
        canViewReports: true,
        canManageOperators: false,
        canUpdatePricing: false
      },
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
      shift: 'day',
      monthlyTarget: 0,
      photo: '',
      notes: ''
    });

    setIsCreating(false);
    alert(`Supervisor created successfully!\nUsername: ${username}\nID: ${supervisorId}\nPassword: ${password}\n\nThe user can now login with this username and password.`);
  };

  const handleUpdateSupervisor = () => {
    const updatedSupervisors = supervisors.map(sup => 
      sup.id === editingSupervisor.id ? {
        ...editingSupervisor,
        performance: {
          ...editingSupervisor.performance,
          totalOperatorsManaged: editingSupervisor.assignedOperators.length
        }
      } : sup
    );
    saveSupervisors(updatedSupervisors);
    setEditingSupervisor(null);
  };

  const handleDeleteSupervisor = (supervisorId) => {
    if (confirm('Are you sure you want to delete this supervisor?')) {
      const updatedSupervisors = supervisors.filter(sup => sup.id !== supervisorId);
      saveSupervisors(updatedSupervisors);
    }
  };

  const resetPassword = (supervisorId) => {
    const newPassword = generatePassword();
    const updatedSupervisors = supervisors.map(sup => 
      sup.id === supervisorId ? { ...sup, password: newPassword } : sup
    );
    saveSupervisors(updatedSupervisors);
    alert(`New password for supervisor: ${newPassword}`);
  };

  const handleOperatorSelection = (operatorId, isSelected) => {
    const updateOperators = (current) => {
      if (isSelected) {
        return [...current, operatorId];
      } else {
        return current.filter(id => id !== operatorId);
      }
    };

    if (editingSupervisor) {
      setEditingSupervisor(prev => ({
        ...prev,
        assignedOperators: updateOperators(prev.assignedOperators)
      }));
    } else {
      setNewSupervisor(prev => ({
        ...prev,
        assignedOperators: updateOperators(prev.assignedOperators)
      }));
    }
  };

  const handlePermissionChange = (permission, value) => {
    if (editingSupervisor) {
      setEditingSupervisor(prev => ({
        ...prev,
        permissions: { ...prev.permissions, [permission]: value }
      }));
    } else {
      setNewSupervisor(prev => ({
        ...prev,
        permissions: { ...prev.permissions, [permission]: value }
      }));
    }
  };

  const getOperatorName = (operatorId) => {
    const operator = operators.find(op => op.id === operatorId);
    return operator ? operator.name : operatorId;
  };

  const filteredSupervisors = supervisors.filter(supervisor => 
    supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCreating || editingSupervisor) {
    const currentData = editingSupervisor || newSupervisor;
    const setCurrentData = editingSupervisor ? setEditingSupervisor : setNewSupervisor;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingSupervisor 
              ? (currentLanguage === 'en' ? 'Edit Supervisor' : 'सुपरभाइजर सम्पादन गर्नुहोस्')
              : (currentLanguage === 'en' ? 'Add New Supervisor' : 'नयाँ सुपरभाइजर थप्नुहोस्')
            }
          </h2>
          <button
            onClick={() => {
              setIsCreating(false);
              setEditingSupervisor(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to List
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={currentData.name}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  value={currentData.employeeId}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SUP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={currentData.email}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="supervisor@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={currentData.phone}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+977-9800000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={currentData.department}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sewing">Sewing</option>
                    <option value="cutting">Cutting</option>
                    <option value="finishing">Finishing</option>
                    <option value="packing">Packing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={currentData.shift}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, shift: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Target (Pieces)
                </label>
                <input
                  type="number"
                  value={currentData.monthlyTarget}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, monthlyTarget: parseInt(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                />
              </div>
            </div>

            {/* Operator Assignment & Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Operator Assignment</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Operators
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {operators.map(operator => (
                    <label key={operator.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={currentData.assignedOperators.includes(operator.id)}
                        onChange={(e) => handleOperatorSelection(operator.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{operator.name} ({operator.employeeId})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Permissions</h4>
                <div className="space-y-3">
                  {Object.entries(currentData.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handlePermissionChange(key, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key === 'canViewAllBundles' && 'Can View All Bundles'}
                        {key === 'canAssignBundles' && 'Can Assign Bundles'}
                        {key === 'canViewReports' && 'Can View Reports'}
                        {key === 'canManageOperators' && 'Can Manage Operators'}
                        {key === 'canUpdatePricing' && 'Can Update Pricing'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={currentData.status}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={currentData.notes}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={editingSupervisor ? handleUpdateSupervisor : handleCreateSupervisor}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              {editingSupervisor ? 'Update Supervisor' : 'Create Supervisor'}
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingSupervisor(null);
              }}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Search supervisors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          + Add New Supervisor
        </button>
      </div>

      {/* Supervisors List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Supervisors ({filteredSupervisors.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Operators
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSupervisors.map((supervisor) => (
                <tr key={supervisor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supervisor.name}</div>
                      <div className="text-sm text-gray-500">{supervisor.employeeId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {supervisor.assignedOperators.length > 0 ? (
                        <div className="space-y-1">
                          {supervisor.assignedOperators.slice(0, 2).map(operatorId => (
                            <div key={operatorId} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {getOperatorName(operatorId)}
                            </div>
                          ))}
                          {supervisor.assignedOperators.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{supervisor.assignedOperators.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No operators assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {supervisor.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      supervisor.status === 'active' ? 'bg-green-100 text-green-800' :
                      supervisor.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {supervisor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm">
                      <div>Target: {supervisor.monthlyTarget}</div>
                      <div>Achievement: {supervisor.performance?.monthlyAchievement || 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingSupervisor(supervisor)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => resetPassword(supervisor.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleDeleteSupervisor(supervisor.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSupervisors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No supervisors found</div>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Create your first supervisor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorManagement;