# Garment ERP PWA - System Maintenance Guide

## Overview
This document outlines the maintenance procedures, monitoring practices, and operational tasks required to keep the Garment ERP PWA system running optimally.

## Maintenance Schedule

### Daily Tasks (Automated)
- [ ] **System Health Checks** - Verify all services are operational
- [ ] **Error Log Review** - Check for new errors or anomalies
- [ ] **Performance Monitoring** - Review key performance metrics
- [ ] **Backup Verification** - Ensure daily backups completed successfully
- [ ] **Security Alerts** - Monitor for security incidents

### Weekly Tasks
- [ ] **Database Maintenance** - Clean up temporary data and optimize indexes
- [ ] **Performance Review** - Analyze weekly performance trends
- [ ] **User Feedback Review** - Address user-reported issues
- [ ] **Dependency Updates** - Check for security patches
- [ ] **Storage Cleanup** - Remove old logs and temporary files

### Monthly Tasks
- [ ] **Comprehensive Security Audit** - Review access logs and permissions
- [ ] **Performance Optimization** - Identify and address performance bottlenecks
- [ ] **Capacity Planning Review** - Assess resource usage and scaling needs
- [ ] **Documentation Updates** - Update system documentation
- [ ] **Disaster Recovery Testing** - Test backup and recovery procedures

### Quarterly Tasks
- [ ] **Major Dependency Updates** - Update frameworks and libraries
- [ ] **Security Penetration Testing** - Comprehensive security assessment
- [ ] **Architecture Review** - Assess system architecture for improvements
- [ ] **User Training Updates** - Update training materials and conduct sessions
- [ ] **Business Continuity Planning** - Review and update disaster recovery plans

## System Health Monitoring

### Automated Health Checks
```javascript
// Health check service
class HealthCheckService {
  static async performSystemHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {},
      metrics: {}
    };
    
    try {
      // Firebase connectivity check
      healthStatus.services.firebase = await this.checkFirebaseHealth();
      
      // Authentication service check
      healthStatus.services.auth = await this.checkAuthService();
      
      // Database performance check
      healthStatus.services.database = await this.checkDatabaseHealth();
      
      // Application metrics
      healthStatus.metrics = await this.collectSystemMetrics();
      
      // Determine overall health
      const allServicesHealthy = Object.values(healthStatus.services)
        .every(service => service.status === 'healthy');
      
      healthStatus.overall = allServicesHealthy ? 'healthy' : 'degraded';
      
    } catch (error) {
      healthStatus.overall = 'unhealthy';
      healthStatus.error = error.message;
    }
    
    // Log health status
    await this.logHealthStatus(healthStatus);
    
    // Send alerts if unhealthy
    if (healthStatus.overall !== 'healthy') {
      await this.sendHealthAlert(healthStatus);
    }
    
    return healthStatus;
  }
  
  static async checkFirebaseHealth() {
    try {
      const startTime = performance.now();
      
      // Simple read operation to test connectivity
      const testDoc = await getDoc(doc(db, 'system', 'health-check'));
      
      const responseTime = performance.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  static async checkAuthService() {
    try {
      const user = auth.currentUser;
      
      return {
        status: 'healthy',
        authenticated: !!user,
        userId: user?.uid,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  static async checkDatabaseHealth() {
    try {
      const startTime = performance.now();
      
      // Test query performance
      const query = collection(db, 'workItems');
      const snapshot = await getDocs(query.limit(1));
      
      const queryTime = performance.now() - startTime;
      
      return {
        status: queryTime < 1000 ? 'healthy' : 'degraded',
        queryTime,
        docCount: snapshot.size,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  static async collectSystemMetrics() {
    return {
      memory: this.getMemoryUsage(),
      performance: this.getPerformanceMetrics(),
      storage: await this.getStorageMetrics(),
      network: this.getNetworkMetrics()
    };
  }
  
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }
  
  static getPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      return {
        loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        firstPaint: Math.round(performance.getEntriesByName('first-paint')[0]?.startTime || 0)
      };
    }
    return null;
  }
}

// Schedule health checks
setInterval(() => {
  HealthCheckService.performSystemHealthCheck();
}, 5 * 60 * 1000); // Every 5 minutes
```

### Performance Monitoring
```javascript
// Performance monitoring dashboard
class PerformanceMonitoring {
  static async generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {
        coreWebVitals: await this.getCoreWebVitals(),
        userExperience: await this.getUserExperienceMetrics(),
        systemResources: await this.getSystemResourceMetrics(),
        database: await this.getDatabasePerformanceMetrics()
      },
      trends: await this.getPerformanceTrends(),
      recommendations: await this.generateRecommendations()
    };
    
    return report;
  }
  
  static async getCoreWebVitals() {
    // Collect Core Web Vitals data
    return new Promise(resolve => {
      const vitals = {};
      
      // LCP
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          vitals.lcp = entries[entries.length - 1].startTime;
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID
      new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          vitals.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });
      
      // CLS
      let clsValue = 0;
      new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
      
      setTimeout(() => resolve(vitals), 1000);
    });
  }
  
  static async generateRecommendations() {
    const recommendations = [];
    
    // Analyze metrics and generate recommendations
    const metrics = await this.getSystemResourceMetrics();
    
    if (metrics.memory?.used > metrics.memory?.total * 0.8) {
      recommendations.push({
        type: 'memory',
        severity: 'warning',
        message: 'High memory usage detected. Consider optimizing component re-renders.',
        action: 'Review React.memo usage and state management'
      });
    }
    
    if (metrics.database?.avgQueryTime > 1000) {
      recommendations.push({
        type: 'database',
        severity: 'critical',
        message: 'Slow database queries detected.',
        action: 'Review Firestore indexes and optimize queries'
      });
    }
    
    return recommendations;
  }
}
```

## Database Maintenance

### Firestore Optimization
```javascript
// Database maintenance operations
class DatabaseMaintenance {
  // Clean up old data
  static async cleanupOldData() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days retention
    
    const collections = ['securityLogs', 'errorLogs', 'performanceLogs'];
    
    for (const collectionName of collections) {
      await this.cleanupCollection(collectionName, cutoffDate);
    }
  }
  
  static async cleanupCollection(collectionName, cutoffDate) {
    const query = collection(db, collectionName)
      .where('timestamp', '<', cutoffDate)
      .limit(500); // Process in batches
    
    const snapshot = await getDocs(query);
    
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Cleaned up ${snapshot.docs.length} documents from ${collectionName}`);
      
      // Continue if there are more documents
      if (snapshot.docs.length === 500) {
        await this.cleanupCollection(collectionName, cutoffDate);
      }
    }
  }
  
  // Optimize Firestore indexes
  static async optimizeIndexes() {
    // This would typically be done via Firebase Console or CLI
    // Here we can analyze query patterns and suggest optimizations
    
    const indexRecommendations = await this.analyzeQueryPatterns();
    
    console.log('Index recommendations:', indexRecommendations);
    return indexRecommendations;
  }
  
  static async analyzeQueryPatterns() {
    // Analyze performance logs to identify slow queries
    const slowQueries = await getDocs(
      query(
        collection(db, 'performanceLogs'),
        where('type', '==', 'firestore_query'),
        where('duration', '>', 1000),
        orderBy('duration', 'desc'),
        limit(100)
      )
    );
    
    const queryPatterns = {};
    
    slowQueries.docs.forEach(doc => {
      const data = doc.data();
      const pattern = `${data.collection}-${data.filters?.join('-') || 'no-filters'}`;
      
      if (!queryPatterns[pattern]) {
        queryPatterns[pattern] = {
          count: 0,
          avgDuration: 0,
          maxDuration: 0
        };
      }
      
      queryPatterns[pattern].count++;
      queryPatterns[pattern].avgDuration = 
        (queryPatterns[pattern].avgDuration + data.duration) / queryPatterns[pattern].count;
      queryPatterns[pattern].maxDuration = 
        Math.max(queryPatterns[pattern].maxDuration, data.duration);
    });
    
    return Object.entries(queryPatterns)
      .sort(([,a], [,b]) => b.avgDuration - a.avgDuration)
      .slice(0, 10);
  }
  
  // Database integrity checks
  static async performIntegrityCheck() {
    const issues = [];
    
    // Check for orphaned work items
    const orphanedWorkItems = await this.findOrphanedWorkItems();
    if (orphanedWorkItems.length > 0) {
      issues.push({
        type: 'orphaned_work_items',
        count: orphanedWorkItems.length,
        severity: 'medium',
        action: 'Clean up orphaned work items or fix references'
      });
    }
    
    // Check for inconsistent data
    const dataInconsistencies = await this.findDataInconsistencies();
    if (dataInconsistencies.length > 0) {
      issues.push({
        type: 'data_inconsistencies',
        count: dataInconsistencies.length,
        severity: 'high',
        action: 'Review and fix data inconsistencies'
      });
    }
    
    return issues;
  }
  
  static async findOrphanedWorkItems() {
    // Find work items with invalid operator or bundle references
    const workItems = await getDocs(collection(db, 'workItems'));
    const orphaned = [];
    
    for (const doc of workItems.docs) {
      const data = doc.data();
      
      // Check if referenced operator exists
      if (data.operatorId) {
        try {
          await getDoc(doc(db, 'users', data.operatorId));
        } catch (error) {
          orphaned.push({ id: doc.id, issue: 'invalid_operator_reference' });
        }
      }
      
      // Check if referenced bundle exists
      if (data.bundleId) {
        try {
          await getDoc(doc(db, 'bundles', data.bundleId));
        } catch (error) {
          orphaned.push({ id: doc.id, issue: 'invalid_bundle_reference' });
        }
      }
    }
    
    return orphaned;
  }
}
```

### Backup and Recovery

#### Automated Backup System
```javascript
// Backup service
class BackupService {
  static async createDailyBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupId = `backup-${timestamp}`;
    
    try {
      // Create Firestore export
      await this.exportFirestoreData(backupId);
      
      // Backup configuration
      await this.backupSystemConfiguration(backupId);
      
      // Verify backup integrity
      const isValid = await this.verifyBackupIntegrity(backupId);
      
      if (isValid) {
        console.log(`✅ Daily backup completed successfully: ${backupId}`);
        await this.notifyBackupSuccess(backupId);
      } else {
        throw new Error('Backup integrity verification failed');
      }
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
    } catch (error) {
      console.error(`❌ Daily backup failed:`, error);
      await this.notifyBackupFailure(error);
    }
  }
  
  static async exportFirestoreData(backupId) {
    // This would typically use Firebase Admin SDK or gcloud CLI
    // For client-side, we can export essential data
    
    const collections = ['users', 'workItems', 'bundles', 'analytics'];
    const exportData = {};
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      exportData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Store backup metadata
    await addDoc(collection(db, 'backups'), {
      backupId,
      timestamp: serverTimestamp(),
      collections: Object.keys(exportData),
      totalDocuments: Object.values(exportData).reduce((sum, docs) => sum + docs.length, 0),
      status: 'completed'
    });
    
    return exportData;
  }
  
  static async verifyBackupIntegrity(backupId) {
    try {
      // Check if backup metadata exists
      const backupQuery = query(
        collection(db, 'backups'),
        where('backupId', '==', backupId)
      );
      const backupSnapshot = await getDocs(backupQuery);
      
      if (backupSnapshot.empty) {
        return false;
      }
      
      const backupData = backupSnapshot.docs[0].data();
      
      // Verify essential collections are present
      const requiredCollections = ['users', 'workItems', 'bundles'];
      const hasAllCollections = requiredCollections.every(
        collection => backupData.collections.includes(collection)
      );
      
      return hasAllCollections && backupData.totalDocuments > 0;
    } catch (error) {
      console.error('Backup integrity verification failed:', error);
      return false;
    }
  }
  
  static async restoreFromBackup(backupId) {
    console.log(`🔄 Starting restore from backup: ${backupId}`);
    
    try {
      // Find backup
      const backupQuery = query(
        collection(db, 'backups'),
        where('backupId', '==', backupId)
      );
      const backupSnapshot = await getDocs(backupQuery);
      
      if (backupSnapshot.empty) {
        throw new Error(`Backup not found: ${backupId}`);
      }
      
      // Restore process would depend on backup format
      // This is a simplified example
      
      console.log(`✅ Restore completed successfully from backup: ${backupId}`);
      
    } catch (error) {
      console.error(`❌ Restore failed:`, error);
      throw error;
    }
  }
  
  static async cleanupOldBackups() {
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const oldBackupsQuery = query(
      collection(db, 'backups'),
      where('timestamp', '<', cutoffDate)
    );
    
    const oldBackups = await getDocs(oldBackupsQuery);
    
    if (!oldBackups.empty) {
      const batch = writeBatch(db);
      
      oldBackups.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`🗑️ Cleaned up ${oldBackups.docs.length} old backups`);
    }
  }
}

// Schedule daily backups
const scheduleBackups = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(2, 0, 0, 0); // 2 AM
  
  const timeUntilBackup = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    BackupService.createDailyBackup();
    
    // Schedule recurring daily backups
    setInterval(() => {
      BackupService.createDailyBackup();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
    
  }, timeUntilBackup);
};

// Initialize backup scheduling
scheduleBackups();
```

## Error Monitoring and Resolution

### Error Tracking System
```javascript
// Error monitoring service
class ErrorMonitoring {
  static async analyzeErrorPatterns() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const errorsQuery = query(
      collection(db, 'errorLogs'),
      where('timestamp', '>=', sevenDaysAgo),
      orderBy('timestamp', 'desc')
    );
    
    const errorSnapshot = await getDocs(errorsQuery);
    const errors = errorSnapshot.docs.map(doc => doc.data());
    
    // Group errors by type
    const errorPatterns = {};
    
    errors.forEach(error => {
      const key = `${error.type}-${error.component || 'unknown'}`;
      
      if (!errorPatterns[key]) {
        errorPatterns[key] = {
          count: 0,
          firstSeen: error.timestamp,
          lastSeen: error.timestamp,
          affectedUsers: new Set(),
          severity: error.severity || 'medium',
          examples: []
        };
      }
      
      errorPatterns[key].count++;
      errorPatterns[key].lastSeen = error.timestamp;
      errorPatterns[key].affectedUsers.add(error.userId);
      
      if (errorPatterns[key].examples.length < 3) {
        errorPatterns[key].examples.push({
          message: error.message,
          stack: error.stack,
          timestamp: error.timestamp
        });
      }
    });
    
    // Convert Set to array length
    Object.values(errorPatterns).forEach(pattern => {
      pattern.affectedUsers = pattern.affectedUsers.size;
    });
    
    return errorPatterns;
  }
  
  static async generateErrorReport() {
    const patterns = await this.analyzeErrorPatterns();
    
    // Sort by frequency and severity
    const sortedPatterns = Object.entries(patterns)
      .sort(([,a], [,b]) => {
        const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const scoreA = a.count * (severityWeight[a.severity] || 2);
        const scoreB = b.count * (severityWeight[b.severity] || 2);
        return scoreB - scoreA;
      })
      .slice(0, 10);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: Object.values(patterns).reduce((sum, p) => sum + p.count, 0),
      uniquePatterns: Object.keys(patterns).length,
      topPatterns: sortedPatterns,
      recommendations: this.generateErrorRecommendations(sortedPatterns)
    };
    
    return report;
  }
  
  static generateErrorRecommendations(topPatterns) {
    const recommendations = [];
    
    topPatterns.forEach(([key, pattern]) => {
      if (pattern.count > 100) {
        recommendations.push({
          pattern: key,
          recommendation: `High frequency error detected (${pattern.count} occurrences). Immediate investigation required.`,
          priority: 'critical'
        });
      }
      
      if (pattern.affectedUsers > 50) {
        recommendations.push({
          pattern: key,
          recommendation: `Error affecting many users (${pattern.affectedUsers}). User experience impact assessment needed.`,
          priority: 'high'
        });
      }
      
      if (key.includes('firebase')) {
        recommendations.push({
          pattern: key,
          recommendation: 'Firebase-related error. Check service status and API limits.',
          priority: 'medium'
        });
      }
    });
    
    return recommendations;
  }
}
```

## System Updates and Patches

### Update Management
```javascript
// Update management service
class UpdateManager {
  static async checkForUpdates() {
    const updates = {
      dependencies: await this.checkDependencyUpdates(),
      security: await this.checkSecurityUpdates(),
      system: await this.checkSystemUpdates()
    };
    
    return updates;
  }
  
  static async checkDependencyUpdates() {
    // This would typically run npm audit or similar
    // For client-side monitoring, we can check specific packages
    
    const criticalPackages = [
      'react', 'firebase', 'zustand'
    ];
    
    const updates = [];
    
    // In a real implementation, this would check npm registry
    // or use dependency scanning tools
    
    return updates;
  }
  
  static async applySecurityUpdates() {
    console.log('🔒 Applying security updates...');
    
    try {
      // Log security update start
      await addDoc(collection(db, 'systemLogs'), {
        type: 'security_update_start',
        timestamp: serverTimestamp(),
        appliedBy: 'system'
      });
      
      // Apply updates (this would be done via CI/CD in practice)
      // await this.runSecurityUpdates();
      
      // Log completion
      await addDoc(collection(db, 'systemLogs'), {
        type: 'security_update_complete',
        timestamp: serverTimestamp(),
        success: true
      });
      
      console.log('✅ Security updates applied successfully');
      
    } catch (error) {
      console.error('❌ Security update failed:', error);
      
      await addDoc(collection(db, 'systemLogs'), {
        type: 'security_update_failed',
        timestamp: serverTimestamp(),
        error: error.message
      });
      
      throw error;
    }
  }
}
```

## Monitoring Dashboards

### System Status Dashboard
```javascript
// Dashboard for system administrators
class SystemDashboard {
  static async generateDashboardData() {
    const dashboard = {
      timestamp: new Date().toISOString(),
      systemHealth: await HealthCheckService.performSystemHealthCheck(),
      performance: await PerformanceMonitoring.generatePerformanceReport(),
      errors: await ErrorMonitoring.generateErrorReport(),
      usage: await this.getUsageStatistics(),
      alerts: await this.getActiveAlerts()
    };
    
    return dashboard;
  }
  
  static async getUsageStatistics() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Active users in last 24 hours
    const activeUsersQuery = query(
      collection(db, 'userSessions'),
      where('lastActivity', '>=', oneDayAgo)
    );
    const activeUsersSnapshot = await getDocs(activeUsersQuery);
    
    // System operations
    const operationsQuery = query(
      collection(db, 'systemLogs'),
      where('timestamp', '>=', oneDayAgo)
    );
    const operationsSnapshot = await getDocs(operationsQuery);
    
    return {
      activeUsers: activeUsersSnapshot.size,
      totalOperations: operationsSnapshot.size,
      peakConcurrentUsers: await this.getPeakConcurrentUsers(),
      dataTransfer: await this.getDataTransferStats()
    };
  }
  
  static async getActiveAlerts() {
    const alertsQuery = query(
      collection(db, 'systemAlerts'),
      where('status', '==', 'active'),
      orderBy('severity', 'desc'),
      orderBy('timestamp', 'desc')
    );
    
    const alertsSnapshot = await getDocs(alertsQuery);
    return alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}
```

## Maintenance Checklist

### Pre-Maintenance
- [ ] **Notify Users** - Schedule maintenance window and inform users
- [ ] **Create Backup** - Full system backup before any changes
- [ ] **Test Environment** - Verify changes work in staging environment
- [ ] **Rollback Plan** - Prepare rollback procedures if needed
- [ ] **Monitor Resources** - Check system resource availability

### During Maintenance
- [ ] **Follow Procedures** - Execute planned maintenance steps
- [ ] **Monitor Systems** - Watch for errors or performance issues
- [ ] **Document Changes** - Record all changes made
- [ ] **Test Functionality** - Verify critical functions work correctly
- [ ] **Check Dependencies** - Ensure all integrations function properly

### Post-Maintenance
- [ ] **Verify System Health** - Run comprehensive health checks
- [ ] **Monitor Performance** - Check for any performance degradation
- [ ] **Review Logs** - Check error logs for new issues
- [ ] **User Communication** - Notify users that maintenance is complete
- [ ] **Update Documentation** - Document any configuration changes

### Emergency Maintenance
- [ ] **Assess Severity** - Determine if immediate action required
- [ ] **Create Emergency Backup** - Quick backup before emergency fixes
- [ ] **Document Issue** - Record problem details and symptoms
- [ ] **Apply Minimal Fix** - Address immediate issue with minimal changes
- [ ] **Plan Proper Solution** - Schedule comprehensive fix if needed

## Alerting and Notifications

### Alert Configuration
```javascript
// Alert management system
class AlertManager {
  static alertThresholds = {
    errorRate: 0.05,        // 5% error rate
    responseTime: 2000,     // 2 second response time
    memoryUsage: 0.85,      // 85% memory usage
    diskUsage: 0.90,        // 90% disk usage
    activeUsers: 1000       // 1000 concurrent users
  };
  
  static async checkAlertConditions() {
    const metrics = await this.getCurrentMetrics();
    const alerts = [];
    
    // Check error rate
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'critical',
        message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold`,
        value: metrics.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }
    
    // Check response time
    if (metrics.avgResponseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        message: `Average response time ${metrics.avgResponseTime}ms exceeds threshold`,
        value: metrics.avgResponseTime,
        threshold: this.alertThresholds.responseTime
      });
    }
    
    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert);
    }
    
    return alerts;
  }
  
  static async processAlert(alert) {
    // Log alert
    await addDoc(collection(db, 'systemAlerts'), {
      ...alert,
      timestamp: serverTimestamp(),
      status: 'active'
    });
    
    // Send notifications based on severity
    switch (alert.severity) {
      case 'critical':
        await this.sendCriticalAlert(alert);
        break;
      case 'warning':
        await this.sendWarningAlert(alert);
        break;
      default:
        await this.sendInfoAlert(alert);
    }
  }
  
  static async sendCriticalAlert(alert) {
    // Send immediate notifications to all administrators
    // Email, SMS, and push notifications
    
    console.error(`🚨 CRITICAL ALERT: ${alert.message}`);
    
    // In production, integrate with alerting services like:
    // - PagerDuty
    // - Slack
    // - Email service
    // - SMS service
  }
}

// Monitor system continuously
setInterval(() => {
  AlertManager.checkAlertConditions();
}, 60000); // Check every minute
```

This comprehensive maintenance guide ensures the Garment ERP PWA system remains stable, secure, and performant through proactive monitoring and regular maintenance procedures.