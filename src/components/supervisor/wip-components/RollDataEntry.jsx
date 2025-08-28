import React from 'react';

const RollDataEntry = ({ wipData = {}, currentLanguage, setWipData }) => {
  const handleRollCountChange = (e) => {
    setWipData(prev => ({ ...prev, rollCount: parseInt(e.target.value) || 1 }));
  };

  const handleFabricDataChange = (field, value) => {
    setWipData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        🧵 {currentLanguage === 'np' ? 'कपडा र रोल जानकारी' : 'Fabric & Roll Information'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fabric Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'कपडाको नाम' : 'Fabric Name'} *
            </label>
            <input
              type="text"
              value={wipData.fabricName}
              onChange={(e) => handleFabricDataChange('fabricName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={currentLanguage === 'np' ? 'जस्तै: Cotton, Polyester' : 'e.g., Cotton, Polyester'}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'कपडाको चौडाइ' : 'Fabric Width'} *
            </label>
            <input
              type="text"
              value={wipData.fabricWidth}
              onChange={(e) => handleFabricDataChange('fabricWidth', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={currentLanguage === 'np' ? 'जस्तै: 60 इन्च' : 'e.g., 60 inches'}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'कपडा स्टोर' : 'Fabric Store'}
            </label>
            <input
              type="text"
              value={wipData.fabricStore}
              onChange={(e) => handleFabricDataChange('fabricStore', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={currentLanguage === 'np' ? 'स्टोरको नाम' : 'Store name'}
            />
          </div>
        </div>
        
        {/* Roll Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'रोलको संख्या' : 'Number of Rolls'} *
            </label>
            <input
              type="number"
              min="1"
              value={wipData.rollCount}
              onChange={handleRollCountChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'प्राप्त मिति' : 'Received Date'} *
            </label>
            <input
              type="text"
              value={wipData.receivedDate}
              onChange={(e) => handleFabricDataChange('receivedDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={currentLanguage === 'np' ? 'YYYY/MM/DD' : 'YYYY/MM/DD'}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'डेलिभरी मिति' : 'Delivery Date'}
            </label>
            <input
              type="text"
              value={wipData.deliveryDate}
              onChange={(e) => handleFabricDataChange('deliveryDate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={currentLanguage === 'np' ? 'YYYY/MM/DD' : 'YYYY/MM/DD'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'जरुरी स्तर' : 'Urgency Level'} *
            </label>
            <select
              value={wipData.urgency}
              onChange={(e) => handleFabricDataChange('urgency', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="low">
                {currentLanguage === 'np' ? '🟢 कम' : '🟢 Low'}
              </option>
              <option value="medium">
                {currentLanguage === 'np' ? '🟡 मध्यम' : '🟡 Medium'}
              </option>
              <option value="high">
                {currentLanguage === 'np' ? '🔴 उच्च' : '🔴 High'}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Order Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📋 {currentLanguage === 'np' ? 'अर्डर जानकारी' : 'Order Information'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'PO नम्बर' : 'PO Number'}
            </label>
            <input
              type="text"
              value={wipData.poNumber}
              onChange={(e) => handleFabricDataChange('poNumber', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={currentLanguage === 'np' ? 'जस्तै: PO-2024-001' : 'e.g., PO-2024-001'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentLanguage === 'np' ? 'खरिदकर्ताको नाम' : 'Buyer Name'} *
            </label>
            <input
              type="text"
              value={wipData.buyerName}
              onChange={(e) => handleFabricDataChange('buyerName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={currentLanguage === 'np' ? 'खरिदकर्ताको नाम' : 'Buyer name'}
              required
            />
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">
          📊 {currentLanguage === 'np' ? 'सारांश' : 'Summary'}
        </h4>
        <div className="text-sm text-blue-700">
          <p className="mb-1">
            <span className="font-medium">
              {currentLanguage === 'np' ? 'कपडा:' : 'Fabric:'}
            </span> {wipData.fabricName || 'N/A'} ({wipData.fabricWidth || 'N/A'})
          </p>
          <p className="mb-1">
            <span className="font-medium">
              {currentLanguage === 'np' ? 'रोल:' : 'Rolls:'}
            </span> {wipData.rollCount}
          </p>
          <p className="mb-1">
            <span className="font-medium">
              {currentLanguage === 'np' ? 'खरिदकर्ता:' : 'Buyer:'}
            </span> {wipData.buyerName || 'N/A'}
          </p>
          <p>
            <span className="font-medium">
              {currentLanguage === 'np' ? 'जरुरी:' : 'Urgency:'}
            </span> {wipData.urgency === 'low' ? (currentLanguage === 'np' ? '🟢 कम' : '🟢 Low') :
                  wipData.urgency === 'medium' ? (currentLanguage === 'np' ? '🟡 मध्यम' : '🟡 Medium') :
                  (currentLanguage === 'np' ? '🔴 उच्च' : '🔴 High')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RollDataEntry;