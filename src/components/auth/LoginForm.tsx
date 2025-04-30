// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { loginCustomerApi } from "../../services/auth.service"; // Import API call
import { loginSchema } from "../../validators/authSchema"; // Import Zod schema
import type { ZodIssue } from "zod";

// Import react-icons
import {
  HiOutlineDevicePhoneMobile,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

const AUTH_TOKEN_KEY =
  "7f57e24a0181b526fb106b2bad45d9f6c0717b88ea01d2dd0afae3594a69b8c0";

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });
  // const [rememberMe, setRememberMe] = useState(false); // State for checkbox
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    // --- Client-side Validation ---
    const validationResult = loginSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string | undefined> = {};
      validationResult.error.issues.forEach((issue: ZodIssue) => {
        if (issue.path.length > 0) {
          fieldErrors[issue.path[0]] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // --- API Call ---
    setIsLoading(true);
    try {
      const result = await loginCustomerApi(validationResult.data);

      if (result.success && result.token) {
        // **Login Success (Verified User)**
        console.log("Login successful, token:", result.token);
        // TODO: Implement proper token storage (e.g., secure cookie, state management)
        localStorage.setItem(AUTH_TOKEN_KEY, result.token);
        // Redirect to home/dashboard
        window.location.href = "/home"; // Or '/' or '/dashboard'
      } else if (result.verificationRequired) {
        // **Login Success (Unverified User) -> Redirect to OTP**

        // --- DEBUGGING STARTS HERE ---
        console.log("Verification required flag received from API.");
        // Capture the mobile number state *right before* using it
        const mobileToRedirect = formData.mobile;
        console.log(
          "Mobile number captured from state for redirect:",
          mobileToRedirect
        );

        // Check if the mobile number is actually empty or undefined
        if (!mobileToRedirect) {
          console.error(
            "CRITICAL: Mobile number is empty in state right before redirect!"
          );
          setApiError(
            "Login succeeded, but cannot redirect to OTP verification (missing mobile number). Please try again."
          );
          // Don't attempt redirect if number is missing
        } else {
          // Construct the URL
          const redirectUrl = `/otp-verification?mobile=${encodeURIComponent(
            mobileToRedirect
          )}`;
          console.log("Constructed redirect URL:", redirectUrl);

          // Perform the redirect
          window.location.href = redirectUrl;
        }
      } else {
        // **API returned error (e.g., wrong password, user not found)**
        setApiError(
          result.message || "Login failed. Please check credentials."
        );
      }
    } catch (error) {
      // **Unexpected error during API call**
      console.error("Unexpected login error:", error);
      setApiError((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use the class from your template's form tag
    <form onSubmit={handleSubmit} className="new_password_input">
      {/* API Error Message */}
      {apiError && <div className="form-message error">{apiError}</div>}

      {/* Mobile Input */}
      <div className={`form-item ${errors.mobile ? "has-error" : ""}`}>
        <span className="input-icon-wrapper">
          <HiOutlineDevicePhoneMobile className="input-icon" />
        </span>
        <input
          type="tel"
          placeholder="Enter Mobile Number (with +1)"
          className={`no-spinners ${errors.mobile ? "input-error" : ""}`}
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.mobile}
        />
        {errors.mobile && <span className="error-text">{errors.mobile}</span>}
      </div>

      {/* Password Input */}
      <div className={`form-item ${errors.password ? "has-error" : ""}`}>
        <span className="input-icon-wrapper">
          <HiOutlineLockClosed className="input-icon" />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className={`no-spinners password-input ${
            errors.password ? "input-error" : ""
          }`}
          id="password" // Use specific ID if needed
          autoComplete="current-password" // Hint for browser password managers
          name="password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.password}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle-icon" // Use template class
          aria-label={showPassword ? "Hide password" : "Show password"}
          disabled={isLoading}
        >
          {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
        </button>
        {errors.password && (
          <span className="error-text">{errors.password}</span>
        )}
      </div>

      {/* Remember Me & Forgot Password Row */}
      <div className="d-flex align-items-center justify-content-between remember-main">
        {/* Template class */}
        <div className="remember">&nbsp;</div>
        <div className="remember password">
          <a href="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </a>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="get-start-btn sign-in-btn" // Use template classes (might be same as sign-up-btn or different)
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
        {/* Add spinner icon or element here if needed */}
      </button>
    </form>
  );
};

export default LoginForm;
