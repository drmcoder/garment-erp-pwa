import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import WIPManualEntry from './WIPManualEntry';
import LotProcessor from './LotProcessor';
import BundleManager from './BundleManager';
import WorkAssignmentBoard from './WorkAssignmentBoard';

const WIPImportSimplified = ({ onImport, onCancel }) => {
  const { currentLanguage } = useLanguage();
  
  const [currentView, setCurrentView] = useState('import'); // 'import', 'process', 'bundle', 'assign'
  const [wipData, setWipData] = useState(null);
  const [bundles, setBundles] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Workflow handlers
  const handleWIPDataImport = (data) => {
    setWipData(data);
    setCurrentView('process');
  };

  const handleBundlesCreated = (createdBundles) => {
    setBundles(createdBundles);
    setCurrentView('bundle');
  };

  const handleWorkItemsCreated = (workItemsList, template) => {
    setWorkItems(workItemsList);
    setSelectedTemplate(template);
    setCurrentView('assign');
  };

  const handleAssignmentComplete = (assignments) => {
    // Final step - assignments are complete
    setCurrentView('success');
    
    // Auto-close after showing success
    setTimeout(() => {
      if (onImport) {
        onImport({
          wipData,
          bundles,
          workItems,
          assignments,
          template: selectedTemplate
        });
      }
    }, 3000);
  };

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      
      {/* WIP Manual Entry */}
      {currentView === 'import' && (
        <WIPManualEntry 
          onImport={handleWIPDataImport}
          onCancel={onCancel}
        />
      )}

      {/* Lot Processing */}
      {currentView === 'process' && wipData && (
        <LotProcessor
          wipData={wipData}
          onBundlesCreated={handleBundlesCreated}
          onCancel={() => setCurrentView('import')}
        />
      )}

      {/* Bundle Management */}
      {currentView === 'bundle' && bundles.length > 0 && (
        <BundleManager
          bundles={bundles}
          wipData={wipData}
          onWorkItemsCreated={handleWorkItemsCreated}
          onCancel={() => setCurrentView('process')}
        />
      )}

      {/* Work Assignment */}
      {currentView === 'assign' && workItems.length > 0 && (
        <WorkAssignmentBoard
          workItems={workItems}
          onAssignmentComplete={handleAssignmentComplete}
          onCancel={() => setCurrentView('bundle')}
        />
      )}

      {/* Success/Congratulations Screen */}
      {currentView === 'success' && (
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
          <div className="text-center max-w-md mx-auto p-8">
            {/* Success Animation */}
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Confetti Effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-pulse">🎉</div>
              </div>
            </div>

            {/* Congratulations Message */}
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              {currentLanguage === 'np' ? '🎊 बधाई छ!' : '🎊 Congratulations!'}
            </h1>
            
            <p className="text-lg text-gray-700 mb-6">
              {currentLanguage === 'np' 
                ? 'WIP डेटा सफलतापूर्वक अपलोड र प्रसंस्करण भयो!'
                : 'WIP data successfully uploaded and processed!'
              }
            </p>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{bundles?.length || 0}</div>
                  <div className="text-sm text-gray-600">
                    {currentLanguage === 'np' ? 'बन्डलहरू' : 'Bundles'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{workItems?.length || 0}</div>
                  <div className="text-sm text-gray-600">
                    {currentLanguage === 'np' ? 'काम आइटमहरू' : 'Work Items'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {bundles?.reduce((sum, b) => sum + b.pieces, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentLanguage === 'np' ? 'कुल पिसहरू' : 'Total Pieces'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{selectedTemplate?.name ? '1' : '0'}</div>
                  <div className="text-sm text-gray-600">
                    {currentLanguage === 'np' ? 'टेम्प्लेट' : 'Template'}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-closing message */}
            <div className="text-sm text-gray-500 animate-pulse">
              {currentLanguage === 'np' 
                ? '३ सेकेन्डमा स्वचालित रूपमा बन्द हुनेछ...'
                : 'Auto-closing in 3 seconds...'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WIPImportSimplified;