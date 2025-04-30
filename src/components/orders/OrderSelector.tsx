// src/components/order/OrderSelector.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { IOrderFE } from "../../types"; // Keep type import
import { OrderStatus } from "../../types";
import { getMyOrdersApi } from "../../services/order.service"; // Adjust path
import { formatDate } from "../../utils/date"; // Import the utility

// Helper function to filter for displayable orders on this page
const isActiveOrder = (order: IOrderFE): boolean => {
  // Use the specific status defined by the backend model
  const activeStatuses: OrderStatus[] = [OrderStatus.ACTIVE]; // Use the enum value
  try {
    const endDateTime = new Date(order.endDate).getTime();
    const now = Date.now();
    // Only show orders that are "Active" AND haven't ended yet
    return activeStatuses.includes(order.status) && endDateTime > now;
  } catch (e) {
    return false;
  }
};

const OrderSelector: React.FC = () => {
  const [allOrders, setAllOrders] = useState<IOrderFE[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMyOrdersApi();
        if (response.success && Array.isArray(response.data)) {
          setAllOrders(response.data);
        } else {
          throw new Error(response.message || "Failed to load orders.");
        }
      } catch (err: any) {
        setError(err.message || "Could not load your orders.");
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
    fetchOrders();
  }, []);

  // Filter orders based on the corrected logic
  const displayableActiveOrders = useMemo(() => {
    return allOrders.filter(isActiveOrder);
  }, [allOrders]);

  const handleOrderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOrderId(event.target.value);
  };

  // Handle the "Date Selection" button click - Redirects
  const handleDateSelectionRedirect = () => {
    if (!selectedOrderId) {
      alert("Please select an active order first."); // Simple alert for now
      return;
    }
    // Redirect to the date selection page, passing the chosen orderId
    window.location.href = `/select-addon-date?orderId=${selectedOrderId}`;
  };

  // --- Rendering Logic ---

  if (loading) {
    return <div className="loading-message">Loading your active orders...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        Error: {error}{" "}
        <button
          onClick={() => window.location.reload()}
          style={{ marginLeft: "10px", cursor: "pointer" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (displayableActiveOrders.length === 0) {
    return (
      <div className="no-subscription-message">
        {" "}
        {/* Reuse class or rename */}
        <h2>No Active Orders Found</h2>
        <p>
          You don't have any active orders suitable for adding addons right now.
        </p>
        <a href="/packages" className="browse-packages-link">
          Browse Packages
        </a>
      </div>
    );
  }

  return (
    // Use container class from CSS
    <div className="order-selection-container">
      <h2 className="selection-title">Select Order for Addons</h2>
      <p className="selection-instructions">
        Choose the active order you want to add items to.
      </p>

      {/* Use list class from CSS */}
      <div className="order-list">
        {displayableActiveOrders.map((order) => (
          // Use item class from CSS
          <label key={order._id} className="order-item">
            <input
              type="radio"
              name="orderSelection"
              value={order._id}
              checked={selectedOrderId === order._id}
              onChange={handleOrderChange}
              className="order-radio" // Use class from CSS
            />
            {/* Use details class from CSS */}
            <span className="order-details">
              <span className="order-identifier">
                Order #{order.orderNumber || order._id.slice(-6)}
              </span>
              <span className="order-package">
                Package: {order.packageName}
              </span>
              <span className="order-delivery-date">
                Active Until: {formatDate(order.endDate)}
              </span>
              <span className="order-status">Status: {order.status}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Button section */}
      <div className="date-selection-section">
        {" "}
        {/* Reuse class */}
        {/* Use button class from CSS */}
        <button
          onClick={handleDateSelectionRedirect} // Use the redirect handler
          disabled={!selectedOrderId} // Disable if no order is selected
          className="date-selection-button" // Reuse class or rename
        >
          Date Selection {/* Keep button text as requested */}
        </button>
        {!selectedOrderId && (
          <p className="date-selection-prompt">
            Please select an order above first.
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderSelector;
