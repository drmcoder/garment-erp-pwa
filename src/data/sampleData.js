// Sample data for development and testing
export const sampleOperators = [
  {
    id: 1,
    name: 'राम सिंह',
    username: 'ram.singh',
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
    qualityScore: 96
  },
  {
    id: 2,
    name: 'सीता देवी',
    username: 'sita.devi',
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
    qualityScore: 98
  },
  {
    id: 3,
    name: 'हरि बहादुर',
    username: 'hari.bahadur',
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
    qualityScore: 94
  },
  {
    id: 4,
    name: 'मिना तामाङ',
    username: 'mina.tamang',
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
    qualityScore: 90
  },
  {
    id: 5,
    name: 'कमल गुरुङ',
    username: 'kamal.gurung',
    password: 'password123',
    machine: 'overlock',
    skillLevel: 'intermediate',
    station: 'overlock-2',
    shift: 'evening',
    profilePic: null,
    joinDate: '2023-03-20',
    totalExperience: 4,
    specializations: ['shoulderJoin', 'sideSeam'],
    dailyTarget: 105,
    monthlyTarget: 2300,
    currentEfficiency: 82,
    qualityScore: 95
  }
];

export const sampleSupervisors = [
  {
    id: 'super1',
    name: 'श्याम पोखरेल',
    username: 'supervisor',
    password: 'super123',
    role: 'supervisor',
    department: 'production',
    shift: 'morning',
    experience: 8,
    linesManaged: ['line-1', 'line-2'],
    operatorsSupervised: [1, 2, 3, 4],
    certifications: ['lean-manufacturing', 'quality-control']
  }
];

export const sampleBundles = [
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
  },
  {
    id: 3,
    bundleNumber: 'B003-35-WH-L',
    article: '6635',
    articleName: '3-Button Paper Tops',
    color: 'White-1',
    size: 'L',
    pieces: 40,
    operation: 'hemFold',
    machine: 'flatlock',
    rate: 1.90,
    status: 'pending',
    priority: 'normal',
    assignedTo: 2,
    assignedBy: 'super1',
    assignedTime: new Date(),
    startTime: null,
    completedPieces: 0,
    defectivePieces: 0,
    qualityChecked: false,
    estimatedTime: 70,
    actualTimeSpent: 0,
    nextOperation: 'buttonhole',
    nextMachine: 'buttonhole',
    nextOperator: 3,
    lotNumber: 'S-93',
    wipData: {
      fabricType: 'Paper Cotton',
      fabricWeight: '120 GSM',
      fabricColor: 'Pure White',
      fabricConsumption: 0.30
    }
  },
  {
    id: 4,
    bundleNumber: 'B004-85-BL-L',
    article: '8085',
    articleName: 'Polo T-Shirt',
    color: 'Blue-1',
    size: 'L',
    pieces: 32,
    operation: 'placket',
    machine: 'singleNeedle',
    rate: 3.20,
    status: 'pending',
    priority: 'normal',
    assignedTo: 3,
    assignedBy: 'super1',
    assignedTime: new Date(),
    startTime: null,
    completedPieces: 0,
    defectivePieces: 0,
    qualityChecked: false,
    estimatedTime: 80,
    actualTimeSpent: 0,
    nextOperation: 'collar',
    nextMachine: 'singleNeedle',
    nextOperator: 3,
    lotNumber: 'S-85',
    wipData: {
      fabricType: 'Cotton Pique',
      fabricWeight: '180 GSM',
      fabricColor: 'Navy Blue',
      fabricConsumption: 0.25
    }
  },
  {
    id: 5,
    bundleNumber: 'B005-88-CR-XL',
    article: '2288',
    articleName: 'Full Sleeve T-Shirt',
    color: 'Cream-1',
    size: 'XL',
    pieces: 25,
    operation: 'sleeve',
    machine: 'overlock',
    rate: 4.50,
    status: 'pending',
    priority: 'low',
    assignedTo: null,
    assignedBy: null,
    assignedTime: null,
    startTime: null,
    completedPieces: 0,
    defectivePieces: 0,
    qualityChecked: false,
    estimatedTime: 90,
    actualTimeSpent: 0,
    nextOperation: 'shoulderJoin',
    nextMachine: 'overlock',
    nextOperator: null,
    lotNumber: 'S-35',
    wipData: {
      fabricType: 'Cotton Jersey',
      fabricWeight: '180 GSM',
      fabricColor: 'Cream',
      fabricConsumption: 0.35
    }
  }
];

export const sampleNotifications = [
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
    type: 'reminder',
    title: 'Next Work Coming',
    titleNepali: 'अर्को काम आउँदै',
    message: 'Next work arriving in 10 minutes. Please prepare.',
    messageNepali: 'अर्को काम १० मिनेटमा आउँदै छ। तयारी गर्नुहोस्।',
    time: new Date(Date.now() - 5 * 60000),
    read: false,
    urgent: false,
    recipientId: 1,
    senderId: 'system',
    bundleId: 3,
    actionRequired: false
  },
  {
    id: 3,
    type: 'success',
    title: 'Work Approved',
    titleNepali: 'काम स्वीकृत',
    message: 'Bundle #B001-85-BL-XL completed successfully. Earnings: Rs. 75',
    messageNepali: 'बन्डल #B001-85-BL-XL सफलतापूर्वक सकियो। कमाई: रु. ७५',
    time: new Date(Date.now() - 15 * 60000),
    read: true,
    urgent: false,
    recipientId: 1,
    senderId: 'super1',
    bundleId: 1,
    actionRequired: false,
    earnings: 75.00
  },
  {
    id: 4,
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
  },
  {
    id: 5,
    type: 'efficiency-alert',
    title: 'Efficiency Opportunity',
    titleNepali: 'दक्षता अवसर',
    message: 'Station overlock-2 vacant for 15 minutes. Load work suggested.',
    messageNepali: 'स्टेसन ओभरलक-२ १५ मिनेट खाली छ। काम लोड गर्न सुझाव।',
    time: new Date(Date.now() - 45 * 60000),
    read: false,
    urgent: false,
    recipientId: 'super1',
    senderId: 'system',
    stationId: 'overlock-2',
    actionRequired: true,
    actions: [
      { type: 'load-work', label: 'Load Work', labelNepali: 'काम लोड गर्नुहोस्' },
      { type: 'ignore', label: 'Ignore', labelNepali: 'बेवास्ता गर्नुहोस्' }
    ]
  }
];

export const sampleQualityIssues = [
  {
    id: 1,
    bundleId: 1,
    bundleNumber: 'B001-85-BL-XL',
    operatorId: 1,
    operatorName: 'राम सिंह',
    operation: 'shoulderJoin',
    defectType: 'brokenStitch',
    defectTypeNepali: 'बिग्रिएको सिलाई',
    severity: 'minor',
    affectedPieces: 2,
    totalPieces: 30,
    description: 'Loose stitching found on 2 pieces during quality check',
    descriptionNepali: 'गुणस्तर जाँचको क्रममा २ टुक्रामा ढीलो सिलाई फेला पर्यो',
    cause: 'machine-issue',
    causeNepali: 'मेसिन समस्या',
    reportedBy: 'qc-team',
    reportedTime: new Date(Date.now() - 30 * 60000),
    status: 'open',
    actionTaken: null,
    resolvedBy: null,
    resolvedTime: null,
    preventiveMeasure: 'Machine maintenance required'
  },
  {
    id: 2,
    bundleId: 3,
    bundleNumber: 'B003-35-WH-L',
    operatorId: 2,
    operatorName: 'सीता देवी',
    operation: 'hemFold',
    defectType: 'fabricHole',
    defectTypeNepali: 'कपडामा प्वाल',
    severity: 'major',
    affectedPieces: 1,
    totalPieces: 40,
    description: 'Small hole found in fabric before stitching',
    descriptionNepali: 'सिलाई गर्नु अघि कपडामा सानो प्वाल भेटियो',
    cause: 'fabric-quality',
    causeNepali: 'कपडाको गुणस्तर',
    reportedBy: 2,
    reportedTime: new Date(Date.now() - 45 * 60000),
    status: 'resolved',
    actionTaken: 'Fabric piece replaced',
    resolvedBy: 'super1',
    resolvedTime: new Date(Date.now() - 15 * 60000),
    preventiveMeasure: 'Fabric inspection improved'
  }
];

export const sampleProductionStats = {
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
  },
  monthly: {
    totalProduction: 125000,
    targetProduction: 150000,
    efficiency: 83,
    qualityScore: 95,
    totalEarnings: 625000,
    workingDays: 26,
    trends: {
      weeklyProduction: [28500, 31200, 32800, 30500], // Week 1-4
      qualityTrend: [94, 95, 96, 95],
      efficiencyTrend: [81, 83, 85, 83]
    }
  }
};

export const sampleWIPData = [
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
      },
      {
        name: 'Green-2',
        layers: 27,
        pieces: {
          'L': 216,
          'XL': 208,
          '2XL': 216,
          '3XL': 208
        }
      }
    ],
    consumptionRate: 0.22,
    efficiency: 89.2,
    createdDate: new Date('2024-04-08'),
    status: 'in-production'
  }
];

export const machineTypes = [
  {
    id: 'overlock',
    name: 'Overlock',
    nameNepali: 'ओभरलक',
    totalMachines: 6,
    operations: ['shoulderJoin', 'sideSeam', 'armholeJoin', 'sleeve'],
    avgTimePerPiece: 2.5, // minutes
    maintenanceInterval: 7, // days
    powerConsumption: 0.75 // kW
  },
  {
    id: 'flatlock',
    name: 'Flatlock',
    nameNepali: 'फ्ल्यालक',
    totalMachines: 4,
    operations: ['hemFold', 'topStitch', 'finishing'],
    avgTimePerPiece: 2.0,
    maintenanceInterval: 10,
    powerConsumption: 0.65
  },
  {
    id: 'singleNeedle',
    name: 'Single Needle',
    nameNepali: 'एकल सुई',
    totalMachines: 8,
    operations: ['placket', 'collar', 'buttonhole', 'finishing'],
    avgTimePerPiece: 3.5,
    maintenanceInterval: 5,
    powerConsumption: 0.55
  },
  {
    id: 'buttonhole',
    name: 'Buttonhole',
    nameNepali: 'बटनहोल',
    totalMachines: 2,
    operations: ['buttonhole'],
    avgTimePerPiece: 1.0,
    maintenanceInterval: 14,
    powerConsumption: 0.60
  },
  {
    id: 'iron',
    name: 'Iron',
    nameNepali: 'आइरन',
    totalMachines: 4,
    operations: ['pressing', 'finishing'],
    avgTimePerPiece: 0.5,
    maintenanceInterval: 30,
    powerConsumption: 1.2
  }
];

export const processTemplates = {
  'polo-tshirt': {
    id: 'polo-tshirt',
    name: 'Polo T-Shirt Standard',
    nameNepali: 'पोलो टी-शर्ट मानक',
    articleNumbers: ['8085', '8082'],
    complexity: 'medium',
    estimatedTime: 45, // minutes per piece
    steps: [
      {
        id: 1,
        name: 'Collar Making',
        nameNepali: 'कलर बनाउने',
        machine: 'singleNeedle',
        rate: 2.50,
        estimatedTime: 8,
        sequence: 1,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['collar-alignment', 'stitch-quality']
      },
      {
        id: 2,
        name: 'Placket Making',
        nameNepali: 'प्लाकेट बनाउने',
        machine: 'singleNeedle',
        rate: 1.80,
        estimatedTime: 6,
        sequence: 2,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['placket-length', 'button-holes']
      },
      {
        id: 3,
        name: 'Sleeve Join',
        nameNepali: 'स्लिभ जोड्ने',
        machine: 'overlock',
        rate: 3.20,
        estimatedTime: 10,
        sequence: 3,
        skillRequired: 'expert',
        qualityCheckpoints: ['seam-strength', 'sleeve-alignment']
      },
      {
        id: 4,
        name: 'Top Stitch',
        nameNepali: 'माथिल्लो सिलाई',
        machine: 'flatlock',
        rate: 2.10,
        estimatedTime: 8,
        sequence: 4,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['stitch-evenness', 'thread-tension']
      },
      {
        id: 5,
        name: 'Side Seam',
        nameNepali: 'साइड सिम',
        machine: 'overlock',
        rate: 2.80,
        estimatedTime: 7,
        sequence: 5,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['seam-alignment', 'no-puckering']
      },
      {
        id: 6,
        name: 'Hem Fold',
        nameNepali: 'हेम फोल्ड',
        machine: 'flatlock',
        rate: 1.90,
        estimatedTime: 6,
        sequence: 6,
        skillRequired: 'beginner',
        qualityCheckpoints: ['hem-width', 'fold-consistency']
      }
    ],
    totalRate: 14.30,
    totalEstimatedTime: 45
  },
  
  'round-neck-tshirt': {
    id: 'round-neck-tshirt',
    name: 'Round Neck T-Shirt',
    nameNepali: 'राउन्ड नेक टी-शर्ट',
    articleNumbers: ['2233', '2288'],
    complexity: 'basic',
    estimatedTime: 35,
    steps: [
      {
        id: 1,
        name: 'Shoulder Join',
        nameNepali: 'काँध जोड्ने',
        machine: 'overlock',
        rate: 2.20,
        estimatedTime: 8,
        sequence: 1,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['shoulder-alignment', 'seam-strength']
      },
      {
        id: 2,
        name: 'Neck Binding',
        nameNepali: 'नेक बाइन्डिङ',
        machine: 'overlock',
        rate: 2.50,
        estimatedTime: 10,
        sequence: 2,
        skillRequired: 'expert',
        qualityCheckpoints: ['neck-fit', 'binding-stretch']
      },
      {
        id: 3,
        name: 'Sleeve Join',
        nameNepali: 'स्लिभ जोड्ने',
        machine: 'overlock',
        rate: 2.80,
        estimatedTime: 8,
        sequence: 3,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['sleeve-attachment', 'armhole-fit']
      },
      {
        id: 4,
        name: 'Side Seam',
        nameNepali: 'साइड सिम',
        machine: 'overlock',
        rate: 2.30,
        estimatedTime: 6,
        sequence: 4,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['side-alignment', 'seam-quality']
      },
      {
        id: 5,
        name: 'Bottom Hem',
        nameNepali: 'तलको हेम',
        machine: 'flatlock',
        rate: 1.60,
        estimatedTime: 3,
        sequence: 5,
        skillRequired: 'beginner',
        qualityCheckpoints: ['hem-evenness', 'stitch-tension']
      }
    ],
    totalRate: 11.40,
    totalEstimatedTime: 35
  },

  '3-button-tops': {
    id: '3-button-tops',
    name: '3-Button Paper Tops',
    nameNepali: '३-बटन पेपर टप्स',
    articleNumbers: ['6635', '6622'],
    complexity: 'complex',
    estimatedTime: 120,
    steps: [
      {
        id: 1,
        name: 'Collar Making',
        nameNepali: 'कलर बनाउने',
        machine: 'singleNeedle',
        rate: 4.50,
        estimatedTime: 15,
        sequence: 1,
        skillRequired: 'expert',
        qualityCheckpoints: ['collar-shape', 'interfacing-attachment']
      },
      {
        id: 2,
        name: 'Placket Preparation',
        nameNepali: 'प्लाकेट तयारी',
        machine: 'singleNeedle',
        rate: 3.80,
        estimatedTime: 12,
        sequence: 2,
        skillRequired: 'expert',
        qualityCheckpoints: ['placket-alignment', 'button-spacing']
      },
      {
        id: 3,
        name: 'Shoulder Join',
        nameNepali: 'काँध जोड्ने',
        machine: 'overlock',
        rate: 3.20,
        estimatedTime: 10,
        sequence: 3,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['shoulder-line', 'seam-finish']
      },
      {
        id: 4,
        name: 'Collar Attachment',
        nameNepali: 'कलर जोड्ने',
        machine: 'singleNeedle',
        rate: 5.50,
        estimatedTime: 20,
        sequence: 4,
        skillRequired: 'expert',
        qualityCheckpoints: ['collar-attachment', 'neckline-smooth']
      },
      {
        id: 5,
        name: 'Sleeve Setting',
        nameNepali: 'स्लिभ सेटिङ',
        machine: 'overlock',
        rate: 4.20,
        estimatedTime: 15,
        sequence: 5,
        skillRequired: 'expert',
        qualityCheckpoints: ['sleeve-ease', 'armhole-smooth']
      },
      {
        id: 6,
        name: 'Side Seam',
        nameNepali: 'साइड सिम',
        machine: 'overlock',
        rate: 3.50,
        estimatedTime: 12,
        sequence: 6,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['side-alignment', 'sleeve-seam-match']
      },
      {
        id: 7,
        name: 'Buttonhole Making',
        nameNepali: 'बटनहोल बनाउने',
        machine: 'buttonhole',
        rate: 2.80,
        estimatedTime: 8,
        sequence: 7,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['buttonhole-size', 'spacing-accuracy']
      },
      {
        id: 8,
        name: 'Button Attachment',
        nameNepali: 'बटन जोड्ने',
        machine: 'buttonAttach',
        rate: 2.20,
        estimatedTime: 6,
        sequence: 8,
        skillRequired: 'beginner',
        qualityCheckpoints: ['button-security', 'thread-finish']
      },
      {
        id: 9,
        name: 'Hem Finishing',
        nameNepali: 'हेम फिनिसिङ',
        machine: 'singleNeedle',
        rate: 2.40,
        estimatedTime: 8,
        sequence: 9,
        skillRequired: 'intermediate',
        qualityCheckpoints: ['hem-width', 'corner-finish']
      },
      {
        id: 10,
        name: 'Final Pressing',
        nameNepali: 'अन्तिम प्रेसिङ',
        machine: 'iron',
        rate: 1.80,
        estimatedTime: 5,
        sequence: 10,
        skillRequired: 'beginner',
        qualityCheckpoints: ['overall-appearance', 'crease-lines']
      }
    ],
    totalRate: 33.90,
    totalEstimatedTime: 111
  }
};

export const defectCategories = [
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
      { id: 'uneven-stitch', name: 'Uneven Stitching', nameNepali: 'असमान सिलाई', severity: 'minor' },
      { id: 'thread-break', name: 'Thread Break', nameNepali: 'धागो टुटेको', severity: 'minor' }
    ]
  },
  {
    id: 'machine-defects',
    name: 'Machine Related',
    nameNepali: 'मेसिन सम्बन्धी',
    types: [
      { id: 'oil-stain', name: 'Oil Stain', nameNepali: 'तेलको दाग', severity: 'major' },
      { id: 'needle-mark', name: 'Needle Mark', nameNepali: 'सुईको निशान', severity: 'minor' },
      { id: 'machine-mark', name: 'Machine Mark', nameNepali: 'मेसिनको निशान', severity: 'minor' }
    ]
  },
  {
    id: 'measurement-defects',
    name: 'Size/Measurement Issues',
    nameNepali: 'साइज/नापको समस्या',
    types: [
      { id: 'wrong-size', name: 'Wrong Size', nameNepali: 'गलत साइज', severity: 'major' },
      { id: 'wrong-color', name: 'Wrong Color', nameNepali: 'गलत रङ', severity: 'major' },
      { id: 'measurement-error', name: 'Measurement Error', nameNepali: 'नापको त्रुटि', severity: 'major' }
    ]
  }
];

// Export default object with all data
export default {
  sampleOperators,
  sampleSupervisors,
  sampleBundles,
  sampleNotifications,
  sampleQualityIssues,
  sampleProductionStats,
  sampleWIPData,
  machineTypes,
  processTemplates,
  defectCategories
};5,
    maintenanceInterval: 14,
    powerConsumption: 0.85
  },
  {
    id: 'buttonAttach',
    name: 'Button Attach',
    nameNepali: 'बटन अट्याच',
    totalMachines: 2,
    operations: ['buttonAttach'],
    avgTimePerPiece: 1.