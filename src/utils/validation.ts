import { z } from 'zod';

// Room validation schema
export const roomSchema = z.object({
  id: z.string().min(1, 'Room ID is required'),
  name: z.string().min(1, 'Room name is required'),
  console_type: z.enum(['PS4', 'PS5'], { required_error: 'Console type is required' }),
  status: z.enum(['available', 'occupied', 'cleaning', 'maintenance']).default('available'),
  pricing_single: z.number().min(0, 'Single player price must be positive'),
  pricing_multiplayer: z.number().min(0, 'Multiplayer price must be positive'),
});

// Appointment validation schema
export const appointmentSchema = z.object({
  room_id: z.string().min(1, 'Room is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time is required'),
  duration_hours: z.number().min(0.5, 'Duration must be at least 30 minutes').max(12, 'Duration cannot exceed 12 hours'),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).default('scheduled'),
});

// Order validation schema
export const orderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  order_type: z.enum(['room_reservation', 'cafe_order', 'combo']),
  room_id: z.string().optional(),
  total_amount: z.number().min(0, 'Total amount must be positive'),
  status: z.enum(['active', 'completed', 'cancelled', 'paused']).default('active'),
  mode: z.enum(['single', 'multiplayer']).optional(),
  is_open_time: z.boolean().optional(),
  duration_hours: z.number().min(0.5).max(24).optional(),
});

// Cafe product validation schema
export const cafeProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.enum(['drinks', 'snacks', 'meals']),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().min(0, 'Stock must be non-negative'),
  active: z.boolean().default(true),
});

// Transaction validation schema
export const transactionSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  transaction_type: z.enum(['payment', 'refund']),
  amount: z.number().min(0, 'Amount must be positive'),
  payment_method: z.enum(['cash', 'card', 'transfer']).default('cash'),
  description: z.string().optional(),
});

// Validation helper function
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
};
