// src/components/auth/PasswordResetOtpForm.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  verifyPasswordResetOtpApi,
  requestPasswordResetOtpApi,
} from "../../services/auth.service"; // Import verify AND request APIs
import type { ApiResponse } from "../../types";

// Assuming OTP length is 4 based on previous component, adjust if needed
const OTP_LENGTH = 4;

// Masking function (can be moved to utils)
function maskMobile(number: string | null | undefined): string {
  if (!number || number.length < 6) return "your mobile number";
  const visibleDigits = 4;
  const firstPartIndex = Math.max(0, number.length - visibleDigits);
  const firstPart = number.slice(0, firstPartIndex);
  const displayMask =
    firstPart.replace(/[0-9]/g, "*") + number.slice(-visibleDigits);
  return displayMask;
}

const PasswordResetOtpForm: React.FC = () => {
  // State Variables
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [displayPhone, setDisplayPhone] =
    useState<string>("your mobile number");
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null); // For resend feedback
  const [isLoading, setIsLoading] = useState<boolean>(false); // For verification loading
  const [isResending, setIsResending] = useState<boolean>(false); // For resend loading
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Effects ---
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const phoneFromUrl = searchParams.get("phone"); // Expecting 'phone' parameter

    if (phoneFromUrl) {
      const cleanedPhone = decodeURIComponent(phoneFromUrl).replace(
        /[^0-9+]/g,
        ""
      );
      if (cleanedPhone.length >= 10) {
        console.log(`[ResetOtpForm] Read phone from URL:`, cleanedPhone);
        setPhoneNumber(cleanedPhone);
        setDisplayPhone(maskMobile(cleanedPhone));
        inputRefs.current[0]?.focus();
      } else {
        setError(
          "Invalid phone number received. Please go back and try again."
        );
      }
    } else {
      setError("Phone number not found. Please go back and request OTP again.");
    }
  }, []);

  // --- Input Handlers (Reuse from OtpVerificationForm) ---
  const handleChange = useCallback(
    (element: HTMLInputElement, index: number) => {
      let value = element.value.replace(/[^0-9]/g, "");
      if (value.length > 1) {
        value = value.slice(-1);
      }
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError(null); // Clear error
      setResendMessage(null); // Clear resend message
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Basic navigation/deletion allowed, prevent others
      if (
        !/[0-9]/.test(e.key) &&
        !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
          e.key
        )
      ) {
        e.preventDefault();
      }
    },
    [otp]
  );

  // --- Form Submission ---
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError(null);
      setResendMessage(null);
      const enteredOtp = otp.join("");

      if (!phoneNumber) {
        setError("Cannot verify OTP: Phone number is missing.");
        return;
      }
      if (enteredOtp.length !== OTP_LENGTH) {
        setError(`Please enter all ${OTP_LENGTH} digits.`);
        return;
      }

      setIsLoading(true);
      try {
        // Call the specific API for verifying password reset OTP
        const result = (await verifyPasswordResetOtpApi(
          phoneNumber,
          enteredOtp
        )) as ApiResponse<any> & { resetToken?: string };

        if (result.success && result.resetToken) {
          // ** OTP Verification Successful - Redirect to Reset Password Page **
          console.log("Success condition met. Reset Token:", result.resetToken);

          const token = result.resetToken;
          const params = new URLSearchParams({
            phone: phoneNumber,
            token: token,
          }).toString();
          const redirectUrl = `/reset-password?${params}`;
          console.log("Attempting redirect to:", redirectUrl); // Log the URL
          window.location.href = redirectUrl; // Execute redirect
          // Add a log *after* just in case something weird happens (unlikely to show if redirect works)
          console.log("Redirect command executed.");
        } else {
          // API indicated failure (invalid OTP, expired, etc.)
          setError(
            result.message || "Invalid or expired OTP. Please try again."
          );
          setOtp(new Array(OTP_LENGTH).fill("")); // Clear fields
          inputRefs.current[0]?.focus();
        }
      } catch (error) {
        console.error("Unexpected OTP verification error:", error);
        setError((error as Error).message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    },
    [otp, phoneNumber]
  );

  // --- Resend OTP ---
  const handleResend = useCallback(async () => {
    if (!phoneNumber || isResending) return; // Prevent multiple clicks

    setIsResending(true);
    setError(null);
    setResendMessage("Sending new OTP...");
    try {
      // Call the request function again
      const result = await requestPasswordResetOtpApi(phoneNumber);
      if (result.success) {
        setResendMessage("New OTP sent successfully."); // Use the success message state
      } else {
        throw new Error(result.message || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error("Resend OTP failed:", err);
      setError((err as Error).message || "Could not resend OTP.");
      setResendMessage(null); // Clear sending message on error
    } finally {
      setIsResending(false);
    }
  }, [phoneNumber, isResending]);

  // --- Render Logic ---
  return (
    <div className="password-reset-otp-form">
      {" "}
      {/* Specific class */}
      <p className="instructions">
        Enter the {OTP_LENGTH}-digit verification code sent to {displayPhone}
      </p>
      {phoneNumber ? (
        <>
          {/* OTP Input Fields */}
          <form onSubmit={handleSubmit} className="otp-field">
            {/* Ensure styling for otp-field exists */}
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="otp-input" // Use specific class
                name={`otp${index + 1}`}
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                disabled={isLoading || isResending}
                aria-label={`OTP Digit ${index + 1}`}
                autoComplete="off"
                required
              />
            ))}
            {/* Hidden submit button for accessibility if needed, or rely on Verify button */}
            <button
              type="submit"
              className="get-start-btn sign-up-btn"
              style={{ display: "none" }}
              aria-hidden="true"
            />
          </form>

          {/* Error/Success Message Display */}
          {error && (
            <div className="form-message error" role="alert">
              {error}
            </div>
          )}
          {resendMessage && !error && (
            <div className="form-message success" role="status">
              {resendMessage}
            </div>
          )}

          {/* Resend OTP Link/Button */}
          <div className="resend-otp">
            <p>
              Didn't receive code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading || isResending}
              >
                {isResending ? "Sending..." : "Resend OTP"}
              </button>
            </p>
          </div>

          {/* Verify Button */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleSubmit} // Trigger submit logic
              className="get-start-btn sign-up-btn"
              disabled={
                isLoading || isResending || otp.join("").length !== OTP_LENGTH
              }
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        </>
      ) : (
        // Show error if phone number couldn't be loaded
        error && (
          <div className="form-message error" role="alert">
            {error}
            <p className="mt-2">
              {" "}
              {/* Helper class */}
              <a
                href="/forgot-password"
                style={{ color: "#ea580c", textDecoration: "underline" }}
              >
                Request Code Again
              </a>
            </p>
          </div>
        )
      )}
      {/* Minimal styles */}
      <style>{`
         .otp-field { display: flex; justify-content: center; gap: 10px; margin-bottom: 1.5rem; }
         .otp-input { width: 45px; height: 50px; text-align: center; font-size: 1.2rem; border: 1px solid #d1d5db; border-radius: 4px; }
         .otp-input:focus { border-color: #f97316; outline: none; box-shadow: 0 0 0 2px #fdba74; }
         .resend-otp { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: #4b5563; }
         .resend-link { background: none; border: none; color: #ea580c; text-decoration: underline; cursor: pointer; padding: 0; font-size: inherit; }
         .resend-link:disabled { color: #9ca3af; cursor: not-allowed; }
         .form-message { margin-top: 1rem; padding: 0.75rem; border-radius: 4px; font-size: 0.875rem; text-align: center; }
         .form-message.error { color: #991b1b; background-color: #fee2e2; border: 1px solid #fecaca; }
         .form-message.success { color: #166534; background-color: #dcfce7; border: 1px solid #bbf7d0; }
         .form-actions { margin-top: 1.5rem; }
         .submit-button { /* Defined in previous CSS */ }
         .instructions { text-align: center; margin-bottom: 1.5rem; color: #374151; }
         .mt-2 { margin-top: 0.5rem; }
      `}</style>
    </div>
  );
};

export default PasswordResetOtpForm;
