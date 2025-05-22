// src/components/layout/CartMenuItem.tsx
import React, { useState, useEffect } from "react";
import * as globalCartStore from "../../stores/cartStore"; // Adjust path
import { FiShoppingCart } from "react-icons/fi";

const CartMenuItem: React.FC = () => {
  // State to hold total items, will be updated by subscription
  const [totalItems, setTotalItems] = useState<number>(
    globalCartStore.getCartTotalItems()
  );

  useEffect(() => {
    // Subscribe to cart changes
    const unsubscribe = globalCartStore.subscribe(() => {
      setTotalItems(globalCartStore.getCartTotalItems());
    });
    // Initial sync in case cart was updated before subscription
    setTotalItems(globalCartStore.getCartTotalItems());
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const navigateToCartPage = () => {
    window.location.href = "/cart";
  };

  return (
    <a
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        navigateToCartPage();
      }}
    >
      <i className="icon cart-icon-wrapper">
        <FiShoppingCart size={30} />
        {totalItems > 0 && (
          <span className="cart-item-count-badge">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </i>
      <span className="text"></span>
    </a>
  );
};
export default CartMenuItem;
