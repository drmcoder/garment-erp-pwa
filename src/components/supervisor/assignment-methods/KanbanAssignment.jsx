// src/components/supervisor/assignment-methods/KanbanAssignment.jsx
// Kanban-style visual work assignment method

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotifications } from '../../../context/NotificationContext';
import UniversalAvatar from '../../common/UniversalAvatar';

const KanbanAssignment = ({ 
  operators, 
  availableBundles, 
  assignments,
  assignWork, 
  loading,
  isTablet 
}) => {
  const { user } = useAuth();
  const { isNepali } = useLanguage();
  const { showNotification } = useNotifications();

  const [selectedBundle, setSelectedBundle] = useState(null);
  const [filter, setFilter] = useState({
    machineType: 'all',
    search: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Kanban columns configuration
  const columns = [
    {
      id: 'available',
      title: isNepali ? '📦 उपलब्ध काम' : '📦 Available Work',
      color: 'blue',
      items: availableBundles.filter(b => b.status === 'ready' || b.status === 'pending')
    },
    {
      id: 'assigned',
      title: isNepali ? '📋 असाइन गरिएको' : '📋 Assigned',
      color: 'yellow',
      items: assignments?.filter(a => a.status === 'assigned') || []
    },
    {
      id: 'in_progress',
      title: isNepali ? '🔄 काम गर्दै' : '🔄 In Progress',
      color: 'orange',
      items: assignments?.filter(a => a.status === 'in_progress') || []
    },
    {
      id: 'completed',
      title: isNepali ? '✅ सम्पन्न' : '✅ Completed',
      color: 'green',
      items: assignments?.filter(a => a.status === 'completed') || []
    }
  ];

  // Filter bundles
  const getFilteredItems = (items) => {
    let filtered = [...items];

    if (filter.machineType !== 'all') {
      filtered = filtered.filter(item => 
        item.machineType?.toLowerCase().includes(filter.machineType.toLowerCase())
      );
    }

    if (filter.search.trim()) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.articleNumber?.toString().toLowerCase().includes(search) ||
        item.articleName?.toLowerCase().includes(search) ||
        item.operatorName?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  // Get compatible operators for selected bundle
  const getCompatibleOperators = () => {
    if (!selectedBundle) return [];

    return operators.filter(op => {
      const opMachine = op.machineType || op.machine || op.speciality || '';
      const bundleMachine = selectedBundle.machineType || '';
      
      const isCompatible = 
        opMachine.toLowerCase().includes(bundleMachine.toLowerCase()) ||
        bundleMachine.toLowerCase().includes(opMachine.toLowerCase());

      const hasCapacity = (op.currentWorkload || 0) < (op.maxWorkload || 3);

      return isCompatible && hasCapacity && op.status !== 'offline';
    });
  };

  const handleBundleClick = (bundle) => {
    setSelectedBundle(bundle);
    setShowAssignModal(true);
  };

  const handleAssign = async (operatorId) => {
    if (!selectedBundle || !operatorId) return;

    try {
      const workData = {
        bundleId: selectedBundle.id,
        articleNumber: selectedBundle.articleNumber,
        operation: selectedBundle.operation || selectedBundle.operationName,
        pieces: selectedBundle.pieces || selectedBundle.quantity,
        machineType: selectedBundle.machineType,
        priority: selectedBundle.priority || 'medium'
      };

      const result = await assignWork(operatorId, workData);

      if (result.success) {
        const operator = operators.find(op => op.id === operatorId);
        showNotification(
          isNepali 
            ? `✅ ${selectedBundle.articleNumber} सफलतापूर्वक ${operator?.name} लाई असाइन गरियो`
            : `✅ ${selectedBundle.articleNumber} successfully assigned to ${operator?.name}`,
          'success'
        );

        setSelectedBundle(null);
        setShowAssignModal(false);
      }
    } catch (error) {
      showNotification(
        isNepali ? `असाइनमेन्ट असफल: ${error.message}` : `Assignment failed: ${error.message}`,
        'error'
      );
    }
  };

  // Column colors
  const getColumnColors = (color) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50',
      yellow: 'border-yellow-200 bg-yellow-50',
      orange: 'border-orange-200 bg-orange-50',
      green: 'border-green-200 bg-green-50'
    };
    return colors[color] || colors.blue;
  };

  const getCardColors = (priority) => {
    return priority === 'high' 
      ? 'border-red-200 bg-red-50' 
      : priority === 'medium'
      ? 'border-yellow-200 bg-yellow-50'
      : 'border-green-200 bg-green-50';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            📊 {isNepali ? 'कान्बान बोर्ड' : 'Kanban Board'}
          </h2>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder={isNepali ? 'खोज्नुहोस्...' : 'Search...'}
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <select
              value={filter.machineType}
              onChange={(e) => setFilter(prev => ({ ...prev, machineType: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{isNepali ? 'सबै मेसिन' : 'All Machines'}</option>
              <option value="overlock">Overlock</option>
              <option value="flatlock">Flatlock</option>
              <option value="single-needle">Single Needle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {columns.map(column => {
            const filteredItems = getFilteredItems(column.items);
            
            return (
              <div key={column.id} className={`border-2 rounded-2xl ${getColumnColors(column.color)}`}>
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200 bg-white bg-opacity-70 rounded-t-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">{column.title}</h3>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
                      {filteredItems.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-4 space-y-4 min-h-96 max-h-96 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-sm">{isNepali ? 'खाली' : 'Empty'}</p>
                    </div>
                  ) : (
                    filteredItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        onClick={() => column.id === 'available' && handleBundleClick(item)}
                        className={`p-4 border-2 rounded-xl shadow-sm transition-all ${
                          column.id === 'available' 
                            ? 'cursor-pointer hover:shadow-md hover:scale-105' 
                            : ''
                        } ${
                          item.priority ? getCardColors(item.priority) : 'border-gray-200 bg-white'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-3">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                            #{item.articleNumber}
                          </span>
                          {item.priority && (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.priority === 'high' ? 'bg-red-100 text-red-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.priority?.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {item.articleName || `Article ${item.articleNumber}`}
                          </h4>
                          
                          <div className="text-xs text-gray-600">
                            {item.operation || 'Sewing'}
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {item.pieces || 0} pcs
                            </span>
                            <span className="text-gray-500">
                              ⚙️ {item.machineType}
                            </span>
                          </div>

                          {/* Show operator for assigned/in-progress items */}
                          {(column.id === 'assigned' || column.id === 'in_progress' || column.id === 'completed') && item.operatorName && (
                            <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-200">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-700">
                                  {item.operatorName.charAt(0)}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {item.operatorName}
                              </span>
                            </div>
                          )}

                          {/* Progress bar for in-progress items */}
                          {column.id === 'in_progress' && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full" 
                                  style={{ width: `${Math.random() * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.floor(Math.random() * 100)}% complete
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedBundle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  🎯 {isNepali ? 'अपरेटर छान्नुहोस्' : 'Select Operator'}
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Selected Bundle Info */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 mb-2">
                  📦 {isNepali ? 'चयनित काम' : 'Selected Work'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Article</div>
                    <div className="font-bold">#{selectedBundle.articleNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Operation</div>
                    <div className="font-medium">{selectedBundle.operation || 'Sewing'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Machine</div>
                    <div className="font-medium">⚙️ {selectedBundle.machineType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Pieces</div>
                    <div className="font-bold text-red-600">{selectedBundle.pieces || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Compatible Operators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getCompatibleOperators().map(operator => (
                  <div
                    key={operator.id}
                    onClick={() => handleAssign(operator.id)}
                    className="p-6 border-2 border-gray-200 rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:border-green-300 hover:bg-green-50"
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

                    {/* Performance Metrics */}
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

                    {/* Status */}
                    <div className={`px-3 py-2 rounded-full text-sm font-medium text-center ${
                      operator.status === 'available' ? 'bg-green-100 text-green-800' :
                      operator.status === 'working' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {operator.status === 'available' ? (isNepali ? '✓ उपलब्ध' : '✓ Available') :
                       operator.status === 'working' ? (isNepali ? '🔄 काममा' : '🔄 Working') :
                       (isNepali ? '⏸️ विश्राम' : '⏸️ Break')}
                    </div>

                    {/* Workload */}
                    <div className="mt-3 bg-purple-50 p-2 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-600">{isNepali ? 'कार्यभार' : 'Workload'}</span>
                        <span className="font-bold text-purple-700">
                          {operator.currentWorkload || 0}/{operator.maxWorkload || 3}
                        </span>
                      </div>
                    </div>

                    {/* Click to assign hint */}
                    <div className="mt-4 text-center">
                      <span className="text-xs text-gray-500">
                        {isNepali ? 'असाइन गर्न क्लिक गर्नुहोस्' : 'Click to assign'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {getCompatibleOperators().length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isNepali ? 'कुनै उपयुक्त अपरेटर छैन' : 'No compatible operators'}
                  </h3>
                  <p className="text-gray-600">
                    {isNepali ? 'सबै अपरेटर व्यस्त छन् वा मेसिन मिल्दैन' : 'All operators are busy or machine mismatch'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanAssignment;