// src/stores/cartStore.ts
import type { Addon, AddonCartItem } from '../types/addon.types'; // Adjust path

const CART_STORAGE_KEY = 'addonCart';
let cartItems: AddonCartItem[] = [];
const subscribers: Set<() => void> = new Set();

const loadCart = () => {
  if (typeof window !== 'undefined') {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    try {
      cartItems = storedCart ? JSON.parse(storedCart) : [];
    } catch (e) {
      console.error("Error parsing cart from localStorage:", e);
      cartItems = [];
    }
  }
};

const saveCart = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    subscribers.forEach(callback => callback());
  }
};

// Initialize cart on load
loadCart();

export const getCartItems = (): AddonCartItem[] => [...cartItems];

export const addToCart = (addon: Addon): void => {
  const existingItemIndex = cartItems.findIndex(item => item.id === addon.id);
  if (existingItemIndex > -1) {
    cartItems[existingItemIndex].quantity++;
  } else {
    cartItems.push({ ...addon, quantity: 1 });
  }
  saveCart();
};

export const updateQuantity = (addonId: string, quantity: number): void => {
  if (quantity <= 0) {
    cartItems = cartItems.filter(item => item.id !== addonId);
  } else {
    const itemIndex = cartItems.findIndex(item => item.id === addonId);
    if (itemIndex > -1) {
      cartItems[itemIndex].quantity = quantity;
    }
  }
  saveCart();
};

export const removeFromCart = (addonId: string): void => {
  cartItems = cartItems.filter(item => item.id !== addonId);
  saveCart();
};

export const getItemQuantity = (addonId: string): number => {
  const item = cartItems.find(item => item.id === addonId);
  return item ? item.quantity : 0;
};

export const getCartTotalItems = (): number => {
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};

export const getCartTotalPrice = (): number => {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const clearCart = (): void => {
    cartItems = [];
    saveCart();
}

export const subscribe = (callback: () => void): (() => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback); // Unsubscribe function
};