// src/components/packages/PackageCard.tsx
import React, { useState } from "react";
import type { IPackageFE } from "../../types"; // Import package type
// Optional: Import react-icons if needed for star/clock/heart
import {
  HiStar,
  HiOutlineClock,
  HiOutlineHeart,
  HiHeart,
} from "react-icons/hi2";

interface PackageCardProps {
  pkg: IPackageFE;
}

// Helper to format currency (assuming INR)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0, // Adjust if you need decimals
    maximumFractionDigits: 0,
  }).format(amount);
};

// Simple image fallback placeholder
const ImageFallback = ({ className }: { className?: string }) => (
  <div className={`fallback-image ${className || ""}`}>
    {" "}
    {/* Add a specific class */}
    {/* Placeholder content, e.g., an icon or text */}
    <span>Image N/A</span>
    <style>{`
            .fallback-image {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f0f0f0; /* Light gray */
                color: #999;
                font-size: 0.8em;
                /* Ensure it takes up image space */
                width: 100%;
                aspect-ratio: 4 / 3; /* Example aspect ratio */
                object-fit: cover; /* Maintain layout */
            }
        `}</style>
  </div>
);

const PackageCard: React.FC<PackageCardProps> = ({ pkg }) => {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // Placeholder like state

  const handleImageError = () => {
    setImageError(true);
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click if heart is clicked
    setIsLiked(!isLiked);
    // TODO: Add API call to save like status later
    console.log("Toggled like for package:", pkg._id);
  };

  const handleCardClick = () => {
    // Navigate to package detail page
    // Replace with Astro navigation or React Router later
    console.log("Navigate to package detail:", pkg._id);
    // window.location.href = `/package/${pkg._id}`; // Simple redirect for now
    alert(`Navigate to package detail: ${pkg.name} (ID: ${pkg._id})`); // Placeholder alert
  };

  // Placeholder data - replace with actual data if available
  const rating = 4.8;
  const ratingCount = "(1.7k)";
  const deliveryTime = "15 Min";
  const deliveryDistance = "(1 km)";
  const restaurantName = "SpiceBar Kitchen"; // Or derive from package if available

  return (
    // Use the main container class from the template
    // Added cursor-pointer and group for potential hover effects
    <div
      className="all-food-main cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="image-container">
        {" "}
        {/* Optional: wrapper for aspect ratio */}
        {!imageError && pkg.image ? (
          <img
            className="all-food-imgs" // Use template class
            src={pkg.image}
            alt={pkg.name}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <ImageFallback className="all-food-imgs" /> // Apply same class for layout consistency
        )}
      </div>

      {/* Details Section */}
      <div className="all-food-sub">
        {" "}
        {/* Use template class */}
        <div className="all-food-text-main">
          {" "}
          {/* Use template class */}
          <h3 className="cheez-hotdog">
            {" "}
            {/* Use template class */}
            {pkg.name}
          </h3>
          {/* Like Button - Using react-icons */}
          <button
            type="button"
            onClick={handleLikeToggle}
            className={`like-button ${isLiked ? "liked" : ""}`} // Add classes for styling
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            {
              isLiked ? (
                <HiHeart className="icon liked-icon" /> // Filled heart
              ) : (
                <HiOutlineHeart className="icon" />
              ) // Outline heart
            }
          </button>
          {/* Placeholder for template's like-heart class styling */}
          {/* <i className={`like-heart like-heart2 ${isLiked ? 'press' : ''}`} onClick={handleLikeToggle}></i> */}
        </div>
        {/* Rating & Time Info */}
        <div className="app">
          {" "}
          {/* Use template class */}
          <p className="rating">
            {" "}
            {/* Added specific class */}
            <HiStar className="star-icon" /> {/* react-icon */}
            {/* <img src="/assets/images/star.svg" alt="star" /> */}{" "}
            {/* Template's way */}
            {rating}
            {ratingCount}
          </p>
          <p className="delivery-info">
            {" "}
            {/* Added specific class */}
            <HiOutlineClock className="clock-icon" /> {/* react-icon */}
            {/* <img className="view-all-arrow" src="/assets/images/clock.svg" alt="clock" /> */}{" "}
            {/* Template's way */}
            {deliveryTime}
            {deliveryDistance}
          </p>
        </div>
        {/* Price */}
        <p className="rupess-ten">{formatCurrency(pkg.price)}</p>{" "}
        {/* Use template class */}
        {/* Optional: Restaurant/Source Name */}
        <p className="rupess-ten wel-fast-food">{restaurantName}</p>{" "}
        {/* Use template class */}
      </div>

      {/* Add minimal styles if needed, or rely on global CSS */}
    </div>
  );
};

export default PackageCard;
