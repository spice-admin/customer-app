// src/components/addons/AddonList.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { Addon } from "../../types/addon.types"; // Adjust path as needed
import { fetchAddons } from "../../services/addon.service"; // Adjust path as needed
import AddonCard from "./AddonCard";
import "./css/AddonList.css"; // We will create this CSS file next

interface AddonListProps {
  displayLimit?: number; // Number of addons to show, if undefined or 0, shows all
  showViewMoreLink?: boolean; // Whether to show a "View More" link if limit is applied
  viewMoreLinkHref?: string; // The URL for the "View More" link (e.g., "/all-addons")
  listTitle?: string; // Optional title for the addons section
  layout?: "scroll" | "grid"; // For home screen horizontal scroll or all addons grid
}

const AddonList: React.FC<AddonListProps> = ({
  displayLimit,
  showViewMoreLink = false,
  viewMoreLinkHref = "/all-addons", // Default link for "View More"
  listTitle,
  layout = "grid", // Default to grid layout
}) => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAddonsCount, setTotalAddonsCount] = useState<number>(0); // To know if "View More" is needed

  useEffect(() => {
    const loadAddons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allAddonsData = await fetchAddons({
          sortBy: "created_at",
          ascending: false,
        });
        setTotalAddonsCount(allAddonsData.length);
        if (
          displayLimit &&
          displayLimit > 0 &&
          displayLimit < allAddonsData.length
        ) {
          setAddons(allAddonsData.slice(0, displayLimit));
        } else {
          setAddons(allAddonsData);
        }
      } catch (err: any) {
        console.error("Error fetching addons:", err);
        setError(err.message || "Failed to load addons.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAddons();
  }, [displayLimit]); // Re-fetch if displayLimit changes (though usually it's fixed per instance)

  // const handleAddToCart = useCallback((addon: Addon) => {
  //   // Placeholder for Add to Cart logic
  //   // In a real app, this would interact with a cart state/context or make an API call
  //   console.log("Added to cart (placeholder):", addon.name, addon.id);
  //   alert(`${addon.name} added to cart! (This is a placeholder action)`);
  //   // Example: updateCart([...cartItems, { ...addon, quantity: 1 }]);
  // }, []);

  if (isLoading) {
    return (
      <div className="addon-list-loading">
        {listTitle && <h2 className="addon-list-title">{listTitle}</h2>}
        <p>Loading addons...</p>
        {/* Optional: Add skeleton loaders for cards */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="addon-list-error">
        {listTitle && <h2 className="addon-list-title">{listTitle}</h2>}
        <p>Error: {error}</p>
      </div>
    );
  }

  if (addons.length === 0) {
    return (
      <div className="addon-list-empty">
        {listTitle && <h2 className="addon-list-title">{listTitle}</h2>}
        <p>No addons available at the moment.</p>
      </div>
    );
  }

  const canShowViewMore =
    showViewMoreLink &&
    displayLimit &&
    displayLimit > 0 &&
    totalAddonsCount > displayLimit;

  return (
    <section className={`addon-list-section layout-${layout}`}>
      {listTitle && (
        <div className="addon-list-header">
          <h2 className="addon-list-title">{listTitle}</h2>
          {canShowViewMore && (
            <a href={viewMoreLinkHref} className="addon-list-view-more">
              View More &rarr;
            </a>
          )}
        </div>
      )}

      <div
        className={`addon-list-container ${
          layout === "scroll" ? "scroll-container" : "grid-container"
        }`}
      >
        {addons.map((addon) => (
          <div
            key={addon.id}
            className={`addon-item-wrapper ${
              layout === "scroll" ? "scroll-item" : "grid-item"
            }`}
          >
            {/* onAddToCart prop is removed from AddonCard */}
            <AddonCard addon={addon} />
          </div>
        ))}
      </div>

      {!listTitle &&
        canShowViewMore && ( // Show "View More" at bottom if no title/header area
          <div className="addon-list-footer-view-more">
            <a href={viewMoreLinkHref} className="addon-list-view-more-button">
              View All Addons
            </a>
          </div>
        )}
    </section>
  );
};

export default AddonList;
