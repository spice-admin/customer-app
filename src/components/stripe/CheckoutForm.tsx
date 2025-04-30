// src/components/stripe/CheckoutForm.tsx
import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  // Add any props needed, e.g., amount to display (optional)
  orderTotal: number;
  addonOrderId: string; // Pass the ID for reference if needed
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  orderTotal,
  addonOrderId,
}) => {
  const stripe = useStripe(); // Hook to get Stripe instance
  const elements = useElements(); // Hook to get Elements instance

  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      console.log("Stripe.js not loaded yet.");
      return;
    }

    setIsProcessing(true);
    setMessage(null); // Clear previous messages

    // --- Trigger Payment Confirmation ---
    // return_url tells Stripe where to redirect the user after they authenticate payment
    const returnUrl = `${window.location.origin}/addon-order-status`; // Status page URL

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: returnUrl,
        // Optional: Add receipt email if needed and allowed
        // receipt_email: customerEmail,
      },
    });

    // --- Handle Errors from Stripe ---
    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred during payment confirmation.");
      }
      console.error("Stripe confirmPayment error:", error);
    } else {
      // This part is typically not reached if redirection happens
      setMessage("Payment processing unexpected state.");
    }

    setIsProcessing(false);
  };

  return (
    <form
      id="payment-form"
      onSubmit={handleSubmit}
      className="stripe-checkout-form"
    >
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      <button
        disabled={isProcessing || !stripe || !elements}
        id="submit"
        className="stripe-submit-button" // Use specific class for styling
      >
        <span id="button-text">
          {isProcessing
            ? "Processing..."
            : `Pay ${formatCurrencyCAD(orderTotal)}`}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className="stripe-payment-message">
          {message}
        </div>
      )}
    </form>
  );
};

// Re-import or define formatCurrencyCAD if needed within this file scope
// (It's better to have it in a shared util)
const formatCurrencyCAD = (value: number): string => {
  // Ensure value is treated as cents if that's what orderTotal represents
  // If orderTotal is passed in dollars, adjust accordingly
  const amountInDollars = value; // Assuming orderTotal is in cents
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amountInDollars);
};

export default CheckoutForm;
