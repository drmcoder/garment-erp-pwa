// ================================================================================================
// CENTRALIZED MOCK DATA FOR GARMENT ERP APPLICATION
// ================================================================================================
// This file centralizes all mock/demo data that was previously scattered across components
// Organized by data type and relationship for better maintainability
// ================================================================================================

// ================================================================================================
// USERS & AUTHENTICATION
// ================================================================================================

export const mockUsers = [
  {
    username: 'ram.singh',
    name: 'Ram Singh',
    nameNepali: 'राम सिंह',
    role: 'operator',
    id: 1,
    password: 'password123',
    machine: 'overlock',
    skillLevel: 'expert',
    station: 'overlock-1',
    shift: 'morning',
    profilePic: null,
    joinDate: '2023-01-15',
    totalExperience: 5,
    specializations: ['shoulderJoin', 'sideSeam', 'armholeJoin'],
    dailyTarget: 120,
    monthlyTarget: 2600,
    currentEfficiency: 88,
    qualityScore: 96,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    username: 'sita.devi',  
    name: 'Sita Devi',
    nameNepali: 'सीता देवी',
    role: 'operator',
    id: 2,
    password: 'password123',
    machine: 'flatlock',
    skillLevel: 'expert',
    station: 'flatlock-1',
    shift: 'morning',
    profilePic: null,
    joinDate: '2022-08-20',
    totalExperience: 7,
    specializations: ['hemFold', 'topStitch', 'finishing'],
    dailyTarget: 110,
    monthlyTarget: 2400,
    currentEfficiency: 92,
    qualityScore: 98,
    lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    username: 'hari.supervisor',
    name: 'Hari Pokharel',
    nameNepali: 'हरि पोखरेल',
    role: 'supervisor', 
    id: 'super1',
    password: 'super123',
    department: 'production',
    shift: 'morning',
    experience: 8,
    linesManaged: ['line-1', 'line-2'],
    operatorsSupervised: [1, 2, 3, 4],
    certifications: ['lean-manufacturing', 'quality-control'],
    lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
  },
  {
    username: 'admin.manager',
    name: 'Admin Manager',
    nameNepali: 'प्रशासक प्रबन्धक',
    role: 'management',
    id: 'admin1',
    password: 'admin123',
    department: 'management',
    permissions: ['all'],
    lastLogin: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    username: 'ka2468',
    name: 'Krishna Aryal', 
    nameNepali: 'कृष्ण अर्याल',
    role: 'operator',
    id: 3,
    password: 'password123',
    machine: 'singleNeedle',
    skillLevel: 'intermediate',
    station: 'single-needle-1',
    shift: 'morning',
    profilePic: null,
    joinDate: '2023-06-10',
    totalExperience: 3,
    specializations: ['placket', 'buttonhole', 'collar'],
    dailyTarget: 100,
    monthlyTarget: 2200,
    currentEfficiency: 78,
    qualityScore: 94,
    lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
  {
    username: 'su1832',
    name: 'Sunita Sharma',
    nameNepali: 'सुनिता शर्मा',
    role: 'operator', 
    id: 4,
    password: 'password123',
    machine: 'singleNeedle',
    skillLevel: 'beginner',
    station: 'single-needle-2',
    shift: 'morning',
    profilePic: null,
    joinDate: '2024-01-05',
    totalExperience: 1,
    specializations: ['hemming', 'basic-stitching'],
    dailyTarget: 80,
    monthlyTarget: 1800,
    currentEfficiency: 65,
    qualityScore: 90,
    lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
  }
];

// ================================================================================================
// OPERATIONS & TEMPLATES (from WIPManualEntry.jsx)
// ================================================================================================

export const OPERATION_MODULES = {
  // Basic Construction Modules
  'shoulder-join-basic': { name: 'Shoulder Join (Basic)', nameNepali: 'काँध जोड्ने (आधारभूत)', machine: 'overlock', time: 2, rate: 2.0 },
  'shoulder-join-reinforced': { name: 'Shoulder Join (Reinforced)', nameNepali: 'काँध जोड्ने (बलियो)', machine: 'overlock', time: 3, rate: 2.5 },
  'side-seam-basic': { name: 'Side Seam (Basic)', nameNepali: 'साइड सिम (आधारभूत)', machine: 'overlock', time: 3, rate: 2.5 },
  'side-seam-flat': { name: 'Side Seam (Flat Seam)', nameNepali: 'साइड सिम (फ्ल्यात सिम)', machine: 'flatlock', time: 4, rate: 3.0 },
  
  // Sleeve Modules
  'sleeve-attach-basic': { name: 'Sleeve Attach (Basic)', nameNepali: 'आस्तीन जोड्ने (आधारभूत)', machine: 'overlock', time: 4, rate: 3.0 },
  'sleeve-attach-set-in': { name: 'Set-in Sleeve', nameNepali: 'सेट-इन आस्तीन', machine: 'single-needle', time: 6, rate: 4.0 },
  'sleeve-raglan': { name: 'Raglan Sleeve', nameNepali: 'र्याग्लान आस्तीन', machine: 'overlock', time: 5, rate: 3.5 },
  
  // Neckline Modules
  'neck-bind-basic': { name: 'Neck Bind (Basic)', nameNepali: 'घाँटी बाइन्डिङ (आधारभूत)', machine: 'flatlock', time: 6, rate: 4.0 },
  'collar-attach-polo': { name: 'Polo Collar Attach', nameNepali: 'पोलो कलर जोड्ने', machine: 'single-needle', time: 8, rate: 5.0 },
  'collar-attach-shirt': { name: 'Shirt Collar Attach', nameNepali: 'शर्ट कलर जोड्ने', machine: 'single-needle', time: 12, rate: 7.0 },
  'hood-attach': { name: 'Hood Attach', nameNepali: 'हुड जोड्ने', machine: 'single-needle', time: 10, rate: 6.0 },
  
  // Finishing Modules
  'bottom-hem-basic': { name: 'Bottom Hem (Basic)', nameNepali: 'तल्लो हेम (आधारभूत)', machine: 'single-needle', time: 4, rate: 3.0 },
  'bottom-hem-reinforced': { name: 'Bottom Hem (Reinforced)', nameNepali: 'तल्लो हेम (बलियो)', machine: 'single-needle', time: 5, rate: 3.5 },
  'cuff-attach': { name: 'Cuff Attach', nameNepali: 'कफ जोड्ने', machine: 'flatlock', time: 6, rate: 4.0 },
  
  // Special Features
  'pocket-attach-basic': { name: 'Pocket Attach (Basic)', nameNepali: 'खल्ती जोड्ने (आधारभूत)', machine: 'single-needle', time: 6, rate: 4.0 },
  'pocket-attach-welt': { name: 'Welt Pocket', nameNepali: 'वेल्ट खल्ती', machine: 'single-needle', time: 12, rate: 8.0 },
  'zipper-install': { name: 'Zipper Install', nameNepali: 'जिप्पर जडान', machine: 'single-needle', time: 12, rate: 8.0 },
  'buttonhole-make': { name: 'Buttonhole Making', nameNepali: 'बटनहोल बनाउने', machine: 'buttonhole', time: 8, rate: 6.0 },
  
  // Bottom Wear Modules
  'inseam': { name: 'Inseam', nameNepali: 'भित्री सिम', machine: 'overlock', time: 4, rate: 3.0 },
  'outseam': { name: 'Outseam', nameNepali: 'बाहिरी सिम', machine: 'overlock', time: 4, rate: 3.0 },
  'crotch-seam': { name: 'Crotch Seam', nameNepali: 'क्रच सिम', machine: 'overlock', time: 5, rate: 3.5 },
  'waistband-attach': { name: 'Waistband Attach', nameNepali: 'कम्मरको पेटी जोड्ने', machine: 'single-needle', time: 8, rate: 5.0 },
  'elastic-insert': { name: 'Elastic Insert', nameNepali: 'इलास्टिक घुसाउने', machine: 'single-needle', time: 6, rate: 4.0 },
  
  // Legacy operations for backward compatibility
  'hem-basic': { name: 'Basic Hem', nameNepali: 'आधारभूत हेम', machine: 'single-needle', time: 2, rate: 1.5 },
  'hem-blind': { name: 'Blind Hem', nameNepali: 'अन्धो हेम', machine: 'blind-hem', time: 3, rate: 2.0 },
  'topstitch-basic': { name: 'Basic Topstitch', nameNepali: 'आधारभूत टपस्टिच', machine: 'single-needle', time: 2, rate: 1.8 },
  'topstitch-decorative': { name: 'Decorative Topstitch', nameNepali: 'सजावटी टपस्टिच', machine: 'single-needle', time: 4, rate: 2.5 },
  'buttonhole-basic': { name: 'Basic Buttonhole', nameNepali: 'आधारभूत बटनहोल', machine: 'buttonhole', time: 1, rate: 0.8 },
  'buttonhole-keyhole': { name: 'Keyhole Buttonhole', nameNepali: 'किहोल बटनहोल', machine: 'buttonhole', time: 2, rate: 1.2 },
  'collar-attach': { name: 'Collar Attachment', nameNepali: 'कलर जोड्ने', machine: 'single-needle', time: 8, rate: 4.5 },
  'placket-basic': { name: 'Basic Placket', nameNepali: 'आधारभूत प्लाकेट', machine: 'single-needle', time: 6, rate: 3.2 },
  'placket-continuous': { name: 'Continuous Placket', nameNepali: 'निरन्तर प्लाकेट', machine: 'single-needle', time: 10, rate: 5.5 }
};

export const PROCEDURE_TEMPLATES = {
  // T-Shirt Family
  'basic-tshirt': {
    id: 'basic-tshirt',
    name: 'Basic T-Shirt',
    nameNepali: 'आधारभूत टी-शर्ट',
    category: 'tops',
    icon: '👕',
    description: 'Simple crew neck t-shirt with basic construction',
    descriptionNepali: 'आधारभूत निर्माणको साधारण क्रू नेक टी-शर्ट',
    operations: ['shoulder-join-basic', 'side-seam-basic', 'sleeve-attach-basic', 'neck-bind-basic', 'bottom-hem-basic'],
    estimatedTime: 19, // minutes
    complexity: 'beginner'
  },
  'polo-tshirt': {
    id: 'polo-tshirt',
    name: 'Polo T-Shirt',
    nameNepali: 'पोलो टी-शर्ट',
    category: 'tops',
    icon: '👕',
    description: 'Polo shirt with collar and reinforced construction',
    descriptionNepali: 'कलर र बलियो निर्माण सहितको पोलो शर्ट',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'collar-attach-polo', 'sleeve-attach-basic', 'bottom-hem-reinforced'],
    estimatedTime: 24,
    complexity: 'intermediate'
  },
  'premium-tshirt': {
    id: 'premium-tshirt',
    name: 'Premium T-Shirt',
    nameNepali: 'प्रिमियम टी-शर्ट',
    category: 'tops',
    icon: '👕',
    description: 'High-quality t-shirt with flat seams and pocket',
    descriptionNepali: 'फ्ल्यात सिम र खल्ती सहितको उच्च गुणस्तरको टी-शर्ट',
    operations: ['shoulder-join-reinforced', 'side-seam-flat', 'sleeve-attach-set-in', 'neck-bind-basic', 'pocket-attach-basic', 'bottom-hem-reinforced'],
    estimatedTime: 28,
    complexity: 'expert'
  },
  
  // Outerwear Family
  'hoodie-basic': {
    id: 'hoodie-basic',
    name: 'Basic Hoodie',
    nameNepali: 'आधारभूत हुडी',
    category: 'outerwear',
    icon: '🧥',
    description: 'Pullover hoodie with front pocket',
    descriptionNepali: 'अगाडि खल्ती भएको पुलओभर हुडी',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'sleeve-raglan', 'hood-attach', 'pocket-attach-basic', 'cuff-attach', 'bottom-hem-reinforced'],
    estimatedTime: 41,
    complexity: 'intermediate'
  },
  'hoodie-zip': {
    id: 'hoodie-zip',
    name: 'Zip Hoodie',
    nameNepali: 'जिप हुडी',
    category: 'outerwear',
    icon: '🧥',
    description: 'Full-zip hoodie jacket with pockets',
    descriptionNepali: 'खल्ती सहितको फुल-जिप हुडी ज्याकेट',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'sleeve-raglan', 'hood-attach', 'zipper-install', 'pocket-attach-welt', 'cuff-attach', 'bottom-hem-reinforced'],
    estimatedTime: 55,
    complexity: 'expert'
  },
  'jacket-basic': {
    id: 'jacket-basic',
    name: 'Basic Jacket',
    nameNepali: 'आधारभूत ज्याकेट',
    category: 'outerwear',
    icon: '🧥',
    description: 'Simple zip-up jacket',
    descriptionNepali: 'साधारण जिप-अप ज्याकेट',
    operations: ['shoulder-join-reinforced', 'side-seam-basic', 'sleeve-attach-set-in', 'zipper-install', 'pocket-attach-basic', 'bottom-hem-basic'],
    estimatedTime: 37,
    complexity: 'intermediate'
  },
  
  // Bottom Wear Family
  'shorts-basic': {
    id: 'shorts-basic',
    name: 'Basic Shorts',
    nameNepali: 'आधारभूत हाफ प्यान्ट',
    category: 'bottoms',
    icon: '🩳',
    description: 'Simple elastic waist shorts',
    descriptionNepali: 'साधारण इलास्टिक कम्मरको हाफ प्यान्ट',
    operations: ['inseam', 'outseam', 'crotch-seam', 'elastic-insert', 'bottom-hem-basic'],
    estimatedTime: 21,
    complexity: 'beginner'
  },
  'shorts-premium': {
    id: 'shorts-premium',
    name: 'Premium Shorts',
    nameNepali: 'प्रिमियम हाफ प्यान्ट',
    category: 'bottoms',
    icon: '🩳',
    description: 'Tailored shorts with waistband and pockets',
    descriptionNepali: 'कम्मरको पेटी र खल्ती सहितको टेलर्ड हाफ प्यान्ट',
    operations: ['inseam', 'outseam', 'crotch-seam', 'waistband-attach', 'pocket-attach-basic', 'bottom-hem-basic'],
    estimatedTime: 25,
    complexity: 'intermediate'
  },
  'pants-casual': {
    id: 'pants-casual',
    name: 'Casual Pants',
    nameNepali: 'क्यासुअल प्यान्ट',
    category: 'bottoms',
    icon: '👖',
    description: 'Regular fit casual pants',
    descriptionNepali: 'नियमित फिटको क्यासुअल प्यान्ट',
    operations: ['inseam', 'outseam', 'crotch-seam', 'waistband-attach', 'pocket-attach-basic', 'bottom-hem-basic'],
    estimatedTime: 25,
    complexity: 'intermediate'
  },
  
  // Shirt Family  
  'shirt-casual': {
    id: 'shirt-casual',
    name: 'Casual Shirt',
    nameNepali: 'क्यासुअल शर्ट',
    category: 'shirts',
    icon: '👔',
    description: 'Button-up casual shirt',
    descriptionNepali: 'बटन-अप क्यासुअल शर्ट',
    operations: ['shoulder-join-basic', 'side-seam-basic', 'sleeve-attach-set-in', 'collar-attach-shirt', 'buttonhole-make', 'bottom-hem-basic'],
    estimatedTime: 37,
    complexity: 'expert'
  },
  
  // Legacy templates for backward compatibility
  'premium-shirt': {
    id: 'premium-shirt',
    name: 'Premium Shirt',
    nameNepali: 'प्रिमियम शर्ट',
    category: 'tops',
    icon: '👔',
    description: 'High-end shirt with advanced features',
    descriptionNepali: 'उन्नत सुविधा सहितको उच्च-स्तरीय शर्ट',
    operations: ['collar-attach', 'placket-continuous', 'buttonhole-keyhole', 'shoulder-join-reinforced', 'side-seam-flat', 'topstitch-decorative'],
    estimatedTime: 41,
    complexity: 'expert'
  }
};

// ================================================================================================
// MACHINE TYPES & CONFIGURATIONS
// ================================================================================================

export const MACHINE_TYPES = [
  {
    id: 'overlock',
    name: 'Overlock',
    nameNepali: 'ओभरलक',
    icon: '🔗',
    totalMachines: 6,
    operations: ['shoulderJoin', 'sideSeam', 'armholeJoin', 'sleeve'],
    avgTimePerPiece: 2.5, // minutes
    maintenanceInterval: 7, // days
    powerConsumption: 0.75, // kW
    skillLevelRequired: 'intermediate'
  },
  {
    id: 'flatlock',
    name: 'Flatlock',
    nameNepali: 'फ्ल्यालक',
    icon: '📎',
    totalMachines: 4,
    operations: ['hemFold', 'topStitch', 'finishing'],
    avgTimePerPiece: 2.0,
    maintenanceInterval: 10,
    powerConsumption: 0.65,
    skillLevelRequired: 'intermediate'
  },
  {
    id: 'single-needle',
    name: 'Single Needle',
    nameNepali: 'एकल सुई',
    icon: '📍',
    totalMachines: 8,
    operations: ['placket', 'collar', 'buttonhole', 'finishing'],
    avgTimePerPiece: 3.5,
    maintenanceInterval: 5,
    powerConsumption: 0.55,
    skillLevelRequired: 'expert'
  },
  {
    id: 'buttonhole',
    name: 'Buttonhole',
    nameNepali: 'बटनहोल',
    icon: '🔘',
    totalMachines: 2,
    operations: ['buttonhole'],
    avgTimePerPiece: 1.0,
    maintenanceInterval: 14,
    powerConsumption: 0.60,
    skillLevelRequired: 'intermediate'
  },
  {
    id: 'iron',
    name: 'Iron',
    nameNepali: 'आइरन',
    icon: '🔥',
    totalMachines: 4,
    operations: ['pressing', 'finishing'],
    avgTimePerPiece: 0.5,
    maintenanceInterval: 30,
    powerConsumption: 1.2,
    skillLevelRequired: 'beginner'
  }
];

// ================================================================================================
// BUNDLES & WORK ITEMS
// ================================================================================================

export const SAMPLE_BUNDLES = [
  {
    id: 1,
    bundleNumber: 'B001-85-BL-XL',
    article: '8085',
    articleName: 'Polo T-Shirt',
    color: 'Blue-1',
    size: 'XL',
    pieces: 30,
    operation: 'shoulderJoin',
    machine: 'overlock',
    rate: 2.50,
    status: 'in-progress',
    priority: 'normal',
    assignedTo: 1,
    assignedBy: 'super1',
    assignedTime: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    startTime: new Date(Date.now() - 45 * 60000),
    completedPieces: 25,
    defectivePieces: 0,
    qualityChecked: false,
    estimatedTime: 60, // minutes
    actualTimeSpent: 45,
    nextOperation: 'topStitch',
    nextMachine: 'flatlock',
    nextOperator: 2,
    lotNumber: 'S-85',
    wipData: {
      fabricType: 'Cotton Pique',
      fabricWeight: '180 GSM',
      fabricColor: 'Navy Blue',
      fabricConsumption: 0.25 // kg per piece
    }
  },
  {
    id: 2,
    bundleNumber: 'B002-33-GR-2XL',
    article: '2233',
    articleName: 'Round Neck T-Shirt',
    color: 'Green-1',
    size: '2XL',
    pieces: 28,
    operation: 'sideSeam',
    machine: 'overlock',
    rate: 2.80,
    status: 'pending',
    priority: 'high',
    assignedTo: 1,
    assignedBy: 'super1',
    assignedTime: new Date(),
    startTime: null,
    completedPieces: 0,
    defectivePieces: 0,
    qualityChecked: false,
    estimatedTime: 50,
    actualTimeSpent: 0,
    nextOperation: 'hemFold',
    nextMachine: 'flatlock',
    nextOperator: 2,
    lotNumber: 'S-77',
    wipData: {
      fabricType: 'Cotton Jersey',
      fabricWeight: '160 GSM',
      fabricColor: 'Forest Green',
      fabricConsumption: 0.22
    }
  }
];

// ================================================================================================
// WIP DATA & LOTS
// ================================================================================================

export const SAMPLE_WIP_DATA = [
  {
    lotNumber: 'S-85',
    articles: ['8085'],
    articleNames: ['Polo T-Shirt'],
    fabricType: 'Cotton Pique',
    fabricWeight: '180 GSM',
    totalRolls: 12,
    totalFabricWeight: 824.5, // kg
    colors: [
      {
        name: 'Blue-1',
        layers: 35,
        pieces: {
          'L': 180,
          'XL': 185,
          '2XL': 190,
          '3XL': 190
        }
      },
      {
        name: 'Blue-2',
        layers: 32,
        pieces: {
          'L': 165,
          'XL': 170,
          '2XL': 175,
          '3XL': 175
        }
      }
    ],
    consumptionRate: 0.25, // kg per piece
    efficiency: 87.5,
    createdDate: new Date('2024-04-10'),
    status: 'in-production'
  },
  {
    lotNumber: 'S-77',
    articles: ['2233'],
    articleNames: ['Round Neck T-Shirt'],
    fabricType: 'Cotton Jersey',
    fabricWeight: '160 GSM',
    totalRolls: 9,
    totalFabricWeight: 263.8,
    colors: [
      {
        name: 'Green-1',
        layers: 28,
        pieces: {
          'L': 224,
          'XL': 216,
          '2XL': 224,
          '3XL': 216
        }
      }
    ],
    consumptionRate: 0.22,
    efficiency: 89.2,
    createdDate: new Date('2024-04-08'),
    status: 'in-production'
  }
];

// ================================================================================================
// NOTIFICATIONS & ALERTS
// ================================================================================================

export const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: 'work-ready',
    title: 'Bundle Ready',
    titleNepali: 'बन्डल तयार',
    message: 'Bundle #B002-33-GR-2XL ready for your station',
    messageNepali: 'बन्डल #B002-33-GR-2XL तपाईंको स्टेसनको लागि तयार छ',
    time: new Date(Date.now() - 2 * 60000),
    read: false,
    urgent: false,
    recipientId: 1,
    senderId: 'super1',
    bundleId: 2,
    actionRequired: true,
    actions: [
      { type: 'accept', label: 'Accept', labelNepali: 'स्वीकार गर्नुहोस्' },
      { type: 'view', label: 'View Details', labelNepali: 'विवरण हेर्नुहोस्' }
    ]
  },
  {
    id: 2,
    type: 'quality-issue',
    title: 'Quality Issue',
    titleNepali: 'गुणस्तर समस्या',
    message: 'Quality issue reported in Bundle #B003-35-WH-L. Please review.',
    messageNepali: 'बन्डल #B003-35-WH-L मा गुणस्तर समस्या रिपोर्ट गरिएको। कृपया समीक्षा गर्नुहोस्।',
    time: new Date(Date.now() - 30 * 60000),
    read: false,
    urgent: true,
    recipientId: 2,
    senderId: 'qc-team',
    bundleId: 3,
    actionRequired: true,
    defectCount: 2
  }
];

// ================================================================================================
// QUALITY & DEFECTS
// ================================================================================================

export const DEFECT_CATEGORIES = [
  {
    id: 'fabric-defects',
    name: 'Fabric Defects',
    nameNepali: 'कपडाको दोष',
    types: [
      { id: 'fabric-hole', name: 'Fabric Hole', nameNepali: 'कपडामा प्वाल', severity: 'major' },
      { id: 'fabric-stain', name: 'Fabric Stain', nameNepali: 'कपडामा दाग', severity: 'minor' },
      { id: 'wrong-fabric', name: 'Wrong Fabric', nameNepali: 'गलत कपडा', severity: 'major' },
      { id: 'fabric-tear', name: 'Fabric Tear', nameNepali: 'कपडा च्यातिएको', severity: 'major' }
    ]
  },
  {
    id: 'stitching-defects',
    name: 'Stitching Problems',
    nameNepali: 'सिलाईको समस्या',
    types: [
      { id: 'broken-stitch', name: 'Broken Stitch', nameNepali: 'बिग्रिएको सिलाई', severity: 'minor' },
      { id: 'loose-stitch', name: 'Loose Stitch', nameNepali: 'ढीलो सिलाई', severity: 'minor' },
      { id: 'wrong-stitch', name: 'Wrong Stitch Type', nameNepali: 'गलत सिलाई', severity: 'major' },
      { id: 'uneven-stitch', name: 'Uneven Stitching', nameNepali: 'असमान सिलाई', severity: 'minor' }
    ]
  }
];

// ================================================================================================
// PRODUCTION STATISTICS
// ================================================================================================

export const SAMPLE_PRODUCTION_STATS = {
  today: {
    date: new Date().toISOString().split('T')[0],
    totalProduction: 3750,
    targetProduction: 5000,
    efficiency: 75,
    qualityScore: 96,
    activeOperators: 48,
    totalOperators: 50,
    completedBundles: 85,
    pendingBundles: 43,
    totalEarnings: 18500,
    avgTimePerPiece: 2.5, // minutes
    topPerformer: {
      id: 2,
      name: 'सीता देवी',
      pieces: 95,
      efficiency: 92
    },
    machineUtilization: {
      overlock: 85,
      flatlock: 78,
      singleNeedle: 92,
      buttonhole: 75,
      iron: 98
    }
  },
  weekly: {
    totalProduction: 24500,
    targetProduction: 30000,
    efficiency: 82,
    qualityScore: 94,
    totalEarnings: 125000,
    trends: {
      production: [3200, 3500, 3800, 3600, 3750, 3900, 2750], // Mon-Sun
      quality: [95, 94, 96, 93, 96, 95, 97],
      efficiency: [78, 82, 85, 80, 82, 86, 75]
    }
  }
};

// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

// Get user by username/id
export const getUserById = (id) => {
  return mockUsers.find(user => user.id === id || user.username === id);
};

// Get operations by machine type
export const getOperationsByMachine = (machineType) => {
  return Object.entries(OPERATION_MODULES)
    .filter(([_, op]) => op.machine === machineType)
    .map(([id, op]) => ({ id, ...op }));
};

// Get template details with operations
export const getTemplateDetails = (templateId) => {
  const template = PROCEDURE_TEMPLATES[templateId];
  if (!template) return null;
  
  const operations = template.operations.map(opId => ({
    id: opId,
    ...OPERATION_MODULES[opId]
  })).filter(Boolean);
  
  return {
    ...template,
    operationDetails: operations,
    totalTime: operations.reduce((sum, op) => sum + op.time, 0),
    totalRate: operations.reduce((sum, op) => sum + op.rate, 0)
  };
};

// Get bundles by status
export const getBundlesByStatus = (status) => {
  return SAMPLE_BUNDLES.filter(bundle => bundle.status === status);
};

// Get operator workload
export const getOperatorWorkload = (operatorId) => {
  const assignedBundles = SAMPLE_BUNDLES.filter(bundle => bundle.assignedTo === operatorId);
  const totalPieces = assignedBundles.reduce((sum, bundle) => sum + bundle.pieces, 0);
  const completedPieces = assignedBundles.reduce((sum, bundle) => sum + bundle.completedPieces, 0);
  
  return {
    assignedBundles: assignedBundles.length,
    totalPieces,
    completedPieces,
    progressPercentage: totalPieces > 0 ? (completedPieces / totalPieces) * 100 : 0
  };
};

// ================================================================================================
// EXPORTS
// ================================================================================================

export default {
  // Users
  mockUsers,
  getUserById,
  
  // Operations & Templates
  OPERATION_MODULES,
  PROCEDURE_TEMPLATES,
  getOperationsByMachine,
  getTemplateDetails,
  
  // Machines
  MACHINE_TYPES,
  
  // Work Items
  SAMPLE_BUNDLES,
  getBundlesByStatus,
  getOperatorWorkload,
  
  // WIP Data
  SAMPLE_WIP_DATA,
  
  // Notifications
  SAMPLE_NOTIFICATIONS,
  
  // Quality
  DEFECT_CATEGORIES,
  
  // Statistics
  SAMPLE_PRODUCTION_STATS
};