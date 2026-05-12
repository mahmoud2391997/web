import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserIcon, EditIcon, PlusIcon, TrashIcon, MailIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

// Mock local storage-based user management for demo purposes
const localUserStorage = {
  getUsers: (): UserProfile[] => {
    const users = localStorage.getItem('app_users');
    return users ? JSON.parse(users) : [];
  },
  saveUsers: (users: UserProfile[]) => {
    localStorage.setItem('app_users', JSON.stringify(users));
  },
  generateId: () => Math.random().toString(36).substr(2, 9)
};

const UserEmailManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'cashier'
  });
  const [editForm, setEditForm] = useState({
    email: '',
    role: 'cashier'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const userData = localUserStorage.getUsers();
      setUsers(userData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const existingUsers = localUserStorage.getUsers();
      
      // Check if user already exists
      if (existingUsers.some(user => user.email === newUser.email)) {
        toast({
          title: "Error",
          description: "User with this email already exists",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const newUserData: UserProfile = {
        id: localUserStorage.generateId(),
        email: newUser.email,
        role: newUser.role,
        created_at: new Date().toISOString()
      };

      const updatedUsers = [...existingUsers, newUserData];
      localUserStorage.saveUsers(updatedUsers);

      await fetchUsers();
      setCreateDialog(false);
      setNewUser({ email: '', password: '', role: 'cashier' });

      toast({
        title: "Success",
        description: "User created successfully",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const updateUser = async () => {
    if (!selectedUser || !editForm.email) {
      return;
    }

    try {
      const existingUsers = localUserStorage.getUsers();
      const updatedUsers = existingUsers.map(user => 
        user.id === selectedUser.id 
          ? { ...user, email: editForm.email, role: editForm.role }
          : user
      );

      localUserStorage.saveUsers(updatedUsers);

      await fetchUsers();
      setEditDialog(false);
      setSelectedUser(null);

      toast({
        title: "Success",
        description: "User updated successfully",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const existingUsers = localUserStorage.getUsers();
      const updatedUsers = existingUsers.filter(user => user.id !== userId);
      localUserStorage.saveUsers(updatedUsers);

      await fetchUsers();

      toast({
        title: "Success",
        description: "User deleted successfully",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      role: user.role
    });
    setEditDialog(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'cashier': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <Button onClick={() => setCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    {user.email}
                  </CardTitle>
                  <Badge className={`${getRoleColor(user.role)} text-white mt-2`}>
                    {user.role.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => openEditDialog(user)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <EditIcon className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  onClick={() => deleteUser(user.id)}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Create New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter password"
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="cashier" className="text-white">Cashier</SelectItem>
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={createUser} className="flex-1 bg-green-600 hover:bg-green-700">
                <MailIcon className="w-4 h-4 mr-2" />
                Create User
              </Button>
              <Button onClick={() => setCreateDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EditIcon className="w-5 h-5" />
              Edit User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="cashier" className="text-white">Cashier</SelectItem>
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={updateUser} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Update User
              </Button>
              <Button onClick={() => setEditDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserEmailManagement;
