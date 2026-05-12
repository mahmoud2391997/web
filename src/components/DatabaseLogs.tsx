import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadIcon, TrashIcon, RefreshCwIcon } from 'lucide-react';
import { dbLogger } from '@/services/logger';

const DatabaseLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const loadLogs = () => {
    setLogs(dbLogger.getLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'errors') return !log.success;
    if (filter === 'success') return log.success;
    return log.operation === filter;
  });

  const handleExport = () => {
    dbLogger.exportLogs();
  };

  const handleClear = () => {
    dbLogger.clearLogs();
    setLogs([]);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Database Activity Logs</CardTitle>
            <div className="flex gap-2">
              <Button onClick={loadLogs} size="sm" variant="outline">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExport} size="sm" variant="outline">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleClear} size="sm" variant="destructive">
                <TrashIcon className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'AUTH', 'errors', 'success'].map(f => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f.toUpperCase()}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No logs found</p>
            ) : (
              filteredLogs.slice(-50).reverse().map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border text-sm ${
                    log.success 
                      ? 'bg-slate-700 border-slate-600' 
                      : 'bg-red-900/20 border-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.operation}
                      </Badge>
                      <span className="text-blue-400">{log.table}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant={log.success ? "default" : "destructive"}>
                      {log.success ? 'SUCCESS' : 'ERROR'}
                    </Badge>
                  </div>
                  
                  {log.data && (
                    <div className="text-xs text-gray-300 mb-1">
                      <strong>Data:</strong> {log.data.length > 100 ? log.data.substring(0, 100) + '...' : log.data}
                    </div>
                  )}
                  
                  {log.error && (
                    <div className="text-xs text-red-400">
                      <strong>Error:</strong> {log.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 text-xs text-gray-400 text-center">
            Showing last 50 of {filteredLogs.length} logs
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseLogs;
