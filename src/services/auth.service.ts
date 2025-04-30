// src/services/auth.service.ts
import type { ApiResponse } from "../types";
// Import the specific input type from the validator file
import type {
  RegisterInput,
  LoginInput,
  OtpVerifyInput,
} from "../validators/authSchema";
import { getAuthToken } from "../utils/api";

// Make sure API_BASE_URL is configured correctly in your .env file
const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ||
  "https://spice-tiffin-backend-production.up.railway.app/api/v1";
const AUTH_ENDPOINT = `${API_BASE_URL}/auth`;

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: ApiResponse<T>;
  try {
    // Always try to parse JSON, as backend should return JSON for errors too
    data = await response.json();
  } catch (e) {
    // Handle non-JSON responses ONLY if the status code indicates an error
    if (!response.ok) {
      console.error(
        "Non-JSON error response:",
        response.status,
        response.statusText
      );
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}. Server returned non-JSON response.`
      );
    }
    // If response is OK but not JSON (very unlikely for this API)
    console.warn("Received non-JSON success response");
    // Synthesize a success response, assuming T might be void or handle undefined data
    data = {
      success: true,
      message: "Operation successful (non-JSON response)",
      data: undefined as T,
    };
  }

  // *** Crucial Change: Only throw for non-OK HTTP status codes ***
  if (!response.ok) {
    console.error("API Error Response:", data); // Log the full error response from backend
    // Use the message from the JSON error response if available
    throw new Error(data?.message || `HTTP error! Status: ${response.status}`);
  }

  // For OK responses (200-299), return the parsed data directly.
  // The caller will check data.success, data.verificationRequired, etc.
  return data;
}

// Registration function
// Input type comes from Zod schema defined in backend/validators
// We might redefine it or import if possible, using 'any' for simplicity here if types aren't shared
export const registerCustomerApi = async (
  // Use RegisterInput type if shared, otherwise define inline or use 'any' carefully
  // formData: RegisterInput
  formData: any
): Promise<ApiResponse<{ userId: string }>> => {
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/register`, {
      // Assuming POST /api/v1/auth/register
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    // Assuming the backend returns { success: true, message: "...", data: { userId: "..." } } on 201
    return await handleResponse<{ userId: string }>(response);
  } catch (error) {
    console.error("Registration API failed:", error);
    // Return a structured error compatible with ApiResponse (or rethrow)
    return {
      success: false,
      message:
        (error as Error).message || "Registration failed. Please try again.",
    };
  }
};

export const loginCustomerApi = async (
  formData: LoginInput
): Promise<ApiResponse<{ token?: string }>> => {
  try {
    // handleResponse now correctly returns the object for 200 OK responses,
    // even if { success: false, verificationRequired: true }
    const result = await handleResponse<{ token?: string }>(
      await fetch(`${AUTH_ENDPOINT}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
    );
    return result; // Return the full result object directly
  } catch (error) {
    // This catch block now primarily handles actual network/HTTP errors
    console.error("Login API failed:", error);
    return {
      success: false,
      message:
        (error as Error).message ||
        "Login failed. Please check credentials or network.",
    };
  }
};

export const verifyOtpApi = async (
  formData: OtpVerifyInput // Use OtpVerifyInput type from validator
): Promise<ApiResponse<{ token?: string }>> => {
  // Expects token on success
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/verify-otp`, {
      // POST /api/v1/auth/verify-otp
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    // Expects { success: true, token: "..." } on success
    return await handleResponse<{ token?: string }>(response);
  } catch (error) {
    console.error("OTP Verification API failed:", error);
    return {
      success: false,
      message:
        (error as Error).message ||
        "OTP Verification failed. Please try again.",
    };
  }
};

/**
 * Step 1 (Forgot Password): Request password reset OTP to be sent via SMS.
 * Calls the backend endpoint POST /auth/request-password-reset
 * @param phoneNumber The user's registered phone number.
 * @returns Promise<ApiResponse<{ message: string }>> - Backend should return generic success message.
 */
export const requestPasswordResetOtpApi = async (
  phoneNumber: string
): Promise<ApiResponse<{ message: string }>> => {
  console.log(
    `[AuthServiceFE] Requesting password reset OTP for: ${phoneNumber}`
  );
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/request-password-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header needed for this public endpoint
      },
      body: JSON.stringify({ phoneNumber }), // Send phoneNumber in body
    });
    // handleResponse expects JSON, backend returns {success, message}
    return await handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Request Password Reset OTP API failed:", error);
    return {
      success: false,
      message:
        (error as Error).message || "Failed to request password reset OTP.",
    };
  }
};

/**
 * Step 2 (Forgot Password): Verify the password reset OTP.
 * Calls the backend endpoint POST /auth/verify-reset-otp
 * @param phoneNumber The user's registered phone number.
 * @param otp The 4-digit OTP code entered by the user.
 * @returns Promise<ApiResponse<{ resetToken?: string }>> - Expects reset token in data on success.
 */
export const verifyPasswordResetOtpApi = async (
  phoneNumber: string,
  otp: string
): Promise<ApiResponse<{ resetToken?: string }>> => {
  console.log(`[AuthServiceFE] Verifying reset OTP ${otp} for: ${phoneNumber}`);
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/verify-reset-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, otp }), // Send phone and OTP
    });
    // Expects { success: true, data: { resetToken: "..." } } on success
    return await handleResponse<{ resetToken?: string }>(response);
  } catch (error) {
    console.error("Verify Password Reset OTP API failed:", error);
    return {
      success: false,
      message:
        (error as Error).message || "Failed to verify password reset OTP.",
    };
  }
};

/**
 * Step 3 (Forgot Password): Resets the user's password using the reset token.
 * Calls the backend endpoint POST /auth/reset-password
 * @param phoneNumber The user's phone number (may be needed by backend for lookup)
 * @param resetToken The plain reset token received after OTP verification.
 * @param newPassword The new plain text password.
 * @param confirmPassword The confirmation of the new plain text password.
 * @returns Promise<ApiResponse<{ message: string }>> - Expects success/failure message.
 */
export const resetPasswordApi = async (
  phoneNumber: string, // Sending identifier just in case backend logic needs it alongside token
  resetToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse<{ message: string }>> => {
  console.log(`[AuthServiceFE] Resetting password for: ${phoneNumber}`);
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Backend controller expects these fields
      body: JSON.stringify({
        phoneNumber,
        resetToken,
        newPassword,
        confirmPassword,
      }),
    });
    // Expects { success: true, message: "..." }
    return await handleResponse<{ message: string }>(response);
  } catch (error) {
    console.error("Reset Password API failed:", error);
    return {
      success: false,
      message: (error as Error).message || "Failed to reset password.",
    };
  }
};
