// src/components/auth/ForgotPasswordForm.tsx
import React, { useState, useCallback } from "react";
import { requestPasswordResetOtpApi } from "../../services/auth.service"; // Adjust path

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
        const result = await requestPasswordResetOtpApi(phoneNumber.trim());

        if (result.success) {
          setSuccessMessage(
            result.message || "OTP request successful. Redirecting..."
          ); // Use backend message
          // Redirect to OTP verification page after short delay
          setTimeout(() => {
            // Pass phone number for the next step
            window.location.href = `/verify-reset-otp?phone=${encodeURIComponent(
              phoneNumber.trim()
            )}`;
          }, 1500); // Delay allows user to see success message briefly
        } else {
          throw new Error(result.message || "Failed to send OTP request.");
        }
      } catch (err: any) {
        console.error("Forgot Password Error:", err);
        setError(err.message || "An error occurred. Please try again.");
        setLoading(false); // Stop loading only on error if redirecting on success
      }
      // Don't setLoading(false) on success because we redirect
    },
    [phoneNumber]
  );

  return (
    // Use CSS classes for styling - similar structure to login/signup
    <form className="forgot-password-form" onSubmit={handleSubmit} noValidate>
      {/* Phone Number Input */}
      <div className="form-item">
        <label htmlFor="phoneNumber" className="form-label">
          Registered Phone Number
        </label>
        <input
          type="tel" // Use 'tel' type for phone numbers
          id="phoneNumber"
          placeholder="Enter your phone number"
          className="form-input" // Example class name
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="form-message error" role="alert">
          {error}
        </div>
      )}

      {/* Success Message Display */}
      {successMessage && !error && (
        <div className="form-message success" role="status">
          {successMessage}
        </div>
      )}

      {/* Submit Button */}
      <div className="form-actions">
        <button
          type="submit"
          className="submit-button" // Example class name
          disabled={loading || !!successMessage} // Disable after success until redirect
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? "Sending OTP..." : "Send Reset OTP"}
        </button>
      </div>

      {/* Link back to Login */}
      <div className="form-footer-link">
        <a href="/login">Back to Login</a>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
