// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
// Assuming your loginSchema can be adapted or you create a new one for email/password
// For now, we'll do basic client-side checks. Use Zod for robust validation.
// import { loginSchema } from "../../validators/authSchema";
// import type { ZodIssue } from "zod";

import {
  HiOutlineEnvelope, // Changed from HiOutlineDevicePhoneMobile for email
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "", // Changed from mobile to email
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}); // For Zod errors primarily
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

    // Basic client-side validation (replace with Zod for production)
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email is required." }));
      return;
    }
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: "Password is required." }));
      return;
    }
    // End basic validation

    setIsLoading(true);
    try {
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (signInError) {
        console.error("Supabase sign-in error:", signInError);
        setApiError(
          signInError.message || "Login failed. Please check your credentials."
        );
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Successfully authenticated with Supabase Auth
        // Now check their profile for phone verification status
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("phone, is_phone_verified")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setApiError(
            "Login successful, but could not retrieve profile information. Please try again."
          );
          await supabase.auth.signOut(); // Sign out if profile can't be fetched
          setIsLoading(false);
          return;
        }

        if (profile) {
          if (profile.is_phone_verified) {
            // Phone is verified, redirect to home
            console.log(
              "Login successful, phone verified. Redirecting to /home..."
            );
            window.location.href = "/home"; // Ensure home.astro exists
          } else {
            // Phone not verified, redirect to OTP page
            // We'll need an Edge Function here to *trigger* sending the OTP
            // For now, let's assume we just redirect and the OTP page handles sending
            console.log(
              "Login successful, phone NOT verified. Redirecting to OTP verification..."
            );
            if (!profile.phone) {
              setApiError(
                "Phone number not found on profile. Cannot proceed with OTP verification."
              );
              await supabase.auth.signOut();
              setIsLoading(false);
              return;
            }
            // Before redirecting, you'd ideally call an Edge Function to send the OTP.
            // For now, we'll just redirect. The OTP page will need to handle the OTP sending trigger.
            // This is a placeholder for the Edge Function call to send OTP:
            // await supabase.functions.invoke('send-custom-otp', { body: { phoneNumber: profile.phone } });
            window.location.href = `/otp-verification?phone=${encodeURIComponent(
              profile.phone
            )}`;
          }
        } else {
          // Profile not found - this shouldn't happen if handle_new_user trigger is working
          setApiError(
            "Login successful, but profile not found. Please contact support."
          );
          await supabase.auth.signOut();
        }
      } else {
        // Should be caught by signInError, but as a fallback
        setApiError("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected login process error:", error);
      setApiError((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="new_password_input">
      {apiError && (
        <div className="alert alert-danger text-center mb-4" role="alert">
          {apiError}
        </div>
      )}
      {/* Zod validation errors (if you re-integrate Zod) */}
      {errors.email && (
        <div className="text-danger mb-2">
          <small>{errors.email}</small>
        </div>
      )}
      <div className={`form-item ${errors.email ? "has-error" : ""}`}>
        <span className="input-icon-wrapper">
          <HiOutlineEnvelope className="input-icon" />{" "}
          {/* Changed to Email Icon */}
        </span>
        <input
          type="email" // Changed to email
          placeholder="Enter Email" // Changed placeholder
          className={`no-spinners ${errors.email ? "input-error" : ""}`}
          name="email" // Changed to email
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.email}
        />
      </div>
      {errors.password && (
        <div className="text-danger mb-2">
          <small>{errors.password}</small>
        </div>
      )}
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
          id="password"
          autoComplete="current-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={!!errors.password}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle-icon"
          aria-label={showPassword ? "Hide password" : "Show password"}
          disabled={isLoading}
        >
          {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
        </button>
      </div>
      <div className="d-flex align-items-center justify-content-between remember-main">
        <div className="remember">&nbsp;</div>
        <div className="remember password">
          <a href="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </a>
        </div>
      </div>
      <button
        type="submit"
        className="get-start-btn sign-in-btn"
        disabled={isLoading}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
};

export default LoginForm;
