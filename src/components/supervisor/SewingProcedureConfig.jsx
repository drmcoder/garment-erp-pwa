import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, getDocs } from '../../config/firebase';
import { COLLECTIONS } from '../../config/firebase';

const SewingProcedureConfig = ({ onSave, onCancel, selectedArticle }) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [procedureWorkflow, setProcedureWorkflow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const loadCustomTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const templatesSnapshot = await getDocs(collection(db, COLLECTIONS.ARTICLE_TEMPLATES));
      const templates = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        customTemplate: true
      }));
      
      console.log('📋 Loaded custom templates:', templates);
      setCustomTemplates(templates);
      
      // Auto-select first template if no article specified  
      if (templates.length > 0 && !selectedArticle) {
        setSelectedTemplate(templates[0]);
        setProcedureWorkflow(templates[0].operations || []);
      }
    } catch (error) {
      console.error('❌ Failed to load custom templates:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedArticle]);

  // Load available custom templates from Firestore
  useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  const handleTemplateSelection = (template) => {
    setSelectedTemplate(template);
    
    // Set the operations from the custom template
    const operations = template.operations || [];
    setProcedureWorkflow(operations);
    console.log(`📋 Selected template "${template.name}" with ${operations.length} operations`);
  };

  const handleSaveProcedure = () => {
    const configData = {
      template: selectedTemplate,
      workflow: procedureWorkflow,
      article: selectedArticle,
      configuredAt: new Date().toISOString(),
      totalOperations: procedureWorkflow.length,
      estimatedTotalTime: procedureWorkflow.reduce((sum, op) => sum + (op.time || op.estimatedTime || 0), 0)
    };

    onSave(configData);
  };

  const getWorkflowTypeColor = (workflowType) => {
    switch (workflowType) {
      case 'sequential': return 'bg-blue-100 text-blue-800';
      case 'parallel': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMachineIcon = (machine) => {
    const icons = {
      'overlock': '🔗',
      'single-needle': '🪡', 
      'buttonhole': '🔘',
      'flatlock': '📎',
      'embroidery': '🎨',
      'buttonAttach': '🔳',
      'iron': '🔥',
      'manual': '👤'
    };
    return icons[machine] || '⚙️';
  };

  const groupOperationsByWorkflow = () => {
    const sequential = procedureWorkflow.filter(op => op.workflowType === 'sequential');
    const parallel = procedureWorkflow.filter(op => op.workflowType === 'parallel');
    
    // Group parallel operations by parallelGroup
    const parallelGroups = {};
    parallel.forEach(op => {
      const group = op.parallelGroup || 'default';
      if (!parallelGroups[group]) parallelGroups[group] = [];
      parallelGroups[group].push(op);
    });

    return { sequential, parallelGroups };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isNepali ? 'प्रक्रिया टेम्प्लेटहरू लोड गर्दै...' : 'Loading Process Templates...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-3">🧵</span>
                {isNepali ? 'सिलाई प्रक्रिया कन्फिगरेसन' : 'Sewing Procedure Configuration'}
              </h2>
              <p className="text-blue-100 mt-1">
                {isNepali ? 'प्रक्रिया टेम्प्लेट छान्नुहोस् (वैकल्पिक)' : 'Select Production Process Template (Optional)'}
              </p>
              {selectedArticle && (
                <div className="text-blue-200 text-sm mt-2">
                  📦 {isNepali ? 'आर्टिकल:' : 'Article:'} {selectedArticle}
                </div>
              )}
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-30 transition-all duration-200"
              title={isNepali ? 'बन्द गर्नुहोस्' : 'Close'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area - with proper scrolling */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Process Template Selection */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📋</span>
                {isNepali ? 'प्रक्रिया टेम्प्लेटहरू' : 'Process Templates'}
              </h3>
              
              <div className="space-y-3">
                {customTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-600 text-sm">
                      {isNepali ? 'कुनै कस्टम टेम्प्लेट उपलब्ध छैन' : 'No custom templates available'}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {isNepali ? 'पहिले Template Builder बाट टेम्प्लेट बनाउनुहोस्' : 'Create templates first using Template Builder'}
                    </p>
                  </div>
                ) : (
                  customTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelection(template)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {template.operations?.length || 0} {isNepali ? 'अपरेशनहरू' : 'operations'}
                          </p>
                          {template.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <div className="text-2xl">
                          🏗️
                        </div>
                      </div>

                      {selectedTemplate?.id === template.id && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-xs text-blue-600">
                            ✅ {isNepali ? 'चयन गरिएको' : 'Selected'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Workflow Preview */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {selectedTemplate ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {procedureWorkflow.length} {isNepali ? 'अपरेशनहरू' : 'operations'} • 
                        {Math.round(procedureWorkflow.reduce((sum, op) => sum + (op.time || op.estimatedTime || 0), 0))} {isNepali ? 'मिनेट' : 'minutes'}
                      </p>
                      {selectedTemplate.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedTemplate.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {previewMode ? '📋 List' : '🔄 Flow'}
                      </button>
                    </div>
                  </div>

                  {previewMode ? (
                    /* Flow Diagram View */
                    <div className="space-y-6">
                      {(() => {
                        const { sequential, parallelGroups } = groupOperationsByWorkflow();
                        return (
                          <div className="space-y-8">
                            {sequential.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                                  <span className="mr-2">➡️</span>
                                  {isNepali ? 'क्रमिक अपरेशनहरू' : 'Sequential Operations'}
                                </h4>
                                <div className="flex flex-wrap items-center gap-4">
                                  {sequential
                                    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                                    .map((op, index) => (
                                      <React.Fragment key={op.operation}>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center min-w-[120px]">
                                          <div className="text-2xl mb-1">{getMachineIcon(op.machine)}</div>
                                          <div className="text-sm font-medium text-gray-800">{op.operation}</div>
                                          <div className="text-xs text-gray-600">{op.estimatedTime}min</div>
                                        </div>
                                        {index < sequential.length - 1 && (
                                          <div className="text-blue-400">→</div>
                                        )}
                                      </React.Fragment>
                                    ))}
                                </div>
                              </div>
                            )}

                            {Object.keys(parallelGroups).map(groupName => (
                              <div key={groupName}>
                                <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                                  <span className="mr-2">🔀</span>
                                  {isNepali ? 'समानान्तर अपरेशनहरू' : 'Parallel Operations'} 
                                  {groupName !== 'default' && ` - ${groupName}`}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {parallelGroups[groupName].map((op) => (
                                    <div key={op.operation} className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                      <div className="text-2xl mb-1">{getMachineIcon(op.machine)}</div>
                                      <div className="text-sm font-medium text-gray-800">{op.operation}</div>
                                      <div className="text-xs text-gray-600">{op.estimatedTime}min</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-4">
                      {procedureWorkflow
                        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                        .map((operation, index) => (
                        <div key={operation.operation || operation.name || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="text-2xl">{getMachineIcon(operation.machine)}</div>
                              <div>
                                <h4 className="font-semibold text-gray-900 capitalize">
                                  {operation.operation?.replace(/_/g, ' ') || operation.name || 'Unknown Operation'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {operation.machine} • {operation.estimatedTime} {isNepali ? 'मिनेट' : 'minutes'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkflowTypeColor(operation.workflowType)}`}>
                                {operation.workflowType || 'sequential'}
                              </span>
                              {operation.parallelGroup && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                  {operation.parallelGroup}
                                </span>
                              )}
                            </div>
                          </div>

                          {operation.dependencies && operation.dependencies.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Dependencies:</span> {operation.dependencies.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {isNepali ? 'प्रक्रिया टेम्प्लेट छान्नुहोस्' : 'Select a Process Template'}
                  </h3>
                  <p className="text-gray-600">
                    {isNepali 
                      ? 'बाईं तिरबाट गार्मेन्ट प्रकार छान्नुहोस्'
                      : 'Choose a garment type from the left panel'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedTemplate && (
                <>
                  {isNepali ? 'चयन गरिएको टेम्प्लेट:' : 'Selected Template:'} 
                  <span className="font-medium ml-1">
                    {selectedTemplate.name}
                  </span>
                </>
              )}
            </div>
            
          </div>
        </div>
        
        {/* Fixed Footer with Submit Button */}
        <div className="border-t border-gray-200 p-4 flex justify-end bg-gray-50 flex-shrink-0">
          <button
            onClick={handleSaveProcedure}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <span>💾</span>
            <span>{isNepali ? 'प्रक्रिया सेट गर्नुहोस्' : 'Set Procedure'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SewingProcedureConfig;