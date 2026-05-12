import { toast } from "@/hooks/use-toast";

export const createBackup = async () => {
  try {
    // Export all data for backup
    
    const { getRooms, getOrders, getAppointments, getCafeProducts, getTransactions } = await import('@/services/dbService');
    
    const [rooms, orders, appointments, cafeProducts, transactions] = await Promise.all([
      getRooms(),
      getOrders(),
      getAppointments(),
      getCafeProducts(),
      getTransactions()
    ]);
    
    const backupData = {
      version: '1.0',
      appName: 'SAM\'S PS Gaming Center',
      timestamp: new Date().toISOString(),
      platform: navigator.platform,
      data: {
        rooms,
        orders,
        appointments,
        cafeProducts,
        transactions
      }
    };
    
    // Create backup file with timestamp
    const dataStr = JSON.stringify(backupData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `zone14-backup-${timestamp}.json`;
    
    // Use Electron's file dialog if available
    if (window.electronAPI?.showSaveDialog) {
      try {
        const result = await window.electronAPI.showSaveDialog({
          defaultPath: filename,
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        
        if (!result.canceled && result.filePath) {
          await window.electronAPI.writeFile(result.filePath, dataStr);
          toast({
            title: "Backup Created",
            description: `Database backup saved to ${result.filePath}`,
            duration: 5000,
          });
          return true;
        }
      } catch (error) {
        console.error('Electron file save failed, falling back to browser download:', error);
      }
    }
    
    // Fallback to browser download
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Backup Created",
      description: `Database backup saved as ${filename}`,
      duration: 5000,
    });
    
    return true;
  } catch (error) {
    console.error('Backup creation failed:', error);
    toast({
      title: "Backup Failed",
      description: "Failed to create database backup",
      variant: "destructive",
      duration: 5000,
    });
    return false;
  }
};

export const validateBackupFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Enhanced validation
        if (!data.version || !data.timestamp || !data.data || !data.appName) {
          resolve(false);
          return;
        }
        
        // Check if it's from the correct app
        if (data.appName !== 'SAM\'S PS Gaming Center') {
          resolve(false);
          return;
        }
        
        // Check required tables
        const requiredTables = ['rooms', 'orders', 'appointments', 'cafeProducts', 'transactions'];
        const hasAllTables = requiredTables.every(table => Array.isArray(data.data[table]));
        
        // Validate data structure
        if (hasAllTables) {
          // Basic structure validation
          const hasValidRooms = data.data.rooms.every((room: any) => 
            room.id && room.name && room.console_type && typeof room.pricing_single === 'number'
          );
          resolve(hasValidRooms);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Backup validation error:', error);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
};
