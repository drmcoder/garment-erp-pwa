// src/components/auth/UserManagement.jsx
// Complete User Management System with Profile, Password Change, Role Management

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, Key, Save, X, Eye, EyeOff,
  User, Mail, Phone, MapPin, Calendar, Shield, Settings,
  Search, Filter, Download, Upload, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const UserManagement = () => {
  const { user, userRole, hasPermission } = useAuth();
  const { t, currentLanguage, formatDate } = useLanguage();

  // State Management
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'operator',
    machine: '',
    skillLevel: 'beginner',
    station: '',
    shift: 'morning',
    department: 'production',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false
  });

  // Load users data
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    // Simulate API call - replace with actual Firebase query
    setTimeout(() => {
      setUsers([
        {
          id: 'op001',
          name: 'राम सिंह',
          username: 'ram.singh',
          email: 'ram.singh@garment-erp.com',
          phone: '+977-9841234567',
          role: 'operator',
          machine: 'overlock',
          skillLevel: 'expert',
          station: 'overlock-1',
          shift: 'morning',
          department: 'production',
          address: 'काठमाडौं, नेपाल',
          joinDate: '2023-01-15',
          status: 'active',
          lastLogin: '2025-08-22T10:30:00',
          performance: { efficiency: 95, quality: 98 }
        },
        {
          id: 'op002',
          name: 'सीता देवी',
          username: 'sita.devi',
          email: 'sita.devi@garment-erp.com',
          phone: '+977-9841234568',
          role: 'operator',
          machine: 'flatlock',
          skillLevel: 'intermediate',
          station: 'flatlock-1',
          shift: 'morning',
          department: 'production',
          address: 'भक्तपुर, नेपाल',
          joinDate: '2023-03-10',
          status: 'active',
          lastLogin: '2025-08-22T09:45:00',
          performance: { efficiency: 92, quality: 96 }
        },
        {
          id: 'sup001',
          name: 'श्याम पोखरेल',
          username: 'supervisor',
          email: 'supervisor@garment-erp.com',
          phone: '+977-9841234569',
          role: 'supervisor',
          department: 'production',
          shift: 'morning',
          address: 'ललितपुर, नेपाल',
          joinDate: '2022-06-01',
          status: 'active',
          lastLogin: '2025-08-22T08:00:00',
          performance: { teamEfficiency: 87, qualityScore: 94 }
        }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  // User CRUD Operations
  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'operator',
      machine: '',
      skillLevel: 'beginner',
      station: '',
      shift: 'morning',
      department: 'production',
      address: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      machine: user.machine || '',
      skillLevel: user.skillLevel || 'beginner',
      station: user.station || '',
      shift: user.shift,
      department: user.department,
      address: user.address || '',
      joinDate: user.joinDate,
      status: user.status
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      setIsLoading(true);
      
      if (selectedUser) {
        // Update existing user
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, ...userForm, updatedAt: new Date().toISOString() }
            : u
        ));
      } else {
        // Create new user
        const newUser = {
          id: `user_${Date.now()}`,
          ...userForm,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          performance: { efficiency: 0, quality: 0 }
        };
        setUsers(prev => [...prev, newUser]);
      }
      
      setShowUserModal(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(currentLanguage === 'np' ? 'के तपाईं यो प्रयोगकर्तालाई मेटाउन चाहनुहुन्छ?' : 'Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  // Password Change
  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrent: false,
      showNew: false,
      showConfirm: false
    });
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(currentLanguage === 'np' ? 'नयाँ पासवर्ड मिलेन' : 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert(currentLanguage === 'np' ? 'पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      // Simulate password change API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(currentLanguage === 'np' ? 'पासवर्ड सफलतापूर्वक परिवर्तन भयो' : 'Password changed successfully');
      setShowPasswordModal(false);
      
    } catch (error) {
      console.error('Error changing password:', error);
      alert(currentLanguage === 'np' ? 'पासवर्ड परिवर्तन गर्न समस्या भयो' : 'Error changing password');
    } finally {
      setIsLoading(false);
    }
  };

  // Export Users
  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Username', 'Email', 'Role', 'Department', 'Status', 'Join Date'],
      ...filteredUsers.map(user => [
        user.name,
        user.username,
        user.email,
        user.role,
        user.department,
        user.status,
        user.joinDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Role Badge Component
  const RoleBadge = ({ role }) => {
    const roleConfig = {
      operator: { color: 'bg-blue-100 text-blue-700', label: 'ऑपरेटर' },
      supervisor: { color: 'bg-green-100 text-green-700', label: 'सुपरभाइजर' },
      management: { color: 'bg-purple-100 text-purple-700', label: 'व्यवस्थापन' },
      admin: { color: 'bg-red-100 text-red-700', label: 'प्रशासक' }
    };

    const config = roleConfig[role] || roleConfig.operator;

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      status === 'active' 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}
    </span>
  );

  // User Modal Component
  const UserModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedUser 
                ? (currentLanguage === 'np' ? 'प्रयोगकर्ता सम्पादन गर्नुहोस्' : 'Edit User')
                : (currentLanguage === 'np' ? 'नयाँ प्रयोगकर्ता थप्नुहोस्' : 'Add New User')
              }
            </h2>
            <button
              onClick={() => setShowUserModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'नाम' : 'Name'} *
              </label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="पूरा नाम लेख्नुहोस्"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'प्रयोगकर्ता नाम' : 'Username'} *
              </label>
              <input
                type="text"
                value={userForm.username}
                onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'इमेल' : 'Email'} *
              </label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'फोन' : 'Phone'}
              </label>
              <input
                type="tel"
                value={userForm.phone}
                onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+977-9841234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'भूमिका' : 'Role'} *
              </label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="operator">ऑपरेटर</option>
                <option value="supervisor">सुपरभाइजर</option>
                <option value="management">व्यवस्थापन</option>
                <option value="admin">प्रशासक</option>
              </select>
            </div>

            {userForm.role === 'operator' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'मेसिन' : 'Machine'}
                  </label>
                  <select
                    value={userForm.machine}
                    onChange={(e) => setUserForm(prev => ({ ...prev, machine: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">मेसिन छान्नुहोस्</option>
                    <option value="overlock">ओभरलक</option>
                    <option value="flatlock">फ्ल्यालक</option>
                    <option value="singleNeedle">सिंगल नीडल</option>
                    <option value="buttonhole">बटनहोल</option>
                    <option value="buttonAttach">बटन अट्याच</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'कौशल स्तर' : 'Skill Level'}
                  </label>
                  <select
                    value={userForm.skillLevel}
                    onChange={(e) => setUserForm(prev => ({ ...prev, skillLevel: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">शुरुवाती</option>
                    <option value="intermediate">मध्यम</option>
                    <option value="expert">विज्ञ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'स्टेसन' : 'Station'}
                  </label>
                  <input
                    type="text"
                    value={userForm.station}
                    onChange={(e) => setUserForm(prev => ({ ...prev, station: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="overlock-1"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'शिफ्ट' : 'Shift'}
              </label>
              <select
                value={userForm.shift}
                onChange={(e) => setUserForm(prev => ({ ...prev, shift: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="morning">बिहानको शिफ्ट</option>
                <option value="evening">साँझको शिफ्ट</option>
                <option value="night">रातको शिफ्ट</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'विभाग' : 'Department'}
              </label>
              <select
                value={userForm.department}
                onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="production">उत्पादन</option>
                <option value="quality">गुणस्तर</option>
                <option value="cutting">काटिङ</option>
                <option value="finishing">फिनिसिङ</option>
                <option value="packing">प्याकिङ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'स्थिति' : 'Status'}
              </label>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">सक्रिय</option>
                <option value="inactive">निष्क्रिय</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'ठेगाना' : 'Address'}
              </label>
              <textarea
                value={userForm.address}
                onChange={(e) => setUserForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="पूरा ठेगाना लेख्नुहोस्"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowUserModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
          </button>
          <button
            onClick={handleSaveUser}
            disabled={isLoading || !userForm.name || !userForm.username || !userForm.email}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            {isLoading 
              ? (currentLanguage === 'np' ? 'सेभ हुँदै...' : 'Saving...') 
              : (currentLanguage === 'np' ? 'सेभ गर्नुहोस्' : 'Save')
            }
          </button>
        </div>
      </div>
    </div>
  );

  // Password Modal Component
  const PasswordModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentLanguage === 'np' ? 'पासवर्ड परिवर्तन गर्नुहोस्' : 'Change Password'}
            </h2>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'हालको पासवर्ड' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={passwordForm.showCurrent ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {passwordForm.showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'नयाँ पासवर्ड' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={passwordForm.showNew ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {passwordForm.showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'नयाँ पासवर्ड पुष्टि गर्नुहोस्' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={passwordForm.showConfirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {passwordForm.showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowPasswordModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
          </button>
          <button
            onClick={handleSavePassword}
            disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Key className="w-4 h-4 mr-2 inline" />
            {isLoading 
              ? (currentLanguage === 'np' ? 'परिवर्तन हुँदै...' : 'Changing...') 
              : (currentLanguage === 'np' ? 'परिवर्तन गर्नुहोस्' : 'Change Password')
            }
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {currentLanguage === 'np' ? 'प्रयोगकर्ता व्यवस्थापन' : 'User Management'}
            </h1>
            <p className="text-gray-600">
              {currentLanguage === 'np' ? 'प्रयोगकर्ता खाता व्यवस्थापन र भूमिका नियन्त्रण' : 'User account management and role control'}
            </p>
          </div>
          
          <div className="flex space-x-3 mt-4 lg:mt-0">
            <button
              onClick={handleExportUsers}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {currentLanguage === 'np' ? 'एक्सपोर्ट' : 'Export'}
            </button>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              {currentLanguage === 'np' ? 'नयाँ प्रयोगकर्ता' : 'New User'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={currentLanguage === 'np' ? 'नाम, प्रयोगकर्ता नाम वा इमेल खोज्नुहोस्' : 'Search by name, username or email'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{currentLanguage === 'np' ? 'सबै भूमिका' : 'All Roles'}</option>
                <option value="operator">ऑपरेटर</option>
                <option value="supervisor">सुपरभाइजर</option>
                <option value="management">व्यवस्थापन</option>
                <option value="admin">प्रशासक</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {currentLanguage === 'np' ? 'कुल' : 'Total'}: {filteredUsers.length} {currentLanguage === 'np' ? 'प्रयोगकर्ता' : 'users'}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === 'np' ? 'प्रयोगकर्ता' : 'User'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === 'np' ? 'भूमिका' : 'Role'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === 'np' ? 'विभाग' : 'Department'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === 'np' ? 'स्थिति' : 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === 'np' ? 'अन्तिम लगइन' : 'Last Login'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === 'np' ? 'कार्य' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.username}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                      {user.machine && (
                        <div className="text-xs text-gray-500 mt-1">{user.machine}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.department}</div>
                      {user.shift && (
                        <div className="text-xs text-gray-500">{user.shift} शिफ्ट</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ne-NP') : 'कहिल्यै नगरेको'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title={currentLanguage === 'np' ? 'सम्पादन गर्नुहोस्' : 'Edit'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleChangePassword(user)}
                          className="text-green-600 hover:text-green-900"
                          title={currentLanguage === 'np' ? 'पासवर्ड परिवर्तन' : 'Change Password'}
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title={currentLanguage === 'np' ? 'मेटाउनुहोस्' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        {showUserModal && <UserModal />}
        {showPasswordModal && <PasswordModal />}
      </div>
    </div>
  );
};

export default UserManagement;