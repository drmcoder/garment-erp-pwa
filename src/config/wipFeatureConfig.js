// WIP Feature Configuration
// This file controls which features are enabled/disabled during trial phase
// Easy to modify without touching core components

export const WIP_FEATURE_CONFIG = {
  // Step Configuration - Controls which steps are enabled
  steps: {
    basicInfo: {
      enabled: true,
      order: 1,
      required: true,
      fields: {
        lotNumber: { enabled: true, required: true },
        nepaliDate: { enabled: true, required: true },
        fabricName: { enabled: true, required: true },
        fabricWidth: { enabled: true, required: false },
        fabricStore: { enabled: true, required: false },
        rollCount: { enabled: true, required: true }
      }
    },
    
    procedureTemplate: {
      enabled: true, // Set to false to skip this step
      order: 2,
      required: true,
      templates: {
        'shirt-basic': { 
          enabled: true, 
          name: { en: 'Basic Shirt Procedure', np: 'आधारभूत शर्ट प्रक्रिया' },
          description: { 
            en: 'Basic shirt construction with buttonholes, cuffs, collar, and hem operations.',
            np: 'बटन होल, कफ, कलर, र हेम सहितको आधारभूत शर्ट निर्माण प्रक्रिया।'
          }
        },
        'trouser-standard': { 
          enabled: true, 
          name: { en: 'Standard Trouser Procedure', np: 'मानक ट्राउजर प्रक्रिया' },
          description: { 
            en: 'Standard trouser construction with pocket, fly, waistband, and hem operations.',
            np: 'पकेट, फ्लाई, वेस्टब्यान्ड, र हेम सहितको मानक ट्राउजर निर्माण।'
          }
        },
        'dress-formal': { 
          enabled: true, 
          name: { en: 'Formal Dress Procedure', np: 'औपचारिक ड्रेस प्रक्रिया' },
          description: { 
            en: 'Formal dress with zipper, lining, and additional finishing operations.',
            np: 'जिपर, लाइनिंग, र अतिरिक्त फिनिशिंग सहितको औपचारिक ड्रेस।'
          }
        },
        'jacket-casual': { 
          enabled: false, // Disabled for trial
          name: { en: 'Casual Jacket Procedure', np: 'आकस्मिक ज्याकेट प्रक्रिया' },
          description: { 
            en: 'Casual jacket with pockets, collar, and simple finishing.',
            np: 'पकेट, कलर, र साधारण फिनिशिंग सहितको आकस्मिक ज्याकेट।'
          }
        },
        'tshirt-basic': { 
          enabled: true, 
          name: { en: 'Basic T-Shirt Procedure', np: 'आधारभूत टी-शर्ट प्रक्रिया' },
          description: { 
            en: 'Simple T-shirt construction with overlock and hem only.',
            np: 'केवल ओभरलक र हेम सहितको सरल टी-शर्ट निर्माण।'
          }
        },
        'custom': { 
          enabled: true, 
          name: { en: 'Custom Procedure', np: 'कस्टम प्रक्रिया' },
          description: { 
            en: 'Customizable procedure that can be modified as per your requirements.',
            np: 'तपाईंको आवश्यकता अनुसार कस्टमाइज गर्न मिल्ने प्रक्रिया।'
          }
        }
      }
    },
    
    articlesConfig: {
      enabled: true,
      order: 3,
      required: true,
      features: {
        multipleArticles: { enabled: true, maxArticles: 5 },
        sizeConfiguration: { 
          enabled: true, 
          separators: [':', ';', ',', '|', ' '], // Which separators to support
          singleSizeSupport: true
        },
        ratioConfiguration: { enabled: true }
      }
    },
    
    rollsData: {
      enabled: true,
      order: 4,
      required: true,
      features: {
        dynamicRollCount: { enabled: true },
        autoCalculation: { enabled: true },
        colorTracking: { enabled: true },
        weightTracking: { enabled: false } // Disabled for trial
      }
    },
    
    preview: {
      enabled: true,
      order: 5,
      required: true,
      features: {
        productionFormula: { enabled: true },
        detailedBreakdown: { enabled: true },
        exportOptions: { enabled: false } // Disabled for trial
      }
    }
  },
  
  // UI Configuration
  ui: {
    theme: 'default',
    showStepNumbers: true,
    showProgressBar: true,
    animationsEnabled: true,
    compactMode: false // For smaller screens
  },
  
  // Validation Configuration
  validation: {
    strictMode: false, // Set to true for production
    allowEmptyFields: true, // For trial phase
    autoSave: true,
    confirmationDialogs: true
  },
  
  // Integration Features
  integrations: {
    firestore: { enabled: true },
    localStorage: { enabled: true },
    notifications: { enabled: true },
    analytics: { enabled: false } // Disabled for trial
  },
  
  // Assignment Methods - Trial Phase Testing
  assignment: {
    bundleCard: { enabled: true, difficulty: 'beginner' },
    dragDrop: { enabled: true, difficulty: 'intermediate' },
    userProfile: { enabled: true, difficulty: 'intermediate' },
    wipBundle: { enabled: true, difficulty: 'advanced' },
    kanban: { enabled: true, difficulty: 'advanced' },
    quickAction: { enabled: true, difficulty: 'beginner' },
    batch: { enabled: true, difficulty: 'expert' }
  }
};

// Helper functions to check feature availability
export const isFeatureEnabled = (featurePath) => {
  const keys = featurePath.split('.');
  let current = WIP_FEATURE_CONFIG;
  
  for (const key of keys) {
    if (!current[key]) return false;
    current = current[key];
  }
  
  return current.enabled === true;
};

export const getFeatureConfig = (featurePath) => {
  const keys = featurePath.split('.');
  let current = WIP_FEATURE_CONFIG;
  
  for (const key of keys) {
    if (!current[key]) return null;
    current = current[key];
  }
  
  return current;
};

export const getEnabledSteps = () => {
  return Object.entries(WIP_FEATURE_CONFIG.steps)
    .filter(([key, config]) => config.enabled)
    .sort(([, a], [, b]) => a.order - b.order);
};

export const getEnabledTemplates = () => {
  const templates = WIP_FEATURE_CONFIG.steps.procedureTemplate.templates;
  return Object.entries(templates)
    .filter(([key, config]) => config.enabled)
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {});
};

// Development helper - easily toggle features
export const toggleFeature = (featurePath, enabled) => {
  if (process.env.NODE_ENV === 'development') {
    const keys = featurePath.split('.');
    let current = WIP_FEATURE_CONFIG;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]].enabled = enabled;
    console.log(`🔧 Feature ${featurePath} ${enabled ? 'enabled' : 'disabled'}`);
  }
};