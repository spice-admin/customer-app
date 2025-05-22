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