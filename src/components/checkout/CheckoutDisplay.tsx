// src/components/checkout/CheckoutDisplay.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  getCartItems,
  getCartTotal,
  addOrIncrementAddon, // Expects an object like { id, name, price, image_url }
  decrementItemQuantity, // Expects addonId
  removeItemFromCart, // Expects addonId
} from "../../utils/cart"; // Assuming these are updated to use new types
import type { CartItem } from "../../types"; // Import CartItem, Addon type not directly needed here if cart functions are adapted
import { formatCurrencyCAD } from "../../utils/currency";
import Swal from "sweetalert2"; // Import Swal

const CheckoutDisplay: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);

  const refreshCartState = useCallback(() => {
    const items = getCartItems();
    const calculatedTotal = getCartTotal();
    setCartItems(items);
    setTotal(calculatedTotal);
    console.log("Checkout cart state refreshed:", items);
  }, []);

  useEffect(() => {
    refreshCartState(); // Initial load

    // Listen for custom cartUpdated event
    const handleCartUpdate = () => {
      console.log("Checkout detected cartUpdated event.");
      refreshCartState();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [refreshCartState]);

  const handleIncrement = (item: CartItem) => {
    // Construct the object addOrIncrementAddon expects.
    // Assuming addOrIncrementAddon in utils/cart.ts now expects this structure:
    const addonDetails = {
      id: item.addonId,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
    };
    addOrIncrementAddon(addonDetails);
    // refreshCartState(); // Not needed if addOrIncrementAddon calls saveCartItems which dispatches 'cartUpdated'
  };

  const handleDecrement = (item: CartItem) => {
    decrementItemQuantity(item.addonId);
    // refreshCartState(); // Not needed if cart utility dispatches 'cartUpdated'
  };

  const handleRemove = (item: CartItem) => {
    removeItemFromCart(item.addonId);
    // refreshCartState(); // Not needed if cart utility dispatches 'cartUpdated'
  };

  const handleProceed = () => {
    if (cartItems.length === 0) {
      Swal.fire(
        "Empty Cart",
        "Your cart is empty. Please add some addons first.",
        "info"
      );
      return;
    }
    console.log(
      `Proceeding to order selection with ${
        cartItems.length
      } items, Total: ${formatCurrencyCAD(total)}`
    );
    window.location.href = "/order-selection"; // Or your next step
  };

  if (cartItems.length === 0) {
    return (
      <div
        className="checkout-empty-cart"
        style={{ textAlign: "center", padding: "40px 0" }}
      >
        <p
          className="checkout-empty-message"
          style={{ fontSize: "1.2em", marginBottom: "20px" }}
        >
          Your cart is empty.
        </p>
        <a href="/" className="checkout-browse-link btn btn-primary">
          {" "}
          {/* Added btn classes for styling */}
          Browse Addons
        </a>
      </div>
    );
  }

  return (
    <div className="checkout-container container my-4">
      {" "}
      {/* Added Bootstrap container & margin */}
      <h2 className="checkout-title text-center mb-4">Order Summary</h2>
      <ul className="checkout-item-list list-group mb-4">
        {" "}
        {/* Bootstrap list group */}
        {cartItems.map((item) => (
          <li
            key={item.addonId}
            className="checkout-item list-group-item d-flex justify-content-between align-items-center"
          >
            <div className="checkout-item-info d-flex align-items-center">
              <img
                src={item.image_url || "/assets/images/placeholder-image.png"} // USE item.image_url
                alt={item.name}
                className="checkout-item-image img-thumbnail me-3" // Bootstrap thumbnail & margin
                style={{ width: "60px", height: "60px", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/images/placeholder-image.png";
                }}
              />
              <div className="checkout-item-details">
                <span className="checkout-item-name fw-bold">{item.name}</span>{" "}
                <br />
                <span className="checkout-item-price-single text-muted">
                  {formatCurrencyCAD(item.price)} each
                </span>
              </div>
            </div>

            <div className="checkout-item-controls d-flex align-items-center">
              <div
                className="quantity-modifier input-group input-group-sm me-3"
                style={{ width: "120px" }}
              >
                <button
                  onClick={() => handleDecrement(item)}
                  className="quantity-button btn btn-outline-secondary"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  -
                </button>
                <span
                  className="quantity-display form-control text-center"
                  aria-live="polite"
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleIncrement(item)}
                  className="quantity-button btn btn-outline-secondary"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
              <span
                className="checkout-item-price-total fw-semibold me-3"
                style={{ minWidth: "80px", textAlign: "right" }}
              >
                {formatCurrencyCAD(item.price * item.quantity)}
              </span>
              <button
                onClick={() => handleRemove(item)}
                className="remove-button btn btn-sm btn-outline-danger"
                aria-label={`Remove ${item.name} from cart`}
              >
                &times;
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="checkout-total-section fs-5 p-3 mb-3 bg-light rounded">
        <div className="checkout-total-row d-flex justify-content-between">
          <span className="checkout-total-label fw-bold">Total:</span>
          <span className="checkout-total-amount fw-bold">
            {formatCurrencyCAD(total)}
          </span>
        </div>
      </div>
      <div className="checkout-actions text-center">
        <button
          className="checkout-proceed-button btn btn-success btn-lg"
          onClick={handleProceed}
        >
          Proceed to Order Selection
        </button>
      </div>
    </div>
  );
};

export default CheckoutDisplay;
