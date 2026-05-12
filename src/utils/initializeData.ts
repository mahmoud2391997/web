// Force initialize database with sample data
export const initializeSampleData = async () => {
  try {
    const { getRooms, getCafeProducts, createOrder, createOrderItem, createTransaction } = await import('@/services/dbService');
    
    // Check if data exists
    const [rooms, products] = await Promise.all([getRooms(), getCafeProducts()]);
    
    if (rooms.length === 0 || products.length === 0) {
      console.log('No data found, forcing database reset...');
      
      // Clear localStorage to force fresh initialization
      localStorage.removeItem('branchOutDB');
      
      // Force window.inMemoryDB to null
      if (typeof window !== 'undefined') {
        (window as any).inMemoryDB = null;
      }
      
      // Re-fetch to trigger initialization
      await Promise.all([getRooms(), getCafeProducts()]);
    }
    
    return { rooms: rooms.length, products: products.length };
  } catch (error) {
    console.error('Error initializing sample data:', error);
    return { rooms: 0, products: 0 };
  }
};
