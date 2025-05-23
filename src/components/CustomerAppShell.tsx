// src/components/CustomerAppShell.tsx
import React from "react";
import { CartProvider } from "../context/CartContext";
import AddonList from "./home/AddonList";
import "./home/css/AddonCard.css";
import "./home/css/AddonList.css";
import CartView from "./cart/CartView";
import ScheduleAddonDeliveryWrapper from "./checkout/ScheduleAddonDelivery";
import CheckoutSummaryView from "./checkout/CheckoutSummaryView";
import AddonOrderFinalizer from "./checkout/AddonOrderFinalizer";

interface CustomerAppShellProps {
  pageName:
    | "home"
    | "all-addons"
    | "cart"
    | "order-selection"
    | "checkout-summary"
    | "addon-order-success"; // <--- ADDED 'addon-order-success'
  // To pass sessionId from Astro page to AddonOrderFinalizer
  sessionId?: string | null;
}

const CustomerAppShell: React.FC<CustomerAppShellProps> = ({
  pageName,
  sessionId,
}) => {
  let contentToRender;

  if (pageName === "home") {
    contentToRender = (
      <AddonList
        displayLimit={4}
        showViewMoreLink={true}
        viewMoreLinkHref="/all-addons" // Astro link
        listTitle="Tasty Addons"
        layout="scroll"
      />
    );
  } else if (pageName === "all-addons") {
    contentToRender = (
      <AddonList listTitle="All Available Addons" layout="grid" />
    );
  } else if (pageName === "cart") {
    contentToRender = <CartView />;
  } else if (pageName === "order-selection") {
    contentToRender = <ScheduleAddonDeliveryWrapper />;
  } else if (pageName === "checkout-summary") {
    // <--- NEW CASE
    contentToRender = <CheckoutSummaryView />;
  } else if (pageName === "addon-order-success") {
    // <--- NEW CASE
    contentToRender = <AddonOrderFinalizer sessionId={sessionId || null} />; // Pass sessionId
  } else {
    contentToRender = <div>Page not found</div>;
  }

  return (
    <CartProvider>
      {/* <HeaderWithCartIcon /> */}
      <main>{contentToRender}</main>
      {/* <Footer /> */}
    </CartProvider>
  );
};
export default CustomerAppShell;
