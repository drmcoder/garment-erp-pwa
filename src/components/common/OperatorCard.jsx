import React from 'react';
import OperatorAvatar from './OperatorAvatar';

const OperatorCard = ({ 
  operator, 
  selected = false, 
  onClick = null,
  showDetails = true,
  showWorkload = true,
  compact = false 
}) => {
  const { isNepali } = { isNepali: false }; // TODO: Get from LanguageContext
  
  const statusLabels = {
    available: { en: 'Available', np: 'उपलब्ध' },
    busy: { en: 'Busy', np: 'व्यस्त' },
    offline: { en: 'Offline', np: 'अफलाइन' },
    break: { en: 'Break', np: 'विश्राम' }
  };

  const skillLevelLabels = {
    beginner: { en: 'Beginner', np: 'नौसिखिया' },
    intermediate: { en: 'Intermediate', np: 'मध्यम' },
    expert: { en: 'Expert', np: 'विशेषज्ञ' }
  };

  const machineTypeLabels = {
    overlock: { en: 'Overlock', np: 'ओभरलक' },
    flatlock: { en: 'Flatlock', np: 'फ्ल्याटलक' },
    coverStitch: { en: 'Cover Stitch', np: 'कभर स्टिच' }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-50';
      case 'busy': return 'text-yellow-600 bg-yellow-50';
      case 'offline': return 'text-gray-600 bg-gray-50';
      case 'break': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (compact) {
    return (
      <div 
        className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
          selected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
        onClick={onClick}
        style={{ borderColor: selected ? operator.profileColor : undefined }}
      >
        <OperatorAvatar 
          operator={operator} 
          size="sm" 
          showStatus={true}
          showWorkload={showWorkload}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {isNepali ? operator.nameNepali : operator.name}
          </p>
          <p className="text-sm text-gray-500">
            {isNepali ? machineTypeLabels[operator.machine]?.np : machineTypeLabels[operator.machine]?.en || operator.machine}
          </p>
        </div>
        {operator.favoriteOperator && (
          <span className="text-yellow-500" title="Favorite operator">⭐</span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onClick}
      style={{ 
        borderColor: selected ? operator.profileColor : undefined,
        backgroundColor: selected ? `${operator.profileColor}10` : undefined 
      }}
    >
      {/* Header with Avatar and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <OperatorAvatar 
            operator={operator} 
            size="lg" 
            showStatus={true}
            showWorkload={showWorkload}
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {isNepali ? operator.nameNepali : operator.name}
            </h3>
            <p className="text-sm text-gray-600">
              {isNepali ? machineTypeLabels[operator.machine]?.np : machineTypeLabels[operator.machine]?.en || operator.machine}
            </p>
          </div>
        </div>
        
        {/* Favorite indicator */}
        {operator.favoriteOperator && (
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500 text-lg" title="Favorite operator">⭐</span>
          </div>
        )}
      </div>

      {/* Status and Details */}
      {showDetails && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(operator.status)}`}
            >
              {isNepali ? statusLabels[operator.status]?.np : statusLabels[operator.status]?.en || operator.status}
            </span>
            
            <span className="text-xs text-gray-500">
              {isNepali ? skillLevelLabels[operator.skillLevel]?.np : skillLevelLabels[operator.skillLevel]?.en || operator.skillLevel}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">{isNepali ? 'दक्षता' : 'Efficiency'}:</span>
              <span className="font-medium ml-1">{operator.currentEfficiency}%</span>
            </div>
            <div>
              <span className="text-gray-500">{isNepali ? 'गुणस्तर' : 'Quality'}:</span>
              <span className="font-medium ml-1">{operator.qualityScore}%</span>
            </div>
          </div>

          {/* Visual badges */}
          {operator.visualBadges && operator.visualBadges.length > 0 && (
            <div className="flex space-x-1 mt-2 justify-center">
              {operator.visualBadges.map((badge, index) => (
                <span key={index} className="text-sm" title="Achievement badge">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OperatorCard;