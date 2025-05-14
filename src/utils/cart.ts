// src/utils/cart.ts
import type { Addon, CartItem } from "../types"; // Ensure these types are updated as previously discussed

const CART_STORAGE_KEY = "addonCart"; // Using sessionStorage as per your code

/** Reads the current addon cart (as CartItem[]) from sessionStorage */
export const getCartItems = (): CartItem[] => {
  try {
    const storedCart = sessionStorage.getItem(CART_STORAGE_KEY);
    const parsed = storedCart ? JSON.parse(storedCart) : [];
    // Basic validation to ensure it's an array of objects with expected properties
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'addonId' in item)) {
        return parsed as CartItem[];
    }
    return [];
  } catch (error) {
    console.error("Error reading cart from sessionStorage:", error);
    return [];
  }
};

/** Saves the entire cart (CartItem[]) to sessionStorage and dispatches an update event */
const saveCartItems = (cartItems: CartItem[]): void => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    window.dispatchEvent(new CustomEvent('cartUpdated')); // Dispatch event for reactivity
    console.log("Cart saved and event dispatched:", cartItems);
  } catch (error) {
    console.error("Error saving cart to sessionStorage:", error);
  }
};

/**
 * Adds an addon to the cart or increments its quantity.
 * Expects an Addon object (or at least the parts of it needed for a CartItem).
 */
export const addOrIncrementAddon = (addonToAdd: Addon): void => {
  // addonToAdd comes from Supabase, so it will have .id and .image_url
  try {
    const currentCart = getCartItems();
    const existingItemIndex = currentCart.findIndex(
      (item) => item.addonId === addonToAdd.id // Compare with addonToAdd.id
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
  }
};

/** Decrements an item's quantity or removes it if quantity becomes 0 */
export const decrementItemQuantity = (addonId: string): void => {
  try {
    const currentCart = getCartItems();
    const existingItemIndex = currentCart.findIndex(
      (item) => item.addonId === addonId
    );

    if (existingItemIndex > -1) {
      let updatedCart: CartItem[];
      const currentItem = currentCart[existingItemIndex];

      if (currentItem.quantity > 1) {
        // Decrement quantity
        updatedCart = currentCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        // Remove item if quantity is 1 (or less, though shouldn't be less)
        updatedCart = currentCart.filter(
          (_, index) => index !== existingItemIndex
        );
      }
      saveCartItems(updatedCart);
    } else {
      console.warn(`Attempted to decrement non-existent item in cart: ${addonId}`);
    }
  } catch (error) {
    console.error("Error decrementing item quantity in cart:", error);
  }
};

/** Removes an item completely from the cart regardless of quantity */
export const removeItemFromCart = (addonId: string): void => {
  try {
    const currentCart = getCartItems();
    const updatedCart = currentCart.filter((item) => item.addonId !== addonId);
    saveCartItems(updatedCart);
  } catch (error) {
    console.error("Error removing addon from cart:", error);
  }
};

/** Clears the entire addon cart */
export const clearCart = (): void => {
  try {
    // sessionStorage.removeItem(CART_STORAGE_KEY); // This is also valid
    saveCartItems([]); // Saving an empty array also clears it and dispatches event
    console.log("Cart cleared.");
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
};

/** Calculates the total price of items in the cart (considering quantity) */
export const getCartTotal = (): number => {
  const currentCart = getCartItems();
  return currentCart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
};

/** Gets the number of UNIQUE items (lines) in the cart */
export const getCartUniqueItemCount = (): number => {
  const currentCart = getCartItems();
  return currentCart.length;
};

/** Gets the TOTAL quantity of all items (sum of quantities) in the cart */
export const getCartTotalQuantity = (): number => {
  const currentCart = getCartItems();
  return currentCart.reduce((total, item) => total + item.quantity, 0);
};