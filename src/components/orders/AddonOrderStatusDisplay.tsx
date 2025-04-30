// src/components/order/AddonOrderStatusDisplay.tsx
import React, { useState, useEffect } from "react";

import { clearCart } from "../../utils/cart"; // Import clearCart

// --- Simple Loading Spinner ---
const Spinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "50px",
    }}
  >
    <div
      style={{
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #f97316",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        animation: "spin 1s linear infinite",
      }}
    ></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

const AddonOrderStatusDisplay: React.FC = () => {
  const [message, setMessage] = useState<string>(
    "Processing your payment status..."
  );
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    // Cannot use useStripe() here directly as this component might not be wrapped in Elements.
    // Just parse the URL parameters. The backend webhook is the source of truth.
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );
    const redirectStatus = new URLSearchParams(window.location.search).get(
      "redirect_status"
    );

    if (!clientSecret) {
      console.error("No client_secret found in URL");
      setMessage("Could not retrieve payment details.");
      setStatus("error");
      return;
    }

    // Use redirect_status provided by Stripe to give immediate feedback
    // The webhook will handle the DB update.
    switch (redirectStatus) {
      case "succeeded":
        setMessage(
          "Thank you! Your addon order payment was successful. Your order is being updated."
        );
        setStatus("success");
        clearCart(); // Clear the addon cart on success
        break;
      case "processing":
        setMessage(
          "Your payment is processing. We'll update you when payment is received."
        );
        setStatus("loading"); // Keep loading state or specific processing state
        break;
      case "requires_payment_method":
        setMessage("Payment failed. Please try another payment method.");
        setStatus("error");
        // TODO: Optionally redirect back to checkout or offer retry?
        break;
      default:
        setMessage("Something went wrong retrieving payment status.");
        setStatus("error");
        break;
    }

    // --- Alternative using stripe.retrievePaymentIntent (Requires Stripe instance) ---
    // This requires wrapping THIS component in <Elements> or passing stripe instance down,
    // which complicates things slightly. Relying on redirect_status is simpler for now.
    /*
        if (!stripe) return; // Stripe not loaded yet

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
             switch (paymentIntent?.status) {
                case "succeeded":
                    setMessage("Payment succeeded!");
                    setStatus('success');
                    clearCart();
                    break;
                case "processing":
                    setMessage("Your payment is processing.");
                     setStatus('loading');
                    break;
                case "requires_payment_method":
                    setMessage("Your payment was not successful, please try again.");
                     setStatus('error');
                    break;
                default:
                    setMessage("Something went wrong.");
                     setStatus('error');
                    break;
             }
        });
        */
  }, []); // Run once on mount

  return (
    <div className="status-display-container">
      {status === "loading" && <Spinner />}
      <p className={`status-message status-${status}`}>{message}</p>
      {status === "success" && (
        <a href="/home" className="status-link">
          Go To Home Page
        </a>
      )}
      {status === "error" && (
        <a href="/checkout" className="status-link status-link-error">
          Try Again
        </a>
      )}
    </div>
  );
};

// --- We need to wrap this component to provide Stripe context if using retrievePaymentIntent ---
// Simplified approach above doesn't require the wrapper here.

// --- If using retrievePaymentIntent, you'd need this: ---
/*
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY);

const AddonOrderStatusPageContent: React.FC = () => (
    <Elements stripe={stripePromise}>
         <AddonOrderStatusDisplay />
    </Elements>
);
export default AddonOrderStatusPageContent;
*/
// For simplicity, export the version NOT using retrievePaymentIntent directly:
export default AddonOrderStatusDisplay;
