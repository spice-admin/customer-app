// src/services/auth.service.ts
import type { ApiResponse } from "../types";
// Import the specific input type from the validator file
import type {
  RegisterInput,
  LoginInput,
  OtpVerifyInput,
} from "../validators/authSchema";

// Make sure API_BASE_URL is configured correctly in your .env file
const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
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
