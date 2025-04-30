// src/services/addon-order.service.ts
import type { ApiResponse, IOrderFE } from "../types";

// ... existing code (API_BASE_URL, handleResponse, getAuthToken etc) ...
import { getCartItems } from "../utils/cart"; // Import cart items getter

import { getAuthToken, handleResponse } from "../utils/api";

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;
const ADDON_ORDER_ENDPOINT = `${API_BASE_URL}/addon-orders`;

// Interface for the expected request body DTO format on backend
interface CreateAddonOrderPayload {
  originalOrderId: string;
  deliveryDate: string; // ISO String
  addons: { addonId: string; quantity: number }[];
}

// Interface for the expected success response data
interface InitiatePaymentResponse {
  clientSecret: string;
  addonOrderId: string;
}

/**
 * Calls the backend to initiate payment for addons for a specific order and date.
 * Creates a Stripe Payment Intent and a preliminary AddonOrder.
 * @returns Promise<ApiResponse<InitiatePaymentResponse>>
 */
export const initiateAddonPaymentApi = async (
  originalOrderId: string,
  deliveryDate: Date // Pass Date object, convert inside
): Promise<ApiResponse<InitiatePaymentResponse>> => {
  const token = getAuthToken();
  if (!token) return { success: false, message: "Please log in." };

  const cartItems = getCartItems(); // Get current addons from cart
  if (cartItems.length === 0) {
    return { success: false, message: "Addon cart is empty." };
  }

  const payload: CreateAddonOrderPayload = {
    originalOrderId,
    deliveryDate: deliveryDate.toISOString(), // Convert Date to ISO string
    addons: cartItems.map((item) => ({
      // Map CartItems to payload format
      addonId: item.addonId,
      quantity: item.quantity,
    })),
  };

  try {
    const response = await fetch(`${ADDON_ORDER_ENDPOINT}/initiate-payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    // Expects { success: true, data: { clientSecret, addonOrderId } }
    return await handleResponse<InitiatePaymentResponse>(response);
  } catch (error) {
    console.error("Initiate Addon Payment API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to initiate addon payment.",
    };
  }
};
