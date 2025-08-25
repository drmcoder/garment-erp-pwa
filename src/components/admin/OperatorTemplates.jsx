import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const OperatorTemplates = ({ onStatsUpdate }) => {
  const { currentLanguage } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByGarment, setFilterByGarment] = useState('all');

  const [newTemplate, setNewTemplate] = useState({
    id: '',
    name: '',
    garmentType: 'tshirt',
    description: '',
    operations: [],
    status: 'active',
    createdAt: '',
    notes: ''
  });

  // Load common garment operations from localStorage or use empty object
  const [commonOperations, setCommonOperations] = useState(() => {
    try {
      // No localStorage fallback - use empty object
      return {};
    } catch (error) {
      console.error('Error loading common operations:', error);
      return {};
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // No localStorage data loading - use empty arrays
      const savedTemplates = [];
      const savedMachines = [];
      
      setTemplates(savedTemplates);
      setMachines(savedMachines);
      
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error loading template data:', error);
    }
  };

  const saveTemplates = (updatedTemplates) => {
    try {
      // No localStorage saving - only set state
      setTemplates(updatedTemplates);
      if (onStatsUpdate) onStatsUpdate();
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  };

  const generateTemplateId = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `TEMP${timestamp}`;
  };

  const loadGarmentTemplate = (garmentType) => {
    const operations = commonOperations[garmentType]?.map(op => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      operation: op.operation,
      machineId: '',
      machineType: op.machines[0], // Default to first machine type
      availableMachines: op.machines,
      pricePerPiece: op.defaultPrice,
      estimatedTime: Math.round(op.defaultPrice * 3.5), // Rough estimation
      qualityCheckRequired: true
    })) || [];

    if (editingTemplate) {
      setEditingTemplate(prev => ({
        ...prev,
        garmentType: garmentType,
        operations: operations
      }));
    } else {
      setNewTemplate(prev => ({
        ...prev,
        garmentType: garmentType,
        operations: operations
      }));
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || newTemplate.operations.length === 0) {
      alert('Template name and at least one operation are required');
      return;
    }

    const template = {
      ...newTemplate,
      id: generateTemplateId(),
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, template];
    saveTemplates(updatedTemplates);

    // Reset form
    setNewTemplate({
      id: '',
      name: '',
      garmentType: 'tshirt',
      description: '',
      operations: [],
      status: 'active',
      createdAt: '',
      notes: ''
    });

    setIsCreating(false);
    alert('Template created successfully!');
  };

  const handleUpdateTemplate = () => {
    const updatedTemplates = templates.map(temp => 
      temp.id === editingTemplate.id ? editingTemplate : temp
    );
    saveTemplates(updatedTemplates);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      const updatedTemplates = templates.filter(temp => temp.id !== templateId);
      saveTemplates(updatedTemplates);
    }
  };

  const addOperation = () => {
    const newOperation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      operation: '',
      machineId: '',
      machineType: '',
      availableMachines: [],
      pricePerPiece: 0,
      estimatedTime: 0,
      qualityCheckRequired: true
    };

    if (editingTemplate) {
      setEditingTemplate(prev => ({
        ...prev,
        operations: [...prev.operations, newOperation]
      }));
    } else {
      setNewTemplate(prev => ({
        ...prev,
        operations: [...prev.operations, newOperation]
      }));
    }
  };

  const updateOperation = (operationId, field, value) => {
    const updateOperations = (operations) => 
      operations.map(op => op.id === operationId ? { ...op, [field]: value } : op);

    if (editingTemplate) {
      setEditingTemplate(prev => ({
        ...prev,
        operations: updateOperations(prev.operations)
      }));
    } else {
      setNewTemplate(prev => ({
        ...prev,
        operations: updateOperations(prev.operations)
      }));
    }
  };

  const removeOperation = (operationId) => {
    if (editingTemplate) {
      setEditingTemplate(prev => ({
        ...prev,
        operations: prev.operations.filter(op => op.id !== operationId)
      }));
    } else {
      setNewTemplate(prev => ({
        ...prev,
        operations: prev.operations.filter(op => op.id !== operationId)
      }));
    }
  };

  const getMachineName = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : 'Select Machine';
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.garmentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGarment = filterByGarment === 'all' || template.garmentType === filterByGarment;
    return matchesSearch && matchesGarment;
  });

  if (isCreating || editingTemplate) {
    const currentData = editingTemplate || newTemplate;
    const setCurrentData = editingTemplate ? setEditingTemplate : setNewTemplate;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTemplate 
              ? (currentLanguage === 'en' ? 'Edit Template' : 'टेम्प्लेट सम्पादन गर्नुहोस्')
              : (currentLanguage === 'en' ? 'New Operation Template' : 'नयाँ अपरेशन टेम्प्लेट')
            }
          </h2>
          <button
            onClick={() => {
              setIsCreating(false);
              setEditingTemplate(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to List
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Basic Template Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={currentData.name}
                onChange={(e) => setCurrentData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., T-Shirt Standard Operations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garment Type *
              </label>
              <select
                value={currentData.garmentType}
                onChange={(e) => {
                  setCurrentData(prev => ({ ...prev, garmentType: e.target.value }));
                  loadGarmentTemplate(e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="tshirt">T-Shirt</option>
                <option value="polo">Polo Shirt</option>
                <option value="shirt">Formal Shirt</option>
                <option value="trouser">Trouser</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={currentData.description}
              onChange={(e) => setCurrentData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this template..."
            />
          </div>

          {/* Operations List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Operations</h3>
              <div className="space-x-2">
                <button
                  onClick={() => loadGarmentTemplate(currentData.garmentType)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Load Standard Operations
                </button>
                <button
                  onClick={addOperation}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  + Add Custom Operation
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Operation</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Machine</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Price/Piece</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Est. Time (min)</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quality Check</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentData.operations.map((operation, index) => (
                    <tr key={operation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={operation.operation}
                          onChange={(e) => updateOperation(operation.id, 'operation', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Operation name"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={operation.machineId}
                          onChange={(e) => updateOperation(operation.id, 'machineId', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Machine</option>
                          {machines
                            .filter(m => !operation.availableMachines.length || 
                                        operation.availableMachines.includes(m.type))
                            .map(machine => (
                            <option key={machine.id} value={machine.id}>
                              {machine.name} ({machine.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={operation.pricePerPiece}
                          onChange={(e) => updateOperation(operation.id, 'pricePerPiece', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          step="0.10"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={operation.estimatedTime}
                          onChange={(e) => updateOperation(operation.id, 'estimatedTime', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={operation.qualityCheckRequired}
                          onChange={(e) => updateOperation(operation.id, 'qualityCheckRequired', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeOperation(operation.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {currentData.operations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No operations added yet</p>
                <p className="text-sm">Click "Load Standard Operations" to get started with common operations</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingTemplate(null);
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
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterByGarment}
            onChange={(e) => setFilterByGarment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Garments</option>
            <option value="tshirt">T-Shirt</option>
            <option value="polo">Polo Shirt</option>
            <option value="shirt">Formal Shirt</option>
            <option value="trouser">Trouser</option>
          </select>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          + Create New Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{template.garmentType}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                template.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {template.status}
              </span>
            </div>

            {template.description && (
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Operations:</span>
                <span className="font-medium">{template.operations.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Price/Piece:</span>
                <span className="font-medium">
                  NPR {template.operations.reduce((sum, op) => sum + (op.pricePerPiece || 0), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Est. Total Time:</span>
                <span className="font-medium">
                  {template.operations.reduce((sum, op) => sum + (op.estimatedTime || 0), 0)} min
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setEditingTemplate(template)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteTemplate(template.id)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>

            {/* Operations Preview */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Operations:</h4>
              <div className="space-y-1">
                {template.operations.slice(0, 3).map((op, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-600">
                    <span>{op.operation}</span>
                    <span>NPR {op.pricePerPiece}</span>
                  </div>
                ))}
                {template.operations.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{template.operations.length - 3} more operations
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No operation templates found</div>
          <button
            onClick={() => setIsCreating(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            Create your first operation template
          </button>
        </div>
      )}
    </div>
  );
};

export default OperatorTemplates;