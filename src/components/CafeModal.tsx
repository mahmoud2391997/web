import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, MinusIcon, DollarSignIcon, ShoppingCartIcon } from 'lucide-react';
import { getCafeProducts, createOrderItem, getOrderItems, CafeProduct, Room, Order } from "@/services/dbService";
import { fetchOrders, updateOrderItems, updateOrderInState } from '@/store/slices/ordersSlice';
import { AppDispatch } from '@/store/store';
import { useToast } from '@/hooks/use-toast';

interface CafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  order: Order | null;
  onOrderUpdated: () => void;
}

const CafeModal = ({ isOpen, onClose, room, order, onOrderUpdated }: CafeModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [cafeProducts, setCafeProducts] = useState<CafeProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCafeProducts();
    }
  }, [isOpen]);

  const loadCafeProducts = async () => {
    try {
      const products = await getCafeProducts();
      setCafeProducts(products.filter(p => p.active && p.stock > 0));
    } catch (error) {
      console.error('Error loading cafe products:', error);
      toast({
        title: "Error",
        description: "Failed to load cafe products",
        variant: "destructive",
      });
    }
  };

  const calculateCafeCost = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      const product = cafeProducts.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity)
    }));
  };

  const handleAddToOrder = async () => {
    if (!order || !room) return;

    const hasProducts = Object.values(selectedProducts).some(qty => qty > 0);
    if (!hasProducts) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one cafe item to add to the order",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Add cafe products as order items
      for (const [productId, quantity] of Object.entries(selectedProducts)) {
        if (quantity > 0) {
          const product = cafeProducts.find(p => p.id === productId);
          if (product) {
            await createOrderItem({
              order_id: order.id!,
              item_type: 'cafe_product',
              item_name: product.name,
              quantity: quantity,
              unit_price: product.price,
              total_price: product.price * quantity,
              is_paid: false // Mark as unpaid when added to existing order
            });
          }
        }
      }

      // Immediately get fresh order items and update Redux
      const updatedOrderItems = await getOrderItems(order.id!);
      dispatch(updateOrderItems({ orderId: order.id!, newItems: updatedOrderItems }));
      
      // Calculate new total amount including cafe items
      const newTotalAmount = updatedOrderItems.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
      
      // Optimistically update order type and total in Redux state
      dispatch(updateOrderInState({ 
        id: order.id!, 
        updates: { 
          order_type: 'combo',
          total_amount: newTotalAmount
        } 
      }));
      
      // Persist order changes
      const { editOrder } = await import('@/store/slices/ordersSlice');
      await dispatch(editOrder({ 
        id: order.id!, 
        updates: { 
          order_type: 'combo',
          total_amount: newTotalAmount
        } 
      }));

      toast({
        title: "Items Added",
        description: `Added ${Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0)} cafe items to the order. Order type changed to combo.`,
      });
      
      // Use state manager for consistent updates
      const { StateManager } = await import('@/utils/stateManager');
      await StateManager.refreshOrders(true);
      
      // Reset selections
      setSelectedProducts({});
      
      // Trigger immediate state update for parent components
      onOrderUpdated();
      
      onClose();
    } catch (error) {
      console.error('Error adding cafe items to order:', error);
      toast({
        title: "Error",
        description: "Failed to add items to order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!room || !order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5" />
            Add Café Items - {room.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge className={room.console_type === 'PS5' ? 'bg-blue-600' : 'bg-green-600'}>
              {room.console_type}
            </Badge>
            <Badge className="bg-purple-600">
              Order: {order.customer_name}
            </Badge>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Available Café Items</h4>
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
              {cafeProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="text-white flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-300">{product.price} EGP each</div>
                    <div className="text-xs text-gray-400">Stock: {product.stock}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleProductQuantityChange(product.id!, Math.max(0, (selectedProducts[product.id!] || 0) - 1))}
                      disabled={!selectedProducts[product.id!] || selectedProducts[product.id!] <= 0}
                    >
                      <MinusIcon className="w-3 h-3" />
                    </Button>
                    <span className="text-white w-8 text-center font-medium">
                      {selectedProducts[product.id!] || 0}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleProductQuantityChange(product.id!, (selectedProducts[product.id!] || 0) + 1)}
                      disabled={product.stock <= (selectedProducts[product.id!] || 0)}
                    >
                      <PlusIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Object.values(selectedProducts).some(qty => qty > 0) && (
            <div className="bg-slate-700 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-lg font-bold text-green-400">
                <span className="flex items-center gap-2">
                  <DollarSignIcon className="w-4 h-4" />
                  Total:
                </span>
                <span>{calculateCafeCost().toFixed(2)} EGP</span>
              </div>
              <div className="text-sm text-gray-400">
                {Object.entries(selectedProducts)
                  .filter(([_, qty]) => qty > 0)
                  .map(([productId, qty]) => {
                    const product = cafeProducts.find(p => p.id === productId);
                    return `${product?.name} x${qty}`;
                  })
                  .join(', ')}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleAddToOrder}
              disabled={isLoading || !Object.values(selectedProducts).some(qty => qty > 0)}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Adding...' : 'Add to Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CafeModal;
