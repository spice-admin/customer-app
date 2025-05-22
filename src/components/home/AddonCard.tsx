// src/components/addons/AddonCard.tsx
import React from "react";
import type { Addon } from "../../types/addon.types"; // Adjust path as needed
import { useCart } from "../../context/CartContext"; // Adjust path as needed
import { FiShoppingCart, FiPlus, FiMinus } from "react-icons/fi"; // Example icons

interface AddonCardProps {
  addon: Addon;
  // onAddToCart callback is no longer strictly needed here if we use context directly
  // but parent might still want to know, for now, let's handle actions via context.
}

// Helper for navigation (replace with your app's actual navigation)
const navigateToCartPage = () => {
  console.log("Navigating to cart page...");
  // Example for Astro MPA:
  window.location.href = "/cart";
  // If using React Router, you'd use the `useNavigate` hook:
  // const navigate = useNavigate(); navigate('/cart');
  alert(
    "Placeholder: Would navigate to Cart Page. Implement your app's navigation."
  );
};

const AddonCard: React.FC<AddonCardProps> = ({ addon }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantityInCart = getItemQuantity(addon.id);

  const fallbackImage =
    "https://via.placeholder.com/150/F0F0F0/999999?text=No+Image";

  const handleAdd = () => {
    addToCart(addon); // This will add 1 if not present, or increment if it is
  };

  const handleIncrease = () => {
    updateQuantity(addon.id, quantityInCart + 1);
  };

  const handleDecrease = () => {
    updateQuantity(addon.id, quantityInCart - 1); // updateQuantity handles removal if <= 0
  };

  return (
    <div className="addon-card">
      <div className="addon-card-image-container">
        <img
          src={addon.image_url || fallbackImage}
          alt={addon.name}
          className="addon-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
            (e.target as HTMLImageElement).classList.add("image-error");
          }}
        />
      </div>
      <div className="addon-card-content">
        <h3 className="addon-card-name" title={addon.name}>
          {addon.name}
        </h3>
        <p className="addon-card-price">${addon.price.toFixed(2)} CAD</p>

        {/* --- DYNAMIC BUTTON AREA --- */}
        <div className="addon-card-actions">
          {quantityInCart === 0 ? (
            <button
              className="addon-card-button add-button"
              onClick={handleAdd}
              aria-label={`Add ${addon.name} to cart`}
            >
              <FiShoppingCart className="button-icon" /> Add to Cart
            </button>
          ) : (
            <div className="addon-quantity-controls">
              <button
                onClick={handleDecrease}
                className="quantity-button minus-button"
                aria-label={`Decrease quantity of ${addon.name}`}
              >
                <FiMinus />
              </button>
              <span
                className="quantity-display"
                onClick={navigateToCartPage} // Click quantity to go to cart
                title="View Cart"
                aria-label={`Current quantity of ${addon.name} is ${quantityInCart}, click to view cart`}
                tabIndex={0} // Make it focusable
                onKeyPress={(e) => {
                  if (e.key === "Enter") navigateToCartPage();
                }} // Keyboard navigation
              >
                {quantityInCart}
              </span>
              <button
                onClick={handleIncrease}
                className="quantity-button plus-button"
                aria-label={`Increase quantity of ${addon.name}`}
              >
                <FiPlus />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddonCard;
