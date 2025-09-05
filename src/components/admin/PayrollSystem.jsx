import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Download,
  Upload,
  Filter,
  Search,
  FileText,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs } from '../../config/firebase';

const PayrollSystem = () => {
  const { user } = useAuth();
  const { currentLanguage, formatCurrency, formatDate } = useLanguage();
  const isNepali = currentLanguage === 'np';

  const [payrollData, setPayrollData] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, paid
  const [selectedPeriod] = useState('current');
  const [selectedOperators] = useState([]);
  const [showCreatePayroll, setShowCreatePayroll] = useState(false);

  // Payroll creation form state
  const [payrollForm, setPayrollForm] = useState({
    startDate: '',
    endDate: '',
    description: '',
    includeAllOperators: true,
    specificOperators: []
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load operators
        const operatorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'operator')
        );
        
        const operatorsSnapshot = await onSnapshot(operatorsQuery, (snapshot) => {
          const operatorsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOperators(operatorsData);
        });

        // Load payroll records
        const payrollQuery = query(
          collection(db, 'payrollRecords'),
          orderBy('createdAt', 'desc')
        );

        const payrollSnapshot = await onSnapshot(payrollQuery, (snapshot) => {
          const payrollRecords = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPayrollData(payrollRecords);
          setLoading(false);
        });

        return () => {
          operatorsSnapshot();
          payrollSnapshot();
        };
      } catch (error) {
        console.error('Error loading payroll data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate payroll for selected period
  const generatePayroll = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date(payrollForm.startDate);
      const endDate = new Date(payrollForm.endDate);
      
      // Get earnings for the period
      const earningsQuery = query(
        collection(db, 'operatorEarnings'),
        where('completedAt', '>=', startDate),
        where('completedAt', '<=', endDate)
      );

      const earningsSnapshot = await getDocs(earningsQuery);
      const earningsData = {};

      earningsSnapshot.docs.forEach(doc => {
        const earning = doc.data();
        if (!earningsData[earning.operatorId]) {
          earningsData[earning.operatorId] = {
            totalEarnings: 0,
            totalPieces: 0,
            workCount: 0,
            earnings: []
          };
        }
        earningsData[earning.operatorId].totalEarnings += earning.earnings || 0;
        earningsData[earning.operatorId].totalPieces += earning.pieces || 0;
        earningsData[earning.operatorId].workCount += 1;
        earningsData[earning.operatorId].earnings.push(earning);
      });

      // Create payroll record
      const payrollRecord = {
        startDate,
        endDate,
        description: payrollForm.description,
        status: 'pending',
        createdAt: new Date(),
        createdBy: user.uid,
        operators: payrollForm.includeAllOperators ? 
          operators.map(op => op.id) : 
          payrollForm.specificOperators,
        totalAmount: Object.values(earningsData).reduce((sum, data) => sum + data.totalEarnings, 0),
        operatorData: earningsData
      };

      await addDoc(collection(db, 'payrollRecords'), payrollRecord);
      
      setShowCreatePayroll(false);
      setPayrollForm({
        startDate: '',
        endDate: '',
        description: '',
        includeAllOperators: true,
        specificOperators: []
      });
    } catch (error) {
      console.error('Error generating payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve payroll
  const approvePayroll = async (payrollId) => {
    try {
      await updateDoc(doc(db, 'payrollRecords', payrollId), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.uid
      });
    } catch (error) {
      console.error('Error approving payroll:', error);
    }
  };

  // Mark as paid
  const markAsPaid = async (payrollId) => {
    try {
      await updateDoc(doc(db, 'payrollRecords', payrollId), {
        status: 'paid',
        paidAt: new Date(),
        paidBy: user.uid
      });
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredPayroll = payrollData.filter(record => {
    const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          💰 {isNepali ? 'पेरोल प्रणाली' : 'Payroll System'}
        </h2>
        <button
          onClick={() => setShowCreatePayroll(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{isNepali ? 'नयाँ पेरोल' : 'New Payroll'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'कुल पेरोल' : 'Total Payrolls'}
              </h3>
              <p className="text-2xl font-bold">{payrollData.length}</p>
            </div>
            <FileText className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'प्रतीक्षामा' : 'Pending'}
              </h3>
              <p className="text-2xl font-bold">
                {payrollData.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'स्वीकृत' : 'Approved'}
              </h3>
              <p className="text-2xl font-bold">
                {payrollData.filter(p => p.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">
                {isNepali ? 'भुक्तानी भएको' : 'Paid'}
              </h3>
              <p className="text-2xl font-bold">
                {payrollData.filter(p => p.status === 'paid').length}
              </p>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={isNepali ? 'खोज्नुहोस्' : 'Search payrolls'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{isNepali ? 'सबै' : 'All Status'}</option>
                <option value="pending">{isNepali ? 'प्रतीक्षामा' : 'Pending'}</option>
                <option value="approved">{isNepali ? 'स्वीकृत' : 'Approved'}</option>
                <option value="paid">{isNepali ? 'भुक्तानी भएको' : 'Paid'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">{isNepali ? 'निकाल्नुहोस्' : 'Export'}</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">{isNepali ? 'आयात' : 'Import'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payroll Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 {isNepali ? 'पेरोल रेकर्डहरू' : 'Payroll Records'}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredPayroll.map((payroll) => (
            <div key={payroll.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{payroll.description}</h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(payroll.startDate)} - {formatDate(payroll.endDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payroll.operators.length} {isNepali ? 'अपरेटरहरू' : 'operators'} • {formatCurrency(payroll.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(payroll.status)}`}>
                    {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                  </span>

                  <div className="flex items-center space-x-1">
                    {payroll.status === 'pending' && (
                      <button
                        onClick={() => approvePayroll(payroll.id)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title={isNepali ? 'स्वीकार गर्नुहोस्' : 'Approve'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    {payroll.status === 'approved' && (
                      <button
                        onClick={() => markAsPaid(payroll.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title={isNepali ? 'भुक्तानी गरियो' : 'Mark as Paid'}
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    )}

                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>

                    <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Payroll Modal */}
      {showCreatePayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {isNepali ? 'नयाँ पेरोल सिर्जना गर्नुहोस्' : 'Create New Payroll'}
                </h3>
                <button
                  onClick={() => setShowCreatePayroll(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); generatePayroll(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isNepali ? 'सुरु मिति' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={payrollForm.startDate}
                      onChange={(e) => setPayrollForm({...payrollForm, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isNepali ? 'अन्त्य मिति' : 'End Date'}
                    </label>
                    <input
                      type="date"
                      value={payrollForm.endDate}
                      onChange={(e) => setPayrollForm({...payrollForm, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isNepali ? 'विवरण' : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={payrollForm.description}
                    onChange={(e) => setPayrollForm({...payrollForm, description: e.target.value})}
                    placeholder={isNepali ? 'उदाहरण: नोभेम्बर 2024 पेरोल' : 'e.g. November 2024 Payroll'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={payrollForm.includeAllOperators}
                      onChange={(e) => setPayrollForm({...payrollForm, includeAllOperators: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {isNepali ? 'सबै अपरेटरहरू समावेश गर्नुहोस्' : 'Include all operators'}
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreatePayroll(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {isNepali ? 'पेरोल सिर्जना गर्नुहोस्' : 'Create Payroll'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollSystem;