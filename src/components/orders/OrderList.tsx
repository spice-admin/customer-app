// src/components/orders/OrderList.tsx
import React, { useState, useEffect, useCallback } from "react";
import { getMyOrdersApi } from "../../services/order.service"; // Import the service function
import type { IOrderFE } from "../../types";
import OrderItem from "./OrderItem"; // Import the item component

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<IOrderFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders function
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[OrderList] Fetching orders...");
      const result = await getMyOrdersApi();
      if (result.success && Array.isArray(result.data)) {
        console.log(`[OrderList] Fetched ${result.data.length} orders.`);
        setOrders(result.data);
      } else {
        // Handle case where API returns success:false or data is not an array
        throw new Error(
          result.message || "Failed to fetch orders or invalid data format."
        );
      }
    } catch (err) {
      console.error("[OrderList] Error fetching orders:", err);
      setError((err as Error).message);
      setOrders([]); // Clear orders on error
    } finally {
      setIsLoading(false);
      console.log("[OrderList] Finished fetching orders.");
    }
  }, []);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="loading-placeholder text-center p-10">
        Loading Your Orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-message error text-center p-10">
        <p>{error}</p>
        <button onClick={fetchOrders} className="profile-button retry mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-10 text-gray-600">
        <p>You haven't placed any orders yet.</p>
        <a href="/" className="link mt-4 inline-block">
          Browse Packages
        </a>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      {/* Optional: Add title within the component */}
      {/* <h2 className="order-list-title">My Order History</h2> */}
      {orders.map((order) => (
        <OrderItem key={order._id} order={order} />
      ))}
      {/* Add styles globally or scoped */}
      <style>{`
                .order-list-container {
                    /* Add padding or margins if needed */
                }
                .order-list-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    /* Add other styling */
                }
                /* Ensure link styles are defined */
                .link { color: orangered; text-decoration: underline; }
                .mt-4 { margin-top: 1rem; }
                .inline-block { display: inline-block; }
                .text-center { text-align: center; }
                .p-10 { padding: 2.5rem; }
                .text-gray-600 { color: #4b5563; }
                /* Ensure form-message and button styles are loaded */
             `}</style>
    </div>
  );
};

export default OrderList;
