// src/components/packages/PackageCard.tsx
import React, { useState } from "react";
import type { IPackageFE } from "../../types"; // Ensure IPackageFE is correctly defined
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { createCheckoutSessionApi } from "../../services/payment.service";

// --- UPDATED Component Props ---
interface PackageCardProps {
  pkg: IPackageFE;
  hasAddressInfo: boolean; // <-- ADD THIS PROP BACK
}
// --- End Update ---

// Helper to format currency (assuming CAD)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-CA", {
    // Canadian locale
    style: "currency",
    currency: "CAD", // Canadian Dollar
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Simple image fallback placeholder
const ImageFallback = ({ className }: { className?: string }) => (
  <div className={`fallback-image ${className || ""}`}>
    <span>Image N/A</span>
    {/* Basic styles for fallback - can be moved to global CSS */}
    <style>{`
      .fallback-image {
        display: flex; align-items: center; justify-content: center;
        background-color: #f3f4f6; color: #9ca3af; font-size: 0.8em;
        width: 100%; aspect-ratio: 16 / 10; object-fit: cover;
        border-bottom: 1px solid #e5e7eb;
      }
    `}</style>
  </div>
);

// Stripe Promise Initialization (Keep outside component)
const stripePublishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
if (!stripePublishableKey) {
  console.error(
    "Stripe Publishable Key (PUBLIC_STRIPE_PUBLISHABLE_KEY) is missing."
  );
} else {
  stripePromise = loadStripe(stripePublishableKey);
  console.log("Stripe.js promise initialized.");
}

// --- UPDATED Component Signature ---
const PackageCard: React.FC<PackageCardProps> = ({ pkg, hasAddressInfo }) => {
  // <-- ADD hasAddressInfo HERE
  // --- State Variables ---
  const [imageError, setImageError] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  // --- Handlers ---
  const handleImageError = () => {
    setImageError(true);
  };

  // Optional: Card click handler (uncomment if needed)
  // const handleCardClick = () => {
  //   console.log("Navigate to package detail:", pkg._id);
  //   alert(`Navigate to package detail: ${pkg.name} (ID: ${pkg._id})`);
  // };

  const handleSubscribeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscribeError(null);
    console.log(`[PackageCard] Subscribe clicked for package: ${pkg.name}`);

    // --- Address Check (Uses the prop) ---
    if (!hasAddressInfo) {
      alert("Please set your delivery address and city in your profile first.");
      window.location.href = "/profile"; // Redirect to profile
      return;
    }
    // --- End Address Check ---

    setIsSubscribing(true); // Set loading state

    // Check Stripe key and promise
    if (!stripePublishableKey || !stripePromise) {
      console.error(
        "[PackageCard] Stripe configuration missing or failed to initialize."
      );
      setSubscribeError("Payment configuration error. Please contact support.");
      setIsSubscribing(false);
      return;
    }

    // Proceed with payment initiation
    try {
      console.log("[PackageCard] Calling createCheckoutSessionApi...");
      const result = await createCheckoutSessionApi(pkg._id);

      if (result.success && result.data?.sessionId) {
        console.log(
          "[PackageCard] Checkout session created:",
          result.data.sessionId
        );
        const stripe = await stripePromise; // Await the promise here
        if (!stripe) {
          throw new Error("Stripe.js failed to load.");
        }

        console.log("[PackageCard] Redirecting to Stripe Checkout...");
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: result.data.sessionId,
        });

        if (stripeError) {
          throw new Error(
            stripeError.message || "Failed to redirect to payment page."
          );
        }
        // User navigates away on success
      } else {
        throw new Error(result.message || "Could not initiate subscription.");
      }
    } catch (error) {
      console.error("[PackageCard] Subscription process error:", error);
      setSubscribeError(
        (error as Error).message || "An unexpected error occurred."
      );
      setIsSubscribing(false); // Reset loading only on error
    }
  };

  return (
    // Add onClick={handleCardClick} back if needed
    <div className="all-food-main package-card">
      {/* Image */}
      <div className="package-card-image-container">
        {!imageError && pkg.image ? (
          <img
            className="all-food-imgs package-card-image"
            src={pkg.image}
            alt={pkg.name}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <ImageFallback className="all-food-imgs package-card-image" />
        )}
      </div>

      {/* Details Section */}
      <div className="all-food-sub package-card-details">
        {/* Package Name */}
        <h3 className="cheez-hotdog package-card-title">{pkg.name}</h3>

        {/* Package Description (Optional) */}
        {pkg.description && (
          <p className="package-card-description">
            {pkg.description.length > 80
              ? `${pkg.description.substring(0, 80)}...`
              : pkg.description}
          </p>
        )}

        {/* Price and Subscribe Button Row */}
        <div className="package-card-footer">
          <p className="rupess-ten package-card-price">
            {formatCurrency(pkg.price)}
          </p>
          <div className="subscribe-action">
            <button
              type="button"
              className="subscribe-button"
              onClick={handleSubscribeClick}
              disabled={isSubscribing}
            >
              {isSubscribing ? "Processing..." : "Subscribe"}
            </button>
            {subscribeError && (
              <p className="error-text subscribe-error">{subscribeError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Styles should be in global CSS */}
      <style>{`
        /* --- Keep relevant styles --- */
        .package-card { display: flex; flex-direction: column; background-color: white; border-radius: 8px; border: 1px solid var(--btn-border-colors, #e5e7eb); overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1); transition: box-shadow 0.2s ease-in-out; cursor: pointer; }
        .package-card:hover { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); }
        .package-card-image-container { width: 100%; aspect-ratio: 16 / 10; overflow: hidden; }
        .package-card-image { display: block; width: 100%; height: 100%; object-fit: cover; }
        .package-card-details { padding: 12px; display: flex; flex-direction: column; flex-grow: 1; }
        .package-card-title { font-size: 1rem; font-weight: 600; color: var(--text-color, #1f2937); margin-bottom: 4px; line-height: 1.4; }
        .package-card-description { font-size: 0.8rem; color: var(--sub-text-color, #6b7280); line-height: 1.5; margin-bottom: 12px; flex-grow: 1; }
        .package-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 8px; }
        .package-card-price { font-size: 1rem; font-weight: 700; color: var(--text-color, #111827); margin: 0; }
        .subscribe-action { display: flex; flex-direction: column; align-items: flex-end; }
        .subscribe-button { background-color: #FFC107; color: #1f2937; border: 1px solid #eab308; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; line-height: 1.2; cursor: pointer; transition: background-color 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); white-space: nowrap; }
        .subscribe-button:hover { background-color: #f59e0b; border-color: #d97706; box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1); }
        .subscribe-button:active { background-color: #d97706; }
        .subscribe-button:disabled { opacity: 0.7; cursor: not-allowed; }
        .subscribe-error { color: red; font-size: 0.75em; margin-top: 4px; text-align: right; }
        .fallback-image { display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; color: #9ca3af; font-size: 0.8em; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-bottom: 1px solid #e5e7eb; }
      `}</style>
    </div>
  );
};

export default PackageCard;
