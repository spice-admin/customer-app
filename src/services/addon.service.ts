// src/services/addon.service.ts
import { supabase } from "../lib/supabaseClient"; // Your Supabase client
import type { Addon, CartItem } from "../types"; // Updated types

// --- START: Placeholder for cart utility functions ---
// These would typically interact with localStorage or a state management solution.
// You'll need to implement or ensure these are correctly defined elsewhere.
const CART_STORAGE_KEY = "myAppCart_addons";

export const getCartItems = (): CartItem[] => {
  try {
    const itemsJson = localStorage.getItem(CART_STORAGE_KEY);
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (error) {
    console.error("Error getting cart items from localStorage:", error);
    return [];
  }
};

export const saveCartItems = (cartItems: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    // Optionally, dispatch an event or update a global state to notify other parts of the app (e.g., cart icon)
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    console.error("Error saving cart items to localStorage:", error);
  }
};
// --- END: Placeholder for cart utility functions ---


/**
 * Fetches all addons from Supabase.
 * @returns Promise<Addon[]>
 */
export const getAllAddons = async (): Promise<Addon[]> => {
  try {
    const { data, error } = await supabase
      .from("addons")
      .select("*")
      .order("name", { ascending: true }); // Or by created_at, or price, etc.

    if (error) {
      console.error("Error fetching addons from Supabase:", error);
      throw error; // Re-throw the Supabase error
    }

    return data || []; // Return the data or an empty array if null
  } catch (error: any) {
    // Catch errors from the try block or re-thrown Supabase errors
    const message = error.message || "An unknown error occurred while fetching addons.";
    console.error("getAllAddons failed:", message);
    // Depending on how you want to handle this upstream, you might:
    // 1. Re-throw the error: throw new Error(message);
    // 2. Return an empty array and let the component handle the error display:
    return []; // And ensure the component checks for this or displays the error prop
  }
};

/**
 * Adds an addon to the cart or increments its quantity if it already exists.
 * This is a client-side utility that interacts with localStorage.
 * @param addonToAdd - The Addon object to add/increment.
 */
export const addOrIncrementAddon = (addonToAdd: Addon): void => {
  try {
    const currentCart = getCartItems();
    const existingItemIndex = currentCart.findIndex(
      (item) => item.addonId === addonToAdd.id // Use addonToAdd.id
    );

    let updatedCart: CartItem[];

    if (existingItemIndex > -1) {
      // Item exists, increment quantity
      updatedCart = currentCart.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      console.log(`${addonToAdd.name} quantity increased in cart.`);
    } else {
      // Item doesn't exist, add new CartItem with quantity 1
      const newCartItem: CartItem = {
        addonId: addonToAdd.id,       // Use addonToAdd.id
        name: addonToAdd.name,
        price: addonToAdd.price,
        image_url: addonToAdd.image_url, // Use addonToAdd.image_url
        quantity: 1,
      };
      updatedCart = [...currentCart, newCartItem];
      console.log(`${addonToAdd.name} added to cart.`);
    }
    saveCartItems(updatedCart);
  } catch (error) {
    console.error("Error adding/incrementing addon in cart:", error);
    // Optionally, show a user-facing error message here too
  }
};