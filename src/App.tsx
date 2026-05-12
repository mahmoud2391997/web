import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReduxProvider } from './store/provider';
import Index from "./pages/Index";

import Login from "./components/Login";

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
    
    console.log('SAM\'S PS Gaming Center - PWA Started');
    console.log('Environment:', import.meta.env.MODE || 'production');
  }, []);

  const handleLogin = (userData: any) => {
    console.log('Login successful:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ReduxProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Index user={user} onLogout={handleLogout} />
      </TooltipProvider>
    </ReduxProvider>
  );
};

export default App;
