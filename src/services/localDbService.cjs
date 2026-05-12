// This file should only be used in the main process
// For renderer process, use the IPC-based database service

let db = null;
let dbPath = null;

// Initialize database connection (main process only)
const initializeDatabaseConnection = async () => {
  if (typeof window !== 'undefined') {
    throw new Error('Database service should only be used in the main process');
  }
  
  const knex = require('knex');
  const path = require('path');
  const fs = require('fs');
  
  // Check if we're in Electron context
  let userDataPath;
  try {
    const { app } = require('electron');
    userDataPath = app.getPath('userData');
  } catch (error) {
    // Fallback for testing or non-Electron context
    userDataPath = path.join(process.cwd(), 'data');
  }
  
  dbPath = path.join(userDataPath, 'database.sqlite');

  console.log('Database will be created at:', dbPath);

  // Ensure the user data directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  db = knex({
    client: 'sqlite3',
    connection: {
      filename: dbPath,
    },
    useNullAsDefault: true,
    acquireConnectionTimeout: 60000,
    pool: {
      min: 1,
      max: 1,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    },
  });
  
  return db;
};

// Get database instance
const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabaseConnection first.');
  }
  return db;
};

const initializeDatabase = async () => {
  try {
    if (!db) {
      await initializeDatabaseConnection();
    }
    
    console.log('Initializing database at:', dbPath);
    
    // Ensure database file exists
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      console.log('Creating new database file...');
    }
    
    // Test database connection
    await db.raw('SELECT 1');
    console.log('Database connection established');
    
    // Create tables with proper error handling
    await createTables();
    console.log('Database tables created/verified');
    
    // Seed initial data
    await seedInitialData();
    console.log('Initial data seeded');
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

const createTables = async () => {
  console.log('Creating/verifying database tables...');
  
  // Rooms Table
  const roomsExists = await db.schema.hasTable('rooms');
  if (!roomsExists) {
    await db.schema.createTable('rooms', (table) => {
      table.text('id').notNullable().primary();
      table.text('name').notNullable();
      table.text('console_type').notNullable();
      table.text('status').notNullable().defaultTo('available');
      table.text('current_mode');
      table.decimal('pricing_single', 10, 2).notNullable();
      table.decimal('pricing_multiplayer', 10, 2).notNullable();
      table.text('current_customer_name');
      table.timestamp('current_session_start');
      table.timestamp('current_session_end');
      table.decimal('current_total_cost', 10, 2).defaultTo(0);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('Rooms table created');
  }

  // Appointments Table
  const appointmentsExists = await db.schema.hasTable('appointments');
  if (!appointmentsExists) {
    await db.schema.createTable('appointments', (table) => {
      table.text('id').notNullable().primary();
      table.text('room_id').notNullable();
      table.text('customer_name').notNullable();
      table.date('appointment_date').notNullable();
      table.time('appointment_time').notNullable();
      table.decimal('duration_hours', 3, 1).notNullable();
      table.text('status').notNullable().defaultTo('scheduled');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.foreign('room_id').references('rooms.id');
    });
    console.log('Appointments table created');
  }

  // Orders Table
  const ordersExists = await db.schema.hasTable('orders');
  if (!ordersExists) {
    await db.schema.createTable('orders', (table) => {
      table.text('id').notNullable().primary();
      table.text('room_id');
      table.text('customer_name').notNullable();
      table.text('order_type').notNullable();
      table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
      table.text('status').notNullable().defaultTo('active');
      table.text('start_time');
      table.text('end_time');
      table.text('mode');
      table.boolean('is_open_time').defaultTo(false);
      table.decimal('duration_hours', 3, 1);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
      table.foreign('room_id').references('rooms.id');
    });
    console.log('Orders table created');
  }

  // Order Items Table
  const orderItemsExists = await db.schema.hasTable('order_items');
  if (!orderItemsExists) {
    await db.schema.createTable('order_items', (table) => {
      table.text('id').notNullable().primary();
      table.text('order_id').notNullable();
      table.text('item_type').notNullable();
      table.text('item_name').notNullable();
      table.integer('quantity').notNullable().defaultTo(1);
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.boolean('is_paid').notNullable().defaultTo(false);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.foreign('order_id').references('orders.id').onDelete('CASCADE');
    });
    console.log('Order items table created');
  } else {
    // Check if is_paid column exists, add it if missing
    const hasIsPaidColumn = await db.schema.hasColumn('order_items', 'is_paid');
    if (!hasIsPaidColumn) {
      await db.schema.alterTable('order_items', (table) => {
        table.boolean('is_paid').notNullable().defaultTo(false);
      });
      console.log('Added is_paid column to order_items table');
    }
  }

  // Transactions Table
  const transactionsExists = await db.schema.hasTable('transactions');
  if (!transactionsExists) {
    await db.schema.createTable('transactions', (table) => {
      table.text('id').notNullable().primary();
      table.text('order_id').notNullable();
      table.text('transaction_type').notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.text('payment_method').notNullable().defaultTo('cash');
      table.text('description');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.foreign('order_id').references('orders.id').onDelete('CASCADE');
    });
    console.log('Transactions table created');
  }

  // Cafe Products Table
  const cafeProductsExists = await db.schema.hasTable('cafe_products');
  if (!cafeProductsExists) {
    await db.schema.createTable('cafe_products', (table) => {
      table.text('id').notNullable().primary();
      table.text('name').notNullable();
      table.text('category').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.integer('stock').notNullable().defaultTo(0);
      table.boolean('active').notNullable().defaultTo(true);
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    console.log('Cafe products table created');
  }

  // Users table removed - using simple password authentication

  // Create indexes for better performance (only if they don't exist)
  try {
    await db.raw(`
      CREATE INDEX IF NOT EXISTS idx_appointments_room_date ON appointments(room_id, appointment_date);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
      CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
    `);
    console.log('Database indexes created/verified');
  } catch (error) {
    console.warn('Some indexes may already exist:', error.message);
  }
};

const seedInitialData = async () => {
  // Seed initial rooms
  const roomsCount = await db('rooms').count('id as count');
  if (roomsCount[0].count === 0) {
    await db('rooms').insert([
      { id: 'room-1', name: 'Gaming Room 1', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-2', name: 'Gaming Room 2', console_type: 'PS4', pricing_single: 20.00, pricing_multiplayer: 30.00 },
      { id: 'room-3', name: 'Gaming Room 3', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-4', name: 'Gaming Room 4', console_type: 'PS4', pricing_single: 20.00, pricing_multiplayer: 30.00 },
      { id: 'room-5', name: 'Gaming Room 5', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-6', name: 'Gaming Room 6', console_type: 'PS4', pricing_single: 20.00, pricing_multiplayer: 30.00 },
      { id: 'room-7', name: 'Gaming Room 7', console_type: 'PS5', pricing_single: 25.00, pricing_multiplayer: 35.00 },
      { id: 'room-8', name: 'Gaming Room 8', console_type: 'PS4', pricing_single: 20.00, pricing_multiplayer: 30.00 },
    ]);
  }

  // No user seeding - using simple password authentication

  // Seed initial cafe products
  const productsCount = await db('cafe_products').count('id as count');
  if (productsCount[0].count === 0) {
    await db('cafe_products').insert([
      { id: 'prod-1', name: 'Coffee', category: 'drinks', price: 15.00, stock: 50 },
      { id: 'prod-2', name: 'Pepsi', category: 'drinks', price: 10.00, stock: 30 },
      { id: 'prod-3', name: 'Water', category: 'drinks', price: 5.00, stock: 100 },
      { id: 'prod-4', name: 'Chips', category: 'snacks', price: 12.00, stock: 25 },
      { id: 'prod-5', name: 'Chocolate', category: 'snacks', price: 20.00, stock: 40 },
      { id: 'prod-6', name: 'Burger', category: 'meals', price: 50.00, stock: 15 },
      { id: 'prod-7', name: 'Pizza Slice', category: 'meals', price: 35.00, stock: 20 },
    ]);
  }
};

// Graceful shutdown
const closeDatabase = async () => {
  try {
    await db.destroy();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database:', error);
  }
};

// User authentication functions removed - using simple password authentication

// Export functions
module.exports = {
  initializeDatabaseConnection,
  getDb,
  initializeDatabase,
  closeDatabase
};
