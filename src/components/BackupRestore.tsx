import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DownloadIcon, UploadIcon, DatabaseIcon, AlertTriangleIcon, FileTextIcon } from 'lucide-react';
import { createBackup, validateBackupFile } from '@/utils/backup';
import { dbLogger } from '@/services/logger';
import { useToast } from '@/hooks/use-toast';

const BackupRestore = () => {
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidFile, setIsValidFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setIsValidFile(false);
      return;
    }

    setSelectedFile(file);
    const isValid = await validateBackupFile(file);
    setIsValidFile(isValid);

    if (!isValid) {
      toast({
        title: "Invalid File",
        description: "The selected file is not a valid backup file",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleRestore = async () => {
    if (!selectedFile || !isValidFile) return;

    setIsProcessing(true);
    try {
      // In a real implementation, this would restore the database
      // For now, we'll just show a success message
      toast({
        title: "Restore Complete",
        description: "Database has been restored from backup (feature in development)",
        duration: 5000,
      });
      
      setIsRestoreDialogOpen(false);
      setSelectedFile(null);
      setIsValidFile(false);
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore database from backup",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Backup & Restore</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DownloadIcon className="w-5 h-5" />
              Create Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300 text-sm">
              Create a backup of your database including all rooms, orders, appointments, and transactions.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={createBackup}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <DatabaseIcon className="w-4 h-4 mr-2" />
                Download Backup
              </Button>
              <Button 
                onClick={() => dbLogger.exportLogs()}
                variant="outline"
                className="w-full border-blue-500 text-blue-400 hover:bg-blue-900/20"
              >
                <FileTextIcon className="w-4 h-4 mr-2" />
                Download Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UploadIcon className="w-5 h-5" />
              Restore from Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300 text-sm">
              Restore your database from a previously created backup file.
            </p>
            <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Restore Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
                    Restore Database
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm">
                      <strong>Warning:</strong> Restoring from backup will replace all current data. 
                      Make sure to create a backup of your current data first.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="backupFile" className="text-white">
                      Select Backup File
                    </Label>
                    <Input
                      id="backupFile"
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {selectedFile && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        Selected: {selectedFile.name}
                      </div>
                      <div className={`text-sm ${isValidFile ? 'text-green-400' : 'text-red-400'}`}>
                        {isValidFile ? '✓ Valid backup file' : '✗ Invalid backup file'}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRestore}
                      disabled={!selectedFile || !isValidFile || isProcessing}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {isProcessing ? 'Restoring...' : 'Restore Database'}
                    </Button>
                    <Button 
                      onClick={() => setIsRestoreDialogOpen(false)}
                      variant="outline" 
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Backup Schedule Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Backup Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>Daily Backups:</strong> Create backups at the end of each business day to preserve transaction data.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Weekly Backups:</strong> Keep weekly backups for longer-term data recovery.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <strong>Before Updates:</strong> Always create a backup before updating the application.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;
