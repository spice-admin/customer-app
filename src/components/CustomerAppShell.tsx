// src/components/CustomerAppShell.tsx
import React from "react";
import { CartProvider } from "../context/CartContext";
import AddonList from "./home/AddonList";
import "./home/css/AddonCard.css";
import "./home/css/AddonList.css";
import CartView from "./cart/CartView";

interface CustomerAppShellProps {
  pageName: "home" | "all-addons" | "cart"; // Or other page identifiers
}

const CustomerAppShell: React.FC<CustomerAppShellProps> = ({ pageName }) => {
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
