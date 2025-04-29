// src/services/packageService.ts
import type { ApiResponse, ICategoryFE, IPackageFE } from "../types"; // Ensure types are defined

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;
const CATEGORIES_ENDPOINT = `${API_BASE_URL}/categories`;
const PACKAGES_ENDPOINT = `${API_BASE_URL}/packages`;

// Reusable response handler (Keep existing - ensure it handles errors correctly)
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}. Server returned non-JSON response.`
      );
    }
    data = {
      success: true,
      message: "Operation successful (non-JSON response)",
      data: undefined as T,
    };
  }
  if (!response.ok) {
    console.error("API Error Response:", data);
    throw new Error(data?.message || `HTTP error! Status: ${response.status}`);
  }
  return data;
}

// --- Category Function (Keep Existing) ---
export const getAllCategories = async (): Promise<ICategoryFE[]> => {
  try {
    const response = await fetch(CATEGORIES_ENDPOINT);
    const result = await handleResponse<ICategoryFE[]>(response);
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error; // Re-throw for the caller to handle
  }
};

// --- Package Function (Add or ensure exists) ---
export const getAllPackages = async (): Promise<IPackageFE[]> => {
  try {
    const response = await fetch(PACKAGES_ENDPOINT);
    // Expects backend to populate category: { _id, name }
    const result = await handleResponse<IPackageFE[]>(response);
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    throw error; // Re-throw for the caller to handle
  }
};
