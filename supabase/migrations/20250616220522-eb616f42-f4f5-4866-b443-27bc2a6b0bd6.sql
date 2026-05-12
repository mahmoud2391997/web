-- Create rooms table
CREATE TABLE public.rooms (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  console_type TEXT NOT NULL CHECK (console_type IN ('PS5', 'Xbox')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance')),
  current_mode TEXT CHECK (current_mode IN ('single', 'multiplayer')),
  pricing_single DECIMAL(10,2) NOT NULL,
  pricing_multiplayer DECIMAL(10,2) NOT NULL,
  current_customer_name TEXT,
  current_session_start TIMESTAMP WITH TIME ZONE,
  current_session_end TIMESTAMP WITH TIME ZONE,
  current_total_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial room data
INSERT INTO public.rooms (id, name, console_type, pricing_single, pricing_multiplayer) VALUES
('room-1', 'Gaming Room 1', 'PS5', 25.00, 35.00),
('room-2', 'Gaming Room 2', 'PS5', 25.00, 35.00),
('room-3', 'Gaming Room 3', 'Xbox', 20.00, 30.00),
('room-4', 'Gaming Room 4', 'PS5', 25.00, 35.00),
('room-5', 'Gaming Room 5', 'Xbox', 20.00, 30.00),
('room-6', 'Gaming Room 6', 'PS5', 25.00, 35.00),
('room-7', 'Gaming Room 7', 'Xbox', 20.00, 30.00),
('room-8', 'Gaming Room 8', 'PS5', 25.00, 35.00);

-- Add room_id foreign key constraint to appointments
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_room_id 
FOREIGN KEY (room_id) REFERENCES public.rooms(id);

-- Add room_id foreign key constraint to orders
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_room_id 
FOREIGN KEY (room_id) REFERENCES public.rooms(id);

-- Enable Row Level Security for rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for rooms
CREATE POLICY "Allow all operations on rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_rooms_console_type ON public.rooms(console_type);

-- Add trigger to update room status when orders are created/updated
CREATE OR REPLACE FUNCTION update_room_status_from_order()
RETURNS TRIGGER AS $$
BEGIN
  -- When an order is created or updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- If it's a room reservation and active, update room status
    IF NEW.order_type IN ('room_reservation', 'combo') AND NEW.room_id IS NOT NULL AND NEW.status = 'active' THEN
      UPDATE public.rooms 
      SET 
        status = 'occupied',
        current_customer_name = NEW.customer_name,
        current_session_start = NEW.start_time,
        current_session_end = NEW.end_time,
        current_total_cost = NEW.total_amount,
        updated_at = now()
      WHERE id = NEW.room_id;
    END IF;
    
    -- If order is completed or cancelled, make room available
    IF NEW.status IN ('completed', 'cancelled') AND NEW.room_id IS NOT NULL THEN
      UPDATE public.rooms 
      SET 
        status = 'available',
        current_customer_name = NULL,
        current_session_start = NULL,
        current_session_end = NULL,
        current_total_cost = 0,
        current_mode = NULL,
        updated_at = now()
      WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  -- When an order is deleted
  IF TG_OP = 'DELETE' THEN
    IF OLD.room_id IS NOT NULL THEN
      UPDATE public.rooms 
      SET 
        status = 'available',
        current_customer_name = NULL,
        current_session_start = NULL,
        current_session_end = NULL,
        current_total_cost = 0,
        current_mode = NULL,
        updated_at = now()
      WHERE id = OLD.room_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_update_room_status_from_order
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_from_order();
