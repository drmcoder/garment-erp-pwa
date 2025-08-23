import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const OperatorManagement = ({ onStatsUpdate }) => {
  const { currentLanguage } = useLanguage();
  const [operators, setOperators] = useState([]);
  const [machines, setMachines] = useState([]);
  const [operationTemplates, setOperationTemplates] = useState([]);
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

  const loadData = () => {
    try {
      const savedOperators = JSON.parse(localStorage.getItem('operators') || '[]');
      const savedMachines = JSON.parse(localStorage.getItem('machines') || '[]');
      const savedTemplates = JSON.parse(localStorage.getItem('operationTemplates') || '[]');
      
      setOperators(savedOperators);
      setMachines(savedMachines);
      setOperationTemplates(savedTemplates);
      
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error loading operator data:', error);
    }
  };

  const saveOperators = (updatedOperators) => {
    try {
      localStorage.setItem('operators', JSON.stringify(updatedOperators));
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

  const handleCreateOperator = () => {
    if (!newOperator.name || !newOperator.employeeId) {
      alert('Name and Employee ID are required');
      return;
    }

    const operatorId = generateOperatorId();
    const password = generatePassword();

    const operator = {
      ...newOperator,
      id: operatorId,
      password: password,
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
    alert(`Operator created successfully!\nID: ${operatorId}\nPassword: ${password}`);
  };

  const handleUpdateOperator = () => {
    const updatedOperators = operators.map(op => 
      op.id === editingOperator.id ? editingOperator : op
    );
    saveOperators(updatedOperators);
    setEditingOperator(null);
  };

  const handleDeleteOperator = (operatorId) => {
    if (confirm('Are you sure you want to delete this operator?')) {
      const updatedOperators = operators.filter(op => op.id !== operatorId);
      saveOperators(updatedOperators);
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
                      <div className="text-sm font-medium text-gray-900">{operator.name}</div>
                      <div className="text-sm text-gray-500">{operator.employeeId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {operator.assignedMachines.length > 0 ? (
                        <div className="space-y-1">
                          {operator.assignedMachines.slice(0, 2).map(machineId => (
                            <div key={machineId} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {getMachineName(machineId)}
                            </div>
                          ))}
                          {operator.assignedMachines.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{operator.assignedMachines.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No machines assigned</span>
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