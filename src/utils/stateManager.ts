import { store } from '@/store/store';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchAppointments } from '@/store/slices/appointmentsSlice';
import { fetchCafeProducts } from '@/store/slices/cafeProductsSlice';
import { fetchTransactions } from '@/store/slices/transactionsSlice';

/**
 * Global state management utility for ensuring UI consistency
 */
export class StateManager {
  private static refreshTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Refresh all application state with debouncing to prevent excessive API calls
   */
  static async refreshAllState(immediate = false) {
    const key = 'all';
    
    // Clear existing timeout
    if (this.refreshTimeouts.has(key)) {
      clearTimeout(this.refreshTimeouts.get(key)!);
    }

    const doRefresh = async () => {
      try {
        await Promise.all([
          store.dispatch(fetchRooms()),
          store.dispatch(fetchOrders()),
          store.dispatch(fetchAppointments()),
          store.dispatch(fetchCafeProducts()),
          store.dispatch(fetchTransactions())
        ]);
      } catch (error) {
        console.error('Error refreshing application state:', error);
      }
    };

    if (immediate) {
      await doRefresh();
    } else {
      // Debounce refresh calls
      const timeout = setTimeout(doRefresh, 100);
      this.refreshTimeouts.set(key, timeout);
    }
  }

  /**
   * Refresh orders state with multiple attempts for consistency
   */
  static async refreshOrders(immediate = false) {
    const key = 'orders';
    
    if (this.refreshTimeouts.has(key)) {
      clearTimeout(this.refreshTimeouts.get(key)!);
    }

    const doRefresh = async () => {
      try {
        // Multiple refresh attempts to ensure state consistency
        await store.dispatch(fetchOrders());
        setTimeout(() => store.dispatch(fetchOrders()), 100);
        setTimeout(() => store.dispatch(fetchOrders()), 300);
      } catch (error) {
        console.error('Error refreshing orders state:', error);
      }
    };

    if (immediate) {
      await doRefresh();
    } else {
      const timeout = setTimeout(doRefresh, 50);
      this.refreshTimeouts.set(key, timeout);
    }
  }

  /**
   * Refresh rooms state with immediate UI feedback
   */
  static async refreshRooms(immediate = false) {
    const key = 'rooms';
    
    if (this.refreshTimeouts.has(key)) {
      clearTimeout(this.refreshTimeouts.get(key)!);
    }

    const doRefresh = async () => {
      try {
        await store.dispatch(fetchRooms());
      } catch (error) {
        console.error('Error refreshing rooms state:', error);
      }
    };

    if (immediate) {
      await doRefresh();
    } else {
      const timeout = setTimeout(doRefresh, 50);
      this.refreshTimeouts.set(key, timeout);
    }
  }

  /**
   * Refresh appointments state
   */
  static async refreshAppointments(immediate = false) {
    const key = 'appointments';
    
    if (this.refreshTimeouts.has(key)) {
      clearTimeout(this.refreshTimeouts.get(key)!);
    }

    const doRefresh = async () => {
      try {
        await store.dispatch(fetchAppointments());
      } catch (error) {
        console.error('Error refreshing appointments state:', error);
      }
    };

    if (immediate) {
      await doRefresh();
    } else {
      const timeout = setTimeout(doRefresh, 50);
      this.refreshTimeouts.set(key, timeout);
    }
  }

  /**
   * Cleanup all pending refresh timeouts
   */
  static cleanup() {
    this.refreshTimeouts.forEach(timeout => clearTimeout(timeout));
    this.refreshTimeouts.clear();
  }

  /**
   * Force immediate refresh of critical state after important operations
   */
  static async forceRefreshCriticalState() {
    try {
      // Immediate refresh without debouncing for critical operations
      await Promise.all([
        store.dispatch(fetchRooms()),
        store.dispatch(fetchOrders())
      ]);
      
      // Follow up refreshes to ensure consistency
      setTimeout(async () => {
        await Promise.all([
          store.dispatch(fetchRooms()),
          store.dispatch(fetchOrders())
        ]);
      }, 100);
      
      setTimeout(async () => {
        await Promise.all([
          store.dispatch(fetchRooms()),
          store.dispatch(fetchOrders())
        ]);
      }, 300);
    } catch (error) {
      console.error('Error force refreshing critical state:', error);
    }
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    StateManager.cleanup();
  });
}
