// src/components/cart/FloatingCartIcon.tsx
import React, { useState, useEffect } from "react";
import * as globalCartStore from "../../stores/cartStore"; // Adjust path to your global cart store
import { FiShoppingCart } from "react-icons/fi"; // Using react-icons
import "./FloatingCartIcon.css";

const FloatingCartIcon: React.FC = () => {
  const [totalItems, setTotalItems] = useState<number>(
    globalCartStore.getCartTotalItems()
  );

  useEffect(() => {
    // Subscribe to cart changes from the global store
    const handleCartUpdate = () => {
      setTotalItems(globalCartStore.getCartTotalItems());
    };

    const unsubscribe = globalCartStore.subscribe(handleCartUpdate);

    // Initial sync in case cart updated before subscription
    handleCartUpdate();

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []);

  const navigateToCartPage = () => {
    window.location.href = "/cart"; // Using standard browser navigation for Astro MPA
  };

  // Don't render if cart is empty and you prefer it hidden then
  // if (totalItems === 0) {
  //   return null;
  // }

  return (
    <button
      className="floating-cart-button"
      onClick={navigateToCartPage}
      aria-label={`View Cart, ${totalItems} item(s)`}
      title="View Cart"
    >
      <FiShoppingCart size={24} className="cart-icon" />
      {totalItems > 0 && (
        <span className="floating-cart-badge">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
};

export default FloatingCartIcon;
