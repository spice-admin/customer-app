// src/components/auth/OtpVerificationForm.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path

const OTP_LENGTH = 4;

function maskMobile(number: string | null | undefined): string {
  if (!number || number.length < 6) return "your mobile number";
  const visibleDigits = 4;
  const firstPartIndex = Math.max(0, number.length - visibleDigits);
  const firstPart = number.slice(0, firstPartIndex);
  const displayMask =
    firstPart.replace(/[0-9]/g, "*") + number.slice(-visibleDigits);
  return displayMask;
}

const OtpVerificationForm: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [displayMobile, setDisplayMobile] =
    useState<string>("your mobile number");
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For verify action
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false); // For send/resend OTP action
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const triggerSendOtp = useCallback(async (phoneToVerify: string) => {
    if (!phoneToVerify) return;
    setIsSendingOtp(true);
    setError(null);
    setSuccessMessage(null); // Clear previous success before trying to send
    try {
      const { data, error: sendOtpError } = await supabase.functions.invoke(
        "send-customer-otp",
        {
          body: { phoneNumber: phoneToVerify },
        }
      );
      if (sendOtpError) throw sendOtpError;
      if (data?.error) throw new Error(data.error);
      setSuccessMessage(
        // This message indicates OTP was SENT
        data?.message || "OTP sent successfully. Please check your messages."
      );
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mobileFromUrl = searchParams.get("phone");

    if (mobileFromUrl) {
      const cleanedMobile = decodeURIComponent(mobileFromUrl).replace(
        /[^0-9+]/g,
        ""
      );
      if (cleanedMobile.length >= 10) {
        setPhoneNumber(cleanedMobile);
        setDisplayMobile(maskMobile(cleanedMobile));
        if (inputRefs.current[0]) {
          // Ensure ref is available
          inputRefs.current[0]?.focus();
        }
        triggerSendOtp(cleanedMobile);
      } else {
        setError(
          "Invalid mobile number received. Please go back and try logging in again."
        );
      }
    } else {
      setError(
        "Mobile number not found. Please go back and try logging in again."
      );
    }
  }, [triggerSendOtp]);

  const handleChange = useCallback(
    (element: HTMLInputElement, index: number) => {
      let value = element.value.replace(/[^0-9]/g, "");
      if (value.length > 1) value = value.slice(-1);
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError(null); // Clear general error when user types

      // Clear "OTP sent" message when user starts typing OTP, but not "Verification successful..." message
      if (successMessage && !successMessage.includes("Redirecting...")) {
        setSuccessMessage(null);
      }

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp, successMessage] // Added successMessage to dependency
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"].includes(
          e.key
        )
      )
        return;
      if (!/[0-9]/.test(e.key) && !["Backspace", "Delete"].includes(e.key)) {
        e.preventDefault();
      }
    },
    [otp]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError(null);
      // Do not clear successMessage here, as it might be "OTP sent"
      const enteredOtp = otp.join("");

      if (!phoneNumber) {
        setError("Cannot verify OTP: Mobile number is missing.");
        return;
      }
      if (enteredOtp.length !== OTP_LENGTH) {
        setError(`Please enter all ${OTP_LENGTH} digits of the OTP.`);
        return;
      }

      setIsLoading(true); // For "Verifying..." state
      try {
        const { data, error: verifyError } = await supabase.functions.invoke(
          "verify-customer-otp",
          {
            body: { phoneNumber, otpCode: enteredOtp },
          }
        );

        if (verifyError) throw verifyError;
        if (data?.error) throw new Error(data.error);

        setSuccessMessage(
          // This message indicates OTP was VERIFIED
          data?.message || "Phone number verified successfully! Redirecting..."
        );
        setTimeout(() => {
          window.location.href = "/home";
        }, 2000);
      } catch (err: any) {
        console.error("OTP verification error:", err);
        setError(err.message || "Invalid or expired OTP. Please try again.");
        setOtp(new Array(OTP_LENGTH).fill(""));
        if (inputRefs.current[0]) {
          inputRefs.current[0]?.focus();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [otp, phoneNumber]
  );

  const handleResend = useCallback(async () => {
    if (phoneNumber) {
      setOtp(new Array(OTP_LENGTH).fill("")); // Clear OTP fields
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
      triggerSendOtp(phoneNumber); // This will set its own success/error for sending
    } else {
      setError("Cannot resend OTP: Mobile number is missing.");
    }
  }, [phoneNumber, triggerSendOtp]);

  // Determine if the final success message (before redirect) is active
  const isFinalSuccess =
    successMessage && successMessage.includes("Redirecting...");

  return (
    <div>
      <p className="instructions">
        Please enter the {OTP_LENGTH}-digit verification code{" "}
        {successMessage && !isFinalSuccess ? "that was " : "we sent to "}
        {displayMobile}.
      </p>

      {isSendingOtp && (
        <div className="alert alert-info text-center mb-3">Sending OTP...</div>
      )}
      {successMessage && (
        <div className="alert alert-success text-center mb-3">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger text-center mb-3">{error}</div>
      )}

      {/* Show form if phone number is available AND it's not the final success state (which leads to redirect) */}
      {phoneNumber && !isFinalSuccess && (
        <>
          <form onSubmit={handleSubmit} className="otp-field pt-0">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="no-spinners"
                name={`otp${index + 1}`}
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                disabled={isLoading || isSendingOtp} // Disable if verifying OR sending
                aria-label={`OTP Digit ${index + 1}`}
                autoComplete="off"
                required
              />
            ))}
          </form>

          <div className="resend-otp mt-3 text-center">
            <p>
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading || isSendingOtp}
                className="btn btn-link p-0 align-baseline"
              >
                {isSendingOtp ? "Sending..." : "Resend OTP"}
              </button>
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="get-start-btn sign-up-btn mt-3 w-100"
            disabled={
              isLoading || isSendingOtp || otp.join("").length !== OTP_LENGTH
            }
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </>
      )}

      {!phoneNumber && !error && !isSendingOtp && (
        <div className="alert alert-info text-center mb-3">
          Loading phone number...
        </div>
      )}
      {error && !phoneNumber && (
        <p className="mt-3 text-center">
          <a href="/" className="btn btn-secondary">
            Go back to Login
          </a>
        </p>
      )}
    </div>
  );
};

export default OtpVerificationForm;
