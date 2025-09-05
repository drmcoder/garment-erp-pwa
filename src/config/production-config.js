// Production Configuration
// Machine types, sizes, and production-related configurations

// Size Configurations
export const SIZE_CONFIGURATIONS = {
  "standard-shirt": {
    name: "Standard Shirt Sizes",
    nameNepali: "सामान्य शर्ट साइज",
    sizes: ["L", "XL", "2XL", "3XL"],
    category: "apparel",
    defaultSize: "XL",
  },
  "numeric-sizes": {
    name: "Numeric Sizes",
    nameNepali: "संख्यात्मक साइज",
    sizes: ["20", "22", "24", "26", "28", "30", "32"],
    category: "pants",
    defaultSize: "26",
  },
  "kids-sizes": {
    name: "Kids Sizes",
    nameNepali: "बालबालिकाका साइज",
    sizes: ["M", "L", "XL", "2XL"],
    category: "kids",
    defaultSize: "L",
  },
  "plus-sizes": {
    name: "Plus Sizes",
    nameNepali: "ठूला साइज",
    sizes: ["4XL", "5XL", "6XL", "7XL"],
    category: "plus",
    defaultSize: "4XL",
  },
  "free-size": {
    name: "Free Size",
    nameNepali: "फ्री साइज",
    sizes: ["FREE"],
    category: "accessories",
    defaultSize: "FREE",
  },
};

// Machine Type Configurations
export const MACHINE_TYPES = {
  overlock: {
    name: "Overlock Machine",
    nameNepali: "ओभरलक मेसिन",
    operations: ["shoulderJoin", "sideSeam", "sleeves"],
    avgSpeed: 45,
    efficiency: 85,
    category: "sewing",
    requiredSkills: ["overlock-basic", "overlock-intermediate", "overlock-advanced"],
  },
  flatlock: {
    name: "Flatlock Machine",
    nameNepali: "फ्ल्याटलक मेसिन",
    operations: ["hemFold", "hemming", "finishing"],
    avgSpeed: 40,
    efficiency: 80,
    category: "sewing",
    requiredSkills: ["flatlock-basic", "flatlock-intermediate", "flatlock-advanced"],
  },
  singleNeedle: {
    name: "Single Needle Machine",
    nameNepali: "सिंगल निडल मेसिन",
    operations: ["collar", "waistband", "topStitch"],
    avgSpeed: 35,
    efficiency: 90,
    category: "sewing",
    requiredSkills: ["single-needle-basic", "single-needle-intermediate", "single-needle-advanced"],
  },
  buttonhole: {
    name: "Buttonhole Machine",
    nameNepali: "बटनहोल मेसिन",
    operations: ["buttonhole"],
    avgSpeed: 20,
    efficiency: 95,
    category: "finishing",
    requiredSkills: ["buttonhole-basic", "buttonhole-advanced"],
  },
  buttonAttach: {
    name: "Button Attach Machine",
    nameNepali: "बटन जोड्ने मेसिन",
    operations: ["buttonAttach"],
    avgSpeed: 25,
    efficiency: 92,
    category: "finishing",
    requiredSkills: ["button-attach-basic", "button-attach-advanced"],
  },
  iron: {
    name: "Iron Press",
    nameNepali: "इस्त्री प्रेस",
    operations: ["pressing", "finishing"],
    avgSpeed: 30,
    efficiency: 88,
    category: "finishing",
    requiredSkills: ["pressing-basic", "pressing-advanced"],
  },
  cutting: {
    name: "Cutting Machine",
    nameNepali: "काट्ने मेसिन",
    operations: ["cutting"],
    avgSpeed: 50,
    efficiency: 95,
    category: "cutting",
    requiredSkills: ["cutting-basic", "cutting-advanced"],
  },
  kansai: {
    name: "Kansai Special Machine",
    nameNepali: "कान्साई स्पेसल मेसिन",
    operations: ["specialSeaming", "multiNeedleWork", "decorativeStitch"],
    avgSpeed: 42,
    efficiency: 88,
    category: "special",
    requiredSkills: ["kansai-basic", "kansai-intermediate", "kansai-advanced"],
  },
};

// Operation Definitions
export const OPERATIONS = {
  // Sewing Operations
  shoulderJoin: {
    name: "Shoulder Join",
    nameNepali: "काँध जोडाई",
    machineTypes: ["overlock"],
    estimatedTime: 8, // minutes
    difficulty: "medium",
    quality_checkpoints: ["seam_strength", "alignment"]
  },
  sideSeam: {
    name: "Side Seam",
    nameNepali: "छेउको सिलाई",
    machineTypes: ["overlock", "flatlock"],
    estimatedTime: 12,
    difficulty: "easy",
    quality_checkpoints: ["straight_seam", "consistent_tension"]
  },
  sleeves: {
    name: "Sleeves",
    nameNepali: "बाहुला",
    machineTypes: ["overlock"],
    estimatedTime: 15,
    difficulty: "medium",
    quality_checkpoints: ["sleeve_attachment", "curve_smoothness"]
  },
  collar: {
    name: "Collar",
    nameNepali: "कलर",
    machineTypes: ["singleNeedle"],
    estimatedTime: 20,
    difficulty: "hard",
    quality_checkpoints: ["collar_shape", "stitch_quality", "alignment"]
  },
  hemming: {
    name: "Hemming",
    nameNepali: "घेरा सिलाई",
    machineTypes: ["flatlock", "singleNeedle"],
    estimatedTime: 10,
    difficulty: "easy",
    quality_checkpoints: ["hem_width", "stitch_consistency"]
  },
  buttonhole: {
    name: "Buttonhole",
    nameNepali: "बटन खोल्ने ठाउँ",
    machineTypes: ["buttonhole"],
    estimatedTime: 3,
    difficulty: "medium",
    quality_checkpoints: ["hole_size", "bartack_quality"]
  },
  buttonAttach: {
    name: "Button Attach",
    nameNepali: "बटन जडान",
    machineTypes: ["buttonAttach"],
    estimatedTime: 2,
    difficulty: "easy",
    quality_checkpoints: ["button_security", "thread_quality"]
  },
  pressing: {
    name: "Pressing",
    nameNepali: "इस्त्री",
    machineTypes: ["iron"],
    estimatedTime: 5,
    difficulty: "easy",
    quality_checkpoints: ["crease_sharpness", "fabric_smoothness"]
  }
};

// Garment Type Workflows
export const GARMENT_WORKFLOWS = {
  tshirt: {
    name: "T-Shirt",
    nameNepali: "टी-शर्ट",
    operations: ["shoulderJoin", "sideSeam", "sleeves", "hemming", "pressing"],
    estimatedTotalTime: 55,
    complexity: "medium"
  },
  polo: {
    name: "Polo T-Shirt",
    nameNepali: "पोलो टी-शर्ट",
    operations: ["shoulderJoin", "sideSeam", "sleeves", "collar", "buttonhole", "buttonAttach", "hemming", "pressing"],
    estimatedTotalTime: 85,
    complexity: "hard"
  },
  shirt: {
    name: "Shirt",
    nameNepali: "शर्ट",
    operations: ["shoulderJoin", "sideSeam", "sleeves", "collar", "buttonhole", "buttonAttach", "hemming", "pressing"],
    estimatedTotalTime: 90,
    complexity: "hard"
  },
  pants: {
    name: "Pants",
    nameNepali: "पान्ट",
    operations: ["sideSeam", "hemming", "pressing"],
    estimatedTotalTime: 40,
    complexity: "easy"
  }
};

// Quality Standards
export const QUALITY_STANDARDS = {
  defect_types: [
    { id: "broken_stitch", name: "Broken Stitch", nameNepali: "भाँचिएको सिलाई", severity: "high" },
    { id: "uneven_seam", name: "Uneven Seam", nameNepali: "असमान सिलाई", severity: "medium" },
    { id: "loose_button", name: "Loose Button", nameNepali: "ढिलो बटन", severity: "medium" },
    { id: "stain", name: "Stain", nameNepali: "दाग", severity: "high" },
    { id: "hole", name: "Hole", nameNepali: "प्वाल", severity: "critical" },
    { id: "color_mismatch", name: "Color Mismatch", nameNepali: "रंग नमिलेको", severity: "high" },
    { id: "size_error", name: "Size Error", nameNepali: "साइज गलत", severity: "critical" }
  ],
  acceptance_criteria: {
    critical_defects: 0,
    major_defects: 1,
    minor_defects: 3,
    overall_quality_score: 85 // minimum percentage
  }
};

// Production Targets
export const PRODUCTION_TARGETS = {
  daily_targets: {
    operator: {
      pieces_per_hour: 12,
      hours_per_day: 8,
      efficiency_target: 80, // percentage
      quality_target: 90 // percentage
    },
    line: {
      pieces_per_hour: 100,
      hours_per_day: 8,
      efficiency_target: 85,
      quality_target: 92
    }
  },
  weekly_targets: {
    operator: {
      total_pieces: 672, // 12 * 8 * 7 * 0.8
      quality_maintenance: 90,
      attendance_target: 95
    }
  }
};

export default {
  SIZE_CONFIGURATIONS,
  MACHINE_TYPES,
  OPERATIONS,
  GARMENT_WORKFLOWS,
  QUALITY_STANDARDS,
  PRODUCTION_TARGETS
};