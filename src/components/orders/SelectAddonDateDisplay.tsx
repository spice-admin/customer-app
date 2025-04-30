// src/components/order/SelectAddonDateDisplay.tsx
import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { IOrderFE, CartItem } from "../../types"; // Import CartItem
import { getOrderByIdApi } from "../../services/order.service";
import {
  getCartItems,
  getCartTotal as getCartAddonsTotal,
} from "../../utils/cart";
import { formatDate } from "../../utils/date";
import { formatCurrencyCAD } from "../../utils/currency"; // Import currency formatter

const SelectAddonDateDisplay: React.FC = () => {
  const [order, setOrder] = useState<IOrderFE | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  // --- NEW: State for cart items ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);

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
      /* ... fetch logic remains same ... */
      setLoading(true);
      setError(null);
      try {
        const response = await getOrderByIdApi(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
          // --- NEW: Fetch cart items AFTER order loads (or could do in parallel) ---
          const items = getCartItems();
          const total = getCartAddonsTotal(); // Get total for addons only
          setCartItems(items);
          setCartTotal(total);
        } else {
          throw new Error(response.message || "Failed to load order details.");
        }
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

    console.log(
      `Payment button clicked for Order ${
        order.orderNumber || order._id
      }, Selected Date: ${selectedDate.toISOString()}, Addons:`,
      cartItems
    );

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

  // Determine min/max dates for calendar
  const { minSelectableDate, orderEndDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let minDate = today;
    let maxDate: Date | undefined = undefined; // Initialize maxDate

    if (order) {
      const start = new Date(order.startDate);
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

  // --- Rendering Logic ---

  if (loading) {
    return <div className="loading-message">Loading details...</div>;
  }
  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }
  if (!order) {
    return (
      <div className="error-message">Could not load order information.</div>
    );
  }
  // Check if orderEndDate could be determined
  if (!orderEndDate) {
    return (
      <div className="error-message">
        Cannot determine a valid date range for this order.
      </div>
    );
  }

  return (
    <div className="select-date-container">
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
          disabled={!orderEndDate}
        />
      </div>

      {/* --- NEW: Summary Section (Visible only when date is selected) --- */}
      {selectedDate && cartItems.length > 0 && (
        <div className="checkout-summary-section">
          <h3 className="summary-title">Order Summary</h3>
          <div className="summary-item">
            <span className="summary-label">Selected Order:</span>
            <span className="summary-value">
              #{order.orderNumber || order._id.slice(-6)} ({order.packageName})
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Chosen Date:</span>
            <span className="summary-value">{formatDate(selectedDate)}</span>
          </div>
          <div className="summary-item summary-addons-section">
            <span className="summary-label">Addons:</span>
            <ul className="summary-addon-list">
              {cartItems.map((item) => (
                <li key={item.addonId} className="summary-addon-item">
                  <span>
                    {item.name} (x{item.quantity})
                  </span>
                  <span>{formatCurrencyCAD(item.price * item.quantity)}</span>
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
          onClick={handlePaymentClick}
          // Enable only when date is selected AND cart is not empty
          disabled={!selectedDate || cartItems.length === 0 || !!error}
          className="payment-button"
        >
          Payment {/* Keep button text as requested */}
        </button>
        {!selectedDate && (
          <p className="payment-prompt">
            Please select a date from the calendar.
          </p>
        )}
        {selectedDate && cartItems.length === 0 && (
          <p className="payment-prompt error-message">
            Your addon cart is empty. Please add items first.
          </p>
        )}
      </div>
    </div>
  );
};

export default SelectAddonDateDisplay;
