// src/components/auth/SignupForm.tsx
import React, { useState } from "react";
import { registerCustomerApi } from "../../services/auth.service";
import { registerSchema } from "../../validators/authSchema";
import type { ZodIssue } from "zod";

// Import desired icons from react-icons (Heroicons v2 used here as example)
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

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
    setIsSuccess(false);

    const validationResult = registerSchema.safeParse(formData);
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

    setIsLoading(true);
    try {
      const result = await registerCustomerApi(validationResult.data);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setApiError(result.message || "Registration failed.");
      }
    } catch (error) {
      setApiError((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Use the class from your template's form tag
    <form onSubmit={handleSubmit} className="new_password_input">
      {/* Render API Error/Success Messages - Style these using your template's alert/message classes if available */}
      {apiError && (
        <div className="form-message error">
          {/* Add alert classes */} {apiError}
        </div>
      )}
      {isSuccess && (
        <div className="form-message success">
          {" "}
          {/* Add alert classes */}
          Registration successful!{" "}
          <a href="/login" className="link">
            Login now
          </a>
          .
        </div>
      )}

      {/* Full Name Input */}
      <div className={`form-item ${errors.fullName ? "has-error" : ""}`}>
        {" "}
        {/* Use template class */}
        {/* Wrap react-icon in a span for positioning if needed by your CSS */}
        <span className="input-icon-wrapper">
          {" "}
          {/* Adjust class/styling as needed */}
          <HiOutlineUser className="input-icon" />{" "}
          {/* Use react-icon, apply template class */}
        </span>
        <input
          type="text"
          placeholder="Your Name"
          className={`no-spinners ${errors.fullName ? "input-error" : ""}`}
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          disabled={isLoading || isSuccess}
          aria-invalid={!!errors.fullName}
        />
        {errors.fullName && (
          <span className="error-text">{errors.fullName}</span>
        )}
      </div>

      {/* Email Input */}
      <div className={`form-item ${errors.email ? "has-error" : ""}`}>
        <span className="input-icon-wrapper">
          <HiOutlineEnvelope className="input-icon" />
        </span>
        <input
          type="email"
          placeholder="Email"
          className={`no-spinners ${errors.email ? "input-error" : ""}`}
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading || isSuccess}
          aria-invalid={!!errors.email}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      {/* Mobile Input */}
      <div className={`form-item ${errors.mobile ? "has-error" : ""}`}>
        <span className="input-icon-wrapper">
          <HiOutlineDevicePhoneMobile className="input-icon" />
        </span>
        <input
          type="tel" // Changed to tel
          placeholder="Enter Mobile Number"
          className={`no-spinners ${errors.mobile ? "input-error" : ""}`}
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          disabled={isLoading || isSuccess}
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
          placeholder="Password (min 6 characters)"
          className={`no-spinners password-input ${
            errors.password ? "input-error" : ""
          }`} // Added 'password-input' class for potential right padding
          id="password"
          autoComplete="new-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading || isSuccess}
          aria-invalid={!!errors.password}
        />
        {/* Password Toggle Button using react-icons */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle-icon" // Use template class for positioning/styling
          aria-label={showPassword ? "Hide password" : "Show password"}
          disabled={isLoading || isSuccess}
        >
          {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
        </button>
        {errors.password && (
          <span className="error-text">{errors.password}</span>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className={`form-item ${errors.confirmPassword ? "has-error" : ""}`}>
        <span className="input-icon-wrapper">
          <HiOutlineLockClosed className="input-icon" />
        </span>
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm Password"
          className={`no-spinners password-input ${
            errors.confirmPassword ? "input-error" : ""
          }`} // Added 'password-input' class
          id="confirm-password"
          autoComplete="new-password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading || isSuccess}
          aria-invalid={!!errors.confirmPassword}
        />
        {/* Password Toggle Button using react-icons */}
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="password-toggle-icon" // Use template class for positioning/styling
          aria-label={
            showConfirmPassword
              ? "Hide confirm password"
              : "Show confirm password"
          }
          disabled={isLoading || isSuccess}
        >
          {showConfirmPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
        </button>
        {errors.confirmPassword && (
          <span className="error-text">{errors.confirmPassword}</span>
        )}
      </div>

      {/* Submit Button - Using Button element but styled with template classes */}
      <button
        type="submit"
        className="get-start-btn sign-up-btn" // Use template classes
        disabled={isLoading || isSuccess}
      >
        {isLoading ? "Signing Up..." : "Sign Up"}
        {/* Add spinner icon or element here if needed */}
      </button>
    </form>
  );
};

export default SignupForm;
