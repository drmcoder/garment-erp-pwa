// src/context/SystemContext.jsx
// Global System Configuration Context

import React, { createContext, useContext, useState, useEffect } from 'react';

const SystemContext = createContext();

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};

export const SystemProvider = ({ children }) => {
  const [systemSettings, setSystemSettings] = useState({
    currentLine: 'line-1',
    lineName: 'Production Line 1',
    lineNameEnglish: 'Production Line 1',
    lineNameNepali: 'उत्पादन लाइन १',
    targetEfficiency: 85,
    dailyTarget: 500,
    maxOperators: 50,
    shiftHours: 8,
    qualityThreshold: 95,
    isLoaded: false
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      // Load from localStorage for now
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSystemSettings(prev => ({
          ...prev,
          ...parsed,
          isLoaded: true
        }));
      } else {
        // Set default settings
        setSystemSettings(prev => ({
          ...prev,
          isLoaded: true
        }));
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
      setSystemSettings(prev => ({
        ...prev,
        isLoaded: true
      }));
    } finally {
      setLoading(false);
    }
  };

  const updateSystemSettings = async (newSettings) => {
    try {
      const updatedSettings = {
        ...systemSettings,
        ...newSettings
      };
      
      // Save to localStorage
      localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
      
      // Update state
      setSystemSettings(updatedSettings);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update system settings:', error);
      return { success: false, error: error.message };
    }
  };

  const getCurrentLine = () => {
    return {
      id: systemSettings.currentLine,
      name: systemSettings.lineName,
      nameEnglish: systemSettings.lineNameEnglish,
      nameNepali: systemSettings.lineNameNepali
    };
  };

  const getLineTargets = () => {
    return {
      dailyTarget: systemSettings.dailyTarget,
      targetEfficiency: systemSettings.targetEfficiency,
      qualityThreshold: systemSettings.qualityThreshold,
      maxOperators: systemSettings.maxOperators,
      shiftHours: systemSettings.shiftHours
    };
  };

  // Get line-specific filter for operators
  const getLineOperators = (operators) => {
    if (!operators) return [];
    
    // For single line system, return all operators
    // In multi-line system, filter by line assignment
    return operators.filter(operator => {
      // If operator has line assignment, check it matches current line
      if (operator.assignedLine) {
        return operator.assignedLine === systemSettings.currentLine;
      }
      // If no line assignment, include in current line
      return true;
    });
  };

  // Get line-specific filter for bundles
  const getLineBundles = (bundles) => {
    if (!bundles) return [];
    
    // For single line system, return all bundles
    // In multi-line system, filter by line assignment
    return bundles.filter(bundle => {
      // If bundle has line assignment, check it matches current line
      if (bundle.assignedLine) {
        return bundle.assignedLine === systemSettings.currentLine;
      }
      // If no line assignment, include in current line
      return true;
    });
  };

  const value = {
    systemSettings,
    loading,
    updateSystemSettings,
    getCurrentLine,
    getLineTargets,
    getLineOperators,
    getLineBundles,
    currentLine: systemSettings.currentLine,
    lineName: systemSettings.lineName
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

export default SystemContext;