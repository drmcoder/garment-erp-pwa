// Operator Management for Supervisors
// Supervisors can create, edit, and manage operator accounts

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  UserCheck,
  UserX,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useUsers } from '../../hooks/useAppData';

const OperatorManagement = ({ onBack }) => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const { operators, loading, refreshUsers, updateUser } = useUsers();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    nameEn: '',
    employeeId: '',
    speciality: 'sewing',
    machine: 'single-needle',
    station: '',
    shift: 'day',
    hourlyRate: 200,
    skills: [],
    active: true
  });

  // Available options
  const specialities = ['sewing', 'cutting', 'finishing', 'quality', 'packing'];
  const machines = ['single-needle', 'overlock', 'flatlock', 'buttonhole', 'bartack', 'cutting'];
  const shifts = ['day', 'evening', 'night'];
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  // Filter operators
  const filteredOperators = operators.filter(op => {
    const matchesSearch = op.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && op.active) ||
                         (filterStatus === 'inactive' && !op.active);
    
    return matchesSearch && matchesStatus;
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing operator
        await updateUser(editingUser.id, {
          ...formData,
          updatedBy: user.id,
          updatedAt: new Date().toISOString()
        });
        showNotification('Operator updated successfully', 'success');
        setEditingUser(null);
      } else {
        // Create new operator - this would need to be implemented in the backend
        const newOperator = {
          ...formData,
          id: `op_${Date.now()}`,
          role: 'operator',
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          password: 'password123', // Default password
          department: 'sewing',
          status: 'active'
        };
        
        // For now, just show notification - would need backend integration
        console.log('New operator to create:', newOperator);
        showNotification('Operator creation requested - pending system implementation', 'info');
      }
      
      setShowAddForm(false);
      resetForm();
      refreshUsers();
      
    } catch (error) {
      showNotification(`Failed to save operator: ${error.message}`, 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      nameEn: '',
      employeeId: '',
      speciality: 'sewing',
      machine: 'single-needle', 
      station: '',
      shift: 'day',
      hourlyRate: 200,
      skills: [],
      active: true
    });
  };

  // Handle edit
  const handleEdit = (operator) => {
    setEditingUser(operator);
    setFormData({
      username: operator.username || '',
      name: operator.name || '',
      nameEn: operator.nameEn || '',
      employeeId: operator.employeeId || '',
      speciality: operator.speciality || 'sewing',
      machine: operator.machine || 'single-needle',
      station: operator.station || '',
      shift: operator.shift || 'day',
      hourlyRate: operator.hourlyRate || 200,
      skills: operator.skills || [],
      active: operator.active !== false
    });
    setShowAddForm(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (operatorId, currentStatus) => {
    try {
      await updateUser(operatorId, {
        active: !currentStatus,
        updatedBy: user.id,
        updatedAt: new Date().toISOString()
      });
      showNotification(`Operator ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
      refreshUsers();
    } catch (error) {
      showNotification(`Failed to update operator: ${error.message}`, 'error');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return;
    
    try {
      const promises = selectedUsers.map(userId => {
        switch (bulkAction) {
          case 'activate':
            return updateUser(userId, { active: true, updatedBy: user.id });
          case 'deactivate':
            return updateUser(userId, { active: false, updatedBy: user.id });
          default:
            return Promise.resolve();
        }
      });
      
      await Promise.all(promises);
      showNotification(`Bulk action completed for ${selectedUsers.length} operators`, 'success');
      setSelectedUsers([]);
      setBulkAction('');
      refreshUsers();
      
    } catch (error) {
      showNotification(`Bulk action failed: ${error.message}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="mr-3 h-8 w-8 text-purple-600" />
                  Operator Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage operator accounts and settings
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshUsers}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingUser(null);
                  setShowAddForm(true);
                }}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Operator
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search operators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedUsers.length} operator(s) selected
                </span>
                <div className="flex space-x-2">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-3 py-1 border border-blue-300 rounded text-sm"
                  >
                    <option value="">Choose action...</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{operators.length}</div>
            <div className="text-sm text-gray-500">Total Operators</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {operators.filter(op => op.active).length}
            </div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {operators.filter(op => !op.active).length}
            </div>
            <div className="text-sm text-gray-500">Inactive</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {filteredOperators.length}
            </div>
            <div className="text-sm text-gray-500">Filtered Results</div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    {editingUser ? 'Edit Operator' : 'Add New Operator'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., john.doe"
                      />
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., EMP001"
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Full name"
                      />
                    </div>

                    {/* Name (English) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name (English)
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="English name"
                      />
                    </div>

                    {/* Speciality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Speciality *
                      </label>
                      <select
                        value={formData.speciality}
                        onChange={(e) => setFormData({...formData, speciality: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        {specialities.map(spec => (
                          <option key={spec} value={spec}>
                            {spec.charAt(0).toUpperCase() + spec.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Machine */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Machine *
                      </label>
                      <select
                        value={formData.machine}
                        onChange={(e) => setFormData({...formData, machine: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        {machines.map(machine => (
                          <option key={machine} value={machine}>
                            {machine.charAt(0).toUpperCase() + machine.slice(1).replace('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Station */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Station
                      </label>
                      <input
                        type="text"
                        value={formData.station}
                        onChange={(e) => setFormData({...formData, station: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Station 1A"
                      />
                    </div>

                    {/* Shift */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shift *
                      </label>
                      <select
                        value={formData.shift}
                        onChange={(e) => setFormData({...formData, shift: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        {shifts.map(shift => (
                          <option key={shift} value={shift}>
                            {shift.charAt(0).toUpperCase() + shift.slice(1)} Shift
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Hourly Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate (Rs.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({...formData, hourlyRate: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="active" className="text-sm font-medium text-gray-700">
                        Active Account
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingUser(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingUser ? 'Update' : 'Create'} Operator
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Operators Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Operators ({filteredOperators.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredOperators.map(op => op.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      checked={selectedUsers.length === filteredOperators.length && filteredOperators.length > 0}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role Info
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
                {filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(operator.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, operator.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== operator.id));
                          }
                        }}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-800">
                              {operator.name?.charAt(0) || operator.username?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {operator.name || operator.nameEn || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{operator.username} • {operator.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{operator.speciality}</div>
                      <div className="text-sm text-gray-500">{operator.machine} • {operator.shift} shift</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        operator.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {operator.active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Efficiency: {operator.efficiency || 85}%</div>
                      <div className="text-gray-500">Quality: {operator.qualityScore || 95}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(operator)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Edit operator"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(operator.id, operator.active)}
                          className={`p-1 rounded ${
                            operator.active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={operator.active ? 'Deactivate' : 'Activate'}
                        >
                          {operator.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOperators.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">No operators found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first operator'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorManagement;