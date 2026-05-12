import { v4 as uuidv4 } from 'uuid';
import { indexedDB } from './indexedDbService';
import { dbLogger } from './logger';

// Initialize IndexedDB on first use
let dbInitialized = false;
let initPromise: Promise<any> | null = null;

const initDb = async () => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    console.warn('IndexedDB not available, using fallback mode');
    return indexedDB;
  }
  
  if (!dbInitialized && !initPromise) {
    initPromise = (async () => {
      try {
        await indexedDB.init();
        await indexedDB.initializeData();
        dbInitialized = true;
        console.log('IndexedDB initialized successfully');
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        throw error;
      }
    })();
  }
  
  if (initPromise) {
    await initPromise;
  }
  
  return indexedDB;
};

export interface Room {
  id: string;
  name: string;
  console_type: 'PS4' | 'PS5';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  current_mode?: 'single' | 'multiplayer';
  pricing_single: number;
  pricing_multiplayer: number;
  current_customer_name?: string;
  current_session_start?: string;
  current_session_end?: string;
  current_total_cost?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id?: string;
  room_id: string;
  customer_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_hours: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id?: string;
  room_id?: string;
  customer_name: string;
  mode: 'single' | 'multiplayer';
  start_time: string;
  end_time?: string;
  total_amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'paused' | 'paid';
  order_type?: 'room_reservation' | 'combo' | 'cafe_order';
  is_open_time?: boolean;
  duration_hours?: number;
  order_items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  item_type: 'room_time' | 'cafe_product' | 'room_time_completed';
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_paid?: boolean;
  created_at?: string;
}

export interface Transaction {
  id?: string;
  order_id: string;
  transaction_type: 'payment' | 'refund';
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  description?: string;
  created_at?: string;
}

export interface CafeProduct {
  id?: string;
  name: string;
  category: 'drinks' | 'snacks' | 'meals';
  price: number;
  stock: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Rooms CRUD Operations
export const getRooms = async (): Promise<Room[]> => {
  try {
    const database = await initDb();
    const result = await database.getAll('rooms');
    dbLogger.log('SELECT', 'rooms', null, result);
    return result;
  } catch (error) {
    dbLogger.log('SELECT', 'rooms', null, null, error);
    console.error('Error loading rooms:', error);
    // Return default rooms as fallback
    const fallback = [
      { id: 'room-1', name: 'Gaming Room 1', console_type: 'PS5', status: 'available', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-2', name: 'Gaming Room 2', console_type: 'PS4', status: 'available', pricing_single: 20.00, pricing_multiplayer: 30.00 },
      { id: 'room-3', name: 'Gaming Room 3', console_type: 'PS5', status: 'available', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-4', name: 'Gaming Room 4', console_type: 'PS4', status: 'available', pricing_single: 20.00, pricing_multiplayer: 30.00 }
    ];
    return fallback;
  }
};

export const createRoom = async (room: Omit<Room, 'created_at' | 'updated_at'>) => {
  try {
    const database = await initDb();
    const roomWithId = { ...room, id: room.id || uuidv4() };
    const result = await database.add('rooms', roomWithId);
    dbLogger.log('INSERT', 'rooms', roomWithId, result);
    return result;
  } catch (error) {
    dbLogger.log('INSERT', 'rooms', room, null, error);
    throw error;
  }
};

export const updateRoom = async (id: string, updates: Partial<Room>) => {
  try {
    const database = await initDb();
    const existing = await database.getById('rooms', id);
    if (!existing) throw new Error('Room not found');
    const updated = { ...existing, ...updates };
    const result = await database.update('rooms', updated);
    dbLogger.log('UPDATE', 'rooms', { id, updates }, result);
    return result;
  } catch (error) {
    dbLogger.log('UPDATE', 'rooms', { id, updates }, null, error);
    throw error;
  }
};

export const deleteRoom = async (id: string) => {
  try {
    const database = await initDb();
    await database.delete('rooms', id);
    dbLogger.log('DELETE', 'rooms', { id }, { deleted: true });
  } catch (error) {
    dbLogger.log('DELETE', 'rooms', { id }, null, error);
    throw error;
  }
};

// Appointments CRUD Operations
export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const database = await initDb();
    const appointmentWithId = { ...appointment, id: uuidv4() };
    const result = await database.add('appointments', appointmentWithId);
    dbLogger.log('INSERT', 'appointments', appointmentWithId, result);
    return result;
  } catch (error) {
    dbLogger.log('INSERT', 'appointments', appointment, null, error);
    throw error;
  }
};

export const getAppointments = async () => {
  try {
    const database = await initDb();
    const appointments = await database.getAll('appointments');
    
    // Add room details to each appointment
    for (const appointment of appointments) {
      const room = await database.getById('rooms', appointment.room_id);
      appointment.rooms = room;
    }
    
    const result = appointments.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
    dbLogger.log('SELECT', 'appointments', null, result);
    return result;
  } catch (error) {
    dbLogger.log('SELECT', 'appointments', null, null, error);
    throw error;
  }
};

export const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
  try {
    const database = await initDb();
    const existing = await database.getById('appointments', id);
    if (!existing) throw new Error('Appointment not found');
    const updated = { ...existing, ...updates };
    const result = await database.update('appointments', updated);
    dbLogger.log('UPDATE', 'appointments', { id, updates }, result);
    return result;
  } catch (error) {
    dbLogger.log('UPDATE', 'appointments', { id, updates }, null, error);
    throw error;
  }
};

export const deleteAppointment = async (id: string) => {
  try {
    const database = await initDb();
    await database.delete('appointments', id);
    dbLogger.log('DELETE', 'appointments', { id }, { deleted: true });
  } catch (error) {
    dbLogger.log('DELETE', 'appointments', { id }, null, error);
    throw error;
  }
};


// Orders CRUD Operations
export const createOrder = async (order: Omit<Order, 'id' | 'created_at'>) => {
  try {
    const database = await initDb();
    const orderWithId = {
      ...order,
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    const result = await database.add('orders', orderWithId);
    dbLogger.log('INSERT', 'orders', orderWithId, result);
    return result;
  } catch (error) {
    dbLogger.log('INSERT', 'orders', order, null, error);
    throw error;
  }
};

export const getOrders = async (status?: string) => {
  try {
    const database = await initDb();
    let orders = await database.getAll('orders');
    
    if (typeof status === 'string' && status.length > 0) {
      orders = orders.filter((order: any) => order.status === status);
    }
    
    // Get order items and rooms for each order
    for (const order of orders) {
      const orderItems = await database.getByIndex('order_items', 'order_id', order.id);
      const room = order.room_id ? await database.getById('rooms', order.room_id) : null;
      
      order.order_items = orderItems;
      order.rooms = room;
    }
    
    const result = orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    dbLogger.log('SELECT', 'orders', { status }, result);
    return result;
  } catch (error) {
    dbLogger.log('SELECT', 'orders', { status }, null, error);
    console.error('Error loading orders:', error);
    return [];
  }
};

export const getOrderById = async (id: string) => {
  const database = await initDb();
  const order = await database.getById('orders', id);
  
  if (!order) return null;
  
  const orderItems = await database.getByIndex('order_items', 'order_id', id);
  const room = order.room_id ? await database.getById('rooms', order.room_id) : null;
  
  order.order_items = orderItems;
  order.rooms = room;
  
  return order;
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
  const database = await initDb();
  const existing = await database.getById('orders', id);
  if (!existing) throw new Error('Order not found');
  const updated = { ...existing, ...updates };
  return await database.update('orders', updated);
};

export const deleteOrder = async (id: string) => {
  const database = await initDb();
  await database.delete('orders', id);
};

// Order Items CRUD Operations
export const createOrderItem = async (item: Omit<OrderItem, 'id' | 'created_at'>) => {
  const database = await initDb();
  const itemWithId = { ...item, id: uuidv4(), is_paid: item.is_paid || false };
  return await database.add('order_items', itemWithId);
};

export const getOrderItems = async (orderId: string) => {
  const database = await initDb();
  return await database.getByIndex('order_items', 'order_id', orderId);
};

export const updateOrderItem = async (id: string, updates: Partial<OrderItem>): Promise<OrderItem> => {
  const database = await initDb();
  const existing = await database.getById('order_items', id);
  if (!existing) throw new Error('Order item not found');
  const updated = { ...existing, ...updates };
  return await database.update('order_items', updated);
};

export const deleteOrderItem = async (id: string) => {
  const database = await initDb();
  await database.delete('order_items', id);
};

// Transactions CRUD Operations
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  const database = await initDb();
  const transactionWithId = { 
    ...transaction, 
    id: uuidv4(),
    created_at: new Date().toISOString()
  };
  return await database.add('transactions', transactionWithId);
};

export const getTransactions = async (startDate?: string, endDate?: string) => {
  try {
    const database = await initDb();
    let transactions = await database.getAll('transactions');
    
    if (startDate) {
      transactions = transactions.filter((t: any) => t.created_at >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter((t: any) => t.created_at <= endDate);
    }
    
    // Get order details for each transaction
    for (const transaction of transactions) {
      if (transaction.order_id) {
        const order = await database.getById('orders', transaction.order_id);
        if (order) {
          const orderItems = await database.getByIndex('order_items', 'order_id', order.id);
          order.order_items = orderItems;
        }
        transaction.orders = order;
      }
    }
    
    return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  const database = await initDb();
  const existing = await database.getById('transactions', id);
  if (!existing) throw new Error('Transaction not found');
  const updated = { ...existing, ...updates };
  return await database.update('transactions', updated);
};

export const deleteTransaction = async (id: string) => {
  const database = await initDb();
  await database.delete('transactions', id);
};

// Cafe Products CRUD Operations
export const getCafeProducts = async (): Promise<CafeProduct[]> => {
  try {
    const database = await initDb();
    const products = await database.getAll('cafe_products');
    return products.sort((a, b) => a.category.localeCompare(b.category));
  } catch (error) {
    console.error('Error loading cafe products:', error);
    // Return default products as fallback
    return [
      { id: 'prod-1', name: 'Coffee', category: 'drinks', price: 15.00, stock: 50, active: true },
      { id: 'prod-2', name: 'Pepsi', category: 'drinks', price: 10.00, stock: 30, active: true },
      { id: 'prod-3', name: 'Water', category: 'drinks', price: 5.00, stock: 100, active: true },
      { id: 'prod-4', name: 'Chips', category: 'snacks', price: 12.00, stock: 25, active: true },
      { id: 'prod-5', name: 'Burger', category: 'meals', price: 50.00, stock: 15, active: true }
    ];
  }
};

export const createCafeProduct = async (product: Omit<CafeProduct, 'id' | 'created_at' | 'updated_at'>) => {
  const database = await initDb();
  const productWithId = { ...product, id: uuidv4() };
  return await database.add('cafe_products', productWithId);
};

export const updateCafeProduct = async (id: string, updates: Partial<CafeProduct>) => {
  const database = await initDb();
  const existing = await database.getById('cafe_products', id);
  if (!existing) throw new Error('Product not found');
  const updated = { ...existing, ...updates };
  return await database.update('cafe_products', updated);
};

export const deleteCafeProduct = async (id: string) => {
  const database = await initDb();
  await database.delete('cafe_products', id);
};

// Reports
export const getReportData = async (period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly') => {
  const database = await initDb();
  const now = new Date();
  let startDate: string;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      break;
    case 'weekly':
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      startDate = weekStart.toISOString();
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
    case 'quarterly':
      const quarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      startDate = quarterStart.toISOString();
      break;
    case 'half-yearly':
      const halfYearStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      startDate = halfYearStart.toISOString();
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      break;
  }
  
  // Get all transactions and filter by date and type
  const allTransactions = await database.getAll('transactions');
  const transactions = allTransactions.filter((tx: any) => 
    tx && new Date(tx.created_at) >= new Date(startDate) && tx.transaction_type === 'payment'
  );
  
  // Get order details for each transaction
  for (const transaction of transactions) {
    if (transaction.order_id) {
      const order = await database.getById('orders', transaction.order_id);
      if (order) {
        const orderItems = await database.getByIndex('order_items', 'order_id', order.id);
        order.order_items = orderItems;
      }
      transaction.orders = order;
    }
  }
  
  return transactions;
};

// Process Cafe Cart - Create order with items and transaction
export const processCafeCart = async (
  customerName: string,
  cartItems: { id: string; name: string; price: number; quantity: number }[],
  paymentMethod: 'cash' | 'card' | 'transfer' = 'cash'
) => {
  try {
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order
    const order = await createOrder({
      customer_name: customerName,
      mode: 'single',
      start_time: new Date().toISOString(),
      total_amount: totalAmount,
      status: 'active'
    });

    // Create order items
    for (const item of cartItems) {
      await createOrderItem({
        order_id: order.id!,
        item_type: 'cafe_product',
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      });
    }

    // Create transaction
    await createTransaction({
      order_id: order.id!,
      transaction_type: 'payment',
      amount: totalAmount,
      payment_method: paymentMethod,
      description: `Cafe order for ${customerName}`
    });

    return order;
  } catch (error) {
    throw error;
  }
};

// User Profile Operations (simplified for PWA)
export const getUserProfile = async (userId: string) => {
  // Simplified user profile for PWA - return basic user info
  return {
    id: userId,
    role: userId.includes('admin') ? 'admin' : 'cashier',
    name: userId.includes('admin') ? 'Admin User' : 'Cashier User'
  };
};

export const updateUserProfile = async (userId: string, updates: { email?: string; role?: string }) => {
  // Simplified user profile update for PWA
  return {
    id: userId,
    ...updates
  };
};

// Check appointment conflicts
export const checkAppointmentConflicts = async (roomId: string, date: string, time: string, duration: number, excludeId?: string) => {
  try {
    const database = await initDb();
    const appointmentStart = new Date(`${date}T${time}`);
    const appointmentEnd = new Date(appointmentStart.getTime() + (duration * 60 * 60 * 1000));
    
    // Get all appointments for the room on the specified date
    const allAppointments = await database.getAll('appointments');
    const appointments = allAppointments.filter((appointment: any) => 
      appointment && 
      appointment.room_id === roomId && 
      appointment.appointment_date === date && 
      appointment.status !== 'cancelled' &&
      (!excludeId || appointment.id !== excludeId)
    );
    
    for (const appointment of appointments) {
      if (!appointment.appointment_time || !appointment.duration_hours) continue;
      
      const existingStart = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const existingEnd = new Date(existingStart.getTime() + (appointment.duration_hours * 60 * 60 * 1000));
      
      if (
        (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
        (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
        (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
      ) {
        return true; // Conflict found
      }
    }
    
    return false; // No conflicts
  } catch (error) {
    console.error('Error checking appointment conflicts:', error);
    return false; // Assume no conflicts on error
  }
};

// Add the missing createTransaction and addOrder functions that are being imported
export const addOrder = createOrder; // Alias for consistency with Redux actions

// Enhanced updateOrder function to handle the response format expected by Redux
export const updateOrderEnhanced = async (params: { id: string; updates: Partial<Order> }) => {
  const { id, updates } = params;
  const updatedOrder = await updateOrder(id, updates);
  return { payload: updatedOrder };
};

// Simple Authentication Operations
export const authenticateUser = async (password: string, role: 'admin' | 'cashier') => {
  try {
    // Different passwords for different roles
    const adminPassword = 'samsadmin';
    const cashierPassword = 'samscashier';
    
    const isValidPassword = (role === 'admin' && password === adminPassword) || 
                           (role === 'cashier' && password === cashierPassword);
    
    if (isValidPassword) {
      const result = {
        id: `${role}-${Date.now()}`,
        role: role,
        name: role === 'admin' ? 'Admin User' : 'Cashier User',
        active: true
      };
      dbLogger.log('AUTH', 'users', { role }, result);
      return result;
    }
    
    dbLogger.log('AUTH', 'users', { role }, null, new Error('Invalid credentials'));
    return null;
  } catch (error) {
    dbLogger.log('AUTH', 'users', { role }, null, error);
    throw error;
  }
};

// User management functions removed - using simple password authentication
