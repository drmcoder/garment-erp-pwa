// src/config/damageTypesConfig.js
// Comprehensive damage types configuration for garment production

export const DAMAGE_CATEGORIES = {
  FABRIC_DEFECTS: {
    id: 'fabric_defects',
    label: { en: 'Fabric Defects', np: 'कपडाको दोष' },
    icon: '🧵',
    color: 'red',
    operatorFault: false, // Not operator's fault
    types: [
      {
        id: 'fabric_hole',
        en: 'Fabric Hole',
        np: 'कपडामा प्वाल',
        icon: '🕳️',
        severity: 'major',
        commonCauses: ['Manufacturing defect', 'Transport damage', 'Storage damage'],
        preventive: 'Quality check fabric before cutting',
        operatorFault: false
      },
      {
        id: 'fabric_stain',
        en: 'Fabric Stain/Dirt',
        np: 'कपडाको दाग',
        icon: '🟤',
        severity: 'minor',
        commonCauses: ['Oil stains', 'Dirt marks', 'Water spots'],
        preventive: 'Clean storage and handling procedures',
        operatorFault: false
      },
      {
        id: 'fabric_tear',
        en: 'Fabric Tear',
        np: 'कपडा च्यातिएको',
        icon: '⚡',
        severity: 'major',
        commonCauses: ['Weak fabric', 'Sharp objects', 'Excessive tension'],
        preventive: 'Handle fabric carefully',
        operatorFault: false
      },
      {
        id: 'color_bleeding',
        en: 'Color Bleeding',
        np: 'रंग फैलिएको',
        icon: '💧',
        severity: 'major',
        commonCauses: ['Poor dyeing', 'Wet fabric', 'Chemical reaction'],
        preventive: 'Check fabric quality before cutting',
        operatorFault: false
      },
      {
        id: 'fabric_shrinkage',
        en: 'Fabric Shrinkage',
        np: 'कपडा सुकेको',
        icon: '📏',
        severity: 'major',
        commonCauses: ['Pre-shrink not done', 'Heat exposure', 'Moisture'],
        preventive: 'Pre-shrink all fabrics',
        operatorFault: false
      }
    ]
  },

  CUTTING_ISSUES: {
    id: 'cutting_issues',
    label: { en: 'Cutting Issues', np: 'काटने समस्या' },
    icon: '✂️',
    color: 'orange',
    operatorFault: false, // Cutting team's responsibility
    types: [
      {
        id: 'cutting_pattern_wrong',
        en: 'Wrong Cutting Pattern',
        np: 'गलत काटने ढाँचा',
        icon: '📐',
        severity: 'major',
        commonCauses: ['Wrong pattern used', 'Pattern placement error', 'Measurement mistake'],
        preventive: 'Double-check pattern before cutting',
        operatorFault: false
      },
      {
        id: 'size_mismatch',
        en: 'Size Mismatch',
        np: 'नापको बेमेल',
        icon: '📏',
        severity: 'major',
        commonCauses: ['Wrong size cut', 'Pattern scaling error', 'Measurement error'],
        preventive: 'Verify sizes before cutting',
        operatorFault: false
      },
      {
        id: 'cutting_not_straight',
        en: 'Uneven Cutting',
        np: 'असमान काटिएको',
        icon: '📏',
        severity: 'minor',
        commonCauses: ['Dull blade', 'Poor technique', 'Unstable surface'],
        preventive: 'Regular blade maintenance',
        operatorFault: false
      },
      {
        id: 'notch_missing',
        en: 'Missing Notches',
        np: 'निसाना छुटेको',
        icon: '✂️',
        severity: 'minor',
        commonCauses: ['Rushed cutting', 'Pattern not followed', 'Tool malfunction'],
        preventive: 'Follow pattern markings carefully',
        operatorFault: false
      }
    ]
  },

  COLOR_ISSUES: {
    id: 'color_issues',
    label: { en: 'Color Issues', np: 'रंगको समस्या' },
    icon: '🎨',
    color: 'purple',
    operatorFault: false, // Dyeing/supply chain issue
    types: [
      {
        id: 'color_shade_mismatch',
        en: 'Color Shade Mismatch',
        np: 'रंगको छाया नमिल्ने',
        icon: '🌈',
        severity: 'major',
        commonCauses: ['Different dye lot', 'Fading', 'Poor color matching'],
        preventive: 'Match color lots before cutting',
        operatorFault: false
      },
      {
        id: 'color_fading',
        en: 'Color Fading',
        np: 'रंग फिक्का',
        icon: '🌫️',
        severity: 'minor',
        commonCauses: ['Poor dyeing', 'UV exposure', 'Chemical reaction'],
        preventive: 'Use quality dyes and proper storage',
        operatorFault: false
      },
      {
        id: 'uneven_dyeing',
        en: 'Uneven Dyeing',
        np: 'असमान रंग',
        icon: '🎭',
        severity: 'major',
        commonCauses: ['Poor dye penetration', 'Uneven application', 'Fabric irregularity'],
        preventive: 'Quality control in dyeing process',
        operatorFault: false
      }
    ]
  },

  STITCHING_DEFECTS: {
    id: 'stitching_defects',
    label: { en: 'Stitching Defects', np: 'सिलाईको दोष' },
    icon: '🧵',
    color: 'blue',
    operatorFault: true, // Operator's responsibility
    types: [
      {
        id: 'skip_stitch',
        en: 'Skip Stitch',
        np: 'सिलाई छुटेको',
        icon: '⚪',
        severity: 'minor',
        commonCauses: ['Dull needle', 'Wrong thread tension', 'Poor technique'],
        preventive: 'Regular needle change and tension adjustment',
        operatorFault: true,
        penalty: 0.1 // 10% payment reduction
      },
      {
        id: 'thread_break',
        en: 'Thread Breakage',
        np: 'धागो टुटेको',
        icon: '🔗',
        severity: 'minor',
        commonCauses: ['High tension', 'Poor thread quality', 'Needle issues'],
        preventive: 'Use quality thread and proper tension',
        operatorFault: true,
        penalty: 0.05 // 5% payment reduction
      },
      {
        id: 'uneven_stitching',
        en: 'Uneven Stitching',
        np: 'असमान सिलाई',
        icon: '〰️',
        severity: 'minor',
        commonCauses: ['Inconsistent speed', 'Poor guiding', 'Machine issues'],
        preventive: 'Maintain steady speed and proper guiding',
        operatorFault: true,
        penalty: 0.1 // 10% payment reduction
      },
      {
        id: 'wrong_stitch_type',
        en: 'Wrong Stitch Type',
        np: 'गलत सिलाई प्रकार',
        icon: '❌',
        severity: 'major',
        commonCauses: ['Machine settings', 'Operator error', 'Instruction misunderstanding'],
        preventive: 'Verify stitch requirements before starting',
        operatorFault: true,
        penalty: 0.25 // 25% payment reduction
      }
    ]
  },

  MACHINE_RELATED: {
    id: 'machine_related',
    label: { en: 'Machine Issues', np: 'मेसिनको समस्या' },
    icon: '⚙️',
    color: 'gray',
    operatorFault: false, // Machine maintenance issue
    types: [
      {
        id: 'needle_damage',
        en: 'Needle Damage/Marks',
        np: 'सुईको दाग',
        icon: '📍',
        severity: 'minor',
        commonCauses: ['Blunt needle', 'Wrong needle size', 'Machine timing'],
        preventive: 'Regular needle replacement',
        operatorFault: false
      },
      {
        id: 'oil_stain_machine',
        en: 'Machine Oil Stain',
        np: 'मेसिनको तेलको दाग',
        icon: '🛠️',
        severity: 'minor',
        commonCauses: ['Over-lubrication', 'Leaking parts', 'Poor maintenance'],
        preventive: 'Regular machine maintenance',
        operatorFault: false
      },
      {
        id: 'tension_marks',
        en: 'Tension Marks',
        np: 'तनावको निशान',
        icon: '⚡',
        severity: 'minor',
        commonCauses: ['Incorrect tension', 'Machine malfunction', 'Thread issues'],
        preventive: 'Regular tension calibration',
        operatorFault: false
      }
    ]
  },

  HANDLING_DAMAGE: {
    id: 'handling_damage',
    label: { en: 'Handling Damage', np: 'ह्यान्डलिंग क्षति' },
    icon: '👋',
    color: 'yellow',
    operatorFault: true, // Operator's responsibility
    types: [
      {
        id: 'wrinkles',
        en: 'Wrinkles/Creases',
        np: 'चाउरी/सिकुडन',
        icon: '〰️',
        severity: 'minor',
        commonCauses: ['Rough handling', 'Improper storage', 'Pressure marks'],
        preventive: 'Handle garments carefully',
        operatorFault: true,
        penalty: 0.05 // 5% payment reduction
      },
      {
        id: 'stretching',
        en: 'Fabric Stretching',
        np: 'कपडा तानिएको',
        icon: '↔️',
        severity: 'minor',
        commonCauses: ['Excessive pulling', 'Wrong handling', 'Fabric type misunderstanding'],
        preventive: 'Use proper handling techniques',
        operatorFault: true,
        penalty: 0.1 // 10% payment reduction
      },
      {
        id: 'dirt_from_hands',
        en: 'Dirt from Hands',
        np: 'हातको फोहोर',
        icon: '✋',
        severity: 'minor',
        commonCauses: ['Dirty hands', 'No gloves', 'Food stains'],
        preventive: 'Wash hands regularly, use gloves',
        operatorFault: true,
        penalty: 0.05 // 5% payment reduction
      }
    ]
  }
};

// Helper functions
export const getAllDamageTypes = () => {
  const allTypes = [];
  Object.values(DAMAGE_CATEGORIES).forEach(category => {
    category.types.forEach(type => {
      allTypes.push({
        ...type,
        category: category.id,
        categoryLabel: category.label
      });
    });
  });
  return allTypes;
};

export const getDamageTypeById = (typeId) => {
  for (const category of Object.values(DAMAGE_CATEGORIES)) {
    const type = category.types.find(t => t.id === typeId);
    if (type) {
      return {
        ...type,
        category: category.id,
        categoryLabel: category.label
      };
    }
  }
  return null;
};

export const getDamageTypesByCategory = (categoryId) => {
  const category = DAMAGE_CATEGORIES[categoryId.toUpperCase()];
  return category ? category.types : [];
};

export const isOperatorFault = (damageTypeId) => {
  const damageType = getDamageTypeById(damageTypeId);
  return damageType ? damageType.operatorFault : false;
};

export const getDamagePenalty = (damageTypeId, severity = 'minor') => {
  const damageType = getDamageTypeById(damageTypeId);
  if (!damageType || !damageType.operatorFault) return 0;
  
  // Base penalty from type configuration
  const basePenalty = damageType.penalty || 0;
  
  // Severity multiplier
  const severityMultiplier = {
    minor: 1,
    major: 1.5,
    severe: 2
  };
  
  return basePenalty * (severityMultiplier[severity] || 1);
};

// Configuration for damage prevention tips
export const DAMAGE_PREVENTION_TIPS = {
  fabric_defects: {
    en: [
      "Inspect fabric quality before cutting",
      "Store fabric in clean, dry conditions", 
      "Handle fabric gently to prevent tears",
      "Check for stains before starting work"
    ],
    np: [
      "काट्नु अघि कपडाको गुणस्तर जाँच गर्नुहोस्",
      "कपडालाई सफा र सुख्खा ठाउँमा भण्डारण गर्नुहोस्",
      "कपडालाई बिस्तारै ह्यान्डल गर्नुहोस्",
      "काम सुरु गर्नु अघि दागको जाँच गर्नुहोस्"
    ]
  },
  stitching_defects: {
    en: [
      "Change needles regularly",
      "Maintain proper thread tension",
      "Use correct stitch type for operation", 
      "Keep steady stitching speed"
    ],
    np: [
      "नियमित रूपमा सुई बदल्नुहोस्",
      "धागोको उचित तनाव राख्नुहोस्",
      "सही सिलाई प्रकार प्रयोग गर्नुहोस्",
      "स्थिर सिलाई गति राख्नुहोस्"
    ]
  }
};

// Damage urgency levels
export const DAMAGE_URGENCY_LEVELS = {
  LOW: {
    id: 'low',
    label: { en: 'Low Priority', np: 'कम प्राथमिकता' },
    icon: '🟢',
    color: 'green',
    maxResponseTime: 4 // hours
  },
  NORMAL: {
    id: 'normal', 
    label: { en: 'Normal Priority', np: 'सामान्य प्राथमिकता' },
    icon: '🟡',
    color: 'yellow',
    maxResponseTime: 2 // hours
  },
  HIGH: {
    id: 'high',
    label: { en: 'High Priority', np: 'उच्च प्राथमिकता' },
    icon: '🟠',
    color: 'orange',
    maxResponseTime: 1 // hour
  },
  URGENT: {
    id: 'urgent',
    label: { en: 'Urgent', np: 'तत्काल' },
    icon: '🔴',
    color: 'red',
    maxResponseTime: 0.25 // 15 minutes
  }
};

export default {
  DAMAGE_CATEGORIES,
  DAMAGE_PREVENTION_TIPS,
  DAMAGE_URGENCY_LEVELS,
  getAllDamageTypes,
  getDamageTypeById,
  isOperatorFault,
  getDamagePenalty
};