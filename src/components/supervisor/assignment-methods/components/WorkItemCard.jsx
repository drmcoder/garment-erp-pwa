import React from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { getMachineTypeIcon, getMachineTypeName } from '../../../../constants/machineTypes';

const WorkItemCard = ({ item, viewMode, onDragStart, onDragEnd }) => {
  const { currentLanguage } = useLanguage();

  const cardContent = () => {
    switch (viewMode) {
      case 'mini':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="text-sm">{getMachineTypeIcon(item.machineType)}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 truncate">#{item.bundleNumber}</div>
                <div className="text-xs text-gray-600 truncate">{item.articleName}</div>
              </div>
            </div>
            <div className="text-right ml-2">
              <div className="text-xs font-medium text-blue-600">{item.pieces}p</div>
              <div className="text-xs text-gray-500">{item.estimatedTime}m</div>
            </div>
          </div>
        );

      case 'compact':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <div className="font-medium text-gray-800">#{item.bundleNumber}</div>
                  <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {item.lotNumber ? `L${item.lotNumber}` : 'No Lot'}
                  </div>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {item.articleName} | {item.procedureName || item.operation || 'No Operation'}
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                  <span>📦 {item.pieces}pcs</span>
                  <span>⏱️ {item.estimatedTime}min</span>
                  <span>🎨 {item.color || 'No Color'}</span>
                  <span>📏 {item.size}</span>
                </div>
              </div>
            </div>
            <div className="text-right ml-2">
              <span className="text-xs text-gray-400">👆</span>
            </div>
          </div>
        );

      default: // detailed
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getMachineTypeIcon(item.machineType)}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="font-semibold text-gray-800">Bundle #{item.bundleNumber}</div>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {item.lotNumber ? `Lot ${item.lotNumber}` : 'No Lot Number'}
                  </div>
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    {item.machineType}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Article:</span>
                    <span className="ml-1 text-gray-600">{item.articleName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Operation:</span>
                    <span className="ml-1 text-gray-600">{item.procedureName || item.operation || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Size:</span>
                    <span className="ml-1 text-gray-600">{item.size}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Color:</span>
                    <span className="ml-1 text-gray-600">{item.color || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">📦 {item.pieces} pieces</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">⏱️ {item.estimatedTime} min</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">🏭 {item.machineType}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs text-gray-400">
                {currentLanguage === 'np' ? 'ड्र्याग गर्नुहोस्' : 'Drag me'}
              </span>
              <span className="text-lg">👆</span>
            </div>
          </div>
        );
    }
  };

  const containerClasses = viewMode === 'mini' 
    ? "border border-gray-200 rounded p-2 cursor-grab hover:border-blue-300 hover:shadow-sm transition-all duration-150 bg-white text-xs"
    : viewMode === 'compact'
    ? "border border-gray-200 rounded-lg p-3 cursor-grab hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-gradient-to-r from-white to-blue-50"
    : "border border-gray-200 rounded-lg p-4 cursor-grab hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-gradient-to-r from-white to-blue-50";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragEnd={onDragEnd}
      className={containerClasses}
    >
      {cardContent()}
    </div>
  );
};

export default WorkItemCard;