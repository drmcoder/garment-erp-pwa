import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import { useWipFeatures, useTemplateConfig } from '../../hooks/useWipFeatures';
// import WIPInfographic from './WIPInfographic';
import NepaliDatePicker from '../common/NepaliDatePicker';
import { WIPService } from '../../services/firebase-services';

// Simple today's Nepali date for default value
const getTodayNepaliDate = () => {
  // Simple approximation - the proper date picker will handle actual conversion
  const today = new Date();
  const nepaliYear = today.getFullYear() + 57;
  const nepaliMonth = ((today.getMonth() + 8) % 12) + 1;
  const nepaliDay = today.getDate();
  
  return `${nepaliYear}/${nepaliMonth.toString().padStart(2, '0')}/${nepaliDay.toString().padStart(2, '0')}`;
};

// Enhanced size parsing that handles all separator types flexibly
const parseSmartSizeInput = (input) => {
  if (!input) return [];
  
  const trimmed = input.trim();
  if (!trimmed) return [];
  
  // Handle single values without any separators
  if (!trimmed.includes(':') && !trimmed.includes(';') && 
      !trimmed.includes(',') && !trimmed.includes('|') &&
      !trimmed.includes(' ')) {
    return [trimmed];
  }
  
  // Create a flexible separator regex that matches any combination
  // of : ; , | or multiple spaces
  const separatorRegex = /[;,:|\s]+/;
  
  return trimmed
    .split(separatorRegex)
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

// Validate and sanitize size input to only allow valid characters
const validateSizeInput = (input) => {
  // Allow: letters (a-z, A-Z), numbers (0-9), valid separators (: ; , |), spaces, and some common size characters (- _)
  const validCharRegex = /^[a-zA-Z0-9:;,|\s\-_]*$/;
  return validCharRegex.test(input) ? input : input.replace(/[^a-zA-Z0-9:;,|\s\-_]/g, '');
};

// Handle keypress events to prevent invalid characters
const handleSizeInputKeyPress = (e) => {
  // Allow: letters, numbers, valid separators, backspace, delete, arrow keys
  const validCharRegex = /^[a-zA-Z0-9:;,|\s\-_]$/;
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'];
  
  if (!validCharRegex.test(e.key) && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
};


// 🏗️ MODULAR PROCEDURE TEMPLATE SYSTEM
// Base operation modules that can be reused across different garments
const OPERATION_MODULES = {
  // Basic Construction Modules
  'shoulder-join-basic': { name: 'Shoulder Join (Basic)', machine: 'overlock', time: 2, rate: 2.0 },
  'shoulder-join-reinforced': { name: 'Shoulder Join (Reinforced)', machine: 'overlock', time: 3, rate: 2.5 },
  'side-seam-basic': { name: 'Side Seam (Basic)', machine: 'overlock', time: 3, rate: 2.5 },
  'side-seam-flat': { name: 'Side Seam (Flat Seam)', machine: 'flatlock', time: 4, rate: 3.0 },
  
  // Sleeve Modules
  'sleeve-attach-basic': { name: 'Sleeve Attach (Basic)', machine: 'overlock', time: 4, rate: 3.0 },
  'sleeve-attach-set-in': { name: 'Set-in Sleeve', machine: 'single-needle', time: 6, rate: 4.0 },
  'sleeve-raglan': { name: 'Raglan Sleeve', machine: 'overlock', time: 5, rate: 3.5 },
  
  // Neckline Modules
  'neck-bind-basic': { name: 'Neck Bind (Basic)', machine: 'flatlock', time: 6, rate: 4.0 },
  'collar-attach-polo': { name: 'Polo Collar Attach', machine: 'single-needle', time: 8, rate: 5.0 },
  'collar-attach-shirt': { name: 'Shirt Collar Attach', machine: 'single-needle', time: 12, rate: 7.0 },
  'hood-attach': { name: 'Hood Attach', machine: 'single-needle', time: 10, rate: 6.0 },
  
  // Finishing Modules
  'bottom-hem-basic': { name: 'Bottom Hem (Basic)', machine: 'single-needle', time: 4, rate: 3.0 },
  'bottom-hem-reinforced': { name: 'Bottom Hem (Reinforced)', machine: 'single-needle', time: 5, rate: 3.5 },
  'cuff-attach': { name: 'Cuff Attach', machine: 'flatlock', time: 6, rate: 4.0 },
  
  // Special Features
  'pocket-attach-basic': { name: 'Pocket Attach (Basic)', machine: 'single-needle', time: 6, rate: 4.0 },
  'pocket-attach-welt': { name: 'Welt Pocket', machine: 'single-needle', time: 12, rate: 8.0 },
  'zipper-install': { name: 'Zipper Install', machine: 'single-needle', time: 12, rate: 8.0 },
  'buttonhole-make': { name: 'Buttonhole Making', machine: 'buttonhole', time: 8, rate: 6.0 },
  
  // Bottom Wear Modules
  'inseam': { name: 'Inseam', machine: 'overlock', time: 4, rate: 3.0 },
  'outseam': { name: 'Outseam', machine: 'overlock', time: 4, rate: 3.0 },
  'crotch-seam': { name: 'Crotch Seam', machine: 'overlock', time: 5, rate: 3.5 },
  'waistband-attach': { name: 'Waistband Attach', machine: 'single-needle', time: 8, rate: 5.0 },
  'elastic-insert': { name: 'Elastic Insert', machine: 'single-needle', time: 6, rate: 4.0 }
};

// 📋 MODULAR PROCEDURE TEMPLATES - Built from reusable modules
const PROCEDURE_TEMPLATES = {
  // T-Shirt Family
  'basic-tshirt': {
    name: 'Basic T-Shirt',
    category: 'tops',
    icon: '👕',
    description: 'Simple crew neck t-shirt with basic construction',
    operations: ['shoulder-join-basic', 'side-seam-basic', 'sleeve-attach-basic', 'neck-bind-basic', 'bottom-hem-basic']
  },
  'polo-tshirt': {
    name: 'Polo T-Shirt',
    category: 'tops',
    icon: '👕',
    description: 'Polo shirt with collar and reinforced construction',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'collar-attach-polo', 'sleeve-attach-basic', 'bottom-hem-reinforced']
  },
  'premium-tshirt': {
    name: 'Premium T-Shirt',
    category: 'tops',
    icon: '👕',
    description: 'High-quality t-shirt with flat seams and pocket',
    operations: ['shoulder-join-reinforced', 'side-seam-flat', 'sleeve-attach-set-in', 'neck-bind-basic', 'pocket-attach-basic', 'bottom-hem-reinforced']
  },
  
  // Outerwear Family
  'hoodie-basic': {
    name: 'Basic Hoodie',
    category: 'outerwear',
    icon: '🧥',
    description: 'Pullover hoodie with front pocket',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'sleeve-raglan', 'hood-attach', 'pocket-attach-basic', 'cuff-attach', 'bottom-hem-reinforced']
  },
  'hoodie-zip': {
    name: 'Zip Hoodie',
    category: 'outerwear',
    icon: '🧥',
    description: 'Full-zip hoodie jacket with pockets',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'sleeve-raglan', 'hood-attach', 'zipper-install', 'pocket-attach-welt', 'cuff-attach', 'bottom-hem-reinforced']
  },
  'jacket-basic': {
    name: 'Basic Jacket',
    category: 'outerwear',
    icon: '🧥',
    description: 'Simple zip-up jacket',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'sleeve-attach-set-in', 'zipper-install', 'pocket-attach-basic', 'bottom-hem-basic']
  },
  
  // Bottom Wear Family
  'shorts-basic': {
    name: 'Basic Shorts',
    category: 'bottoms',
    icon: '🩳',
    description: 'Simple elastic waist shorts',
    operations: ['inseam', 'outseam', 'crotch-seam', 'elastic-insert', 'bottom-hem-basic']
  },
  'shorts-premium': {
    name: 'Premium Shorts',
    category: 'bottoms',
    icon: '🩳',
    description: 'Tailored shorts with waistband and pockets',
    operations: ['inseam', 'outseam', 'crotch-seam', 'waistband-attach', 'pocket-attach-basic', 'bottom-hem-basic']
  },
  'pants-casual': {
    name: 'Casual Pants',
    category: 'bottoms',
    icon: '👖',
    description: 'Regular fit casual pants',
    operations: ['inseam', 'outseam', 'crotch-seam', 'waistband-attach', 'pocket-attach-basic', 'bottom-hem-basic']
  },
  
  // Shirt Family  
  'shirt-casual': {
    name: 'Casual Shirt',
    category: 'shirts',
    icon: '👔',
    description: 'Button-up casual shirt',
    operations: ['shoulder-join-basic', 'side-seam-basic', 'sleeve-attach-set-in', 'collar-attach-shirt', 'buttonhole-make', 'bottom-hem-basic']
  }
};

// Get procedure preview text - Updated for modular system including custom templates
const getProcedurePreview = (templateId, customTemplates = {}) => {
  const template = PROCEDURE_TEMPLATES[templateId] || customTemplates[templateId];
  if (!template) return 'Custom configuration';
  
  return template.operations.map((opId, index) => {
    const operation = OPERATION_MODULES[opId];
    if (!operation) return `${index + 1}. Unknown Operation`;
    
    const machineIcon = operation.machine === 'single-needle' ? '📍' : 
                       operation.machine === 'overlock' ? '🔗' : 
                       operation.machine === 'flatlock' ? '📎' : 
                       operation.machine === 'buttonhole' ? '🕳️' : '⚙️';
    
    return `${index + 1}. ${operation.name} ${machineIcon} ${operation.time}min`;
  }).join(' → ');
};

// Get template statistics including custom templates
const getTemplateStats = (templateId, customTemplates = {}) => {
  const template = PROCEDURE_TEMPLATES[templateId] || customTemplates[templateId];
  if (!template) return { operations: 0, totalTime: 0, machines: [] };
  
  const operations = template.operations.map(opId => OPERATION_MODULES[opId]).filter(Boolean);
  const totalTime = operations.reduce((sum, op) => sum + op.time, 0);
  const machines = [...new Set(operations.map(op => op.machine))];
  
  return {
    operations: operations.length,
    totalTime,
    machines,
    estimatedCost: operations.reduce((sum, op) => sum + op.rate, 0)
  };
};

// Debounce helper for performance optimization (unused - commented out)
// const useDebounce = (callback, delay) => {
//   const [debounceTimer, setDebounceTimer] = useState(null);
//   
//   return useCallback((...args) => {
//     if (debounceTimer) {
//       clearTimeout(debounceTimer);
//     }
//     
//     const newTimer = setTimeout(() => {
//       callback(...args);
//     }, delay);
//     
//     setDebounceTimer(newTimer);
//   }, [callback, delay, debounceTimer]);
// };

const WIPManualEntry = ({ onImport, onCancel, initialData = null, isEditing = false }) => {
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  // Feature configuration hooks
  const wipFeatures = useWipFeatures();
  const templateConfig = useTemplateConfig();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Articles, 3: Rolls, 4: Preview (Template step removed)
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateBuilder, setTemplateBuilder] = useState({
    name: '',
    description: '',
    category: 'custom',
    operations: []
  });
  const [wipData, setWipData] = useState(() => {
    if (isEditing && initialData) {
      return {
        // Basic Information
        lotNumber: initialData.lotNumber || '',
        nepaliDate: initialData.nepaliDate || getTodayNepaliDate(),
        fabricName: initialData.fabricName || '',
        fabricWidth: initialData.fabricWidth || '',
        fabricStore: initialData.fabricStore || '',
        rollCount: initialData.rollCount || initialData.rolls?.length || 1,
        
        // Procedure Template
        procedureTemplate: initialData.procedureTemplate || '',
        
        // Articles and Styles
        parsedStyles: initialData.parsedStyles?.length > 0 ? initialData.parsedStyles : [
          { articleNumber: '', styleName: '' }
        ],
        
        // Article Sizes Configuration
        articleSizes: initialData.articleSizes || {},
        articleProcedures: initialData.articleProcedures || {},
        
        // Rolls Data
        rolls: initialData.rolls || [],
        
        // Color-Article Mapping
        colorArticleMapping: initialData.colorArticleMapping || {},
        
        // Custom Templates
        customTemplates: initialData.customTemplates || {},
        
        // Calculated fields
        totalRolls: initialData.totalRolls || initialData.rolls?.length || 0,
        totalPieces: initialData.totalPieces || 0
      };
    }
    
    return {
      // Basic Information
      lotNumber: '',
      nepaliDate: getTodayNepaliDate(),
      fabricName: '',
      fabricWidth: '',
      fabricStore: '',
      rollCount: 1, // Number of rolls to create
      
      // Procedure Template (Step 2)
      procedureTemplate: '', // Selected template ID
      
      // Articles and Styles
      parsedStyles: [
        { articleNumber: '', styleName: '' }
      ],
      
      // Article Sizes Configuration
      articleSizes: {},
      articleProcedures: {},
      
      // Rolls Data
      rolls: [],
      
      // Color-Article Mapping (new feature)
      colorArticleMapping: {},
      
      // Custom Templates (user-created)
      customTemplates: {},
      
      // Calculated fields
      totalRolls: 0,
      totalPieces: 0
    };
  });

  // Current roll state (unused - commented out)
  // const [currentRoll, setCurrentRoll] = useState({
  //   rollNumber: 1,
  //   colorName: '',
  //   layerCount: 0,
  //   markedWeight: 0,
  //   actualWeight: 0,
  //   pieces: 0
  // });

  // Add article
  const addArticle = () => {
    setWipData(prev => ({
      ...prev,
      parsedStyles: [...prev.parsedStyles, { articleNumber: '', styleName: '' }]
    }));
  };

  // Update article style
  const updateArticleStyle = (index, field, value) => {
    setWipData(prev => ({
      ...prev,
      parsedStyles: prev.parsedStyles.map((style, i) => 
        i === index ? { ...style, [field]: value } : style
      )
    }));
  };

  // Remove article
  const removeArticle = (index) => {
    if (wipData.parsedStyles.length <= 1) return;
    
    setWipData(prev => {
      const newStyles = prev.parsedStyles.filter((_, i) => i !== index);
      const newArticleSizes = { ...prev.articleSizes };
      delete newArticleSizes[prev.parsedStyles[index].articleNumber];
      
      return {
        ...prev,
        parsedStyles: newStyles,
        articleSizes: newArticleSizes
      };
    });
  };

  // Update article procedure configuration
  const updateArticleProcedure = useCallback((articleNumber, field, value) => {
    setWipData(prev => ({
      ...prev,
      articleProcedures: {
        ...prev.articleProcedures,
        [articleNumber]: {
          ...prev.articleProcedures[articleNumber],
          [field]: value
        }
      }
    }));
  }, []);

  // Copy procedure from another article  
  const copyProcedureFromArticle = useCallback((fromArticleNumber, toArticleNumber) => {
    const fromProcedure = wipData.articleProcedures[fromArticleNumber];
    if (fromProcedure) {
      setWipData(prev => ({
        ...prev,
        articleProcedures: {
          ...prev.articleProcedures,
          [toArticleNumber]: { ...fromProcedure }
        }
      }));
    }
  }, [wipData.articleProcedures]);

  // Update color-article mapping (now uses boolean instead of percentage)
  const updateColorArticleMapping = useCallback((colorName, articleNumber, isSelected) => {
    setWipData(prev => ({
      ...prev,
      colorArticleMapping: {
        ...prev.colorArticleMapping,
        [colorName]: {
          ...prev.colorArticleMapping[colorName],
          [articleNumber]: isSelected
        }
      }
    }));
  }, []);

  // Auto-distribute articles across colors equally
  const autoDistributeArticles = useCallback(() => {
    const colors = wipData.rolls.map(roll => roll.colorName).filter(Boolean);
    const articles = wipData.parsedStyles.map(style => style.articleNumber).filter(Boolean);
    
    if (colors.length === 0 || articles.length === 0) return;
    
    const newMapping = {};
    
    colors.forEach(color => {
      newMapping[color] = {};
      articles.forEach(article => {
        // Select all articles for all colors by default
        newMapping[color][article] = true;
      });
    });
    
    setWipData(prev => ({
      ...prev,
      colorArticleMapping: newMapping
    }));
  }, [wipData.rolls, wipData.parsedStyles]);

  // Template Builder Functions
  const openTemplateBuilder = useCallback((templateId = null) => {
    if (templateId) {
      // Edit existing template
      const template = PROCEDURE_TEMPLATES[templateId] || wipData.customTemplates[templateId];
      if (template) {
        setTemplateBuilder({
          name: template.name,
          description: template.description || '',
          category: template.category || 'custom',
          operations: [...(template.operations || [])]
        });
        setEditingTemplate(templateId);
      }
    } else {
      // Create new template
      setTemplateBuilder({
        name: '',
        description: '',
        category: 'custom',
        operations: []
      });
      setEditingTemplate(null);
    }
    setShowTemplateBuilder(true);
  }, [wipData.customTemplates]);

  const addOperationToTemplate = useCallback((operationId) => {
    if (OPERATION_MODULES[operationId]) {
      setTemplateBuilder(prev => ({
        ...prev,
        operations: [...prev.operations, operationId]
      }));
    }
  }, []);

  const removeOperationFromTemplate = useCallback((index) => {
    setTemplateBuilder(prev => ({
      ...prev,
      operations: prev.operations.filter((_, i) => i !== index)
    }));
  }, []);

  const moveOperation = useCallback((fromIndex, toIndex) => {
    setTemplateBuilder(prev => {
      const newOperations = [...prev.operations];
      const [moved] = newOperations.splice(fromIndex, 1);
      newOperations.splice(toIndex, 0, moved);
      return { ...prev, operations: newOperations };
    });
  }, []);

  const saveCustomTemplate = useCallback(() => {
    if (!templateBuilder.name.trim()) {
      alert(currentLanguage === 'np' ? 'टेम्प्लेट नाम आवश्यक छ' : 'Template name is required');
      return;
    }
    
    if (templateBuilder.operations.length === 0) {
      alert(currentLanguage === 'np' ? 'कम्तिमा एक अपरेशन आवश्यक छ' : 'At least one operation is required');
      return;
    }

    const templateId = editingTemplate || `custom_${Date.now()}`;
    const newTemplate = {
      name: templateBuilder.name,
      description: templateBuilder.description,
      category: templateBuilder.category,
      icon: templateBuilder.category === 'tops' ? '👕' : 
             templateBuilder.category === 'bottoms' ? '🩳' : 
             templateBuilder.category === 'outerwear' ? '🧥' : '⚙️',
      operations: templateBuilder.operations,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    setWipData(prev => ({
      ...prev,
      customTemplates: {
        ...prev.customTemplates,
        [templateId]: newTemplate
      }
    }));

    setShowTemplateBuilder(false);
    setEditingTemplate(null);
  }, [templateBuilder, editingTemplate, currentLanguage]);

  // Update article
  const updateArticle = (index, field, value) => {
    setWipData(prev => ({
      ...prev,
      parsedStyles: prev.parsedStyles.map((style, i) => 
        i === index ? { ...style, [field]: value } : style
      )
    }));
  };

  // Optimized update functions with debouncing (unused)
  // const debouncedUpdateWipData = useDebounce((update) => {
  //   setWipData(prev => ({ ...prev, ...update }));
  // }, 300);

  // Calculate pieces for a roll based on articles and sizes (Manufacturing Logic: layers × size_count)
  const calculateRollPieces = useCallback((roll, parsedStyles = null, articleSizes = null) => {
    let totalPieces = 0;
    
    // Use provided data or fall back to wipData
    const styles = parsedStyles || wipData.parsedStyles;
    const sizes = articleSizes || wipData.articleSizes;
    const colorMapping = wipData.colorArticleMapping[roll.colorName] || {};
    
    // If no parsed styles or layer count, return 0
    if (!styles || styles.length === 0 || !roll.layerCount) {
      return 0;
    }
    
    // Calculate pieces for each selected article: layers × size_count
    styles.forEach(style => {
      // Only calculate if this article is selected for this color
      const isSelected = colorMapping[style.articleNumber];
      if (!isSelected) return;
      
      const articleConfig = sizes[style.articleNumber];
      if (articleConfig && articleConfig.selectedSizes) {
        // Manufacturing logic: pieces = layers × number_of_sizes
        const sizeCount = articleConfig.selectedSizes.length;
        const articlePieces = roll.layerCount * sizeCount;
        totalPieces += articlePieces;
        
        console.log(`Article ${style.articleNumber}: ${roll.layerCount} layers × ${sizeCount} sizes = ${articlePieces} pieces`);
      } else {
        // Fallback: if no sizes are configured, assume 1 size
        console.warn(`No sizes configured for article ${style.articleNumber}, using fallback of 1 size`);
        totalPieces += roll.layerCount * 1;
      }
    });
    
    return totalPieces;
  }, [wipData.parsedStyles, wipData.articleSizes, wipData.colorArticleMapping]);

  // Update article sizes configuration with intelligent parsing
  const updateArticleSizes = useCallback((articleNumber, sizes, ratios) => {
    // Parse sizes intelligently
    const parsedSizes = parseSmartSizeInput(sizes);
    const parsedRatios = parseSmartSizeInput(ratios);
    
    // Auto-fix ratio count to match size count
    while (parsedRatios.length < parsedSizes.length) {
      parsedRatios.push('1');
    }
    while (parsedRatios.length > parsedSizes.length) {
      parsedRatios.pop();
    }
    
    const cleanedSizes = parsedSizes.join(':');
    const cleanedRatios = parsedRatios.join(':');
    
    setWipData(prev => {
      const updatedWipData = {
        ...prev,
        articleSizes: {
          ...prev.articleSizes,
          [articleNumber]: {
            sizes: cleanedSizes,
            ratios: cleanedRatios
          }
        }
      };
      
      // Recalculate all roll pieces since article sizes/ratios changed
      const updatedRolls = updatedWipData.rolls.map(roll => ({
        ...roll,
        pieces: calculateRollPieces(roll, updatedWipData.parsedStyles, updatedWipData.articleSizes)
      }));
      
      return {
        ...updatedWipData,
        rolls: updatedRolls,
        totalPieces: updatedRolls.reduce((sum, roll) => sum + (roll.pieces || 0), 0)
      };
    });
  }, [calculateRollPieces]);

  // Initialize rolls array when moving to step 3
  const initializeRolls = () => {
    if (wipData.rolls.length === 0) {
      const initialRolls = Array.from({ length: wipData.rollCount }, (_, index) => ({
        id: Date.now() + index,
        rollNumber: index + 1,
        colorName: '',
        layerCount: 0,
        markedWeight: 0,
        actualWeight: 0,
        pieces: 0
      }));
      
      setWipData(prev => ({
        ...prev,
        rolls: initialRolls
      }));
    }
  };

  // Update roll data and recalculate pieces if needed
  const updateRoll = (rollIndex, field, value) => {
    setWipData(prev => {
      const updatedRolls = prev.rolls.map((roll, index) => {
        if (index === rollIndex) {
          const updatedRoll = { ...roll, [field]: value };
          // Recalculate pieces if layer count changes
          if (field === 'layerCount') {
            updatedRoll.pieces = calculateRollPieces(updatedRoll, prev.parsedStyles, prev.articleSizes);
          }
          return updatedRoll;
        }
        return roll;
      });

      return {
        ...prev,
        rolls: updatedRolls,
        totalPieces: updatedRolls.reduce((sum, roll) => sum + (roll.pieces || 0), 0)
      };
    });
  };

  // Add roll (unused - commented out)
  // const addRoll = () => {
  //   try {
  //     if (!currentRoll.colorName || !currentRoll.layerCount) {
  //       const errorMessage = currentLanguage === 'np' ? 'रङको नाम र लेयर संख्या आवश्यक छ' : 'Color name and layer count are required';
  //       addError({
  //         message: errorMessage,
  //         component: 'WIPManualEntry',
  //         action: 'Add Roll',
  //         data: { currentRoll }
  //       }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
  //       return;
  //     }
  //
  //     const calculatedPieces = calculateRollPieces(currentRoll);
  //     const newRoll = {
  //       ...currentRoll,
  //       id: Date.now(),
  //       pieces: calculatedPieces
  //     };
  //
  //     setWipData(prev => {
  //       const newRolls = [...prev.rolls, newRoll];
  //       return {
  //         ...prev,
  //         rolls: newRolls,
  //         totalRolls: newRolls.length,
  //         totalPieces: newRolls.reduce((sum, roll) => sum + roll.pieces, 0)
  //       };
  //     });
  //
  //     // Reset current roll form
  //     setCurrentRoll({
  //       rollNumber: wipData.rolls.length + 2,
  //       colorName: '',
  //       layerCount: 0,
  //       markedWeight: 0,
  //       actualWeight: 0,
  //       pieces: 0
  //     });
  //     
  //   } catch (error) {
  //     addError({
  //       message: 'Failed to add roll',
  //       component: 'WIPManualEntry',
  //       action: 'Add Roll',
  //       data: { currentRoll, error: error.message }
  //     }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
  //   }
  // };

  // (Duplicate calculateRollPieces function removed - now defined above as useCallback)

  // Remove roll (unused - commented out)
  // const removeRoll = (rollId) => {
  //   setWipData(prev => {
  //     const newRolls = prev.rolls.filter(roll => roll.id !== rollId);
  //     return {
  //       ...prev,
  //       rolls: newRolls,
  //       totalRolls: newRolls.length,
  //       totalPieces: newRolls.reduce((sum, roll) => sum + roll.pieces, 0)
  //     };
  //   });
  // };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation functions for 2 steps
  const canProceedFromStep = (step) => {
    switch (step) {
      case 1:
        // Step 1: Setup - Basic Info + Articles (simplified validation)
        const basicValid = wipData.lotNumber && wipData.fabricName && wipData.rollCount > 0;
        const articlesValid = wipData.parsedStyles.every(style => style.articleNumber && style.styleName);
        return basicValid && articlesValid;
      case 2:
        // Step 2: Rolls - All rolls have color and layers
        return wipData.rolls.length > 0 && 
               wipData.rolls.every(roll => roll.colorName && roll.layerCount > 0);
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    console.log('🔥 WIP MANUAL ENTRY - SUBMIT BUTTON CLICKED');
    console.log('📋 Current WIP Data before validation:', JSON.stringify(wipData, null, 2));
    console.log('📊 Data validation starting...');
    
    try {
      // Validation
      if (wipData.rolls.length === 0) {
        const errorMessage = currentLanguage === 'np' ? 'कम्तीमा एक रोल आवश्यक छ' : 'At least one roll is required';
        console.log('❌ VALIDATION FAILED: No rolls found');
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Submit WIP',
          data: { wipData }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      if (!wipData.lotNumber || !wipData.fabricName) {
        const errorMessage = currentLanguage === 'np' ? 'लट नम्बर र कपडाको नाम आवश्यक छ' : 'Lot number and fabric name are required';
        console.log('❌ VALIDATION FAILED: Missing lot number or fabric name');
        console.log('- Lot Number:', wipData.lotNumber);
        console.log('- Fabric Name:', wipData.fabricName);
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Submit WIP',
          data: { wipData }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      if (wipData.parsedStyles.some(style => !style.articleNumber || !style.styleName)) {
        const errorMessage = currentLanguage === 'np' ? 'सबै लेख नम्बर र स्टाइल नाम भर्नुहोस्' : 'Please fill all article numbers and style names';
        console.log('❌ VALIDATION FAILED: Missing article data');
        console.log('- Parsed Styles:', wipData.parsedStyles);
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Submit WIP',
          data: { wipData }
        }, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
        return;
      }

      console.log('✅ ALL VALIDATIONS PASSED');

      // Add calculated totals
      const totalPieces = wipData.rolls.reduce((sum, roll) => sum + (roll.pieces || 0), 0);
      const finalWipData = {
        ...wipData,
        totalRolls: wipData.rolls.length,
        totalPieces: totalPieces
      };

      console.log('✅ Final WIP Data prepared:', JSON.stringify(finalWipData, null, 2));
      console.log('🚀 Saving to Firestore via WIPService...');
      
      // Save to Firestore
      const result = await WIPService.saveWIPEntry(finalWipData);
      
      if (result.success) {
        console.log('✅ WIP saved to Firestore successfully!');
        
        // Call the original callback to close the modal and show success
        onImport(finalWipData);
        
        // Show success message
        const successMessage = currentLanguage === 'np' 
          ? `WIP डेटा सफलतापूर्वक सुरक्षित गरियो! ${finalWipData.totalPieces} टुक्राहरू र ${finalWipData.totalRolls} रोलहरू थपिए।`
          : `WIP data saved successfully! Added ${finalWipData.totalPieces} pieces across ${finalWipData.totalRolls} rolls.`;
          
        addError({
          message: successMessage,
          component: 'WIPManualEntry',
          action: 'Save WIP Success'
        }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.LOW);
      } else {
        console.error('❌ Failed to save WIP to Firestore:', result.error);
        
        const errorMessage = currentLanguage === 'np' 
          ? `WIP डेटा सुरक्षित गर्न असफल: ${result.error}`
          : `Failed to save WIP data: ${result.error}`;
          
        addError({
          message: errorMessage,
          component: 'WIPManualEntry',
          action: 'Save WIP Failed',
          data: { error: result.error }
        }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
      }
      
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      addError({
        message: 'Failed to submit WIP data: ' + error.message,
        component: 'WIPManualEntry',
        action: 'Submit WIP',
        data: { wipData, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const renderStepIndicator = () => {
    // Generate steps dynamically based on configuration
    const stepConfigs = [
      { key: 'setup', name: currentLanguage === 'np' ? 'सेटअप' : 'Setup', icon: '⚙️' },
      { key: 'rollsAndPreview', name: currentLanguage === 'np' ? 'रोल र प्रिभ्यू' : 'Rolls & Preview', icon: '🧵' }
    ];

    const steps = stepConfigs
      .filter(stepConfig => wipFeatures.isEnabled(`steps.${stepConfig.key}`))
      .map((stepConfig, index) => ({
        num: index + 1,
        name: stepConfig.name,
        icon: stepConfig.icon,
        key: stepConfig.key
      }));

    return (
      <div className="mt-4">
        <div className="flex items-center justify-center space-x-2">
          {steps.map((step, index) => (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.num)}
              disabled={!canProceedFromStep(step.num - 1) && step.num > currentStep}
              className={`group flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentStep >= step.num 
                  ? 'bg-white bg-opacity-20 text-white shadow-md' 
                  : 'bg-white bg-opacity-10 text-blue-100 hover:bg-opacity-20'
              } ${step.num <= currentStep || canProceedFromStep(step.num - 1) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <span className="text-base">{step.icon}</span>
              <span className="hidden sm:inline">{step.name}</span>
              <span className="sm:hidden">{step.num}</span>
            </button>
            {index < 3 && (
              <div className={`w-8 h-0.5 mx-1 transition-all duration-200 ${
                currentStep > step.num ? 'bg-white bg-opacity-40' : 'bg-white bg-opacity-10'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold">
                {isEditing 
                  ? (currentLanguage === 'np' ? 'WIP डेटा सम्पादन' : 'Edit WIP Data')
                  : (currentLanguage === 'np' ? 'म्यानुअल WIP एन्ट्री' : 'Manual WIP Entry')
                }
              </h1>
              <p className="text-blue-100 text-sm">
                {isEditing
                  ? (currentLanguage === 'np' 
                    ? `लट ${wipData.lotNumber} सम्पादन गर्दै`
                    : `Editing Lot ${wipData.lotNumber}`
                  )
                  : (currentLanguage === 'np' ? 'सजिलो र छिटो डेटा एन्ट्री' : 'Easy & Quick Data Entry')
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full">
                Step {currentStep}/4
              </div>
            </div>
          </div>
          
          {renderStepIndicator()}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Complete Setup (Basic Info + Articles + Procedures) */}
          {currentStep === 1 && (
            <>
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl">📝</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Information'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {currentLanguage === 'np' ? 'लट र कपडाको विवरण भर्नुहोस्' : 'Fill lot and fabric details'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ {currentLanguage === 'np' ? 'लट नम्बर' : 'Lot Number'} *
                  </label>
                  <input
                    type="text"
                    value={wipData.lotNumber}
                    onChange={(e) => setWipData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="S-85"
                    required
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    📦
                  </div>
                </div>
                
                <div>
                  <NepaliDatePicker
                    label={currentLanguage === 'np' ? 'नेपाली मिति (बि.स.)' : 'Nepali Date (BS)'}
                    value={wipData.nepaliDate}
                    onChange={(date) => {
                      try {
                        setWipData(prev => ({ ...prev, nepaliDate: date }));
                      } catch (error) {
                        addError({
                          message: 'Error updating Nepali date',
                          component: 'WIPManualEntry',
                          action: 'Date Change',
                          data: { date, error: error.message }
                        }, ERROR_TYPES.USER, ERROR_SEVERITY.MEDIUM);
                      }
                    }}
                    placeholder={currentLanguage === 'np' ? 'मिति छान्नुहोस्' : 'Select Date'}
                    showTodayButton={true}
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🧵 {currentLanguage === 'np' ? 'कपडाको नाम' : 'Fabric Name'} *
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricName}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricName: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Cotton Pique"
                    required
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    🏭
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📏 {currentLanguage === 'np' ? 'कपडाको चौडाई' : 'Fabric Width'}
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricWidth}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricWidth: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="60 inches"
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    📐
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 {currentLanguage === 'np' ? 'रोलको संख्या' : 'Number of Rolls'} *
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setWipData(prev => ({ ...prev, rollCount: Math.max(1, prev.rollCount - 1) }))}
                      className="w-10 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={wipData.rollCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 1;
                        if (count >= 1 && count <= 20) {
                          setWipData(prev => ({ ...prev, rollCount: count }));
                        }
                      }}
                      onBlur={(e) => {
                        const count = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                        setWipData(prev => ({ ...prev, rollCount: count }));
                      }}
                      className="flex-1 p-3 text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-bold text-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setWipData(prev => ({ ...prev, rollCount: Math.min(20, prev.rollCount + 1) }))}
                      className="w-10 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {currentLanguage === 'np' ? '१-२० रोल' : '1-20 rolls'}
                  </p>
                </div>
                

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏪 {currentLanguage === 'np' ? 'कपडा स्टोर' : 'Fabric Store'}
                  </label>
                  <input
                    type="text"
                    value={wipData.fabricStore}
                    onChange={(e) => setWipData(prev => ({ ...prev, fabricStore: e.target.value }))}
                    className="w-full p-3 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Main Warehouse"
                  />
                  <div className="absolute left-3 top-10 text-gray-400">
                    📋
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 space-y-6">
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👕</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {currentLanguage === 'np' ? 'लेखहरू र प्रक्रियाहरू' : 'Articles & Procedures'}
                      </h3>
                      <p className="text-gray-600">
                        {currentLanguage === 'np' ? 'लेखहरू र तिनीहरूका प्रक्रियाहरू कन्फिगर गर्नुहोस्' : 'Configure articles and their procedures'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={addArticle}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>+</span>
                    <span>{currentLanguage === 'np' ? 'लेख थप्नुहोस्' : 'Add Article'}</span>
                  </button>
                </div>

                {/* Articles Configuration */}
                {wipData.parsedStyles.map((style, index) => (
                  <div key={index} className="bg-white rounded-lg border border-blue-300 p-6 relative">
                    {wipData.parsedStyles.length > 1 && (
                      <button
                        onClick={() => removeArticle(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-100 text-red-600 hover:bg-red-200 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                        title={currentLanguage === 'np' ? 'लेख हटाउनुहोस्' : 'Remove Article'}
                      >
                        ×
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          {currentLanguage === 'np' ? 'लेख संख्या' : 'Article Number'} *
                        </label>
                        <input
                          type="text"
                          value={style.articleNumber}
                          onChange={(e) => updateArticleStyle(index, 'articleNumber', e.target.value)}
                          className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={currentLanguage === 'np' ? 'जस्तै: 4233' : 'e.g., 4233'}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          {currentLanguage === 'np' ? 'शैली नाम' : 'Style Name'} *
                        </label>
                        <input
                          type="text"
                          value={style.styleName}
                          onChange={(e) => updateArticleStyle(index, 'styleName', e.target.value)}
                          className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={currentLanguage === 'np' ? 'जस्तै: T-Shirt' : 'e.g., T-Shirt'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
          )}


          {/* Step 2: Articles and Sizes */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'लेख र साइज कन्फिगरेसन' : 'Articles & Size Configuration'}
                </h2>
                <button
                  onClick={addArticle}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + {currentLanguage === 'np' ? 'लेख थप्नुहोस्' : 'Add Article'}
                </button>
              </div>
              
              <div className="space-y-6">
                {wipData.parsedStyles.map((style, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        {currentLanguage === 'np' ? 'लेख' : 'Article'} {index + 1}
                      </h3>
                      {wipData.parsedStyles.length > 1 && (
                        <button
                          onClick={() => removeArticle(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'लेख नम्बर' : 'Article Number'} *
                        </label>
                        <input
                          type="text"
                          value={style.articleNumber}
                          onChange={(e) => updateArticle(index, 'articleNumber', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="8085"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'स्टाइलको नाम' : 'Style Name'} *
                        </label>
                        <input
                          type="text"
                          value={style.styleName}
                          onChange={(e) => updateArticle(index, 'styleName', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Polo T-Shirt"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Size Configuration */}
                    {style.articleNumber && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-3">
                          {currentLanguage === 'np' ? 'साइज कन्फिगरेसन' : 'Size Configuration'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {currentLanguage === 'np' ? 'साइज नामहरू' : 'Size Names'}
                            </label>
                            <input
                              type="text"
                              value={wipData.articleSizes[style.articleNumber]?.sizes || ''}
                              onChange={(e) => {
                                const sanitizedValue = validateSizeInput(e.target.value);
                                updateArticleSizes(
                                  style.articleNumber,
                                  sanitizedValue,
                                  wipData.articleSizes[style.articleNumber]?.ratios || ''
                                );
                              }}
                              onKeyPress={handleSizeInputKeyPress}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                                const sanitizedText = validateSizeInput(pastedText);
                                updateArticleSizes(
                                  style.articleNumber,
                                  sanitizedText,
                                  wipData.articleSizes[style.articleNumber]?.ratios || ''
                                );
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                              placeholder={currentLanguage === 'np' ? 'M वा S:M:L:XL वा S;M;L;XL वा S,M,L,XL वा S|M|L|XL' : 'M or S:M:L:XL or S;M;L;XL or S,M,L,XL or S|M|L|XL'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                <span>
                                  {currentLanguage === 'np' 
                                    ? 'एकल साइज वा कुनै पनि विभाजक प्रयोग गर्नुहोस्: ' 
                                    : 'Single size or use any separator: '
                                  }
                                  <code className="text-blue-600 font-mono bg-gray-100 px-1 rounded">
                                    : ; , | (spaces)
                                  </code>
                                </span>
                              </span>
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {currentLanguage === 'np' ? 'साइज अनुपात' : 'Size Ratios'}
                            </label>
                            <input
                              type="text"
                              value={wipData.articleSizes[style.articleNumber]?.ratios || ''}
                              onChange={(e) => {
                                const sanitizedValue = validateSizeInput(e.target.value);
                                updateArticleSizes(
                                  style.articleNumber,
                                  wipData.articleSizes[style.articleNumber]?.sizes || '',
                                  sanitizedValue
                                );
                              }}
                              onKeyPress={handleSizeInputKeyPress}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                                const sanitizedText = validateSizeInput(pastedText);
                                updateArticleSizes(
                                  style.articleNumber,
                                  wipData.articleSizes[style.articleNumber]?.sizes || '',
                                  sanitizedText
                                );
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                              placeholder={currentLanguage === 'np' ? '1 वा 1:2:3:2:1 वा 1;2;3;2;1 वा 1,2,3,2,1 वा 1|2|3|2|1' : '1 or 1:2:3:2:1 or 1;2;3;2;1 or 1,2,3,2,1 or 1|2|3|2|1'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                {currentLanguage === 'np' ? 'प्रति लेयर टुक्राहरू' : 'Pieces per layer'} 
                                {wipData.articleSizes[style.articleNumber]?.sizes && (
                                  <span className="ml-2 text-green-600">
                                    ({parseSmartSizeInput(wipData.articleSizes[style.articleNumber].sizes).length} sizes detected)
                                  </span>
                                )}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* NEW: Sewing Procedure Configuration */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-blue-800 flex items-center">
                              <span className="text-lg mr-2">⚙️</span>
                              {currentLanguage === 'np' ? 'सिलाई प्रक्रिया कन्फिगरेसन' : 'Sewing Procedure Configuration'}
                            </h4>
                            
                            {/* Show template reuse info */}
                            {wipData.articleProcedures?.[style.articleNumber]?.template && (
                              <div className="text-xs text-blue-600">
                                {(() => {
                                  const sameTemplate = wipData.parsedStyles.filter(s => 
                                    s.articleNumber !== style.articleNumber && 
                                    wipData.articleProcedures?.[s.articleNumber]?.template === wipData.articleProcedures[style.articleNumber].template
                                  );
                                  return sameTemplate.length > 0 ? (
                                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      <span>🔄</span>
                                      <span>Shared with {sameTemplate.length} other article{sameTemplate.length > 1 ? 's' : ''}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                      <span>⚠️</span>
                                      <span>Unique template</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          
                          {/* Quick copy from other articles */}
                          {index > 0 && (
                            <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-700">
                                  🚀 {currentLanguage === 'np' ? 'अन्य लेखबाट कपी गर्नुहोस्:' : 'Quick copy from other articles:'}
                                </span>
                                <div className="flex space-x-2">
                                  {wipData.parsedStyles.slice(0, index).map((prevStyle, prevIndex) => (
                                    wipData.articleProcedures?.[prevStyle.articleNumber]?.template && (
                                      <button
                                        key={prevIndex}
                                        type="button"
                                        onClick={() => copyProcedureFromArticle(prevStyle.articleNumber, style.articleNumber)}
                                        className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded border border-green-300 transition-colors"
                                        title={`Copy from ${prevStyle.styleName || prevStyle.articleNumber}`}
                                      >
                                        📋 {prevStyle.articleNumber}
                                      </button>
                                    )
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-2">
                                {currentLanguage === 'np' ? 'प्रक्रिया टेम्प्लेट' : 'Procedure Template'} *
                              </label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={wipData.articleProcedures?.[style.articleNumber]?.template || ''}
                                    onChange={(e) => updateArticleProcedure(style.articleNumber, 'template', e.target.value)}
                                    className="flex-1 p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                  >
                                    <option value="">
                                      {currentLanguage === 'np' ? 'टेम्प्लेट छान्नुहोस्' : 'Select Template'}
                                    </option>
                                    
                                    {/* Built-in Templates */}
                                    <optgroup label="📚 Built-in Templates">
                                      <option value="basic-tshirt">👕 Basic T-Shirt (5 ops)</option>
                                      <option value="polo-tshirt">👕 Polo T-Shirt (5 ops)</option>
                                      <option value="premium-tshirt">👕 Premium T-Shirt (6 ops)</option>
                                      <option value="hoodie-basic">🧥 Basic Hoodie (7 ops)</option>
                                      <option value="hoodie-zip">🧥 Zip Hoodie (8 ops)</option>
                                      <option value="shorts-basic">🩳 Basic Shorts (5 ops)</option>
                                      <option value="pants-casual">👖 Casual Pants (6 ops)</option>
                                      <option value="shirt-casual">👔 Casual Shirt (6 ops)</option>
                                    </optgroup>
                                    
                                    {/* Custom Templates */}
                                    {Object.keys(wipData.customTemplates).length > 0 && (
                                      <optgroup label="🛠️ Your Custom Templates">
                                        {Object.entries(wipData.customTemplates).map(([id, template]) => (
                                          <option key={id} value={id}>
                                            {template.icon} {template.name} ({template.operations.length} ops)
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                  
                                  <button
                                    type="button"
                                    onClick={() => openTemplateBuilder()}
                                    className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400 transition-all flex items-center space-x-2 font-medium"
                                    title={currentLanguage === 'np' ? 'नयाँ टेम्प्लेट बनाउनुहोस्' : 'Create New Template'}
                                  >
                                    <span>⚡</span>
                                    <span className="hidden sm:inline">{currentLanguage === 'np' ? 'नयाँ' : 'New'}</span>
                                  </button>
                                </div>
                                
                                {/* Edit button for existing custom templates */}
                                {wipData.articleProcedures?.[style.articleNumber]?.template && 
                                 wipData.customTemplates[wipData.articleProcedures[style.articleNumber].template] && (
                                  <button
                                    type="button"
                                    onClick={() => openTemplateBuilder(wipData.articleProcedures[style.articleNumber].template)}
                                    className="w-full px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded border border-yellow-300 transition-colors flex items-center justify-center space-x-2 text-sm"
                                  >
                                    <span>✏️</span>
                                    <span>{currentLanguage === 'np' ? 'यो टेम्प्लेट सम्पादन गर्नुहोस्' : 'Edit This Template'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-blue-700 mb-2">
                                {currentLanguage === 'np' ? 'मुख्य मेसिन प्रकार' : 'Primary Machine Type'} *
                              </label>
                              <select
                                value={wipData.articleProcedures?.[style.articleNumber]?.primaryMachine || ''}
                                onChange={(e) => updateArticleProcedure(style.articleNumber, 'primaryMachine', e.target.value)}
                                className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                required
                              >
                                <option value="">
                                  {currentLanguage === 'np' ? 'मेसिन छान्नुहोस्' : 'Select Machine'}
                                </option>
                                <option value="single-needle">📍 Single Needle</option>
                                <option value="overlock">🔗 Overlock</option>
                                <option value="flatlock">📎 Flatlock</option>
                                <option value="buttonhole">🕳️ Buttonhole</option>
                                <option value="multi-skill">🎯 Multi-Skill</option>
                              </select>
                            </div>
                          </div>

                          {/* Enhanced procedure details if template selected */}
                          {wipData.articleProcedures?.[style.articleNumber]?.template && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-bold text-blue-800 flex items-center">
                                  <span className="mr-2">📋</span>
                                  {currentLanguage === 'np' ? 'प्रक्रिया विवरण:' : 'Procedure Details:'}
                                </h5>
                                {(() => {
                                  const stats = getTemplateStats(wipData.articleProcedures[style.articleNumber].template, wipData.customTemplates);
                                  return (
                                    <div className="flex items-center space-x-3 text-xs">
                                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                        {stats.operations} operations
                                      </span>
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        ⏱️ {stats.totalTime}min
                                      </span>
                                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                                        💰 ${stats.estimatedCost.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              {/* Operation sequence */}
                              <div className="text-xs text-blue-700 mb-3 font-mono bg-blue-50 p-2 rounded border-l-4 border-blue-300">
                                {getProcedurePreview(wipData.articleProcedures[style.articleNumber].template, wipData.customTemplates)}
                              </div>
                              
                              {/* Machine requirements */}
                              {(() => {
                                const stats = getTemplateStats(wipData.articleProcedures[style.articleNumber].template, wipData.customTemplates);
                                return (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium text-gray-600">
                                      {currentLanguage === 'np' ? 'आवश्यक मेसिनहरू:' : 'Required machines:'}
                                    </span>
                                    {stats.machines.map(machine => (
                                      <span key={machine} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border">
                                        {machine === 'single-needle' && '📍'} 
                                        {machine === 'overlock' && '🔗'} 
                                        {machine === 'flatlock' && '📎'} 
                                        {machine === 'buttonhole' && '🕳️'} 
                                        {machine.replace('-', ' ').toUpperCase()}
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Rolls Data with Live Preview */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'रोल डेटा' : 'Roll Data'}
                </h2>
                <div className="text-sm text-gray-600">
                  {currentLanguage === 'np' 
                    ? `${wipData.rollCount} रोल भर्नुहोस्` 
                    : `Fill details for ${wipData.rollCount} rolls`
                  }
                </div>
              </div>

              {/* Initialize rolls when entering step 3 */}
              {wipData.rolls.length === 0 && initializeRolls()}
              
              {/* Enhanced Roll Forms */}
              <div className="space-y-4">
                {wipData.rolls.map((roll, index) => {
                  const isCompleted = roll.colorName && roll.layerCount > 0;
                  return (
                    <div key={roll.id} className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                      isCompleted 
                        ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md' 
                        : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg' 
                              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                          }`}>
                            {isCompleted ? '✓' : roll.rollNumber}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {currentLanguage === 'np' ? `रोल ${roll.rollNumber}` : `Roll ${roll.rollNumber}`}
                            </h3>
                            {roll.colorName && (
                              <p className="text-sm text-gray-600">
                                🎨 {roll.colorName}
                              </p>
                            )}
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="text-green-600">
                            <span className="text-2xl">🎉</span>
                          </div>
                        )}
                      </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'रङको नाम' : 'Color Name'} *
                        </label>
                        <input
                          type="text"
                          value={roll.colorName}
                          onChange={(e) => updateRoll(index, 'colorName', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={currentLanguage === 'np' ? 'नीलो-१' : 'Blue-1'}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'लेयर संख्या' : 'Layer Count'} *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={roll.layerCount || ''}
                          onChange={(e) => updateRoll(index, 'layerCount', parseInt(e.target.value) || 0)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="23"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'मार्क तौल (kg)' : 'Marked Weight (kg)'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={roll.markedWeight || ''}
                          onChange={(e) => updateRoll(index, 'markedWeight', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="8.5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLanguage === 'np' ? 'वास्तविक तौल (kg)' : 'Actual Weight (kg)'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={roll.actualWeight || ''}
                          onChange={(e) => updateRoll(index, 'actualWeight', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="8.2"
                        />
                      </div>
                    </div>

                    {/* Roll Summary */}
                    {roll.layerCount > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">
                          {currentLanguage === 'np' ? 'कुल टुक्राहरू:' : 'Total pieces from this roll:'}
                          <span className="font-bold text-gray-800 ml-2">
                            {Object.values(wipData.articleSizes).reduce((total, config) => {
                              const ratios = parseSmartSizeInput(config.ratios || '').map(r => parseInt(r.trim()) || 0);
                              return total + (ratios.reduce((sum, ratio) => sum + ratio, 0) * roll.layerCount);
                            }, 0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Formula: {Object.values(wipData.articleSizes).map(config => {
                            const ratios = parseSmartSizeInput(config.ratios || '').map(r => parseInt(r.trim()) || 0);
                            return `(${ratios.join('+')} = ${ratios.reduce((sum, ratio) => sum + ratio, 0)})`;
                          }).join(' + ')} × {roll.layerCount} layers
                        </div>
                      </div>
                    )}

                    {/* NEW: Color-Article Distribution */}
                    {roll.colorName && wipData.parsedStyles.length > 1 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-orange-800 flex items-center">
                            <span className="text-lg mr-2">🎨</span>
                            {currentLanguage === 'np' ? 'रंग-लेख वितरण' : 'Color-Article Distribution'}
                          </h4>
                          <button
                            type="button"
                            onClick={autoDistributeArticles}
                            className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded border border-orange-300 transition-colors"
                          >
                            ⚡ {currentLanguage === 'np' ? 'स्वचालित' : 'Auto Equal'}
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-orange-700 mb-3">
                            📊 {currentLanguage === 'np' ? 'यो रंगबाट कुन लेख बनाउने?' : 'Which articles to make from this color?'}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {currentLanguage === 'np' ? 'सूत्र: प्रत्येक लेखको टुक्रा = लेयर × साइज संख्या' : 'Formula: Each article pieces = layers × size count'}
                          </div>
                          <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded mb-3">
                            📝 Example: {roll.layerCount} layers → Article with 4 sizes = {roll.layerCount} × 4 = {roll.layerCount * 4} pieces
                          </div>
                          
                          {wipData.parsedStyles.map((style, styleIndex) => {
                            const isSelected = wipData.colorArticleMapping[roll.colorName]?.[style.articleNumber] || false;
                            return (
                              <div key={styleIndex} className="flex items-center justify-between bg-white p-3 rounded border border-orange-200 hover:bg-orange-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium text-gray-800">
                                    Article #{style.articleNumber}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ({style.styleName})
                                  </span>
                                  
                                  {/* Size ratio display */}
                                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {wipData.articleSizes[style.articleNumber]?.selectedSizes?.length || 0} sizes
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => updateColorArticleMapping(roll.colorName, style.articleNumber, e.target.checked)}
                                      className="w-5 h-5 text-orange-600 border-2 border-orange-300 rounded focus:ring-orange-500 focus:ring-2"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      {isSelected 
                                        ? (currentLanguage === 'np' ? 'चयनित' : 'Include') 
                                        : (currentLanguage === 'np' ? 'बहिष्कृत' : 'Exclude')
                                      }
                                    </span>
                                  </label>
                                  
                                  {isSelected && (
                                    <div className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                      ✓ Selected
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Selected articles summary */}
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-sm text-green-800 font-medium mb-2">
                              📊 {currentLanguage === 'np' ? 'चयनित लेखहरू:' : 'Selected Articles:'}
                            </div>
                            {(() => {
                              const selectedArticles = wipData.parsedStyles.filter(style => 
                                wipData.colorArticleMapping[roll.colorName]?.[style.articleNumber]
                              );
                              if (selectedArticles.length === 0) {
                                return (
                                  <div className="text-sm text-gray-500">
                                    {currentLanguage === 'np' ? 'कुनै लेख चयन गरिएको छैन' : 'No articles selected'}
                                  </div>
                                );
                              }
                              
                              return selectedArticles.map((article) => {
                                // Calculate pieces using manufacturing logic: layers × sizes
                                const articleSizes = wipData.articleSizes[article.articleNumber]?.selectedSizes?.length || 0;
                                const piecesForThisArticle = roll.layerCount * articleSizes;
                                
                                return (
                                  <div key={article.articleNumber} className="flex justify-between items-center text-sm">
                                    <span>#{article.articleNumber} ({articleSizes} sizes)</span>
                                    <span className="font-medium text-green-700">
                                      {piecesForThisArticle} pieces
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Summary Dashboard */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  {currentLanguage === 'np' ? 'संक्षेप' : 'Summary'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{wipData.rolls.length}</div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'रोल' : 'Rolls'}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {wipData.rolls.reduce((sum, roll) => sum + (roll.layerCount || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'कुल लेयर' : 'Total Layers'}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {wipData.rolls.reduce((sum, roll) => sum + (roll.actualWeight || 0), 0).toFixed(1)}kg
                    </div>
                    <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'कुल तौल' : 'Total Weight'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentLanguage === 'np' ? 'अघिल्लो' : 'Previous'}
          </button>
          
          <div className="space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
            
            {currentStep < 2 ? (
              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(currentStep)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentLanguage === 'np' ? 'अर्को' : 'Next'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {isEditing 
                  ? (currentLanguage === 'np' ? 'WIP अपडेट गर्नुहोस्' : 'Update WIP')
                  : (currentLanguage === 'np' ? 'WIP सुरक्षित गर्नुहोस्' : 'Save WIP')
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Template Builder Modal */}
      {showTemplateBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                  <span className="text-3xl mr-3">🛠️</span>
                  {editingTemplate 
                    ? (currentLanguage === 'np' ? 'टेम्प्लेट सम्पादन गर्नुहोस्' : 'Edit Template')
                    : (currentLanguage === 'np' ? 'नयाँ टेम्प्लेट बनाउनुहोस्' : 'Create New Template')
                  }
                </h2>
                <button
                  onClick={() => setShowTemplateBuilder(false)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Template Configuration */}
              <div className="w-1/3 bg-gray-50 p-6 border-r overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  📝 {currentLanguage === 'np' ? 'टेम्प्लेट जानकारी' : 'Template Information'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'टेम्प्लेट नाम' : 'Template Name'} *
                    </label>
                    <input
                      type="text"
                      value={templateBuilder.name}
                      onChange={(e) => setTemplateBuilder(prev => ({...prev, name: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder={currentLanguage === 'np' ? 'जस्तै: मेरो कस्टम शर्ट' : 'e.g: My Custom Shirt'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'विवरण' : 'Description'}
                    </label>
                    <textarea
                      value={templateBuilder.description}
                      onChange={(e) => setTemplateBuilder(prev => ({...prev, description: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-20"
                      placeholder={currentLanguage === 'np' ? 'यो टेम्प्लेटको बारेमा...' : 'About this template...'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {currentLanguage === 'np' ? 'श्रेणी' : 'Category'}
                    </label>
                    <select
                      value={templateBuilder.category}
                      onChange={(e) => setTemplateBuilder(prev => ({...prev, category: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="custom">⚙️ Custom</option>
                      <option value="tops">👕 Tops</option>
                      <option value="bottoms">🩳 Bottoms</option>
                      <option value="outerwear">🧥 Outerwear</option>
                      <option value="shirts">👔 Shirts</option>
                    </select>
                  </div>

                  {templateBuilder.operations.length > 0 && (
                    <div className="p-3 bg-green-100 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-1">
                        📊 {currentLanguage === 'np' ? 'सारांश:' : 'Summary:'}
                      </div>
                      <div className="text-sm text-green-700">
                        {templateBuilder.operations.length} operations, {' '}
                        {templateBuilder.operations.reduce((sum, opId) => {
                          const op = OPERATION_MODULES[opId];
                          return sum + (op ? op.time : 0);
                        }, 0)} minutes total
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Operation Modules Library */}
              <div className="w-1/3 bg-white p-6 border-r overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  🧩 {currentLanguage === 'np' ? 'अपरेशन मोड्युल' : 'Operation Modules'}
                </h3>
                
                <div className="space-y-4">
                  {Object.entries({
                    'Basic Construction': ['shoulder-join-basic', 'shoulder-join-reinforced', 'side-seam-basic', 'side-seam-flat'],
                    'Sleeves': ['sleeve-attach-basic', 'sleeve-attach-set-in', 'sleeve-raglan'],
                    'Necklines': ['neck-bind-basic', 'collar-attach-polo', 'collar-attach-shirt', 'hood-attach'],
                    'Finishing': ['bottom-hem-basic', 'bottom-hem-reinforced', 'cuff-attach'],
                    'Special Features': ['pocket-attach-basic', 'pocket-attach-welt', 'zipper-install', 'buttonhole-make'],
                    'Bottom Wear': ['inseam', 'outseam', 'crotch-seam', 'waistband-attach', 'elastic-insert']
                  }).map(([category, operations]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-2 text-sm">{category}</h4>
                      <div className="space-y-1">
                        {operations.map(opId => {
                          const operation = OPERATION_MODULES[opId];
                          if (!operation) return null;
                          
                          return (
                            <button
                              key={opId}
                              type="button"
                              onClick={() => addOperationToTemplate(opId)}
                              className="w-full text-left p-2 rounded border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-sm flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium text-gray-800">{operation.name}</div>
                                <div className="text-xs text-gray-500">
                                  {operation.machine} • {operation.time}min • ${operation.rate}
                                </div>
                              </div>
                              <span className="text-green-600 font-bold">+</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Builder */}
              <div className="w-1/3 bg-blue-50 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  📋 {currentLanguage === 'np' ? 'अपरेशन सिक्वेन्स' : 'Operation Sequence'}
                </h3>
                
                {templateBuilder.operations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">👈</div>
                    <p className="text-sm">
                      {currentLanguage === 'np' 
                        ? 'बाँयाबाट अपरेशन थप्नुहोस्'
                        : 'Add operations from the left'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templateBuilder.operations.map((opId, index) => {
                      const operation = OPERATION_MODULES[opId];
                      if (!operation) return null;
                      
                      return (
                        <div key={index} className="bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 text-sm">{operation.name}</div>
                              <div className="text-xs text-gray-500">
                                {operation.machine} • {operation.time}min
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => moveOperation(index, index - 1)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Move up"
                              >
                                ↑
                              </button>
                            )}
                            {index < templateBuilder.operations.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveOperation(index, index + 1)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Move down"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeOperationFromTemplate(index)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 border-t flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTemplateBuilder(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all border border-gray-300"
              >
                {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              
              <button
                type="button"
                onClick={saveCustomTemplate}
                disabled={!templateBuilder.name.trim() || templateBuilder.operations.length === 0}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-all font-medium flex items-center space-x-2"
              >
                <span>💾</span>
                <span>
                  {editingTemplate 
                    ? (currentLanguage === 'np' ? 'अपडेट गर्नुहोस्' : 'Update Template')
                    : (currentLanguage === 'np' ? 'सुरक्षित गर्नुहोस्' : 'Save Template')
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WIPManualEntry;