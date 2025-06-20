// src/components/profile/DeleteAccountSettings.tsx
import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient"; // Your Supabase client
import Swal from "sweetalert2";

const DeleteAccountSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    const { value: confirmationText } = await Swal.fire({
      title: "Are you absolutely sure?",
      html: `
        <p>This action is permanent and cannot be undone.</p>
        <p>This will permanently delete your account and profile, and anonymize your past orders.</p>
        <br/>
        <p>Please type <strong>DELETE</strong> to confirm.</p>
      `,
      input: "text",
      inputPlaceholder: "DELETE",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete my account",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      preConfirm: (inputValue) => {
        if (inputValue !== "DELETE") {
          Swal.showValidationMessage('You must type "DELETE" to confirm.');
          return false;
        }
        return inputValue;
      },
    });

    if (confirmationText === "DELETE") {
      setIsLoading(true);
      try {
        // Invoke the secure Edge Function
        const { data, error } = await supabase.functions.invoke(
          "delete-user-account"
        );

        if (error) throw error;

        if (data?.success) {
          await Swal.fire(
            "Deleted!",
            "Your account has been successfully deleted.",
            "success"
          );
          // Log the user out and redirect to the home page
          await supabase.auth.signOut();
          window.location.href = "/"; // Redirect to home/login page
        } else {
          throw new Error(data?.error || "Failed to delete account.");
        }
      } catch (error: any) {
        console.error("Error invoking delete function:", error);
        Swal.fire(
          "Error!",
          `Could not delete your account: ${error.message}`,
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title text-danger">Danger Zone</h5>
        <p className="card-text">
          Deleting your account is a permanent action. All of your profile
          information will be removed, and your past orders will be anonymized.
          This cannot be undone.
        </p>
        <button
          className="btn btn-danger"
          onClick={handleDeleteAccount}
          disabled={isLoading}
        >
          {isLoading ? "Deleting..." : "Delete My Account"}
        </button>
      </div>
    </div>
  );
};

export default DeleteAccountSettings;
