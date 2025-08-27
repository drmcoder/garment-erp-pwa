import React from 'react';
import { useLanguage } from '../../../../context/LanguageContext';

const WorkItemSearch = ({ 
  searchValue, 
  onSearchChange, 
  viewMode, 
  onViewModeChange, 
  currentPage, 
  totalPages, 
  onPageChange,
  resultsCount,
  totalCount
}) => {
  const { currentLanguage } = useLanguage();

  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={currentLanguage === 'np' 
            ? 'लेख, लट, रंग, अपरेसन, बन्डल नम्बर खोज्नुहोस्...'
            : 'Search by article, lot, color, operation, bundle...'
          }
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔍</span>
        </div>
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {currentLanguage === 'np' ? 'दृश्य:' : 'View:'}
          </span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => onViewModeChange('detailed')}
              className={`px-3 py-1 text-xs ${viewMode === 'detailed' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📋 {currentLanguage === 'np' ? 'विस्तृत' : 'Detailed'}
            </button>
            <button
              onClick={() => onViewModeChange('compact')}
              className={`px-3 py-1 text-xs ${viewMode === 'compact' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📄 {currentLanguage === 'np' ? 'संकुचित' : 'Compact'}
            </button>
            <button
              onClick={() => onViewModeChange('mini')}
              className={`px-3 py-1 text-xs ${viewMode === 'mini' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📏 {currentLanguage === 'np' ? 'मिनी' : 'Mini'}
            </button>
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ‹ {currentLanguage === 'np' ? 'अघिल्लो' : 'Prev'}
            </button>
            <span className="text-xs text-gray-500">
              {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              {currentLanguage === 'np' ? 'अर्को' : 'Next'} ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkItemSearch;