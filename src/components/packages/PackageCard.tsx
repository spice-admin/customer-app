// src/components/packages/PackageCard.tsx
import React, { useState } from "react";
import type { IPackageFE } from "../../types";

interface PackageCardProps {
  pkg: IPackageFE;
}

// Helper to format currency (assuming INR)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Simple image fallback placeholder
const ImageFallback = ({ className }: { className?: string }) => (
  <div className={`fallback-image ${className || ""}`}>
    <span>Image N/A</span>
    {/* Basic styles for fallback - can be moved to global CSS */}
    <style>{`
            .fallback-image {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f3f4f6; /* Tailwind gray-100 */
                color: #9ca3af; /* Tailwind gray-400 */
                font-size: 0.8em;
                width: 100%;
                aspect-ratio: 16 / 10; /* Adjust aspect ratio as needed */
                object-fit: cover;
                border-bottom: 1px solid #e5e7eb; /* Optional border */
            }
        `}</style>
  </div>
);

const PackageCard: React.FC<PackageCardProps> = ({ pkg }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Navigate to package detail page (placeholder)
  const handleCardClick = () => {
    console.log("Navigate to package detail:", pkg._id);
    alert(`Navigate to package detail: ${pkg.name} (ID: ${pkg._id})`);
  };

  // Subscribe Button Handler
  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when button is clicked
    console.log("Subscribe clicked for package:", pkg.name);
    alert(`Subscription started for ${pkg.name}!`); // Placeholder
  };

  return (
    // Use the main container class from the template, add layout styles
    <div className="all-food-main package-card" onClick={handleCardClick}>
      {/* Image */}
      <div className="package-card-image-container">
        {!imageError && pkg.image ? (
          <img
            className="all-food-imgs package-card-image" // Use template class + specific class
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
      {/* Use template class + specific class for easier styling */}
      <div className="all-food-sub package-card-details">
        {/* Package Name */}
        <h3 className="cheez-hotdog package-card-title">
          {" "}
          {/* Use template class + specific class */}
          {pkg.name}
        </h3>

        {/* Package Description (Optional) */}
        {pkg.description && (
          <p className="package-card-description">
            {/* Truncate long descriptions if necessary */}
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
          <button
            type="button"
            className="subscribe-button" // Specific class for styling
            onClick={handleSubscribeClick}
          >
            Subscribe
          </button>
        </div>
      </div>

      {/* Scoped styles - MOVE THESE TO YOUR GLOBAL CSS FILE */}
      <style>{`
                /* --- Card Container --- */
                .package-card {
                    /* Use template's .all-food-main styles + overrides */
                    display: flex;
                    flex-direction: column; /* Stack image and details vertically */
                    background-color: white; /* Example background */
                    border-radius: 8px; /* Match image radius */
                    border: 1px solid var(--btn-border-colors, #e5e7eb); /* Use variable or fallback */
                    overflow: hidden; /* Ensure content stays within rounded corners */
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1); /* Example shadow */
                    transition: box-shadow 0.2s ease-in-out;
                    cursor: pointer;
                }
                .package-card:hover {
                     box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); /* Example hover shadow */
                }

                /* --- Image --- */
                 .package-card-image-container {
                    width: 100%;
                    aspect-ratio: 16 / 10; /* Adjust aspect ratio */
                    overflow: hidden;
                 }
                 .package-card-image {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                 }

                /* --- Details Section --- */
                .package-card-details {
                    padding: 12px; /* Consistent padding */
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1; /* Allow details to fill remaining space */
                }

                /* --- Title --- */
                .package-card-title {
                    /* Use template's .cheez-hotdog styles + overrides */
                    font-size: 1rem; /* Adjust size */
                    font-weight: 600; /* Adjust weight */
                    color: var(--text-color, #1f2937); /* Use variable or fallback */
                    margin-bottom: 4px;
                    line-height: 1.4;
                     /* Prevent multiple lines if needed */
                     /* overflow: hidden; */
                     /* text-overflow: ellipsis; */
                     /* white-space: nowrap; */
                }

                /* --- Description --- */
                .package-card-description {
                    font-size: 0.8rem;
                    color: var(--sub-text-color, #6b7280); /* Use variable or fallback */
                    line-height: 1.5;
                    margin-bottom: 12px; /* Space before price/button */
                    flex-grow: 1; /* Allow description to push footer down */
                    /* Limit lines if needed */
                     /* display: -webkit-box; */
                     /* -webkit-line-clamp: 2; */ /* Show 2 lines */
                     /* -webkit-box-orient: vertical; */
                     /* overflow: hidden; */
                }

                /* --- Footer (Price & Button) --- */
                .package-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center; /* Vertically align price and button */
                    margin-top: auto; /* Pushes footer to bottom */
                    padding-top: 8px; /* Space above footer */
                }

                /* --- Price --- */
                .package-card-price {
                    /* Use template's .rupess-ten styles + overrides */
                    font-size: 1rem; /* Adjust size */
                    font-weight: 700; /* Bolder price */
                    color: var(--text-color, #111827);
                    margin: 0; /* Reset margin */
                }

                /* --- Subscribe Button (Height Adjusted) --- */
                .subscribe-button {
                    background-color: #FFC107;
                    color: #1f2937; /* Darker text for yellow */
                    border: 1px solid #eab308;
                    padding: 6px 14px; /* Increased vertical padding for height */
                    border-radius: 6px;
                    font-size: 0.8rem; /* Adjust font size */
                    font-weight: 600;
                    line-height: 1.2; /* Adjust line height */
                    cursor: pointer;
                    transition: background-color 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    white-space: nowrap;
                }
                .subscribe-button:hover {
                    background-color: #f59e0b;
                    border-color: #d97706;
                    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
                }
                .subscribe-button:active {
                     background-color: #d97706;
                }
            `}</style>
    </div>
  );
};

export default PackageCard;
