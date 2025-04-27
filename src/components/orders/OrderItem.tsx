// src/components/orders/OrderItem.tsx
import React, { useState } from "react";
import type { IOrderFE, OrderStatus } from "../../types";
// Import react-icons for status, date etc.
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineHashtag,
  HiOutlineBriefcase,
} from "react-icons/hi2"; // Example icons

interface OrderItemProps {
  order: IOrderFE;
}

// Helper: Format Date (Only Date part)
const formatDateOnly = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      // Use Canadian locale
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// Helper: Format Currency (CAD)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

// Status Badge Component (Adapt from previous examples or use new logic)
const OrderStatusDisplay = ({ status }: { status: OrderStatus }) => {
  let icon = <HiOutlineClock className="icon" />; // Default: Active/Pending?
  let textClass = "status-active"; // Default class

  switch (status) {
    case "Active":
      icon = <HiOutlineCheckCircle className="icon icon-active" />;
      textClass = "status-active";
      break;
    case "Expired":
      icon = <HiOutlineClock className="icon icon-expired" />; // Or a specific expired icon
      textClass = "status-expired";
      break;
    case "Cancelled":
      icon = <HiOutlineXCircle className="icon icon-cancelled" />;
      textClass = "status-cancelled";
      break;
  }

  return (
    <span className={`order-status ${textClass}`}>
      {icon} {status}
    </span>
  );
};

// Simple image fallback placeholder
const ImageFallback = ({ className }: { className?: string }) => (
  <div className={`fallback-image order-item-image ${className || ""}`}>
    <span>N/A</span>
  </div>
);

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  const [imageError, setImageError] = useState(false);
  const handleImageError = () => setImageError(true);

  // Placeholder click handler
  const handleOrderClick = () => {
    alert(`View details for Order #${order.orderNumber}`);
    // Navigate to order detail page later: window.location.href = `/orders/${order._id}`;
  };

  const packageImageUrl = order.package?.image; // Get image URL from populated package

  return (
    // Use a list item or div structure based on your template's styling
    // Applying card-like styles as an example
    <div className="order-item-card" onClick={handleOrderClick}>
      {/* Optional Image */}
      <div className="order-item-image-container">
        {!imageError && packageImageUrl ? (
          <img
            src={packageImageUrl}
            alt={order.packageName}
            className="order-item-image"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <ImageFallback className="order-item-image" />
        )}
      </div>

      {/* Order Details */}
      <div className="order-item-details">
        <div className="order-item-header">
          <span className="order-number">
            <HiOutlineHashtag className="icon" /> #{order.orderNumber}
          </span>
          <OrderStatusDisplay status={order.status} />
        </div>
        <h3 className="package-name">
          <HiOutlineBriefcase className="icon" /> {order.packageName}
        </h3>
        <div className="order-dates">
          <span className="date-item">
            <HiOutlineCalendarDays className="icon" />
            Starts: {formatDateOnly(order.startDate)}
          </span>
          <span className="date-item">
            <HiOutlineCalendarDays className="icon" />
            Ends: {formatDateOnly(order.endDate)}
          </span>
        </div>
        <p className="order-price">
          <HiOutlineCurrencyRupee className="icon" />{" "}
          {/* Use CAD icon if available */}
          {formatCurrency(order.packagePrice)}
        </p>
        {/* Optionally display delivery address snippet */}
        {/* <p className="order-address-snippet">{order.deliveryAddress?.address?.substring(0, 30)}...</p> */}
      </div>

      {/* Add necessary styles globally or scoped */}
      <style>{`
                /* --- Order Item Card Styles (Example) --- */
                .order-item-card {
                    display: flex;
                    gap: 1rem;
                    background-color: white;
                    border: 1px solid #e5e7eb; /* Example border */
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem; /* Space between orders */
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    cursor: pointer;
                    transition: box-shadow 0.2s ease;
                }
                .order-item-card:hover {
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                /* --- Image --- */
                .order-item-image-container {
                    flex-shrink: 0;
                    width: 80px; /* Adjust size */
                    height: 80px;
                    border-radius: 6px;
                    overflow: hidden;
                    background-color: #f3f4f6; /* Fallback bg */
                }
                .order-item-image {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .fallback-image.order-item-image {
                    display: flex; align-items: center; justify-content: center;
                    color: #9ca3af; font-size: 0.7em;
                }

                /* --- Details --- */
                .order-item-details {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem; /* Space between details */
                }
                .order-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8em;
                    color: #6b7280; /* Gray text */
                }
                .order-number { display: flex; align-items: center; gap: 0.2rem; font-weight: 500; }
                .order-status { display: flex; align-items: center; gap: 0.3rem; font-weight: 500; font-size: 0.85em; padding: 2px 6px; border-radius: 4px; }
                .order-status .icon { width: 14px; height: 14px; }
                .status-active { color: #166534; background-color: #dcfce7; } /* Example Green */
                .status-expired { color: #78716c; background-color: #f5f5f4; } /* Example Gray */
                .status-cancelled { color: #991b1b; background-color: #fee2e2; } /* Example Red */
                .icon-active { color: #16a34a; }
                .icon-expired { color: #a8a29e; }
                .icon-cancelled { color: #dc2626; }

                .package-name {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1f2937; /* Darker text */
                    margin: 0.1rem 0;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
                 .package-name .icon { width: 16px; height: 16px; color: #9ca3af; }

                .order-dates {
                    display: flex;
                    flex-direction: column; /* Stack dates */
                    /* Or: flex-direction: row; gap: 1rem; */
                    font-size: 0.8em;
                    color: #6b7280;
                    margin-bottom: 0.25rem;
                }
                 .date-item { display: flex; align-items: center; gap: 0.3rem; }
                 .date-item .icon { width: 14px; height: 14px; }

                 .order-price {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: #111827;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                 }
                  .order-price .icon { width: 16px; height: 16px; }

            `}</style>
    </div>
  );
};

export default OrderItem;
