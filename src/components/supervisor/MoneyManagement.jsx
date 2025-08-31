// src/components/supervisor/MoneyManagement.jsx
// Money Addition Feature for Supervisors with Admin Permission

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  PlusCircle, 
  DollarSign, 
  User, 
  FileText, 
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit
} from '../../config/firebase';

const MoneyManagement = () => {
  const { user, hasPermission } = useAuth();
  const { isNepali, t } = useLanguage();
  const { addNotification } = useNotifications();
  
  const [operators, setOperators] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [moneyTransactions, setMoneyTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    operatorId: '',
    amount: 0,
    batchId: '',
    bundleId: '',
    reason: '',
    remarks: ''
  });

  // Check admin permission
  const hasAdminPermission = hasPermission?.('money_management') || user?.role === 'admin';

  useEffect(() => {
    if (hasAdminPermission) {
      loadOperators();
      loadBatches();
      loadMoneyTransactions();
    }
  }, [hasAdminPermission]);

  const loadOperators = async () => {
    try {
      const operatorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'operator')
      );
      const snapshot = await getDocs(operatorsQuery);
      const operatorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOperators(operatorsList);
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  };

  const loadBatches = async () => {
    try {
      const batchesQuery = query(
        collection(db, 'wipEntries'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(batchesQuery);
      const batchesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBatches(batchesList);
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  const loadMoneyTransactions = async () => {
    try {
      const transactionsQuery = query(
        collection(db, 'moneyTransactions'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(transactionsQuery);
      const transactionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMoneyTransactions(transactionsList);
    } catch (error) {
      console.error('Failed to load money transactions:', error);
    }
  };

  const handleAddMoney = async () => {
    if (!formData.operatorId || !formData.amount || formData.amount <= 0) {
      addNotification({
        title: isNepali ? 'त्रुटि' : 'Error',
        message: isNepali ? 'कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्' : 'Please fill all required fields',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const operator = operators.find(op => op.id === formData.operatorId);
      const batch = batches.find(b => b.id === formData.batchId);

      const transaction = {
        operatorId: formData.operatorId,
        operatorName: operator?.name || 'Unknown',
        amount: parseFloat(formData.amount),
        batchId: formData.batchId || null,
        batchNumber: batch?.lotNumber || null,
        bundleId: formData.bundleId || null,
        reason: formData.reason,
        remarks: formData.remarks,
        addedBy: user.id,
        addedByName: user.name,
        supervisorId: user.id,
        transactionType: 'addition',
        status: 'completed',
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'moneyTransactions'), transaction);

      // Update operator account balance (you might want to create a separate accounts collection)
      // This is a simple implementation - you might want to use Firestore transactions for atomicity
      
      addNotification({
        title: isNepali ? 'सफलता' : 'Success',
        message: isNepali 
          ? `${operator?.name} को खातामा रु. ${formData.amount} थपियो`
          : `Rs. ${formData.amount} added to ${operator?.name}'s account`,
        type: 'success'
      });

      // Reset form
      setFormData({
        operatorId: '',
        amount: 0,
        batchId: '',
        bundleId: '',
        reason: '',
        remarks: ''
      });
      
      setShowAddMoney(false);
      loadMoneyTransactions();
      
    } catch (error) {
      console.error('Failed to add money:', error);
      addNotification({
        title: isNepali ? 'त्रुटि' : 'Error',
        message: isNepali ? 'पैसा थप्न समस्या भयो' : 'Failed to add money',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = moneyTransactions.filter(transaction =>
    transaction.operatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasAdminPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isNepali ? 'पहुँच अनुमति आवश्यक' : 'Access Permission Required'}
          </h3>
          <p className="text-gray-600">
            {isNepali ? 
              'यो सुविधा प्रयोग गर्न एडमिन अनुमति आवश्यक छ।' : 
              'Admin permission required to use this feature.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-green-600" />
              {isNepali ? 'पैसा व्यवस्थापन' : 'Money Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNepali ? 'अपरेटरको खातामा पैसा थप्नुहोस्' : 'Add money to operator accounts'}
            </p>
          </div>
          
          <button
            onClick={() => setShowAddMoney(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isNepali ? 'पैसा थप्नुहोस्' : 'Add Money'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={isNepali ? 'खोज्नुहोस् (अपरेटर, ब्याच, कारण...)' : 'Search (operator, batch, reason...)'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {isNepali ? 'पैसा लेनदेनको इतिहास' : 'Money Transaction History'}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {isNepali ? 'मिति' : 'Date'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {isNepali ? 'अपरेटर' : 'Operator'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {isNepali ? 'रकम' : 'Amount'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {isNepali ? 'ब्याच/बन्डल' : 'Batch/Bundle'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {isNepali ? 'कारण' : 'Reason'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {isNepali ? 'थपेको व्यक्ति' : 'Added By'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.date || new Date(transaction.createdAt?.toDate()).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{transaction.operatorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-green-600 font-semibold">
                        +रु. {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.batchNumber && (
                        <div className="text-xs">
                          <div>Batch: {transaction.batchNumber}</div>
                          {transaction.bundleId && <div>Bundle: {transaction.bundleId}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{transaction.reason}</div>
                      {transaction.remarks && (
                        <div className="text-xs text-gray-500 mt-1">{transaction.remarks}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.addedByName}
                    </td>
                  </tr>
                ))}
                
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      {isNepali ? 'कुनै लेनदेन फेला परेन' : 'No transactions found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {isNepali ? 'पैसा थप्नुहोस्' : 'Add Money'}
              </h2>
              <button
                onClick={() => setShowAddMoney(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Operator Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अपरेटर छान्नुहोस्' : 'Select Operator'} *
                </label>
                <select
                  value={formData.operatorId}
                  onChange={(e) => setFormData({...formData, operatorId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">
                    {isNepali ? 'अपरेटर छान्नुहोस्' : 'Choose operator...'}
                  </option>
                  {operators.map(operator => (
                    <option key={operator.id} value={operator.id}>
                      {operator.name} ({operator.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'रकम (रुपैयाँ)' : 'Amount (Rs.)'} *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Batch Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'ब्याच (वैकल्पिक)' : 'Batch (Optional)'}
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">
                    {isNepali ? 'ब्याच छान्नुहोस्...' : 'Choose batch...'}
                  </option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.lotNumber} - {batch.fabricName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bundle ID (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'बन्डल आईडी (वैकल्पिक)' : 'Bundle ID (Optional)'}
                </label>
                <input
                  type="text"
                  value={formData.bundleId}
                  onChange={(e) => setFormData({...formData, bundleId: e.target.value})}
                  placeholder={isNepali ? 'बन्डल आईडी...' : 'Bundle ID...'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'कारण' : 'Reason'} *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder={isNepali ? 'उदा: बोनस, अधिक काम, आदि' : 'e.g., Bonus, Extra work, etc.'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'टिप्पणी (वैकल्पिक)' : 'Remarks (Optional)'}
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  placeholder={isNepali ? 'थप जानकारी...' : 'Additional details...'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddMoney(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              <button
                onClick={handleAddMoney}
                disabled={loading || !formData.operatorId || !formData.amount || !formData.reason}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (isNepali ? 'थप्दै...' : 'Adding...') : (isNepali ? 'पैसा थप्नुहोस्' : 'Add Money')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyManagement;