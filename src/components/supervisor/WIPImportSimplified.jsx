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
    if (onImport) {
      onImport({
        wipData,
        bundles,
        workItems,
        assignments,
        template: selectedTemplate
      });
    }
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
    </div>
  );
};

export default WIPImportSimplified;