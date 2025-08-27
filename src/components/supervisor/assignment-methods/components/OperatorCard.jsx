import React from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { getMachineTypeIcon, getMachineTypeName } from '../../../../constants/machineTypes';

const getOperatorLoadColor = (currentLoad, maxLoad) => {
  const percentage = (currentLoad / maxLoad) * 100;
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 70) return 'text-yellow-600';
  return 'text-green-600';
};

const OperatorCard = ({ 
  operator, 
  viewMode, 
  dragOverOperator, 
  isCompatible, 
  onDragOver, 
  onDragEnter, 
  onDragLeave, 
  onDrop 
}) => {
  const { currentLanguage } = useLanguage();

  if (viewMode === 'compact') {
    const workloadPercent = (operator.currentLoad / operator.maxLoad) * 100;
    
    return (
      <div
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, operator.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, operator.id)}
        className={`border rounded-md p-2 transition-all duration-150 text-xs ${
          dragOverOperator === operator.id && isCompatible
            ? 'border-green-400 bg-green-50'
            : dragOverOperator === operator.id
            ? 'border-red-400 bg-red-50'
            : isCompatible
            ? 'border-gray-300 hover:border-green-300 bg-white'
            : 'border-gray-200 bg-gray-50 opacity-60'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="text-sm">{getMachineTypeIcon(operator.machine)}</span>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800 truncate">{operator.name}</div>
              <div className="text-xs text-gray-500 truncate">{operator.machine}</div>
            </div>
          </div>
          <div className="text-right ml-2">
            <div className={`text-xs font-medium ${getOperatorLoadColor(operator.currentLoad, operator.maxLoad)}`}>
              {operator.todayCount || 0}
            </div>
            <div className="w-8 h-1 bg-gray-200 rounded mt-1">
              <div 
                className={`h-full rounded ${
                  workloadPercent >= 90 ? 'bg-red-500' : 
                  workloadPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, workloadPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (detailed)
  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, operator.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, operator.id)}
      className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
        dragOverOperator === operator.id && isCompatible
          ? 'border-green-400 bg-green-50'
          : dragOverOperator === operator.id
          ? 'border-red-400 bg-red-50'
          : isCompatible
          ? 'border-gray-300 hover:border-gray-400'
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getMachineTypeIcon(operator.machine)}</span>
          <div>
            <div className="font-medium text-gray-800 flex items-center space-x-2">
              <span>{operator.name}</span>
              {!isCompatible && (
                <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                  {currentLanguage === 'np' ? 'मेल नखान्छ' : 'Incompatible'}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{operator.machine}</div>
            <div className="flex items-center space-x-3 mt-1">
              <div className={`text-xs ${getOperatorLoadColor(operator.currentLoad, operator.maxLoad)}`}>
                📊 {operator.currentLoad}/{operator.maxLoad}
              </div>
              <div className="text-xs text-gray-500">
                ⚡ {operator.efficiency}%
              </div>
              <div className="text-xs text-blue-600 font-medium">
                📅 {operator.todayCount || 0} {currentLanguage === 'np' ? 'आज' : 'today'}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">
            {currentLanguage === 'np' ? 'यहाँ छोड्नुहोस्' : 'Drop here'}
          </div>
          {isCompatible && (
            <div className="text-xs text-green-600 mt-1">
              ✓ {currentLanguage === 'np' ? 'मेल खान्छ' : 'Compatible'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorCard;