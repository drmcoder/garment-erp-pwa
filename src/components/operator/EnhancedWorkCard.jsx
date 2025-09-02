// File: src/components/operator/EnhancedWorkCard.jsx
// Enhanced work card with prominent color, size, rate, earnings, and time info

import React, { useState } from 'react';
import { Clock, DollarSign, Palette, Shirt, Calendar, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import DamageReportModal from './DamageReportModal';

const EnhancedWorkCard = ({ workItem, index, onComplete, onStart, onDamageReported, showTimeInfo = true }) => {
  const { t, currentLanguage, formatNumber, formatCurrency, formatRelativeTime } = useLanguage();
  const [showDamageModal, setShowDamageModal] = useState(false);

  // Use centralized time formatting from LanguageContext
  const getTimeAgo = (date) => {
    return formatRelativeTime(date);
  };

  // Get color indicator
  const getColorIndicator = (color) => {
    const colorMap = {
      'black': '#000000',
      'white': '#FFFFFF', 
      'red': '#DC2626',
      'blue': '#2563EB',
      'green': '#16A34A',
      'yellow': '#EAB308',
      'purple': '#9333EA',
      'pink': '#EC4899',
      'orange': '#EA580C',
      'gray': '#6B7280',
      'brown': '#A16207',
      'navy': '#1E3A8A',
      'color 1': '#3B82F6',
      'color 2': '#EF4444',
      '1clr': '#8B5CF6'
    };
    
    return colorMap[color?.toLowerCase()] || '#6B7280';
  };

  // Get size display
  const getSizeDisplay = (size) => {
    const sizeMap = {
      'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL',
      'Small': 'S', 'Medium': 'M', 'Large': 'L'
    };
    return sizeMap[size] || size || 'M';
  };

  // Calculate earnings
  const calculateEarnings = () => {
    const rate = parseFloat(workItem.rate) || 0;
    const pieces = parseInt(workItem.pieces) || 0;
    return rate * pieces;
  };

  const earnings = calculateEarnings();
  const timeAgo = getTimeAgo(workItem.assignedAt || workItem.createdAt);
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header with Status */}
      <div className={`px-4 py-3 ${
        workItem.status === 'in_progress' 
          ? 'bg-gradient-to-r from-green-500 to-green-600' 
          : workItem.status === 'completed'
          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
          : 'bg-gradient-to-r from-orange-500 to-orange-600'
      } text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">
              {workItem.status === 'in_progress' && '🚀 Currently Working On'}
              {workItem.status === 'completed' && '🏁 Complete'}
              {workItem.status === 'assigned' && '📦 Ready to Start'}
            </div>
            <div className="text-lg font-bold">
              {workItem.bundleId || `B:${workItem.id?.slice(-4)}`}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-90">
              {currentLanguage === 'np' ? 'बकेट' : 'Bucket'} #{index + 1}
            </div>
            <div className={`w-3 h-3 rounded-full ${
              workItem.status === 'in_progress' ? 'bg-yellow-300 animate-pulse' : 'bg-white/30'
            }`}></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        
        {/* Color & Size - Prominent Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Color Indicator */}
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: getColorIndicator(workItem.color) }}
                title={workItem.color}
              ></div>
              <div className="text-lg font-bold text-gray-800">
                {workItem.color || 'N/A'}
              </div>
            </div>
            
            <div className="text-gray-300 text-2xl">•</div>
            
            {/* Size Display */}
            <div className="flex items-center space-x-2">
              <Shirt className="w-5 h-5 text-gray-500" />
              <div className="text-lg font-bold text-gray-800">
                {getSizeDisplay(workItem.size)}
              </div>
            </div>
          </div>
          
          {/* Time Info */}
          {showTimeInfo && timeAgo && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {timeAgo}
            </div>
          )}
        </div>

        {/* Operation */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">
            {currentLanguage === 'np' ? 'अपरेसन' : 'Operation'}
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {workItem.operation || workItem.currentOperation || 'side_seam'}
          </div>
        </div>

        {/* Pieces Count */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-700 mb-1">
            {currentLanguage === 'np' ? 'टुक्राहरू' : 'Pieces'}
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {formatNumber(workItem.pieces || 0)}
          </div>
        </div>

        {/* Rate & Earnings - Prominent */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-700 mb-1">
              {currentLanguage === 'np' ? 'दर' : 'Rate'}
            </div>
            <div className="text-xl font-bold text-green-800">
              {formatCurrency(workItem.rate || 0)}
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center text-sm text-yellow-700 mb-1">
              <DollarSign className="w-4 h-4 mr-1" />
              {currentLanguage === 'np' ? 'कमाई' : 'Earnings'}
            </div>
            <div className="text-xl font-bold text-yellow-800">
              {formatCurrency(earnings)}
            </div>
          </div>
        </div>

        {/* Progress Bar (if in progress) */}
        {workItem.status === 'in_progress' && workItem.completedPieces > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {workItem.completedPieces}/{workItem.pieces} 
                ({workItem.pieces > 0 ? Math.round((workItem.completedPieces / workItem.pieces) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${workItem.pieces > 0 ? (workItem.completedPieces / workItem.pieces) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {workItem.status === 'assigned' && (
            <button
              onClick={() => onStart?.(workItem)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>🚀</span>
              <span>{currentLanguage === 'np' ? 'काम सुरु गर्नुहोस्' : 'Start Work'}</span>
            </button>
          )}
          
          {workItem.status === 'in_progress' && (
            <div className="space-y-2">
              {/* Damage Reporting Button */}
              <button
                onClick={() => setShowDamageModal(true)}
                className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <AlertTriangle size={16} />
                <span>{currentLanguage === 'np' ? '🔧 क्षति रिपोर्ट गर्नुहोस्' : '🔧 Report Damage'}</span>
              </button>
              
              {/* Complete Work Button */}
              <button
                onClick={() => onComplete?.(workItem)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>🏁</span>
                <span>{currentLanguage === 'np' ? 'पूरा गर्नुहोस्' : 'Complete'}</span>
              </button>
            </div>
          )}
          
          {workItem.status === 'completed' && (
            <div className="text-center py-3 text-green-600 font-medium">
              ✅ {currentLanguage === 'np' ? 'पूरा भयो' : 'Completed'}
              {workItem.completedAt && (
                <div className="text-sm text-gray-500 mt-1">
                  {getTimeAgo(workItem.completedAt)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Damage Report Modal */}
      <DamageReportModal
        bundleData={workItem}
        isOpen={showDamageModal}
        onClose={() => setShowDamageModal(false)}
        onDamageReported={(damageReport) => {
          setShowDamageModal(false);
          onDamageReported?.(damageReport);
        }}
      />
    </div>
  );
};

// Workload Summary Component
export const WorkloadSummary = ({ activeWork, totalCapacity = 4 }) => {
  const { currentLanguage, formatNumber } = useLanguage();
  
  const activeCount = activeWork?.length || 0;
  const completedToday = activeWork?.filter(w => w.status === 'completed').length || 0;
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            🚀 {currentLanguage === 'np' ? 'हालको काम' : 'Currently Working On'}
          </h2>
          <div className="text-sm text-gray-600">
            {activeCount} {currentLanguage === 'np' ? 'काम बकेट सक्रिय' : 'work buckets active'}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {activeCount}/{totalCapacity}
          </div>
          <div className="text-sm text-gray-600">
            {currentLanguage === 'np' ? 'बकेट्स' : 'Buckets'}
          </div>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="mt-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{currentLanguage === 'np' ? 'कार्यभार' : 'Workload'}</span>
          <span>{formatNumber((activeCount/totalCapacity) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(activeCount/totalCapacity) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWorkCard;