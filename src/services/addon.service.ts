// src/services/addonService.ts
import { supabase } from '../lib/supabaseClient'; // Adjust path to your Supabase client
import type { Addon } from '../types/addon.types'; // Adjust path to your new addon types file

interface FetchAddonsParams {
  limit?: number; // Optional limit for the number of addons to fetch
  sortBy?: keyof Addon; // Optional field to sort by (e.g., 'created_at', 'name', 'price')
  ascending?: boolean; // Optional sort order (true for ascending, false for descending)
}

/**
 * Fetches addons from the Supabase 'addons' table.
 * @param params - Optional parameters for limiting and sorting.
 * @returns A promise that resolves to an array of Addon objects or throws an error.
 */
export const fetchAddons = async (params?: FetchAddonsParams): Promise<Addon[]> => {
  try {
    let query = supabase
      .from('addons')
      .select(`
        id,
        name,
        price,
        image_url,
        created_at,
        updated_at
      `);
      // Add other columns if your Addon type includes them and you need them

    // Apply sorting if provided
    if (params?.sortBy) {
      query = query.order(params.sortBy, { ascending: params.ascending === undefined ? true : params.ascending });
    } else {
      // Default sort: newest first, then by name
      query = query.order('created_at', { ascending: false }).order('name', { ascending: true });
    }

    // Apply limit if provided
    if (params?.limit && params.limit > 0) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching addons:', error);
      throw error; // Re-throw the error to be caught by the calling component
    }

    return (data as Addon[]) || []; // Ensure it returns an array, even if data is null

  } catch (error) {
    console.error('An unexpected error occurred in fetchAddons:', error);
    // Depending on your error handling strategy, you might re-throw,
    // or return an empty array / specific error object.
    // For now, re-throwing allows the component to handle it.
    throw error;
  }
};