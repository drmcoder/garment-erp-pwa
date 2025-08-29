// File: src/components/operator/OptimisticWorkAssignment.jsx
// Optimistic UI for work assignment with automatic rollback on conflicts

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import WorkAssignmentService from '../../services/WorkAssignmentService';

const OptimisticWorkAssignment = ({ workItem, onAssignmentChange }) => {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  
  const [assignmentState, setAssignmentState] = useState('available'); // available, assigning, assigned, failed
  const [conflictInfo, setConflictInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelfAssign = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    
    // Step 1: Optimistic UI update (immediate feedback)
    setAssignmentState('assigning');
    
    try {
      // Step 2: Attempt atomic assignment
      const result = await WorkAssignmentService.atomicSelfAssign(
        workItem.id,
        user.id,
        {
          name: user.name,
          machineType: user.machineType || 'unknown'
        }
      );

      if (result.success) {
        // Step 3a: Success - confirm assignment
        setAssignmentState('assigned');
        onAssignmentChange?.(workItem.id, 'assigned', user);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setAssignmentState('available');
        }, 3000);
        
      } else {
        // Step 3b: Conflict - show who got it
        setAssignmentState('failed');
        setConflictInfo({
          message: result.message,
          error: result.error
        });
        
        // Auto-reset after 5 seconds
        setTimeout(() => {
          setAssignmentState('available');
          setConflictInfo(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('Assignment error:', error);
      setAssignmentState('failed');
      setConflictInfo({
        message: 'System error occurred',
        error: error.message
      });
      
      setTimeout(() => {
        setAssignmentState('available');
        setConflictInfo(null);
      }, 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonContent = () => {
    switch (assignmentState) {
      case 'assigning':
        return (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>{currentLanguage === 'np' ? 'असाइन गर्दै...' : 'Assigning...'}</span>
          </div>
        );
        
      case 'assigned':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{currentLanguage === 'np' ? 'सफल!' : 'Success!'}</span>
          </div>
        );
        
      case 'failed':
        return (
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>{currentLanguage === 'np' ? 'असफल' : 'Failed'}</span>
          </div>
        );
        
      default:
        return (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{currentLanguage === 'np' ? 'असाइन गर्नुहोस्' : 'Self Assign'}</span>
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center";
    
    switch (assignmentState) {
      case 'assigning':
        return `${base} bg-blue-100 text-blue-700 cursor-not-allowed`;
      case 'assigned':
        return `${base} bg-green-500 text-white cursor-default`;
      case 'failed':
        return `${base} bg-red-500 text-white cursor-default`;
      default:
        return `${base} bg-blue-600 text-white hover:bg-blue-700 active:scale-95`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Assignment Button */}
      <button
        onClick={handleSelfAssign}
        disabled={isProcessing || assignmentState !== 'available'}
        className={getButtonStyles()}
      >
        {getButtonContent()}
      </button>
      
      {/* Conflict/Error Message */}
      {conflictInfo && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-800">
                {currentLanguage === 'np' ? 'असाइनमेन्ट असफल' : 'Assignment Failed'}
              </div>
              <div className="text-sm text-red-700 mt-1">
                {conflictInfo.message}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {assignmentState === 'assigned' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-green-800 font-medium">
              {currentLanguage === 'np' 
                ? 'काम सफलतापूर्वक असाइन भयो!' 
                : 'Work assigned successfully!'
              }
            </div>
          </div>
        </div>
      )}
      
      {/* Work Details */}
      <div className="text-sm text-gray-600 space-y-1">
        <div>
          <strong>{currentLanguage === 'np' ? 'आर्टिकल:' : 'Article:'}</strong> {workItem.article}
        </div>
        <div>
          <strong>{currentLanguage === 'np' ? 'टुक्राहरू:' : 'Pieces:'}</strong> {workItem.pieces}
        </div>
        <div>
          <strong>{currentLanguage === 'np' ? 'मेसिन:' : 'Machine:'}</strong> {workItem.machineType}
        </div>
      </div>
    </div>
  );
};

export default OptimisticWorkAssignment;