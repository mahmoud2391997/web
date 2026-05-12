import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getOrders, createOrder, updateOrder, deleteOrder, Order } from "@/services/dbService";

interface OrdersState {
  orders: any[];
  loading: boolean;
  error: string | null;
  filter: string | null;
}

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
  filter: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (status?: string) => {
    const orders = await getOrders(status);
    return orders;
  }
);

export const addOrder = createAsyncThunk(
  'orders/addOrder',
  async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    const newOrder = await createOrder(orderData);
    return newOrder;
  }
);

export const editOrder = createAsyncThunk(
  'orders/editOrder',
  async (params: { id: string; updates: Partial<Order> }) => {
    const { id, updates } = params;
    const updatedOrder = await updateOrder(id, updates);
    return updatedOrder;
  }
);

export const removeOrder = createAsyncThunk('orders/removeOrder', async (id: string) => {
  await deleteOrder(id);
  return id;
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Optimistically prepend a newly created order into state
    addOrderToState: (state, action) => {
      const newOrder = action.payload;
      // Avoid duplicates
      if (!state.orders.find(o => o.id === newOrder.id)) {
        state.orders.unshift(newOrder);
      }
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Optimistically update an order's fields in-place
    updateOrderInState: (state, action) => {
      const { id, updates } = action.payload as { id: string; updates: Partial<Order> };
      const index = state.orders.findIndex(order => order.id === id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...updates };
      }
    },
    // Add immediate order update action for real-time updates
    updateOrderItems: (state, action) => {
      const { orderId, newItems } = action.payload;
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].order_items = newItems;
      }
    },
    // Optimistically update a single order item field(s)
    updateOrderItemInState: (state, action) => {
      const { orderId, itemId, updates } = action.payload as { orderId: string; itemId: string; updates: any };
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1 && Array.isArray(state.orders[orderIndex].order_items)) {
        const items = state.orders[orderIndex].order_items as any[];
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex !== -1) {
          items[itemIndex] = { ...items[itemIndex], ...updates };
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      // Add order
      .addCase(addOrder.fulfilled, (state, action) => {
        state.orders.push(action.payload);
      })
      // Edit order
      .addCase(editOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      // Remove order
      .addCase(removeOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter(order => order.id !== action.payload);
      });
  },
});

export const { setFilter, clearError, updateOrderInState, updateOrderItems, updateOrderItemInState, addOrderToState } = ordersSlice.actions;
export default ordersSlice.reducer;
