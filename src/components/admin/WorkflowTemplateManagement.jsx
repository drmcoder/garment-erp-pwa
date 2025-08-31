// ⚠️ DEPRECATED: This component is no longer used in Admin Dashboard
// Template and Workflow management has been moved to Supervisor level
// Supervisors now handle all templates through ProcessTemplateManager component
// This file remains for backward compatibility but is not actively maintained

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ConfigService } from '../../services/firebase-services';
import { db, collection, addDoc, updateDoc, doc, deleteDoc, getDocs, serverTimestamp } from '../../config/firebase';

const WorkflowTemplateManagement = ({ onBack }) => {
  const { currentLanguage, isNepali } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [operations, setOperations] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newTemplate, setNewTemplate] = useState({
    id: '',
    name: '',
    nameNp: '',
    description: '',
    garmentType: '',
    operations: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Loading workflow template data...');
      
      const [templatesData, operationsData, machinesData] = await Promise.all([
        loadWorkflowTemplates(),
        ConfigService.getOperations(),
        ConfigService.getMachines()
      ]);
      
      setTemplates(templatesData);
      setOperations(operationsData);
      setMachines(machinesData);
      
      console.log('✅ Loaded workflow template data:', {
        templates: templatesData.length,
        operations: operationsData.length,
        machines: machinesData.length
      });
    } catch (error) {
      console.error('❌ Error loading workflow template data:', error);
    }
  };

  const loadWorkflowTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'workflow_templates'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading workflow templates:', error);
      return [];
    }
  };

  const saveTemplate = async (templateData, isUpdate = false, templateId = null) => {
    try {
      const dataToSave = {
        ...templateData,
        updatedAt: serverTimestamp(),
        ...(isUpdate ? {} : { createdAt: serverTimestamp() })
      };

      if (isUpdate && templateId) {
        await updateDoc(doc(db, 'workflow_templates', templateId), dataToSave);
        console.log(`✅ Template updated: ${templateId}`);
      } else {
        await addDoc(collection(db, 'workflow_templates'), dataToSave);
        console.log(`✅ Template created`);
      }
      
      await loadData();
    } catch (error) {
      console.error('❌ Error saving template:', error);
      throw error;
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.garmentType) {
      alert('Template name and garment type are required');
      return;
    }

    if (newTemplate.operations.length === 0) {
      alert('At least one operation is required');
      return;
    }

    try {
      await saveTemplate(newTemplate, false);
      
      // Reset form
      setNewTemplate({
        id: '',
        name: '',
        nameNp: '',
        description: '',
        garmentType: '',
        operations: []
      });

      setIsCreating(false);
      alert('Workflow template created successfully!');
    } catch (error) {
      alert('Error creating template. Please try again.');
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      await saveTemplate(editingTemplate, true, editingTemplate.id);
      setEditingTemplate(null);
      alert('Template updated successfully!');
    } catch (error) {
      alert('Error updating template. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await deleteDoc(doc(db, 'workflow_templates', templateId));
      await loadData();
      alert('Template deleted successfully!');
    } catch (error) {
      alert('Error deleting template. Please try again.');
    }
  };

  const addOperation = (template, setTemplate) => {
    const newOperation = {
      id: Date.now(),
      operation: '',
      machine: '',
      sequence: template.operations.length + 1,
      estimatedTime: 15,
      workflowType: 'sequential',
      dependencies: [],
      parallelGroup: ''
    };
    
    setTemplate(prev => ({
      ...prev,
      operations: [...prev.operations, newOperation]
    }));
  };

  const updateOperation = (template, setTemplate, operationIndex, field, value) => {
    setTemplate(prev => ({
      ...prev,
      operations: prev.operations.map((op, idx) => 
        idx === operationIndex ? { ...op, [field]: value } : op
      )
    }));
  };

  const removeOperation = (template, setTemplate, operationIndex) => {
    setTemplate(prev => ({
      ...prev,
      operations: prev.operations.filter((_, idx) => idx !== operationIndex)
    }));
  };

  const getMachineName = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  const getOperationName = (operationId) => {
    const operation = operations.find(o => o.id === operationId);
    return operation ? operation.name : operationId;
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.garmentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isCreating || editingTemplate) {
    const currentData = editingTemplate || newTemplate;
    const setCurrentData = editingTemplate ? setEditingTemplate : setNewTemplate;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingTemplate 
              ? (isNepali ? 'टेम्प्लेट सम्पादन गर्नुहोस्' : 'Edit Workflow Template')
              : (isNepali ? 'नयाँ वर्कफ्लो टेम्प्लेट' : 'Create Workflow Template')
            }
          </h2>
          <button
            onClick={() => {
              setIsCreating(false);
              setEditingTemplate(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← {isNepali ? 'फिर्ता' : 'Back'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'टेम्प्लेट नाम' : 'Template Name'} *
                </label>
                <input
                  type="text"
                  value={currentData.name}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={isNepali ? "जस्तै: पोलो टी-शर्ट उत्पादन" : "e.g., Polo T-Shirt Production"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isNepali ? 'नेपाली नाम' : 'Nepali Name'}
                </label>
                <input
                  type="text"
                  value={currentData.nameNp}
                  onChange={(e) => setCurrentData(prev => ({ ...prev, nameNp: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={isNepali ? "नेपाली नाम" : "Nepali name"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isNepali ? 'गारमेन्ट प्रकार' : 'Garment Type'} *
              </label>
              <input
                type="text"
                value={currentData.garmentType}
                onChange={(e) => setCurrentData(prev => ({ ...prev, garmentType: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={isNepali ? "जस्तै: polo, tshirt, shirt" : "e.g., polo, tshirt, shirt"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isNepali ? 'विवरण' : 'Description'}
              </label>
              <textarea
                value={currentData.description}
                onChange={(e) => setCurrentData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={isNepali ? "टेम्प्लेटको विवरण" : "Template description"}
              />
            </div>

            {/* Operations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {isNepali ? 'कार्यहरू' : 'Operations'}
                </h3>
                <button
                  onClick={() => addOperation(currentData, setCurrentData)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  + {isNepali ? 'काम थप्नुहोस्' : 'Add Operation'}
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {currentData.operations.map((operation, index) => (
                  <div key={operation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'काम' : 'Operation'}
                        </label>
                        <select
                          value={operation.operation}
                          onChange={(e) => updateOperation(currentData, setCurrentData, index, 'operation', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">{isNepali ? 'छान्नुहोस्' : 'Select'}</option>
                          {operations.map(op => (
                            <option key={op.id} value={op.id}>
                              {isNepali ? op.nameNp || op.name : op.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'मेसिन' : 'Machine'}
                        </label>
                        <select
                          value={operation.machine}
                          onChange={(e) => updateOperation(currentData, setCurrentData, index, 'machine', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">{isNepali ? 'छान्नुहोस्' : 'Select'}</option>
                          {machines.map(machine => (
                            <option key={machine.id} value={machine.id}>
                              {isNepali ? machine.nameNp || machine.name : machine.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'क्रम' : 'Sequence'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={operation.sequence}
                          onChange={(e) => updateOperation(currentData, setCurrentData, index, 'sequence', parseFloat(e.target.value) || 1)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'समय' : 'Time (min)'}
                        </label>
                        <input
                          type="number"
                          value={operation.estimatedTime}
                          onChange={(e) => updateOperation(currentData, setCurrentData, index, 'estimatedTime', parseInt(e.target.value) || 15)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'प्रकार' : 'Type'}
                        </label>
                        <select
                          value={operation.workflowType}
                          onChange={(e) => updateOperation(currentData, setCurrentData, index, 'workflowType', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="sequential">{isNepali ? 'क्रमिक' : 'Sequential'}</option>
                          <option value="parallel">{isNepali ? 'समानान्तर' : 'Parallel'}</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => removeOperation(currentData, setCurrentData, index)}
                          className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {operation.workflowType === 'parallel' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isNepali ? 'समानान्तर समूह' : 'Parallel Group'}
                        </label>
                        <input
                          type="text"
                          value={operation.parallelGroup}
                          onChange={(e) => updateOperation(currentData, setCurrentData, index, 'parallelGroup', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder={isNepali ? "जस्तै: decoration, preparation" : "e.g., decoration, preparation"}
                        />
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isNepali ? 'निर्भरता' : 'Dependencies'} ({isNepali ? 'कमा द्वारा छुट्याइएको' : 'comma separated'})
                      </label>
                      <input
                        type="text"
                        value={operation.dependencies.join(', ')}
                        onChange={(e) => updateOperation(currentData, setCurrentData, index, 'dependencies', 
                          e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                        )}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={isNepali ? "जस्तै: shoulder_join, collar" : "e.g., shoulder_join, collar"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                {editingTemplate 
                  ? (isNepali ? 'टेम्प्लेट अपडेट गर्नुहोस्' : 'Update Template')
                  : (isNepali ? 'टेम्प्लेट बनाउनुहोस्' : 'Create Template')
                }
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600"
              >
                {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
              ← {isNepali ? 'फिर्ता' : 'Back'}
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {isNepali ? '🔄 वर्कफ्लो टेम्प्लेट व्यवस्थापन' : '🔄 Workflow Template Management'}
          </h1>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isNepali ? '+ नयाँ टेम्प्लेट' : '+ Add Template'}
        </button>
      </div>

      {/* Search */}
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder={isNepali ? "टेम्प्लेट खोज्नुहोस्..." : "Search templates..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isNepali ? 'टेम्प्लेटहरू' : 'Templates'} ({filteredTemplates.length})
          </h3>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {isNepali ? 'कुनै टेम्प्लेट फेला परेन' : 'No templates found'}
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              {isNepali ? 'पहिलो टेम्प्लेट बनाउनुहोस्' : 'Create your first template'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">
                      {isNepali ? template.nameNp || template.name : template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {isNepali ? 'गारमेन्ट प्रकार:' : 'Garment Type:'} {template.garmentType}
                    </p>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-2">{template.description}</p>
                    )}
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        {isNepali ? 'कार्यहरू:' : 'Operations:'} {template.operations.length}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.operations.slice(0, 5).map((op, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-1 rounded ${
                              op.workflowType === 'parallel' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {op.workflowType === 'parallel' ? '🔄' : '➡️'} {getOperationName(op.operation)}
                          </span>
                        ))}
                        {template.operations.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{template.operations.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700"
                    >
                      {isNepali ? 'सम्पादन' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700"
                    >
                      {isNepali ? 'मेटाउनुहोस्' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowTemplateManagement;