// src/components/supervisor/TabletWorkAssignment.jsx
// Tablet-optimized work assignment interface for supervisors

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  useUsers,
  useWorkManagement,
  useSupervisorData 
} from '../../hooks/useAppData';
import OperatorAvatar from '../common/OperatorAvatar';

const TabletWorkAssignment = () => {
  const { user } = useAuth();
  const { isNepali, formatCurrency } = useLanguage();
  const { showNotification } = useNotifications();
  
  // Use centralized data hooks
  const { allUsers, loading: usersLoading } = useUsers();
  const { bundles, assignWork, loading: workLoading } = useWorkManagement();
  
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [step, setStep] = useState(1); // 1: Select Work, 2: Select Operator, 3: Confirm
  const [filter, setFilter] = useState({ machineType: 'all', priority: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const loading = usersLoading || workLoading;
  
  // Derive data
  const operators = allUsers?.filter(user => user.role === 'operator') || [];
  const availableBundles = bundles || [];
  
  // Filter functions
  const getFilteredBundles = () => {
    let filtered = availableBundles.filter(bundle => 
      bundle.status === 'ready' || bundle.status === 'pending'
    );
    
    if (filter.machineType !== 'all') {
      filtered = filtered.filter(bundle => bundle.machineType === filter.machineType);
    }
    
    if (filter.priority !== 'all') {
      filtered = filtered.filter(bundle => bundle.priority === filter.priority);
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(bundle => 
        bundle.articleNumber?.toString().toLowerCase().includes(search) ||
        bundle.articleName?.toLowerCase().includes(search) ||
        bundle.color?.toLowerCase().includes(search)
      );
    }
    
    return filtered.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    });
  };

  const getCompatibleOperators = () => {
    if (!selectedBundle) return operators;
    
    return operators.filter(op => {
      // Check machine compatibility
      const opMachine = op.machineType || op.machine || op.speciality;
      const bundleMachine = selectedBundle.machineType;
      
      // Simple compatibility check
      if (opMachine?.toLowerCase().includes(bundleMachine?.toLowerCase()) ||
          bundleMachine?.toLowerCase().includes(opMachine?.toLowerCase())) {
        return true;
      }
      
      // Check workload
      const currentWorkload = op.currentWorkload || 0;
      const maxWorkload = op.maxWorkload || 3;
      
      return currentWorkload < maxWorkload;
    });
  };

  const handleAssign = async () => {
    if (!selectedBundle || !selectedOperator) {
      showNotification(
        isNepali ? 'कृपया काम र अपरेटर दुवै छान्नुहोस्' : 'Please select both work and operator',
        'warning'
      );
      return;
    }

    try {
      const workData = {
        bundleId: selectedBundle.id,
        articleNumber: selectedBundle.articleNumber,
        operation: selectedBundle.operation || selectedBundle.operationName,
        pieces: selectedBundle.pieces || selectedBundle.quantity,
        machineType: selectedBundle.machineType,
        priority: selectedBundle.priority || 'medium',
        rate: 0 // Hide payment rates as per business rule
      };
      
      const result = await assignWork(selectedOperator.id, workData);
      
      if (result.success) {
        showNotification(
          isNepali 
            ? `✅ ${selectedBundle.articleNumber} सफलतापूर्वक ${selectedOperator.name} लाई असाइन गरियो`
            : `✅ ${selectedBundle.articleNumber} successfully assigned to ${selectedOperator.name}`,
          'success'
        );
        
        // Reset form
        setSelectedBundle(null);
        setSelectedOperator(null);
        setStep(1);
      }
    } catch (error) {
      showNotification(
        isNepali ? `असाइनमेन्ट असफल: ${error.message}` : `Assignment failed: ${error.message}`,
        'error'
      );
    }
  };

  const filteredBundles = getFilteredBundles();
  const compatibleOperators = getCompatibleOperators();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">
            {isNepali ? 'डेटा लोड गर्दै...' : 'Loading data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNepali ? '📋 काम असाइनमेन्ट' : '📋 Work Assignment'}
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                {isNepali ? 'टेबलेट अनुकूलित इन्टरफेस' : 'Tablet-optimized interface'}
              </p>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map(stepNumber => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-8 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mt-4 text-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {isNepali ? 'काम छान्नुहोस्' : 'Select Work'}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {isNepali ? 'अपरेटर छान्नुहोस्' : 'Select Operator'}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {isNepali ? 'पुष्टि गर्नुहोस्' : 'Confirm'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Select Work */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    {isNepali ? 'खोज्नुहोस्:' : 'Search:'}
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isNepali ? 'Article, रंग...' : 'Article, Color...'}
                    className="w-full px-4 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    {isNepali ? 'मेसिन:' : 'Machine:'}
                  </label>
                  <select
                    value={filter.machineType}
                    onChange={(e) => setFilter(prev => ({ ...prev, machineType: e.target.value }))}
                    className="w-full px-4 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">{isNepali ? 'सबै मेसिन' : 'All Machines'}</option>
                    <option value="overlock">Overlock</option>
                    <option value="flatlock">Flatlock</option>
                    <option value="single-needle">Single Needle</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    {isNepali ? 'प्राथमिकता:' : 'Priority:'}
                  </label>
                  <select
                    value={filter.priority}
                    onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">{isNepali ? 'सबै' : 'All'}</option>
                    <option value="high">{isNepali ? 'उच्च' : 'High'}</option>
                    <option value="medium">{isNepali ? 'मध्यम' : 'Medium'}</option>
                    <option value="low">{isNepali ? 'न्यून' : 'Low'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Available Work */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isNepali ? '📦 उपलब्ध काम' : '📦 Available Work'} ({filteredBundles.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    onClick={() => {
                      setSelectedBundle(bundle);
                      setStep(2);
                    }}
                    className={`p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                      selectedBundle?.id === bundle.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Priority Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-lg font-bold">
                        #{bundle.articleNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        bundle.priority === 'high' ? 'bg-red-100 text-red-800' :
                        bundle.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {bundle.priority?.toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Article Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {bundle.articleName || `Article ${bundle.articleNumber}`}
                      </h3>
                      <div className="text-lg text-gray-600">
                        📦 Lot: <span className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          {bundle.lotNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Operation and Machine */}
                    <div className="mb-4 space-y-3">
                      <div className="bg-gray-100 p-3 rounded-xl">
                        <div className="text-sm text-gray-500 mb-1">
                          {isNepali ? 'ऑपरेशन:' : 'Operation:'}
                        </div>
                        <div className="text-lg font-medium text-gray-800">
                          {typeof bundle.operation === 'string' 
                            ? bundle.operation 
                            : bundle.operation?.nameEn || bundle.operation?.name || 'Sewing'}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <div className="text-sm text-blue-600 mb-1">
                          {isNepali ? 'मेसिन:' : 'Machine:'}
                        </div>
                        <div className="text-lg font-medium text-blue-800">
                          ⚙️ {bundle.machineType}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Info */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center">
                          <span className="w-4 h-4 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full mr-2"></span>
                          <span className="text-lg font-medium">{bundle.color || 'N/A'}</span>
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                          {bundle.size || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-lg font-bold">
                        {bundle.pieces || 0} {isNepali ? 'पिस' : 'pcs'}
                      </div>
                    </div>
                    
                    {/* Payment Hidden */}
                    <div className="mt-4 text-center text-sm text-gray-500">
                      💰 {isNepali ? 'पेमेन्ट काम पछि देखिनेछ' : 'Payment visible after completion'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Operator */}
        {step === 2 && selectedBundle && (
          <div className="space-y-6">
            {/* Selected Work Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">
                ✓ {isNepali ? 'चयनित काम:' : 'Selected Work:'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">Article</div>
                  <div className="text-xl font-bold text-gray-900">#{selectedBundle.articleNumber}</div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">Operation</div>
                  <div className="text-lg font-medium text-gray-900">
                    {typeof selectedBundle.operation === 'string' 
                      ? selectedBundle.operation 
                      : selectedBundle.operation?.nameEn || 'Sewing'}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">Machine</div>
                  <div className="text-lg font-medium text-gray-900">⚙️ {selectedBundle.machineType}</div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-500">Pieces</div>
                  <div className="text-xl font-bold text-gray-900">{selectedBundle.pieces || 0}</div>
                </div>
              </div>
            </div>

            {/* Available Operators */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {isNepali ? '👥 उपयुक्त अपरेटर' : '👥 Compatible Operators'} ({compatibleOperators.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compatibleOperators.map((operator) => (
                  <div
                    key={operator.id}
                    onClick={() => {
                      setSelectedOperator(operator);
                      setStep(3);
                    }}
                    className={`p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                      selectedOperator?.id === operator.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Operator Header */}
                    <div className="flex items-center space-x-4 mb-4">
                      <OperatorAvatar
                        operator={{
                          ...operator,
                          avatar: {
                            type: 'unique',
                            bgColor: '#4F46E5',
                            textColor: '#FFFFFF'
                          }
                        }}
                        size="xl"
                        showStatus={true}
                        className="border-4 border-white shadow-lg"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{operator.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            operator.status === 'available' ? 'bg-green-100 text-green-800' :
                            operator.status === 'working' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {operator.status === 'available' ? (isNepali ? '✓ उपलब्ध' : '✓ Available') :
                             operator.status === 'working' ? (isNepali ? '🔄 काममा' : '🔄 Working') :
                             (isNepali ? '⏸️ विश्राम' : '⏸️ Break')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Machine Info */}
                    <div className="bg-gray-100 p-4 rounded-xl mb-4">
                      <div className="text-sm text-gray-500 mb-1">
                        {isNepali ? 'मेसिन विशेषता:' : 'Machine Specialty:'}
                      </div>
                      <div className="text-lg font-medium text-gray-800">
                        🏭 {operator.machineType || operator.machine || operator.speciality}
                      </div>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-xl text-center">
                        <div className="text-lg font-bold text-blue-700">{operator.efficiency || 85}%</div>
                        <div className="text-sm text-blue-600">{isNepali ? 'दक्षता' : 'Efficiency'}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-xl text-center">
                        <div className="text-lg font-bold text-green-700">{operator.qualityScore || 95}%</div>
                        <div className="text-sm text-green-600">{isNepali ? 'गुणस्तर' : 'Quality'}</div>
                      </div>
                    </div>
                    
                    {/* Current Workload */}
                    <div className="mt-4 bg-purple-50 p-3 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-600">{isNepali ? 'कार्यभार:' : 'Workload:'}</span>
                        <span className="text-lg font-bold text-purple-700">
                          {operator.currentWorkload || 0}/{operator.maxWorkload || 3}
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((operator.currentWorkload || 0) / (operator.maxWorkload || 3)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-4 text-xl bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
              >
                ← {isNepali ? 'पछाडि' : 'Back'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Assignment */}
        {step === 3 && selectedBundle && selectedOperator && (
          <div className="space-y-6">
            {/* Assignment Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                {isNepali ? '✅ असाइनमेन्ट पुष्टि गर्नुहोस्' : '✅ Confirm Assignment'}
              </h2>
              
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  {/* Work Details */}
                  <div className="flex-1 bg-blue-50 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">
                      {isNepali ? '📦 काम विवरण' : '📦 Work Details'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Article:</span>
                        <span className="font-bold">#{selectedBundle.articleNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operation:</span>
                        <span className="font-medium">
                          {typeof selectedBundle.operation === 'string' 
                            ? selectedBundle.operation 
                            : selectedBundle.operation?.nameEn || 'Sewing'}
                        </span>
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
                        <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          selectedBundle.priority === 'high' ? 'bg-red-100 text-red-800' :
                          selectedBundle.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedBundle.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="px-8">
                    <div className="text-6xl text-gray-400">→</div>
                  </div>
                  
                  {/* Operator Details */}
                  <div className="flex-1 bg-green-50 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-green-900 mb-4">
                      {isNepali ? '👤 अपरेटर विवरण' : '👤 Operator Details'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Name:</span>
                        <div className="flex items-center space-x-2">
                          <OperatorAvatar
                            operator={{
                              ...selectedOperator,
                              avatar: {
                                type: 'unique',
                                bgColor: '#4F46E5',
                                textColor: '#FFFFFF'
                              }
                            }}
                            size="sm"
                            showStatus={false}
                          />
                          <span className="font-bold">{selectedOperator.name}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Machine:</span>
                        <span className="font-medium">🏭 {selectedOperator.machineType || selectedOperator.speciality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          selectedOperator.status === 'available' ? 'bg-green-100 text-green-800' :
                          selectedOperator.status === 'working' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedOperator.status === 'available' ? (isNepali ? '✓ उपलब्ध' : '✓ Available') :
                           selectedOperator.status === 'working' ? (isNepali ? '🔄 काममा' : '🔄 Working') :
                           (isNepali ? '⏸️ विश्राम' : '⏸️ Break')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Efficiency:</span>
                        <span className="font-bold text-blue-600">{selectedOperator.efficiency || 85}%</span>
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
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-4 text-xl bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
                  >
                    ← {isNepali ? 'पछाडि' : 'Back'}
                  </button>
                  
                  <button
                    onClick={handleAssign}
                    disabled={loading}
                    className="px-12 py-4 text-xl bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-bold"
                  >
                    {loading ? '🔄' : '✓'} {isNepali ? 'असाइन गर्नुहोस्' : 'Assign Work'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabletWorkAssignment;