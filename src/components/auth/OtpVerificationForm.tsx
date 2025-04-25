// src/components/auth/OtpVerificationForm.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { verifyOtpApi } from "../../services/auth.service";
// Import the specific input type if needed for validation within component
// import type { OtpVerifyInput } from '../../validators/authSchema';

// Define props - currently empty as mobileNumber is read from URL
interface OtpVerificationFormProps {}

const OTP_LENGTH = 4; // Number of OTP digits

/**
 * Helper function to mask a mobile number, showing only the last few digits.
 * @param number The mobile number string to mask.
 * @returns The masked mobile number string or a default placeholder.
 */
function maskMobile(number: string | null | undefined): string {
  if (!number || number.length < 6) return "your mobile number"; // Handle invalid/short numbers
  const visibleDigits = 4;
  // Ensure we don't get negative start index if number is short but >= 6
  const firstPartIndex = Math.max(0, number.length - visibleDigits);
  const firstPart = number.slice(0, firstPartIndex);
  const displayMask =
    firstPart.replace(/[0-9]/g, "*") + number.slice(-visibleDigits);
  return displayMask;
}

/**
 * OtpVerificationForm Component:
 * Handles OTP input, verification API call, and user feedback.
 * Reads the target mobile number from the URL query parameter 'mobile'.
 */
const OtpVerificationForm: React.FC<OtpVerificationFormProps> = () => {
  // --- State Variables ---
  const [mobileNumber, setMobileNumber] = useState<string | null>(null); // Store the validated mobile number
  const [displayMobile, setDisplayMobile] =
    useState<string>("your mobile number"); // Masked version for display
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill("")); // Array for OTP digits
  const [error, setError] = useState<string | null>(null); // Stores validation or API errors
  const [isLoading, setIsLoading] = useState<boolean>(false); // Tracks API call status
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Refs for OTP input fields

  // --- Effects ---

  // Effect to read mobile number from URL on component mount (client-side only)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mobileFromUrl = searchParams.get("mobile");

    if (mobileFromUrl) {
      // Basic cleanup/validation of the number from URL
      const cleanedMobile = decodeURIComponent(mobileFromUrl).replace(
        /[^0-9+]/g,
        ""
      );
      if (cleanedMobile.length >= 10) {
        // Basic length check
        console.log(
          `[OtpVerificationForm] Read mobile from URL:`,
          cleanedMobile
        );
        setMobileNumber(cleanedMobile);
        setDisplayMobile(maskMobile(cleanedMobile));
        // Focus the first input field automatically
        inputRefs.current[0]?.focus();
      } else {
        console.error(
          "[OtpVerificationForm] Invalid mobile number format in URL parameter."
        );
        setError(
          "Invalid mobile number received. Please go back and try logging in again."
        );
      }
    } else {
      console.error(
        "[OtpVerificationForm] Mobile number missing from URL query parameter 'mobile'."
      );
      setError(
        "Mobile number not found. Please go back and try logging in again."
      );
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Input Event Handlers ---

  /**
   * Handles changes in the OTP input fields.
   * Updates the state, allows only single digits, and moves focus forward.
   */
  const handleChange = useCallback(
    (element: HTMLInputElement, index: number) => {
      let value = element.value.replace(/[^0-9]/g, ""); // Allow only digits
      if (value.length > 1) {
        value = value.slice(-1); // Keep only the last entered digit
      }

      // Update the OTP array state
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError(null); // Clear error message on new input

      // Move focus to the next input field if a digit was entered
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  ); // Include otp in dependencies as newOtp depends on it

  /**
   * Handles keydown events (specifically Backspace) for focus management.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      // Move focus to the previous input on Backspace if the current input is empty
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Allow navigation keys (Arrows, Tab) - default behavior is sufficient
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"].includes(
          e.key
        )
      ) {
        return;
      }
      // Prevent non-numeric keys except Backspace/Delete/Arrows/Tab
      // This helps prevent pasting non-numeric characters directly
      if (!/[0-9]/.test(e.key) && !["Backspace", "Delete"].includes(e.key)) {
        e.preventDefault();
      }
    },
    [otp]
  ); // Include otp in dependencies as the condition !otp[index] uses it

  // --- Form Submission ---

  /**
   * Handles the submission of the entered OTP for verification.
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault(); // Prevent default if called from form submission event
      setError(null); // Clear previous errors
      const enteredOtp = otp.join(""); // Combine digits

      // Validate mobile number state
      if (!mobileNumber) {
        setError("Cannot verify OTP: Mobile number is missing.");
        console.error(
          "handleSubmit called without a valid mobileNumber state."
        );
        return;
      }

      // Validate OTP length
      if (enteredOtp.length !== OTP_LENGTH) {
        setError(`Please enter all ${OTP_LENGTH} digits of the OTP.`);
        return;
      }

      setIsLoading(true); // Set loading state
      try {
        // Call the API service function
        const result = await verifyOtpApi({
          mobile: mobileNumber,
          otp: enteredOtp,
        });

        if (result.success && result.token) {
          // ** OTP Verification Successful **
          console.log(
            "OTP verified successfully, token received:",
            result.token
          );

          // TODO: Implement secure token storage mechanism here
          // Example: authStore.setToken(result.token);
          // Example: await saveTokenSecurely(result.token);
          // Avoid localStorage for JWTs if possible due to security risks (XSS).
          // Consider HttpOnly cookies (set by backend) or secure in-memory storage.
          alert("OTP verification successful!"); // Show success message

          // Redirect to the main application page (e.g., homepage)
          window.location.href = "/"; // Use '/' for homepage typically
        } else {
          // API indicated failure (invalid OTP, expired, etc.)
          setError(
            result.message || "Invalid or expired OTP. Please try again."
          );
          // Clear OTP fields on error for retry
          setOtp(new Array(OTP_LENGTH).fill(""));
          inputRefs.current[0]?.focus(); // Focus first input again
        }
      } catch (error) {
        // Handle unexpected errors during the API call or processing
        console.error("Unexpected OTP verification error:", error);
        setError(
          (error as Error).message ||
            "An unexpected error occurred during verification."
        );
      } finally {
        setIsLoading(false); // Reset loading state
      }
    },
    [otp, mobileNumber]
  ); // Dependencies for handleSubmit

  // --- Resend OTP ---

  /**
   * Placeholder function for handling OTP resend requests.
   * Needs implementation based on backend capabilities.
   */
  const handleResend = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    alert("Resend OTP functionality is not yet implemented."); // Placeholder message
    console.warn("Resend OTP button clicked - requires implementation.");
    // TODO: Implement resend logic. This might involve:
    // 1. Calling the original `/login` endpoint again (requires password state, which isn't stored here).
    // 2. Calling a dedicated `/resend-otp` backend endpoint (passing the mobile number).
    // Example (assuming a dedicated endpoint):
    // try {
    //   const resendResult = await resendOtpApi(mobileNumber); // Assuming resendOtpApi exists
    //   if (resendResult.success) {
    //      alert("A new OTP has been sent.");
    //   } else { throw new Error(resendResult.message); }
    // } catch(err) { setError((err as Error).message || "Failed to resend OTP."); }
    setIsLoading(false);
  }, [mobileNumber]); // Depends on mobileNumber

  // --- Render Logic ---

  return (
    <div>
      {/* Instructions - Dynamically shows masked number */}
      <p className="instructions">
        Please enter the verification code we sent to {displayMobile}
      </p>

      {/* Only render the form elements if mobile number is available */}
      {mobileNumber ? (
        <>
          {/* OTP Input Fields */}
          {/* Wrap in form for semantics, but submission triggered by button click */}
          <form onSubmit={handleSubmit} className="otp-field pt-0">
            {" "}
            {/* Use template class */}
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text" // Use text with pattern/inputMode for better control
                inputMode="numeric" // Hint for numeric keyboard
                pattern="[0-9]*" // Allow only digits via pattern
                className="no-spinners" // Use template class for styling
                name={`otp${index + 1}`}
                value={digit}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1} // Enforce single digit
                disabled={isLoading}
                aria-label={`OTP Digit ${index + 1}`}
                autoComplete="off" // Disable browser autofill for OTP
                required // Mark as required
              />
            ))}
          </form>

          {/* Display Error Messages */}
          {error && (
            <div className="form-message error mt-3" role="alert">
              {/* Optional: Add an error icon */}
              {error}
            </div>
          )}

          {/* Resend OTP Link/Button */}
          <div className="resend-otp">
            {" "}
            {/* Use template class */}
            <p>
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="resend-link" // Style this class as a link
              >
                Resend OTP
              </button>
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="button" // Changed from submit as handleSubmit is called onClick
            onClick={handleSubmit}
            className="get-start-btn sign-up-btn" // Use template classes
            disabled={isLoading || otp.join("").length !== OTP_LENGTH} // Disable if loading or OTP incomplete
          >
            {isLoading ? (
              <>
                {/* Basic Spinner (replace with icon/SVG if preferred) */}
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </button>
        </>
      ) : (
        // Show error message if mobile number couldn't be loaded from URL
        // This condition might also catch the initial render before useEffect runs
        error && (
          <div className="form-message error mt-3" role="alert">
            {error}
            <p className="mt-2">
              <a href="/login" className="link">
                Go back to Login
              </a>
            </p>
          </div>
        )
        // Optional: Add a loading indicator while waiting for mobile number from URL
        // !error && !mobileNumber && (<p>Loading...</p>)
      )}

      {/* Minimal styles needed for spinner, rely on global CSS for others */}
      <style>
        {`
                .spinner-border {
                    display: inline-block;
                    width: 1em; /* Adjust size */
                    height: 1em;
                    vertical-align: -0.125em;
                    border: 0.15em solid currentColor;
                    border-right-color: transparent;
                    border-radius: 50%;
                    animation: spinner-border .75s linear infinite;
                 }
                @keyframes spinner-border { to { transform: rotate(360deg); } }
                .me-2 { margin-right: 0.5rem; } /* Basic margin helper */

               /* Ensure template CSS defines styles for:
                  .instructions, .otp-field, .otp-field input, .no-spinners,
                  .resend-otp, .resend-link, .get-start-btn, .form-message.error
               */
                `}
      </style>
    </div>
  );
};

export default OtpVerificationForm;
