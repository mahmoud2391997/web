import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, EditIcon, TrashIcon, GamepadIcon } from 'lucide-react';
import { getRooms, createRoom, updateRoom, deleteRoom, Room } from "@/services/dbService";
import { useToast } from '@/hooks/use-toast';

const RoomsManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    console_type: 'PS5' as 'PS4' | 'PS5',
    status: 'available' as 'available' | 'occupied' | 'cleaning' | 'maintenance',
    pricing_single: 0,
    pricing_multiplayer: 0
  });

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      console_type: 'PS5',
      status: 'available',
      pricing_single: 0,
      pricing_multiplayer: 0
    });
    setEditingRoom(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, formData);
        toast({
          title: "Success",
          description: "Room updated successfully",
        });
      } else {
        await createRoom(formData);
        toast({
          title: "Success",
          description: "Room created successfully",
        });
      }
      
      resetForm();
      setIsModalOpen(false);
      loadRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      toast({
        title: "Error",
        description: "Failed to save room",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      id: room.id,
      name: room.name,
      console_type: room.console_type,
      status: room.status,
      pricing_single: room.pricing_single,
      pricing_multiplayer: room.pricing_multiplayer
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await deleteRoom(id);
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-600';
      case 'occupied': return 'bg-red-600';
      case 'cleaning': return 'bg-yellow-600';
      case 'maintenance': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Rooms Management</h3>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="id">Room ID</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({...formData, id: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={!!editingRoom}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <Label>Console Type</Label>
                <Select value={formData.console_type} onValueChange={(value: 'PS4' | 'PS5') => setFormData({...formData, console_type: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="PS4" className="text-white">PS4</SelectItem>
                    <SelectItem value="PS5" className="text-white">PS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="available" className="text-white">Available</SelectItem>
                    <SelectItem value="occupied" className="text-white">Occupied</SelectItem>
                    <SelectItem value="cleaning" className="text-white">Cleaning</SelectItem>
                    <SelectItem value="maintenance" className="text-white">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricing_single">Single Player Price</Label>
                  <Input
                    id="pricing_single"
                    type="number"
                    step="0.01"
                    value={formData.pricing_single}
                    onChange={(e) => setFormData({...formData, pricing_single: parseFloat(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="pricing_multiplayer">Multiplayer Price</Label>
                  <Input
                    id="pricing_multiplayer"
                    type="number"
                    step="0.01"
                    value={formData.pricing_multiplayer}
                    onChange={(e) => setFormData({...formData, pricing_multiplayer: parseFloat(e.target.value)})}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Saving...' : editingRoom ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <Card key={room.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <GamepadIcon className="w-5 h-5" />
                  {room.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(room.id)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={room.console_type === 'PS5' ? 'bg-blue-600' : 'bg-green-600'}>
                  {room.console_type}
                </Badge>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Single:</span>
                  <span className="text-green-400">{room.pricing_single} EGP/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Multi:</span>
                  <span className="text-green-400">{room.pricing_multiplayer} EGP/hr</span>
                </div>
              </div>
              
              {room.current_customer_name && (
                <div className="bg-slate-700 p-2 rounded text-sm text-white">
                  <div>Customer: {room.current_customer_name}</div>
                  <div>Total: {room.current_total_cost} EGP</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoomsManagement;
