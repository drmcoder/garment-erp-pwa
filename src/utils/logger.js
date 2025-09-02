const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG;
    this.logs = [];
    this.maxLogs = 1000;
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (process.env.NODE_ENV !== 'production') {
      const style = this.getConsoleStyle(level);
      console.log(`%c[${timestamp}] ${message}`, style, data);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && level <= LogLevel.ERROR) {
      this.sendToMonitoring(logEntry);
    }
  }

  getConsoleStyle(level) {
    switch (level) {
      case LogLevel.ERROR:
        return 'color: red; font-weight: bold;';
      case LogLevel.WARN:
        return 'color: orange; font-weight: bold;';
      case LogLevel.INFO:
        return 'color: blue;';
      case LogLevel.DEBUG:
        return 'color: gray;';
      default:
        return '';
    }
  }

  error(message, error = {}) {
    this.log(LogLevel.ERROR, message, {
      error: error.message || error,
      stack: error.stack
    });
  }

  warn(message, data) {
    this.log(LogLevel.WARN, message, data);
  }

  info(message, data) {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message, data) {
    this.log(LogLevel.DEBUG, message, data);
  }

  async sendToMonitoring(logEntry) {
    // Implement integration with monitoring service
    // Example: Sentry, LogRocket, or custom backend
    try {
      if (window.Sentry) {
        window.Sentry.captureMessage(logEntry.message, {
          level: 'error',
          extra: logEntry
        });
      }
    } catch (err) {
      console.error('Failed to send log to monitoring', err);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  downloadLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const logger = new Logger();
export default logger;