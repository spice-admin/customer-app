// src/components/cart/CartView.tsx
import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import { useCart } from "../../context/CartContext";
import type { AddonCartItem } from "../../types/addon.types";
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiShoppingCart,
  FiArrowRight,
} from "react-icons/fi";
import {
  format,
  parseISO,
  isValid,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";

const navigateToHome = () => {
  window.location.href = "/home";
};

interface UserOrderSubscription {
  id: string;
  delivery_start_date: string | null;
  delivery_end_date: string | null;
}

const CartView: React.FC = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotalPrice,
    getCartTotalItems,
  } = useCart();

  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  const checkActiveSubscription = async (): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("User not authenticated for subscription check.");
      return false;
    }
    const today = startOfDay(new Date());
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, delivery_start_date, delivery_end_date")
        .eq("user_id", user.id)
        .lte("delivery_start_date", format(today, "yyyy-MM-dd"))
        .gte("delivery_end_date", format(today, "yyyy-MM-dd"));
      if (error) {
        console.error("Error fetching orders for subscription check:", error);
        return false;
      }
      if (orders && orders.length > 0) {
        for (const order of orders as UserOrderSubscription[]) {
          if (order.delivery_start_date && order.delivery_end_date) {
            const startDate = parseISO(order.delivery_start_date);
            const endDate = endOfDay(parseISO(order.delivery_end_date));
            if (
              isValid(startDate) &&
              isValid(endDate) &&
              isWithinInterval(today, { start: startDate, end: endDate })
            ) {
              return true;
            }
          }
        }
      }
      return false;
    } catch (e) {
      console.error("Exception during subscription check:", e);
      return false;
    }
  };

  const handleNavigateToCheckout = async () => {
    setIsCheckingSubscription(true);
    const hasActiveSubscription = await checkActiveSubscription();
    setIsCheckingSubscription(false);

    if (hasActiveSubscription) {
      console.log(
        "User has an active subscription. Navigating to select addon delivery date..."
      );
      // **** REPLACE THE ALERT WITH ACTUAL NAVIGATION ****
      window.location.href = "/order-selection"; // This is the URL for your order-selection.astro page (or whatever you named it)
      // **** END REPLACEMENT ****
    } else {
      alert(
        "You don't have an active meal package subscription. Addons can only be ordered with an active subscription."
      );
    }
  };

  // **** CORRECTED FUNCTION DEFINITION ****
  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    change: number
  ) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };
  // **** END CORRECTION ****

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-container">
        <FiShoppingCart size={64} className="empty-cart-icon" />
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any addons to your cart yet.</p>
        <button
          onClick={navigateToHome}
          className="button-primary button-outline"
        >
          Browse Addons
        </button>
      </div>
    );
  }

  return (
    <div className="cart-view-container">
      <h1 className="cart-title">
        Your Shopping Cart ({getCartTotalItems()} item
        {getCartTotalItems() > 1 ? "s" : ""})
      </h1>

      <div className="cart-items-list">
        {cartItems.map((item: AddonCartItem) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-image-container">
              <img
                src={
                  item.image_url ||
                  "https://via.placeholder.com/100?text=No+Image"
                }
                alt={item.name}
                className="cart-item-image"
              />
            </div>
            <div className="cart-item-main-info">
              {" "}
              {/* Groups name, price, and quantity controls */}
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-price">
                  ${item.price.toFixed(2)} CAD each
                </p>
              </div>
              <div className="cart-item-quantity-controls">
                <button
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity, -1)
                  }
                  className="quantity-adjust-button"
                >
                  <FiMinus />
                </button>
                <span className="cart-item-quantity">{item.quantity}</span>
                <button
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity, 1)
                  }
                  className="quantity-adjust-button"
                >
                  <FiPlus />
                </button>
              </div>
            </div>
            <div className="cart-item-actions-price">
              {" "}
              {/* Groups subtotal and remove button */}
              <div className="cart-item-subtotal">
                <p>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="cart-item-remove">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="remove-item-button"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <h2>Total:</h2>
          <h2>${getCartTotalPrice().toFixed(2)} CAD</h2>
        </div>
        <button
          onClick={handleNavigateToCheckout}
          className="button-primary button-checkout"
          disabled={isCheckingSubscription}
        >
          {isCheckingSubscription
            ? "Checking Subscription..."
            : "Proceed to Checkout"}
          {!isCheckingSubscription && (
            <FiArrowRight className="button-icon-right" />
          )}
        </button>
        <button
          onClick={navigateToHome}
          className="button-secondary button-continue-shopping"
          disabled={isCheckingSubscription}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default CartView;
