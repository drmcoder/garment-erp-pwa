import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import { WIPService } from '../../services/firebase-services';
import BundleWorkflowCards from '../common/BundleWorkflowCards';
import ProcessFlowChart from '../common/ProcessFlowChart';

const WIPProgressTracker = ({ onClose }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  const isNepali = currentLanguage === 'np';
  
  const [wipEntries, setWipEntries] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'timeline', 'journey', 'process_flow'
  const [groupBy, setGroupBy] = useState('lot'); // 'lot', 'roll', 'article'
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const loadProgressData = useCallback(async (forceRefresh = false) => {
    // Don't fetch if data was recently loaded and not forcing refresh
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < 30000) { // 30 seconds cache
      console.log('🔄 Using cached WIP progress data (less than 30s old)');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔄 Loading WIP progress data from Firestore...');
      
      // Load WIP entries and work items from Firestore
      const [wipResult, workItemsResult] = await Promise.all([
        WIPService.getAllWIPEntries(),
        WIPService.getWorkItemsFromWIP()
      ]);
      
      let savedWipEntries = [];
      let savedWorkItems = [];
      
      // Fix: Service returns 'wipEntries', not 'entries'
      if (wipResult.success && wipResult.wipEntries && Array.isArray(wipResult.wipEntries)) {
        savedWipEntries = wipResult.wipEntries;
        console.log('✅ Loaded WIP entries:', savedWipEntries.length);
      } else {
        console.warn('⚠️ WIP entries not found or not an array:', wipResult);
        savedWipEntries = [];
      }
      
      if (workItemsResult.success && workItemsResult.workItems && Array.isArray(workItemsResult.workItems)) {
        savedWorkItems = workItemsResult.workItems;
        console.log('✅ Loaded work items:', savedWorkItems.length);
      } else {
        console.warn('⚠️ Work items not found or not an array:', workItemsResult);
        savedWorkItems = [];
      }
      
      // Enhance WIP entries with progress calculations
      const enhancedWipEntries = (savedWipEntries || []).map(wip => {
        const wipWorkItems = (savedWorkItems || []).filter(item => 
          item && item.lotNumber && wip && wip.lotNumber && item.lotNumber === wip.lotNumber
        );
        const progress = calculateWIPProgress(wip, wipWorkItems);
        
        return {
          ...wip,
          progress,
          workItems: wipWorkItems
        };
      });

      setWipEntries(enhancedWipEntries);
      setLastFetched(Date.now());
      
      addError({
        message: `${isNepali ? 'लोड गरियो' : 'Loaded'} ${enhancedWipEntries.length} ${isNepali ? 'WIP एन्ट्री' : 'WIP entries'}`,
        component: 'WIPProgressTracker',
        action: 'Load Data'
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
      
    } catch (error) {
      console.error('❌ Error loading progress data:', error);
      addError({
        message: 'Failed to load progress data',
        component: 'WIPProgressTracker',
        action: 'Load Data',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    } finally {
      setIsLoading(false);
    }
  }, [addError, isNepali, lastFetched]);

  // Load data only once when component mounts
  useEffect(() => {
    loadProgressData();
  }, []); // Empty dependency array - only run once on mount

  const calculateWIPProgress = (wip, wipWorkItems) => {
    if (!wipWorkItems || !Array.isArray(wipWorkItems) || !wipWorkItems.length) {
      return {
        totalOperations: 0,
        completedOperations: 0,
        inProgressOperations: 0,
        pendingOperations: 0,
        progressPercentage: 0,
        status: 'not_started',
        currentOperation: null,
        estimatedCompletion: null
      };
    }

    const totalOperations = wipWorkItems.length;
    const completedOperations = wipWorkItems.filter(item => item.status === 'completed').length;
    const inProgressOperations = wipWorkItems.filter(item => item.status === 'in_progress' || item.status === 'assigned').length;
    const pendingOperations = wipWorkItems.filter(item => item.status === 'ready' || item.status === 'waiting').length;
    
    const progressPercentage = totalOperations > 0 ? Math.round((completedOperations / totalOperations) * 100) : 0;
    
    // Determine overall status
    let status = 'not_started';
    if (completedOperations === totalOperations) {
      status = 'completed';
    } else if (completedOperations > 0 || inProgressOperations > 0) {
      status = 'in_progress';
    }

    // Find current operation (lowest sequence in progress or next ready)
    const currentOperation = wipWorkItems
      .filter(item => item.status === 'in_progress' || item.status === 'assigned')
      .sort((a, b) => a.sequence - b.sequence)[0] ||
      wipWorkItems
        .filter(item => item.status === 'ready')
        .sort((a, b) => a.sequence - b.sequence)[0];

    return {
      totalOperations,
      completedOperations,
      inProgressOperations,
      pendingOperations,
      progressPercentage,
      status,
      currentOperation,
      estimatedCompletion: calculateEstimatedCompletion(wipWorkItems)
    };
  };

  const calculateEstimatedCompletion = (wipWorkItems) => {
    const remainingItems = wipWorkItems.filter(item => 
      item.status !== 'completed' && item.status !== 'cancelled'
    );
    
    if (remainingItems.length === 0) return new Date();
    
    const totalRemainingTime = remainingItems.reduce((sum, item) => sum + (item.estimatedTime || 0), 0);
    const estimatedCompletion = new Date();
    estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + totalRemainingTime);
    
    return estimatedCompletion;
  };

  const getStatusColor = (status) => {
    const colors = {
      'not_started': 'bg-gray-100 text-gray-800 border-gray-200',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'on_hold': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status] || colors['not_started'];
  };

  const getStatusText = (status) => {
    const texts = {
      'not_started': isNepali ? 'सुरु नभएको' : 'Not Started',
      'in_progress': isNepali ? 'प्रगतिमा' : 'In Progress',
      'completed': isNepali ? 'सम्पन्न' : 'Completed',
      'cancelled': isNepali ? 'रद्द' : 'Cancelled',
      'on_hold': isNepali ? 'रोकिएको' : 'On Hold'
    };
    return texts[status] || status;
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString(isNepali ? 'ne-NP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredWipEntries = (wipEntries || []).filter(wip => {
    if (statusFilter === 'all') return true;
    return wip.progress?.status === statusFilter;
  });

  // Group data based on selected groupBy option
  const getGroupedData = () => {
    if (groupBy === 'lot') {
      return filteredWipEntries;
    } else if (groupBy === 'roll') {
      // Group by roll number within each lot
      const grouped = [];
      filteredWipEntries.forEach(wip => {
        const rollGroups = {};
        wip.parsedStyles?.forEach(style => {
          const rollNumber = style.rollNumber || 'Roll-1';
          if (!rollGroups[rollNumber]) {
            rollGroups[rollNumber] = {
              ...wip,
              id: `${wip.id}-${rollNumber}`,
              lotNumber: `${wip.lotNumber}-${rollNumber}`,
              rollNumber,
              parsedStyles: [],
              totalPieces: 0
            };
          }
          rollGroups[rollNumber].parsedStyles.push(style);
          rollGroups[rollNumber].totalPieces += style.totalPieces || 0;
        });
        grouped.push(...Object.values(rollGroups));
      });
      return grouped;
    } else if (groupBy === 'article') {
      // Group by article within each lot
      const grouped = [];
      filteredWipEntries.forEach(wip => {
        wip.parsedStyles?.forEach(style => {
          grouped.push({
            ...wip,
            id: `${wip.id}-${style.articleNumber}`,
            lotNumber: `${wip.lotNumber}-${style.articleNumber}`,
            articleNumber: style.articleNumber,
            parsedStyles: [style],
            totalPieces: style.totalPieces || 0
          });
        });
      });
      return grouped;
    }
    return filteredWipEntries;
  };

  const groupedData = getGroupedData();

  const ProgressBar = ({ progress }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  const WIPOverviewCard = ({ wip }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedLot(wip)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{wip.lotNumber}</h3>
          <p className="text-sm text-gray-600">{wip.fabricName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(wip.progress?.status)}`}>
          {getStatusText(wip.progress?.status)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {isNepali ? 'प्रगति' : 'Progress'}
          </span>
          <span className="text-sm font-bold text-blue-600">
            {wip.progress?.progressPercentage || 0}%
          </span>
        </div>
        <ProgressBar progress={wip.progress?.progressPercentage || 0} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {wip.progress?.completedOperations || 0}
          </div>
          <div className="text-xs text-gray-500">
            {isNepali ? 'सम्पन्न' : 'Completed'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {wip.progress?.inProgressOperations || 0}
          </div>
          <div className="text-xs text-gray-500">
            {isNepali ? 'प्रगतिमा' : 'In Progress'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {wip.progress?.pendingOperations || 0}
          </div>
          <div className="text-xs text-gray-500">
            {isNepali ? 'बाँकी' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Current Operation */}
      {wip.progress?.currentOperation && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{wip.progress.currentOperation.icon}</span>
            <div>
              <div className="text-sm font-medium text-blue-900">
                {isNepali ? 'हालको काम:' : 'Current:'}
              </div>
              <div className="text-sm text-blue-700">
                {wip.progress.currentOperation.operationName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Info */}
      <div className="mt-3 flex flex-wrap gap-2">
        {wip.parsedStyles?.slice(0, 2).map((style, index) => (
          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
            {style.articleNumber}
          </span>
        ))}
        {wip.parsedStyles?.length > 2 && (
          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
            +{wip.parsedStyles.length - 2} more
          </span>
        )}
      </div>
    </div>
  );

  const DetailedLotView = ({ lot }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{lot.lotNumber}</h2>
          <p className="text-gray-600">{lot.fabricName} • {lot.nepaliDate}</p>
        </div>
        <button
          onClick={() => setSelectedLot(null)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">
            {isNepali ? 'समग्र प्रगति' : 'Overall Progress'}
          </h3>
          <span className="text-2xl font-bold text-blue-600">
            {lot.progress?.progressPercentage || 0}%
          </span>
        </div>
        <ProgressBar progress={lot.progress?.progressPercentage || 0} />
        
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {lot.progress?.completedOperations || 0}
            </div>
            <div className="text-sm text-green-700">
              {isNepali ? 'सम्पन्न' : 'Completed'}
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {lot.progress?.inProgressOperations || 0}
            </div>
            <div className="text-sm text-blue-700">
              {isNepali ? 'प्रगतिमा' : 'In Progress'}
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {lot.progress?.pendingOperations || 0}
            </div>
            <div className="text-sm text-orange-700">
              {isNepali ? 'बाँकी' : 'Pending'}
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {lot.progress?.totalOperations || 0}
            </div>
            <div className="text-sm text-purple-700">
              {isNepali ? 'जम्मा' : 'Total'}
            </div>
          </div>
        </div>
      </div>

      {/* Operations Timeline */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {isNepali ? 'सञ्चालन टाइमलाइन' : 'Operations Timeline'}
        </h3>
        <div className="space-y-4">
          {lot.workItems?.sort((a, b) => a.sequence - b.sequence).map((workItem, index) => (
            <div key={workItem.id} className="flex items-center space-x-4">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  workItem.status === 'completed' ? 'bg-green-500' :
                  workItem.status === 'in_progress' || workItem.status === 'assigned' ? 'bg-blue-500' :
                  'bg-gray-300'
                }`}>
                  {workItem.sequence}
                </div>
                {index < lot.workItems.length - 1 && (
                  <div className={`w-0.5 h-8 ${
                    workItem.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>

              {/* Operation details */}
              <div className="flex-1 bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{workItem.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {workItem.operationName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workItem.machineType} • {workItem.pieces} pieces • {workItem.estimatedTime} min
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(workItem.status)}`}>
                      {getStatusText(workItem.status)}
                    </span>
                    {workItem.assignedOperator && (
                      <div className="text-xs text-gray-500 mt-1">
                        {workItem.assignedOperator}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Completion */}
      {lot.progress?.estimatedCompletion && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <div className="font-medium text-blue-900">
                {isNepali ? 'अनुमानित समाप्ति:' : 'Estimated Completion:'}
              </div>
              <div className="text-blue-700">
                {formatTime(lot.progress.estimatedCompletion)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                📊 {isNepali ? 'WIP प्रगति ट्र्याकर' : 'WIP Progress Tracker'}
              </h1>
              <p className="text-green-100">
                {isNepali ? 'लट र बन्डलको प्रगति हेर्नुहोस्' : 'Track lot and bundle progress'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => {
                    console.log('🔄 Switching to overview view (using cached data)');
                    setViewMode('overview');
                  }}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'overview'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  📋 {isNepali ? 'सारांश' : 'Overview'}
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Switching to timeline view (using cached data)');
                    setViewMode('timeline');
                  }}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'timeline'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  📅 {isNepali ? 'टाइमलाइन' : 'Timeline'}
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Switching to journey view (using cached data)');
                    setViewMode('journey');
                  }}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'journey'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  🔄 {isNepali ? 'यात्रा' : 'Journey'}
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Switching to process flow view (using cached data)');
                    setViewMode('process_flow');
                  }}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'process_flow'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  🔄 {isNepali ? 'प्रक्रिया फ्लो' : 'Process Flow'}
                </button>
              </div>

              {/* Group By Toggle */}
              <div className="flex bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => {
                    console.log('🔄 Grouping by lot (using cached data)');
                    setGroupBy('lot');
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    groupBy === 'lot'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  {isNepali ? 'लटवार' : 'Lot-wise'}
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Grouping by roll (using cached data)');
                    setGroupBy('roll');
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    groupBy === 'roll'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  {isNepali ? 'रोलवार' : 'Roll-wise'}
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 Grouping by article (using cached data)');
                    setGroupBy('article');
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    groupBy === 'article'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  {isNepali ? 'लेखवार' : 'Article-wise'}
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="text-white hover:bg-green-600 p-2 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-h-full">
          {selectedLot ? (
            <DetailedLotView lot={selectedLot} />
          ) : (
            <>
              {/* Controls */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border rounded px-3 py-2"
                    >
                      <option value="all">{isNepali ? 'सबै स्थिति' : 'All Status'}</option>
                      <option value="not_started">{isNepali ? 'सुरु नभएको' : 'Not Started'}</option>
                      <option value="in_progress">{isNepali ? 'प्रगतिमा' : 'In Progress'}</option>
                      <option value="completed">{isNepali ? 'सम्पन्न' : 'Completed'}</option>
                    </select>
                    
                    {/* Data Freshness Indicator */}
                    {lastFetched && (
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <span>📊</span>
                        <span>
                          {isNepali ? 'डेटा अपडेट:' : 'Data updated:'} 
                          {Math.floor((Date.now() - lastFetched) / 1000)}s {isNepali ? 'अघि' : 'ago'}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => loadProgressData(true)} // Force refresh
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{isNepali ? 'लोड गर्दै...' : 'Loading...'}</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>{isNepali ? 'रिफ्रेस' : 'Refresh'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Content based on view mode */}
              {viewMode === 'overview' && (
                /* WIP Entries Grid - Overview */
                groupedData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-lg font-medium mb-2">
                      {isNepali ? 'कुनै WIP एन्ट्री फेला परेन' : 'No WIP entries found'}
                    </p>
                    <p className="text-sm mb-6">
                      {isNepali 
                        ? 'प्रगति ट्र्याक गर्नको लागि पहिले WIP डेटा थप्नुहोस्'
                        : 'Add WIP data first to track progress'}
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">
                        {isNepali ? 'WIP डेटा थप्न:' : 'To add WIP data:'}
                      </p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>• {isNepali ? 'WIP डेटा इम्पोर्ट का प्रयोग गर्नुहोस्' : 'Use WIP Data Import'}</p>
                        <p>• {isNepali ? 'वा WIP डेटा प्रबन्धन मा जानुहोस्' : 'Or go to WIP Data Manager'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedData.map(wip => (
                      <WIPOverviewCard key={wip.id} wip={wip} />
                    ))}
                  </div>
                )
              )}

              {viewMode === 'timeline' && (
                /* Timeline View */
                <div className="space-y-6">
                  {groupedData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">📅</div>
                      <p className="text-lg font-medium mb-2">
                        {isNepali ? 'कुनै WIP एन्ट्री फेला परेन' : 'No WIP entries found'}
                      </p>
                    </div>
                  ) : (
                    groupedData.map(wip => (
                      <div key={wip.id} className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{wip.lotNumber}</h3>
                            <p className="text-sm text-gray-600">{wip.fabricName} • {wip.progress?.progressPercentage || 0}% complete</p>
                          </div>
                          <button
                            onClick={() => setSelectedLot(wip)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {isNepali ? 'विस्तार देख्नुहोस्' : 'View Details'}
                          </button>
                        </div>
                        
                        {/* Mini timeline */}
                        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                          {wip.workItems?.sort((a, b) => a.sequence - b.sequence).slice(0, 8).map((item, index) => (
                            <div key={item.id} className="flex-shrink-0 flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                item.status === 'completed' ? 'bg-green-500 text-white' :
                                item.status === 'in_progress' ? 'bg-blue-500 text-white' :
                                'bg-gray-300 text-gray-600'
                              }`}>
                                {item.sequence}
                              </div>
                              {index < Math.min(wip.workItems.length - 1, 7) && (
                                <div className={`w-4 h-0.5 ${
                                  item.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                                }`}></div>
                              )}
                            </div>
                          ))}
                          {wip.workItems?.length > 8 && (
                            <div className="text-xs text-gray-500">+{wip.workItems.length - 8} more</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {viewMode === 'journey' && (
                /* Journey Flow View */
                <div className="space-y-6">
                  {groupedData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">🔄</div>
                      <p className="text-lg font-medium mb-2">
                        {isNepali ? 'कुनै WIP एन्ट्री फेला परेन' : 'No WIP entries found'}
                      </p>
                    </div>
                  ) : (
                    groupedData.map(wip => (
                      <div key={wip.id} className="bg-gray-50 rounded-lg p-4">
                        <BundleWorkflowCards
                          bundle={{
                            bundleId: wip.lotNumber,
                            articleNumber: wip.parsedStyles?.[0]?.articleNumber || 'Multiple Articles',
                            color: wip.parsedStyles?.[0]?.color || 'Mixed',
                            size: wip.parsedStyles?.[0]?.size || 'Various',
                            pieces: wip.totalPieces || wip.parsedStyles?.reduce((sum, style) => sum + (style.totalPieces || 0), 0) || 0
                          }}
                          workItems={wip.workItems || []}
                          onOperationClick={(operation) => {
                            setSelectedLot(wip);
                          }}
                          onStatusUpdate={(operationId, newStatus) => {
                            // Update the work item status in the WIP entry
                            const updatedEntries = wipEntries.map(entry => {
                              if (entry.id === wip.id) {
                                const updatedWorkItems = entry.workItems?.map(item => 
                                  item.id === operationId ? { ...item, status: newStatus } : item
                                ) || [];
                                
                                // Recalculate progress
                                const progress = calculateWIPProgress(entry, updatedWorkItems);
                                
                                return {
                                  ...entry,
                                  workItems: updatedWorkItems,
                                  progress
                                };
                              }
                              return entry;
                            });
                            setWipEntries(updatedEntries);
                          }}
                          showProgress={true}
                          compact={true}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {viewMode === 'process_flow' && (
                /* Process Flow Chart View */
                <div className="space-y-8">
                  {groupedData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">🔄</div>
                      <p className="text-lg font-medium mb-2">
                        {isNepali ? 'कुनै WIP एन्ट्री फेला परेन' : 'No WIP entries found'}
                      </p>
                    </div>
                  ) : (
                    groupedData.map(wip => (
                      <ProcessFlowChart
                        key={wip.id}
                        wipEntry={wip}
                        onStepClick={(step) => {
                          setSelectedLot(wip);
                        }}
                        onStatusUpdate={(stepId, newStatus) => {
                          // Update the work item status in the WIP entry
                          const updatedEntries = wipEntries.map(entry => {
                            if (entry.id === wip.id) {
                              const updatedWorkItems = entry.workItems?.map(item => 
                                item.id === stepId ? { ...item, status: newStatus } : item
                              ) || [];
                              
                              // Recalculate progress
                              const progress = calculateWIPProgress(entry, updatedWorkItems);
                              
                              return {
                                ...entry,
                                workItems: updatedWorkItems,
                                progress
                              };
                            }
                            return entry;
                          });
                          setWipEntries(updatedEntries);
                        }}
                        showDetails={true}
                        compact={false}
                      />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WIPProgressTracker;