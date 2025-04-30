// src/utils/api.ts
import type { ApiResponse } from "../types"; // Import the generic type

// Centralize the token key retrieval
const AUTH_TOKEN_KEY =
  import.meta.env.PUBLIC_AUTH_TOKEN_KEY || // Use PUBLIC_ prefix for frontend env vars accessible via import.meta.env
  import.meta.env.AUTH_TOKEN_KEY || // Fallback if defined differently
  "7f57e24a0181b526fb106b2bad45d9f6c0717b88ea01d2dd0afae3594a69b8c0"; // Default key

/**
 * Helper function to get the auth token from localStorage.
 * SAFEGUARD: Checks if window exists (for SSR compatibility).
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  console.warn(
    "getAuthToken: 'window' is not defined. Cannot access localStorage."
  );
  return null;
}

/**
 * Reusable function to handle fetch responses, parse JSON, and check for errors.
 * @param response The Fetch API Response object.
 * @returns Promise<ApiResponse<T>>
 * @throws Error If the response is not ok and cannot be parsed, or if API indicates failure.
 */
export async function handleResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>; // Declare data variable

  // Check if response is ok first
  if (!response.ok) {
    // Try to parse error json from backend
    try {
      data = await response.json();
      console.error("API Error Response:", data);
      // Use message from API response if available, otherwise use status text
      throw new Error(
        data?.message ||
          `HTTP error! Status: ${response.status} ${response.statusText}`
      );
    } catch (e) {
      // If parsing fails AND response is not ok, throw generic HTTP error
      console.error(
        "API Error: Could not parse error response body.",
        response.status,
        response.statusText
      );
      throw new Error(
        `HTTP error! Status: ${response.status} ${response.statusText}. Response not JSON.`
      );
    }
  }

  // If response IS ok, try to parse JSON
  try {
    data = await response.json();
    // Optional: Check for explicit success: false even with 2xx status if your API does that
    // if (data.success === false) {
    //    throw new Error(data.message || 'API returned success: false.');
    // }
  } catch (e) {
    // Handle cases where a 2xx response might not have a body or is not JSON
    console.warn(
      "API Success: Response body could not be parsed as JSON.",
      response.status,
      response.statusText
    );
    // Return a default success structure if appropriate for a 204 No Content etc.
    // This depends on your API design. If JSON is always expected, maybe throw error.
    // For now, let's assume a non-JSON 2xx is okay but has no data.
    data = {
      success: true,
      message: "OK (non-JSON response)",
      data: undefined as T,
    };
  }

  // Assuming data parsing succeeded or was handled, return it
  return data;
}
