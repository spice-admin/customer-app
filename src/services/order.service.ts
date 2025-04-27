// src/services/order.service.ts
import type { ApiResponse, IOrderFE } from "../types"; // Import relevant types

// Constants
const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  "https://spice-tiffin-backend-production.up.railway.app/api/v1";
const ORDER_ENDPOINT = `${API_BASE_URL}/orders`;
const AUTH_TOKEN_KEY =
  "7f57e24a0181b526fb106b2bad45d9f6c0717b88ea01d2dd0afae3594a69b8c0"; // Use the same key as auth components

// Reusable response handler (Copy or import from shared utils)
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}. Non-JSON response.`
      );
    }
    data = { success: true, message: "OK (non-JSON)", data: undefined as T };
  }
  if (!response.ok) {
    console.error("API Error:", data);
    throw new Error(data?.message || `HTTP error! Status: ${response.status}`);
  }
  return data;
}

/**
 * Helper function to get the auth token from localStorage.
 */
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Fetches the order history for the currently logged-in customer.
 * @returns Promise<ApiResponse<IOrderFE[]>>
 */
export const getMyOrdersApi = async (): Promise<ApiResponse<IOrderFE[]>> => {
  const token = getAuthToken();
  if (!token) {
    console.warn("getMyOrdersApi: No auth token found.");
    return { success: false, message: "Please log in to view orders." };
  }

  try {
    const response = await fetch(`${ORDER_ENDPOINT}/my`, {
      // Calls GET /api/v1/orders/my
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, // Send the JWT
        "Content-Type": "application/json",
      },
    });
    // Expects { success: true, data: [orders] } on success
    return await handleResponse<IOrderFE[]>(response);
  } catch (error) {
    console.error("Get My Orders API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch orders.",
    };
  }
};

// Add other order service functions later if needed (e.g., getOrderById)
