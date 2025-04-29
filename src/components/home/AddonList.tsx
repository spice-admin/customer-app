// src/components/home/AddonList.tsx
import React, { useState, useEffect } from "react";
import type { Addon } from "../../types";
import Swal from "sweetalert2";
import { getAllAddons } from "../../services/addon.service";
import { formatCurrencyCAD } from "../../utils/currency";
// --- MODIFIED: Import the correct cart function ---
import { addOrIncrementAddon } from "../../utils/cart";

interface AddonListProps {
  showAll?: boolean;
}

const AddonList: React.FC<AddonListProps> = ({ showAll = false }) => {
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ... fetch logic remains the same ...
    const fetchAddons = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllAddons();
        setAllAddons(data);
      } catch (err: any) {
        setError(err.message || "Could not load addons.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAddons();
  }, []);

  const handleOrderClick = (addon: Addon) => {
    console.log("Order clicked for:", addon.name, addon._id);
    // --- MODIFIED: Call utility function directly ---
    addOrIncrementAddon(addon);

    // Show SweetAlert confirmation if item was newly added
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
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("Redirecting to checkout...");
        window.location.href = "/checkout";
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        console.log("User wants to add more.");
      }
    });
  };

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    // ... remains the same ...
    event.currentTarget.src = "/assets/images/placeholder-image.png";
    event.currentTarget.alt = "Image unavailable";
  };

  const addonsToDisplay = showAll ? allAddons : allAddons.slice(0, 4);

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

  if (!showAll && allAddons.length === 0) {
    return null;
  }

  return (
    // Use the main container class from template/CSS
    <div className={`trending-meals-main ${!showAll ? "mb-8" : ""}`}>
      {/* Section Header */}
      <div className="d-flex align-items-center justify-content-between offers-main">
        {/* H2 already styled by .offers-main h2 in CSS */}
        <h2>{showAll ? "All Available Addons" : "Delicious Addons 🥤"}</h2>
        {!showAll && allAddons.length > 4 && (
          // Use the specific class for the link
          <a href="/all-addons" className="view-all-link">
            View all
            {/* SVG styled by .view-all-arrow in CSS */}
            <svg
              className="view-all-arrow"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
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

      {showAll && addonsToDisplay.length === 0 && (
        <div className="text-center py-5 text-gray-500">
          No addons currently available.
        </div>
      )}

      {/* Addon Cards Container */}
      {/* Apply conditional class for layout */}
      <div
        className={
          showAll ? "addons-grid-container" : "addons-scroll-container"
        }
      >
        {addonsToDisplay.map((addon) => (
          // Use the card wrapper class from template/CSS
          <div key={addon._id} className="trending-meals-contain-main">
            {/* Image Container - Use template class */}
            <div className="trending-meals">
              <img
                // Use specific addon image class
                className="addon-image"
                src={addon.image}
                alt={addon.name}
                onError={handleImageError}
                loading="lazy"
              />
            </div>
            {/* Details Container - Use specific addon class */}
            <div className="addon-details">
              <div>
                {" "}
                {/* Group name and price */}
                {/* Addon Name - Use template class */}
                <h3 className="Jakila" title={addon.name}>
                  {addon.name}
                </h3>
                {/* Addon Price - Use specific class */}
                <p className="addon-price">{formatCurrencyCAD(addon.price)}</p>
              </div>
              {/* Order Button - Use specific class */}
              <button
                onClick={() => handleOrderClick(addon)}
                className="addon-order-button"
                // Inline style removed, color handled by CSS class
              >
                Add to Order
              </button>
            </div>
          </div>
        ))}
        {/* Sentinel for horizontal scroll spacing */}
        {!showAll && <div className="scroll-spacer"></div>}
      </div>
    </div>
  );
};

export default AddonList;
