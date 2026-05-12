import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchRooms, editRoom } from '@/store/slices/roomsSlice';
import { editOrder, fetchOrders } from '@/store/slices/ordersSlice';
import RoomCard from '@/components/RoomCard';
import BookingModal from '@/components/BookingModal';
import { Room } from "@/services/dbService";
import { useToast } from '@/hooks/use-toast';

const RoomsGrid = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rooms, loading, error } = useSelector((state: RootState) => state.rooms);
  const { orders } = useSelector((state: RootState) => state.orders);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchOrders({} as any));
  }, [dispatch]);

  const handleBookRoom = async (roomId: string, customerName: string, hours: number, mode: 'single' | 'multiplayer', orderId: string) => {
    try {
      const startTime = new Date();
      const endTime = hours > 0 ? new Date(startTime.getTime() + (hours * 60 * 60 * 1000)) : null;

      // Update room status to occupied
      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'occupied',
          current_customer_name: customerName,
          current_mode: mode,
          current_session_start: startTime.toISOString(),
          current_session_end: endTime ? endTime.toISOString() : null,
          current_total_cost: 0,
          current_order_id: orderId
        }
      }));
      
      // Refresh state to ensure UI updates
      await dispatch(fetchRooms());
      await dispatch(fetchOrders({} as any));
      
      setIsBookingModalOpen(false);
      setSelectedRoom(null);
      
      toast({
        title: "Session Started",
        description: `Room ${selectedRoom?.name} booked for ${customerName}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error booking room:', error);
      toast({
        title: "Error",
        description: "Failed to start room session",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleRoomClick = (room: Room) => {
    if (room.status === 'available') {
      setSelectedRoom(room);
      setIsBookingModalOpen(true);
    }
  };

  const handleModeChange = async (roomId: string, mode: 'single' | 'multiplayer') => {
    try {
      // Update the room mode in the database
      await dispatch(editRoom({
        id: roomId,
        updates: {
          current_mode: mode
        }
      }));
      
      // Refresh the rooms to get the updated data
      await dispatch(fetchRooms());
      
      toast({
        title: "Mode Changed",
        description: `Room mode set to ${mode}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error changing room mode:', error);
      toast({
        title: "Error",
        description: "Failed to change room mode",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleStartSession = async (roomId: string) => {
    try {
      // Find the paused order for this room
      const pausedOrder = orders.find(order => 
        order.room_id === roomId && 
        order.status === 'paused'
      );

      if (!pausedOrder) {
        toast({
          title: "Error",
          description: "No paused session found for this room",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      const startTime = new Date().toISOString();
      const formattedStartTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Update room to occupied
      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'occupied',
          current_customer_name: pausedOrder.customer_name,
          current_mode: pausedOrder.mode || 'single',
          current_session_start: startTime,
          current_session_end: null, // Will be set based on session type
          current_total_cost: pausedOrder.total_amount
        }
      }));

      // Update order to active and record start time
      await dispatch(editOrder({
        id: pausedOrder.id,
        updates: {
          status: 'active',
          start_time: startTime
        }
      }));

      toast({
        title: "Session Started",
        description: `Room ${room.name} session resumed for ${pausedOrder.customer_name}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleEndSession = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.current_session_start) {
        console.error('Room or session start time not found');
        return;
      }

      const endTime = new Date();
      const formattedEndTime = endTime.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const startTime = new Date(room.current_session_start);
      const elapsedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      // Calculate cost based on actual elapsed time
      const hourlyRate = room.current_mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
      const roomCost = elapsedHours * hourlyRate;

      // Find the active order for this room
      const activeOrder = orders.find(order => 
        order.room_id === roomId && 
        order.status === 'active' && 
        order.customer_name === room.current_customer_name
      );

      // Calculate total cost including all order items (room time + cafe items)
      let totalCost = roomCost;
      
      if (activeOrder && activeOrder.order_items && activeOrder.order_items.length > 0) {
        // Calculate from existing order items
        totalCost = activeOrder.order_items.reduce((sum: number, item: any) => {
          if (item.item_type === 'room_time') {
            // For room time, calculate based on actual duration passed
            return sum + roomCost;
          } else {
            // For cafe items, use the existing total_price
            return sum + (item.total_price || 0);
          }
        }, 0);
      }

      // Optimistic room update for immediate UI feedback
      const { updateRoomInState } = await import('@/store/slices/roomsSlice');
      dispatch(updateRoomInState({
        id: roomId,
        updates: {
          status: 'available',
          current_customer_name: null,
          current_mode: null,
          current_session_start: null,
          current_session_end: null,
          current_total_cost: totalCost
        }
      }));

      // Update room status to available
      await dispatch(editRoom({
        id: roomId,
        updates: {
          status: 'available',
          current_customer_name: null,
          current_mode: null,
          current_session_start: null,
          current_session_end: null,
          current_total_cost: totalCost
        }
      }));

      // Update order status to 'paused' and record end time and calculated cost
      if (activeOrder) {
        // Optimistic order update
        const { updateOrderInState } = await import('@/store/slices/ordersSlice');
        dispatch(updateOrderInState({
          id: activeOrder.id,
          updates: {
            status: 'paused',
            total_amount: totalCost,
            end_time: formattedEndTime
          }
        }));

        await dispatch(editOrder({
          id: activeOrder.id,
          updates: {
            status: 'paused',
            total_amount: totalCost,
            end_time: formattedEndTime
          }
        }));

        // Create a separate order item for the completed time period
        if (activeOrder.order_items) {
          const { createOrderItem } = await import("@/services/dbService");
          
          // Create a new order item for the completed time period
          await createOrderItem({
            order_id: activeOrder.id,
            item_type: 'room_time_completed',
            item_name: `${room.name} - ${room.current_mode} (Completed: ${elapsedHours.toFixed(2)}h)`,
            quantity: elapsedHours,
            unit_price: hourlyRate,
            total_price: roomCost
          });

          // Update or create the remaining time order item
          const roomTimeItem = activeOrder.order_items.find((item: any) => item.item_type === 'room_time');
          if (roomTimeItem) {
            const { updateOrderItem } = await import("@/services/dbService");
            // Update the original item to represent remaining time (if any)
            const originalDuration = roomTimeItem.quantity || 0;
            const remainingTime = Math.max(0, originalDuration - elapsedHours);
            
            if (remainingTime > 0) {
              await updateOrderItem(roomTimeItem.id, {
                item_name: `${room.name} - ${room.current_mode} (Remaining: ${remainingTime.toFixed(2)}h)`,
                quantity: remainingTime,
                total_price: remainingTime * hourlyRate
              });
            } else {
              // If no time remaining, mark as completed
              await updateOrderItem(roomTimeItem.id, {
                item_name: `${room.name} - ${room.current_mode} (Completed)`,
                quantity: 0,
                total_price: 0
              });
            }
          }

          // Update Redux with fresh order items
          const { getOrderItems } = await import("@/services/dbService");
          const { updateOrderItems } = await import('@/store/slices/ordersSlice');
          const freshItems = await getOrderItems(activeOrder.id);
          dispatch(updateOrderItems({ orderId: activeOrder.id, newItems: freshItems }));
        }
      }

      console.log(`Session paused. Duration: ${elapsedHours.toFixed(2)} hours, Room Cost: ${roomCost.toFixed(2)} EGP, Total Cost: ${totalCost.toFixed(2)} EGP`);
      
      // Use state manager for consistent updates
      const { StateManager } = await import('@/utils/stateManager');
      await StateManager.forceRefreshCriticalState();
      
      toast({
        title: "Session Paused",
        description: `Session moved to Current Orders. Elapsed time: ${elapsedHours.toFixed(2)} hours, Total: ${totalCost.toFixed(2)} EGP`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleAdjustTime = async (roomId: string, adjustment: number) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.current_session_end) {
        console.error('Room or session end time not found');
        return;
      }

      const currentEndTime = new Date(room.current_session_end);
      const newEndTime = new Date(currentEndTime.getTime() + (adjustment * 60 * 60 * 1000));

      // Find the active order for this room
      const activeOrder = orders.find(order => 
        order.room_id === roomId && 
        (order.status === 'active' || order.status === 'paid') && 
        order.customer_name === room.current_customer_name
      );

      // Optimistic update for immediate UI feedback
      const { updateRoomInState } = await import('@/store/slices/roomsSlice');
      dispatch(updateRoomInState({
        id: roomId,
        updates: {
          current_session_end: newEndTime.toISOString()
        }
      }));

      // Update room end time while preserving all other room details
      await dispatch(editRoom({
        id: roomId,
        updates: {
          current_session_end: newEndTime.toISOString(),
          // Preserve existing room state
          status: room.status,
          current_customer_name: room.current_customer_name,
          current_mode: room.current_mode,
          current_session_start: room.current_session_start
        }
      }));

      // If there's an order (active or paid), update the room time item
      if (activeOrder && activeOrder.order_items) {
        const roomTimeItem = activeOrder.order_items.find((item: any) => 
          item.item_type === 'room_time' || item.item_type === 'room_time_completed'
        );

        if (roomTimeItem) {
          const hourlyRate = room.current_mode === 'single' ? room.pricing_single : room.pricing_multiplayer;
          const startTime = new Date(room.current_session_start || new Date());
          const newDuration = (newEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          const newCost = newDuration * hourlyRate;

          // Update the order item
          const { updateOrderItem } = await import("@/services/dbService");
          await updateOrderItem(roomTimeItem.id, {
            item_name: `${room.name} - ${room.current_mode} (${newDuration.toFixed(2)}h)`,
            quantity: newDuration,
            total_price: newCost
          });

          // Update the order's total amount
          const otherItemsTotal = activeOrder.order_items
            .filter((item: any) => item.id !== roomTimeItem.id)
            .reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

          await dispatch(editOrder({
            id: activeOrder.id,
            updates: {
              total_amount: otherItemsTotal + newCost
            }
          }));

          // If this is a paid order, update related transaction
          if (activeOrder.status === 'paid') {
            try {
              const { getTransactions, updateTransaction } = await import('@/services/dbService');
              const transactions = await getTransactions();
              const validTransactions = Array.isArray(transactions) ? transactions : [];
              const orderTransaction = validTransactions.find((tx: any) => 
                tx && tx.order_id === activeOrder.id && tx.transaction_type === 'payment'
              );
              
              if (orderTransaction) {
                const newTotal = otherItemsTotal + newCost;
                await updateTransaction(orderTransaction.id, {
                  amount: newTotal,
                  description: `Updated payment for order ${activeOrder.id} - Time adjusted - Total: ${newTotal.toFixed(2)} EGP`
                });
                
                // Refresh transactions in Redux
                const { fetchTransactions } = await import('@/store/slices/transactionsSlice');
                dispatch(fetchTransactions({} as any));
              }
            } catch (transactionError) {
              console.warn('Could not update related transaction:', transactionError);
            }
          }

          // Use state manager for consistent updates
          const { StateManager } = await import('@/utils/stateManager');
          await StateManager.refreshOrders(true);
        }
      }

      toast({
        title: adjustment > 0 ? "Time Added" : "Time Reduced",
        description: `${Math.abs(adjustment * 60)} minutes ${adjustment > 0 ? 'added to' : 'removed from'} session`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adjusting time:', error);
      toast({
        title: "Error",
        description: "Failed to adjust session time",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-lg">Loading rooms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-400 text-lg">Error loading rooms: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => {
          // Check if there's a paused order for this room
          const pausedOrder = orders.find(order => 
            order.room_id === room.id && 
            order.status === 'paused'
          );

          // Check if there's an active order for this room
          const activeOrder = orders.find(order => 
            order.room_id === room.id && 
            order.status === 'active'
          );

          return (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => handleRoomClick(room)}
              onEndSession={() => handleEndSession(room.id)}
              onAdjustTime={handleAdjustTime}
              onStartSession={pausedOrder ? () => handleStartSession(room.id) : undefined}
              showStartButton={!!pausedOrder && room.status === 'available'}
              currentOrder={activeOrder || null}
              onOrderUpdated={async () => {
                // Use state manager for consistent updates
                const { StateManager } = await import('@/utils/stateManager');
                await StateManager.refreshOrders();
              }}
              onModeChange={handleModeChange}
            />
          );
        })}
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onBook={handleBookRoom}
      />
    </>
  );
};

export default RoomsGrid;
