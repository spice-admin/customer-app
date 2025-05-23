// src/components/checkout/CheckoutSummaryView.tsx
import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext"; // Adjust path
import type { AddonCartItem } from "../../types/addon.types"; // Adjust path
import { format, parseISO } from "date-fns";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { FiArrowRight } from "react-icons/fi";

// Ensure your PUBLIC_STRIPE_PUBLISHABLE_KEY is set in your .env and exposed
const stripePublishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;

if (stripePublishableKey) {
  stripePromise = loadStripe(stripePublishableKey);
} else {
  console.error(
    "Stripe Publishable Key (PUBLIC_STRIPE_PUBLISHABLE_KEY) is missing from .env variables."
  );
}

interface SummaryData {
  selectedSubscriptionId: string;
  selectedSubscriptionName: string;
  selectedDeliveryDate: string; // YYYY-MM-DD string
}

const CheckoutSummaryView: React.FC = () => {
  const { cartItems, getCartTotalPrice, getCartTotalItems } = useCart(); // Removed clearCart for now, will be handled on success page
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // Supabase User type

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error(
            authError?.message || "User not authenticated. Please log in."
          );
        }
        setCurrentUser(user);

        const storedDataString = localStorage.getItem("addonDeliverySummary");
        if (storedDataString) {
          const parsedData: SummaryData = JSON.parse(storedDataString);
          setSummaryData(parsedData);
        } else {
          throw new Error(
            "Could not retrieve addon delivery selection. Please go back and select again."
          );
        }
      } catch (e: any) {
        console.error("Error loading initial data for checkout summary:", e);
        setError(`Error loading summary: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleConfirmAndPay = async () => {
    if (!summaryData || cartItems.length === 0 || !currentUser) {
      alert(
        "Missing critical information, cart is empty, or you are not logged in. Cannot proceed."
      );
      return;
    }
    if (!stripePromise) {
      setError(
        "Payment system is not initialized. Please check configuration."
      );
      alert("Payment system is not configured. Please contact support.");
      return;
    }

    setIsProcessingPayment(true);
    setError(null);

    // **** DEFINE itemsToCheckout HERE ****
    const itemsToCheckout = cartItems.map((item) => ({
      id: item.id, // addon_id
      name: item.name,
      price: item.price, // price per unit
      quantity: item.quantity,
      image_url: item.image_url, // Optional
    }));
    // **** END DEFINITION ****

    try {
      console.log(
        "Calling 'create-addon-stripe-checkout-session' Edge Function with body:",
        {
          cartItems: itemsToCheckout, // Now defined
          mainOrderId: summaryData.selectedSubscriptionId,
          addonDeliveryDate: summaryData.selectedDeliveryDate,
          totalAddonPrice: getCartTotalPrice(),
          currency: "CAD",
        }
      );

      const { data: sessionData, error: functionError } =
        await supabase.functions.invoke("create-addon-checkout-session", {
          body: {
            cartItems: itemsToCheckout, // Use the defined variable
            currency: "CAD",
            mainOrderId: summaryData.selectedSubscriptionId,
            addonDeliveryDate: summaryData.selectedDeliveryDate,
            totalAddonPrice: getCartTotalPrice(),
            // Pass user details if your Edge function needs them for Stripe Customer creation
            // userEmail: currentUser.email,
            // userId: currentUser.id,
          },
        });

      if (functionError) {
        console.error("Edge Function error:", functionError);
        throw new Error(
          functionError.message ||
            "Failed to create payment session due to server error."
        );
      }

      if (sessionData && sessionData.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error(
            "Stripe.js failed to load. Cannot redirect to checkout."
          );
        }

        console.log(
          "Redirecting to Stripe Checkout with session ID:",
          sessionData.sessionId
        );
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: sessionData.sessionId,
        });

        if (stripeError) {
          throw new Error(
            stripeError.message || "Failed to redirect to Stripe payment page."
          );
        }
      } else {
        console.error(
          "No sessionId received from Edge Function. Response:",
          sessionData
        );
        throw new Error(
          sessionData?.error ||
            "Could not retrieve payment session ID from server."
        );
      }
    } catch (err: any) {
      console.error("Error during 'Confirm & Pay':", err);
      const errorMessage = `Payment process initiation failed: ${
        err.message || "Unknown error"
      }`;
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading your addon summary...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button
          onClick={() => (window.location.href = "/checkout-summary")}
          className="button-secondary"
        >
          Back to Schedule Addons
        </button>
      </div>
    );
  }
  if (!summaryData || cartItems.length === 0) {
    return (
      <div className="info-message-container">
        <p>No addon selection or cart items found to summarize.</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="button-primary button-outline"
        >
          Browse Addons
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-summary-view">
      <h2>Your Addon Order Summary</h2>

      <div className="summary-section">
        <h3>Selected Subscription Package:</h3>
        <p>{summaryData.selectedSubscriptionName || "N/A"}</p>
      </div>

      <div className="summary-section">
        <h3>Delivery Date for these Addons:</h3>
        <p>
          {format(parseISO(summaryData.selectedDeliveryDate), "MMMM dd, yyyy")}
        </p>
      </div>

      <div className="summary-section">
        <h3>Addons to be Delivered:</h3>
        {cartItems.map((item) => (
          <div key={item.id} className="summary-cart-item">
            <span className="item-name">
              {item.name} (x{item.quantity})
            </span>
            <span className="item-price">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="summary-cart-total">
          <strong>Total Addon Price:</strong>
          <strong>${getCartTotalPrice().toFixed(2)} CAD</strong>
        </div>
      </div>

      <div className="summary-actions">
        <button
          onClick={handleConfirmAndPay}
          className="button-primary button-confirm-pay"
          disabled={isProcessingPayment || isLoading || !stripePromise}
        >
          {isProcessingPayment ? "Processing..." : "Proceed to Payment"}
          {!isProcessingPayment && (
            <FiArrowRight className="button-icon-right" />
          )}
        </button>
        <button
          onClick={() => (window.location.href = "/addons/schedule-delivery")}
          className="button-secondary button-edit-selection"
          disabled={isProcessingPayment}
        >
          Edit Selection
        </button>
      </div>
    </div>
  );
};

export default CheckoutSummaryView;
