// src/components/payment/PaymentSuccessClient.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const PaymentSuccessClient: React.FC = () => {
  const [status, setStatus] = useState<string>(
    "Processing your payment and order..."
  );
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const finalizeOrder = async () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");

        if (!sessionId) {
          setError("Payment session ID not found. Cannot confirm order.");
          setStatus("Error");
          return;
        }

        try {
          setStatus("Verifying payment and creating your order...");
          const { data, error: functionError } =
            await supabase.functions.invoke(
              "finalize-order", // New Edge Function to create
              { body: { checkout_session_id: sessionId } }
            );

          if (functionError) {
            throw new Error(
              data?.error ||
                functionError.message ||
                "Failed to finalize order."
            );
          }

          if (data?.success && data.orderId) {
            setOrderId(data.orderId);
            setStatus("Order Confirmed!");
            setError(null);
            // Optional: Redirect to an order details page or orders history after a delay
            // setTimeout(() => {
            //   window.location.href = `/orders/${data.orderId}`;
            // }, 3000);
          } else {
            throw new Error(
              data?.error ||
                "Order could not be confirmed. Please contact support."
            );
          }
        } catch (err) {
          console.error("Finalize order error:", err);
          setError((err as Error).message);
          setStatus("Order Confirmation Failed");
        }
      }
    };

    finalizeOrder();
  }, []);

  return (
    <div>
      <p style={{ fontSize: "1.1em", margin: "20px 0" }}>{status}</p>
      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>Error: {error}</p>
      )}
      {orderId && !error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#e6fffa",
            border: "1px solid #38b2ac",
            borderRadius: "6px",
          }}
        >
          <h3
            style={{
              fontSize: "1.2em",
              color: "#2c7a7b",
              marginBottom: "10px",
            }}
          >
            Thank you for your order!
          </h3>
          <p>
            Your Order ID is: <strong>{orderId}</strong>
          </p>
          <p style={{ marginTop: "15px" }}>
            <a
              href="/home"
              style={{ color: "#2c7a7b", textDecoration: "underline" }}
            >
              Continue Shopping
            </a>
            {/* Or link to /orders page */}
          </p>
        </div>
      )}
      {!orderId && !error && status.toLowerCase().includes("processing") && (
        <div style={{ marginTop: "20px" }}>
          {" "}
          {/* Simple spinner/loader */}
          <svg
            style={{
              margin: "auto",
              background: "none",
              display: "block",
              shapeRendering: "auto",
            }}
            width="50px"
            height="50px"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid"
          >
            <circle
              cx="50"
              cy="50"
              fill="none"
              stroke="#f97316"
              strokeWidth="10"
              r="35"
              strokeDasharray="164.93361431346415 56.97787143782138"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                repeatCount="indefinite"
                dur="1s"
                values="0 50 50;360 50 50"
                keyTimes="0;1"
              ></animateTransform>
            </circle>
          </svg>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccessClient;
