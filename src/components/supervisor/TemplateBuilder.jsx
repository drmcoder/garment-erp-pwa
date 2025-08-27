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

  const [showPresets, setShowPresets] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showTrackingDiagram, setShowTrackingDiagram] = useState(false);

  // Product avatars
  const productAvatars = {
    shirt: '👕',
    tshirt: '👔', 
    pants: '👖',
    dress: '👗',
    skirt: '🩱',
    jacket: '🧥',
    shorts: '🩳',
    blouse: '👚',
    sweater: '🧶',
    coat: '🧥'
  };

  // Enhanced machine avatars with worker icons
  const machineAvatars = {
    cutting: { machine: '✂️', worker: '👨‍🔧', name: 'Cutting Station' },
    overlock: { machine: '🔗', worker: '👩‍🏭', name: 'Overlock Machine' },
    flatlock: { machine: '🪢', worker: '👨‍🏭', name: 'Flatlock Machine' },
    singleNeedle: { machine: '🪡', worker: '👩‍💼', name: 'Single Needle' },
    buttonhole: { machine: '🔘', worker: '👨‍💼', name: 'Buttonhole Machine' },
    iron: { machine: '🔥', worker: '👩‍🔧', name: 'Pressing Station' }
  };

  // Common operation presets
  const operationPresets = [
    { name: 'Shoulder Join', nameNp: 'काँध जोड्ने', machineType: 'overlock', time: 2.5, rate: 3.0, skillLevel: 'medium', icon: '👔' },
    { name: 'Side Seam', nameNp: 'छेउको सिलाई', machineType: 'overlock', time: 3.0, rate: 3.5, skillLevel: 'medium', icon: '📏' },
    { name: 'Hemming', nameNp: 'किनारा सिलाई', machineType: 'singleNeedle', time: 2.0, rate: 2.5, skillLevel: 'easy', icon: '📐' },
    { name: 'Buttonhole', nameNp: 'बटनहोल', machineType: 'buttonhole', time: 1.5, rate: 4.0, skillLevel: 'hard', icon: '🔘' },
    { name: 'Collar Attach', nameNp: 'कलर लगाउने', machineType: 'singleNeedle', time: 4.0, rate: 5.0, skillLevel: 'hard', icon: '👔' },
    { name: 'Sleeve Attach', nameNp: 'आस्तिन लगाउने', machineType: 'overlock', time: 3.5, rate: 4.0, skillLevel: 'medium', icon: '👕' },
    { name: 'Pocket Attach', nameNp: 'खल्ती लगाउने', machineType: 'singleNeedle', time: 2.5, rate: 3.0, skillLevel: 'easy', icon: '🎒' },
    { name: 'Label Attach', nameNp: 'लेबल लगाउने', machineType: 'singleNeedle', time: 1.0, rate: 2.0, skillLevel: 'easy', icon: '🏷️' }
  ];

  // Machine type icons (for backward compatibility)
  const machineIcons = {
    cutting: '✂️',
    overlock: '🔗',
    flatlock: '🪢',
    singleNeedle: '🪡',
    buttonhole: '🔘',
    iron: '🔥'
  };

  // Get product avatar based on template type
  const getProductAvatar = () => {
    const templateName = template.name.toLowerCase();
    if (templateName.includes('shirt') || templateName.includes('शर्ट')) return productAvatars.shirt;
    if (templateName.includes('t-shirt') || templateName.includes('टी-शर्ट')) return productAvatars.tshirt;
    if (templateName.includes('pant') || templateName.includes('प्यान्ट')) return productAvatars.pants;
    if (templateName.includes('dress') || templateName.includes('पोशाक')) return productAvatars.dress;
    if (templateName.includes('jacket') || templateName.includes('ज्याकेट')) return productAvatars.jacket;
    if (templateName.includes('skirt') || templateName.includes('स्कर्ट')) return productAvatars.skirt;
    return productAvatars.shirt; // Default
  };

  // Group operations by workflow type
  const groupOperationsByWorkflow = () => {
    const groups = [];
    let currentGroup = [];
    let currentType = null;

    template.operations.forEach((operation, index) => {
      if (operation.workflowType !== currentType) {
        if (currentGroup.length > 0) {
          groups.push({
            type: currentType,
            operations: currentGroup,
            isParallel: currentType === 'parallel'
          });
        }
        currentGroup = [operation];
        currentType = operation.workflowType;
      } else {
        currentGroup.push(operation);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        type: currentType,
        operations: currentGroup,
        isParallel: currentType === 'parallel'
      });
    }

    return groups;
  };

  // Validate operation fields
  const validateOperation = (operation) => {
    const errors = {};
    
    if (!operation.name.trim()) {
      errors.name = isNepali ? 'अपरेसन नाम आवश्यक छ' : 'Operation name is required';
    }
    
    if (!operation.estimatedTime || parseFloat(operation.estimatedTime) <= 0) {
      errors.estimatedTime = isNepali ? 'सही समय प्रविष्ट गर्नुहोस्' : 'Valid time is required';
    }
    
    if (!operation.rate || parseFloat(operation.rate) <= 0) {
      errors.rate = isNepali ? 'सही दर प्रविष्ट गर्नुहोस्' : 'Valid rate is required';
    }
    
    return errors;
  };

  // Load preset operation
  const loadPreset = (preset) => {
    setCurrentOperation({
      name: preset.name,
      nameNp: preset.nameNp,
      machineType: preset.machineType,
      estimatedTime: preset.time.toString(),
      rate: preset.rate.toString(),
      skillLevel: preset.skillLevel,
      icon: preset.icon,
      workflowType: 'sequential',
      parallelGroup: '',
      dependencies: []
    });
    setValidationErrors({});
    setShowPresets(false);
  };

  const addOperation = () => {
    const errors = validateOperation(currentOperation);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      addError({
        message: isNepali ? 'सबै फिल्डहरू सही तरिकाले भर्नुहोस्' : 'Please fill all fields correctly',
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
      operation: currentOperation.name,
      icon: machineIcons[currentOperation.machineType] || currentOperation.icon
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
    setValidationErrors({});
  };

  // Remove operation
  const removeOperation = (operationId) => {
    setTemplate(prev => ({
      ...prev,
      operations: prev.operations.filter(op => op.id !== operationId)
    }));
  };

  // Move operation up/down
  const moveOperation = (operationId, direction) => {
    setTemplate(prev => {
      const operations = [...prev.operations];
      const index = operations.findIndex(op => op.id === operationId);
      
      if (direction === 'up' && index > 0) {
        [operations[index], operations[index - 1]] = [operations[index - 1], operations[index]];
      } else if (direction === 'down' && index < operations.length - 1) {
        [operations[index], operations[index + 1]] = [operations[index + 1], operations[index]];
      }
      
      // Update sequence numbers
      operations.forEach((op, i) => {
        op.sequence = i + 1;
      });
      
      return { ...prev, operations };
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
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">➕</span>
                {isNepali ? 'नयाँ अपरेसन थप्नुहोस्' : 'Add New Operation'}
              </h2>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                🎯 {isNepali ? 'प्रिसेट प्रयोग गर्नुहोस्' : 'Use Preset'}
              </button>
            </div>

            {/* Presets Dropdown */}
            {showPresets && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-3">
                  {isNepali ? 'सामान्य अपरेसनहरू' : 'Common Operations'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {operationPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => loadPreset(preset)}
                      className="p-3 bg-gray-50 hover:bg-blue-100 rounded-lg border border-gray-200 transition-colors text-left"
                    >
                      <div className="text-lg mb-1">{preset.icon}</div>
                      <div className="text-xs font-medium text-gray-900">
                        {isNepali ? preset.nameNp : preset.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {preset.time}min • ₹{preset.rate}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अपरेसन नाम' : 'Operation Name'} *
                </label>
                <input
                  type="text"
                  value={currentOperation.name}
                  onChange={(e) => {
                    setCurrentOperation(prev => ({ ...prev, name: e.target.value }));
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    validationErrors.name 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Shoulder Join"
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  {isNepali ? 'मेसिन प्रकार' : 'Machine Type'} *
                  <span className="ml-2 text-lg">{machineIcons[currentOperation.machineType]}</span>
                </label>
                <select
                  value={currentOperation.machineType}
                  onChange={(e) => setCurrentOperation(prev => ({ ...prev, machineType: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cutting">✂️ {isNepali ? 'काट्ने' : 'Cutting'}</option>
                  <option value="overlock">🔗 {isNepali ? 'ओभरलक' : 'Overlock'}</option>
                  <option value="flatlock">🪢 {isNepali ? 'फ्ल्यालक' : 'Flatlock'}</option>
                  <option value="singleNeedle">🪡 {isNepali ? 'एकल सुई' : 'Single Needle'}</option>
                  <option value="buttonhole">🔘 {isNepali ? 'बटनहोल' : 'Buttonhole'}</option>
                  <option value="iron">🔥 {isNepali ? 'इस्त्री' : 'Iron'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏱️ {isNepali ? 'समय (मिनेट)' : 'Time (minutes)'} *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={currentOperation.estimatedTime}
                  onChange={(e) => {
                    setCurrentOperation(prev => ({ ...prev, estimatedTime: e.target.value }));
                    if (validationErrors.estimatedTime) {
                      setValidationErrors(prev => ({ ...prev, estimatedTime: '' }));
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    validationErrors.estimatedTime 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="2.5"
                />
                {validationErrors.estimatedTime && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.estimatedTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 {isNepali ? 'दर (₹)' : 'Rate (₹)'} *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={currentOperation.rate}
                  onChange={(e) => {
                    setCurrentOperation(prev => ({ ...prev, rate: e.target.value }));
                    if (validationErrors.rate) {
                      setValidationErrors(prev => ({ ...prev, rate: '' }));
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    validationErrors.rate 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="3.5"
                />
                {validationErrors.rate && (
                  <p className="text-red-600 text-xs mt-1">{validationErrors.rate}</p>
                )}
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
                  <option value="easy">{isNepali ? 'सजिलो' : 'Easy'}</option>
                  <option value="medium">{isNepali ? 'मध्यम' : 'Medium'}</option>
                  <option value="hard">{isNepali ? 'कठिन' : 'Hard'}</option>
                </select>
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
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">📋</span>
                  {isNepali ? 'अपरेसन सूची' : 'Operations List'} 
                  <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {template.operations.length}
                  </span>
                </h2>
                <div className="text-sm text-gray-600">
                  ⏱️ {isNepali ? 'कुल समय:' : 'Total Time:'} {' '}
                  <span className="font-bold text-blue-600">
                    {template.operations.reduce((sum, op) => sum + op.estimatedTimePerPiece, 0).toFixed(1)} min
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {template.operations.map((operation, index) => (
                  <div 
                    key={operation.id} 
                    className="group relative bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    {/* Operation Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                            {operation.sequence}
                          </div>
                          <div className="absolute -bottom-1 -right-1 text-lg">
                            {machineIcons[operation.machineType] || operation.icon}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg">{operation.name}</h3>
                            <span className="text-lg">
                              {operation.workflowType === 'parallel' ? '🔄' : '➡️'}
                            </span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              operation.skillLevel === 'easy' ? 'bg-green-100 text-green-800' :
                              operation.skillLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              ⭐ {
                                operation.skillLevel === 'easy' ? (isNepali ? 'सजिलो' : 'Easy') :
                                operation.skillLevel === 'medium' ? (isNepali ? 'मध्यम' : 'Medium') :
                                operation.skillLevel === 'hard' ? (isNepali ? 'कठिन' : 'Hard') :
                                operation.skillLevel || 'medium'
                              }
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <span>{machineIcons[operation.machineType]}</span>
                              <span>{
                                operation.machineType === 'cutting' ? (isNepali ? 'काट्ने' : 'Cutting') :
                                operation.machineType === 'overlock' ? (isNepali ? 'ओभरलक' : 'Overlock') :
                                operation.machineType === 'flatlock' ? (isNepali ? 'फ्ल्यालक' : 'Flatlock') :
                                operation.machineType === 'singleNeedle' ? (isNepali ? 'एकल सुई' : 'Single Needle') :
                                operation.machineType === 'buttonhole' ? (isNepali ? 'बटनहोल' : 'Buttonhole') :
                                operation.machineType === 'iron' ? (isNepali ? 'इस्त्री' : 'Iron') :
                                operation.machineType
                              }</span>
                            </span>
                            
                            <span className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              <span>⏱️</span>
                              <span className="font-medium">{operation.estimatedTimePerPiece} min</span>
                            </span>
                            
                            <span className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded">
                              <span>💰</span>
                              <span className="font-medium">₹{operation.rate}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveOperation(operation.id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isNepali ? 'माथि सार्नुहोस्' : 'Move Up'}
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => moveOperation(operation.id, 'down')}
                          disabled={index === template.operations.length - 1}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isNepali ? 'तल सार्नुहोस्' : 'Move Down'}
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => removeOperation(operation.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg"
                          title={isNepali ? 'हटाउनुहोस्' : 'Remove'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Advanced Tracking Diagram */}
              <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200" data-tracking-diagram>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    🔍 {isNepali ? 'उत्पादन ट्र्याकिंग डायग्राम' : 'Production Tracking Diagram'}
                  </h3>
                  <button
                    onClick={() => setShowTrackingDiagram(!showTrackingDiagram)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    {showTrackingDiagram ? '🔽' : '🔼'} {isNepali ? 'विस्तार' : 'Expand'}
                  </button>
                </div>

                {/* Product Introduction */}
                <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="text-6xl mb-2">{getProductAvatar()}</div>
                      <div className="font-bold text-gray-900">{template.name || 'Product'}</div>
                      <div className="text-sm text-gray-600">{template.articleNumber || 'Article'}</div>
                    </div>
                    <div className="text-4xl text-indigo-500">➡️</div>
                    <div className="text-center bg-indigo-100 rounded-lg p-3">
                      <div className="text-2xl mb-1">🏭</div>
                      <div className="text-sm font-medium text-indigo-800">{isNepali ? 'उत्पादन लाइन' : 'Production Line'}</div>
                    </div>
                  </div>
                </div>

                {showTrackingDiagram && (
                  <div className="space-y-6">
                    {/* Enhanced Production Flow with Parallel/Sequential */}
                    <div className="space-y-6">
                      {groupOperationsByWorkflow().map((group, groupIndex) => (
                        <div key={groupIndex} className="relative">
                          {/* Group Header */}
                          <div className="flex items-center justify-center mb-4">
                            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${
                              group.isParallel 
                                ? 'bg-orange-100 text-orange-800 border-2 border-orange-300' 
                                : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                            }`}>
                              <span className="text-lg">{group.isParallel ? '🔄' : '➡️'}</span>
                              <span>
                                {group.isParallel 
                                  ? (isNepali ? `समानान्तर कार्य (${group.operations.length})` : `Parallel Operations (${group.operations.length})`)
                                  : (isNepali ? `क्रमिक कार्य (${group.operations.length})` : `Sequential Operations (${group.operations.length})`)
                                }
                              </span>
                            </div>
                          </div>

                          {/* Operations Container */}
                          <div className={`${
                            group.isParallel 
                              ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400 pl-4' 
                              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 pl-4'
                          } rounded-r-xl py-4`}>
                            
                            {group.isParallel ? (
                              /* Parallel Layout - Side by Side */
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {group.operations.map((operation, opIndex) => (
                                  <div key={operation.id} className="relative">
                                    {/* Parallel Operation Card */}
                                    <div className="bg-white rounded-xl p-4 shadow-md border-2 border-orange-200 hover:border-orange-400 transition-colors">
                                      <div className="flex flex-col space-y-3">
                                        {/* Header with sequence and workflow indicator */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                              {operation.sequence}
                                            </div>
                                            <span className="text-lg">🔄</span>
                                            <div className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
                                              {isNepali ? 'समानान्तर' : 'Parallel'}
                                            </div>
                                          </div>
                                          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                                        </div>

                                        {/* Product Flow */}
                                        <div className="flex items-center justify-center space-x-2">
                                          <div className="text-center">
                                            <div className="text-2xl">{getProductAvatar()}</div>
                                            <div className="text-xs text-gray-500">{isNepali ? 'उत्पादन' : 'Product'}</div>
                                          </div>
                                          <div className="text-lg text-orange-500">➡️</div>
                                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                                            <div className="flex items-center justify-center space-x-1 mb-1">
                                              <span className="text-xl">{machineAvatars[operation.machineType]?.machine}</span>
                                              <span className="text-xl">{machineAvatars[operation.machineType]?.worker}</span>
                                            </div>
                                            <div className="text-xs font-medium text-gray-700">
                                              {machineAvatars[operation.machineType]?.name}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Operation Details */}
                                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3">
                                          <h4 className="font-bold text-gray-900 mb-2">{operation.name}</h4>
                                          <div className="grid grid-cols-3 gap-1 text-xs">
                                            <div className="text-center bg-white rounded px-1 py-1">
                                              <div className="text-blue-600 font-bold">⏱️ {operation.estimatedTimePerPiece}min</div>
                                            </div>
                                            <div className="text-center bg-white rounded px-1 py-1">
                                              <div className="text-green-600 font-bold">💰 ₹{operation.rate}</div>
                                            </div>
                                            <div className="text-center bg-white rounded px-1 py-1">
                                              <div className={`font-bold text-xs ${
                                                operation.skillLevel === 'easy' ? 'text-green-600' :
                                                operation.skillLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                              }`}>
                                                ⭐ {
                                                  operation.skillLevel === 'easy' ? (isNepali ? 'सजिलो' : 'Easy') :
                                                  operation.skillLevel === 'medium' ? (isNepali ? 'मध्यम' : 'Med') :
                                                  operation.skillLevel === 'hard' ? (isNepali ? 'कठिन' : 'Hard') :
                                                  operation.skillLevel
                                                }
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* Sequential Layout - Vertical */
                              <div className="space-y-4">
                                {group.operations.map((operation, opIndex) => (
                                  <div key={operation.id} className="relative">
                                    {/* Sequential Operation Card */}
                                    <div className="bg-white rounded-xl p-4 shadow-md border-2 border-blue-200 hover:border-blue-400 transition-colors">
                                      <div className="flex items-center space-x-4">
                                        {/* Step Number with workflow indicator */}
                                        <div className="flex-shrink-0 flex flex-col items-center">
                                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                            {operation.sequence}
                                          </div>
                                          <div className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1">
                                            ➡️ {isNepali ? 'क्रम' : 'Seq'}
                                          </div>
                                        </div>

                                        {/* Product State */}
                                        <div className="flex-shrink-0 text-center">
                                          <div className="text-3xl mb-1">{getProductAvatar()}</div>
                                          <div className="text-xs text-gray-500">{isNepali ? 'उत्पादन' : 'Product'}</div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex-shrink-0 text-2xl text-blue-500">➡️</div>

                                        {/* Machine & Worker */}
                                        <div className="flex-shrink-0">
                                          <div className="bg-gray-50 rounded-lg p-3 text-center min-w-[120px]">
                                            <div className="flex items-center justify-center space-x-2 mb-2">
                                              <span className="text-2xl">{machineAvatars[operation.machineType]?.machine}</span>
                                              <span className="text-2xl">{machineAvatars[operation.machineType]?.worker}</span>
                                            </div>
                                            <div className="text-xs font-medium text-gray-700">
                                              {machineAvatars[operation.machineType]?.name}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex-shrink-0 text-2xl text-blue-500">➡️</div>

                                        {/* Operation Details */}
                                        <div className="flex-1">
                                          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3">
                                            <h4 className="font-bold text-gray-900 mb-2">{operation.name}</h4>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                              <div className="text-center bg-white rounded px-2 py-1">
                                                <div className="text-blue-600 font-bold">⏱️ {operation.estimatedTimePerPiece}min</div>
                                              </div>
                                              <div className="text-center bg-white rounded px-2 py-1">
                                                <div className="text-green-600 font-bold">💰 ₹{operation.rate}</div>
                                              </div>
                                              <div className="text-center bg-white rounded px-2 py-1">
                                                <div className={`font-bold ${
                                                  operation.skillLevel === 'easy' ? 'text-green-600' :
                                                  operation.skillLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                  ⭐ {
                                                    operation.skillLevel === 'easy' ? (isNepali ? 'सजिलो' : 'Easy') :
                                                    operation.skillLevel === 'medium' ? (isNepali ? 'मध्यम' : 'Medium') :
                                                    operation.skillLevel === 'hard' ? (isNepali ? 'कठिन' : 'Hard') :
                                                    operation.skillLevel
                                                  }
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Progress Indicator */}
                                        <div className="flex-shrink-0">
                                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                                            ✓
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Connection Line for Sequential */}
                                    {opIndex < group.operations.length - 1 && (
                                      <div className="flex justify-center mt-2 mb-2">
                                        <div className="w-1 h-8 bg-gradient-to-b from-blue-300 to-indigo-400 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Group Connection */}
                          {groupIndex < groupOperationsByWorkflow().length - 1 && (
                            <div className="flex justify-center mt-6 mb-6">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-12 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                                <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                  {isNepali ? 'अर्को चरण' : 'NEXT STAGE'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Final Product */}
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-6 text-center border-2 border-green-300">
                      <div className="flex items-center justify-center space-x-4">
                        <div>
                          <div className="text-6xl mb-2">✨{getProductAvatar()}✨</div>
                          <div className="font-bold text-xl text-gray-900 mb-1">
                            {isNepali ? 'पूर्ण उत्पादन' : 'Completed Product'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {isNepali ? `कुल समय: ${template.operations.reduce((sum, op) => sum + op.estimatedTimePerPiece, 0).toFixed(1)} मिनेट` 
                                       : `Total Time: ${template.operations.reduce((sum, op) => sum + op.estimatedTimePerPiece, 0).toFixed(1)} minutes`}
                          </div>
                          <div className="text-sm text-gray-600">
                            {isNepali ? `कुल लागत: ₹${template.operations.reduce((sum, op) => sum + op.rate, 0).toFixed(2)}` 
                                       : `Total Cost: ₹${template.operations.reduce((sum, op) => sum + op.rate, 0).toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Legend */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">
                        📖 {isNepali ? 'प्रतीक र कार्यप्रवाह व्याख्या' : 'Legend & Workflow Guide'}
                      </h4>
                      
                      {/* Basic Symbols */}
                      <div className="mb-6">
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                          🎯 {isNepali ? 'आधारभूत प्रतीकहरू' : 'Basic Symbols'}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getProductAvatar()}</span>
                            <span>{isNepali ? 'उत्पादन' : 'Product'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">👨‍🏭</span>
                            <span>{isNepali ? 'कामदार' : 'Worker'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🔗</span>
                            <span>{isNepali ? 'मेसिन' : 'Machine'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">⏱️</span>
                            <span>{isNepali ? 'समय' : 'Time'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">💰</span>
                            <span>{isNepali ? 'लागत' : 'Cost'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">⭐</span>
                            <span>{isNepali ? 'कौशल' : 'Skill'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Workflow Types */}
                      <div className="mb-6">
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                          🔄 {isNepali ? 'कार्यप्रवाह प्रकारहरू' : 'Workflow Types'}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Sequential Workflow */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                                <span>➡️</span>
                                <span>{isNepali ? 'क्रमिक' : 'Sequential'}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              {isNepali 
                                ? 'एक पछि अर्को कार्य। पहिलो पूरा नभएसम्म दोस्रो सुरु हुँदैन।'
                                : 'One after another. Next operation starts only after previous is complete.'
                              }
                            </p>
                            <div className="flex items-center space-x-2 text-xs">
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">1</div>
                              <span>➡️</span>
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">2</div>
                              <span>➡️</span>
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">3</div>
                            </div>
                          </div>

                          {/* Parallel Workflow */}
                          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                                <span>🔄</span>
                                <span>{isNepali ? 'समानान्तर' : 'Parallel'}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              {isNepali 
                                ? 'एकैसाथ धेरै कार्य। समय बचाउन मिल्छ तर फरक कामदार चाहिन्छ।'
                                : 'Multiple operations at same time. Saves time but requires different workers.'
                              }
                            </p>
                            <div className="flex items-center space-x-2 text-xs">
                              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center">2</div>
                              <div className="flex flex-col space-y-1">
                                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center">3</div>
                                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center">4</div>
                              </div>
                              <span>➡️</span>
                              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center">5</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stage Connections */}
                      <div>
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center">
                          🔗 {isNepali ? 'चरण जडानहरू' : 'Stage Connections'}
                        </h5>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-1 h-6 bg-blue-300 rounded-full"></div>
                            <span>{isNepali ? 'क्रमिक जडान' : 'Sequential Flow'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-6 bg-purple-500 rounded-full"></div>
                            <span>{isNepali ? 'चरण परिवर्तन' : 'Stage Transition'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                            <span>{isNepali ? 'पूर्ण' : 'Completed'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Template Summary */}
          {template.operations.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                📊 {isNepali ? 'टेम्प्लेट सारांश' : 'Template Summary'}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{template.operations.length}</div>
                  <div className="text-xs text-gray-600">{isNepali ? 'अपरेसनहरू' : 'Operations'}</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {template.operations.reduce((sum, op) => sum + op.estimatedTimePerPiece, 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600">{isNepali ? 'कुल मिनेट' : 'Total Minutes'}</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{template.operations.reduce((sum, op) => sum + op.rate, 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">{isNepali ? 'कुल दर' : 'Total Rate'}</div>
                </div>
                
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(template.operations.map(op => op.machineType)).size}
                  </div>
                  <div className="text-xs text-gray-600">{isNepali ? 'मेसिन प्रकार' : 'Machine Types'}</div>
                </div>
              </div>

              {/* Machine Type Distribution */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'मेसिन वितरण' : 'Machine Distribution'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    template.operations.reduce((acc, op) => {
                      acc[op.machineType] = (acc[op.machineType] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([machine, count]) => (
                    <span key={machine} className="bg-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      {machineIcons[machine]} <span className="ml-1">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
            >
              ❌ {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>

            <div className="flex gap-3">
              {template.operations.length > 0 && (
                <button
                  onClick={() => {
                    setShowTrackingDiagram(true);
                    setTimeout(() => {
                      const trackingElement = document.querySelector('[data-tracking-diagram]');
                      if (trackingElement) {
                        trackingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  🔍 {isNepali ? 'ट्र्याकिंग देख्नुहोस्' : 'View Tracking'}
                </button>
              )}

              <button
                onClick={createTemplate}
                disabled={!template.name || !template.articleNumber || template.operations.length === 0}
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 transform hover:scale-105 flex items-center justify-center font-bold shadow-lg"
              >
                💾 {editingTemplate 
                  ? (isNepali ? 'अपडेट गर्नुहोस्' : 'Update Template')
                  : (isNepali ? 'टेम्प्लेट बनाउनुहोस्' : 'Create Template')
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;