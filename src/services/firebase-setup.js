// File: src/services/firebase-setup.js
// Firebase Database Setup & Initialization Script

import {
  db,
  COLLECTIONS,
  DEMO_USERS,
  SAMPLE_BUNDLES,
  SIZE_CONFIGURATIONS,
  MACHINE_TYPES,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "../config/firebase";

// Database Initialization Service
export class FirebaseSetupService {
  // Initialize all collections with sample data
  static async initializeDatabase() {
    console.log("🚀 Initializing Firebase Database...");

    try {
      // 1. Create Operators
      await this.createOperators();

      // 2. Create Supervisors
      await this.createSupervisors();

      // 3. Create Management Users
      await this.createManagementUsers();

      // 4. Create Sample Bundles
      await this.createSampleBundles();

      // 5. Setup Size Configurations
      await this.setupSizeConfigurations();

      // 6. Setup Machine Configurations
      await this.setupMachineConfigurations();

      // 7. Create Sample Notifications
      await this.createSampleNotifications();

      // 8. Initialize Production Stats
      await this.initializeProductionStats();

      // 9. Create Line Status
      await this.createLineStatus();

      console.log("✅ Database initialization completed successfully!");
      return { success: true, message: "Database initialized successfully" };
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Create Operator Profiles
  static async createOperators() {
    console.log("👷 Creating operator profiles...");

    for (const operator of DEMO_USERS.OPERATORS) {
      const operatorRef = doc(db, COLLECTIONS.OPERATORS, operator.id);
      await setDoc(operatorRef, {
        ...operator,
        createdAt: serverTimestamp(),
        lastLogin: null,
        currentBundle: null,
        todayStats: {
          piecesCompleted: 0,
          earnings: 0,
          efficiency: 0,
          qualityScore: 100,
          defects: 0,
          workHours: 0,
        },
        weeklyStats: {
          totalPieces: 0,
          totalEarnings: 0,
          avgEfficiency: 0,
          avgQuality: 100,
        },
        settings: {
          language: "np",
          notifications: true,
          autoAssign: false,
        },
      });
    }

    console.log(`✅ Created ${DEMO_USERS.OPERATORS.length} operators`);
  }

  // Create Supervisor Profiles
  static async createSupervisors() {
    console.log("👔 Creating supervisor profiles...");

    for (const supervisor of DEMO_USERS.SUPERVISORS) {
      const supervisorRef = doc(db, COLLECTIONS.SUPERVISORS, supervisor.id);
      await setDoc(supervisorRef, {
        ...supervisor,
        createdAt: serverTimestamp(),
        lastLogin: null,
        managedOperators: ["op001", "op002", "op003"],
        currentShift: "morning",
        dashboardSettings: {
          autoRefresh: true,
          showEfficiencyAlerts: true,
          notificationSound: true,
        },
      });
    }

    console.log(`✅ Created ${DEMO_USERS.SUPERVISORS.length} supervisors`);
  }

  // Create Management Users
  static async createManagementUsers() {
    console.log("🏢 Creating management users...");

    for (const manager of DEMO_USERS.MANAGEMENT) {
      const managerRef = doc(db, COLLECTIONS.MANAGEMENT, manager.id);
      await setDoc(managerRef, {
        ...manager,
        createdAt: serverTimestamp(),
        lastLogin: null,
        reportAccess: ["daily", "weekly", "monthly"],
        dashboardConfig: {
          defaultView: "overview",
          autoRefreshInterval: 30000,
        },
      });
    }

    console.log(`✅ Created ${DEMO_USERS.MANAGEMENT.length} management users`);
  }

  // Create Sample Bundles with Flexible Sizing
  static async createSampleBundles() {
    console.log("📦 Creating sample bundles...");

    for (const bundle of SAMPLE_BUNDLES) {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundle.id);
      await setDoc(bundleRef, {
        ...bundle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        processFlow: this.getProcessFlowForArticle(bundle.article),
        progressPercentage: 0,
        timeline: {
          created: serverTimestamp(),
          assigned: null,
          started: null,
          completed: null,
        },
      });
    }

    console.log(`✅ Created ${SAMPLE_BUNDLES.length} sample bundles`);
  }

  // Get process flow based on article type
  static getProcessFlowForArticle(article) {
    const processFlows = {
      8085: [
        // Polo T-Shirt
        { operation: "shoulderJoin", machine: "overlock", sequence: 1 },
        { operation: "sideSeam", machine: "overlock", sequence: 2 },
        { operation: "collar", machine: "singleNeedle", sequence: 3 },
        { operation: "sleeves", machine: "overlock", sequence: 4 },
        { operation: "hemFold", machine: "flatlock", sequence: 5 },
        { operation: "buttonhole", machine: "buttonhole", sequence: 6 },
        { operation: "buttonAttach", machine: "buttonAttach", sequence: 7 },
        { operation: "pressing", machine: "iron", sequence: 8 },
      ],
      1020: [
        // Ladies Pants
        { operation: "cutting", machine: "cutting", sequence: 1 },
        { operation: "sideSeam", machine: "overlock", sequence: 2 },
        { operation: "waistband", machine: "singleNeedle", sequence: 3 },
        { operation: "hemming", machine: "flatlock", sequence: 4 },
        { operation: "finishing", machine: "iron", sequence: 5 },
      ],
      9001: [
        // Plus Size Shirt
        { operation: "cutting", machine: "cutting", sequence: 1 },
        { operation: "shoulderJoin", machine: "overlock", sequence: 2 },
        { operation: "collar", machine: "singleNeedle", sequence: 3 },
        { operation: "sleeves", machine: "overlock", sequence: 4 },
        { operation: "sideSeam", machine: "overlock", sequence: 5 },
        { operation: "buttonhole", machine: "buttonhole", sequence: 6 },
        { operation: "buttonAttach", machine: "buttonAttach", sequence: 7 },
        { operation: "pressing", machine: "iron", sequence: 8 },
      ],
    };

    return processFlows[article] || processFlows["8085"];
  }

  // Setup Size Configurations
  static async setupSizeConfigurations() {
    console.log("📏 Setting up size configurations...");

    for (const [configId, config] of Object.entries(SIZE_CONFIGURATIONS)) {
      const configRef = doc(db, COLLECTIONS.SIZE_CONFIGS, configId);
      await setDoc(configRef, {
        ...config,
        createdAt: serverTimestamp(),
        active: true,
        lastModified: serverTimestamp(),
      });
    }

    console.log(
      `✅ Created ${
        Object.keys(SIZE_CONFIGURATIONS).length
      } size configurations`
    );
  }

  // Setup Machine Configurations
  static async setupMachineConfigurations() {
    console.log("🏭 Setting up machine configurations...");

    for (const [machineId, machine] of Object.entries(MACHINE_TYPES)) {
      const machineRef = doc(db, COLLECTIONS.MACHINE_CONFIGS, machineId);
      await setDoc(machineRef, {
        ...machine,
        createdAt: serverTimestamp(),
        active: true,
        maintenance: {
          lastService: null,
          nextService: null,
          status: "operational",
        },
      });
    }

    console.log(
      `✅ Created ${Object.keys(MACHINE_TYPES).length} machine configurations`
    );
  }

  // Create Sample Notifications
  static async createSampleNotifications() {
    console.log("🔔 Creating sample notifications...");

    const notifications = [
      {
        title: "बन्डल #B001 तयार छ",
        titleEn: "Bundle #B001 Ready",
        message: "तपाईंको स्टेसनमा नयाँ काम तयार छ",
        messageEn: "New work ready at your station",
        type: "work_assignment",
        priority: "high",
        targetUser: "op001",
        targetRole: "operator",
        read: false,
        actionRequired: true,
        bundleId: "B001-85-BL-XL",
        createdAt: serverTimestamp(),
      },
      {
        title: "दैनिक लक्ष्य सम्पन्न",
        titleEn: "Daily Target Achieved",
        message: "बधाई छ! आजको लक्ष्य ८५% पूरा भयो",
        messageEn: "Congratulations! 85% of today's target achieved",
        type: "achievement",
        priority: "medium",
        targetUser: "op002",
        targetRole: "operator",
        read: false,
        actionRequired: false,
        createdAt: serverTimestamp(),
      },
      {
        title: "गुणस्तर जाँच आवश्यक",
        titleEn: "Quality Check Required",
        message: "बन्डल #B002 मा गुणस्तर समस्या रिपोर्ट गरिएको",
        messageEn: "Quality issue reported in Bundle #B002",
        type: "quality_alert",
        priority: "high",
        targetUser: "sup001",
        targetRole: "supervisor",
        read: false,
        actionRequired: true,
        bundleId: "B002-33-GR-26",
        createdAt: serverTimestamp(),
      },
    ];

    for (const notification of notifications) {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), notification);
    }

    console.log(`✅ Created ${notifications.length} sample notifications`);
  }

  // Initialize Production Stats
  static async initializeProductionStats() {
    console.log("📊 Initializing production statistics...");

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const todayStats = {
      date: todayStr,
      totalProduction: 3750,
      targetProduction: 5000,
      efficiency: 75,
      qualityScore: 96,
      activeOperators: 48,
      totalOperators: 50,
      completedBundles: 85,
      pendingBundles: 43,
      defectRate: 4,
      avgTimePerBundle: 45,
      revenue: 125000,
      costs: 72000,
      profit: 53000,
      machinePerfomance: {
        overlock: { efficiency: 85, downtime: 5 },
        flatlock: { efficiency: 78, downtime: 8 },
        singleNeedle: { efficiency: 92, downtime: 2 },
        buttonhole: { efficiency: 88, downtime: 3 },
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const statsRef = doc(db, COLLECTIONS.PRODUCTION_STATS, todayStr);
    await setDoc(statsRef, todayStats);

    console.log("✅ Initialized production statistics");
  }

  // Create Line Status
  static async createLineStatus() {
    console.log("🏭 Creating line status...");

    const lineStatus = {
      lineId: "line-1",
      name: "Production Line 1",
      nameNepali: "उत्पादन लाइन १",
      active: true,
      stations: {
        "overlock-1": {
          operatorId: "op001",
          status: "active",
          currentBundle: "B001-85-BL-XL",
          efficiency: 85,
          lastUpdate: serverTimestamp(),
        },
        "flatlock-1": {
          operatorId: "op002",
          status: "active",
          currentBundle: "B002-33-GR-26",
          efficiency: 92,
          lastUpdate: serverTimestamp(),
        },
        "single-needle-1": {
          operatorId: "op003",
          status: "idle",
          currentBundle: null,
          efficiency: 0,
          lastUpdate: serverTimestamp(),
        },
      },
      supervisorId: "sup001",
      targetEfficiency: 85,
      currentEfficiency: 79,
      bottlenecks: ["single-needle-1"],
      alerts: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const lineRef = doc(db, COLLECTIONS.LINE_STATUS, "line-1");
    await setDoc(lineRef, lineStatus);

    console.log("✅ Created line status");
  }

  // Check if database is already initialized
  static async isDatabaseInitialized() {
    try {
      const operatorsSnapshot = await getDocs(
        collection(db, COLLECTIONS.OPERATORS)
      );
      return !operatorsSnapshot.empty;
    } catch (error) {
      console.error("Error checking database status:", error);
      return false;
    }
  }

  // Reset database (for development only)
  static async resetDatabase() {
    console.log("🗑️ Resetting database...");
    // Note: This would require admin SDK for production use
    // For development, manually delete collections from Firebase Console
    console.log(
      "⚠️ Manual reset required - delete collections from Firebase Console"
    );
  }
}

// Auto-initialize on first run (development only)
export const initializeIfNeeded = async () => {
  if (process.env.NODE_ENV === "development") {
    try {
      const isInitialized = await FirebaseSetupService.isDatabaseInitialized();

      if (!isInitialized) {
        console.log("🔧 Database not initialized, setting up...");
        const result = await FirebaseSetupService.initializeDatabase();
        
        if (!result.success) {
          console.warn("⚠️ Database initialization failed:", result.error);
          console.warn("📝 This might be due to Firebase security rules. Please:");
          console.warn("   1. Deploy the security rules: firebase deploy --only firestore:rules");
          console.warn("   2. Or temporarily set Firestore to test mode in Firebase Console");
          console.warn("   3. The app will continue with existing data");
        }
        
        return result;
      } else {
        console.log("✅ Database already initialized");
        return { success: true, message: "Database already initialized" };
      }
    } catch (error) {
      console.warn("⚠️ Database initialization check failed:", error.message);
      console.warn("📝 App will continue without database initialization");
      return { success: false, error: error.message, canContinue: true };
    }
  } else {
    console.log("🏭 Production mode - skipping database initialization");
    return { success: true, message: "Production mode - initialization skipped" };
  }
};

export default FirebaseSetupService;
