interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  data?: any
  source: string
}

class DatabaseLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private createLogEntry(level: LogEntry["level"], message: string, data?: any, source = "dbService"): LogEntry {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source,
    }
  }

  info(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry("info", message, data, source)
    this.logs.push(entry)
    this.trimLogs()
    console.log(`[DB Logger - INFO] ${message}`, data)
  }

  warn(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry("warn", message, data, source)
    this.logs.push(entry)
    this.trimLogs()
    console.warn(`[DB Logger - WARN] ${message}`, data)
  }

  error(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry("error", message, data, source)
    this.logs.push(entry)
    this.trimLogs()
    console.error(`[DB Logger - ERROR] ${message}`, data)
  }

  debug(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry("debug", message, data, source)
    this.logs.push(entry)
    this.trimLogs()
    console.debug(`[DB Logger - DEBUG] ${message}`, data)
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  getLogs(level?: LogEntry["level"], limit = 100): LogEntry[] {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = this.logs.filter((log) => log.level === level)
    }

    return filteredLogs.slice(-limit)
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const dbLogger = new DatabaseLogger()
