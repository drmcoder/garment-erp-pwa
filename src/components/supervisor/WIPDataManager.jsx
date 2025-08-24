import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import WIPManualEntry from './WIPManualEntry';
import ProcessTemplateManager from './ProcessTemplateManager';

const WIPDataManager = ({ onClose }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const isNepali = currentLanguage === 'np';
  
  const [wipEntries, setWipEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'edit', 'create', 'templates'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Load WIP entries from localStorage on mount
  useEffect(() => {
    loadWIPEntries();
  }, []);

  // Filter entries based on search and filters
  useEffect(() => {
    let filtered = wipEntries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.lotNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.fabricName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.parsedStyles?.some(style => 
          style.articleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          style.styleName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setDate(today.getDate());
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          filterDate.setDate(today.getDate() - 30);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= filterDate;
      });
    }

    setFilteredEntries(filtered);
  }, [wipEntries, searchTerm, statusFilter, dateFilter]);

  const loadWIPEntries = () => {
    try {
      const savedEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
      // Add status and metadata to existing entries if not present
      const enrichedEntries = savedEntries.map(entry => ({
        ...entry,
        id: entry.id || Date.now() + Math.random(),
        status: entry.status || 'active',
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: entry.updatedAt || new Date().toISOString(),
        totalPieces: entry.totalPieces || entry.rolls?.reduce((sum, roll) => sum + (roll.pieces || 0), 0) || 0,
        totalRolls: entry.totalRolls || entry.rolls?.length || 0
      }));
      
      setWipEntries(enrichedEntries);
      
      addError({
        message: `${isNepali ? 'लोड गरियो' : 'Loaded'} ${enrichedEntries.length} ${isNepali ? 'WIP एन्ट्री' : 'WIP entries'}`,
        component: 'WIPDataManager',
        action: 'Load Entries'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      
    } catch (error) {
      addError({
        message: 'Failed to load WIP entries',
        component: 'WIPDataManager',
        action: 'Load Entries',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const saveWIPEntries = (entries) => {
    try {
      localStorage.setItem('wipEntries', JSON.stringify(entries));
    } catch (error) {
      addError({
        message: 'Failed to save WIP entries',
        component: 'WIPDataManager',
        action: 'Save Entries',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const handleCreateWIP = (wipData) => {
    const newEntry = {
      ...wipData,
      id: Date.now(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedEntries = [newEntry, ...wipEntries];
    setWipEntries(updatedEntries);
    saveWIPEntries(updatedEntries);
    
    setView('list');
    
    addError({
      message: isNepali ? 'नयाँ WIP एन्ट्री सिर्जना गरियो' : 'New WIP entry created successfully',
      component: 'WIPDataManager',
      action: 'Create WIP'
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  const handleUpdateWIP = (updatedData) => {
    const updatedEntries = wipEntries.map(entry => 
      entry.id === selectedEntry.id 
        ? { 
            ...updatedData, 
            id: selectedEntry.id,
            createdAt: selectedEntry.createdAt,
            updatedAt: new Date().toISOString() 
          }
        : entry
    );
    
    setWipEntries(updatedEntries);
    saveWIPEntries(updatedEntries);
    
    setView('list');
    setSelectedEntry(null);
    
    addError({
      message: isNepali ? 'WIP एन्ट्री अपडेट गरियो' : 'WIP entry updated successfully',
      component: 'WIPDataManager',
      action: 'Update WIP'
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  const handleDeleteWIP = (entryId) => {
    if (window.confirm(isNepali ? 'यो WIP एन्ट्री मेटाउने निश्चित हुनुहुन्छ?' : 'Are you sure you want to delete this WIP entry?')) {
      const updatedEntries = wipEntries.filter(entry => entry.id !== entryId);
      setWipEntries(updatedEntries);
      saveWIPEntries(updatedEntries);
      
      addError({
        message: isNepali ? 'WIP एन्ट्री मेटाइयो' : 'WIP entry deleted successfully',
        component: 'WIPDataManager',
        action: 'Delete WIP'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
    }
  };

  const handleEditWIP = (entry) => {
    setSelectedEntry(entry);
    setView('edit');
  };

  const handleStatusChange = (entryId, newStatus) => {
    const updatedEntries = wipEntries.map(entry =>
      entry.id === entryId 
        ? { ...entry, status: newStatus, updatedAt: new Date().toISOString() }
        : entry
    );
    
    setWipEntries(updatedEntries);
    saveWIPEntries(updatedEntries);
    
    addError({
      message: `${isNepali ? 'स्थिति परिवर्तन गरियो:' : 'Status changed to:'} ${newStatus}`,
      component: 'WIPDataManager',
      action: 'Change Status'
    }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: isNepali ? 'सक्रिय' : 'Active',
      completed: isNepali ? 'सम्पन्न' : 'Completed',
      paused: isNepali ? 'रोकिएको' : 'Paused',
      cancelled: isNepali ? 'रद्द' : 'Cancelled'
    };
    return labels[status] || status;
  };

  const renderListView = () => (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            📋 {isNepali ? 'WIP डेटा प्रबन्धन' : 'WIP Data Management'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isNepali 
              ? `${filteredEntries.length} एन्ट्री फेला परियो`
              : `${filteredEntries.length} entries found`
            }
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setView('templates')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            🛠️ {isNepali ? 'टेम्प्लेट प्रबन्धन' : 'Manage Templates'}
          </button>
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ {isNepali ? 'नयाँ WIP' : 'New WIP'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'खोज्नुहोस्' : 'Search'}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={isNepali ? 'लट नम्बर, कपडा वा लेख...' : 'Lot number, fabric, or article...'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'स्थिति' : 'Status'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isNepali ? 'सबै' : 'All'}</option>
              <option value="active">{isNepali ? 'सक्रिय' : 'Active'}</option>
              <option value="completed">{isNepali ? 'सम्पन्न' : 'Completed'}</option>
              <option value="paused">{isNepali ? 'रोकिएको' : 'Paused'}</option>
              <option value="cancelled">{isNepali ? 'रद्द' : 'Cancelled'}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'मिति' : 'Date'}
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isNepali ? 'सबै' : 'All Time'}</option>
              <option value="today">{isNepali ? 'आज' : 'Today'}</option>
              <option value="week">{isNepali ? 'यो हप्ता' : 'This Week'}</option>
              <option value="month">{isNepali ? 'यो महिना' : 'This Month'}</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🔄 {isNepali ? 'रिसेट' : 'Reset'}
            </button>
          </div>
        </div>
      </div>

      {/* WIP Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isNepali ? 'कुनै WIP एन्ट्री फेला परेन' : 'No WIP Entries Found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isNepali 
                ? 'नयाँ WIP एन्ट्री सिर्जना गर्न माथिको बटन क्लिक गर्नुहोस्'
                : 'Click the button above to create a new WIP entry'
              }
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {entry.lotNumber?.[0] || 'W'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isNepali ? 'लट:' : 'Lot:'} {entry.lotNumber}
                    </h3>
                    <p className="text-gray-600">
                      {entry.fabricName} | {entry.nepaliDate}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(entry.status)}`}>
                    {getStatusLabel(entry.status)}
                  </span>
                  
                  <div className="relative">
                    <select
                      value={entry.status}
                      onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                      className="pr-8 pl-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">{isNepali ? 'सक्रिय' : 'Active'}</option>
                      <option value="completed">{isNepali ? 'सम्पन्न' : 'Completed'}</option>
                      <option value="paused">{isNepali ? 'रोकिएको' : 'Paused'}</option>
                      <option value="cancelled">{isNepali ? 'रद्द' : 'Cancelled'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Entry Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {isNepali ? 'लेखहरू' : 'Articles'}
                  </h4>
                  <div className="space-y-1">
                    {entry.parsedStyles?.map((style, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span className="font-medium">{style.articleNumber}</span> - {style.styleName}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {isNepali ? 'उत्पादन डेटा' : 'Production Data'}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{isNepali ? 'रोल:' : 'Rolls:'} <span className="font-medium">{entry.totalRolls || 0}</span></div>
                    <div>{isNepali ? 'कुल टुक्रा:' : 'Total Pieces:'} <span className="font-medium">{entry.totalPieces || 0}</span></div>
                    <div>{isNepali ? 'गार्मेन्ट:' : 'Category:'} <span className="font-medium">{entry.garmentCategory}</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {isNepali ? 'अन्तिम अपडेट' : 'Last Updated'}
                  </h4>
                  <div className="text-sm text-gray-600">
                    {new Date(entry.updatedAt).toLocaleDateString()} {new Date(entry.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  {isNepali ? 'सिर्जना:' : 'Created:'} {new Date(entry.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditWIP(entry)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                  >
                    ✏️ {isNepali ? 'सम्पादन' : 'Edit'}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteWIP(entry.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                  >
                    🗑️ {isNepali ? 'मेटाउनुहोस्' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                📊 {isNepali ? 'WIP डेटा प्रबन्धक' : 'WIP Data Manager'}
              </h1>
              <p className="text-blue-200 mt-1">
                {isNepali 
                  ? 'सबै WIP एन्ट्री हेर्नुहोस्, सम्पादन गर्नुहोस् र प्रबन्धन गर्नुहोस्'
                  : 'View, edit and manage all WIP entries'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto p-6">
          {view === 'list' && renderListView()}
          
          {view === 'create' && (
            <WIPManualEntry
              onImport={handleCreateWIP}
              onCancel={() => setView('list')}
            />
          )}
          
          {view === 'edit' && selectedEntry && (
            <WIPManualEntry
              onImport={handleUpdateWIP}
              onCancel={() => {
                setView('list');
                setSelectedEntry(null);
              }}
              initialData={selectedEntry}
              isEditing={true}
            />
          )}
          
          {view === 'templates' && (
            <ProcessTemplateManager
              onTemplateSelect={(template) => {
                console.log('Template selected:', template);
                setView('list');
              }}
              onClose={() => setView('list')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WIPDataManager;