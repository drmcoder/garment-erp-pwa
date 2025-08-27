import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useDragDropAssignment } from './hooks/useDragDropAssignment';
import WorkItemSearch from './components/WorkItemSearch';
import WorkItemCard from './components/WorkItemCard';
import OperatorCard from './components/OperatorCard';
import AssignmentPreview from './components/AssignmentPreview';

const DragDropAssignmentModular = ({ workItems, operators, onAssignmentComplete }) => {
  const { currentLanguage } = useLanguage();
  
  const {
    // State
    draggedItem,
    dragOverOperator,
    assignments,
    workItemSearch,
    operatorSearch,
    operatorViewMode,
    workItemViewMode,
    currentWorkPage,
    
    // Data
    filteredWorkItems,
    paginatedWorkItems,
    sortedOperators,
    totalWorkPages,
    availableItems,
    
    // Handlers
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleBulkConfirm,
    handleRemoveAssignment,
    
    // Setters
    setWorkItemSearch,
    setOperatorSearch,
    setOperatorViewMode,
    setWorkItemViewMode,
    setCurrentWorkPage,
    
    // Utils
    isCompatibleOperator
  } = useDragDropAssignment(workItems, operators, onAssignmentComplete);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              🎯 {currentLanguage === 'np' ? 'ड्र्याग एन्ड ड्रप असाइनमेन्ट' : 'Drag & Drop Assignment'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'np' 
                ? 'काम आइटमहरू अपरेटरहरूमा ड्र्याग गर्नुहोस्'
                : 'Drag work items to operators for assignment'
              }
            </p>
            {(workItemSearch.trim() || operatorSearch.trim()) && (
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>🔍 {currentLanguage === 'np' ? 'खोज परिणामहरू:' : 'Search results:'}</span>
                {workItemSearch.trim() && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {currentLanguage === 'np' ? 'काम:' : 'Items:'} {filteredWorkItems.length}/{availableItems.length}
                  </span>
                )}
                {operatorSearch.trim() && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                    {currentLanguage === 'np' ? 'अपरेटर:' : 'Operators:'} {sortedOperators.length}/{operators.length}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {Object.keys(assignments).length > 0 && (
            <button
              onClick={handleBulkConfirm}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>✅</span>
              <span>
                {currentLanguage === 'np' 
                  ? `${Object.keys(assignments).length} असाइनमेन्ट पुष्टि गर्नुहोस्`
                  : `Confirm ${Object.keys(assignments).length} Assignments`
                }
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Work Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📦</span>
            {currentLanguage === 'np' ? 'उपलब्ध काम आइटमहरू' : 'Available Work Items'}
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              {filteredWorkItems.length}/{availableItems.length}
            </span>
            {filteredWorkItems.length > 50 && (
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {currentLanguage === 'np' ? 'पृष्ठ' : 'Page'} {currentWorkPage}/{totalWorkPages}
              </span>
            )}
          </h3>
          
          <WorkItemSearch
            searchValue={workItemSearch}
            onSearchChange={setWorkItemSearch}
            viewMode={workItemViewMode}
            onViewModeChange={setWorkItemViewMode}
            currentPage={currentWorkPage}
            totalPages={totalWorkPages}
            onPageChange={setCurrentWorkPage}
            resultsCount={filteredWorkItems.length}
            totalCount={availableItems.length}
          />
          
          <div className="max-h-96 overflow-y-auto">
            {filteredWorkItems.length === 0 && workItemSearch.trim() && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">🔍</span>
                <p className="mt-2">
                  {currentLanguage === 'np' 
                    ? 'कुनै काम आइटम भेटिएन'
                    : 'No work items found'
                  }
                </p>
                <p className="text-sm mt-1">
                  {currentLanguage === 'np' 
                    ? 'खोज शब्द बदल्नुहोस्'
                    : 'Try different search terms'
                  }
                </p>
              </div>
            )}

            {workItemViewMode === 'mini' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {paginatedWorkItems.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    viewMode={workItemViewMode}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            ) : (
              <div className={workItemViewMode === 'compact' ? 'space-y-2' : 'space-y-3'}>
                {paginatedWorkItems.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    viewMode={workItemViewMode}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}

            {paginatedWorkItems.length === 0 && !workItemSearch.trim() && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">📦</span>
                <p className="mt-2">
                  {currentLanguage === 'np' 
                    ? 'कुनै काम आइटम उपलब्ध छैन'
                    : 'No work items available'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Operators Drop Zones */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👥</span>
            {currentLanguage === 'np' ? 'अपरेटरहरू' : 'Operators'}
            <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
              {sortedOperators.length}/{operators.length}
            </span>
          </h3>

          {/* Operators Search and View Controls */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <input
                type="text"
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                placeholder={currentLanguage === 'np' 
                  ? 'अपरेटर नाम, मेसिन वा ID खोज्नुहोस्...'
                  : 'Search by name, machine, or ID...'
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              {operatorSearch && (
                <button
                  onClick={() => setOperatorSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {currentLanguage === 'np' ? 'दृश्य:' : 'View:'}
              </span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOperatorViewMode('grid')}
                  className={`px-3 py-1 text-xs ${operatorViewMode === 'grid' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  📋 {currentLanguage === 'np' ? 'ग्रिड' : 'Grid'}
                </button>
                <button
                  onClick={() => setOperatorViewMode('compact')}
                  className={`px-3 py-1 text-xs ${operatorViewMode === 'compact' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  📄 {currentLanguage === 'np' ? 'संकुचित' : 'Compact'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {sortedOperators.length === 0 && operatorSearch.trim() && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">🔍</span>
                <p className="mt-2">
                  {currentLanguage === 'np' 
                    ? 'कुनै अपरेटर भेटिएन'
                    : 'No operators found'
                  }
                </p>
                <p className="text-sm mt-1">
                  {currentLanguage === 'np' 
                    ? 'खोज शब्द बदल्नुहोस्'
                    : 'Try different search terms'
                  }
                </p>
              </div>
            )}
            
            {operatorViewMode === 'compact' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortedOperators.map((operator) => {
                  const isCompatible = !draggedItem || isCompatibleOperator(draggedItem, operator.id);
                  return (
                    <OperatorCard
                      key={operator.id}
                      operator={operator}
                      viewMode={operatorViewMode}
                      dragOverOperator={dragOverOperator}
                      isCompatible={isCompatible}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedOperators.map((operator) => {
                  const isCompatible = !draggedItem || isCompatibleOperator(draggedItem, operator.id);
                  return (
                    <OperatorCard
                      key={operator.id}
                      operator={operator}
                      viewMode={operatorViewMode}
                      dragOverOperator={dragOverOperator}
                      isCompatible={isCompatible}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Preview */}
      <AssignmentPreview
        assignments={assignments}
        onRemoveAssignment={handleRemoveAssignment}
        onBulkConfirm={handleBulkConfirm}
      />
    </div>
  );
};

export default DragDropAssignmentModular;