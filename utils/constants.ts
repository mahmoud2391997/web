export const APP_CONFIG = {
  // Application settings
  APP_NAME: "Gaming Lounge Management",
  VERSION: "1.0.0",

  // Room settings
  DEFAULT_ROOM_PRICE: 5000, // per hour in currency units
  MAX_BOOKING_HOURS: 12,
  MIN_BOOKING_MINUTES: 30,

  // Order settings
  ORDER_STATUSES: {
    PENDING: "pending",
    ACTIVE: "active",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  },

  // Payment settings
  PAYMENT_METHODS: {
    CASH: "cash",
    CARD: "card",
    DIGITAL: "digital",
  },

  // Room types
  ROOM_TYPES: {
    SINGLE: "single",
    MULTI: "multi",
    VIP: "vip",
  },

  // Time settings
  BUSINESS_HOURS: {
    OPEN: "09:00",
    CLOSE: "23:00",
  },

  // Notification settings
  NOTIFICATION_DURATION: 5000,

  // Data refresh intervals
  REFRESH_INTERVALS: {
    ORDERS: 30000, // 30 seconds
    ROOMS: 60000, // 1 minute
    APPOINTMENTS: 120000, // 2 minutes
  },

  // Local storage keys
  STORAGE_KEYS: {
    ROOMS: "rooms",
    ORDERS: "orders",
    TRANSACTIONS: "transactions",
    APPOINTMENTS: "appointments",
    CAFE_PRODUCTS: "cafeProducts",
    SETTINGS: "settings",
    USER_PREFERENCES: "userPreferences",
  },
}
