// Logger service for database operations
class Logger {
  private logs: any[] = [];
  private maxLogs = 1000; // Keep last 1000 logs

  private formatLog(operation: string, table: string, data?: any, result?: any, error?: any) {
    return {
      timestamp: new Date().toISOString(),
      operation,
      table,
      data: data ? JSON.stringify(data) : null,
      result: result ? JSON.stringify(result) : null,
      error: error ? error.message || JSON.stringify(error) : null,
      success: !error
    };
  }

  log(operation: string, table: string, data?: any, result?: any, error?: any) {
    const logEntry = this.formatLog(operation, table, data, result, error);
    
    // Add to memory logs
    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Store in localStorage
    try {
      localStorage.setItem('zone14_db_logs', JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Could not save logs to localStorage:', e);
    }
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log(`[DB ${operation}] ${table}:`, { data, result, error });
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('zone14_db_logs');
    } catch (e) {
      console.warn('Could not clear logs from localStorage:', e);
    }
  }

  // Load logs from localStorage on initialization
  loadLogs() {
    try {
      const stored = localStorage.getItem('zone14_db_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load logs from localStorage:', e);
      this.logs = [];
    }
  }

  // Export logs as downloadable file
  exportLogs() {
    const logsText = this.logs.map(log => 
      `${log.timestamp} [${log.operation}] ${log.table} - Success: ${log.success}${log.error ? ` - Error: ${log.error}` : ''}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zone14_db_logs_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
export const dbLogger = new Logger();

// Load existing logs on initialization
dbLogger.loadLogs();
