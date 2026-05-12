export interface Order {
  id: string;
  customer_name: string;
  order_type: 'room_reservation' | 'cafe_order' | 'combo';
  room_id?: string;
  total_amount: number;
  status: 'active' | 'completed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
  mode?: 'single' | 'multiplayer';
  is_open_time?: boolean;
  duration_hours?: number | null;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: 'room_time' | 'cafe_product';
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  console_type: string;
  pricing_single: number;
  pricing_multiplayer: number;
  status: 'available' | 'occupied' | 'maintenance';
  current_customer_name?: string;
  current_session_start?: string;
  current_session_end?: string;
  current_mode?: 'single' | 'multiplayer';
  current_total_cost?: number;
  created_at: string;
  updated_at: string;
}

export interface CafeProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}
