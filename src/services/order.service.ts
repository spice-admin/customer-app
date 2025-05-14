// src/services/order.service.ts
import { supabase } from '../lib/supabaseClient'; // Adjust path to your Supabase client
import type { IOrderFE, ApiResponse } from '../types';

export const getMyOrdersApi = async (): Promise<ApiResponse<IOrderFE[]>> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.warn("getMyOrdersApi: Error getting user from Supabase auth:", authError.message);
      return { success: false, message: "Authentication error. Please try again." };
    }

    if (!user) {
      console.warn("getMyOrdersApi: No authenticated user found.");
      return { success: false, message: "Please log in to view your orders." };
    }

    console.log(`[getMyOrdersApi] Fetching orders for user: ${user.id}`);

    // Select specific columns based on IOrderFE and your schema
    const { data, error: dbError } = await supabase
      .from('orders') // Your orders table name
      .select(`
        id,
        order_date,
        package_name,
        package_type,
        package_price,
        delivery_start_date,
        delivery_end_date,
        order_status,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        user_full_name,
        package_days
      `)
      .eq('user_id', user.id) // Filter by the logged-in user's ID
      .order('order_date', { ascending: false }); // Show newest orders first

    if (dbError) {
      console.error("[getMyOrdersApi] Supabase DB error fetching orders:", dbError.message);
      return { success: false, message: `Failed to fetch orders: ${dbError.message}` };
    }

    const ordersData = data || [];
    console.log(`[getMyOrdersApi] Successfully fetched ${ordersData.length} orders from Supabase.`);

    return { success: true, data: ordersData as IOrderFE[] };

  } catch (error: any) {
    console.error("[getMyOrdersApi] Unexpected error:", error.message);
    return {
      success: false,
      message: error.message || "An unexpected error occurred while fetching orders.",
    };
  }
};