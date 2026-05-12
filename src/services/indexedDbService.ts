import { v4 as uuidv4 } from 'uuid';

// IndexedDB wrapper for local database
class IndexedDBService {
  private dbName = 'Zone14GameCenter';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    // Check if IndexedDB is available
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available, using fallback');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('rooms')) {
          const roomsStore = db.createObjectStore('rooms', { keyPath: 'id' });
          roomsStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('room_id', 'room_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('order_items')) {
          const itemsStore = db.createObjectStore('order_items', { keyPath: 'id' });
          itemsStore.createIndex('order_id', 'order_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('transactions')) {
          const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionsStore.createIndex('order_id', 'order_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('cafe_products')) {
          const productsStore = db.createObjectStore('cafe_products', { keyPath: 'id' });
          productsStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('appointments')) {
          const appointmentsStore = db.createObjectStore('appointments', { keyPath: 'id' });
          appointmentsStore.createIndex('room_id', 'room_id', { unique: false });
        }
      };
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return [];
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getById(storeName: string, id: string): Promise<any> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return [];
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async add(storeName: string, data: any): Promise<any> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return { ...data, id: data.id || uuidv4() };
    }
    
    if (!this.db) await this.init();
    
    const item = {
      ...data,
      id: data.id || uuidv4(),
      created_at: data.created_at || new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(item);
    });
  }

  async update(storeName: string, data: any): Promise<any> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return data;
    }
    
    if (!this.db) await this.init();
    
    const item = {
      ...data,
      updated_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(item);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve();
    }
    
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async initializeData(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve();
    }
    
    const rooms = await this.getAll('rooms');
    if (rooms.length === 0) {
      const defaultRooms = [
        { id: 'room-1', name: 'Gaming Room 1', console_type: 'PS5', status: 'available', pricing_single: 25.00, pricing_multiplayer: 35.00 },
        { id: 'room-2', name: 'Gaming Room 2', console_type: 'PS4', status: 'available', pricing_single: 20.00, pricing_multiplayer: 30.00 },
        { id: 'room-3', name: 'Gaming Room 3', console_type: 'PS5', status: 'available', pricing_single: 25.00, pricing_multiplayer: 35.00 },
        { id: 'room-4', name: 'Gaming Room 4', console_type: 'PS4', status: 'available', pricing_single: 20.00, pricing_multiplayer: 30.00 }
      ];

      for (const room of defaultRooms) {
        await this.add('rooms', room);
      }
    }

    const products = await this.getAll('cafe_products');
    if (products.length === 0) {
      const defaultProducts = [
        { id: 'prod-1', name: 'Coffee', category: 'drinks', price: 15.00, stock: 50, active: true },
        { id: 'prod-2', name: 'Pepsi', category: 'drinks', price: 10.00, stock: 30, active: true },
        { id: 'prod-3', name: 'Water', category: 'drinks', price: 5.00, stock: 100, active: true },
        { id: 'prod-4', name: 'Chips', category: 'snacks', price: 12.00, stock: 25, active: true },
        { id: 'prod-5', name: 'Burger', category: 'meals', price: 50.00, stock: 15, active: true }
      ];

      for (const product of defaultProducts) {
        await this.add('cafe_products', product);
      }
    }
  }
}

export const indexedDB = new IndexedDBService();
