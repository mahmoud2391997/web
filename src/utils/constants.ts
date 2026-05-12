// Application constants
export const APP_CONFIG = {
  name: 'SAM\'S PS Gaming Center',
  version: '1.0.0',
  description: 'Gaming Center Management System',
  author: 'SAM\'S PS Gaming Center',
  
  // Database settings
  database: {
    name: 'gaming_center.db',
    backupRetentionDays: 30,
  },
  
  // Business settings
  business: {
    openHours: {
      start: '09:00',
      end: '23:59'
    },
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    
    // Default pricing (can be overridden per room)
    defaultPricing: {
      ps5Single: 25.00,
      ps5Multiplayer: 35.00,
      ps4Single: 20.00,
      ps4Multiplayer: 30.00,
    },
    
    // Session settings
    minSessionDuration: 0.5, // 30 minutes
    maxSessionDuration: 12,   // 12 hours
    appointmentReminderMinutes: 15,
  },
  
  // UI settings
  ui: {
    refreshInterval: 30000, // 30 seconds
    toastDuration: 5000,    // 5 seconds
    autoSaveInterval: 60000, // 1 minute
  }
};

// Status options
export const ROOM_STATUSES = ['available', 'occupied', 'cleaning', 'maintenance'] as const;
export const ORDER_STATUSES = ['active', 'completed', 'cancelled', 'paused'] as const;
export const APPOINTMENT_STATUSES = ['scheduled', 'active', 'completed', 'cancelled'] as const;
export const PAYMENT_METHODS = ['cash', 'card', 'transfer'] as const;
export const CONSOLE_TYPES = ['PS4', 'PS5'] as const;
export const GAME_MODES = ['single', 'multiplayer'] as const;
export const CAFE_CATEGORIES = ['drinks', 'snacks', 'meals'] as const;

// Time slots for appointments
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

// Duration options
export const DURATION_OPTIONS = [
  { value: 0.5, label: '30 minutes' },
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
