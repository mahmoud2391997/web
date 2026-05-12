import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EditIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateOrderItem, createOrderItem, deleteOrderItem } from '@/services/dbService';
import { AppDispatch } from '@/store/store';

interface PaidOrderEditorProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onOrderUpdated: () => void;
}

const PaidOrderEditor = ({ isOpen, onClose, order, onOrderUpdated }: PaidOrderEditorProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 1,
    unit_price: 0,
    item_type: 'cafe_product' as 'room_time' | 'cafe_product' | 'room_time_completed'
  });
  const [showAddItem, setShowAddItem] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (order && order.order_items) {
      setEditingItems(order.order_items.map((item: any) => ({ ...item })));
    }
  }, [order]);

  const handleItemUpdate = async (itemId: string, updates: any) => {
    const finalUpdates = {
      ...updates,
      total_price: Number((updates.quantity * updates.unit_price).toFixed(2))
    };
    
    const originalItem = editingItems.find(item => item.id === itemId);
    
    setEditingItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...finalUpdates } : item
      )
    );

    try {
      await updateOrderItem(itemId, finalUpdates);
      
      const { updateOrderItemInState } = await import('@/store/slices/ordersSlice');
      dispatch(updateOrderItemInState({
        orderId: order.id,
        itemId: itemId,
        updates: finalUpdates
      }));
      
      toast({
        title: "Updated",
        description: "Item updated successfully",
      });
    } catch (error) {
      if (originalItem) {
        setEditingItems(prev => 
          prev.map(item => 
            item.id === itemId ? originalItem : item
          )
        );
      }
      toast({
        title: "Error",
        description: "Update failed",
        variant: "destructive",
      });
    }
  };

  const handleItemDelete = async (itemId: string) => {
    const originalItems = [...editingItems];
    
    setEditingItems(prev => prev.filter(item => item.id !== itemId));
    
    try {
      await deleteOrderItem(itemId);
      
      const { updateOrderItems } = await import('@/store/slices/ordersSlice');
      const { getOrderItems } = await import('@/services/dbService');
      const freshItems = await getOrderItems(order.id);
      dispatch(updateOrderItems({ orderId: order.id, newItems: freshItems }));

      toast({
        title: "Item Deleted",
        description: "Order item has been removed",
      });
    } catch (error) {
      setEditingItems(originalItems);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.item_name.trim() || newItem.unit_price <= 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData = {
        order_id: order.id,
        item_type: newItem.item_type,
        item_name: newItem.item_name,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        total_price: newItem.quantity * newItem.unit_price,
        is_paid: true
      };

      const createdItem = await createOrderItem(itemData);
      
      setEditingItems(prev => [...prev, createdItem]);
      
      const { updateOrderItems } = await import('@/store/slices/ordersSlice');
      const { getOrderItems } = await import('@/services/dbService');
      const freshItems = await getOrderItems(order.id);
      dispatch(updateOrderItems({ orderId: order.id, newItems: freshItems }));
      
      setNewItem({
        item_name: '',
        quantity: 1,
        unit_price: 0,
        item_type: 'cafe_product'
      });
      setShowAddItem(false);

      toast({
        title: "Item Added",
        description: "New item has been added to the order",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const newTotalAmount = editingItems.reduce((sum, item) => sum + (item.total_price || (item.quantity * item.unit_price)), 0);
      
      const { editOrder } = await import('@/store/slices/ordersSlice');
      await dispatch(editOrder({
        id: order.id,
        updates: {
          total_amount: newTotalAmount
        }
      }));
      
      try {
        const { getTransactions, updateTransaction } = await import('@/services/dbService');
        const transactions = await getTransactions();
        const validTransactions = Array.isArray(transactions) ? transactions : [];
        const orderTransaction = validTransactions.find((tx: any) => 
          tx && tx.order_id === order.id && tx.transaction_type === 'payment'
        );
        
        if (orderTransaction && Math.abs(orderTransaction.amount - newTotalAmount) > 0.01) {
          await updateTransaction(orderTransaction.id, {
            amount: newTotalAmount,
            description: `Updated payment for order ${order.id} - Items: ${editingItems.map(i => i.item_name).join(', ')} - Total: ${newTotalAmount.toFixed(2)} EGP`
          });
          
          const { fetchTransactions } = await import('@/store/slices/transactionsSlice');
          await dispatch(fetchTransactions({}));
        }
      } catch (transactionError) {
        console.warn('Could not update related transaction:', transactionError);
      }
      
      const { updateOrder } = await import('@/services/dbService');
      await updateOrder(order.id, { total_amount: newTotalAmount });
      
      const { fetchOrders } = await import('@/store/slices/ordersSlice');
      await dispatch(fetchOrders(undefined));
      
      onOrderUpdated();
      onClose();
      
      toast({
        title: "Order Updated",
        description: `Order #${order.id.substring(0, 8)} has been updated successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the order.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EditIcon className="w-5 h-5" />
            Edit Paid Order - {order.customer_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="text-sm text-gray-300">
              Order ID: {order.id} | Status: 
              <Badge className="ml-2 bg-green-600">PAID</Badge>
            </div>
            {Math.abs(editingItems.reduce((sum, item) => sum + (item.total_price || (item.quantity * item.unit_price)), 0) - order.total_amount) > 0.01 ? (
              <div className="mt-1">
                <div className="text-lg font-bold text-red-400 line-through">
                  Original Total: {order.total_amount?.toFixed(2)} EGP
                </div>
                <div className="text-xl font-bold text-green-400 mt-1">
                  New Total: {editingItems.reduce((sum, item) => sum + (item.total_price || (item.quantity * item.unit_price)), 0).toFixed(2)} EGP
                </div>
                <div className="mt-2 p-2 bg-yellow-900/50 border border-yellow-600 rounded">
                  <div className="text-yellow-400 text-sm font-medium">
                    Change: {(editingItems.reduce((sum, item) => sum + (item.total_price || (item.quantity * item.unit_price)), 0) - order.total_amount).toFixed(2)} EGP
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-lg font-bold text-green-400 mt-1">
                Total: {order.total_amount?.toFixed(2)} EGP
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Order Items</h3>
            {editingItems.map((item, index) => {
              const originalItem = order.order_items?.find((orig: any) => orig.id === item.id);
              const isNewItem = !originalItem;
              const isModified = originalItem && (
                originalItem.quantity !== item.quantity ||
                originalItem.unit_price !== item.unit_price ||
                originalItem.item_name !== item.item_name
              );

              return (
                <div key={item.id || index} className={`p-3 rounded-lg border ${
                  isNewItem ? 'border-green-500 bg-green-900/20' : 
                  isModified ? 'border-yellow-500 bg-yellow-900/20' : 
                  'border-slate-600 bg-slate-700'
                }`}>
                  {isNewItem && (
                    <div className="mb-2 text-green-400 text-sm font-medium flex items-center gap-1">
                      ✨ NEW ITEM ADDED
                    </div>
                  )}
                  {isModified && (
                    <Badge className="mb-2 bg-yellow-600">MODIFIED</Badge>
                  )}
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Item Name</Label>
                      <Input
                        value={item.item_name}
                        onChange={(e) => handleItemUpdate(item.id, { ...item, item_name: e.target.value })}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                      {isModified && originalItem.item_name !== item.item_name && (
                        <div className="text-xs text-gray-400 line-through mt-1">
                          Was: {originalItem.item_name}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-400">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemUpdate(item.id, { ...item, quantity: parseInt(e.target.value) || 1 })}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                      {isModified && originalItem.quantity !== item.quantity && (
                        <div className="text-xs text-gray-400 line-through mt-1">
                          Was: {originalItem.quantity}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-400">Unit Price (EGP)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemUpdate(item.id, { ...item, unit_price: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                      {isModified && originalItem.unit_price !== item.unit_price && (
                        <div className="text-xs text-gray-400 line-through mt-1">
                          Was: {originalItem.unit_price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <div>
                        <Label className="text-xs text-gray-400">Total</Label>
                        <div className="text-lg font-bold text-green-400">
                          {(item.quantity * item.unit_price).toFixed(2)} EGP
                        </div>
                        {isModified && (originalItem.quantity * originalItem.unit_price) !== (item.quantity * item.unit_price) && (
                          <div className="text-xs text-gray-400 line-through">
                            Was: {(originalItem.quantity * originalItem.unit_price).toFixed(2)} EGP
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleItemDelete(item.id)}
                        className="mt-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showAddItem && (
            <div className="p-3 rounded-lg border border-blue-500 bg-blue-900/20">
              <h4 className="text-sm font-medium mb-3 text-blue-400">Add New Item</h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">Item Name</Label>
                  <Input
                    value={newItem.item_name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                    className="bg-slate-600 border-slate-500 text-white"
                    placeholder="Enter item name"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-400">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-400">Unit Price (EGP)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>
                
                <div className="flex flex-col justify-end gap-2">
                  <div className="text-sm font-medium text-green-400">
                    Total: {(newItem.quantity * newItem.unit_price).toFixed(2)} EGP
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddItem} size="sm" className="bg-green-600 hover:bg-green-700">
                      Add
                    </Button>
                    <Button onClick={() => setShowAddItem(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button
              onClick={() => setShowAddItem(true)}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
              disabled={showAddItem}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { PaidOrderEditor };
export default PaidOrderEditor;
