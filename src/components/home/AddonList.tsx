// src/components/home/AddonList.tsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import type { Addon } from "../../types"; // Ensure this path is correct
import {
  getAllAddons,
  addOrIncrementAddon,
} from "../../services/addon.service"; // Updated service
import { formatCurrencyCAD } from "../../utils/currency"; // Assuming this is correct

interface AddonListProps {
  showAll?: boolean; // To display all items or a limited number (e.g., for homepage)
}

const AddonList: React.FC<AddonListProps> = ({ showAll = false }) => {
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddonsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllAddons(); // Uses Supabase now
        setAllAddons(data);
        if (data.length === 0 && !showAll) {
          // Check if no addons and not on "all addons" page
          // No error needed if it's just an empty list for the homepage snippet
        }
      } catch (err: any) {
        const errorMessage =
          err.message || "Could not load addons. Please try again later.";
        setError(errorMessage);
        console.error("Error fetching addons in component:", err);
        setAllAddons([]); // Ensure addons list is empty on error
      } finally {
        setLoading(false);
      }
    };
    fetchAddonsData();
  }, [showAll]); // Re-fetch if showAll changes, though typically it won't for a mounted component

  const handleOrderClick = (addon: Addon) => {
    console.log("Order clicked for:", addon.name, addon.id); // Use addon.id
    addOrIncrementAddon(addon); // Uses updated Addon type

    Swal.fire({
      title: "Added to Cart!",
      text: `${addon.name} has been added to your cart.`,
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Checkout",
      cancelButtonText: "Add More",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
      timer: 3000, // Auto close after 3 seconds
      timerProgressBar: true,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/checkout"; // Ensure this is your checkout page URL
      }
    });
  };

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    event.currentTarget.src = "/assets/images/placeholder-image.png"; // Ensure this placeholder exists
    event.currentTarget.alt = "Image unavailable";
  };

  const addonsToDisplay = showAll ? allAddons : allAddons.slice(0, 4); // Display 4 on homepage, all on all-addons page

  if (loading) {
    return (
      <div className="text-center py-5 text-gray-500">Loading addons...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5 text-red-600">
        Error loading addons: {error}
      </div>
    );
  }

  // If on homepage (not showAll) and no addons after loading, render nothing for this section
  if (!showAll && allAddons.length === 0) {
    return null;
  }

  // If on the dedicated "all addons" page (showAll is true) and no addons.
  if (showAll && addonsToDisplay.length === 0) {
    return (
      <div className="text-center py-5 text-gray-500">
        No addons currently available.
      </div>
    );
  }

  return (
    <div className={`trending-meals-main ${!showAll ? "mb-8" : ""}`}>
      <div className="d-flex align-items-center justify-content-between offers-main">
        <h2>{showAll ? "All Available Addons" : "Delicious Addons 🥤"}</h2>
        {!showAll && allAddons.length > 4 && (
          <a href="/all-addons" className="view-all-link">
            View all
            <svg className="view-all-arrow" /* ... svg path ... */>
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
      </div>

      <div
        className={
          showAll ? "addons-grid-container" : "addons-scroll-container" // Assuming these classes provide appropriate layout
        }
      >
        {addonsToDisplay.map((addon) => (
          <div key={addon.id} className="trending-meals-contain-main">
            {" "}
            {/* Use addon.id */}
            <div className="trending-meals">
              <img
                className="addon-image" // Ensure this class styles appropriately
                src={addon.image_url || "/assets/images/placeholder-image.png"} // Use image_url and a fallback
                alt={addon.name}
                onError={handleImageError}
                loading="lazy"
              />
            </div>
            <div className="addon-details">
              <div>
                <h3 className="Jakila" title={addon.name}>
                  {" "}
                  {/* Ensure Jakila class is intended */}
                  {addon.name}
                </h3>
                <p className="addon-price">{formatCurrencyCAD(addon.price)}</p>
              </div>
              <button
                onClick={() => handleOrderClick(addon)}
                className="addon-order-button" // Ensure this class styles appropriately
              >
                Add to Order
              </button>
            </div>
          </div>
        ))}
        {!showAll && addonsToDisplay.length > 0 && (
          <div className="scroll-spacer"></div>
        )}{" "}
        {/* Add spacer only if items exist */}
      </div>
    </div>
  );
};

export default AddonList;
