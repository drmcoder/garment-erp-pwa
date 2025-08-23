class WIPProgressManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.stages = [];
    this.logs = [];
    this.errors = [];
    this.warnings = [];
    this.currentStage = -1;
    this.totalSteps = 0;
    this.completedSteps = 0;
    this.isComplete = false;
    this.callbacks = {};
  }

  // Event handling
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // Initialize stages
  initializeStages(stages) {
    this.stages = stages.map((stage, index) => ({
      ...stage,
      id: index,
      status: 'pending',
      progress: 0,
      startTime: null,
      endTime: null,
      duration: null
    }));
    this.totalSteps = stages.reduce((sum, stage) => sum + (stage.steps || 1), 0);
    this.emit('stagesInitialized', { stages: this.stages });
  }

  // Stage management
  startStage(stageIndex, options = {}) {
    if (stageIndex < 0 || stageIndex >= this.stages.length) {
      this.addError(`Invalid stage index: ${stageIndex}`);
      return;
    }

    this.currentStage = stageIndex;
    this.stages[stageIndex] = {
      ...this.stages[stageIndex],
      status: 'in-progress',
      startTime: new Date(),
      progress: 0,
      ...options
    };

    this.addLog('info', `Started stage: ${this.stages[stageIndex].name}`);
    this.emit('stageStarted', { stageIndex, stage: this.stages[stageIndex] });
    this.updateProgress();
  }

  updateStageProgress(stageIndex, progress, message = null) {
    if (stageIndex < 0 || stageIndex >= this.stages.length) {
      this.addError(`Invalid stage index for progress update: ${stageIndex}`);
      return;
    }

    this.stages[stageIndex].progress = Math.min(100, Math.max(0, progress));
    
    if (message) {
      this.addLog('info', message);
    }

    this.emit('stageProgressUpdated', { 
      stageIndex, 
      progress, 
      stage: this.stages[stageIndex] 
    });
    this.updateProgress();
  }

  completeStage(stageIndex, message = null) {
    if (stageIndex < 0 || stageIndex >= this.stages.length) {
      this.addError(`Invalid stage index for completion: ${stageIndex}`);
      return;
    }

    this.stages[stageIndex] = {
      ...this.stages[stageIndex],
      status: 'completed',
      progress: 100,
      endTime: new Date()
    };

    if (this.stages[stageIndex].startTime) {
      this.stages[stageIndex].duration = 
        this.stages[stageIndex].endTime - this.stages[stageIndex].startTime;
    }

    this.completedSteps += (this.stages[stageIndex].steps || 1);

    const completionMessage = message || `Completed stage: ${this.stages[stageIndex].name}`;
    this.addLog('success', completionMessage);

    this.emit('stageCompleted', { stageIndex, stage: this.stages[stageIndex] });
    this.updateProgress();

    // Check if all stages are complete
    if (this.stages.every(stage => stage.status === 'completed')) {
      this.complete();
    }
  }

  failStage(stageIndex, error, canRetry = true) {
    if (stageIndex < 0 || stageIndex >= this.stages.length) {
      this.addError(`Invalid stage index for failure: ${stageIndex}`);
      return;
    }

    this.stages[stageIndex] = {
      ...this.stages[stageIndex],
      status: 'failed',
      endTime: new Date(),
      error: error,
      canRetry: canRetry
    };

    if (this.stages[stageIndex].startTime) {
      this.stages[stageIndex].duration = 
        this.stages[stageIndex].endTime - this.stages[stageIndex].startTime;
    }

    this.addError(`Stage failed: ${this.stages[stageIndex].name} - ${error}`);
    this.emit('stageFailed', { stageIndex, stage: this.stages[stageIndex], error });
  }

  // Logging
  addLog(level, message, details = null) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      level: level, // 'info', 'success', 'warning', 'error'
      message: message,
      details: details,
      stageIndex: this.currentStage
    };

    this.logs.push(logEntry);

    if (level === 'error') {
      this.errors.push(logEntry);
    } else if (level === 'warning') {
      this.warnings.push(logEntry);
    }

    this.emit('logAdded', logEntry);

    // Keep logs manageable (last 1000 entries)
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    return logEntry;
  }

  addError(message, details = null) {
    return this.addLog('error', message, details);
  }

  addWarning(message, details = null) {
    return this.addLog('warning', message, details);
  }

  addInfo(message, details = null) {
    return this.addLog('info', message, details);
  }

  addSuccess(message, details = null) {
    return this.addLog('success', message, details);
  }

  // Progress calculation
  updateProgress() {
    let totalProgress = 0;
    let totalWeight = 0;

    this.stages.forEach(stage => {
      const weight = stage.weight || 1;
      totalWeight += weight;

      if (stage.status === 'completed') {
        totalProgress += weight * 100;
      } else if (stage.status === 'in-progress') {
        totalProgress += weight * (stage.progress || 0);
      }
    });

    const overallProgress = totalWeight > 0 ? totalProgress / totalWeight : 0;
    
    this.emit('progressUpdated', {
      progress: overallProgress,
      completedSteps: this.completedSteps,
      totalSteps: this.totalSteps,
      currentStage: this.currentStage
    });

    return overallProgress;
  }

  // Completion
  complete(success = true) {
    this.isComplete = true;
    const completionTime = new Date();
    
    if (success && this.errors.length === 0) {
      this.addSuccess('WIP import completed successfully!');
    } else if (this.errors.length > 0) {
      this.addWarning(`WIP import completed with ${this.errors.length} error(s)`);
    }

    this.emit('completed', {
      success: success && this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      completionTime: completionTime,
      duration: completionTime - (this.stages[0]?.startTime || completionTime)
    });
  }

  // State getters
  getState() {
    return {
      stages: this.stages,
      logs: this.logs,
      errors: this.errors,
      warnings: this.warnings,
      currentStage: this.currentStage,
      totalSteps: this.totalSteps,
      completedSteps: this.completedSteps,
      isComplete: this.isComplete,
      progress: this.updateProgress()
    };
  }

  getStageByName(name) {
    return this.stages.find(stage => stage.name === name);
  }

  getCurrentStage() {
    return this.currentStage >= 0 ? this.stages[this.currentStage] : null;
  }

  // Analytics
  getAnalytics() {
    const completedStages = this.stages.filter(s => s.status === 'completed');
    const failedStages = this.stages.filter(s => s.status === 'failed');
    
    const totalDuration = completedStages.reduce((sum, stage) => 
      sum + (stage.duration || 0), 0);
    
    const averageStageTime = completedStages.length > 0 ? 
      totalDuration / completedStages.length : 0;

    return {
      totalStages: this.stages.length,
      completedStages: completedStages.length,
      failedStages: failedStages.length,
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      totalLogs: this.logs.length,
      totalDuration: totalDuration,
      averageStageTime: averageStageTime,
      successRate: this.stages.length > 0 ? 
        (completedStages.length / this.stages.length) * 100 : 0
    };
  }

  // Utility methods
  async executeStage(stageIndex, asyncFunction, options = {}) {
    this.startStage(stageIndex, options);
    
    try {
      const result = await asyncFunction(
        (progress, message) => this.updateStageProgress(stageIndex, progress, message),
        (message, details) => this.addLog('info', message, details)
      );
      
      this.completeStage(stageIndex, options.completionMessage);
      return result;
    } catch (error) {
      this.failStage(stageIndex, error.message, options.canRetry !== false);
      throw error;
    }
  }

  // Export logs for debugging
  exportLogs(format = 'json') {
    const data = {
      timestamp: new Date().toISOString(),
      analytics: this.getAnalytics(),
      stages: this.stages,
      logs: this.logs,
      errors: this.errors,
      warnings: this.warnings
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Convert logs to CSV format
      const headers = ['Timestamp', 'Level', 'Stage', 'Message', 'Details'];
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.stageIndex >= 0 ? this.stages[log.stageIndex]?.name || log.stageIndex : 'N/A',
        log.message,
        typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '')
      ]);
      
      return [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
    }

    return data;
  }
}

export default WIPProgressManager;