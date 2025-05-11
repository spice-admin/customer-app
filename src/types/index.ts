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

/**
 * Represents the customer profile data fetched from the backend.
 * Excludes sensitive fields like password, OTP details.
 */
export interface Addon {
  _id: string;
  name: string;
  price: number;
  image: string; // URL to the image
  createdAt: string;
  updatedAt: string;
}

export interface ICustomerProfile {
  id: string;                 // User's Supabase Auth ID (from profiles.id)
  fullName?: string | null;    // From profiles.full_name
  email?: string | null;       // Directly from Supabase Auth user object
  phone?: string | null;       // From profiles.phone
  isPhoneVerified?: boolean; // From profiles.is_phone_verified

  // Editable fields
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  current_location?: string | null; // e.g., "latitude,longitude"
}

// --- NEW: Type for the Profile Update Form ---
/**
 * Represents the data structure for the profile update form.
 * Matches the backend's updateProfileSchema (all optional).
 */
export interface IProfileUpdateData { // Fields that can be updated by the user
  address?: string;
  city?: string;
  postal_code?: string;
  current_location?: string;
  // full_name and phone are typically updated via different flows or signup
  // email is updated via Supabase Auth methods for email change
}

// --- Order Status Enum / Type (Ensure this exists) ---
export enum OrderStatus {
  ACTIVE = "Active",
  EXPIRED = "Expired",
  CANCELLED = "Cancelled",
}

// --- Type for the nested package info populated within an Order ---
// Based on .populate('package', 'name type image price days') in backend controller
export interface IOrderPackageInfo {
  _id: string; // Populated ID
  name: string;
  type: PackageType;
  image?: string | null;
  price: number; // Price at time of order might differ, use order's packagePrice
  days: number; // Duration at time of order might differ, use order's deliveryDays
}

// --- Type for the nested delivery address within an Order ---
export interface IDeliveryAddressFE {
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  currentLocation?: string | null;
}

// --- Type for the nested payment details within an Order ---
export interface IPaymentDetailsFE {
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amountPaid: number; // In cents
  currency: string;
  paymentMethodType?: string | null;
  cardBrand?: string | null;
  cardLast4?: string | null;
  paymentDate: string; // ISO Date string
}

// --- Order Type (Frontend View) ---
/**
 * Represents an Order as fetched for the customer's history.
 * Includes populated package details.
 */
export interface IOrderFE {
  _id: string;
  orderNumber: string;
  customer: string; // Customer ID as string (usually not needed if fetching 'my' orders)
  package: IOrderPackageInfo; // Populated package info
  packageName: string; // Denormalized name
  packagePrice: number; // Denormalized price (e.g., 19.99 CAD)
  deliveryDays: number; // Denormalized duration
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  status: OrderStatus;
  deliveryAddress: IDeliveryAddressFE; // Address snapshot
  paymentDetails: IPaymentDetailsFE; // Payment details
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface CartItem {
  addonId: string; // Reference to the original Addon._id
  name: string;
  price: number;
  image: string;
  quantity: number;
}
