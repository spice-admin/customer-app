// src/types/customerApp.types.ts (or your existing shared types file for the customer app)

export interface Addon {
  id: string; // UUID
  name: string;
  price: number; // Supabase numeric typically comes as number in JS
  image_url: string | null;
  created_at: string; // Timestamp string
  updated_at: string; // Timestamp string
  // You can add any other fields from your addons table if needed for display
}

// You might also want a type for what a cart item for an addon looks like later
export interface AddonCartItem extends Addon {
  quantity: number;
}

export interface CustomerSubscriptionOrder {
  id: string; // order_id
  package_name: string | null;
  delivery_start_date: string | null; // YYYY-MM-DD
  delivery_end_date: string | null;   // YYYY-MM-DD
  // Add other fields from 'orders' table if needed for display, like user_full_name, etc.
  // For example:
  // user_full_name?: string | null; 
  // order_status?: string | null; // The payment status from the orders table
}

// Represents an entry from your 'delivery_schedule' table
export interface DeliveryScheduleEntry {
  event_date: string; // DATE string (YYYY-MM-DD)
  is_delivery_enabled: boolean;
  notes?: string | null;
  // updated_at and updated_by are not typically needed on the frontend for this logic
}