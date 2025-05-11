// src/components/auth/ResetPasswordForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Import your Supabase client

const ResetPasswordForm: React.FC = () => {
  const [phoneNumberFromUrl, setPhoneNumberFromUrl] = useState<string | null>(
    null
  ); // Keep for display if needed
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState<string | null>(
    null
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const phone = params.get("phone");
      const token = params.get("token");

      if (phone) setPhoneNumberFromUrl(decodeURIComponent(phone)); // Store for potential display

      if (token) {
        setResetTokenFromUrl(token);
      } else {
        setError(
          "Invalid or missing reset token in link. Please request a new link."
        );
      }
      if (!phone && !token) {
        // If both are missing or token specifically
        setError("Invalid password reset link. Please request a new link.");
      }
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMessage(null);

      if (!newPassword || !confirmPassword) {
        setError("Please enter and confirm your new password.");
        return;
      }
      if (newPassword.length < 6) {
        // Basic client-side check, Supabase default is 6
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!resetTokenFromUrl) {
        setError(
          "Cannot process request: Reset token is missing. Please use a valid link."
        );
        return;
      }

      setLoading(true);
      try {
        // Call the new Supabase Edge Function
        const { data, error: functionError } = await supabase.functions.invoke(
          "reset-password-with-custom-token",
          {
            body: {
              resetToken: resetTokenFromUrl,
              newPassword: newPassword,
            },
          }
        );

        if (functionError) {
          const errMsg =
            data?.error || functionError.message || "Failed to reset password.";
          throw new Error(errMsg);
        }

        if (data?.success) {
          setSuccessMessage(
            data.message ||
              "Password reset successfully! Redirecting to login..."
          );
          setError(null);
          setNewPassword("");
          setConfirmPassword("");
          setTimeout(() => {
            window.location.href = "/"; // Redirect to login/home page
          }, 2500);
        } else {
          throw new Error(
            data?.error ||
              "Failed to reset password. The link might be invalid or expired."
          );
        }
      } catch (err: any) {
        console.error("Reset Password Error:", err);
        setError(
          err.message ||
            "An error occurred. The link might be invalid or expired."
        );
        setSuccessMessage(null);
      } finally {
        setLoading(false);
      }
    },
    [resetTokenFromUrl, newPassword, confirmPassword]
  );

  if (!resetTokenFromUrl && !loading && typeof window !== "undefined") {
    // Show error more reliably if token is missing
    return (
      <div className="form-message error" role="alert">
        {error || "Invalid or missing password reset token in the link."}
        <p style={{ marginTop: "0.5rem" }}>
          <a
            href="/forgot-password" // Link to your forgot password page
            style={{ color: "#ea580c", textDecoration: "underline" }}
          >
            Request a new password reset link
          </a>
        </p>
      </div>
    );
  }

  // JSX for the form (can reuse most of your existing structure)
  return (
    <form className="reset-password-form" onSubmit={handleSubmit} noValidate>
      <div className="form-item">
        <label htmlFor="newPassword" className="form-label">
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          placeholder="Enter new password"
          className="form-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading || !!successMessage}
        />
        <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.25rem" }}>
          Minimum 6 characters.
        </p>{" "}
        {/* Adjusted hint */}
      </div>

      <div className="form-item">
        <label htmlFor="confirmPassword" className="form-label">
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirm new password"
          className="form-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading || !!successMessage}
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
          disabled={loading || !!successMessage || !resetTokenFromUrl}
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
