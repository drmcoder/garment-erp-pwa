import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { OperatorService, ConfigService } from '../../services/firebase-services';
import { db, collection, getDocs, COLLECTIONS } from '../../config/firebase';

const OperatorManagement = ({ onStatsUpdate }) => {
  const { currentLanguage } = useLanguage();
  const [operators, setOperators] = useState([]);
  const [machines, setMachines] = useState([]);
  const [operationTemplates, setOperationTemplates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByMachine, setFilterByMachine] = useState('all');

  const [newOperator, setNewOperator] = useState({
    id: '',
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    password: '',
    assignedMachines: [],
    operationTemplateId: '',
    skills: [],
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    department: 'sewing',
    shift: 'day',
    hourlyRate: 0,
    photo: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Loading operator management data from Firestore...');
      
      // Load real data from Firestore
      const [operatorsResult, machinesSnapshot, templatesSnapshot, skillsData] = await Promise.all([
        OperatorService.getActiveOperators(),
        getDocs(collection(db, COLLECTIONS.MACHINE_CONFIGS)),
        getDocs(collection(db, COLLECTIONS.ARTICLE_TEMPLATES)),
        ConfigService.getSkills()
      ]);
      
      const savedOperators = operatorsResult.success ? operatorsResult.operators : [];
      const savedMachines = machinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const savedTemplates = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('✅ Loaded operator management data:', {
        operators: savedOperators.length,
        machines: savedMachines.length,
        templates: savedTemplates.length,
        skills: skillsData.length
      });
      
      setOperators(savedOperators);
      setMachines(savedMachines);
      setOperationTemplates(savedTemplates);
      setSkills(skillsData);
      
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('❌ Error loading operator data from Firestore:', error);
    }
  };

  const saveOperators = (updatedOperators) => {
    try {
      // No localStorage saving - only update state
      setOperators(updatedOperators);
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error saving operators:', error);
    }
  };

  const generateOperatorId = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `OP${timestamp}`;
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

  const handleCreateOperator = () => {
    if (!newOperator.name || !newOperator.employeeId) {
      alert('Name and Employee ID are required');
      return;
    }

    const operatorId = generateOperatorId();
    const password = generatePassword();
    const username = generateUsername(newOperator.name, newOperator.employeeId);

    const operator = {
      ...newOperator,
      id: operatorId,
      username: username,
      password: password,
      nameEn: newOperator.name, // Store English name
      nameNepali: newOperator.name, // Can be updated later with Nepali name
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      productivity: {
        totalBundles: 0,
        completedBundles: 0,
        averageTime: 0,
        qualityScore: 100
      }
    };

    const updatedOperators = [...operators, operator];
    saveOperators(updatedOperators);

    // Reset form
    setNewOperator({
      id: '',
      name: '',
      employeeId: '',
      email: '',
      phone: '',
      password: '',
      assignedMachines: [],
      operationTemplateId: '',
      skills: [],
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0],
      department: 'sewing',
      shift: 'day',
      hourlyRate: 0,
      photo: '',
      notes: ''
    });

    setIsCreating(false);
    alert(`Operator created successfully!\nUsername: ${username}\nID: ${operatorId}\nPassword: ${password}\n\nThe user can now login with this username and password.`);
  };

  const handleUpdateOperator = () => {
    const updatedOperators = operators.map(op => 
      op.id === editingOperator.id ? editingOperator : op
    );
    saveOperators(updatedOperators);
    setEditingOperator(null);
  };

  const handleDeleteOperator = async (operatorId) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      try {
        // Delete from Firestore
        const result = await OperatorService.deleteOperator(operatorId);
        
        if (result.success) {
          // Also remove from local state
          const updatedOperators = operators.filter(op => op.id !== operatorId);
          setOperators(updatedOperators);
          saveOperators(updatedOperators);
          
          console.log('✅ Operator deleted successfully from both Firestore and localStorage');
        } else {
          console.error('❌ Failed to delete operator from Firestore:', result.error);
          alert('Failed to delete operator. Please try again.');
        }
      } catch (error) {
        console.error('❌ Error deleting operator:', error);
        alert('Error deleting operator. Please try again.');
      }
    }
  };

  const resetPassword = (operatorId) => {
    const newPassword = generatePassword();
    const updatedOperators = operators.map(op => 
      op.id === operatorId ? { ...op, password: newPassword } : op
    );
    saveOperators(updatedOperators);
    alert(`New password for operator: ${newPassword}`);
  };

  const handleMachineSelection = (machineId, isSelected) => {
    const updateMachines = (current) => {
      if (isSelected) {
        return [...current, machineId];
      } else {
        return current.filter(id => id !== machineId);
      }
    };

    if (editingOperator) {
      setEditingOperator(prev => ({
        ...prev,
        assignedMachines: updateMachines(prev.assignedMachines)
      }));
    } else {
      setNewOperator(prev => ({
        ...prev,
        assignedMachines: updateMachines(prev.assignedMachines)
      }));
    }
  };

  const getMachineName = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  const getTemplateName = (templateId) => {
    const template = operationTemplates.find(t => t.id === templateId);
    return template ? template.name : 'No Template';
  };

  const getSkillName = (operator) => {
    if (operator.skills && operator.skills.length > 0) {
      const skill = skills.find(s => s.id === operator.skills[0]);
      return skill ? `${skill.name} (${skill.level})` : operator.skills[0];
    }
    return 'General';
  };

  const filteredOperators = operators.filter(operator => {
    const matchesSearch = operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMachine = filterByMachine === 'all' || 
                          operator.assignedMachines.includes(filterByMachine);
    return matchesSearch && matchesMachine;
  });

  if (isCreating || editingOperator) {
    const currentData = editingOperator || newOperator;
    const setCurrentData = editingOperator ? setEditingOperator : setNewOperator;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingOperator 
              ? (currentLanguage === 'en' ? 'Edit Operator' : 'अपरेटर सम्पादन गर्नुहोस्')
              : (currentLanguage === 'en' ? 'Add New Operator' : 'नयाँ अपरेटर थप्नुहोस्')
            }
          </h2>
          <button
            onClick={() => {
              setIsCreating(false);
              setEditingOperator(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to List
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-6">
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
                  placeholder="EMP001"
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
                  placeholder="operator@example.com"
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
            </div>

            {/* Machine Assignment & Templates */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Machine Assignment</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Machines
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {machines.map(machine => (
                    <label key={machine.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={currentData.assignedMachines.includes(machine.id)}
                        onChange={(e) => handleMachineSelection(machine.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{machine.name} ({machine.type})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation Template
                </label>
                <select
                  value={currentData.operationTemplateId}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, operationTemplateId: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Template</option>
                  {operationTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Skill
                </label>
                <select
                  value={currentData.skills?.[0] || ''}
                  onChange={(e) => setCurrentData(prev => ({ 
                    ...prev, 
                    skills: e.target.value ? [e.target.value] : [] 
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Primary Skill</option>
                  {skills.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.level})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This determines the operator's specialization and work assignment priority
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (NPR)
                </label>
                <input
                  type="number"
                  value={currentData.hourlyRate}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="150"
                />
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
              onClick={editingOperator ? handleUpdateOperator : handleCreateOperator}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              {editingOperator ? 'Update Operator' : 'Create Operator'}
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingOperator(null);
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
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterByMachine}
            onChange={(e) => setFilterByMachine(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Machines</option>
            {machines.map(machine => (
              <option key={machine.id} value={machine.id}>{machine.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          + Add New Operator
        </button>
      </div>

      {/* Operators List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Operators ({filteredOperators.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skill
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
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
                    <div>
                      <div className="text-sm font-bold text-gray-900">{operator.name}</div>
                      <div className="text-xs text-gray-500 mb-1">{operator.employeeId}</div>
                      <div className="flex flex-wrap gap-1">
                        {operator.assignedMachines && operator.assignedMachines.length > 0 ? (
                          operator.assignedMachines.slice(0, 2).map(machineId => {
                            const machine = machines.find(m => m.id === machineId);
                            const machineType = machine?.type || 'Unknown';
                            return (
                              <span key={machineId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                {machineType === 'single-needle' && '📍'} 
                                {machineType === 'overlock' && '🔗'} 
                                {machineType === 'flatlock' && '📎'} 
                                {machineType === 'buttonhole' && '🕳️'} 
                                {!['single-needle', 'overlock', 'flatlock', 'buttonhole'].includes(machineType) && '⚙️'} 
                                {machineType.replace('-', ' ').toUpperCase()}
                              </span>
                            );
                          })
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            ⚠️ NO MACHINE
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {getSkillName(operator)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {operator.assignedMachines.length > 0 ? (
                        <div className="space-y-1">
                          {operator.assignedMachines.slice(0, 3).map(machineId => {
                            const machine = machines.find(m => m.id === machineId);
                            const machineType = machine?.type || 'Unknown';
                            const isMainMachine = machineType.toLowerCase().includes('single') || 
                                                machineType.toLowerCase().includes('overlock') || 
                                                machineType.toLowerCase().includes('flatlock') ||
                                                machineType.toLowerCase().includes('buttonhole');
                            return (
                              <div key={machineId} className={`text-xs px-3 py-1 rounded-full font-medium border ${
                                isMainMachine 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>
                                {machineType === 'single-needle' && '📍'} 
                                {machineType === 'overlock' && '🔗'} 
                                {machineType === 'flatlock' && '📎'} 
                                {machineType === 'buttonhole' && '🕳️'} 
                                {!['single-needle', 'overlock', 'flatlock', 'buttonhole'].includes(machineType) && '⚙️'} 
                                {getMachineName(machineId)}
                              </div>
                            );
                          })}
                          {operator.assignedMachines.length > 3 && (
                            <div className="text-xs text-gray-500 font-medium">
                              +{operator.assignedMachines.length - 3} more machines
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-400 font-medium">⚠️ No machines assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTemplateName(operator.operationTemplateId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      operator.status === 'active' ? 'bg-green-100 text-green-800' :
                      operator.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {operator.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm">
                      <div>Quality: {operator.productivity?.qualityScore || 100}%</div>
                      <div>Bundles: {operator.productivity?.completedBundles || 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingOperator(operator)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => resetPassword(operator.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleDeleteOperator(operator.id)}
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

        {filteredOperators.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No operators found</div>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Create your first operator
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorManagement;