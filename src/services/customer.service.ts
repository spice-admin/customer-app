// src/services/customer.service.ts
import type {
  ApiResponse,
  ICustomerProfile,
  IProfileUpdateData,
} from "../types";

const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  "https://spice-tiffin-backend-production.up.railway.app/api/v1";
const CUSTOMER_ENDPOINT = `${API_BASE_URL}/customer`;
const AUTH_TOKEN_KEY =
  "7f57e24a0181b526fb106b2bad45d9f6c0717b88ea01d2dd0afae3594a69b8c0"; // Use the same key as auth components

// --- Reusable handleResponse (Copy or import from shared utils) ---
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
// --- End handleResponse ---

/**
 * Helper function to get the auth token from localStorage.
 * In a real app, token management might be more centralized.
 */
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    // Ensure runs only on client
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Fetches the profile of the currently logged-in customer.
 */
export const getMyProfileApi = async (): Promise<
  ApiResponse<ICustomerProfile>
> => {
  const token = getAuthToken();
  if (!token) {
    console.warn("getMyProfileApi: No auth token found.");
    // Return an error structure immediately or let fetch fail (which handleResponse catches)
    return { success: false, message: "Unauthorized: No token found." };
    // Or: throw new Error("Unauthorized: No token found.");
  }

  try {
    const response = await fetch(`${CUSTOMER_ENDPOINT}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", // Optional for GET, but good practice
      },
    });
    return await handleResponse<ICustomerProfile>(response);
  } catch (error) {
    console.error("Get Profile API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to fetch profile.",
    };
  }
};

/**
 * Updates the profile of the currently logged-in customer.
 */
export const updateMyProfileApi = async (
  updateData: IProfileUpdateData
): Promise<ApiResponse<ICustomerProfile>> => {
  const token = getAuthToken();
  if (!token) {
    console.warn("updateMyProfileApi: No auth token found.");
    return { success: false, message: "Unauthorized: No token found." };
  }

  try {
    const response = await fetch(`${CUSTOMER_ENDPOINT}/profile`, {
      method: "PUT", // Or PATCH if your backend uses that
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    // Expects updated profile data on success
    return await handleResponse<ICustomerProfile>(response);
  } catch (error) {
    console.error("Update Profile API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to update profile.",
    };
  }
};
