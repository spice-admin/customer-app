// src/services/payment.service.ts
import type { ApiResponse } from "../types"; // Import the generic API response type

// Define the expected structure of the data returned on success
interface CreateCheckoutSessionData {
  sessionId: string;
}

// Constants (ensure these match your auth setup)
const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  "https://spice-tiffin-backend-production.up.railway.app/api/v1";
const PAYMENT_ENDPOINT = `${API_BASE_URL}/payments`;
const AUTH_TOKEN_KEY =
  "7f57e24a0181b526fb106b2bad45d9f6c0717b88ea01d2dd0afae3594a69b8c0"; // Key used to store JWT

// Reusable response handler (Copy or import from shared utils)
// Ensure this handles errors correctly based on previous steps
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
 * Calls the backend to create a Stripe Checkout Session for a given package.
 * @param packageId The ID of the package the user wants to subscribe to.
 * @returns Promise<ApiResponse<CreateCheckoutSessionData>>
 */
export const createCheckoutSessionApi = async (
  packageId: string
): Promise<ApiResponse<CreateCheckoutSessionData>> => {
  const token = getAuthToken();
  if (!token) {
    console.warn("createCheckoutSessionApi: No auth token found.");
    return { success: false, message: "Please log in to subscribe." }; // User-friendly message
  }

  if (!packageId) {
    return { success: false, message: "Package ID is required." };
  }

  try {
    const response = await fetch(
      `${PAYMENT_ENDPOINT}/create-checkout-session`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Send the JWT
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId: packageId }), // Send packageId in the body
      }
    );
    // Expects { success: true, data: { sessionId: "..." } } on success
    return await handleResponse<CreateCheckoutSessionData>(response);
  } catch (error) {
    console.error("Create Checkout Session API failed:", error);
    return {
      success: false,
      message:
        (error as Error).message ||
        "Failed to initiate payment. Please try again.",
    };
  }
};
