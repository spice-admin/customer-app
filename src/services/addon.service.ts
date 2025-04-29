// src/services/addon.service.ts
import type { Addon } from "../types"; // Adjust path if needed

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string; // Optional message from backend
}

export const getAllAddons = async (): Promise<Addon[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/addons`); // Assuming public endpoint

    if (!response.ok) {
      // Try to parse error message from backend
      let errorMsg = `HTTP error! Status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (_) {
        /* Ignore parsing error */
      }
      throw new Error(errorMsg);
    }

    const result: ApiResponse<Addon[]> = await response.json();

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else {
      // Handle cases where success is false or data is not an array
      console.warn(
        "API returned success=false or invalid data structure for addons:",
        result
      );
      throw new Error(
        result.message || "Failed to fetch addons: Invalid data format."
      );
    }
  } catch (error: any) {
    console.error("Error fetching addons:", error);
    // Re-throw or return empty array based on how you want to handle errors upstream
    throw new Error(`Failed to fetch addons: ${error.message}`);
  }
};
