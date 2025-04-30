// src/components/auth/ResetPasswordForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { resetPasswordApi } from "../../services/auth.service"; // Adjust path

const ResetPasswordForm: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read parameters from URL (no change needed here)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // ... logic to get phone and token ...
    const phoneFromUrl = params.get("phone");
    const tokenFromUrl = params.get("token");
    if (phoneFromUrl && tokenFromUrl) {
      const cleanedPhone = decodeURIComponent(phoneFromUrl).replace(
        /[^0-9+]/g,
        ""
      );
      if (cleanedPhone.length >= 10) {
        setPhoneNumber(cleanedPhone);
        setResetToken(tokenFromUrl);
      } else {
        setError("Invalid phone number link parameter.");
      }
    } else {
      setError("Missing required information from password reset link.");
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMessage(null);

      // Client-side validation
      if (!newPassword || !confirmPassword) {
        setError("Please enter and confirm your new password.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!phoneNumber || !resetToken) {
        setError("Cannot process request: Missing required information.");
        return;
      }

      setLoading(true);
      try {
        const result = await resetPasswordApi(
          phoneNumber,
          resetToken,
          newPassword,
          confirmPassword
        ); // Pass confirmPassword
        if (result.success) {
          setSuccessMessage(
            result.message || "Password reset successfully! Redirecting..."
          );
          setError(null);
          setNewPassword("");
          setConfirmPassword(""); // Clear fields
          setTimeout(() => {
            window.location.href = "/";
          }, 2500);
        } else {
          throw new Error(result.message || "Failed to reset password.");
        }
      } catch (err: any) {
        setError(
          err.message ||
            "An error occurred. The link might be invalid or expired."
        );
        setSuccessMessage(null);
      } finally {
        setLoading(false);
      }
    },
    [phoneNumber, resetToken, newPassword, confirmPassword]
  );

  if (!phoneNumber || !resetToken) {
    // Show error if params were missing/invalid
    return (
      <div className="form-message error" role="alert">
        {error || "Invalid password reset link."}
        <p style={{ marginTop: "0.5rem" }}>
          {" "}
          {/* Quick style */}
          <a
            href="/forgot-password"
            style={{ color: "#ea580c", textDecoration: "underline" }}
          >
            Request a new link
          </a>
        </p>
      </div>
    );
  }

  // Apply consistent CSS class names
  return (
    <form className="reset-password-form" onSubmit={handleSubmit} noValidate>
      {/* New Password Input */}
      <div className="form-item">
        <label htmlFor="newPassword" className="form-label">
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          placeholder="Enter new password"
          className="form-input" // Use consistent class
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          disabled={loading || !!successMessage}
        />
        {/* Password Hint */}
        <p className="password-hint">Minimum 8 characters required.</p>
      </div>

      {/* Confirm New Password Input */}
      <div className="form-item">
        <label htmlFor="confirmPassword" className="form-label">
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirm new password"
          className="form-input" // Use consistent class
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          disabled={loading || !!successMessage}
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
          className="submit-button" // Use consistent class
          disabled={loading || !!successMessage}
          aria-live="polite"
          aria-busy={loading}
        >
          {/* Show spinner when loading */}
          {loading && <span className="spinner" aria-hidden="true"></span>}
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
