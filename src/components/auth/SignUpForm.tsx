// src/components/auth/SignupForm.tsx
import React, { useState } from "react";
// 1. Import Supabase client
import { supabase } from "../../lib/supabaseClient"; // Adjust path if necessary
import { registerSchema } from "../../validators/authSchema"; // Keep your Zod schema
import type { ZodIssue } from "zod";

// Import desired icons (your existing imports are fine)
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
    mobile: "", // This will be phone for Supabase
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
    setApiError(null); // Clear API error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);
    setIsSuccess(false);

    // Client-side validation using Zod
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
      // 2. Call Supabase signUp
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: validationResult.data.email,
          password: validationResult.data.password,
          options: {
            data: {
              full_name: validationResult.data.fullName,
              phone: validationResult.data.mobile, // Pass mobile as phone
              role: "customer", // Set the role for the profiles table trigger
            },
          },
        });

      if (signUpError) {
        // Handle Supabase specific errors
        console.error("Supabase signup error:", signUpError);
        // Supabase might return a specific message for already registered users
        // depending on your email confirmation settings.
        if (signUpError.message.includes("User already registered")) {
          setApiError(
            "This email is already registered. Please try logging in."
          );
        } else {
          setApiError(
            signUpError.message || "Registration failed. Please try again."
          );
        }
        setIsLoading(false);
        return;
      }

      // Handle case where user exists but may not be confirmed (identities array might be empty)
      // This behavior can vary based on Supabase version and email confirmation settings.
      // For "Confirm email" ON (default): data.user will be non-null, data.session will be null.
      if (signUpData.user) {
        // Supabase user created successfully.
        // Now, attempt to create Stripe customer (fire and forget for MVP UX)
        // For a more robust flow, you might await this and handle its specific errors.
        console.log(
          "Supabase user created. Attempting to create Stripe customer..."
        );
        supabase.functions
          .invoke("create-stripe-customer", {
            body: {
              userId: signUpData.user.id,
              email: signUpData.user.email, // email from the user object
              name: validationResult.data.fullName,
              phone: validationResult.data.mobile,
            },
          })
          .then(({ data: stripeData, error: stripeError }) => {
            if (stripeError) {
              console.error(
                "Stripe customer creation via Edge Function failed:",
                stripeError.message
              );
              // Non-critical error for user's signup success message, but log it.
              // You might want to add a flag to the user's profile or a separate logging system.
              setApiError((prev) =>
                prev
                  ? `${prev}\nStripe setup issue: ${stripeError.message}`
                  : `Stripe setup issue: ${stripeError.message}`
              );
            } else if (stripeData?.error) {
              console.error(
                "Stripe customer creation Edge Function returned an error:",
                stripeData.error
              );
              setApiError((prev) =>
                prev
                  ? `${prev}\nStripe setup issue: ${stripeData.error}`
                  : `Stripe setup issue: ${stripeData.error}`
              );
            } else {
              console.log(
                "Stripe customer creation/linking successful:",
                stripeData
              );
            }
          })
          .catch((invokeError) => {
            console.error(
              "Error invoking create-stripe-customer function:",
              invokeError
            );
            setApiError((prev) =>
              prev
                ? `${prev}\nStripe setup function call failed.`
                : `Stripe setup function call failed.`
            );
          });

        setIsSuccess(true);
        setApiError(null); // Clear any previous apiError if Supabase signup was success
        // Message will prompt for email confirmation IF it's enabled in Supabase.
        // If disabled, they are fully registered.
        // As per your request, we disabled email confirmation earlier.
      } else {
        setApiError("Registration failed: No user data received.");
      }
    } catch (error) {
      setApiError((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Your JSX for the form structure remains largely the same.
  // Key changes:
  // - The success message will now prompt the user to check their email for confirmation.
  // - Error messages will come from Supabase.
  return (
    <form onSubmit={handleSubmit} className="new_password_input">
      {apiError && !isSuccess && (
        <div className="alert alert-danger text-center mb-4" role="alert">
          {apiError}
        </div>
      )}
      {/* Updated Success Message */}
      {isSuccess &&
        !apiError && ( // Only show general success if no overriding apiError
          <div className="alert alert-success text-center mb-4" role="alert">
            Registration successful! Redirecting...
          </div>
        )}
      {/* If there was a success but also an apiError (e.g. from Stripe or failed auto-login) */}
      {isSuccess && apiError && (
        <div className="alert alert-warning text-center mb-4" role="alert">
          {apiError}{" "}
          {/* This will show the specific error, e.g. about email confirmation if session failed */}
        </div>
      )}

      {/* Full Name Input */}
      <div className={`form-item ${errors.fullName ? "has-error" : ""}`}>
        <span className="input-icon-wrapper">
          <HiOutlineUser className="input-icon" />
        </span>
        <input
          type="text"
          placeholder="Your Full Name" // Changed placeholder for clarity
          className={`no-spinners ${errors.fullName ? "input-error" : ""}`}
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          disabled={isLoading || isSuccess} // Disable form on success too
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
          placeholder="Your Email" // Changed placeholder
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
          type="tel"
          placeholder="Your Mobile Number" // Changed placeholder
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
          }`}
          id="password"
          autoComplete="new-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading || isSuccess}
          aria-invalid={!!errors.password}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle-icon"
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
          }`}
          id="confirm-password"
          autoComplete="new-password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading || isSuccess}
          aria-invalid={!!errors.confirmPassword}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="password-toggle-icon"
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

      <button
        type="submit"
        className="get-start-btn sign-up-btn"
        disabled={isLoading || isSuccess}
      >
        {isLoading ? "Signing Up..." : isSuccess ? "Registered!" : "Sign Up"}
      </button>
    </form>
  );
};

export default SignupForm;
