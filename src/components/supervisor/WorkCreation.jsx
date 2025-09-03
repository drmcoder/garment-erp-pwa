// src/components/supervisor/WorkCreation.jsx
// Work/Bundle Creation Interface for Supervisors

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSystem } from '../../context/SystemContext';
import { useWorkManagement } from '../../hooks/useAppData';

const WorkCreation = () => {
  const { user } = useAuth();
  const { isNepali } = useLanguage();
  const { showNotification } = useNotifications();
  const { currentLine } = useSystem();
  const { createBundle } = useWorkManagement();

  const [loading, setLoading] = useState(false);
  const [bundleForm, setBundleForm] = useState({
    articleNumber: '',
    articleName: '',
    articleNameNepali: '',
    color: '',
    colorCode: '',
    sizes: [],
    quantity: '',
    rate: '',
    priority: 'medium',
    machineType: 'overlock',
    currentOperation: '',
    estimatedTime: '',
    dueDate: '',
    notes: ''
  });

  // Predefined options
  const machineTypes = [
    { value: 'overlock', labelEn: 'Overlock', labelNp: 'ओभरलक' },
    { value: 'flatlock', labelEn: 'Flatlock', labelNp: 'फ्ल्यालक' },
    { value: 'singleNeedle', labelEn: 'Single Needle', labelNp: 'एकल सुई' },
    { value: 'buttonhole', labelEn: 'Buttonhole', labelNp: 'बटनहोल' }
  ];

  const priorities = [
    { value: 'high', labelEn: 'High', labelNp: 'उच्च' },
    { value: 'medium', labelEn: 'Medium', labelNp: 'सामान्य' },
    { value: 'low', labelEn: 'Low', labelNp: 'कम' }
  ];

  const commonOperations = {
    overlock: ['shoulderJoin', 'sideSeam', 'sleeves', 'armhole'],
    flatlock: ['hemFold', 'neckline', 'binding', 'hemming'],
    singleNeedle: ['collar', 'placket', 'topStitch', 'waistband'],
    buttonhole: ['buttonhole', 'buttonAttach']
  };

  const operationNames = {
    shoulderJoin: { en: 'Shoulder Join', np: 'काँध जोड्ने' },
    sideSeam: { en: 'Side Seam', np: 'साइड सिम' },
    sleeves: { en: 'Sleeves', np: 'बाहुला' },
    armhole: { en: 'Armhole', np: 'बाहुला प्वाल' },
    hemFold: { en: 'Hem Fold', np: 'हेम फोल्ड' },
    neckline: { en: 'Neckline', np: 'घाँटी' },
    binding: { en: 'Binding', np: 'बाइन्डिङ' },
    hemming: { en: 'Hemming', np: 'हेमिङ' },
    collar: { en: 'Collar', np: 'कलर' },
    placket: { en: 'Placket', np: 'प्लाकेट' },
    topStitch: { en: 'Top Stitch', np: 'माथिल्लो सिलाई' },
    waistband: { en: 'Waistband', np: 'कम्मरको पट्टी' },
    buttonhole: { en: 'Buttonhole', np: 'बटनको प्वाल' },
    buttonAttach: { en: 'Button Attach', np: 'बटन जोड्ने' }
  };

  const standardSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const numericSizes = ['20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40'];

  // Separate handlers for rate and time to prevent loops
  const handleRateChange = (value) => {
    const rate = parseFloat(value) || 0;
    const calculatedTime = rate > 0 ? Math.round(rate * 1.9 * 10) / 10 : '';
    
    setBundleForm(prev => ({
      ...prev,
      rate: value,
      estimatedTime: calculatedTime.toString()
    }));
  };

  const handleTimeChange = (value) => {
    const time = parseFloat(value) || 0;
    const calculatedRate = time > 0 ? Math.round(time / 1.9 * 100) / 100 : '';
    
    setBundleForm(prev => ({
      ...prev,
      estimatedTime: value,
      rate: calculatedRate.toString()
    }));
  };

  const handleInputChange = (field, value) => {
    setBundleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSizeToggle = (size) => {
    setBundleForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const generateBundleId = () => {
    const prefix = 'B';
    const timestamp = Date.now().toString().slice(-6);
    const article = bundleForm.articleNumber.slice(-2);
    const color = bundleForm.colorCode.slice(0, 2).toUpperCase();
    const size = bundleForm.sizes[0] || 'UN';
    return `${prefix}${timestamp}-${article}-${color}-${size}`;
  };

  const calculateTotalValue = () => {
    const quantity = parseInt(bundleForm.quantity) || 0;
    const rate = parseFloat(bundleForm.rate) || 0;
    return quantity * rate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!bundleForm.articleNumber || !bundleForm.quantity || !bundleForm.rate) {
        throw new Error(isNepali ? 'आवश्यक फिल्डहरू भर्नुहोस्' : 'Please fill required fields');
      }

      if (bundleForm.sizes.length === 0) {
        throw new Error(isNepali ? 'कम्तिमा एक साइज छनोट गर्नुहोस्' : 'Please select at least one size');
      }

      // Create bundle data
      const bundleData = {
        id: generateBundleId(),
        bundleNumber: `B${Date.now().toString().slice(-6)}`,
        article: parseInt(bundleForm.articleNumber),
        articleName: bundleForm.articleName,
        articleNameNepali: bundleForm.articleNameNepali,
        color: bundleForm.color,
        colorCode: bundleForm.colorCode,
        sizes: bundleForm.sizes,
        quantity: parseInt(bundleForm.quantity),
        rate: parseFloat(bundleForm.rate),
        totalValue: calculateTotalValue(),
        priority: bundleForm.priority,
        machineType: bundleForm.machineType,
        currentOperation: bundleForm.currentOperation,
        estimatedTime: parseInt(bundleForm.estimatedTime) || 30,
        dueDate: bundleForm.dueDate,
        notes: bundleForm.notes,
        status: 'pending',
        assignedLine: currentLine,
        assignedOperator: null,
        createdBy: user?.id || 'supervisor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create bundle using centralized service
      const result = await createBundle(bundleData);
      
      if (!result.success) {
        throw new Error(result.error || (isNepali ? 'बन्डल सिर्जना असफल' : 'Failed to create bundle'));
      }
      
      console.log('Bundle created with ID:', result.id);

      // Reset form
      setBundleForm({
        articleNumber: '',
        articleName: '',
        articleNameNepali: '',
        color: '',
        colorCode: '',
        sizes: [],
        quantity: '',
        rate: '',
        priority: 'medium',
        machineType: 'overlock',
        currentOperation: '',
        estimatedTime: '',
        dueDate: '',
        notes: ''
      });

      showNotification(
        isNepali 
          ? `बन्डल #${bundleData.bundleNumber} सफलतापूर्वक सिर्जना गरियो`
          : `Bundle #${bundleData.bundleNumber} created successfully`,
        'success'
      );

    } catch (error) {
      console.error('Bundle creation error:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBundleForm({
      articleNumber: '',
      articleName: '',
      articleNameNepali: '',
      color: '',
      colorCode: '',
      sizes: [],
      quantity: '',
      rate: '',
      priority: 'medium',
      machineType: 'overlock',
      currentOperation: '',
      estimatedTime: '',
      dueDate: '',
      notes: ''
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            ➕ {isNepali ? 'नयाँ काम सिर्जना गर्नुहोस्' : 'Create New Work Bundle'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isNepali 
              ? 'अपरेटरहरूलाई असाइनमेन्टको लागि नयाँ बन्डल सिर्जना गर्नुहोस्'
              : 'Create new work bundles for operator assignments'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Article Information */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              👕 {isNepali ? 'लेख जानकारी' : 'Article Information'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'लेख नम्बर *' : 'Article Number *'}
                </label>
                <input
                  type="text"
                  value={bundleForm.articleNumber}
                  onChange={(e) => handleInputChange('articleNumber', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: 8085' : 'e.g: 8085'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'लेख नाम (अंग्रेजी) *' : 'Article Name (English) *'}
                </label>
                <input
                  type="text"
                  value={bundleForm.articleName}
                  onChange={(e) => handleInputChange('articleName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: Polo T-Shirt' : 'e.g: Polo T-Shirt'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'लेख नाम (नेपाली)' : 'Article Name (Nepali)'}
                </label>
                <input
                  type="text"
                  value={bundleForm.articleNameNepali}
                  onChange={(e) => handleInputChange('articleNameNepali', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: पोलो टी-शर्ट' : 'e.g: पोलो टी-शर्ट'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'रंग' : 'Color'}
                </label>
                <input
                  type="text"
                  value={bundleForm.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: नीलो' : 'e.g: Blue'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'रंग कोड' : 'Color Code'}
                </label>
                <input
                  type="text"
                  value={bundleForm.colorCode}
                  onChange={(e) => handleInputChange('colorCode', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: BL' : 'e.g: BL'}
                />
              </div>
            </div>
          </div>

          {/* Sizes Selection */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📏 {isNepali ? 'साइज चयन *' : 'Size Selection *'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  {isNepali ? 'मानक साइजहरू' : 'Standard Sizes'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {standardSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                        bundleForm.sizes.includes(size)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  {isNepali ? 'संख्यात्मक साइजहरू' : 'Numeric Sizes'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {numericSizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                        bundleForm.sizes.includes(size)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {bundleForm.sizes.length > 0 && (
                <div className="mt-4 p-3 bg-white rounded-md border">
                  <div className="text-sm text-gray-600">
                    {isNepali ? 'चयनित साइजहरू:' : 'Selected Sizes:'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {bundleForm.sizes.map(size => (
                      <span key={size} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Production Details */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🏭 {isNepali ? 'उत्पादन विवरण' : 'Production Details'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'मात्रा (टुक्राहरू) *' : 'Quantity (Pieces) *'}
                </label>
                <input
                  type="number"
                  value={bundleForm.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: 50' : 'e.g: 50'}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'दर (प्रति टुक्रा) *' : 'Rate (Per Piece) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bundleForm.rate}
                  onChange={(e) => handleRateChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: 2.50' : 'e.g: 2.50'}
                  min="0"
                  required
                />
                <p className="text-xs text-blue-600 mt-1">
                  💡 {isNepali ? 'समय स्वचालित रूपमा गणना हुनेछ' : 'Time will be auto-calculated'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'कुल मूल्य' : 'Total Value'}
                </label>
                <input
                  type="text"
                  value={calculateTotalValue().toFixed(2)}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'प्राथमिकता' : 'Priority'}
                </label>
                <select
                  value={bundleForm.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {isNepali ? priority.labelNp : priority.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'मेसिनको प्रकार *' : 'Machine Type *'}
                </label>
                <select
                  value={bundleForm.machineType}
                  onChange={(e) => handleInputChange('machineType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {machineTypes.map(machine => (
                    <option key={machine.value} value={machine.value}>
                      {isNepali ? machine.labelNp : machine.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'हालको काम' : 'Current Operation'}
                </label>
                <select
                  value={bundleForm.currentOperation}
                  onChange={(e) => handleInputChange('currentOperation', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{isNepali ? 'काम छनोट गर्नुहोस्' : 'Select Operation'}</option>
                  {(commonOperations[bundleForm.machineType] || []).map(operation => (
                    <option key={operation} value={operation}>
                      {operationNames[operation] 
                        ? (isNepali ? operationNames[operation].np : operationNames[operation].en)
                        : operation
                      }
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'अनुमानित समय (मिनेट)' : 'Estimated Time (Minutes)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bundleForm.estimatedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isNepali ? 'उदा: 4.8' : 'e.g: 4.8'}
                  min="0.1"
                />
                <p className="text-xs text-green-600 mt-1">
                  📐 {isNepali ? 'सूत्र: समय = दर × 1.9' : 'Formula: Time = Rate × 1.9'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'समाप्ति मिति' : 'Due Date'}
                </label>
                <input
                  type="date"
                  value={bundleForm.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isNepali ? 'टिप्पणी' : 'Notes'}
              </label>
              <textarea
                value={bundleForm.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isNepali ? 'कुनै अतिरिक्त जानकारी...' : 'Any additional information...'}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {isNepali ? '🔄 रिसेट गर्नुहोस्' : '🔄 Reset Form'}
            </button>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isNepali ? 'सिर्जना गर्दै...' : 'Creating...'}</span>
                  </div>
                ) : (
                  `✅ ${isNepali ? 'बन्डल सिर्जना गर्नुहोस्' : 'Create Bundle'}`
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkCreation;