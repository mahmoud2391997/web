// Simple logging utility for production
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private logs: Array<{ timestamp: Date; level: LogLevel; message: string; data?: any }> = [];
  private maxLogs = 1000;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (level <= this.level) {
      const logEntry = {
        timestamp: new Date(),
        level,
        message,
        data
      };
      
      this.logs.push(logEntry);
      
      // Keep only the last maxLogs entries
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      
      // Console output
      const timestamp = logEntry.timestamp.toISOString();
      const levelName = LogLevel[level];
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(`[${timestamp}] ERROR: ${message}`, data || '');
          break;
        case LogLevel.WARN:
          console.warn(`[${timestamp}] WARN: ${message}`, data || '');
          break;
        case LogLevel.INFO:
          console.info(`[${timestamp}] INFO: ${message}`, data || '');
          break;
        case LogLevel.DEBUG:
          console.debug(`[${timestamp}] DEBUG: ${message}`, data || '');
          break;
      }
    }
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    const logsData = this.logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: LogLevel[log.level],
      message: log.message,
      data: log.data
    }));

    const dataStr = JSON.stringify(logsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `gaming-center-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();

// Set log level based on environment
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.INFO);
}
