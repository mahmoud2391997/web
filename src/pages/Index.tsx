import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOutIcon, UsersIcon } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import CashierDashboard from '@/components/CashierDashboard';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { stateSync } from '@/utils/stateSync';
interface IndexProps {
  user: any;
  onLogout: () => void;
}

const Index = ({ user, onLogout }: IndexProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [userRole, setUserRole] = useState<'admin' | 'cashier'>('admin');

  // Initialize state sync manager
  useEffect(() => {
    stateSync.setDispatch(dispatch);
    
    // Cleanup on unmount
    return () => {
      stateSync.cleanup();
    };
  }, [dispatch]);



  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">SAM'S PS Gaming Center</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                userRole === 'admin' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-blue-600 text-white'
              }`}>
                {userRole === 'admin' ? 'ADMIN' : 'CASHIER'}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Welcome, {user?.name || (userRole === 'admin' ? 'Administrator' : 'Cashier')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setUserRole(userRole === 'admin' ? 'cashier' : 'admin')}
              variant="outline"
              size="sm"
              className="text-white border-slate-600 bg-blue-600/20 border-blue-500"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              Switch to {userRole === 'admin' ? 'Cashier' : 'Admin'}
            </Button>
            <Button 
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="text-white border-slate-600"
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-4">
          {userRole === 'admin' ? <AdminDashboard /> : <CashierDashboard />}
        </div>
      </div>
    </div>
  );
};

export default Index;
