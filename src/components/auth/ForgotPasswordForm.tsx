// src/components/auth/ForgotPasswordForm.tsx
import React, { useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Import your Supabase client

const ForgotPasswordForm: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMessage(null);

      if (!phoneNumber || phoneNumber.trim().length < 10) {
        // Basic validation
        setError("Please enter a valid phone number.");
        return;
      }

      setLoading(true);
      try {
        // Invoke the Supabase Edge Function
        const { data, error: functionError } = await supabase.functions.invoke(
          "request-password-reset-otp", // Name of your Edge Function
          {
            body: { phoneNumber: phoneNumber.trim() },
          }
        );

        if (functionError) {
          // Handle errors specifically from the function invocation (network, etc.)
          // or errors returned in data.error by the function itself
          const errMsg =
            data?.error ||
            functionError.message ||
            "Failed to send OTP request.";
          throw new Error(errMsg);
        }

        // Assuming the function returns { success: true, message: "..." } or { error: "..." } in data
        if (data?.success) {
          setSuccessMessage(
            data.message || "OTP request successful. Redirecting..."
          );
          setTimeout(() => {
            window.location.href = `/verify-password-reset-otp?phone=${encodeURIComponent(
              phoneNumber.trim()
            )}`;
          }, 1500);
        } else {
          // This case handles structured errors returned in the function's response body
          throw new Error(
            data?.error || "Failed to send OTP. Please try again."
          );
        }
      } catch (err: any) {
        console.error("Forgot Password Error:", err);
        setError(err.message || "An error occurred. Please try again.");
        setLoading(false);
      }
      // Do not setLoading(false) on success if redirecting.
    },
    [phoneNumber]
  );

  // JSX remains the same as your provided code
  return (
    <form className="forgot-password-form" onSubmit={handleSubmit} noValidate>
      <div className="form-item">
        <label htmlFor="phoneNumber" className="form-label">
          Registered Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          placeholder="Enter your phone number"
          className="form-input"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}
      {successMessage && !error && (
        <div className="form-message success" role="status">
          {successMessage}
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="submit-button"
          disabled={loading || !!successMessage}
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? "Sending OTP..." : "Send Reset OTP"}
        </button>
      </div>

      <div className="form-footer-link">
        <a href="/">Back to Login</a>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
