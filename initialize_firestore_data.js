// initialize_firestore_data.js
// Script to initialize Firestore with essential data for the garment ERP system

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  writeBatch,
} = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M",
  authDomain: "code-for-erp.firebaseapp.com",
  projectId: "code-for-erp",
  storageBucket: "code-for-erp.firebasestorage.app",
  messagingSenderId: "490842962773",
  appId: "1:490842962773:web:b2a5688d22416ebc710ddc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors", 
  MANAGEMENT: "management",
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  MACHINE_CONFIGS: "machineConfigs",
  PRODUCTION_STATS: "productionStats",
  SYSTEM_SETTINGS: "systemSettings",
  OPERATION_TYPES: "operationTypes",
  ARTICLE_TEMPLATES: "articleTemplates",
  LINE_STATUS: "lineStatus",
};

// Sample data for initialization
const sampleOperators = [
  {
    username: "ram.singh",
    name: "Ram Bahadur Singh",
    nameEn: "Ram Singh",
    nameNepali: "राम बहादुर सिंह",
    role: "operator",
    assignedMachine: "overlock",
    machines: ["overlock", "flatlock"],
    station: "Station-1",
    stationNp: "स्टेसन-१",
    assignedLine: "line-1",
    department: "sewing",
    shift: "morning",
    dailyTarget: 50,
    rate: 2.5,
    skillLevel: "medium",
    active: true,
    permissions: ["work_view", "work_update", "quality_report"],
    password: "password123",
    createdAt: new Date(),
    stats: {
      todayPieces: 0,
      todayEarnings: 0,
      weeklyPieces: 0,
      weeklyEarnings: 0,
      monthlyPieces: 0,
      monthlyEarnings: 0
    }
  },
  {
    username: "sita.devi",
    name: "Sita Devi Sharma",
    nameEn: "Sita Devi",
    nameNepali: "सीता देवी शर्मा", 
    role: "operator",
    assignedMachine: "singleNeedle",
    machines: ["singleNeedle", "buttonhole"],
    station: "Station-2",
    stationNp: "स्टेसन-२",
    assignedLine: "line-1",
    department: "sewing",
    shift: "morning",
    dailyTarget: 50,
    rate: 2.5,
    skillLevel: "high",
    active: true,
    permissions: ["work_view", "work_update", "quality_report"],
    password: "password123",
    createdAt: new Date(),
    stats: {
      todayPieces: 0,
      todayEarnings: 0,
      weeklyPieces: 0,
      weeklyEarnings: 0,
      monthlyPieces: 0,
      monthlyEarnings: 0
    }
  },
  {
    username: "hari.bahadur",
    name: "Hari Bahadur Thapa",
    nameEn: "Hari Bahadur",
    nameNepali: "हरि बहादुर थापा",
    role: "operator", 
    assignedMachine: "flatlock",
    machines: ["flatlock", "overlock"],
    station: "Station-3",
    stationNp: "स्टेसन-३",
    assignedLine: "line-1",
    department: "sewing",
    shift: "morning",
    dailyTarget: 50,
    rate: 2.5,
    skillLevel: "high",
    active: true,
    permissions: ["work_view", "work_update", "quality_report"],
    password: "password123",
    createdAt: new Date(),
    stats: {
      todayPieces: 0,
      todayEarnings: 0,
      weeklyPieces: 0,
      weeklyEarnings: 0,
      monthlyPieces: 0,
      monthlyEarnings: 0
    }
  }
];

const sampleSupervisors = [
  {
    username: "supervisor",
    name: "Shyam Pokharel",
    nameEn: "Shyam Pokharel", 
    nameNepali: "श्याम पोखरेल",
    role: "supervisor",
    station: "Supervisor Desk",
    stationNp: "सुपरवाइजर डेस्क",
    assignedLine: "line-1",
    department: "sewing",
    shift: "morning",
    active: true,
    permissions: ["all_view", "work_assign", "quality_manage", "report_view"],
    password: "password123",
    createdAt: new Date(),
    operatorsManaged: 25,
    lineEfficiency: 87,
    dailyProduction: 2450,
    qualityScore: 94
  },
  {
    username: "sup", 
    name: "Supervisor User",
    nameEn: "Supervisor User",
    nameNepali: "सुपरवाइजर प्रयोगकर्ता",
    role: "supervisor",
    station: "Supervisor Desk",
    stationNp: "सुपरवाइजर डेस्क", 
    assignedLine: "line-2",
    department: "sewing",
    shift: "morning",
    active: true,
    permissions: ["all_view", "work_assign", "quality_manage", "report_view"],
    password: "password123",
    createdAt: new Date(),
    operatorsManaged: 20,
    lineEfficiency: 90,
    dailyProduction: 2200,
    qualityScore: 96
  }
];

const sampleManagement = [
  {
    username: "admin.manager",
    name: "Production Manager", 
    nameEn: "Production Manager",
    nameNepali: "उत्पादन व्यवस्थापक",
    role: "manager",
    station: "Management Office",
    stationNp: "व्यवस्थापन कार्यालय",
    department: "administration",
    active: true,
    permissions: ["admin", "all_view", "all_manage", "reports", "analytics"],
    password: "password123",
    createdAt: new Date(),
    stats: {
      totalEmployees: 50,
      dailyProduction: 5130,
      monthlyRevenue: 2850000,
      overallEfficiency: 89,
      qualityScore: 95.5
    }
  }
];

const sampleMachines = [
  {
    id: "overlock_01",
    name: "Overlock Machine 01",
    type: "Overlock",
    brand: "Brother",
    model: "3034D",
    serialNumber: "OVL-2024-001",
    status: "active",
    location: "Line-1 Station-1",
    assignedOperator: "ram.singh",
    maintenanceSchedule: "monthly",
    lastMaintenance: new Date(2024, 0, 1),
    nextMaintenance: new Date(2024, 1, 1),
    specifications: {
      maxSpeed: "1300 SPM",
      needleType: "DC x 27",
      threadCount: "4-thread",
      power: "220V"
    },
    operations: ["shoulder_join", "side_seam", "armhole"],
    avgSpeed: 45,
    efficiency: 85,
    createdAt: new Date()
  },
  {
    id: "singleNeedle_01", 
    name: "Single Needle Machine 01",
    type: "Single Needle",
    brand: "Juki",
    model: "DDL-8700",
    serialNumber: "SNL-2024-001",
    status: "active",
    location: "Line-1 Station-2",
    assignedOperator: "sita.devi",
    maintenanceSchedule: "monthly",
    lastMaintenance: new Date(2024, 0, 1),
    nextMaintenance: new Date(2024, 1, 1),
    specifications: {
      maxSpeed: "5500 SPM",
      needleType: "DP x 5",
      threadCount: "1-thread",
      power: "220V"
    },
    operations: ["collar", "placket", "buttonhole"],
    avgSpeed: 35,
    efficiency: 90,
    createdAt: new Date()
  }
];

const sampleBundles = [
  {
    id: "B001-85-BL-XL",
    bundleNumber: "B001",
    article: "8085",
    articleName: "Polo T-Shirt",
    color: "Blue",
    colorCode: "BL", 
    sizes: ["XL"],
    quantity: 50,
    rate: 2.5,
    totalValue: 125,
    priority: "high",
    dueDate: new Date(2024, 2, 15),
    status: "pending",
    machineType: "overlock",
    currentOperation: "shoulder_join",
    assignedOperator: null,
    assignedLine: "line-1",
    estimatedTime: 60,
    createdAt: new Date(),
    progress: 0,
    completedPieces: 0
  },
  {
    id: "B002-33-GR-L",
    bundleNumber: "B002", 
    article: "1020",
    articleName: "Ladies Pants",
    color: "Green",
    colorCode: "GR",
    sizes: ["L"],
    quantity: 30,
    rate: 3.0,
    totalValue: 90,
    priority: "medium",
    dueDate: new Date(2024, 2, 20),
    status: "pending",
    machineType: "singleNeedle", 
    currentOperation: "waistband",
    assignedOperator: null,
    assignedLine: "line-1",
    estimatedTime: 45,
    createdAt: new Date(),
    progress: 0,
    completedPieces: 0
  }
];

const operationTypes = [
  {
    id: "shoulder_join",
    nepali: "काँध जोड्ने",
    english: "Shoulder Join", 
    machine: "overlock",
    machineNepali: "ओभरलक",
    rate: 2.5,
    estimatedTimeMinutes: 15,
    skillLevel: "medium",
    category: "joining"
  },
  {
    id: "side_seam",
    nepali: "साइड सिम",
    english: "Side Seam",
    machine: "overlock", 
    machineNepali: "ओभरलक",
    rate: 2.0,
    estimatedTimeMinutes: 12,
    skillLevel: "medium",
    category: "joining"
  },
  {
    id: "collar",
    nepali: "कलर",
    english: "Collar",
    machine: "singleNeedle",
    machineNepali: "एकल सुई",
    rate: 3.5,
    estimatedTimeMinutes: 20,
    skillLevel: "high", 
    category: "construction"
  },
  {
    id: "placket",
    nepali: "प्लाकेट",
    english: "Placket",
    machine: "singleNeedle",
    machineNepali: "एकल सुई",
    rate: 4.0,
    estimatedTimeMinutes: 25,
    skillLevel: "high",
    category: "construction"
  },
  {
    id: "buttonhole",
    nepali: "बटनहोल",
    english: "Buttonhole", 
    machine: "buttonhole",
    machineNepali: "बटनहोल मेसिन",
    rate: 5.0,
    estimatedTimeMinutes: 8,
    skillLevel: "high",
    category: "finishing"
  },
  {
    id: "hem_fold",
    nepali: "हेम फोल्ड", 
    english: "Hem Fold",
    machine: "flatlock",
    machineNepali: "फ्ल्यालक",
    rate: 1.5,
    estimatedTimeMinutes: 10,
    skillLevel: "low",
    category: "finishing"
  }
];

const systemSettings = {
  companyName: "TSA Garments",
  companyNameNepali: "टीएसए गार्मेन्ट्स",
  timezone: "Asia/Kathmandu",
  workingHours: {
    start: "08:00",
    end: "17:00",
    lunchBreak: {
      start: "12:00", 
      end: "13:00"
    }
  },
  currency: "NPR",
  language: "np",
  dateFormat: "YYYY-MM-DD",
  defaultTargets: {
    operatorDailyPieces: 50,
    lineEfficiency: 85,
    qualityScore: 95
  },
  notifications: {
    enabled: true,
    qualityAlerts: true,
    productionAlerts: true,
    maintenanceReminders: true
  },
  backup: {
    enabled: true,
    frequency: "daily",
    retentionDays: 30
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const lineStatus = [
  {
    lineId: "line-1", 
    lineName: "Production Line 1",
    lineNameNepali: "उत्पादन लाइन १",
    status: "active",
    totalOperators: 8,
    activeOperators: 8,
    targetPieces: 400,
    completedPieces: 0,
    efficiency: 0,
    supervisor: "supervisor",
    machines: ["overlock_01", "singleNeedle_01"],
    shift: "morning",
    startTime: new Date(),
    createdAt: new Date()
  },
  {
    lineId: "line-2",
    lineName: "Production Line 2", 
    lineNameNepali: "उत्पादन लाइन २",
    status: "active",
    totalOperators: 6,
    activeOperators: 6,
    targetPieces: 300,
    completedPieces: 0,
    efficiency: 0,
    supervisor: "sup",
    machines: [],
    shift: "morning",
    startTime: new Date(),
    createdAt: new Date()
  }
];

// Function to initialize all collections
async function initializeFirestore() {
  console.log("🚀 Starting Firestore initialization...");
  
  try {
    // Check if data already exists
    const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
    if (!operatorsSnapshot.empty) {
      console.log("⚠️  Firestore already has data. Skipping initialization.");
      console.log("   If you want to reinitialize, please clear Firestore manually first.");
      return;
    }

    const batch = writeBatch(db);
    let docCount = 0;

    // Add operators
    console.log("👷 Adding operators...");
    for (const operator of sampleOperators) {
      const docRef = doc(collection(db, COLLECTIONS.OPERATORS));
      batch.set(docRef, operator);
      docCount++;
    }

    // Add supervisors  
    console.log("👨‍💼 Adding supervisors...");
    for (const supervisor of sampleSupervisors) {
      const docRef = doc(collection(db, COLLECTIONS.SUPERVISORS));
      batch.set(docRef, supervisor);
      docCount++;
    }

    // Add management
    console.log("🏢 Adding management...");
    for (const manager of sampleManagement) {
      const docRef = doc(collection(db, COLLECTIONS.MANAGEMENT));
      batch.set(docRef, manager);
      docCount++;
    }

    // Add machine configurations
    console.log("🏭 Adding machine configurations...");
    for (const machine of sampleMachines) {
      const docRef = doc(collection(db, COLLECTIONS.MACHINE_CONFIGS), machine.id);
      batch.set(docRef, machine);
      docCount++;
    }

    // Add operation types
    console.log("⚙️  Adding operation types...");
    for (const operation of operationTypes) {
      const docRef = doc(collection(db, COLLECTIONS.OPERATION_TYPES), operation.id);
      batch.set(docRef, operation);
      docCount++;
    }

    // Add bundles
    console.log("📦 Adding sample bundles...");
    for (const bundle of sampleBundles) {
      const docRef = doc(collection(db, COLLECTIONS.BUNDLES), bundle.id);
      batch.set(docRef, bundle);
      docCount++;
    }

    // Add line status
    console.log("🏭 Adding line status...");
    for (const line of lineStatus) {
      const docRef = doc(collection(db, COLLECTIONS.LINE_STATUS), line.lineId);
      batch.set(docRef, line);
      docCount++;
    }

    // Add system settings
    console.log("⚙️  Adding system settings...");
    const settingsRef = doc(collection(db, COLLECTIONS.SYSTEM_SETTINGS), "main");
    batch.set(settingsRef, systemSettings);
    docCount++;

    // Commit the batch
    console.log(`💾 Committing ${docCount} documents to Firestore...`);
    await batch.commit();

    console.log("✅ Firestore initialization completed successfully!");
    console.log(`📊 Added ${docCount} documents across ${Object.keys(COLLECTIONS).length} collections`);
    
    // Summary
    console.log("\n📈 Summary:");
    console.log(`   - Operators: ${sampleOperators.length}`);
    console.log(`   - Supervisors: ${sampleSupervisors.length} (including 'sup' user)`);
    console.log(`   - Management: ${sampleManagement.length}`);
    console.log(`   - Machines: ${sampleMachines.length}`);
    console.log(`   - Operation Types: ${operationTypes.length}`);
    console.log(`   - Sample Bundles: ${sampleBundles.length}`);
    console.log(`   - Production Lines: ${lineStatus.length}`);
    console.log(`   - System Settings: 1`);

    console.log("\n🎉 Your garment ERP system is now ready to use!");
    console.log("   You can login with any of the created users:");
    console.log("   - Operators: ram.singh, sita.devi, hari.bahadur");
    console.log("   - Supervisors: supervisor, sup");
    console.log("   - Management: admin.manager");
    console.log("   - Default password for all users: password123");

  } catch (error) {
    console.error("❌ Error initializing Firestore:", error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeFirestore()
    .then(() => {
      console.log("🏁 Initialization script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { initializeFirestore };