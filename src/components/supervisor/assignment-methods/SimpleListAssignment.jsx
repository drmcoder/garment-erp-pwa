// src/components/supervisor/assignment-methods/SimpleListAssignment.jsx
// Simple, step-by-step work assignment method - perfect for tablets

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotifications } from '../../../context/NotificationContext';
import UniversalAvatar from '../../common/UniversalAvatar';

const SimpleListAssignment = ({ 
  operators, 
  availableBundles, 
  assignWork, 
  loading,
  isTablet 
}) => {
  const { user } = useAuth();
  const { isNepali } = useLanguage();
  const { showNotification } = useNotifications();

  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Work, 2: Select Operator, 3: Confirm
  const [filter, setFilter] = useState({
    machineType: 'all',
    priority: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('priority'); // 'priority', 'pieces', 'deadline'

  // Auto-advance steps
  useEffect(() => {
    if (currentStep === 1 && selectedBundle) {
      setCurrentStep(2);
    }
    if (currentStep === 2 && selectedOperator && selectedBundle) {
      setCurrentStep(3);
    }
  }, [selectedBundle, selectedOperator, currentStep]);

  // Filter and sort bundles
  const getFilteredBundles = () => {
    let filtered = availableBundles.filter(bundle => 
      bundle.status === 'ready' || bundle.status === 'pending'
    );

    // Apply filters
    if (filter.machineType !== 'all') {
      filtered = filtered.filter(bundle => 
        bundle.machineType?.toLowerCase().includes(filter.machineType.toLowerCase())
      );
    }

    if (filter.priority !== 'all') {
      filtered = filtered.filter(bundle => bundle.priority === filter.priority);
    }

    if (filter.search.trim()) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(bundle =>
        bundle.articleNumber?.toString().toLowerCase().includes(search) ||
        bundle.articleName?.toLowerCase().includes(search) ||
        bundle.color?.toLowerCase().includes(search) ||
        bundle.lotNumber?.toLowerCase().includes(search)
      );
    }

    // Sort bundles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        case 'pieces':
          return (b.pieces || 0) - (a.pieces || 0);
        case 'deadline':
          return new Date(a.deadline) - new Date(b.deadline);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Get compatible operators for selected bundle
  const getCompatibleOperators = () => {
    if (!selectedBundle) return operators;

    return operators.filter(op => {
      // Machine compatibility
      const opMachine = op.machineType || op.machine || op.speciality || '';
      const bundleMachine = selectedBundle.machineType || '';
      
      const isCompatible = 
        opMachine.toLowerCase().includes(bundleMachine.toLowerCase()) ||
        bundleMachine.toLowerCase().includes(opMachine.toLowerCase());

      // Workload check
      const currentWorkload = op.currentWorkload || 0;
      const maxWorkload = op.maxWorkload || 3;
      const hasCapacity = currentWorkload < maxWorkload;

      return isCompatible && hasCapacity && op.status !== 'offline';
    });
  };

  const handleAssign = async () => {
    if (!selectedBundle || !selectedOperator) return;

    try {
      const workData = {
        bundleId: selectedBundle.id,
        articleNumber: selectedBundle.articleNumber,
        operation: selectedBundle.operation || selectedBundle.operationName,
        pieces: selectedBundle.pieces || selectedBundle.quantity,
        machineType: selectedBundle.machineType,
        priority: selectedBundle.priority || 'medium'
      };

      const result = await assignWork(selectedOperator.id, workData);

      if (result.success) {
        showNotification(
          isNepali 
            ? `✅ ${selectedBundle.articleNumber} सफलतापूर्वक ${selectedOperator.name} लाई असाइन गरियो`
            : `✅ ${selectedBundle.articleNumber} successfully assigned to ${selectedOperator.name}`,
          'success'
        );

        // Reset for next assignment
        setSelectedBundle(null);
        setSelectedOperator(null);
        setCurrentStep(1);
      }
    } catch (error) {
      showNotification(
        isNepali ? `असाइनमेन्ट असफल: ${error.message}` : `Assignment failed: ${error.message}`,
        'error'
      );
    }
  };

  const resetSelection = () => {
    setSelectedBundle(null);
    setSelectedOperator(null);
    setCurrentStep(1);
  };

  const filteredBundles = getFilteredBundles();
  const compatibleOperators = getCompatibleOperators();

  return (
    <div className="p-6 space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            📋 {isNepali ? 'सरल असाइनमेन्ट' : 'Simple Assignment'}
          </h2>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 rounded ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Reset Button */}
          {currentStep > 1 && (
            <button
              onClick={resetSelection}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🔄 {isNepali ? 'रिसेट' : 'Reset'}
            </button>
          )}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
            {isNepali ? '1️⃣ काम छान्नुहोस्' : '1️⃣ Select Work'}
          </div>
          <div className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
            {isNepali ? '2️⃣ अपरेटर छान्नुहोस्' : '2️⃣ Select Operator'}
          </div>
          <div className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
            {isNepali ? '3️⃣ पुष्टि गर्नुहोस्' : '3️⃣ Confirm Assignment'}
          </div>
        </div>
      </div>

      {/* Step 1: Select Work */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔍 {isNepali ? 'काम खोज्नुहोस्' : 'Find Work'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'खोज्नुहोस्' : 'Search'}
                </label>
                <input
                  type="text"
                  placeholder={isNepali ? 'Article, रंग, Lot...' : 'Article, Color, Lot...'}
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'मेसिन' : 'Machine'}
                </label>
                <select
                  value={filter.machineType}
                  onChange={(e) => setFilter(prev => ({ ...prev, machineType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{isNepali ? 'सबै मेसिन' : 'All Machines'}</option>
                  <option value="overlock">Overlock</option>
                  <option value="flatlock">Flatlock</option>
                  <option value="single-needle">Single Needle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'प्राथमिकता' : 'Priority'}
                </label>
                <select
                  value={filter.priority}
                  onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{isNepali ? 'सबै' : 'All'}</option>
                  <option value="high">{isNepali ? 'उच्च' : 'High'}</option>
                  <option value="medium">{isNepali ? 'मध्यम' : 'Medium'}</option>
                  <option value="low">{isNepali ? 'न्यून' : 'Low'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'क्रमबद्ध' : 'Sort By'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="priority">{isNepali ? 'प्राथमिकता' : 'Priority'}</option>
                  <option value="pieces">{isNepali ? 'टुक्राहरू' : 'Pieces'}</option>
                  <option value="deadline">{isNepali ? 'समयसीमा' : 'Deadline'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Work List */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                📦 {isNepali ? 'उपलब्ध काम' : 'Available Work'}
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {filteredBundles.length} {isNepali ? 'काम' : 'items'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBundles.map(bundle => (
                <div
                  key={bundle.id}
                  onClick={() => setSelectedBundle(bundle)}
                  className={`p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                    selectedBundle?.id === bundle.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      #{bundle.articleNumber}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      bundle.priority === 'high' ? 'bg-red-100 text-red-800' :
                      bundle.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {bundle.priority?.toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {bundle.articleName || `Article ${bundle.articleNumber}`}
                      </h4>
                      <p className="text-sm text-gray-600">
                        📦 {bundle.lotNumber || 'N/A'} • 🎨 {bundle.color || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Operation</div>
                      <div className="font-medium">{bundle.operation || 'Sewing'}</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                        {bundle.pieces || 0} {isNepali ? 'पिस' : 'pcs'}
                      </div>
                      <div className="text-sm text-gray-600">
                        ⚙️ {bundle.machineType}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredBundles.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isNepali ? 'कुनै काम भेटिएन' : 'No work found'}
                </h3>
                <p className="text-gray-600">
                  {isNepali ? 'फिल्टर परिवर्तन गर्नुहोस्' : 'Try adjusting your filters'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Operator */}
      {currentStep === 2 && selectedBundle && (
        <div className="space-y-6">
          {/* Selected Work Summary */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              ✓ {isNepali ? 'चयनित काम' : 'Selected Work'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-500">Article</div>
                <div className="font-bold">#{selectedBundle.articleNumber}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-500">Operation</div>
                <div className="font-medium">{selectedBundle.operation || 'Sewing'}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-500">Machine</div>
                <div className="font-medium">⚙️ {selectedBundle.machineType}</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-500">Pieces</div>
                <div className="font-bold text-red-600">{selectedBundle.pieces || 0}</div>
              </div>
            </div>
          </div>

          {/* Compatible Operators */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              👥 {isNepali ? 'उपयुक्त अपरेटर' : 'Compatible Operators'} ({compatibleOperators.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compatibleOperators.map(operator => (
                <div
                  key={operator.id}
                  onClick={() => setSelectedOperator(operator)}
                  className={`p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                    selectedOperator?.id === operator.id
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Operator Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <UniversalAvatar
                      user={operator}
                      size="lg"
                      showStatus={true}
                      style="unique"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{operator.name}</h4>
                      <p className="text-sm text-gray-600">
                        🏭 {operator.machineType || operator.speciality}
                      </p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 p-2 rounded-lg text-center">
                      <div className="font-bold text-blue-700">{operator.efficiency || 85}%</div>
                      <div className="text-xs text-blue-600">{isNepali ? 'दक्षता' : 'Efficiency'}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg text-center">
                      <div className="font-bold text-green-700">{operator.qualityScore || 95}%</div>
                      <div className="text-xs text-green-600">{isNepali ? 'गुणस्तर' : 'Quality'}</div>
                    </div>
                  </div>

                  {/* Status & Workload */}
                  <div className="space-y-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium text-center ${
                      operator.status === 'available' ? 'bg-green-100 text-green-800' :
                      operator.status === 'working' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {operator.status === 'available' ? (isNepali ? '✓ उपलब्ध' : '✓ Available') :
                       operator.status === 'working' ? (isNepali ? '🔄 काममा' : '🔄 Working') :
                       (isNepali ? '⏸️ विश्राम' : '⏸️ Break')}
                    </div>

                    <div className="bg-purple-50 p-2 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-600">{isNepali ? 'कार्यभार' : 'Workload'}</span>
                        <span className="font-bold text-purple-700">
                          {operator.currentWorkload || 0}/{operator.maxWorkload || 3}
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((operator.currentWorkload || 0) / (operator.maxWorkload || 3)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {compatibleOperators.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isNepali ? 'कुनै उपयुक्त अपरेटर छैन' : 'No compatible operators'}
                </h3>
                <p className="text-gray-600">
                  {isNepali ? 'अर्को काम छान्नुहोस्' : 'Try selecting different work'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && selectedBundle && selectedOperator && (
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            ✅ {isNepali ? 'असाइनमेन्ट पुष्टि गर्नुहोस्' : 'Confirm Assignment'}
          </h3>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Work Details */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-blue-900 mb-4">
                  📦 {isNepali ? 'काम विवरण' : 'Work Details'}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Article:</span>
                    <span className="font-bold">#{selectedBundle.articleNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operation:</span>
                    <span className="font-medium">{selectedBundle.operation || 'Sewing'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Machine:</span>
                    <span className="font-medium">⚙️ {selectedBundle.machineType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pieces:</span>
                    <span className="font-bold text-red-600">{selectedBundle.pieces || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedBundle.priority === 'high' ? 'bg-red-100 text-red-800' :
                      selectedBundle.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedBundle.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operator Details */}
              <div className="bg-green-50 p-6 rounded-2xl">
                <h4 className="text-lg font-bold text-green-900 mb-4">
                  👤 {isNepali ? 'अपरेटर विवरण' : 'Operator Details'}
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Name:</span>
                    <div className="flex items-center space-x-2">
                      <UniversalAvatar user={selectedOperator} size="sm" />
                      <span className="font-bold">{selectedOperator.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Machine:</span>
                    <span className="font-medium">🏭 {selectedOperator.machineType || selectedOperator.speciality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Efficiency:</span>
                    <span className="font-bold text-blue-600">{selectedOperator.efficiency || 85}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-bold text-green-600">{selectedOperator.qualityScore || 95}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Workload:</span>
                    <span className="font-bold text-purple-600">
                      {selectedOperator.currentWorkload || 0}/{selectedOperator.maxWorkload || 3}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-6 mt-8">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-8 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-medium"
              >
                ← {isNepali ? 'पछाडि' : 'Back'}
              </button>
              
              <button
                onClick={handleAssign}
                disabled={loading}
                className="px-12 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold text-lg shadow-lg"
              >
                {loading ? '🔄' : '✅'} {isNepali ? 'असाइन गर्नुहोस्' : 'Assign Work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleListAssignment;