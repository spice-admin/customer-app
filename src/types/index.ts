// --- Generic API Response ---
// Matches the structure your backend controllers return
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T; // Data is optional, might not be present on error or some success cases
  error?: any; // Or specific error type if known
  errors?: any; // For validation errors from Zod potentially
  verificationRequired?: boolean; // Specific to login response
  token?: string; // Specific to login/verify response
}

// --- Category Type (Frontend) ---
/**
 * Represents a Category as needed by the frontend.
 * Typically fetched for displaying category names (e.g., in tabs).
 */
export interface ICategoryFE {
  _id: string; // MongoDB ObjectId as string
  name: string; // Name of the category
  // createdAt/updatedAt might be included by the API but often not needed for display
  // createdAt?: string;
  // updatedAt?: string;
}

// --- Package Types (Frontend) ---

/**
 * Enum representing the possible types of packages.
 * Should match the enum defined in the backend model.
 */
export enum PackageType {
  TRIAL = "trial",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

/**
 * Represents a Package as needed by the frontend.
 * Assumes the 'category' field is populated by the backend API.
 */
export interface IPackageFE {
  _id: string; // MongoDB ObjectId as string
  name: string; // Name of the package
  description?: string; // Optional description
  price: number; // Package price
  type: PackageType; // Type of the package (trial, weekly, monthly)
  days: number; // Duration of the package in days
  category: ICategoryFE; // Populated category information (_id and name)
  image?: string; // Optional image URL
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}
