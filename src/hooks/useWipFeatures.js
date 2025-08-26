// Custom hook for WIP Feature Management
// Provides easy access to feature configuration throughout the app

import { useState } from 'react';
import { 
  WIP_FEATURE_CONFIG, 
  isFeatureEnabled, 
  getFeatureConfig, 
  getEnabledSteps,
  getEnabledTemplates,
  toggleFeature 
} from '../config/wipFeatureConfig';

export const useWipFeatures = () => {
  const [config, setConfig] = useState(WIP_FEATURE_CONFIG);
  
  // Refresh configuration when needed
  const refreshConfig = () => {
    setConfig({ ...WIP_FEATURE_CONFIG });
  };
  
  // Helper functions
  const isEnabled = (featurePath) => {
    return isFeatureEnabled(featurePath);
  };
  
  const getConfig = (featurePath) => {
    return getFeatureConfig(featurePath);
  };
  
  const getSteps = () => {
    return getEnabledSteps();
  };
  
  const getTemplates = () => {
    return getEnabledTemplates();
  };
  
  const toggle = (featurePath, enabled) => {
    toggleFeature(featurePath, enabled);
    refreshConfig();
  };
  
  // Development helpers
  const enableStep = (stepName) => {
    if (config.steps[stepName]) {
      toggle(`steps.${stepName}`, true);
    }
  };
  
  const disableStep = (stepName) => {
    if (config.steps[stepName]) {
      toggle(`steps.${stepName}`, false);
    }
  };
  
  const enableTemplate = (templateName) => {
    if (config.steps.procedureTemplate.templates[templateName]) {
      toggle(`steps.procedureTemplate.templates.${templateName}`, true);
    }
  };
  
  const disableTemplate = (templateName) => {
    if (config.steps.procedureTemplate.templates[templateName]) {
      toggle(`steps.procedureTemplate.templates.${templateName}`, false);
    }
  };
  
  // Quick presets for trial phases
  const presets = {
    minimal: () => {
      toggle('steps.procedureTemplate', false);
      toggle('steps.rollsData.features.weightTracking', false);
      toggle('steps.preview.features.exportOptions', false);
      toggle('integrations.analytics', false);
    },
    
    full: () => {
      Object.keys(config.steps).forEach(stepName => {
        toggle(`steps.${stepName}`, true);
      });
    },
    
    testing: () => {
      toggle('validation.strictMode', false);
      toggle('validation.allowEmptyFields', true);
      toggle('steps.preview.features.exportOptions', false);
    },
    
    production: () => {
      toggle('validation.strictMode', true);
      toggle('validation.allowEmptyFields', false);
      toggle('integrations.analytics', true);
    }
  };
  
  const applyPreset = (presetName) => {
    if (presets[presetName]) {
      presets[presetName]();
      refreshConfig();
      console.log(`🔧 Applied preset: ${presetName}`);
    }
  };
  
  // Debug helpers
  const logCurrentConfig = () => {
    console.log('📋 Current WIP Feature Configuration:', config);
  };
  
  const getFeatureStatus = () => {
    const status = {
      enabledSteps: getSteps().map(([name]) => name),
      enabledTemplates: Object.keys(getTemplates()),
      strictMode: config.validation.strictMode,
      integrations: Object.entries(config.integrations)
        .filter(([, config]) => config.enabled)
        .map(([name]) => name)
    };
    return status;
  };
  
  return {
    config,
    isEnabled,
    getConfig,
    getSteps,
    getTemplates,
    toggle,
    enableStep,
    disableStep,
    enableTemplate,
    disableTemplate,
    applyPreset,
    refreshConfig,
    logCurrentConfig,
    getFeatureStatus,
    
    // Quick access to common checks
    hasMultipleSteps: getSteps().length > 1,
    hasProcedureStep: isEnabled('steps.procedureTemplate'),
    hasAutoCalculation: isEnabled('steps.rollsData.features.autoCalculation'),
    isStrictMode: config.validation.strictMode
  };
};

// Hook for specific step configuration
export const useStepConfig = (stepName) => {
  const { getConfig, isEnabled } = useWipFeatures();
  
  const stepConfig = getConfig(`steps.${stepName}`);
  const enabled = isEnabled(`steps.${stepName}`);
  
  return {
    enabled,
    config: stepConfig,
    order: stepConfig?.order || 0,
    required: stepConfig?.required || false,
    fields: stepConfig?.fields || {},
    features: stepConfig?.features || {}
  };
};

// Hook for template configuration
export const useTemplateConfig = () => {
  const { getTemplates, isEnabled } = useWipFeatures();
  
  const enabled = isEnabled('steps.procedureTemplate');
  const templates = enabled ? getTemplates() : {};
  
  return {
    enabled,
    templates,
    templateCount: Object.keys(templates).length,
    hasCustomTemplate: !!templates.custom
  };
};