// Electron-specific utilities for production
declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => string;
      getPlatform: () => string;
      isProduction: () => boolean;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      showNotification: (title: string, body: string) => void;
      showSaveDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      writeFile: (filePath: string, data: string) => Promise<void>;
      readFile: (filePath: string) => Promise<string>;
      getAppDataPath?: () => string;
    };
  }
}

export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

export const getAppInfo = () => {
  if (isElectron()) {
    return {
      version: window.electronAPI!.getAppVersion(),
      platform: window.electronAPI!.getPlatform(),
      isProduction: window.electronAPI!.isProduction(),
    };
  }
  return {
    version: '1.0.0',
    platform: 'web',
    isProduction: process.env.NODE_ENV === 'production',
  };
};

export const showDesktopNotification = (title: string, message: string) => {
  if (isElectron()) {
    window.electronAPI!.showNotification(title, message);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: message });
  }
};

export const saveFileDialog = async (defaultFilename: string, data: string) => {
  if (isElectron() && window.electronAPI!.showSaveDialog) {
    try {
      const result = await window.electronAPI!.showSaveDialog({
        defaultPath: defaultFilename,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled && result.filePath) {
        await window.electronAPI!.writeFile(result.filePath, data);
        return result.filePath;
      }
    } catch (error) {
      console.error('Electron save dialog failed:', error);
    }
  }
  
  // Fallback to browser download
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return defaultFilename;
};

export const openFileDialog = async () => {
  if (isElectron() && window.electronAPI!.showOpenDialog) {
    try {
      const result = await window.electronAPI!.showOpenDialog({
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const content = await window.electronAPI!.readFile(result.filePaths[0]);
        return { content, filename: result.filePaths[0] };
      }
    } catch (error) {
      console.error('Electron open dialog failed:', error);
    }
  }
  
  return null;
};
