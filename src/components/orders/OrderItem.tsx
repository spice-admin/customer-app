// src/components/orders/OrderItem.tsx
import React from "react";
import type { IOrderFE } from "../../types"; // Adjust path as needed
import { format } from "date-fns"; // npm install date-fns

// --- React Icons Imports ---
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTag,
  FaDollarSign,
  FaShippingFast,
  FaCheckCircle,
  FaRegClock,
  FaTimesCircle,
  FaInfoCircle,
  FaQuestionCircle,
  FaRegListAlt,
} from "react-icons/fa";
import {
  BsCalendarRange,
  BsBoxSeam,
  BsCashCoin,
  BsGeoAlt,
  BsTagFill,
  BsClockHistory,
  BsTruck,
  BsXCircleFill,
  BsCheckCircleFill,
  BsQuestionCircleFill,
  BsInfoCircleFill,
} from "react-icons/bs";
// --- End React Icons Imports ---

interface OrderItemProps {
  order: IOrderFE;
  onViewDetails?: (orderId: string) => void;
  onTrackOrder?: (orderId: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({
  order,
  onViewDetails,
  onTrackOrder,
}) => {
  const formatDate = (
    dateString?: string | null,
    dateFormat = "MMM dd, yyyy"
  ) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), dateFormat);
    } catch (e) {
      return dateString;
    }
  };

  const getStatusInfo = (status?: string | null) => {
    const s = status?.toLowerCase() || "unknown";
    let statusClassName = "status-unknown";
    let IconComponent: React.ElementType = BsInfoCircleFill;
    let label = status ? status.replace(/_/g, " ").toUpperCase() : "UNKNOWN";

    if (s.includes("delivered") || s.includes("completed")) {
      statusClassName = "status-delivered";
      IconComponent = BsCheckCircleFill;
      label = "Delivered";
    } else if (
      s.includes("pending") ||
      s.includes("awaiting") ||
      s.includes("confirmation")
    ) {
      statusClassName = "status-pending";
      IconComponent = BsClockHistory;
      label = "Pending";
    } else if (
      s.includes("shipped") ||
      s.includes("out_for_delivery") ||
      s.includes("processing")
    ) {
      statusClassName = "status-in-transit";
      IconComponent = BsTruck;
      label = "In Transit";
    } else if (s.includes("cancelled") || s.includes("failed")) {
      statusClassName = "status-cancelled";
      IconComponent = BsXCircleFill;
      label = "Cancelled";
    }
    return { statusClassName, IconComponent, label };
  };

  const statusInfo = getStatusInfo(order.order_status);

  return (
    <div className="order-item-card">
      {/* Header Section */}
      <div
        className={`order-item-header ${statusInfo.statusClassName}-header-bg`}
      >
        <div className="order-item-header-content">
          <div className="order-item-title-group">
            <BsBoxSeam className="order-item-main-icon" />
            <div>
              <h3 className="order-item-title">
                {order.package_name || "Order Details"}
              </h3>
              <p className="order-item-id">ID: {order.id.substring(0, 8)}...</p>
            </div>
          </div>
          <div
            className={`order-item-status-badge ${statusInfo.statusClassName}`}
          >
            <statusInfo.IconComponent className="order-item-status-icon" />
            <span>{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="order-item-body">
        <div className="order-item-details-grid">
          <div className="order-item-detail-item">
            <BsCashCoin className="order-item-detail-icon icon-price" />
            <span>
              Total:{" "}
              <strong className="order-item-detail-value">
                ${order.package_price?.toFixed(2) || "0.00"}
              </strong>
            </span>
          </div>
          <div className="order-item-detail-item">
            <BsCalendarRange className="order-item-detail-icon icon-date" />
            <span>
              Ordered:{" "}
              <span className="order-item-detail-value">
                {formatDate(order.order_date)}
              </span>
            </span>
          </div>

          {order.package_type && (
            <div className="order-item-detail-item">
              <BsTagFill className="order-item-detail-icon icon-type" />
              <span>
                Type:{" "}
                <span className="order-item-detail-value">
                  {order.package_type}
                </span>
              </span>
            </div>
          )}
          {order.package_days && (
            <div className="order-item-detail-item">
              <FaRegClock className="order-item-detail-icon icon-duration" />
              <span>
                Duration:{" "}
                <span className="order-item-detail-value">
                  {order.package_days} days
                </span>
              </span>
            </div>
          )}

          {order.delivery_start_date && (
            <div className="order-item-detail-item order-item-detail-fullwidth">
              <BsCalendarRange className="order-item-detail-icon icon-service-period" />
              <span>
                Service:{" "}
                <span className="order-item-detail-value">
                  {formatDate(order.delivery_start_date)} -{" "}
                  {formatDate(order.delivery_end_date)}
                </span>
              </span>
            </div>
          )}

          {order.delivery_address && (
            <div className="order-item-detail-item order-item-detail-address order-item-detail-fullwidth">
              <BsGeoAlt className="order-item-detail-icon icon-address" />
              <span>
                To:{" "}
                <span className="order-item-detail-value">
                  {order.delivery_address}, {order.delivery_city}{" "}
                  {order.delivery_postal_code}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section / Actions */}
      {(onViewDetails || onTrackOrder) && (
        <div className="order-item-footer">
          {onTrackOrder && statusInfo.label === "In Transit" && (
            <button
              onClick={() => onTrackOrder(order.id)}
              className="order-item-button button-track"
              aria-label="Track your order"
            >
              <FaShippingFast />
              Track Order
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(order.id)}
              className="order-item-button button-details"
              aria-label="View order details"
            >
              <FaRegListAlt />
              Details
            </button>
          )}
          <button
            onClick={() =>
              alert(
                `Help for order ${order.id.substring(
                  0,
                  8
                )}... (Not implemented)`
              )
            }
            className="order-item-button button-help"
            aria-label="Get help with this order"
          >
            <FaQuestionCircle />
            Get Help
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderItem;
