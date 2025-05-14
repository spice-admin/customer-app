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
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  CUSTOM = "custom",
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
  id: string; // Changed from _id
  name: string;
  price: number;
  image_url?: string | null; // Changed from image
  created_at: string;
  updated_at: string;
}

// Define CartItem if you haven't already, based on its usage
export interface CartItem {
  addonId: string; // Corresponds to Addon.id
  name: string;
  price: number;
  image_url?: string | null; // To store the image URL from the Addon
  quantity: number;
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
  id: string;                         // Primary key
  order_date: string;                 // When the order was placed (timestamp)
  package_name?: string | null;
  package_type?: string | null;
  package_price: number;
  delivery_start_date?: string | null; // Date string
  delivery_end_date?: string | null;   // Date string
  order_status?: string | null;        // e.g., 'pending_confirmation', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'
  delivery_address?: string | null;
  delivery_city?: string | null;
  delivery_postal_code?: string | null;
  user_full_name?: string | null;      // Could be useful for confirmation, though often the user knows their name
  // Potentially package_days if relevant to display
  package_days?: number | null;
  // You might also want to include a simplified list of items or a way to fetch them if not directly embedded
  // For now, we'll assume the main details are enough as per the schema.
  // Fields like stripe_payment_id, user_id, created_at, updated_at are usually not directly displayed in a list.
}

export interface CartItem {
  addonId: string; // Reference to the original Addon._id
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface Category { // <--- Make sure 'export' is here
  id: string;
  name: string;
  // description?: string | null; // Add if you have this in your DB for categories
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  type: PackageType;
  days: number;
  category_id: string; // This refers to Category.id
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string; } | null;// This is for the joined category data (name and id)
}
