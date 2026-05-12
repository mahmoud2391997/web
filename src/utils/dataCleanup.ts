import { 
  getOrders, 
  getRooms, 
  getTransactions, 
  updateOrder, 
  createOrderItem, 
  createTransaction 
} from '@/services/dbService';

export const cleanupOrphanOrders = async () => {
  try {
    const [orders, rooms] = await Promise.all([
      getOrders(),
      getRooms()
    ]);

    let fixedCount = 0;
    const roomIds = new Set(rooms.map(room => room.id));

    // Find and fix orphan orders
    for (const order of orders) {
      if (
        order.order_type === 'room_reservation' &&
        order.room_id &&
        !roomIds.has(order.room_id) &&
        order.status !== 'completed' &&
        order.status !== 'paid'
      ) {
        // Mark orphan order as completed so it can be paid
        await updateOrder(order.id!, { status: 'completed' });
        fixedCount++;
      }
    }

    return { fixedCount, totalOrders: orders.length };
  } catch (error) {
    console.error('Error cleaning up orphan orders:', error);
    return { fixedCount: 0, totalOrders: 0 };
  }
};

export const fixLegacyOrders = async () => {
  try {
    const orders = await getOrders();
    let fixedCount = 0;

    for (const order of orders) {
      // Fix orders that have total_amount but no order_items
      if (
        order.total_amount > 0 &&
        order.status === 'completed' &&
        (!order.order_items || order.order_items.length === 0)
      ) {
        // Create a generic order item for the total amount
        await createOrderItem({
          order_id: order.id!,
          item_type: 'room_time',
          item_name: `${order.order_type === 'room_reservation' ? 'Room Session' : 'Service'} - ${order.customer_name}`,
          quantity: 1,
          unit_price: order.total_amount,
          total_price: order.total_amount,
          is_paid: false
        });
        fixedCount++;
      }
    }

    return { fixedCount };
  } catch (error) {
    console.error('Error fixing legacy orders:', error);
    return { fixedCount: 0 };
  }
};

export const validateTransactionData = async () => {
  try {
    const transactions = await getTransactions();
    let validCount = 0;
    let invalidCount = 0;

    for (const transaction of transactions) {
      if (
        transaction &&
        transaction.id &&
        transaction.order_id &&
        typeof transaction.amount === 'number' &&
        transaction.transaction_type &&
        transaction.created_at
      ) {
        validCount++;
      } else {
        invalidCount++;
        console.warn('Invalid transaction found:', transaction);
      }
    }

    return { validCount, invalidCount, totalCount: transactions.length };
  } catch (error) {
    console.error('Error validating transaction data:', error);
    return { validCount: 0, invalidCount: 0, totalCount: 0 };
  }
};

export const runFullDataCleanup = async () => {
  console.log('Starting full data cleanup...');
  
  const results = {
    orphanOrders: await cleanupOrphanOrders(),
    legacyOrders: await fixLegacyOrders(),
    transactionValidation: await validateTransactionData()
  };

  console.log('Data cleanup completed:', results);
  return results;
};
