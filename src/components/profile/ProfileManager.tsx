// src/components/profile/ProfileManager.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import type { ICustomerProfile, IProfileUpdateData } from "../../types"; // Ensure these types are defined in src/types/index.ts
import {
  getMyProfileApi,
  updateMyProfileApi,
} from "../../services/customer.service"; // Ensure this service file exists and exports these functions
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
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

// Define the libraries needed for Google Maps API (only 'places' for autocomplete)
const libraries: "places"[] = ["places"];

/**
 * ProfileManager Component
 * Fetches, displays, and allows editing of the logged-in customer's profile.
 */
const ProfileManager: React.FC = () => {
  // --- State Variables ---
  const [profile, setProfile] = useState<ICustomerProfile | null>(null); // Holds the fetched profile data
  const [editData, setEditData] = useState<IProfileUpdateData>({}); // Holds data being edited in the form
  const [isEditMode, setIsEditMode] = useState<boolean>(false); // Controls whether the form is in edit or display mode
  const [isLoading, setIsLoading] = useState<boolean>(true); // Tracks initial profile loading state
  const [isSaving, setIsSaving] = useState<boolean>(false); // Tracks profile update saving state
  const [error, setError] = useState<string | null>(null); // Stores general or save errors
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Stores success messages after saving
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false); // Tracks geolocation fetching state
  const [locationError, setLocationError] = useState<string | null>(null); // Stores geolocation errors

  // --- API Calls and Data Handling ---
  // --- Google Maps Autocomplete State & Refs ---
  const [autocompleteInstance, setAutocompleteInstance] =
    useState<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null); // Ref for the address input

  // --- Load Google Maps Script ---
  const googleMapsApiKey =
    import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyButiQW-YEd9X8LkkF1ILGzENQ3I5PHNZ4";
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsLoadError } =
    useLoadScript({
      googleMapsApiKey: googleMapsApiKey,
      libraries: libraries, // Specify the 'places' library
      // Optional: Restrict autocomplete to Canada
      // region: 'CA',
    });

  useEffect(() => {
    if (googleMapsLoadError) {
      console.error("Error loading Google Maps script:", googleMapsLoadError);
      setError(
        "Could not load address suggestions. Please check your connection or try again later."
      );
    }
    if (!googleMapsApiKey) {
      console.warn(
        "Google Maps API Key (PUBLIC_GOOGLE_MAPS_API_KEY) is missing. Address autocomplete will not work."
      );
    }
  }, [googleMapsLoadError, googleMapsApiKey]);

  // Function to fetch the user's profile data
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setProfile(null); // Reset profile before fetching
    try {
      const result = await getMyProfileApi(); // Call service function
      if (result.success && result.data) {
        setProfile(result.data);
        // Initialize the edit form state with fetched data
        setEditData({
          address: result.data.address || "",
          city: result.data.city || "",
          postalCode: result.data.postalCode || "",
          currentLocation: result.data.currentLocation || "",
        });
      } else {
        // Throw error if API call wasn't successful or data is missing
        throw new Error(result.message || "Failed to load profile data.");
      }
    } catch (err) {
      // Set error state if fetching fails
      setError((err as Error).message);
      console.error("Error fetching profile:", err);
    } finally {
      // Always set loading to false after attempt
      setIsLoading(false);
    }
  }, []); // Empty dependency array: runs once on mount

  // Effect to run fetchProfile when the component mounts
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]); // fetchProfile is stable due to useCallback

  // --- Event Handlers ---

  // Handles changes in the input/textarea fields during edit mode
  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setEditData((prev) => ({ ...prev, [name]: value }));
      // Clear any previous errors or success messages when user starts typing
      setError(null);
      setSuccessMessage(null);
      setLocationError(null); // Also clear location errors
    },
    []
  ); // No dependencies needed as it only uses event data and setters

  // Toggles between display mode and edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditMode((prevMode) => {
      const nextMode = !prevMode;
      // If switching FROM edit mode (cancelling), reset editData to match current profile
      if (!nextMode && profile) {
        setEditData({
          address: profile.address || "",
          city: profile.city || "",
          postalCode: profile.postalCode || "",
          currentLocation: profile.currentLocation || "",
        });
      }
      // Clear messages when toggling mode
      setError(null);
      setSuccessMessage(null);
      setLocationError(null);
      return nextMode; // Return the new mode state
    });
  }, [profile]); // Depends on profile state to reset correctly

  // Handles saving the edited profile data
  const handleSaveChanges = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    setLocationError(null);

    // Client-side validation could be added here using Zod if needed

    const dataToSave = { ...editData }; // Data from the edit form state

    setIsSaving(true); // Set saving state
    try {
      const result = await updateMyProfileApi(dataToSave); // Call update API
      if (result.success && result.data) {
        setProfile(result.data); // Update the displayed profile with the new data
        setSuccessMessage("Profile updated successfully!"); // Show success message
        setIsEditMode(false); // Exit edit mode
      } else {
        // Throw error if API indicates failure
        throw new Error(result.message || "Failed to save profile.");
      }
    } catch (err) {
      // Set error state if saving fails
      setError((err as Error).message);
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false); // Reset saving state
    }
  }, [editData]); // Depends on the data being edited

  // Handles fetching the user's current geolocation
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsFetchingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(
          6
        )}`;
        // Update only the currentLocation field in the editData state
        setEditData((prev) => ({ ...prev, currentLocation: locationString }));
        setIsFetchingLocation(false);
      },
      (error) => {
        let message = "Could not retrieve location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        setLocationError(message);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []); // No dependencies needed

  const onAutocompleteLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      console.log("Google Autocomplete loaded.");
      setAutocompleteInstance(autocomplete);
    },
    []
  );

  const onPlaceChanged = useCallback(() => {
    if (autocompleteInstance !== null) {
      const place = autocompleteInstance.getPlace();
      console.log("Place selected:", place);

      // Extract address components
      let streetNumber = "";
      let route = "";
      let city = "";
      let postalCode = "";
      // let province = ""; // Example
      // let country = ""; // Example

      place.address_components?.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) streetNumber = component.long_name;
        if (types.includes("route")) route = component.long_name; // Street name
        if (types.includes("locality") || types.includes("postal_town"))
          city = component.long_name; // City
        // Use administrative_area_level_1 for province/state if needed
        // if (types.includes("administrative_area_level_1")) province = component.short_name;
        if (types.includes("postal_code")) postalCode = component.long_name;
        // if (types.includes("country")) country = component.short_name;
      });

      const formattedAddress =
        place.formatted_address || `${streetNumber} ${route}`.trim();

      // Update form state - override relevant fields
      setEditData((prev) => ({
        ...prev,
        address: formattedAddress || prev.address, // Use formatted address or keep existing if none
        city: city || prev.city, // Update city if found
        postalCode: postalCode || prev.postalCode, // Update postal code if found
        // Optionally clear currentLocation if address is manually set via autocomplete
        // currentLocation: '',
      }));
      setError(null); // Clear errors after selection
      setSuccessMessage(null);
    } else {
      console.error("Autocomplete instance is not loaded yet.");
    }
  }, [autocompleteInstance]);

  // --- Render Field Helper ---
  // Renders either a display paragraph or an input/textarea based on edit mode
  const renderField = (
    label: string,
    fieldName: keyof IProfileUpdateData, // Field name matching state keys
    IconComponent: React.ElementType, // Icon component to display
    isTextarea: boolean = false,
    isAddressAutocomplete: boolean = false
  ) => {
    // Get the current value to display or edit
    const currentValue = isEditMode
      ? editData[fieldName]
      : profile?.[fieldName];

    return (
      <div className="form-item profile-field">
        <label htmlFor={isEditMode ? fieldName : undefined}>{label}</label>
        <div className="profile-field-content-flex">
          <IconComponent className="profile-field-icon" />
          {isEditMode ? (
            // --- Conditionally render Autocomplete or standard input/textarea ---
            isAddressAutocomplete && isGoogleMapsLoaded ? (
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                // Optional: Restrict to Canada and specific types
                options={{
                  componentRestrictions: { country: "ca" }, // Restrict to Canada
                  types: ["address"], // Only suggest addresses
                }}
                // Note: Autocomplete wraps an input, not a textarea
              >
                <input
                  type="text"
                  id={fieldName}
                  name={fieldName} // Important for state update
                  value={editData[fieldName] || ""} // Use editData for value
                  onChange={handleEditChange} // Still needed for manual typing
                  className="profile-input" // Style appropriately
                  placeholder="Start typing your address..."
                  disabled={isSaving}
                  ref={addressInputRef} // Optional ref if needed
                />
              </Autocomplete>
            ) : isTextarea ? ( // Fallback or non-autocomplete fields
              <textarea
                id={fieldName}
                name={fieldName}
                value={editData[fieldName] || ""}
                onChange={handleEditChange}
                className="profile-input textarea"
                rows={3}
                disabled={isSaving}
              />
            ) : (
              // Standard input fallback
              <input
                type="text"
                id={fieldName}
                name={fieldName}
                value={editData[fieldName] || ""}
                onChange={handleEditChange}
                className="profile-input"
                disabled={isSaving}
              />
            )
          ) : (
            // Display mode
            <p className="profile-value">
              {currentValue || <span className="text-muted">Not set</span>}
            </p>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render Logic ---

  // Display loading indicator during initial fetch
  if (isLoading) {
    return (
      <div className="loading-placeholder text-center p-10">
        Loading Profile...
      </div>
    );
  }

  // Display error if initial fetch failed and profile is still null
  if (error && !profile && !isEditMode) {
    return (
      <div className="form-message error text-center p-10">
        <p>{error}</p>
        {/* Allow user to retry fetching */}
        <button
          onClick={fetchProfile}
          className="profile-button retry profile-section-spacing"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle case where profile is unexpectedly null after loading without error
  if (!profile) {
    return (
      <div className="text-center p-10">
        Could not load profile data. Please try again later.
      </div>
    );
  }

  // Render the main profile view
  return (
    <div className="profile-manager">
      {" "}
      {/* Add padding/styling via CSS */}
      {/* Section for non-editable info */}
      <div className="profile-static-info">
        <div className="form-item profile-field read-only">
          <label>Full Name</label>
          <div className="profile-field-content-flex">
            <HiOutlineUserCircle className="profile-field-icon" />
            <p className="profile-value">{profile.fullName || "N/A"}</p>
          </div>
        </div>
        <div className="form-item profile-field read-only">
          <label>Email</label>
          <div className="profile-field-content-flex">
            <HiOutlineEnvelope className="profile-field-icon" />
            <p className="profile-value">{profile.email || "N/A"}</p>
          </div>
        </div>
        <div className="form-item profile-field read-only">
          <label>Mobile</label>
          <div className="profile-field-content-flex">
            <HiOutlineDevicePhoneMobile className="profile-field-icon" />
            <p className="profile-value">{profile.mobile || "N/A"}</p>
          </div>
        </div>
      </div>
      {/* Divider for visual separation */}
      <div className="profile-divider"></div>
      {/* Section for editable address information */}
      <div className="profile-address-info">
        <h2 className="profile-section-title">Address Information</h2>
        {error && isEditMode && (
          <div className="form-message error">{error}</div>
        )}
        {successMessage && !isEditMode && (
          <div className="form-message success">{successMessage}</div>
        )}
        {/* --- Call renderField with isAddressAutocomplete flag --- */}
        {renderField("Address", "address", HiOutlineMapPin, false, true)}{" "}
        {/* Changed isTextarea to false */}
        {/* -------------------------------------------------------- */}
        {renderField("City", "city", HiOutlineBuildingOffice2)}
        {renderField("Postal Code", "postalCode", HiOutlineIdentification)}
        {renderField("Current Location", "currentLocation", HiOutlineMapPin)}
      </div>
      {/* Geolocation Button - only shown in edit mode */}
      {isEditMode && (
        <div className="get-location-action profile-section-spacing">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="profile-button location" // Style this button
            disabled={isSaving || isFetchingLocation}
          >
            {isFetchingLocation ? "Fetching..." : "Use Current Location"}
          </button>
          {/* Display location-specific errors */}
          {locationError && (
            <p className="error-text location-error-spacing">{locationError}</p>
          )}
        </div>
      )}
      {/* Edit/Save/Cancel Action Buttons */}
      <div className="profile-actions profile-section-spacing">
        {isEditMode ? (
          // Buttons shown during edit mode
          <>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="profile-button save"
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
              className="profile-button cancel"
              disabled={isSaving}
            >
              <HiOutlineXMark className="icon" /> Cancel
            </button>
          </>
        ) : (
          // Button shown in display mode
          <button
            type="button"
            onClick={toggleEditMode}
            className="profile-button edit"
            disabled={isLoading}
          >
            <HiOutlinePencil className="icon" /> Edit Profile
          </button>
        )}
      </div>
    </div> // End profile-manager
  );
};

export default ProfileManager;
