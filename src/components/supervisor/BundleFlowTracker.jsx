import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, getDocs, query, orderBy, COLLECTIONS } from '../../config/firebase';
import { WIPService } from '../../services/firebase-services';
import BundleWorkflowCards from '../common/BundleWorkflowCards';

const BundleFlowTracker = ({ onBundleUpdate, onClose }) => {
  const { currentLanguage, t } = useLanguage();
  const [bundles, setBundles] = useState([]);
  const [filteredBundles, setFilteredBundles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [transferMode, setTransferMode] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'workflow'

  // Load work items from WIP instead of old bundles
  useEffect(() => {
    const loadBundles = async () => {
      try {
        console.log('🔄 Loading work items from WIP for Bundle Flow Tracker...');
        
        // Load work items from WIP (this is where real data is)
        const wipWorkItemsResult = await WIPService.getWorkItemsFromWIP();
        
        if (wipWorkItemsResult.success && wipWorkItemsResult.workItems.length > 0) {
          // Convert work items to bundle format for display
          const workItemsAsBundles = wipWorkItemsResult.workItems.map(workItem => ({
            id: workItem.id,
            bundleNumber: workItem.bundleNumber || workItem.lotNumber || `WI-${workItem.id?.slice(-4)}`,
            article: workItem.articleNumber || workItem.article,
            articleName: workItem.styleName || `Article ${workItem.articleNumber}`,
            color: workItem.colorName || workItem.color || 'N/A',
            size: workItem.size || 'N/A',
            quantity: workItem.pieces || workItem.quantity || 0,
            operation: workItem.currentOperation || 'सिलाई',
            machineType: workItem.machineType || 'single-needle',
            status: workItem.status || 'pending',
            priority: workItem.priority || 'medium',
            assignedOperator: workItem.assignedOperator,
            createdAt: workItem.createdAt,
            wipEntryId: workItem.wipEntryId,
            rollNumber: workItem.rollNumber
          }));
          
          console.log('✅ Loaded work items as bundles:', workItemsAsBundles.length);
          setBundles(workItemsAsBundles);
        } else {
          console.log('ℹ️ No work items from WIP found, Bundle Flow Tracker empty');
          setBundles([]);
        }
      } catch (error) {
        console.error('❌ Failed to load work items for Bundle Flow Tracker:', error);
        setBundles([]);
      }
    };

    loadBundles();
    
    // Auto-refresh every 30 seconds to catch new WIP work items
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing Bundle Flow Tracker...');
      loadBundles();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter bundles based on search and filters
  useEffect(() => {
    let filtered = bundles;

    if (searchTerm) {
      filtered = filtered.filter(bundle =>
        bundle.bundleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bundle.article.includes(searchTerm) ||
        bundle.color.includes(searchTerm) ||
        bundle.operation.includes(searchTerm) ||
        bundle.operator?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bundle => bundle.status === statusFilter);
    }

    if (operationFilter !== 'all') {
      filtered = filtered.filter(bundle => bundle.operation === operationFilter);
    }

    setFilteredBundles(filtered);
  }, [bundles, searchTerm, statusFilter, operationFilter]);

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-700',
      'ready': 'bg-blue-100 text-blue-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-green-100 text-green-700',
      'on_hold': 'bg-orange-100 text-orange-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getQCStatusColor = (qcStatus) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-600',
      'passed': 'bg-green-100 text-green-700',
      'failed': 'bg-red-100 text-red-700',
      'rework': 'bg-orange-100 text-orange-700'
    };
    return colors[qcStatus] || 'bg-gray-100 text-gray-600';
  };

  const handleTransferBundle = (bundle, newOperator) => {
    setBundles(prev => prev.map(b =>
      b.id === bundle.id
        ? { ...b, operator: newOperator, status: 'in_progress', startTime: new Date().toISOString() }
        : b
    ));
  };

  const handleSplitBundle = (bundle, splitSizes) => {
    const totalSplitPieces = splitSizes.reduce((sum, size) => sum + size, 0);
    if (totalSplitPieces !== bundle.pieces) {
      alert('Split pieces must equal original bundle size');
      return;
    }

    const newBundles = splitSizes.map((size, index) => ({
      ...bundle,
      id: `${bundle.id}-split-${index + 1}`,
      bundleNumber: `${bundle.bundleNumber}-${String.fromCharCode(65 + index)}`,
      pieces: size,
      status: 'pending'
    }));

    setBundles(prev => [
      ...prev.filter(b => b.id !== bundle.id),
      ...newBundles
    ]);
  };

  const handleMergeBundles = (bundlesToMerge) => {
    if (bundlesToMerge.length < 2) return;

    const firstBundle = bundlesToMerge[0];
    const totalPieces = bundlesToMerge.reduce((sum, bundle) => sum + bundle.pieces, 0);
    
    const mergedBundle = {
      ...firstBundle,
      id: `${firstBundle.id}-merged`,
      bundleNumber: `${firstBundle.bundleNumber}-MERGED`,
      pieces: totalPieces,
      status: 'pending'
    };

    setBundles(prev => [
      ...prev.filter(b => !bundlesToMerge.find(merge => merge.id === b.id)),
      mergedBundle
    ]);
  };

  const operations = [...new Set(bundles.map(b => b.operation))];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                🔄 {currentLanguage === 'np' ? 'बन्डल फ्लो ट्र्याकर' : 'Bundle Flow Tracker'}
              </h2>
              <p className="text-indigo-200 mt-1">
                {currentLanguage === 'np' ? 'सिलाई प्रक्रियाहरू बीच बन्डल ट्र्याकिङ र व्यवस्थापन' : 'Track and manage bundles between sewing operations'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-white hover:text-indigo-200'
                  }`}
                >
                  📋 {currentLanguage === 'np' ? 'सूची' : 'List'}
                </button>
                <button
                  onClick={() => setViewMode('workflow')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'workflow'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-white hover:text-indigo-200'
                  }`}
                >
                  🔄 {currentLanguage === 'np' ? 'वर्कफ्लो' : 'Workflow'}
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="text-white hover:text-indigo-200 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-full">
          {/* Sidebar - Filters & Actions */}
          <div className="w-80 bg-gray-50 border-r p-4 overflow-y-auto">
            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'खोज्नुहोस्' : 'Search'}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder={currentLanguage === 'np' ? 'बन्डल, रङ, अपरेसन...' : 'Bundle, color, operation...'}
              />
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'स्थिति फिल्टर' : 'Status Filter'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{currentLanguage === 'np' ? 'सबै' : 'All'}</option>
                <option value="pending">{currentLanguage === 'np' ? 'बाँकी' : 'Pending'}</option>
                <option value="ready">{currentLanguage === 'np' ? 'तयार' : 'Ready'}</option>
                <option value="in_progress">{currentLanguage === 'np' ? 'चलिरहेको' : 'In Progress'}</option>
                <option value="completed">{currentLanguage === 'np' ? 'सम्पन्न' : 'Completed'}</option>
                <option value="on_hold">{currentLanguage === 'np' ? 'रोकिएको' : 'On Hold'}</option>
                <option value="rejected">{currentLanguage === 'np' ? 'अस्वीकृत' : 'Rejected'}</option>
              </select>
            </div>

            {/* Operation Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'अपरेसन फिल्टर' : 'Operation Filter'}
              </label>
              <select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">{currentLanguage === 'np' ? 'सबै अपरेसन' : 'All Operations'}</option>
                {operations.map(operation => (
                  <option key={operation} value={operation}>{operation}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setTransferMode(!transferMode)}
                className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
                  transferMode ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                }`}
              >
                🔄 {currentLanguage === 'np' ? 'ट्रान्सफर मोड' : 'Transfer Mode'}
              </button>
              
              <button
                onClick={() => setSplitMode(!splitMode)}
                className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
                  splitMode ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                }`}
              >
                ✂️ {currentLanguage === 'np' ? 'स्प्लिट मोड' : 'Split Mode'}
              </button>
              
              <button
                onClick={() => setMergeMode(!mergeMode)}
                className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
                  mergeMode ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
                }`}
              >
                🔗 {currentLanguage === 'np' ? 'मर्ज मोड' : 'Merge Mode'}
              </button>
            </div>

            {/* Selected Bundles Counter */}
            {selectedBundles.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  {currentLanguage === 'np' ? 'छानिएका बन्डलहरू:' : 'Selected bundles:'} {selectedBundles.length}
                </p>
                <button
                  onClick={() => setSelectedBundles([])}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  {currentLanguage === 'np' ? 'सफा गर्नुहोस्' : 'Clear selection'}
                </button>
              </div>
            )}
          </div>

          {/* Main Content - Bundle List */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              {viewMode === 'list' ? (
                /* Bundle Grid - List View */
                <div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedBundles.find(b => b.id === bundle.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      if (mergeMode) {
                        const exists = selectedBundles.find(b => b.id === bundle.id);
                        if (exists) {
                          setSelectedBundles(prev => prev.filter(b => b.id !== bundle.id));
                        } else {
                          setSelectedBundles(prev => [...prev, bundle]);
                        }
                      } else {
                        setSelectedBundle(bundle);
                      }
                    }}
                  >
                    {/* Bundle Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{bundle.bundleNumber}</span>
                        <span className="text-sm text-gray-500">#{bundle.operationStep}</span>
                      </div>
                      <div className="flex space-x-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bundle.status)}`}>
                          {bundle.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getQCStatusColor(bundle.qcStatus)}`}>
                          QC: {bundle.qcStatus}
                        </span>
                      </div>
                    </div>

                    {/* Bundle Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'लेख:' : 'Article:'}</span>
                        <span className="font-medium">{bundle.article}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'रङ/साइज:' : 'Color/Size:'}</span>
                        <span className="font-medium">{bundle.color} / {bundle.size}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'टुक्राहरू:' : 'Pieces:'}</span>
                        <span className="font-medium text-blue-600">{bundle.pieces}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">{currentLanguage === 'np' ? 'अपरेसन:' : 'Operation:'}</span>
                        <span className="font-medium">{bundle.operation}</span>
                      </div>
                      
                      {bundle.operator && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentLanguage === 'np' ? 'अपरेटर:' : 'Operator:'}</span>
                          <span className="font-medium text-green-600">{bundle.operator}</span>
                        </div>
                      )}
                      
                      {bundle.defects > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{currentLanguage === 'np' ? 'दोष:' : 'Defects:'}</span>
                          <span className="font-medium text-red-600">{bundle.defects}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex space-x-2">
                      {bundle.status === 'ready' && (
                        <button className="flex-1 bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600">
                          {currentLanguage === 'np' ? 'सुरु गर्नुहोस्' : 'Start'}
                        </button>
                      )}
                      
                      {bundle.status === 'in_progress' && (
                        <button className="flex-1 bg-green-500 text-white text-xs py-1 px-2 rounded hover:bg-green-600">
                          {currentLanguage === 'np' ? 'पूरा गर्नुहोस्' : 'Complete'}
                        </button>
                      )}
                      
                      {bundle.status === 'completed' && bundle.qcStatus === 'pending' && (
                        <button className="flex-1 bg-yellow-500 text-white text-xs py-1 px-2 rounded hover:bg-yellow-600">
                          {currentLanguage === 'np' ? 'QC गर्नुहोस्' : 'QC Check'}
                        </button>
                      )}
                      
                      <button className="text-gray-500 hover:text-gray-700 text-xs py-1 px-2">
                        📊 {currentLanguage === 'np' ? 'विवरण' : 'Details'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredBundles.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {currentLanguage === 'np' ? 'कुनै बन्डल फेला परेन' : 'No bundles found'}
                  </h3>
                  <p className="text-gray-500">
                    {currentLanguage === 'np' ? 'फिल्टर परिवर्तन गर्नुहोस् वा नयाँ WIP आयात गर्नुहोस्' : 'Try changing filters or import new WIP data'}
                  </p>
                </div>
              )}
            </div>
              ) : (
                /* High-Density Workflow Cards View */
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {filteredBundles.length > 0 ? (
                    filteredBundles.map((bundle) => {
                      // Load workflow steps from bundle data - no mock data
                      const workflowSteps = bundle.workItems || [];

                      return (
                        <BundleWorkflowCards
                          key={bundle.id}
                          bundle={{
                            bundleId: bundle.bundleNumber || bundle.id,
                            articleNumber: bundle.article,
                            color: bundle.color,
                            size: bundle.size,
                            pieces: bundle.pieces
                          }}
                          workItems={workflowSteps}
                          onOperationClick={(operation) => {
                            setSelectedBundle(bundle);
                          }}
                          onStatusUpdate={(operationId, newStatus) => {
                            // Update bundle status and relevant fields
                            setBundles(prev => prev.map(b => {
                              if (b.id === bundle.id) {
                                const updates = { status: newStatus };
                                
                                // Set timestamps based on status
                                if (newStatus === 'in_progress') {
                                  updates.startTime = new Date().toISOString();
                                  updates.estimatedCompletion = new Date(Date.now() + 30 * 60 * 1000).toISOString();
                                } else if (newStatus === 'completed') {
                                  updates.actualCompletion = new Date().toISOString();
                                  updates.qcStatus = 'pending';
                                }
                                
                                return { ...b, ...updates };
                              }
                              return b;
                            }));
                            
                            if (onBundleUpdate) {
                              onBundleUpdate(bundle.id, newStatus);
                            }
                          }}
                          showProgress={true}
                          compact={true}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🔄</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {currentLanguage === 'np' ? 'कुनै बन्डल फेला परेन' : 'No bundles found'}
                      </h3>
                      <p className="text-gray-500">
                        {currentLanguage === 'np' ? 'फिल्टर परिवर्तन गर्नुहोस् वा नयाँ WIP आयात गर्नुहोस्' : 'Try changing filters or import new WIP data'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Merge Action Button */}
        {mergeMode && selectedBundles.length >= 2 && (
          <div className="absolute bottom-6 right-6">
            <button
              onClick={() => {
                handleMergeBundles(selectedBundles);
                setSelectedBundles([]);
                setMergeMode(false);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 shadow-lg"
            >
              🔗 {currentLanguage === 'np' ? `${selectedBundles.length} बन्डल मर्ज गर्नुहोस्` : `Merge ${selectedBundles.length} bundles`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleFlowTracker;