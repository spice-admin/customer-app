// src/components/profile/ProfileManager.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { ICustomerProfile, IProfileUpdateData } from "../../types";
import {
  getMyProfileApi,
  updateMyProfileApi,
} from "../../services/customer.service";
// Import Zod schema for client-side validation if desired
// import { updateProfileSchema } from '../../validators/customerSchema'; // Assuming you copied this to frontend validators
// Import react-icons
import {
  HiOutlineUserCircle,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineMapPin,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineIdentification,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";

const ProfileManager: React.FC = () => {
  const [profile, setProfile] = useState<ICustomerProfile | null>(null);
  const [editData, setEditData] = useState<IProfileUpdateData>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading profile initially
  const [isSaving, setIsSaving] = useState<boolean>(false); // Saving changes
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Add this handler function inside ProfileManager
  const handleGetCurrentLocation = () => {
    // Check if Geolocation API is available in the browser
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      console.warn("Geolocation not supported.");
      return; // Stop execution if not supported
    }

    // Set loading state and clear previous errors
    setIsFetchingLocation(true);
    setLocationError(null);
    console.log("Attempting to get current location...");

    // Request the current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // --- Success Callback ---
        const { latitude, longitude } = position.coords;
        console.log("Geolocation success:", { latitude, longitude });

        // Format coordinates as a string (e.g., "lat, lon")
        // You could also perform reverse geocoding here if needed
        const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(
          6
        )}`;

        // Update the 'currentLocation' field in the editData state
        setEditData((prev) => ({
          ...prev,
          currentLocation: locationString,
        }));

        setIsFetchingLocation(false); // Reset loading state
      },
      (error) => {
        // --- Error Callback ---
        console.error("Geolocation error:", error);
        let message = "Could not retrieve location."; // Default error message
        // Provide more specific messages based on the error code
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission denied. Please enable it in your browser/OS settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is currently unavailable.";
            break;
          case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        }
        setLocationError(message); // Set the error message state
        setIsFetchingLocation(false); // Reset loading state
      },
      {
        // --- Geolocation Options ---
        enableHighAccuracy: true, // Request a more accurate position (might use more power)
        timeout: 10000, // Maximum time (in milliseconds) to wait for the location
        maximumAge: 0, // Force retrieval of a fresh position (don't use a cached one)
      }
    );
  };

  // Fetch profile data on component mount
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await getMyProfileApi();
      if (result.success && result.data) {
        setProfile(result.data);
        // Initialize edit form data when profile loads
        setEditData({
          address: result.data.address || "",
          city: result.data.city || "",
          postalCode: result.data.postalCode || "",
          currentLocation: result.data.currentLocation || "",
        });
      } else {
        throw new Error(result.message || "Failed to load profile data.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle changes in the edit form inputs
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    // Clear messages when user types
    setError(null);
    setSuccessMessage(null);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditMode && profile) {
      // If cancelling edit, reset form data to original profile data
      setEditData({
        address: profile.address || "",
        city: profile.city || "",
        postalCode: profile.postalCode || "",
        currentLocation: profile.currentLocation || "",
      });
    }
    setIsEditMode(!isEditMode);
    setError(null); // Clear errors when toggling mode
    setSuccessMessage(null);
  };

  // Handle saving profile changes
  const handleSaveChanges = async () => {
    setError(null);
    setSuccessMessage(null);

    // Optional: Client-side validation using Zod schema
    /*
        const validationResult = updateProfileSchema.safeParse(editData);
        if (!validationResult.success) {
            // Handle validation errors (e.g., display them)
            const firstError = validationResult.error.issues[0];
            setError(`Validation failed: ${firstError.path[0]} - ${firstError.message}`);
            return;
        }
        const dataToSave = validationResult.data;
        */

    // Use current editData directly if not using Zod validation here
    const dataToSave = { ...editData };

    setIsSaving(true);
    try {
      const result = await updateMyProfileApi(dataToSave);
      if (result.success && result.data) {
        setProfile(result.data); // Update displayed profile
        setSuccessMessage("Profile updated successfully!");
        setIsEditMode(false); // Exit edit mode on success
      } else {
        throw new Error(result.message || "Failed to save profile.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="loading-placeholder text-center p-10">
        Loading Profile...
      </div>
    );
  }

  if (error && !profile) {
    // Show error only if profile failed to load initially
    return <div className="form-message error text-center p-10">{error}</div>;
  }

  if (!profile) {
    // Should not happen if loading/error handled, but safe fallback
    return <div className="text-center p-10">Could not load profile.</div>;
  }

  // Helper to display profile fields or edit inputs
  const renderField = (
    label: string,
    value: string | undefined | null,
    fieldName: keyof IProfileUpdateData,
    IconComponent: React.ElementType,
    isTextarea: boolean = false
  ) => (
    // Use template's base class for the item
    <div className="form-item profile-field">
      {/* Label remains outside the flex container */}
      <label htmlFor={fieldName}>{label}</label>
      {/* Flex container for icon + value/input */}
      <div className="profile-field-content">
        <span className="input-icon-wrapper">
          {" "}
          {/* Wrapper for icon styling */}
          <IconComponent className="input-icon" />
        </span>
        <div className="profile-field-value-input">
          {" "}
          {/* Wrapper for value/input */}
          {isEditMode ? (
            isTextarea ? (
              <textarea
                id={fieldName}
                name={fieldName}
                value={editData[fieldName] || ""}
                onChange={handleEditChange}
                className="profile-input textarea" // Use template/custom class
                rows={3}
                disabled={isSaving}
              />
            ) : (
              <input
                type="text" // Or appropriate type like 'tel', 'email' if needed
                id={fieldName}
                name={fieldName}
                value={editData[fieldName] || ""}
                onChange={handleEditChange}
                className="profile-input" // Use template/custom class
                disabled={isSaving}
              />
            )
          ) : (
            // Display value - use min-height to prevent layout shifts
            <p className="profile-value" style={{ minHeight: "38px" }}>
              {value || <span className="text-muted">Not set</span>}
            </p>
          )}
        </div>
      </div>
      {/* Add validation error display here if needed */}
    </div>
  );

  return (
    <div className="profile-manager">
      {" "}
      {/* Main container */}
      {/* Display Static Info */}
      <div className="profile-static-info">
        {/* Example applying the structure */}
        <div className="form-item profile-field read-only">
          <label>Full Name</label>
          <div className="profile-field-content">
            <span className="input-icon-wrapper">
              <HiOutlineUserCircle className="input-icon" />
            </span>
            <div className="profile-field-value-input">
              <p className="profile-value">{profile?.fullName}</p>
            </div>
          </div>
        </div>
        <div className="form-item profile-field read-only">
          <label>Email</label>
          <div className="profile-field-content">
            <span className="input-icon-wrapper">
              <HiOutlineEnvelope className="input-icon" />
            </span>
            <div className="profile-field-value-input">
              <p className="profile-value">{profile?.email}</p>
            </div>
          </div>
        </div>
        <div className="form-item profile-field read-only">
          <label>Mobile</label>
          <div className="profile-field-content">
            <span className="input-icon-wrapper">
              <HiOutlineDevicePhoneMobile className="input-icon" />
            </span>
            <div className="profile-field-value-input">
              <p className="profile-value">{profile?.mobile}</p>
            </div>
          </div>
        </div>
      </div>
      <hr className="my-4" />
      {/* Address Info using renderField */}
      <div className="profile-address-info">
        <h2 className="profile-section-title">Address Information</h2>
        {error && isEditMode && (
          <div className="form-message error">{error}</div>
        )}
        {successMessage && (
          <div className="form-message success">{successMessage}</div>
        )}

        {renderField(
          "Address",
          profile?.address,
          "address",
          HiOutlineMapPin,
          true
        )}
        {renderField("City", profile?.city, "city", HiOutlineBuildingOffice2)}
        {renderField(
          "Postal Code",
          profile?.postalCode,
          "postalCode",
          HiOutlineIdentification
        )}
        {renderField(
          "Current Location (Optional)",
          profile?.currentLocation,
          "currentLocation",
          HiOutlineMapPin
        )}
      </div>
      {/* --- Add Get Location Button (Problem 2) --- */}
      {isEditMode && (
        <div className="get-location-action mt-3">
          {" "}
          {/* Added margin-top */}
          <button
            type="button"
            onClick={handleGetCurrentLocation} // Ensure this calls the correct function
            className="profile-button location" // Style as needed
            disabled={isSaving || isFetchingLocation} // Disable when saving or fetching
          >
            {isFetchingLocation ? (
              <>
                {/* Optional spinner */}
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Fetching...
              </>
            ) : (
              "Use Current Location"
            )}
          </button>
          {/* Display location-specific errors */}
          {locationError && <p className="error-text mt-1">{locationError}</p>}
        </div>
      )}
      {/* Action Buttons */}
      <div className="profile-actions">
        {isEditMode ? (
          <>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="profile-button save" // Use template classes or style
              disabled={isSaving}
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <HiOutlineCheck className="icon" /> Save Changes
                </>
              )}
            </button>
            <button
              type="button"
              onClick={toggleEditMode}
              className="profile-button cancel" // Use template classes or style
              disabled={isSaving}
            >
              <HiOutlineXMark className="icon" /> Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleEditMode}
            className="profile-button edit" // Use template classes or style
            disabled={isLoading} // Disable if initial load is happening
          >
            <HiOutlinePencil className="icon" /> Edit Profile
          </button>
        )}
      </div>
      {/* Add necessary styles globally or scoped */}
      <style>{`
                
                .profile-manager { /* padding, background etc */ }
                .profile-static-info, .profile-address-info { margin-bottom: 1.5rem; }
                .profile-section-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
                .form-item.profile-field { position: relative; margin-bottom: 1rem; }
                .form-item.profile-field label { display: block; font-weight: 500; font-size: 0.9em; color: #555; margin-bottom: 0.3rem; padding-left: 28px; /* Space for icon */ }
                .input-icon-wrapper { position: absolute; left: 0px; top: 28px; /* Adjust based on label height */ color: #888; }
                .input-icon { width: 18px; height: 18px; }
                .profile-value { font-size: 1rem; color: #333; padding: 8px 0 8px 28px; /* Match input padding roughly */ min-height: 38px; /* Match input height roughly */ line-height: 1.5; }
                .profile-value .text-muted { color: #888; font-style: italic; }
                .profile-input { width: 100%; padding: 8px 12px 8px 28px; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
                .profile-input.textarea { resize: vertical; }
                .profile-actions { margin-top: 1.5rem; display: flex; gap: 0.5rem; }
                .profile-button { /* Base button styles from template */ display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-weight: 500; }
                .profile-button .icon { width: 18px; height: 18px; }
                .profile-button.edit { background-color: #ffc107; color: #000; border-color: #ffc107; }
                .profile-button.save { background-color: #198754; color: white; border-color: #198754; }
                .profile-button.cancel { background-color: #6c757d; color: white; border-color: #6c757d; }
                .profile-button:disabled { opacity: 0.7; cursor: not-allowed; }
                /* Error/Success messages */
                .form-message { padding: 0.75rem 1rem; margin-bottom: 1rem; border-radius: 0.25rem; border: 1px solid transparent; text-align: center;}
                .form-message.success { color: #0f5132; background-color: #d1e7dd; border-color: #badbcc; }
                .form-message.error { color: #842029; background-color: #f8d7da; border-color: #f5c2c7; }
            `}</style>
    </div>
  );
};

export default ProfileManager;
