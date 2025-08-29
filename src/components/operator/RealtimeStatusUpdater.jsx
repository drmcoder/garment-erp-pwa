// File: src/components/operator/RealtimeStatusUpdater.jsx
// Component for operators to update their status in real-time

import React, { useState, useEffect } from 'react';
import { Play, Pause, Coffee, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOperatorStatus } from '../../hooks/useRealtimeData';
import { hybridDataService } from '../../services/HybridDataService';

const RealtimeStatusUpdater = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get current operator status from Realtime DB
  const { operatorStatuses, updateStatus } = useOperatorStatus(user?.id);
  const currentStatus = operatorStatuses[user?.id] || {};

  // Update status in Realtime Database
  const handleStatusUpdate = async (newStatus, additionalData = {}) => {
    if (!user?.id) return;

    setIsUpdating(true);
    
    try {
      const statusData = {
        status: newStatus,
        machineType: user.machineType || 'unknown',
        stationId: user.station || 'default',
        efficiency: additionalData.efficiency || currentStatus.efficiency || 0,
        currentWork: additionalData.currentWork || currentStatus.currentWork,
        ...additionalData
      };

      const result = await updateStatus(statusData);
      
      if (result?.success) {
        console.log(`✅ Updated operator status to: ${newStatus}`);
      } else {
        console.error('❌ Failed to update status:', result?.error);
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Auto-update activity every 2 minutes when working
  useEffect(() => {
    if (currentStatus.status === 'working') {
      const interval = setInterval(() => {
        handleStatusUpdate('working', {
          lastActivity: new Date().toISOString()
        });
      }, 120000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [currentStatus.status]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'idle': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'working': return <Play className="w-4 h-4" />;
      case 'active': return <Settings className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'idle': return <Pause className="w-4 h-4" />;
      default: return <Pause className="w-4 h-4" />;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🔄 {currentLanguage === 'np' ? 'रियल-टाइम स्थिति' : 'Real-time Status'}
        </h3>
        
        {/* Current Status Display */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus.status || 'idle')}`}>
          {getStatusIcon(currentStatus.status || 'idle')}
          <span>{t(currentStatus.status || 'idle')}</span>
        </div>
      </div>

      {/* Status Update Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleStatusUpdate('working')}
          disabled={isUpdating || currentStatus.status === 'working'}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            currentStatus.status === 'working'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-50`}
        >
          <Play className="w-4 h-4" />
          <span>{currentLanguage === 'np' ? 'काम सुरु' : 'Start Work'}</span>
        </button>

        <button
          onClick={() => handleStatusUpdate('break')}
          disabled={isUpdating || currentStatus.status === 'break'}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            currentStatus.status === 'break'
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          } disabled:opacity-50`}
        >
          <Coffee className="w-4 h-4" />
          <span>{currentLanguage === 'np' ? 'बिश्राम' : 'Break'}</span>
        </button>

        <button
          onClick={() => handleStatusUpdate('active')}
          disabled={isUpdating || currentStatus.status === 'active'}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            currentStatus.status === 'active'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          <Settings className="w-4 h-4" />
          <span>{currentLanguage === 'np' ? 'तयार' : 'Ready'}</span>
        </button>

        <button
          onClick={() => handleStatusUpdate('idle')}
          disabled={isUpdating || currentStatus.status === 'idle'}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            currentStatus.status === 'idle'
              ? 'bg-gray-100 text-gray-700 border border-gray-300'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          } disabled:opacity-50`}
        >
          <Pause className="w-4 h-4" />
          <span>{currentLanguage === 'np' ? 'निष्क्रिय' : 'Idle'}</span>
        </button>
      </div>

      {/* Status Info */}
      {currentStatus.timestamp && (
        <div className="mt-4 text-sm text-gray-600">
          {currentLanguage === 'np' ? 'अन्तिम अपडेट:' : 'Last updated:'}{' '}
          {new Date(currentStatus.lastUpdated || currentStatus.timestamp).toLocaleTimeString()}
        </div>
      )}

      {isUpdating && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">
            {currentLanguage === 'np' ? 'अपडेट गर्दै...' : 'Updating...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RealtimeStatusUpdater;