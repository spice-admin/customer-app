// src/components/checkout/CheckoutDisplay.tsx
import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
// --- MODIFIED: Import updated/new cart functions ---
import {
  getCartItems,
  getCartTotal,
  addOrIncrementAddon, // For '+' button
  decrementItemQuantity, // For '-' button
  removeItemFromCart, // For 'Remove' button
} from "../../utils/cart";
import type { Addon, CartItem } from "../../types"; // Import CartItem
import { formatCurrencyCAD } from "../../utils/currency";

const CheckoutDisplay: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  // const [uniqueItemCount, setUniqueItemCount] = useState<number>(0); // If needed

  // --- Function to refresh state from sessionStorage ---
  const refreshCartState = useCallback(() => {
    const items = getCartItems();
    const calculatedTotal = getCartTotal();
    // const count = getCartUniqueItemCount();
    setCartItems(items);
    setTotal(calculatedTotal);
    // setUniqueItemCount(count);
    console.log("Cart state refreshed");
  }, []);

  // Load cart on initial mount
  useEffect(() => {
    refreshCartState();
  }, [refreshCartState]); // Include refreshCartState in dependencies

  // --- Handlers for Cart Actions ---
  const handleIncrement = (item: CartItem) => {
    // We need the original Addon structure to pass to addOrIncrementAddon
    // Reconstruct a minimal Addon object from CartItem
    const addon: Addon = {
      _id: item.addonId,
      name: item.name,
      price: item.price,
      image: item.image, // Include necessary fields for addOrIncrementAddon if it needs more
    };
    addOrIncrementAddon(addon);
    refreshCartState(); // Update UI
  };

  const handleDecrement = (item: CartItem) => {
    decrementItemQuantity(item.addonId);
    refreshCartState(); // Update UI
  };

  const handleRemove = (item: CartItem) => {
    removeItemFromCart(item.addonId);
    refreshCartState(); // Update UI
  };

  const handleProceed = () => {
    alert(
      `Proceeding with Total: ${formatCurrencyCAD(total)} - Implement Payment!`
    );
    // clearCart(); // Optionally clear cart
    // refreshCartState(); // Update UI if cart is cleared
  };

  // --- Render Logic ---
  if (cartItems.length === 0) {
    // Check cartItems instead of itemCount state now
    return (
      <div className="checkout-empty-cart">
        <p className="checkout-empty-message">Your cart is empty.</p>
        <a href="/" className="checkout-browse-link">
          Browse Addons
        </a>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Order Summary</h2>
      <ul className="checkout-item-list">
        {cartItems.map((item) => (
          <li key={item.addonId} className="checkout-item">
            {/* Item Info (Image, Name) */}
            <div className="checkout-item-info">
              <img
                src={item.image}
                alt={item.name}
                className="checkout-item-image"
                onError={(e) => {
                  e.currentTarget.src = "/assets/images/placeholder-image.png";
                }}
              />
              <div className="checkout-item-details">
                {" "}
                {/* Added wrapper for name/price/qty */}
                <span className="checkout-item-name">{item.name}</span>
                <span className="checkout-item-price-single">
                  {formatCurrencyCAD(item.price)}
                </span>{" "}
                {/* Price per item */}
              </div>
            </div>

            {/* Quantity Controls & Price */}
            <div className="checkout-item-controls">
              <div className="quantity-modifier">
                <button
                  onClick={() => handleDecrement(item)}
                  className="quantity-button"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  -
                </button>
                <span className="quantity-display" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleIncrement(item)}
                  className="quantity-button"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
              <span className="checkout-item-price-total">
                {" "}
                {/* Total for this line item */}
                {formatCurrencyCAD(item.price * item.quantity)}
              </span>
              <button
                onClick={() => handleRemove(item)}
                className="remove-button"
                aria-label={`Remove ${item.name} from cart`}
              >
                &times; {/* Multiplication sign as 'X' icon */}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="checkout-total-section">
        <div className="checkout-total-row">
          <span className="checkout-total-label">Total:</span>
          <span className="checkout-total-amount">
            {formatCurrencyCAD(total)}
          </span>
        </div>
      </div>

      <div className="checkout-actions">
        <button className="checkout-proceed-button" onClick={handleProceed}>
          Proceed to Payment (Placeholder)
        </button>
      </div>
    </div>
  );
};

export default CheckoutDisplay;
