import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GamepadIcon, ClockIcon, DollarSignIcon, UserIcon, UsersIcon, PlusIcon } from 'lucide-react';
import { createOrder, createOrderItem, createTransaction, getCafeProducts, CafeProduct, Room } from "@/services/dbService";
import { useToast } from '@/hooks/use-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onBook: (roomId: string, customerName: string, hours: number, mode: 'single' | 'multiplayer', orderId: string) => void;
}

const BookingModal = ({ isOpen, onClose, room, onBook }: BookingModalProps) => {
  const [customerName, setCustomerName] = useState('');
  const [hours, setHours] = useState<number | 'open'>(1);
  const [selectedMode, setSelectedMode] = useState<'single' | 'multiplayer'>('single');
  const [cafeProducts, setCafeProducts] = useState<CafeProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const [showCafeSection, setShowCafeSection] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!room) return null;

  const timeOptions = [
    { value: 0.5, label: '30 minutes' },
    { value: 'open', label: 'Open Time' }, // changed value to 'open'
    { value: 1, label: '1 hour' },
    { value: 1.5, label: '1.5 hours' },
    { value: 2, label: '2 hours' },
    { value: 2.5, label: '2.5 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
    { value: 5, label: '5 hours' },
    { value: 6, label: '6 hours' },
    { value: 8, label: '8 hours' },
    { value: 12, label: '12 hours' }
  ];

  const loadCafeProducts = async () => {
    try {
      const products = await getCafeProducts();
      setCafeProducts(products.filter(p => p.active && p.stock > 0));
      setShowCafeSection(true);
    } catch (error) {
      console.error('Error loading cafe products:', error);
    }
  };

  const calculateRoomCost = () => {
    if (hours === 'open') return 0; // or your preferred logic
    return hours * (selectedMode === 'single' ? room.pricing_single : room.pricing_multiplayer);
  };

  const calculateCafeCost = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      const product = cafeProducts.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const calculateTotalCost = () => {
    return calculateRoomCost() + calculateCafeCost();
  };

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    setIsLoading(true);
    try {
      // Check for appointment conflicts
      const { checkAppointmentConflicts } = await import('@/services/dbService');
      const currentDateTime = new Date();
      const duration = hours === 'open' ? 8 : Number(hours); // Assume max 8 hours for open time
      const today = currentDateTime.toISOString().split('T')[0];
      const currentTime = currentDateTime.toTimeString().substring(0, 5);
      
      const hasConflict = await checkAppointmentConflicts(
        room.id,
        today,
        currentTime,
        duration
      );
      
      if (hasConflict) {
        toast({
          title: "Booking Conflict",
          description: "There is an appointment scheduled for this room during the selected time. Please check the schedule.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Also check if room is currently occupied or has active sessions
      if (room.status !== 'available') {
        toast({
          title: "Room Unavailable",
          description: "This room is currently occupied or unavailable.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      const orderType = Object.keys(selectedProducts).length > 0 ? 'combo' : 'room_reservation';
      const totalAmount = calculateTotalCost();
      const sessionStartTime = new Date();
      // If open time, don't set endTime
      const endTime = hours === 'open' ? null : new Date(sessionStartTime.getTime() + (Number(hours) * 60 * 60 * 1000));
      
      // Create the order
      const order = await createOrder({
        room_id: room.id,
        customer_name: customerName.trim(),
        mode: selectedMode,
        order_type: orderType,
        total_amount: totalAmount,
        status: 'active',
        start_time: sessionStartTime.toISOString(),
        end_time: endTime ? endTime.toISOString() : null // null for open time
      });

      // Optimistically add to Redux so it appears immediately
      try {
        const { addOrderToState } = await import('@/store/slices/ordersSlice');
        const { store } = await import('@/store/store');
        store.dispatch(addOrderToState(order));
      } catch {}

      // Add room time as order item
      await createOrderItem({
        order_id: order.id!,
        item_type: 'room_time',
        item_name: `${room.name} - ${selectedMode} (${hours === 'open' ? 'Open Time' : `${hours}h`})`,
        quantity: 1,
        unit_price: calculateRoomCost(),
        total_price: calculateRoomCost(),
        is_paid: false // Mark as unpaid - payment happens when session stops
      });

      // Add cafe products as order items
      const hasCafeItems = Object.values(selectedProducts).some(qty => qty > 0);
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
              is_paid: false // Mark as unpaid - payment happens when session stops
            });
          }
        }
      }

      // Update order type to combo if cafe items were added
      if (hasCafeItems) {
        const { updateOrderInState, editOrder } = await import('@/store/slices/ordersSlice');
        const { store } = await import('@/store/store');
        // Optimistically update Redux state so UI reflects combo immediately
        store.dispatch(updateOrderInState({ id: order.id!, updates: { order_type: 'combo' } }));
        await store.dispatch(editOrder({ id: order.id!, updates: { order_type: 'combo' } }));
      }

      // Fetch fresh order items and hydrate into Redux for immediate UI
      try {
        const { getOrderItems } = await import('@/services/dbService');
        const { updateOrderItems } = await import('@/store/slices/ordersSlice');
        const { store } = await import('@/store/store');
        const freshItems = await getOrderItems(order.id!);
        store.dispatch(updateOrderItems({ orderId: order.id!, newItems: freshItems }));
      } catch {}

      // Update local room state
      onBook(room.id, customerName.trim(), hours === 'open' ? 0 : Number(hours), selectedMode, order.id!);
      
      // Use state manager for consistent updates
      const { StateManager } = await import('@/utils/stateManager');
      await StateManager.forceRefreshCriticalState();
      
      // Debug logging
      console.log('Order created:', order);
      console.log('Order ID:', order.id);
      console.log('Order status:', order.status);
      console.log('Order items count:', Object.keys(selectedProducts).length);
      
      toast({
        title: "Session Started",
        description: `Room session started for ${customerName} at ${sessionStartTime.toLocaleTimeString()} with order total of ${totalAmount.toFixed(2)} EGP`,
      });
      
      setCustomerName('');
      setHours(1);
      setSelectedMode('single');
      setSelectedProducts({});
      setShowCafeSection(false);
      setPaymentMethod('cash');
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GamepadIcon className="w-5 h-5" />
            Book {room.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge className={room.console_type === 'PS5' ? 'bg-blue-600' : 'bg-green-600'}>
              {room.console_type}
            </Badge>
            <Badge className="bg-green-600">
              Session starts: {new Date().toLocaleTimeString()}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerName" className="text-white">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white mb-3 block">Game Mode</Label>
              <RadioGroup 
                value={selectedMode} 
                onValueChange={(value: 'single' | 'multiplayer') => setSelectedMode(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" className="border-white text-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                  <Label htmlFor="single" className="text-white flex items-center gap-2 cursor-pointer">
                    <UserIcon className="w-4 h-4" />
                    Single Player
                    <span className="text-green-400">({room.pricing_single} EGP/hr)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiplayer" id="multiplayer" className="border-white text-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                  <Label htmlFor="multiplayer" className="text-white flex items-center gap-2 cursor-pointer">
                    <UsersIcon className="w-4 h-4" />
                    Multiplayer
                    <span className="text-green-400">({room.pricing_multiplayer} EGP/hr)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-white">Duration</Label>
              <Select value={hours.toString()} onValueChange={(value) => setHours(value === 'open' ? 'open' : parseFloat(value))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {timeOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value.toString()}
                      className="text-white hover:bg-slate-600"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'transfer') => setPaymentMethod(value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="cash" className="text-white">Cash</SelectItem>
                  <SelectItem value="card" className="text-white">Card</SelectItem>
                  <SelectItem value="transfer" className="text-white">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Add Cafe Section */}
            {!showCafeSection ? (
              <Button 
                type="button" 
                onClick={loadCafeProducts}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Café Items
              </Button>
            ) : (
              <div className="space-y-4 border-t border-slate-600 pt-4">
                <h4 className="text-white font-medium">Café Items</h4>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                  {cafeProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="text-white">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-300">{product.price} EGP</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleProductQuantityChange(product.id!, Math.max(0, (selectedProducts[product.id!] || 0) - 1))}
                        >
                          -
                        </Button>
                        <span className="text-white w-8 text-center">{selectedProducts[product.id!] || 0}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleProductQuantityChange(product.id!, (selectedProducts[product.id!] || 0) + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-700 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  Room Cost:
                </span>
                <span>
                  {hours === 'open' ? 'To be calculated' : `${calculateRoomCost().toFixed(2)} EGP`}
                </span>
              </div>
              {calculateCafeCost() > 0 && (
                <div className="flex items-center justify-between">
                  <span>Café Cost:</span>
                  <span>{calculateCafeCost().toFixed(2)} EGP</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-bold text-green-400 border-t border-slate-600 pt-2">
                <span className="flex items-center gap-2">
                  <DollarSignIcon className="w-4 h-4" />
                  Total:
                </span>
                <span>{calculateTotalCost().toFixed(2)} EGP</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700">
                {isLoading ? 'Starting...' : `Start Session at ${new Date().toLocaleTimeString()}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
