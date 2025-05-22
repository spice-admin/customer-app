// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
// Assuming globalCartStore is in ../stores/cartStore.ts
import * as globalCartStore from "../stores/cartStore";
import type { Addon, AddonCartItem } from "../types/addon.types"; // Adjust path if needed

// CartContextType remains the same - it defines the API of our context
interface CartContextType {
  cartItems: AddonCartItem[];
  addToCart: (addon: Addon) => void;
  updateQuantity: (addonId: string, quantity: number) => void;
  removeFromCart: (addonId: string) => void;
  getItemQuantity: (addonId: string) => number;
  getCartTotalItems: () => number;
  getCartTotalPrice: () => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// The CART_STORAGE_KEY is now primarily managed by globalCartStore.ts
// const CART_STORAGE_KEY = "addonCart"; // Not directly used by this provider anymore

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize state from the global store
  const [cartItems, setCartItems] = useState<AddonCartItem[]>(
    globalCartStore.getCartItems()
  );

  useEffect(() => {
    // This function will be called whenever the global store notifies its subscribers
    const handleCartUpdate = () => {
      console.log(
        "CartContext: Global cart store updated, syncing context state."
      );
      setCartItems(globalCartStore.getCartItems());
    };

    // Subscribe to changes in the global cart store
    const unsubscribe = globalCartStore.subscribe(handleCartUpdate);

    // Initial sync in case cart was updated between global store init and this component mounting
    // or if localStorage was updated by another tab (though localStorage events are more complex)
    handleCartUpdate();

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array: subscribe once on mount, unsubscribe on unmount

  // Context functions now delegate to the globalCartStore.
  // The globalCartStore will handle localStorage and notify all subscribers (including this provider).
  const addToCart = useCallback((addon: Addon) => {
    globalCartStore.addToCart(addon);
    // No need to call setCartItems here directly;
    // the subscription to globalCartStore will handle updating this provider's state.
  }, []);

  const updateQuantity = useCallback((addonId: string, quantity: number) => {
    globalCartStore.updateQuantity(addonId, quantity);
  }, []);

  const removeFromCart = useCallback((addonId: string) => {
    globalCartStore.removeFromCart(addonId);
  }, []);

  const clearCart = useCallback(() => {
    globalCartStore.clearCart();
  }, []);

  // Getter functions can still derive from the local 'cartItems' state,
  // which is kept in sync with the global store.
  // Or, for absolute latest, they could also call globalCartStore directly,
  // but using the state ensures consistency within this provider's render cycle.
  const getItemQuantity = useCallback(
    (addonId: string): number => {
      const item = cartItems.find((item) => item.id === addonId);
      return item ? item.quantity : 0;
    },
    [cartItems] // Depends on the synced cartItems state
  );

  const getCartTotalItems = useCallback((): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const getCartTotalPrice = useCallback((): number => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems, // This state is now synced with globalCartStore
        addToCart,
        updateQuantity,
        removeFromCart,
        getItemQuantity,
        getCartTotalItems,
        getCartTotalPrice,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    // This error is important and correctly indicates if <CartProvider> is missing as an ancestor.
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
