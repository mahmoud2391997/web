// Production configuration and utilities
export const PRODUCTION_CONFIG = {
  // App metadata
  name: 'SAM'S PS Gaming Center',
  version: '1.0.0',
  description: 'Gaming Center Management System',
  
  // Database settings
  database: {
    maxConnections: 1,
    timeout: 30000,
    retryAttempts: 3,
    backupInterval: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Performance settings
  performance: {
    autoRefreshInterval: 30000, // 30 seconds
    maxLogEntries: 1000,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  },
  
  // Security settings
  security: {
    enableDevTools: false,
    allowExternalNavigation: false,
    enableNodeIntegration: false,
  },
  
  // UI settings
  ui: {
    theme: 'dark',
    autoHideMenuBar: true,
    showWindowFrame: true,
  }
};

// Check if running in production
export const isProduction = () => {
  return process.env.NODE_ENV === 'production' || !process.env.NODE_ENV;
};

// Get app data directory
export const getAppDataPath = () => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI.getAppDataPath?.() || './data';
  }
  return './data';
};

// Production error handler
export const handleProductionError = (error: Error, context: string) => {
  console.error(`[${context}] Production Error:`, error);
  
  // In production, we might want to send errors to a logging service
  // For now, we'll just log them locally
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    stack: error.stack,
  };
  
  // Store error in localStorage for debugging
  try {
    const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    existingErrors.push(errorLog);
    
    // Keep only last 100 errors
    if (existingErrors.length > 100) {
      existingErrors.splice(0, existingErrors.length - 100);
    }
    
    localStorage.setItem('app_errors', JSON.stringify(existingErrors));
  } catch (storageError) {
    console.error('Failed to store error log:', storageError);
  }
};

// Initialize production settings
export const initializeProductionApp = () => {
  if (isProduction()) {
    // Disable right-click context menu in production
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Disable F12 and other dev shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    });
    
    // Override console methods in production to reduce noise
    if (!PRODUCTION_CONFIG.security.enableDevTools) {
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};
    }
  }
};
