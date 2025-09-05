import React, { useState } from 'react';
import { Zap, RefreshCw } from 'lucide-react';

const WorkAssignmentSystem = ({ currentLanguage, t, getEfficiencyColor }) => {
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [draggedBundle, setDraggedBundle] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  
  // Simple mock data
  const bundles = [
    { id: 'B001', lot: '90', article: '8088', item: 'Polo T-Shirt', operation: 'Shoulder Join', size: 'Freesize', pieces: 96, time: 3, color: 'White', priority: 'high', machineType: 'overlock' },
    { id: 'B002', lot: '85', article: '7052', item: 'Round Neck', operation: 'Side Seam', size: 'L', pieces: 75, time: 2.5, color: 'Blue', priority: 'medium', machineType: 'overlock' },
    { id: 'B003', lot: '78', article: '6034', item: 'V-Neck Shirt', operation: 'Collar Attach', size: 'M', pieces: 60, time: 4, color: 'Black', priority: 'medium', machineType: 'singleNeedle' },
    { id: 'B004', lot: '92', article: '9012', item: 'Hoodie', operation: 'Hem Fold', size: 'XL', pieces: 45, time: 2, color: 'Gray', priority: 'low', machineType: 'flatlock' },
  ];

  const operators = [
    { id: 'OP001', name: 'Ram Singh', nameNp: 'राम सिंह', machine: 'overlock', efficiency: 88, workload: 2, maxWork: 3, status: 'available' },
    { id: 'OP002', name: 'Sita Devi', nameNp: 'सीता देवी', machine: 'flatlock', efficiency: 92, workload: 1, maxWork: 3, status: 'working' },
    { id: 'OP003', name: 'Hari Bahadur', nameNp: 'हरि बहादुर', machine: 'singleNeedle', efficiency: 85, workload: 3, maxWork: 3, status: 'busy' },
    { id: 'OP004', name: 'Maya Gurung', nameNp: 'माया गुरुङ', machine: 'overlock', efficiency: 90, workload: 0, maxWork: 3, status: 'free' },
  ];

  const handleQuickAssign = (type) => {
    alert(`${currentLanguage === "np" ? 'असाइन गरियो' : 'Quick assign'}: ${type}`);
  };

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          📦 {currentLanguage === "np" ? "काम असाइनमेन्ट" : "Work Assignment"}
        </h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => handleQuickAssign('auto')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            {currentLanguage === "np" ? "अटो असाइन" : "Auto Assign"}
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            {currentLanguage === "np" ? "रिफ्रेश" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm text-gray-600">{currentLanguage === "np" ? "पेन्डिङ" : "Pending"}</p>
            <p className="text-2xl font-bold text-yellow-600">{bundles.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm text-gray-600">{currentLanguage === "np" ? "उपलब्ध" : "Available"}</p>
            <p className="text-2xl font-bold text-green-600">{operators.filter(op => op.status === 'available' || op.status === 'free').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-center">
            <div className="text-2xl mb-2">🔄</div>
            <p className="text-sm text-gray-600">{currentLanguage === "np" ? "प्रगतिमा" : "Working"}</p>
            <p className="text-2xl font-bold text-blue-600">{operators.filter(op => op.status === 'working').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm text-gray-600">{currentLanguage === "np" ? "दक्षता" : "Efficiency"}</p>
            <p className="text-2xl font-bold text-purple-600">89%</p>
          </div>
        </div>
      </div>

      {/* Main Assignment Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bundles - Left Side */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            📋 {currentLanguage === "np" ? "बंडलहरू" : "Bundles"}
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              {bundles.length}
            </span>
          </h3>

          <div className="space-y-4">
            {bundles.map(bundle => (
              <div
                key={bundle.id}
                className={`border-2 rounded-xl p-4 cursor-grab transition-all hover:shadow-lg select-none ${
                  draggedBundle?.id === bundle.id ? 'opacity-50 scale-95 border-blue-500 bg-blue-100 cursor-grabbing' :
                  bundle.priority === 'high' ? 'border-red-300 bg-red-50' :
                  bundle.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                  'border-gray-300 bg-gray-50'
                }`}
                draggable={true}
                onDragStart={(e) => {
                  console.log('Drag started:', bundle.id);
                  e.dataTransfer.setData('text/plain', JSON.stringify(bundle));
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedBundle(bundle);
                }}
                onDragEnd={() => {
                  console.log('Drag ended');
                  setDraggedBundle(null);
                  setDropTarget(null);
                }}
              >
                {/* Priority indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      bundle.priority === 'high' ? 'bg-red-500' :
                      bundle.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}></div>
                    <span className="font-bold text-gray-800">
                      🏭 {bundle.lot} | 📋 {bundle.article}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {bundle.machineType === 'overlock' ? '🔗' : 
                     bundle.machineType === 'singleNeedle' ? '📌' : 
                     bundle.machineType === 'flatlock' ? '🔄' : '🔧'}
                  </div>
                </div>

                {/* Bundle details */}
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-gray-800">📦 {bundle.item}</h4>
                  <p className="text-blue-600 font-semibold">{bundle.operation}</p>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                      <p className="text-gray-600">{currentLanguage === "np" ? "साइज" : "Size"}</p>
                      <p className="font-bold">{bundle.size}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{currentLanguage === "np" ? "रंग" : "Color"}</p>
                      <p className="font-bold">{bundle.color}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{currentLanguage === "np" ? "टुक्रा" : "Pcs"}</p>
                      <p className="font-bold text-green-600">{bundle.pieces}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{currentLanguage === "np" ? "समय" : "Time"}</p>
                      <p className="font-bold text-purple-600">{bundle.time}min</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operators - Right Side */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            👥 {currentLanguage === "np" ? "अपरेटरहरू" : "Operators"}
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              {operators.filter(op => op.status === 'available' || op.status === 'free').length} {currentLanguage === "np" ? "उपलब्ध" : "free"}
            </span>
          </h3>

          <div className="space-y-4">
            {operators.map(operator => (
              <div
                key={operator.id}
                className={`border-2 rounded-xl p-4 transition-all ${
                  dropTarget === operator.id ? 'border-blue-500 bg-blue-100 shadow-lg scale-105' :
                  operator.status === 'available' || operator.status === 'free' ? 
                    'border-green-300 bg-green-50 hover:shadow-lg cursor-pointer' :
                  operator.status === 'working' ? 
                    'border-blue-300 bg-blue-50' :
                    'border-gray-300 bg-gray-100 opacity-75'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (operator.status !== 'busy') {
                    setDropTarget(operator.id);
                  }
                }}
                onDragLeave={() => {
                  setDropTarget(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  console.log('Drop attempted on operator:', operator.id);
                  
                  if (operator.status === 'busy') {
                    alert(currentLanguage === "np" ? 'अपरेटर व्यस्त छ!' : 'Operator is busy!');
                    return;
                  }
                  
                  try {
                    const bundleDataString = e.dataTransfer.getData('text/plain');
                    console.log('Bundle data string:', bundleDataString);
                    
                    if (!bundleDataString) {
                      console.error('No bundle data found');
                      return;
                    }
                    
                    const bundleData = JSON.parse(bundleDataString);
                    console.log('Parsed bundle data:', bundleData);
                    
                    // Check machine compatibility
                    if (bundleData.machineType !== operator.machine) {
                      const confirm = window.confirm(
                        currentLanguage === "np" 
                          ? `मेसिन मेच छैन (${bundleData.machineType} vs ${operator.machine}). के तपाईं पक्का हुनुहुन्छ?`
                          : `Machine mismatch (${bundleData.machineType} vs ${operator.machine}). Are you sure?`
                      );
                      if (!confirm) return;
                    }
                    
                    alert(`${currentLanguage === "np" ? 'सफलतापूर्वक असाइन गरियो' : 'Successfully Assigned'}!\n${bundleData.item} → ${currentLanguage === "np" ? operator.nameNp : operator.name}`);
                    
                    // Here you would typically call an API to save the assignment
                    console.log('Assignment created:', { bundle: bundleData, operator: operator });
                    
                  } catch (error) {
                    console.error('Error in drop handler:', error);
                    alert(currentLanguage === "np" ? 'असाइनमेन्ट असफल!' : 'Assignment failed!');
                  } finally {
                    setDraggedBundle(null);
                    setDropTarget(null);
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                    operator.status === 'available' || operator.status === 'free' ? 'bg-green-500' :
                    operator.status === 'working' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}>
                    {(currentLanguage === "np" ? operator.nameNp : operator.name).charAt(0)}
                  </div>

                  {/* Operator info */}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-800">
                      {currentLanguage === "np" ? operator.nameNp : operator.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {operator.machine === 'overlock' ? '🔗' : 
                       operator.machine === 'singleNeedle' ? '📌' : 
                       operator.machine === 'flatlock' ? '🔄' : '🔧'} {" "}
                      {operator.machine === 'overlock' ? (currentLanguage === "np" ? 'ओभरलक' : 'Overlock') :
                       operator.machine === 'singleNeedle' ? (currentLanguage === "np" ? 'सिंगल निडल' : 'Single Needle') :
                       operator.machine === 'flatlock' ? (currentLanguage === "np" ? 'फ्ल्यालक' : 'Flatlock') :
                       operator.machine}
                    </p>
                  </div>

                  {/* Status and efficiency */}
                  <div className="text-right">
                    <div className={`px-2 py-1 text-xs font-bold rounded-full text-white ${
                      operator.status === 'available' || operator.status === 'free' ? 'bg-green-500' :
                      operator.status === 'working' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}>
                      {operator.status === 'available' ? (currentLanguage === "np" ? 'उपलब्ध' : 'Available') :
                       operator.status === 'free' ? (currentLanguage === "np" ? 'फ्री' : 'Free') :
                       operator.status === 'working' ? (currentLanguage === "np" ? 'काममा' : 'Working') :
                       (currentLanguage === "np" ? 'व्यस्त' : 'Busy')}
                    </div>
                    <p className={`text-sm font-bold mt-1 ${getEfficiencyColor(operator.efficiency)}`}>
                      {operator.efficiency}% ⚡
                    </p>
                    <p className="text-xs text-gray-500">
                      {operator.workload}/{operator.maxWork} {currentLanguage === "np" ? 'कार्यभार' : 'load'}
                    </p>
                  </div>
                </div>

                {/* Drop zone hint */}
                {(operator.status === 'available' || operator.status === 'free') && (
                  <div className={`mt-3 border-2 border-dashed rounded-lg p-3 text-center font-medium transition-all ${
                    dropTarget === operator.id 
                      ? 'border-blue-400 bg-blue-50 text-blue-700 animate-pulse'
                      : 'border-green-300 text-green-600'
                  }`}>
                    {dropTarget === operator.id 
                      ? `🎯 ${currentLanguage === "np" ? "यहाँ छाड्नुहोस्!" : "Drop here!"}`
                      : `👆 ${currentLanguage === "np" ? "बंडल यहाँ छोड्नुहोस्" : "Drop bundle here"}`
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
          ⚡ {currentLanguage === "np" ? "क्विक एक्शन" : "Quick Actions"}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAssign('high-priority')}
            className="py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
          >
            🔴 {currentLanguage === "np" ? "उच्च प्राथमिकता" : "High Priority"}
          </button>
          <button 
            onClick={() => handleQuickAssign('match-machine')}
            className="py-3 px-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
          >
            🎯 {currentLanguage === "np" ? "मेसिन मेच" : "Match Machine"}
          </button>
          <button 
            onClick={() => handleQuickAssign('free-operators')}
            className="py-3 px-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
          >
            🆓 {currentLanguage === "np" ? "फ्री अपरेटर" : "Free Operators"}
          </button>
          <button 
            onClick={() => handleQuickAssign('balance-load')}
            className="py-3 px-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors"
          >
            ⚖️ {currentLanguage === "np" ? "लोड बैलेन्स" : "Balance Load"}
          </button>
        </div>
      </div>

      {/* Simple Instructions */}
      <div className="bg-blue-600 text-white rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">👆</div>
        <h4 className="text-xl font-bold mb-3">
          {currentLanguage === "np" ? "कसरी असाइन गर्ने" : "How to Assign"}
        </h4>
        <div className="text-lg space-y-2">
          <p>📦 {currentLanguage === "np" ? "बंडल तान्नुहोस्" : "Drag bundles from left"}</p>
          <p>👤 {currentLanguage === "np" ? "अपरेटरमा छोड्नुहोस्" : "Drop on operators on right"}</p>
          <p>✅ {currentLanguage === "np" ? "वा क्विक एक्शन प्रयोग गर्नुहोस्" : "Or use quick actions above"}</p>
        </div>
      </div>
    </div>
  );
};

export default WorkAssignmentSystem;