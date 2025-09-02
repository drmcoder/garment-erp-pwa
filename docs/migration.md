# Garment ERP PWA - Migration Guide

## Overview
This document provides comprehensive guidance for migrating data, upgrading system versions, and handling system transitions in the Garment ERP PWA.

## Migration Types

### 1. Data Migration
- **Database Schema Updates** - Structural changes to Firestore collections
- **Data Format Changes** - Converting existing data to new formats
- **Collection Restructuring** - Moving data between collections
- **Data Cleanup** - Removing obsolete or duplicate data

### 2. System Migration  
- **Version Upgrades** - Updating to newer application versions
- **Infrastructure Migration** - Moving to new hosting or services
- **Third-party Integrations** - Migrating external service connections
- **Environment Migration** - Moving between development/staging/production

### 3. Architecture Migration
- **State Management Migration** - Centralizing data management patterns
- **Component Architecture** - Modernizing component structures
- **Service Layer Migration** - Updating service implementations
- **Performance Optimizations** - Implementing optimization patterns

## Data Migration Procedures

### Pre-Migration Checklist
- [ ] **Complete System Backup** - Full backup of all data and configurations
- [ ] **Migration Plan Documentation** - Detailed step-by-step migration plan
- [ ] **Testing Environment Setup** - Staging environment for migration testing
- [ ] **Rollback Procedures** - Plans for reverting changes if needed
- [ ] **Downtime Schedule** - Coordinated maintenance window
- [ ] **User Communication** - Notifications about system downtime
- [ ] **Data Validation Scripts** - Tools to verify migration success
- [ ] **Team Coordination** - All team members briefed on procedures

### Migration Framework
```javascript
// Migration framework for systematic data updates
class MigrationManager {
  constructor() {
    this.migrations = new Map();
    this.executedMigrations = new Set();
  }
  
  // Register a migration
  registerMigration(version, migration) {
    this.migrations.set(version, migration);
  }
  
  // Execute all pending migrations
  async executeMigrations() {
    // Load completed migrations from database
    await this.loadExecutedMigrations();
    
    // Sort migrations by version
    const sortedMigrations = Array.from(this.migrations.entries())
      .sort(([a], [b]) => this.compareVersions(a, b));
    
    for (const [version, migration] of sortedMigrations) {
      if (!this.executedMigrations.has(version)) {
        await this.executeMigration(version, migration);
      }
    }
  }
  
  async executeMigration(version, migration) {
    console.log(`🔄 Executing migration ${version}...`);
    
    try {
      // Create migration log entry
      const migrationLog = {
        version,
        startTime: new Date(),
        status: 'running'
      };
      
      await addDoc(collection(db, 'migrationLogs'), migrationLog);
      
      // Execute migration
      await migration.up();
      
      // Mark as completed
      await this.markMigrationCompleted(version, migrationLog);
      
      console.log(`✅ Migration ${version} completed successfully`);
      
    } catch (error) {
      console.error(`❌ Migration ${version} failed:`, error);
      
      // Log failure
      await addDoc(collection(db, 'migrationLogs'), {
        version,
        startTime: new Date(),
        status: 'failed',
        error: error.message
      });
      
      // Attempt rollback if available
      if (migration.down) {
        console.log(`🔄 Rolling back migration ${version}...`);
        try {
          await migration.down();
          console.log(`✅ Rollback ${version} completed`);
        } catch (rollbackError) {
          console.error(`❌ Rollback ${version} failed:`, rollbackError);
        }
      }
      
      throw error;
    }
  }
  
  async markMigrationCompleted(version, migrationLog) {
    await addDoc(collection(db, 'completedMigrations'), {
      version,
      completedAt: serverTimestamp(),
      duration: Date.now() - migrationLog.startTime.getTime()
    });
    
    this.executedMigrations.add(version);
  }
  
  compareVersions(a, b) {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      
      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }
    
    return 0;
  }
}
```

### Sample Migration: Centralizing User Data
```javascript
// Migration example: Consolidate user profile data
const migration_1_0_0 = {
  version: '1.0.0',
  description: 'Consolidate user profile data and add new fields',
  
  async up() {
    console.log('🔄 Starting user data consolidation migration...');
    
    const batch = writeBatch(db);
    let processedCount = 0;
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Create updated user data structure
      const updatedUserData = {
        // Existing fields
        ...userData,
        
        // New required fields with defaults
        profileColor: userData.profileColor || this.generateProfileColor(),
        machineTypes: userData.machineTypes || [userData.machineType || 'general'],
        maxWorkload: userData.maxWorkload || 5,
        currentEfficiency: userData.currentEfficiency || 85,
        qualityScore: userData.qualityScore || 95,
        
        // Standardize naming
        nameNepali: userData.nameNepali || userData.name_nepali || '',
        
        // Add metadata
        migratedAt: serverTimestamp(),
        migrationVersion: '1.0.0'
      };
      
      // Remove deprecated fields
      delete updatedUserData.name_nepali;
      delete updatedUserData.old_field;
      
      batch.update(userDoc.ref, updatedUserData);
      processedCount++;
      
      // Process in batches of 500 (Firestore limit)
      if (processedCount % 500 === 0) {
        await batch.commit();
        console.log(`📊 Processed ${processedCount} users...`);
      }
    }
    
    // Commit remaining changes
    if (processedCount % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Migrated ${processedCount} user records`);
  },
  
  async down() {
    // Rollback changes if needed
    console.log('🔄 Rolling back user data consolidation...');
    
    const usersSnapshot = await getDocs(
      query(
        collection(db, 'users'),
        where('migrationVersion', '==', '1.0.0')
      )
    );
    
    const batch = writeBatch(db);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Remove migration-added fields
      const rollbackData = { ...userData };
      delete rollbackData.profileColor;
      delete rollbackData.machineTypes;
      delete rollbackData.maxWorkload;
      delete rollbackData.migratedAt;
      delete rollbackData.migrationVersion;
      
      batch.update(userDoc.ref, rollbackData);
    }
    
    await batch.commit();
    console.log('✅ User data rollback completed');
  },
  
  generateProfileColor() {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
};
```

### Work Items Migration Example
```javascript
// Migration: Update work items with new status system
const migration_1_1_0 = {
  version: '1.1.0',
  description: 'Update work items with enhanced status system',
  
  async up() {
    console.log('🔄 Migrating work items to new status system...');
    
    const workItemsSnapshot = await getDocs(collection(db, 'workItems'));
    const batch = writeBatch(db);
    let migrationCount = 0;
    
    const statusMapping = {
      'pending': 'assigned',
      'started': 'in_progress',
      'done': 'completed',
      'failed': 'quality_check'
    };
    
    for (const doc of workItemsSnapshot.docs) {
      const data = doc.data();
      
      // Update status using mapping
      const newStatus = statusMapping[data.status] || data.status;
      
      const updates = {
        status: newStatus,
        
        // Add new tracking fields
        statusHistory: [{
          status: newStatus,
          timestamp: data.updatedAt || data.createdAt,
          updatedBy: data.assignedOperator || 'system'
        }],
        
        // Add quality tracking
        qualityScore: data.qualityScore || null,
        requiresQualityCheck: ['completed', 'quality_check'].includes(newStatus),
        
        // Migration metadata
        migratedAt: serverTimestamp(),
        migrationVersion: '1.1.0'
      };
      
      batch.update(doc.ref, updates);
      migrationCount++;
      
      if (migrationCount % 500 === 0) {
        await batch.commit();
        console.log(`📊 Migrated ${migrationCount} work items...`);
      }
    }
    
    if (migrationCount % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Migrated ${migrationCount} work items`);
  },
  
  async down() {
    console.log('🔄 Rolling back work items migration...');
    
    const workItemsSnapshot = await getDocs(
      query(
        collection(db, 'workItems'),
        where('migrationVersion', '==', '1.1.0')
      )
    );
    
    const batch = writeBatch(db);
    
    const reverseStatusMapping = {
      'assigned': 'pending',
      'in_progress': 'started',
      'completed': 'done',
      'quality_check': 'failed'
    };
    
    for (const doc of workItemsSnapshot.docs) {
      const data = doc.data();
      
      const updates = {
        status: reverseStatusMapping[data.status] || data.status
      };
      
      // Remove migration fields
      const fieldsToRemove = [
        'statusHistory',
        'requiresQualityCheck',
        'migratedAt',
        'migrationVersion'
      ];
      
      fieldsToRemove.forEach(field => {
        updates[field] = deleteField();
      });
      
      batch.update(doc.ref, updates);
    }
    
    await batch.commit();
    console.log('✅ Work items rollback completed');
  }
};
```

## System Version Upgrades

### Version Upgrade Process
```javascript
// System version upgrade manager
class VersionUpgradeManager {
  constructor(currentVersion, targetVersion) {
    this.currentVersion = currentVersion;
    this.targetVersion = targetVersion;
    this.migrationManager = new MigrationManager();
  }
  
  async performUpgrade() {
    console.log(`🚀 Starting upgrade from ${this.currentVersion} to ${this.targetVersion}`);
    
    try {
      // Pre-upgrade checks
      await this.runPreUpgradeChecks();
      
      // Create upgrade backup
      await this.createUpgradeBackup();
      
      // Stop non-critical services
      await this.stopNonCriticalServices();
      
      // Run database migrations
      await this.runDatabaseMigrations();
      
      // Update application code
      await this.updateApplicationCode();
      
      // Run post-upgrade tasks
      await this.runPostUpgradeTasks();
      
      // Restart services
      await this.restartServices();
      
      // Verify upgrade
      await this.verifyUpgrade();
      
      console.log(`✅ Upgrade to ${this.targetVersion} completed successfully`);
      
    } catch (error) {
      console.error(`❌ Upgrade failed:`, error);
      await this.handleUpgradeFailure(error);
      throw error;
    }
  }
  
  async runPreUpgradeChecks() {
    console.log('🔍 Running pre-upgrade checks...');
    
    const checks = [
      this.checkSystemHealth(),
      this.checkDiskSpace(),
      this.checkActiveUsers(),
      this.validateBackupIntegrity()
    ];
    
    const results = await Promise.all(checks);
    
    const failedChecks = results.filter(result => !result.passed);
    
    if (failedChecks.length > 0) {
      throw new Error(`Pre-upgrade checks failed: ${failedChecks.map(c => c.message).join(', ')}`);
    }
    
    console.log('✅ All pre-upgrade checks passed');
  }
  
  async checkSystemHealth() {
    const health = await HealthCheckService.performSystemHealthCheck();
    
    return {
      passed: health.overall === 'healthy',
      message: health.overall !== 'healthy' ? 'System unhealthy before upgrade' : 'System healthy'
    };
  }
  
  async createUpgradeBackup() {
    console.log('💾 Creating upgrade backup...');
    
    const backupId = `upgrade-backup-${this.currentVersion}-to-${this.targetVersion}-${Date.now()}`;
    
    await BackupService.createDailyBackup(backupId);
    
    console.log(`✅ Upgrade backup created: ${backupId}`);
    return backupId;
  }
  
  async runDatabaseMigrations() {
    console.log('🔄 Running database migrations...');
    
    // Register all migrations for this version
    this.registerVersionMigrations();
    
    // Execute migrations
    await this.migrationManager.executeMigrations();
    
    console.log('✅ Database migrations completed');
  }
  
  registerVersionMigrations() {
    // Register migrations based on version range
    const versionMigrations = this.getVersionMigrations(this.currentVersion, this.targetVersion);
    
    versionMigrations.forEach(migration => {
      this.migrationManager.registerMigration(migration.version, migration);
    });
  }
  
  getVersionMigrations(from, to) {
    // Return array of migrations between versions
    const allMigrations = [
      migration_1_0_0,
      migration_1_1_0,
      // Add more migrations as needed
    ];
    
    return allMigrations.filter(migration => 
      this.migrationManager.compareVersions(migration.version, from) > 0 &&
      this.migrationManager.compareVersions(migration.version, to) <= 0
    );
  }
  
  async verifyUpgrade() {
    console.log('🔍 Verifying upgrade...');
    
    // Check system health
    const health = await HealthCheckService.performSystemHealthCheck();
    if (health.overall !== 'healthy') {
      throw new Error('System unhealthy after upgrade');
    }
    
    // Verify data integrity
    await this.verifyDataIntegrity();
    
    // Test critical functions
    await this.testCriticalFunctions();
    
    console.log('✅ Upgrade verification completed');
  }
  
  async verifyDataIntegrity() {
    // Check for data consistency after migration
    const integrityIssues = await DatabaseMaintenance.performIntegrityCheck();
    
    if (integrityIssues.length > 0) {
      const criticalIssues = integrityIssues.filter(issue => issue.severity === 'critical');
      
      if (criticalIssues.length > 0) {
        throw new Error(`Critical data integrity issues found: ${criticalIssues.map(i => i.type).join(', ')}`);
      }
    }
  }
  
  async handleUpgradeFailure(error) {
    console.log('🔄 Handling upgrade failure...');
    
    try {
      // Attempt to restore from backup
      const backupId = this.getLatestUpgradeBackup();
      if (backupId) {
        await BackupService.restoreFromBackup(backupId);
        console.log('✅ System restored from backup');
      }
      
      // Log failure
      await addDoc(collection(db, 'systemLogs'), {
        type: 'upgrade_failure',
        fromVersion: this.currentVersion,
        toVersion: this.targetVersion,
        error: error.message,
        timestamp: serverTimestamp()
      });
      
    } catch (recoveryError) {
      console.error('❌ Upgrade failure recovery failed:', recoveryError);
    }
  }
}
```

## Infrastructure Migration

### Firebase Project Migration
```javascript
// Firebase project migration utilities
class FirebaseProjectMigration {
  constructor(sourceProject, targetProject) {
    this.sourceProject = sourceProject;
    this.targetProject = targetProject;
  }
  
  async migrateProject() {
    console.log(`🔄 Migrating from ${this.sourceProject} to ${this.targetProject}`);
    
    try {
      // Export data from source
      const exportData = await this.exportProjectData();
      
      // Migrate Firestore data
      await this.migrateFirestoreData(exportData);
      
      // Migrate authentication users
      await this.migrateAuthUsers();
      
      // Migrate storage files
      await this.migrateStorageFiles();
      
      // Update security rules
      await this.updateSecurityRules();
      
      // Verify migration
      await this.verifyProjectMigration();
      
      console.log('✅ Firebase project migration completed');
      
    } catch (error) {
      console.error('❌ Firebase project migration failed:', error);
      throw error;
    }
  }
  
  async exportProjectData() {
    console.log('📤 Exporting project data...');
    
    const collections = ['users', 'workItems', 'bundles', 'analytics', 'system'];
    const exportData = {};
    
    for (const collectionName of collections) {
      console.log(`Exporting ${collectionName}...`);
      
      const snapshot = await getDocs(collection(this.sourceProject.db, collectionName));
      exportData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Exported ${exportData[collectionName].length} documents from ${collectionName}`);
    }
    
    return exportData;
  }
  
  async migrateFirestoreData(exportData) {
    console.log('📥 Importing data to target project...');
    
    for (const [collectionName, documents] of Object.entries(exportData)) {
      console.log(`Importing ${collectionName}...`);
      
      const batch = writeBatch(this.targetProject.db);
      
      documents.forEach(docData => {
        const docRef = doc(this.targetProject.db, collectionName, docData.id);
        const { id, ...data } = docData;
        batch.set(docRef, data);
      });
      
      await batch.commit();
      console.log(`✅ Imported ${documents.length} documents to ${collectionName}`);
    }
  }
  
  async updateApplicationConfig() {
    console.log('⚙️ Updating application configuration...');
    
    const newConfig = {
      apiKey: this.targetProject.config.apiKey,
      authDomain: this.targetProject.config.authDomain,
      projectId: this.targetProject.config.projectId,
      storageBucket: this.targetProject.config.storageBucket,
      messagingSenderId: this.targetProject.config.messagingSenderId,
      appId: this.targetProject.config.appId
    };
    
    // Update environment files
    await this.updateEnvironmentFiles(newConfig);
    
    console.log('✅ Application configuration updated');
  }
}
```

## Environment Migration

### Development to Production Migration
```javascript
// Environment migration checklist and procedures
class EnvironmentMigration {
  constructor(sourceEnv, targetEnv) {
    this.sourceEnv = sourceEnv;
    this.targetEnv = targetEnv;
  }
  
  async migrateEnvironment() {
    console.log(`🔄 Migrating from ${this.sourceEnv} to ${this.targetEnv}`);
    
    const migrationPlan = this.createMigrationPlan();
    
    for (const step of migrationPlan) {
      console.log(`🔄 Executing: ${step.description}`);
      
      try {
        await step.execute();
        console.log(`✅ Completed: ${step.description}`);
      } catch (error) {
        console.error(`❌ Failed: ${step.description}`, error);
        
        if (step.critical) {
          throw error;
        }
      }
    }
    
    console.log('✅ Environment migration completed');
  }
  
  createMigrationPlan() {
    return [
      {
        description: 'Validate source environment',
        critical: true,
        execute: () => this.validateSourceEnvironment()
      },
      {
        description: 'Prepare target environment',
        critical: true,
        execute: () => this.prepareTargetEnvironment()
      },
      {
        description: 'Migrate configuration',
        critical: true,
        execute: () => this.migrateConfiguration()
      },
      {
        description: 'Migrate data',
        critical: true,
        execute: () => this.migrateData()
      },
      {
        description: 'Update DNS and routing',
        critical: false,
        execute: () => this.updateDNS()
      },
      {
        description: 'Verify migration',
        critical: true,
        execute: () => this.verifyMigration()
      }
    ];
  }
  
  async validateSourceEnvironment() {
    // Check source environment health
    const health = await this.checkEnvironmentHealth(this.sourceEnv);
    
    if (health.overall !== 'healthy') {
      throw new Error(`Source environment unhealthy: ${health.issues.join(', ')}`);
    }
  }
  
  async prepareTargetEnvironment() {
    // Ensure target environment is properly configured
    await this.setupTargetInfrastructure();
    await this.configureTargetSecurity();
    await this.initializeTargetServices();
  }
}
```

## Migration Validation

### Data Integrity Validation
```javascript
// Validation utilities for migrations
class MigrationValidator {
  async validateMigration(sourceData, targetData, migrationVersion) {
    const validationResults = {
      timestamp: new Date().toISOString(),
      migrationVersion,
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      issues: []
    };
    
    // Document count validation
    await this.validateDocumentCounts(sourceData, targetData, validationResults);
    
    // Data structure validation
    await this.validateDataStructure(targetData, validationResults);
    
    // Relationship integrity validation
    await this.validateRelationships(targetData, validationResults);
    
    // Business logic validation
    await this.validateBusinessRules(targetData, validationResults);
    
    return validationResults;
  }
  
  async validateDocumentCounts(sourceData, targetData, results) {
    console.log('🔍 Validating document counts...');
    
    for (const [collection, sourceDocs] of Object.entries(sourceData)) {
      results.totalChecks++;
      
      const targetDocs = targetData[collection] || [];
      
      if (sourceDocs.length === targetDocs.length) {
        results.passedChecks++;
        console.log(`✅ ${collection}: ${sourceDocs.length} documents`);
      } else {
        results.failedChecks++;
        results.issues.push({
          type: 'document_count_mismatch',
          collection,
          source: sourceDocs.length,
          target: targetDocs.length
        });
        console.log(`❌ ${collection}: Expected ${sourceDocs.length}, got ${targetDocs.length}`);
      }
    }
  }
  
  async validateDataStructure(data, results) {
    console.log('🔍 Validating data structure...');
    
    const schemas = this.getDataSchemas();
    
    for (const [collection, documents] of Object.entries(data)) {
      const schema = schemas[collection];
      
      if (!schema) continue;
      
      for (const doc of documents) {
        results.totalChecks++;
        
        const validation = this.validateDocumentSchema(doc, schema);
        
        if (validation.valid) {
          results.passedChecks++;
        } else {
          results.failedChecks++;
          results.issues.push({
            type: 'schema_validation_failed',
            collection,
            documentId: doc.id,
            errors: validation.errors
          });
        }
      }
    }
  }
  
  validateDocumentSchema(document, schema) {
    const errors = [];
    
    // Check required fields
    for (const field of schema.required) {
      if (!(field in document)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Check field types
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in document) {
        const actualType = typeof document[field];
        if (actualType !== expectedType) {
          errors.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  getDataSchemas() {
    return {
      users: {
        required: ['id', 'name', 'email', 'role'],
        types: {
          name: 'string',
          email: 'string',
          role: 'string',
          currentWorkload: 'number'
        }
      },
      workItems: {
        required: ['id', 'bundleId', 'operatorId', 'status'],
        types: {
          pieces: 'number',
          status: 'string',
          priority: 'string'
        }
      }
    };
  }
}
```

## Rollback Procedures

### Migration Rollback
```javascript
// Rollback manager for failed migrations
class RollbackManager {
  constructor(migrationVersion, backupId) {
    this.migrationVersion = migrationVersion;
    this.backupId = backupId;
  }
  
  async executeRollback() {
    console.log(`🔄 Starting rollback for migration ${this.migrationVersion}`);
    
    try {
      // Stop services
      await this.stopServices();
      
      // Restore from backup
      await this.restoreFromBackup();
      
      // Run migration rollback scripts
      await this.runMigrationRollbacks();
      
      // Verify rollback
      await this.verifyRollback();
      
      // Restart services
      await this.restartServices();
      
      console.log('✅ Rollback completed successfully');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
  
  async restoreFromBackup() {
    if (!this.backupId) {
      throw new Error('No backup ID provided for rollback');
    }
    
    console.log(`📥 Restoring from backup: ${this.backupId}`);
    
    await BackupService.restoreFromBackup(this.backupId);
    
    console.log('✅ Backup restore completed');
  }
  
  async runMigrationRollbacks() {
    // Find and execute rollback scripts for this migration
    const migration = this.findMigration(this.migrationVersion);
    
    if (migration && migration.down) {
      console.log(`🔄 Running rollback script for ${this.migrationVersion}`);
      await migration.down();
      console.log('✅ Migration rollback script completed');
    }
  }
}
```

## Migration Monitoring

### Real-time Migration Monitoring
```javascript
// Monitor migration progress and health
class MigrationMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
  }
  
  startMonitoring(migrationId) {
    console.log(`📊 Starting migration monitoring: ${migrationId}`);
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics(migrationId);
      await this.checkAlerts(migrationId);
    }, 10000); // Every 10 seconds
    
    return () => {
      clearInterval(this.monitoringInterval);
      console.log(`📊 Stopped monitoring: ${migrationId}`);
    };
  }
  
  async collectMetrics(migrationId) {
    const metrics = {
      timestamp: new Date(),
      memoryUsage: this.getMemoryUsage(),
      databaseConnections: await this.getDatabaseConnections(),
      processingRate: await this.getProcessingRate(migrationId),
      errorRate: await this.getErrorRate(migrationId)
    };
    
    this.metrics.set(migrationId, metrics);
    
    // Log metrics periodically
    if (Date.now() % 60000 < 10000) { // Every minute
      console.log(`📊 Migration metrics:`, metrics);
    }
  }
  
  async checkAlerts(migrationId) {
    const metrics = this.metrics.get(migrationId);
    if (!metrics) return;
    
    // Check for concerning metrics
    if (metrics.errorRate > 0.05) { // 5% error rate
      this.addAlert({
        type: 'high_error_rate',
        severity: 'warning',
        message: `High error rate during migration: ${(metrics.errorRate * 100).toFixed(2)}%`,
        migrationId
      });
    }
    
    if (metrics.memoryUsage.percentage > 90) {
      this.addAlert({
        type: 'high_memory_usage',
        severity: 'critical',
        message: `High memory usage during migration: ${metrics.memoryUsage.percentage}%`,
        migrationId
      });
    }
  }
  
  addAlert(alert) {
    this.alerts.push({
      ...alert,
      timestamp: new Date()
    });
    
    console.warn(`⚠️ Migration Alert: ${alert.message}`);
    
    // Send notification for critical alerts
    if (alert.severity === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }
}
```

## Migration Checklist Template

### Pre-Migration Checklist
- [ ] **Documentation Review** - Migration plan documented and reviewed
- [ ] **Backup Creation** - Complete system backup created and verified
- [ ] **Test Environment** - Migration tested in staging environment
- [ ] **Rollback Plan** - Rollback procedures documented and tested
- [ ] **Team Notification** - All stakeholders informed of migration schedule
- [ ] **User Communication** - Users notified of planned downtime
- [ ] **Monitoring Setup** - Migration monitoring tools configured
- [ ] **Resource Check** - Adequate system resources available

### During Migration
- [ ] **Start Monitoring** - Begin real-time migration monitoring
- [ ] **Execute Steps** - Follow migration plan step by step
- [ ] **Verify Progress** - Check migration progress regularly
- [ ] **Monitor Alerts** - Watch for system alerts and warnings
- [ ] **Document Issues** - Record any problems encountered
- [ ] **Communicate Status** - Provide status updates to stakeholders

### Post-Migration
- [ ] **Validation Tests** - Run comprehensive validation tests
- [ ] **Performance Check** - Verify system performance metrics
- [ ] **User Acceptance** - Confirm system works for end users
- [ ] **Documentation Update** - Update system documentation
- [ ] **Cleanup Tasks** - Remove temporary migration resources
- [ ] **Lessons Learned** - Document migration lessons learned
- [ ] **Monitor Stability** - Extended monitoring for stability issues

This comprehensive migration guide ensures safe, reliable transitions for all types of system changes and upgrades.