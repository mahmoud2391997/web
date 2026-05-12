import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon, EditIcon, TrashIcon, ShoppingCartIcon, DollarSignIcon } from 'lucide-react';
import { getOrders, updateOrder, deleteOrder, getOrderItems, updateOrderItem, deleteOrderItem } from "@/services/dbService";
import { useToast } from '@/hooks/use-toast';

const OrdersManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const { toast } = useToast();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const items = await getOrderItems(orderId);
      setOrderItems(items);
    } catch (error) {
      console.error('Error loading order items:', error);
      toast({
        title: "Error",
        description: "Failed to load order items",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleEditItems = async (order: any) => {
    setSelectedOrder(order);
    await loadOrderItems(order.id);
    setIsItemsModalOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'active' | 'completed' | 'cancelled') => {
    try {
      await updateOrder(orderId, { status });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      await deleteOrder(id);
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (itemId: string, updates: any) => {
    try {
      await updateOrderItem(itemId, updates);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      if (selectedOrder) {
        await loadOrderItems(selectedOrder.id);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteOrderItem(itemId);
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      if (selectedOrder) {
        await loadOrderItems(selectedOrder.id);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'completed': return 'bg-blue-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case 'room_reservation': return 'bg-blue-600';
      case 'cafe_order': return 'bg-orange-600';
      case 'combo': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Orders Management</h3>
        <Button onClick={loadOrders} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCartIcon className="w-5 h-5" />
                  {order.customer_name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditItems(order)}>
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order.id)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={getOrderTypeColor(order.order_type)}>
                  {order.order_type.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {order.rooms && (
                <div className="text-sm text-gray-300">
                  Room: {order.rooms.name}
                </div>
              )}
              
              <div className="text-sm text-gray-300">
                Items: {order.order_items?.length || 0}
              </div>

              <div className="flex items-center justify-between text-lg font-bold text-green-400">
                <span className="flex items-center gap-2">
                  <DollarSignIcon className="w-4 h-4" />
                  Total:
                </span>
                <span>{Number(order.total_amount).toFixed(2)} EGP</span>
              </div>

              <div className="flex gap-2">
                {order.status === 'active' && (
                  <>
                    <Button 
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Complete
                    </Button>
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {order.status !== 'active' && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateOrderStatus(order.id, 'active')}
                    className="w-full"
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Items Edit Modal */}
      <Dialog open={isItemsModalOpen} onOpenChange={setIsItemsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order Items - {selectedOrder?.customer_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <Card key={item.id} className="bg-slate-700 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.item_name}</div>
                      <div className="text-sm text-gray-300">
                        {item.quantity} x {item.unit_price} EGP = {item.total_price} EGP
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          const newTotal = newQuantity * item.unit_price;
                          handleUpdateItem(item.id, { 
                            quantity: newQuantity, 
                            total_price: newTotal 
                          });
                        }}
                        className="w-20 bg-slate-600 border-slate-500 text-white"
                        min="1"
                      />
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {orderItems.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No items found in this order
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
