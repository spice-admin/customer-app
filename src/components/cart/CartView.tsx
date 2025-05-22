// src/components/cart/CartView.tsx
import React from "react";
import { useCart } from "../../context/CartContext"; // Adjust path if needed
import type { AddonCartItem } from "../../types/addon.types"; // Adjust path
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiShoppingCart,
  FiArrowRight,
} from "react-icons/fi"; // Example icons

// Placeholder navigation function (replace with your app's actual navigation)
const navigateToHome = () => {
  window.location.href = "/home"; // Navigate to home page or addons page
};

const navigateToCheckout = () => {
  alert(
    "Proceed to Checkout - Placeholder: Navigation to checkout page to be implemented!"
  );
  // window.location.href = '/checkout'; // Example future path
};

const CartView: React.FC = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotalPrice,
    getCartTotalItems,
  } = useCart();

  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    change: number
  ) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      removeFromCart(itemId); // Remove if quantity drops to 0 or less
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

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
            <div className="cart-item-info-wrapper">
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-price">${item.price.toFixed(2)}</p>
              </div>
              <div className="cart-item-quantity-and-subtotal">
                <div className="cart-item-quantity-controls">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity, -1)
                    }
                    className="quantity-adjust-button"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <FiMinus />
                  </button>
                  <span className="cart-item-quantity">{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity, 1)
                    }
                    className="quantity-adjust-button"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              <div className="cart-item-subtotal">
                <p>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
            <div className="cart-item-remove">
              <button
                onClick={() => removeFromCart(item.id)}
                className="remove-item-button"
                title={`Remove ${item.name} from cart`}
                aria-label={`Remove ${item.name} from cart`}
              >
                <FiTrash2 />
              </button>
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
          onClick={navigateToCheckout}
          className="button-primary button-checkout"
        >
          Proceed to Checkout <FiArrowRight className="button-icon-right" />
        </button>
        <button
          onClick={navigateToHome}
          className="button-secondary button-continue-shopping"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default CartView;
