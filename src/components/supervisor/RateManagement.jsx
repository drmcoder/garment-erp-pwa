import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  Edit2, 
  Save, 
  Plus, 
  Search, 
  RefreshCw,
  Calculator,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import OperationRateService from '../../services/OperationRateService';

const RateManagement = () => {
  const { user } = useAuth();
  const { currentLanguage, formatCurrency } = useLanguage();
  const { showNotification } = useNotifications();
  const isNepali = currentLanguage === 'np';

  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [editValues, setEditValues] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [statistics, setStatistics] = useState(null);

  // New operation form
  const [newOperation, setNewOperation] = useState({
    id: '',
    english: '',
    nepali: '',
    machine: 'overlock',
    rate: 0,
    time: 0,
    skillLevel: 'medium',
    category: 'general'
  });

  useEffect(() => {
    loadOperations();
    loadStatistics();
  }, []);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const result = await OperationRateService.getAllOperationRates();
      if (result.success) {
        setOperations(result.operations);
      } else {
        showNotification(
          isNepali ? 'ऑपरेशन दरहरू लोड गर्न समस्या भयो' : 'Failed to load operation rates',
          'error'
        );
      }
    } catch (error) {
      console.error('Failed to load operations:', error);
      showNotification(
        isNepali ? 'डेटा लोड गर्न समस्या भयो' : 'Failed to load data',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await OperationRateService.getRateStatistics();
      if (result.success) {
        setStatistics(result.stats);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleEdit = (operation) => {
    setEditingId(operation.id);
    setEditValues({
      rate: operation.rate || 0,
      time: operation.estimatedTimeMinutes || OperationRateService.calculateTimeFromRate(operation.rate || 0)
    });
  };

  const handleSave = async (operationId) => {
    try {
      const { rate, time } = editValues;
      const result = await OperationRateService.updateOperationRate(operationId, rate, time);
      
      if (result.success) {
        showNotification(
          isNepali ? 'दर सफलतापूर्वक अपडेट भयो' : 'Rate updated successfully',
          'success'
        );
        
        setEditingId(null);
        setEditValues({});
        await loadOperations();
        await loadStatistics();
      } else {
        showNotification(
          isNepali ? 'दर अपडेट गर्न समस्या भयो' : 'Failed to update rate',
          'error'
        );
      }
    } catch (error) {
      console.error('Failed to save rate:', error);
      showNotification(
        isNepali ? 'दर सेभ गर्न समस्या भयो' : 'Failed to save rate',
        'error'
      );
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleRateChange = (value) => {
    const rate = parseFloat(value) || 0;
    const calculatedTime = OperationRateService.calculateTimeFromRate(rate);
    
    setEditValues(prev => ({
      ...prev,
      rate,
      time: calculatedTime
    }));
  };

  const handleTimeChange = (value) => {
    const time = parseFloat(value) || 0;
    const calculatedRate = OperationRateService.calculateRateFromTime(time);
    
    setEditValues(prev => ({
      ...prev,
      time,
      rate: calculatedRate
    }));
  };

  const handleAddOperation = async () => {
    if (!newOperation.id || !newOperation.english) {
      showNotification(
        isNepali ? 'आवश्यक फील्डहरू भर्नुहोस्' : 'Please fill required fields',
        'error'
      );
      return;
    }

    try {
      const result = await OperationRateService.updateOperationRate(
        newOperation.id,
        newOperation.rate,
        newOperation.time
      );

      if (result.success) {
        showNotification(
          isNepali ? 'नयाँ ऑपरेशन थपियो' : 'New operation added successfully',
          'success'
        );
        
        setShowAddForm(false);
        setNewOperation({
          id: '',
          english: '',
          nepali: '',
          machine: 'overlock',
          rate: 0,
          time: 0,
          skillLevel: 'medium',
          category: 'general'
        });
        
        await loadOperations();
        await loadStatistics();
      }
    } catch (error) {
      console.error('Failed to add operation:', error);
      showNotification(
        isNepali ? 'ऑपरेशन थप्न समस्या भयो' : 'Failed to add operation',
        'error'
      );
    }
  };

  // Filter operations based on search and machine type
  const filteredOperations = operations.filter(op => {
    const matchesSearch = !searchTerm || 
      op.english?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.nepali?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMachine = !machineFilter || op.machine === machineFilter;
    
    return matchesSearch && matchesMachine;
  });

  const machineTypes = ['overlock', 'singleNeedle', 'flatlock', 'buttonhole'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            💰 {isNepali ? 'दर व्यवस्थापन' : 'Rate Management'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isNepali ? 'ऑपरेशन दर र समय सेट गर्नुहोस्' : 'Set operation rates and times'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadOperations}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{isNepali ? 'रिफ्रेस' : 'Refresh'}</span>
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isNepali ? 'नयाँ थप्नुहोस्' : 'Add New'}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">{isNepali ? 'कुल ऑपरेशन:' : 'Total Operations:'}</p>
                <p className="text-blue-800 text-2xl font-bold">{statistics.totalOperations}</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">{isNepali ? 'औसत दर:' : 'Average Rate:'}</p>
                <p className="text-green-800 text-2xl font-bold">
                  {formatCurrency(statistics.averageRate || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm">{isNepali ? 'न्यूनतम दर:' : 'Min Rate:'}</p>
                <p className="text-purple-800 text-2xl font-bold">
                  {formatCurrency(statistics.minRate || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm">{isNepali ? 'अधिकतम दर:' : 'Max Rate:'}</p>
                <p className="text-orange-800 text-2xl font-bold">
                  {formatCurrency(statistics.maxRate || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'खोज्नुहोस्:' : 'Search:'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isNepali ? 'ऑपरेशन खोज्नुहोस्...' : 'Search operations...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isNepali ? 'मेसिन प्रकार:' : 'Machine Type:'}
            </label>
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{isNepali ? 'सबै' : 'All'}</option>
              {machineTypes.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full">
              <p className="text-yellow-800 text-sm">
                <Calculator className="w-4 h-4 inline mr-1" />
                <strong>{isNepali ? 'सूत्र:' : 'Formula:'}</strong> {isNepali ? 'समय' : 'Time'} = {isNepali ? 'दर' : 'Rate'} × 1.9 {isNepali ? 'मिनेट' : 'min'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isNepali ? 'ऑपरेशन' : 'Operation'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isNepali ? 'मेसिन' : 'Machine'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {isNepali ? 'दर (रुपैयाँ)' : 'Rate (₹)'}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {isNepali ? 'समय (मिनेट)' : 'Time (min)'}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isNepali ? 'कार्यहरू' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                      <span>{isNepali ? 'लोड गर्दै...' : 'Loading...'}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {isNepali ? 'कुनै ऑपरेशन फेला परेन' : 'No operations found'}
                  </td>
                </tr>
              ) : (
                filteredOperations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {operation.english || operation.id}
                        </div>
                        {operation.nepali && (
                          <div className="text-sm text-gray-500">{operation.nepali}</div>
                        )}
                        <div className="text-xs text-gray-400">ID: {operation.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {operation.machine || 'overlock'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === operation.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editValues.rate}
                          onChange={(e) => handleRateChange(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {formatCurrency(operation.rate || 0)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === operation.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editValues.time}
                          onChange={(e) => handleTimeChange(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm">
                          {(operation.estimatedTimeMinutes || OperationRateService.calculateTimeFromRate(operation.rate || 0)).toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === operation.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSave(operation.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(operation)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Operation Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {isNepali ? 'नयाँ ऑपरेशन थप्नुहोस्' : 'Add New Operation'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'ऑपरेशन ID:' : 'Operation ID:'}
                </label>
                <input
                  type="text"
                  value={newOperation.id}
                  onChange={(e) => setNewOperation({...newOperation, id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., sleeve_attach"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अंग्रेजी नाम:' : 'English Name:'}
                </label>
                <input
                  type="text"
                  value={newOperation.english}
                  onChange={(e) => setNewOperation({...newOperation, english: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Sleeve Attach"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'नेपाली नाम:' : 'Nepali Name:'}
                </label>
                <input
                  type="text"
                  value={newOperation.nepali}
                  onChange={(e) => setNewOperation({...newOperation, nepali: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., आस्तीन जोड्ने"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'मेसिन प्रकार:' : 'Machine Type:'}
                </label>
                <select
                  value={newOperation.machine}
                  onChange={(e) => setNewOperation({...newOperation, machine: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {machineTypes.map(machine => (
                    <option key={machine} value={machine}>{machine}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isNepali ? 'दर (₹):' : 'Rate (₹):'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOperation.rate}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 0;
                      setNewOperation({
                        ...newOperation, 
                        rate,
                        time: OperationRateService.calculateTimeFromRate(rate)
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isNepali ? 'समय (min):' : 'Time (min):'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOperation.time}
                    onChange={(e) => {
                      const time = parseFloat(e.target.value) || 0;
                      setNewOperation({
                        ...newOperation, 
                        time,
                        rate: OperationRateService.calculateRateFromTime(time)
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button
                onClick={handleAddOperation}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {isNepali ? 'थप्नुहोस्' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateManagement;