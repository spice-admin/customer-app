// src/components/checkout/AddonOrderFinalizer.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import { useCart } from "../../context/CartContext"; // Adjust path
import { format, parseISO } from "date-fns"; // For displaying formatted dates

interface AddonOrderFinalizerProps {
  sessionId: string | null;
}

interface FinalizedAddonOrder {
  id: string;
  main_order_id: string;
  addon_delivery_date: string;
  total_addon_price: number;
  currency: string;
  // Add other fields from your addonOrder object returned by the Edge Function if needed
}

const AddonOrderFinalizer: React.FC<AddonOrderFinalizerProps> = ({
  sessionId,
}) => {
  const [message, setMessage] = useState<string>(
    "Processing your addon order payment..."
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [finalizedOrderDetails, setFinalizedOrderDetails] =
    useState<FinalizedAddonOrder | null>(null);

  const { clearCart } = useCart(); // Get clearCart from context

  useEffect(() => {
    if (!sessionId) {
      setMessage("Payment session information missing or invalid.");
      setError("No session ID found. Your order might not be confirmed.");
      setIsLoading(false);
      return;
    }

    const finalizeOrder = async () => {
      setIsLoading(true);
      setError(null);
      console.log(
        "AddonOrderFinalizer: Invoking 'finalize-addon-order' with session_id:",
        sessionId
      );
      try {
        const { data, error: funcError } = await supabase.functions.invoke(
          "finalize-addon-order",
          { body: { session_id: sessionId } }
        );

        console.log(
          "AddonOrderFinalizer: 'finalize-addon-order' response - data:",
          data,
          "error:",
          funcError
        );

        if (funcError) {
          throw new Error(
            funcError.message || "Server error during order finalization."
          );
        }
        if (data && data.error) {
          throw new Error(data.error);
        }

        if (data && data.success && data.addonOrder) {
          setMessage(
            data.message || "Your addons have been successfully scheduled!"
          );
          setFinalizedOrderDetails(data.addonOrder as FinalizedAddonOrder);

          // Clear the cart after successful finalization
          console.log("AddonOrderFinalizer: Clearing cart...");
          clearCart();
          localStorage.removeItem("addonDeliverySummary"); // Also clear summary selection
          console.log("AddonOrderFinalizer: Cart and summary data cleared.");
        } else {
          throw new Error(
            data?.error ||
              "Failed to finalize addon order. Response not successful."
          );
        }
      } catch (e: any) {
        console.error("Error in finalizeAddonOrder:", e);
        setMessage(`Error finalizing your order.`);
        setError(
          `Details: ${
            e.message || "Unknown error"
          }. If payment was made, please contact support with session ID: ${sessionId}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    finalizeOrder();
  }, [sessionId, clearCart]); // Add clearCart to dependencies

  if (isLoading) {
    return <p className="status-message">{message}</p>; // Or a dedicated loading spinner component
  }

  return (
    <div className="addon-order-confirmation">
      <h1>Addon Order Status</h1>
      {error && <p className="error-text">Error: {error}</p>}
      {!error && <p className="status-message">{message}</p>}

      {finalizedOrderDetails && (
        <div className="order-details-summary-box">
          <h4>Order Confirmed!</h4>
          <p>
            <strong>Associated Subscription:</strong> Order ...
            {finalizedOrderDetails.main_order_id.slice(-6)}
          </p>
          {finalizedOrderDetails.addon_delivery_date && (
            <p>
              <strong>Addons Delivery Date:</strong>{" "}
              {
                format(
                  parseISO(
                    finalizedOrderDetails.addon_delivery_date + "T00:00:00Z"
                  ),
                  "MMMM dd, yyyy"
                ) // Assume YYYY-MM-DD, parse as UTC
              }
            </p>
          )}
          <p>
            <strong>Total Paid for Addons:</strong> $
            {parseFloat(
              String(finalizedOrderDetails.total_addon_price)
            ).toFixed(2)}{" "}
            {finalizedOrderDetails.currency}
          </p>
          <p>
            <strong>Your Addon Order ID:</strong> ...
            {finalizedOrderDetails.id.slice(-12)}
          </p>
        </div>
      )}
      <a
        href="/home"
        className="button-primary"
        style={{
          marginTop: "30px",
          display: "inline-block",
          textDecoration: "none",
        }}
      >
        Back to Home
      </a>
    </div>
  );
};

export default AddonOrderFinalizer;
