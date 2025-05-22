// src/components/CartProviderWrapper.tsx
import React, { type ReactNode } from "react";
import { CartProvider } from "../context/CartContext"; // Adjust path

interface CartProviderWrapperProps {
  children: ReactNode;
}

const CartProviderWrapper: React.FC<CartProviderWrapperProps> = ({
  children,
}) => {
  return <CartProvider>{children}</CartProvider>;
};

export default CartProviderWrapper;
