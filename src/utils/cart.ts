// src/utils/cart.ts
import type { Addon, CartItem } from "../types"; // Import both types

const CART_STORAGE_KEY = "addonCart";

/** Reads the current addon cart (as CartItem[]) from sessionStorage */
export const getCartItems = (): CartItem[] => {
  // Renamed function
  try {
    const storedCart = sessionStorage.getItem(CART_STORAGE_KEY);
    // Add basic validation to ensure it's an array
    const parsed = storedCart ? JSON.parse(storedCart) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading cart from sessionStorage:", error);
    return [];
  }
};

/** Saves the entire cart (CartItem[]) to sessionStorage */
const saveCartItems = (cartItems: CartItem[]): void => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error("Error saving cart to sessionStorage:", error);
  }
};

/** Adds an addon to the cart or increments its quantity */
export const addOrIncrementAddon = (addonToAdd: Addon): void => {
  try {
    const currentCart = getCartItems();
    const existingItemIndex = currentCart.findIndex(
      (item) => item.addonId === addonToAdd._id
    );

    let updatedCart: CartItem[];

    if (existingItemIndex > -1) {
      // Item exists, increment quantity
      updatedCart = currentCart.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      console.log(`${addonToAdd.name} quantity increased.`);
    } else {
      // Item doesn't exist, add new CartItem with quantity 1
      const newCartItem: CartItem = {
        addonId: addonToAdd._id,
        name: addonToAdd.name,
        price: addonToAdd.price,
        image: addonToAdd.image,
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
        // Remove item if quantity is 1
        updatedCart = currentCart.filter(
          (_, index) => index !== existingItemIndex
        );
      }
      saveCartItems(updatedCart);
    } else {
      console.warn(`Attempted to decrement non-existent item: ${addonId}`);
    }
  } catch (error) {
    console.error("Error decrementing item quantity:", error);
  }
};

/** Removes an item completely from the cart regardless of quantity */
export const removeItemFromCart = (addonId: string): void => {
  // Renamed for clarity
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
    sessionStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
};

/** Calculates the total price of items in the cart (considering quantity) */
export const getCartTotal = (): number => {
  const currentCart = getCartItems();
  // Multiply price by quantity for each item
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

/** Gets the TOTAL quantity of all items in the cart */
export const getCartTotalQuantity = (): number => {
  const currentCart = getCartItems();
  return currentCart.reduce((total, item) => total + item.quantity, 0);
};
