// src/components/packages/PackageCard.tsx
import React, { useState } from "react";
import type { Package as IPackage } from "../../types";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { supabase } from "../../lib/supabaseClient";

interface PackageCardProps {
  pkg: IPackage;
  hasAddressInfo: boolean;
}

// Currency formatting (CAD as per your update)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-CA", {
    // Changed to CAD
    style: "currency",
    currency: "CAD", // Changed to CAD
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ImageFallback = ({ className }: { className?: string }) => (
  <div className={`fallback-image ${className || ""}`}>
    <span>Image N/A</span>
  </div>
);

const stripePublishableKey = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
if (!stripePublishableKey) {
  console.error(
    "Stripe Publishable Key (PUBLIC_STRIPE_PUBLISHABLE_KEY) is missing."
  );
} else {
  stripePromise = loadStripe(stripePublishableKey);
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, hasAddressInfo }) => {
  const [imageError, setImageError] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const handleImageError = () => setImageError(true);

  const handleSubscribeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscribeError(null);
    if (!hasAddressInfo) {
      alert(
        "Please complete your delivery address and city in your profile before subscribing."
      );
      window.location.href = "/profile";
      return;
    }
    setIsSubscribing(true);
    if (!stripePublishableKey || !stripePromise) {
      setSubscribeError("Payment system is not configured.");
      setIsSubscribing(false);
      return;
    }
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "create-stripe-checkout-session",
        { body: { packageId: pkg.id } }
      );
      if (functionError)
        throw new Error(
          data?.error ||
            functionError.message ||
            "Could not initiate subscription."
        );
      if (data?.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe.js failed to load.");
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (stripeError)
          throw new Error(
            stripeError.message || "Failed to redirect to payment page."
          );
      } else {
        throw new Error(data?.error || "Could not retrieve checkout session.");
      }
    } catch (error) {
      setSubscribeError((error as Error).message);
      setIsSubscribing(false);
    }
  };

  const packageTypeDisplay =
    pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1);

  return (
    <div className="package-card">
      <div className="package-card-image-container">
        {!imageError && pkg.image_url ? (
          <img
            className="package-card-image" // Removed all-food-imgs, assuming covered by new styles
            src={pkg.image_url}
            alt={pkg.name}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <ImageFallback className="package-card-image" />
        )}
      </div>

      <div className="package-card-details">
        <h3 className="package-card-title">{pkg.name}</h3>

        <div className="package-meta-info">
          <span>{packageTypeDisplay}</span>
          {/* Only show days if it's relevant and > 0 */}
          {pkg.days > 0 && <span>{pkg.days} Days</span>}
        </div>

        {pkg.description && (
          <p className="package-card-description">
            {pkg.description.length > 70
              ? `${pkg.description.substring(0, 70)}...`
              : pkg.description}
          </p>
        )}

        <div className="package-card-footer">
          <p className="package-card-price">{formatCurrency(pkg.price)}</p>
          <div className="subscribe-action">
            <button
              type="button"
              className="subscribe-button"
              onClick={handleSubscribeClick}
              disabled={isSubscribing || !stripePublishableKey}
            >
              {isSubscribing ? "Processing..." : "Subscribe"}
            </button>
            {subscribeError && (
              <p className="subscribe-error">{subscribeError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
