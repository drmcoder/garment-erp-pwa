// This is a backup of the working TemplateBuilder
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';

const TemplateBuilder = ({ onTemplateCreated, onCancel, editingTemplate, onTemplateUpdated }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const isNepali = currentLanguage === 'np';

  const [template, setTemplate] = useState(() => {
    return editingTemplate || {
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
    icon: '🧵',
    workflowType: 'sequential',
    parallelGroup: '',
    dependencies: []
  });

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
      operation: currentOperation.name
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
      icon: '🧵',
      workflowType: 'sequential',
      parallelGroup: '',
      dependencies: []
    });
  };

  const createTemplate = () => {
    if (editingTemplate && onTemplateUpdated) {
      onTemplateUpdated(template);
    } else if (onTemplateCreated) {
      onTemplateCreated(template);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            🛠️ {isNepali ? 'टेम्प्लेट निर्माता' : 'Template Builder'}
          </h1>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📋 {isNepali ? 'मूल जानकारी' : 'Basic Information'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'टेम्प्लेट नाम' : 'Template Name'} *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ladies Pant"
                />
              </div>

              <div>
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
              </div>
            </div>
          </div>

          {/* Add Operation */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ➕ {isNepali ? 'नयाँ अपरेसन थप्नुहोस्' : 'Add New Operation'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अपरेसन नाम' : 'Operation Name'} *
                </label>
                <input
                  type="text"
                  value={currentOperation.name}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Shoulder Join"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'समय (मिनेट)' : 'Time (minutes)'} *
                </label>
                <input
                  type="number"
                  value={currentOperation.estimatedTime}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'दर (₹)' : 'Rate (₹)'} *
                </label>
                <input
                  type="number"
                  value={currentOperation.rate}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, rate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="3.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'कार्यप्रवाह प्रकार' : 'Workflow Type'} *
                </label>
                <select
                  value={currentOperation.workflowType}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, workflowType: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sequential">{isNepali ? 'क्रमिक' : 'Sequential'} ➡️</option>
                  <option value="parallel">{isNepali ? 'समानान्तर' : 'Parallel'} 🔄</option>
                </select>
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
                📋 {isNepali ? 'अपरेसनहरू' : 'Operations'} ({template.operations.length})
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
                          {operation.name}
                          <span className="ml-2">
                            {operation.workflowType === 'parallel' ? '🔄' : '➡️'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {operation.estimatedTimePerPiece} min • ₹{operation.rate}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                ? (isNepali ? 'अपडेट गर्नुहोस्' : 'Update Template')
                : (isNepali ? 'बनाउनुहोस्' : 'Create Template')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;