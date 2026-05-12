import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserIcon, SwitchCameraIcon } from 'lucide-react';

interface UserSwitcherProps {
  currentUser: string;
  onUserChange: (user: string) => void;
  isAdmin: boolean;
}

const UserSwitcher = ({ currentUser, onUserChange, isAdmin }: UserSwitcherProps) => {
  if (!isAdmin) return null; // Only show for admin users

  const users = [
    { value: 'admin', label: 'Admin', icon: '👑' },
    { value: 'cashier1', label: 'Cashier 1', icon: '💰' },
    { value: 'cashier2', label: 'Cashier 2', icon: '💰' },
    { value: 'manager', label: 'Manager', icon: '📊' }
  ];

  return (
    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
      <SwitchCameraIcon className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-400">Switch User:</span>
      <Select value={currentUser} onValueChange={onUserChange}>
        <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-700 border-slate-600">
          {users.map((user) => (
            <SelectItem key={user.value} value={user.value} className="text-white hover:bg-slate-600">
              <div className="flex items-center gap-2">
                <span>{user.icon}</span>
                <span>{user.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSwitcher;
