import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';

const TemplateBuilder = ({ onTemplateCreated, onCancel, editingTemplate, onTemplateUpdated }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const isNepali = currentLanguage === 'np';

  const [template, setTemplate] = useState(() => {
    if (editingTemplate) {
      return {
        name: editingTemplate.name || '',
        nameNp: editingTemplate.nameNp || '',
        articleNumber: editingTemplate.articleNumbers?.[0] || '',
        operations: editingTemplate.operations || []
      };
    }
    return {
      name: '',
      nameNp: '',
      articleNumber: '',
      operations: []
    };
  });

  const [currentOperation, setCurrentOperation] = useState({
    name: '',
    nameNp: '',
    machineType: 'overlock',
    estimatedTime: '',
    rate: '',
    skillLevel: 'medium',
    icon: '🧵'
  });

  const machineTypes = [
    { id: 'cutting', nameEn: 'Cutting Machine', nameNp: 'काट्ने मेसिन', icon: '✂️' },
    { id: 'overlock', nameEn: 'Overlock Machine', nameNp: 'ओभरलक मेसिन', icon: '🧵' },
    { id: 'singleNeedle', nameEn: 'Single Needle', nameNp: 'एकल सुई', icon: '🪡' },
    { id: 'flatlock', nameEn: 'Flatlock Machine', nameNp: 'फ्ल्याटलक मेसिन', icon: '📏' },
    { id: 'buttonhole', nameEn: 'Buttonhole Machine', nameNp: 'बटनहोल मेसिन', icon: '⚫' },
    { id: 'interlock', nameEn: 'Interlock Machine', nameNp: 'इन्टरलक मेसिन', icon: '🔗' },
    { id: 'coverstitch', nameEn: 'Coverstitch Machine', nameNp: 'कभरस्टिच मेसिन', icon: '🪢' },
    { id: 'zigzag', nameEn: 'Zigzag Machine', nameNp: 'जिगज्याग मेसिन', icon: '⚡' },
    { id: 'manual', nameEn: 'Manual Work', nameNp: 'म्यानुअल काम', icon: '👐' }
  ];

  const skillLevels = [
    { id: 'easy', nameEn: 'Easy', nameNp: 'सजिलो' },
    { id: 'medium', nameEn: 'Medium', nameNp: 'मध्यम' },
    { id: 'high', nameEn: 'High', nameNp: 'कठिन' }
  ];

  const operationIcons = ['🧵', '✂️', '🪡', '📏', '📐', '🪢', '⚫', '✨', '✅', '👐'];

  const addOperation = () => {
    if (!currentOperation.name || !currentOperation.estimatedTime || !currentOperation.rate) {
      addError({
        message: isNepali ? 'सबै फिल्डहरू भर्नुहोस्' : 'Please fill all operation fields',
        component: 'TemplateBuilder',
        action: 'Add Operation'
      }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
      return;
    }

    const newOperation = {
      ...currentOperation,
      id: template.operations.length + 1,
      sequence: template.operations.length + 1,
      estimatedTimePerPiece: parseFloat(currentOperation.estimatedTime),
      rate: parseFloat(currentOperation.rate),
      dependencies: template.operations.length > 0 ? [template.operations.length] : []
    };

    setTemplate(prev => ({
      ...prev,
      operations: [...prev.operations, newOperation]
    }));

    // Reset operation form
    setCurrentOperation({
      name: '',
      nameNp: '',
      machineType: 'overlock',
      estimatedTime: '',
      rate: '',
      skillLevel: 'medium',
      icon: '🧵'
    });
  };

  const removeOperation = (index) => {
    setTemplate(prev => ({
      ...prev,
      operations: prev.operations.filter((_, i) => i !== index)
    }));
  };

  const createTemplate = () => {
    if (!template.name || !template.articleNumber || template.operations.length === 0) {
      addError({
        message: isNepali ? 'टेम्प्लेट नाम, आर्टिकल नम्बर र कम्तीमा एक अपरेसन चाहिन्छ' : 'Template name, article number and at least one operation required',
        component: 'TemplateBuilder',
        action: editingTemplate ? 'Update Template' : 'Create Template'
      }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
      return;
    }

    if (editingTemplate) {
      // Update existing template
      const updatedTemplate = {
        ...editingTemplate,
        name: template.name,
        nameNp: template.nameNp || template.name,
        articleNumbers: [template.articleNumber],
        operations: template.operations,
        totalOperations: template.operations.length,
        estimatedTotalTime: template.operations.reduce((sum, op) => sum + op.estimatedTimePerPiece, 0),
        updatedAt: new Date()
      };

      if (onTemplateUpdated) {
        onTemplateUpdated(updatedTemplate);
      }

      addError({
        message: isNepali 
          ? `${template.name} टेम्प्लेट अपडेट गरियो` 
          : `Template "${template.name}" updated successfully`,
        component: 'TemplateBuilder',
        action: 'Update Template'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
    } else {
      // Create new template
      const finalTemplate = {
        id: `custom-${template.articleNumber}-${Date.now()}`,
        name: template.name,
        nameNp: template.nameNp || template.name,
        articleType: 'custom',
        articleNumbers: [template.articleNumber],
        operations: template.operations,
        totalOperations: template.operations.length,
        estimatedTotalTime: template.operations.reduce((sum, op) => sum + op.estimatedTimePerPiece, 0),
        createdAt: new Date(),
        customTemplate: true
      };

      if (onTemplateCreated) {
        onTemplateCreated(finalTemplate);
      }

      addError({
        message: isNepali 
          ? `${template.name} टेम्प्लेट सिर्जना गरियो` 
          : `Template "${template.name}" created successfully`,
        component: 'TemplateBuilder',
        action: 'Create Template'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
    }
  };

  const getMachineIcon = (machineType) => {
    return machineTypes.find(m => m.id === machineType)?.icon || '🧵';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            🛠️ {editingTemplate 
              ? (isNepali ? 'टेम्प्लेट सम्पादन' : 'Edit Template')
              : (isNepali ? 'टेम्प्लेट निर्माता' : 'Template Builder')
            }
          </h1>
          <p className="text-gray-600 mt-1">
            {editingTemplate 
              ? (isNepali 
                ? 'गार्मेन्ट डिजाइनको सिलाई प्रक्रिया टेम्प्लेट सम्पादन गर्नुहोस्'
                : 'Edit sewing process template for garment design'
              )
              : (isNepali 
                ? 'नयाँ गार्मेन्ट डिजाइनको लागि सिलाई प्रक्रिया टेम्प्लेट बनाउनुहोस्'
                : 'Create sewing process template for new garment design'
              )
            }
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Template Basic Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📋 {isNepali ? 'मूल जानकारी' : 'Basic Information'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'टेम्प्लेट नाम (अंग्रेजी)' : 'Template Name (English)'} *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Plazo 5810 Process"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'टेम्प्लेट नाम (नेपाली)' : 'Template Name (Nepali)'}
                </label>
                <input
                  type="text"
                  value={template.nameNp}
                  onChange={(e) => setTemplate(prev => ({ ...prev, nameNp: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="प्लाजो ५८१० प्रक्रिया"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'आर्टिकल नम्बर' : 'Article Number'} *
                </label>
                <input
                  type="text"
                  value={template.articleNumber}
                  onChange={(e) => setTemplate(prev => ({ ...prev, articleNumber: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="5810"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {isNepali 
                    ? 'यो टेम्प्लेट कुन आर्टिकलको लागि हो'
                    : 'Which article number this template is for'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Add New Operation */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ➕ {isNepali ? 'नयाँ अपरेसन थप्नुहोस्' : 'Add New Operation'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अपरेसन नाम (अंग्रेजी)' : 'Operation Name (English)'} *
                </label>
                <input
                  type="text"
                  value={currentOperation.name}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Waistband Preparation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अपरेसन नाम (नेपाली)' : 'Operation Name (Nepali)'}
                </label>
                <input
                  type="text"
                  value={currentOperation.nameNp}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, nameNp: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="कम्मर बन्ड तयारी"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'मेसिन प्रकार' : 'Machine Type'} *
                </label>
                <select
                  value={currentOperation.machineType}
                  onChange={(e) => setCurrentOperation(prev => ({ 
                    ...prev, 
                    machineType: e.target.value,
                    icon: getMachineIcon(e.target.value)
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {machineTypes.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.icon} {isNepali ? machine.nameNp : machine.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'समय (मिनेट प्रति टुक्रा)' : 'Time (min per piece)'} *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={currentOperation.estimatedTime}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'दर (रु प्रति टुक्रा)' : 'Rate (₹ per piece)'} *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={currentOperation.rate}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, rate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="3.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'कौशल स्तर' : 'Skill Level'} *
                </label>
                <select
                  value={currentOperation.skillLevel}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, skillLevel: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {skillLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {isNepali ? level.nameNp : level.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'आइकन' : 'Icon'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {operationIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCurrentOperation(prev => ({ ...prev, icon }))}
                      className={`p-2 text-lg border rounded ${
                        currentOperation.icon === icon 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={addOperation}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {isNepali ? 'अपरेसन थप्नुहोस्' : 'Add Operation'}
            </button>
          </div>

          {/* Operations List */}
          {template.operations.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📋 {isNepali ? 'अपरेसनहरूको क्रम' : 'Operations Sequence'} ({template.operations.length})
              </h2>
              
              <div className="space-y-3">
                {template.operations.map((operation, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="text-2xl">{operation.icon}</div>
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {isNepali ? operation.nameNp || operation.name : operation.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {machineTypes.find(m => m.id === operation.machineType)?.[isNepali ? 'nameNp' : 'nameEn']}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div>{operation.estimatedTimePerPiece} {isNepali ? 'मिनेट' : 'min'}</div>
                        <div>₹{operation.rate}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeOperation(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {/* Template Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{template.operations.length}</div>
                    <div className="text-sm text-gray-600">{isNepali ? 'अपरेसनहरू' : 'Operations'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {template.operations.reduce((sum, op) => sum + parseFloat(op.estimatedTimePerPiece || 0), 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">{isNepali ? 'कुल मिनेट' : 'Total Minutes'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      ₹{template.operations.reduce((sum, op) => sum + parseFloat(op.rate || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">{isNepali ? 'कुल लागत' : 'Total Cost'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>

            <button
              onClick={createTemplate}
              disabled={!template.name || !template.articleNumber || template.operations.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              💾 {editingTemplate 
                ? (isNepali ? 'टेम्प्लेट अपडेट गर्नुहोस्' : 'Update Template')
                : (isNepali ? 'टेम्प्लेट बनाउनुहोस्' : 'Create Template')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;