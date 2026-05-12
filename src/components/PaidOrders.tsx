import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayIcon, EditIcon, DollarSignIcon, ClockIcon, GamepadIcon, ShoppingCartIcon } from 'lucide-react';
import { fetchOrders, editOrder } from '@/store/slices/ordersSlice';
import { fetchRooms, editRoom } from '@/store/slices/roomsSlice';
import { RootState, AppDispatch } from '@/store/store';
import { useToast } from '@/hooks/use-toast';
import { PaidOrderEditor } from '@/components/PaidOrderEditor';

const PaidOrders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { rooms } = useSelector((state: RootState) => state.rooms);
  const { toast } = useToast();
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reactivateDialog, setReactivateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [reactivateForm, setReactivateForm] = useState({
    duration_hours: 1,
    is_open_time: false
  });

  useEffect(() => {
    dispatch(fetchOrders('paid'));
    dispatch(fetchRooms());
  }, [dispatch]);

  const paidOrders = orders.filter((order: any) => order.status === 'paid');
  
  // Get last order for each room
  const roomOrders = paidOrders
    .filter((order: any) => order.order_type === 'room_reservation' || order.order_type === 'combo')
    .reduce((acc: any, order: any) => {
      if (!acc[order.room_id] || new Date(order.updated_at) > new Date(acc[order.room_id].updated_at)) {
        acc[order.room_id] = order;
      }
      return acc;
    }, {});

  // Get latest 5 cafe orders
  const cafeOrders = paidOrders
    .filter((order: any) => order.order_type === 'cafe_order')
    .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const reactivateOrder = async () => {
    if (!selectedOrder) return;

    try {
      // Fetch the latest room data to ensure we have the most up-to-date information
      // This is important for time adjustments made from room cards
      await dispatch(fetchRooms());
      
      const room = rooms.find(r => r.id === selectedOrder.room_id);
      if (!room || room.status !== 'available') {
        toast({
          title: "Error",
          description: "Room is not available for reactivation",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const startTime = new Date().toISOString();
      let endTime = null;
      
      if (!reactivateForm.is_open_time) {
        const end = new Date();
        end.setHours(end.getHours() + reactivateForm.duration_hours);
        endTime = end.toISOString();
      }

      // Update room status
      await dispatch(editRoom({
        id: selectedOrder.room_id,
        updates: {
          status: 'occupied',
          current_customer_name: selectedOrder.customer_name,
          current_session_start: startTime,
          current_session_end: endTime,
          current_mode: selectedOrder.mode || 'single',
          current_total_cost: 0
        }
      }));

      // Create new order or reactivate existing
      await dispatch(editOrder({
        id: selectedOrder.id,
        updates: {
          status: 'active',
          start_time: startTime,
          end_time: endTime,
          total_amount: reactivateForm.is_open_time ? 0 : (reactivateForm.duration_hours * (selectedOrder.mode === 'single' ? room.pricing_single : room.pricing_multiplayer))
        }
      }));

      setReactivateDialog(false);
      setSelectedOrder(null);
      setReactivateForm({ duration_hours: 1, is_open_time: false });

      toast({
        title: "Order Reactivated",
        description: `Room session resumed for ${selectedOrder.customer_name}`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate order",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading paid orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Paid Orders</h2>
      </div>

      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-0">
          <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-600 text-white">
            <GamepadIcon className="w-4 h-4 mr-2" />
            Room Orders
          </TabsTrigger>
          <TabsTrigger value="cafe" className="data-[state=active]:bg-orange-600 text-white">
            <ShoppingCartIcon className="w-4 h-4 mr-2" />
            Café Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.values(roomOrders).map((order: any) => {
              const room = rooms.find(r => r.id === order.room_id);
              return (
                <Card key={order.id} className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white text-lg">{order.customer_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-500 text-white">
                            {room?.name} - {room?.console_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">
                          {order.total_amount.toFixed(2)} EGP
                        </div>
                        <div className="text-gray-400 text-xs">
                          {formatDate(order.updated_at)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-300">Items:</div>
                      {order.order_items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            <span className="font-medium text-blue-400">{item.quantity}x</span> {item.item_name}
                          </span>
                          <span className="text-white">{item.total_price.toFixed(2)} EGP</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setReactivateDialog(true);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                        disabled={room?.status !== 'available'}
                      >
                        <PlayIcon className="w-4 h-4 mr-1" />
                        Reactivate
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setEditDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cafe">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {cafeOrders.map((order: any) => (
              <Card key={order.id} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">{order.customer_name}</CardTitle>
                      <Badge className="bg-orange-500 text-white mt-1">
                        Café Order
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        {order.total_amount.toFixed(2)} EGP
                      </div>
                      <div className="text-gray-400 text-xs">
                        {formatDate(order.updated_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Items:</div>
                    {order.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-300">
                          <span className="font-medium text-orange-400">{item.quantity}x</span> {item.item_name}
                        </span>
                        <span className="text-white">{item.total_price.toFixed(2)} EGP</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setEditDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reactivate Dialog */}
      <Dialog open={reactivateDialog} onOpenChange={setReactivateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Reactivate Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-gray-300">
              Customer: <span className="text-white font-medium">{selectedOrder?.customer_name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="openTime"
                checked={reactivateForm.is_open_time}
                onChange={(e) => setReactivateForm({...reactivateForm, is_open_time: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="openTime">Open Time (Pay when session ends)</Label>
            </div>

            {!reactivateForm.is_open_time && (
              <div>
                <Label>Duration (Hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={reactivateForm.duration_hours}
                  onChange={(e) => setReactivateForm({...reactivateForm, duration_hours: parseFloat(e.target.value)})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={reactivateOrder} className="flex-1 bg-green-600 hover:bg-green-700">
                <PlayIcon className="w-4 h-4 mr-2" />
                Reactivate Session
              </Button>
              <Button onClick={() => setReactivateDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Using PaidOrderEditor component */}
      <PaidOrderEditor 
        isOpen={editDialog} 
        onClose={() => setEditDialog(false)} 
        order={selectedOrder} 
        onOrderUpdated={() => {
          // Refresh orders after update
          dispatch(fetchOrders('paid'));
        }} 
      />
    </div>
  );
};

export default PaidOrders;
