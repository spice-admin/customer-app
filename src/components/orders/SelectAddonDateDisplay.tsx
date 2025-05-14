// src/components/order/SelectAddonDateDisplay.tsx
import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import type { IOrderFE, CartItem } from "../../types";
import { getMyOrdersApi } from "../../services/order.service";

import {
  getCartItems,
  getCartTotal as getCartAddonsTotal,
} from "../../utils/cart";
import { initiateAddonPaymentApi } from "../../services/addon-order.service";
import { formatDate } from "../../utils/date";
import { formatCurrencyCAD } from "../../utils/currency";
import CheckoutForm from "../stripe/CheckoutForm.tsx";

const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY);

const SelectAddonDateDisplay: React.FC = () => {
  const [order, setOrder] = useState<IOrderFE | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading order details
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0); // Total for addons only (in cents)
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [addonOrderId, setAddonOrderId] = useState<string | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] =
    useState<boolean>(false);

  // Get orderId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    if (id) {
      setOrderId(id);
    } else {
      setError("No order specified in URL.");
      setLoading(false);
    }
  }, []);

  // Fetch order details when orderId is available
  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      setClientSecret(null);
      try {
        // Fetch Order
        const orderResponse = await getMyOrdersApi();
        if (!orderResponse.success || !orderResponse.data) {
          throw new Error(
            orderResponse.message || "Failed to load order details."
          );
        }
        setOrder(orderResponse.data);

        // Fetch Cart
        const items = getCartItems();
        const total = getCartAddonsTotal();
        setCartItems(items);
        setCartTotal(total);
      } catch (err: any) {
        setError(err.message || "Could not load order details.");
        if (
          err.message?.includes("authenticated") ||
          err.message?.includes("Authentication failed") ||
          err.message?.includes("Please log in")
        ) {
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handlePaymentClick = () => {
    if (!selectedDate || !order || cartItems.length === 0) return;

    // Show the final "Thank you" popup
    Swal.fire({
      title: "Thank you!",
      text: "Your addon request has been received.", // Final message
      icon: "success",
      confirmButtonText: "Okay",
    }).then(() => {
      // TODO: Clear the addon cart? Redirect?
      // clearCart(); // Example: Call clearCart utility if needed
      // window.location.href = '/my-orders'; // Example redirect
    });
    // TODO: Implement actual API call here to finalize adding addons to the specified order/date
  };

  const handleInitiatePayment = async () => {
    if (!selectedDate || !order || cartItems.length === 0) return;

    setIsInitiatingPayment(true);
    setError(null); // Clear previous errors
    setClientSecret(null); // Reset client secret

    try {
      const response = await initiateAddonPaymentApi(order._id, selectedDate);
      if (
        response.success &&
        response.data?.clientSecret &&
        response.data?.addonOrderId
      ) {
        setClientSecret(response.data.clientSecret); // Set client secret to render Stripe form
        setAddonOrderId(response.data.addonOrderId); // Store addonOrderId if needed later
        console.log("Payment Intent created, client secret received.");
        // Now the Stripe Elements form will render below
      } else {
        throw new Error(response.message || "Failed to initiate payment.");
      }
    } catch (err: any) {
      console.error("Error initiating payment:", err);
      setError(err.message || "Could not start payment process.");
      // Show error to user maybe?
      Swal.fire(
        "Error",
        err.message || "Could not start payment process.",
        "error"
      );
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  // Determine min/max dates for calendar
  const { minSelectableDate, orderEndDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let minDate = today;
    let maxDate: Date | undefined = undefined; // Initialize maxDate

    if (order) {
      const start = new Date(order.delivery_start_date);
      if (start > today) {
        minDate = start;
      }
      // Ensure endDate is parsed correctly before setting maxDate
      try {
        const end = new Date(order.endDate);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime())) {
          // Check if date is valid
          maxDate = end;
        } else {
          console.error("Invalid order end date:", order.endDate);
          setError("Order has an invalid end date."); // Set error if invalid
        }
      } catch (e) {
        console.error("Error parsing order end date:", order.endDate, e);
        setError("Could not determine order end date."); // Set error if parsing fails
        maxDate = undefined; // Ensure maxDate is undefined on error
      }
    }
    return { minSelectableDate: minDate, orderEndDate: maxDate };
  }, [order]); // Recalculate only when order changes

  const appearance = { theme: "stripe" as const }; // Or 'night', 'flat', etc.
  const stripeOptions: StripeElementsOptions | undefined = clientSecret
    ? { appearance, clientSecret }
    : undefined;

  // --- Rendering Logic ---

  if (loading) {
    return <div className="loading-message">Loading details...</div>;
  }
  if (error && !clientSecret) {
    return <div className="error-message">Error: {error}</div>;
  } // Don't show main error if payment form is shown with its own error
  if (!order) {
    return (
      <div className="error-message">Could not load order information.</div>
    );
  }
  if (!orderEndDate && !loading) {
    return (
      <div className="error-message">
        Cannot determine a valid date range for this order.
      </div>
    );
  }

  return (
    <div className="select-date-container">
      {!clientSecret ? (
        // --- Show Date Selection UI ---
        <>
          <h2 className="select-date-title">Select Delivery Date for Addons</h2>
          <div className="select-date-order-info">
            <p>
              For Order #:{" "}
              <strong>{order.orderNumber || order._id.slice(-6)}</strong>
            </p>
            <p>
              Package: <strong>{order.packageName}</strong>
            </p>
          </div>

          <p className="select-date-instructions">
            Please choose a date between {formatDate(minSelectableDate)} and{" "}
            {formatDate(orderEndDate)}:
          </p>

          <div className="calendar-container">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              minDate={minSelectableDate}
              maxDate={orderEndDate}
              inline
              dateFormat="yyyy-MM-dd"
              calendarClassName="date-picker-calendar-class"
              // Only allow selection if maxDate is valid
              disabled={!orderEndDate || isInitiatingPayment}
            />
          </div>

          {/* --- NEW: Summary Section (Visible only when date is selected) --- */}
          {selectedDate && cartItems.length > 0 && (
            <div className="checkout-summary-section">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-item">
                <span className="summary-label">Selected Order:</span>
                <span className="summary-value">
                  #{order.orderNumber || order._id.slice(-6)} (
                  {order.packageName})
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Chosen Date:</span>
                <span className="summary-value">
                  {formatDate(selectedDate)}
                </span>
              </div>
              <div className="summary-item summary-addons-section">
                <span className="summary-label">Addons:</span>
                <ul className="summary-addon-list">
                  {cartItems.map((item) => (
                    <li key={item.addonId} className="summary-addon-item">
                      <span>
                        {item.name} (x{item.quantity})
                      </span>
                      <span>
                        {formatCurrencyCAD(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="summary-item summary-total">
                <span className="summary-label">Addons Total:</span>
                <span className="summary-value">
                  {formatCurrencyCAD(cartTotal)}
                </span>
              </div>
            </div>
          )}
          {/* --- End of Summary Section --- */}

          <div className="select-date-actions">
            <button
              onClick={handleInitiatePayment}
              disabled={
                !selectedDate ||
                cartItems.length === 0 ||
                isInitiatingPayment ||
                !!error
              }
              className="payment-button" // Use your specific class
            >
              {isInitiatingPayment ? "Processing..." : "Proceed to Payment"}
            </button>
            {/* ... prompts ... */}
            {!selectedDate && (
              <p className="payment-prompt">Please select a date.</p>
            )}
            {selectedDate && cartItems.length === 0 && (
              <p className="payment-prompt error-message">
                Your addon cart is empty.
              </p>
            )}
          </div>
        </>
      ) : (
        // --- Show Stripe Payment Form ---
        <div className="stripe-payment-section">
          <h2 className="select-date-title">Enter Payment Details</h2>
          <p className="text-center mb-4 text-sm text-gray-600">
            Complete your addon purchase securely.
          </p>
          {error && <div className="error-message mb-4">Error: {error}</div>}{" "}
          {/* Display initiation errors here too */}
          {/* Wrap form with Elements provider */}
          <Elements options={stripeOptions} stripe={stripePromise}>
            <CheckoutForm
              orderTotal={cartTotal} // Pass total (in cents)
              addonOrderId={addonOrderId!} // Pass ID
            />
          </Elements>
          <button
            onClick={() => setClientSecret(null)}
            className="stripe-cancel-button"
          >
            Cancel Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectAddonDateDisplay;
