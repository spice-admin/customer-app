// src/components/auth/VerifyResetOtpForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Your Supabase client

const VerifyResetOtpForm: React.FC = () => {
  const [otpCode, setOtpCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get phone number from URL query parameter
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const phoneFromUrl = params.get("phone");
      if (phoneFromUrl) {
        setPhoneNumber(decodeURIComponent(phoneFromUrl));
      } else {
        setError("Phone number not found in URL. Please start over.");
        // Consider redirecting back to forgot-password if phone is missing
        // window.location.href = '/forgot-password';
      }
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMessage(null);

      if (!phoneNumber) {
        setError("Phone number is missing. Cannot proceed.");
        return;
      }
      if (!otpCode || otpCode.trim().length < 4) {
        // Basic OTP length validation
        setError("Please enter a valid OTP code.");
        return;
      }

      setLoading(true);
      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          "verify-otp-for-password-reset", // Name of your Edge Function
          {
            body: { phoneNumber, otpCode: otpCode.trim() },
          }
        );

        if (functionError) {
          const errMsg =
            data?.error || functionError.message || "Failed to verify OTP.";
          throw new Error(errMsg);
        }

        if (data?.success && data.resetToken) {
          setSuccessMessage(
            data.message || "OTP verified! Redirecting to set new password..."
          );
          setTimeout(() => {
            // Redirect to the reset password page with phone and the new custom reset token
            window.location.href = `/reset-password?phone=${encodeURIComponent(
              phoneNumber
            )}&token=${encodeURIComponent(data.resetToken)}`;
          }, 1500);
        } else {
          throw new Error(
            data?.error || "OTP verification failed. Please try again."
          );
        }
      } catch (err: any) {
        console.error("Verify OTP Error:", err);
        setError(err.message || "An error occurred during OTP verification.");
        setLoading(false);
      }
      // Don't setLoading(false) on success if redirecting
    },
    [phoneNumber, otpCode]
  );

  if (!phoneNumber && !error) {
    // Still determining phone number or if there's an initial error
    return <p>Loading...</p>;
  }

  return (
    <form className="verify-otp-form" onSubmit={handleSubmit} noValidate>
      {phoneNumber && (
        <p
          className="auth-subtitle"
          style={{ fontSize: "0.9em", marginBottom: "1em" }}
        >
          Enter OTP sent to: <strong>{phoneNumber}</strong>
        </p>
      )}
      <div className="form-item">
        <label htmlFor="otpCode" className="form-label">
          OTP Code
        </label>
        <input
          type="text" // Can be "number" but "text" is often better for OTPs with leading zeros
          id="otpCode"
          placeholder="Enter OTP"
          className="form-input"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          required
          maxLength={6} // Assuming a 6-digit OTP from Twilio Verify
          disabled={loading || !phoneNumber}
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
          disabled={loading || !phoneNumber || !!successMessage}
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? "Verifying OTP..." : "Verify & Proceed"}
        </button>
      </div>

      <div className="form-footer-link">
        <a href="/forgot-password">Request new OTP</a>
      </div>
    </form>
  );
};

export default VerifyResetOtpForm;
