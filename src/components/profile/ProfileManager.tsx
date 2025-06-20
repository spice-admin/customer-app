// src/components/profile/ProfileManager.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient"; // Import Supabase client
import type { User } from "@supabase/supabase-js"; // Import Supabase User type
import type { ICustomerProfile, IProfileUpdateData } from "../../types";
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
import DeleteAccountSettings from "./DeleteAccountSettings";

const libraries: "places"[] = ["places"];

const ProfileManager: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ICustomerProfile | null>(null);
  const [editData, setEditData] = useState<IProfileUpdateData>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [autocompleteInstance, setAutocompleteInstance] =
    useState<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const googleMapsApiKey = import.meta.env.PUBLIC_Maps_API_KEY || ""; // Ensure it's a string
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsLoadError } =
    useLoadScript({
      googleMapsApiKey: googleMapsApiKey,
      libraries: libraries,
      // region: 'CA', // Optional: if you want to restrict
    });

  useEffect(() => {
    if (googleMapsLoadError) {
      console.error("Error loading Google Maps script:", googleMapsLoadError);
      setError("Could not load address suggestions. Please try again later.");
    }
    if (!googleMapsApiKey && !isGoogleMapsLoaded) {
      // Check if key is missing only if not already loaded (e.g. from cache)
      console.warn(
        "Google Maps API Key (PUBLIC_Maps_API_KEY) is missing. Address autocomplete will not work."
      );
    }
  }, [googleMapsLoadError, googleMapsApiKey, isGoogleMapsLoaded]);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setProfile(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(
          authError?.message || "You must be logged in to view your profile."
        );
      }
      setCurrentUser(user); // Store current user

      const { data: profileData, error: profileFetchError } = await supabase
        .from("profiles")
        .select(
          `
          full_name,
          phone,
          is_phone_verified,
          address,
          city,
          postal_code,
          current_location 
        `
        ) // Select all relevant fields from 'profiles'
        .eq("id", user.id)
        .single();

      if (profileFetchError) {
        // Handle case where profile might not exist yet for a new user (though our trigger should handle it)
        if (profileFetchError.code === "PGRST116") {
          // " réfrigérés" (resource not found)
          console.warn(
            "Profile not found for user, might be a new user before trigger completion or error:",
            user.id
          );
          // Initialize with what we have from auth, and empty editable fields
          const newProfile: ICustomerProfile = {
            id: user.id,
            email: user.email || null,
            fullName: (user.user_metadata?.full_name as string) || null, // from signup
            phone: (user.user_metadata?.phone as string) || null, // from signup
            isPhoneVerified: false, // Default for new profile
            address: "",
            city: "",
            postal_code: "",
            current_location: "",
          };
          setProfile(newProfile);
          setEditData({
            address: "",
            city: "",
            postal_code: "",
            current_location: "",
          });
        } else {
          throw profileFetchError;
        }
      } else if (profileData) {
        const fetchedProfile: ICustomerProfile = {
          id: user.id,
          email: user.email || null, // Email from auth user object
          fullName: profileData.full_name,
          phone: profileData.phone,
          isPhoneVerified: profileData.is_phone_verified,
          address: profileData.address,
          city: profileData.city,
          postal_code: profileData.postal_code,
          current_location: profileData.current_location,
        };
        setProfile(fetchedProfile);
        setEditData({
          address: fetchedProfile.address || "",
          city: fetchedProfile.city || "",
          postal_code: fetchedProfile.postal_code || "",
          current_location: fetchedProfile.current_location || "",
        });
      } else {
        // Should not happen if no error and user exists, but as a fallback
        throw new Error("Profile data could not be loaded.");
      }
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setEditData((prev) => ({ ...prev, [name]: value }));
      setError(null);
      setSuccessMessage(null);
      setLocationError(null);
    },
    []
  );

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prevMode) => {
      const nextMode = !prevMode;
      if (!nextMode && profile) {
        // Switching from edit to display
        setEditData({
          // Reset editData from current profile state
          address: profile.address || "",
          city: profile.city || "",
          postal_code: profile.postal_code || "",
          current_location: profile.current_location || "",
        });
      }
      setError(null);
      setSuccessMessage(null);
      setLocationError(null);
      return nextMode;
    });
  }, [profile]);

  const handleSaveChanges = useCallback(async () => {
    if (!currentUser) {
      setError("User not authenticated. Please log in.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLocationError(null);
    setIsSaving(true);

    // Prepare only the fields that are in IProfileUpdateData and exist in the 'profiles' table
    const updatePayload: IProfileUpdateData = {
      address: editData.address,
      city: editData.city,
      postal_code: editData.postal_code, // Ensure your DB column name is 'postal_code'
      current_location: editData.current_location, // Ensure DB column is 'current_location'
    };

    try {
      const { data: updatedProfileData, error: updateError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", currentUser.id)
        .select(
          `
          full_name, 
          phone, 
          is_phone_verified,
          address, 
          city, 
          postal_code, 
          current_location
        `
        ) // Select all fields to update the local state accurately
        .single();

      if (updateError) {
        throw updateError;
      }

      if (updatedProfileData) {
        // Construct the full profile object for local state
        const newFullProfile: ICustomerProfile = {
          id: currentUser.id,
          email: currentUser.email || null,
          fullName: updatedProfileData.full_name, // This won't change with current payload but good to refetch
          phone: updatedProfileData.phone, // Same here
          isPhoneVerified: updatedProfileData.is_phone_verified, // Same here
          address: updatedProfileData.address,
          city: updatedProfileData.city,
          postal_code: updatedProfileData.postal_code,
          current_location: updatedProfileData.current_location,
        };
        setProfile(newFullProfile);
        setSuccessMessage("Profile updated successfully!");
        setIsEditMode(false);
      } else {
        throw new Error("Failed to retrieve updated profile after saving.");
      }
    } catch (err) {
      setError((err as Error).message || "Failed to save profile.");
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  }, [editData, currentUser]);

  // handleGetcurrent_location, onAutocompleteLoad, onPlaceChanged remain mostly the same
  // Just ensure field names in setEditData match IProfileUpdateData and your form inputs

  const handleGetcurrent_location = useCallback(() => {
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
        setEditData((prev) => ({ ...prev, current_location: locationString }));
        setIsFetchingLocation(false);
      },
      (geoError) => {
        let message = "Could not retrieve location.";
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            message = "Location permission denied.";
            break;
          case geoError.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case geoError.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        setLocationError(message);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const onAutocompleteLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      setAutocompleteInstance(autocomplete);
    },
    []
  );

  const onPlaceChanged = useCallback(() => {
    if (autocompleteInstance !== null) {
      const place = autocompleteInstance.getPlace();
      let streetNumber = "",
        route = "",
        city = "",
        postal_code = "";

      place.address_components?.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) streetNumber = component.long_name;
        if (types.includes("route")) route = component.long_name;
        if (types.includes("locality") || types.includes("postal_town"))
          city = component.long_name;
        if (types.includes("postal_code")) postal_code = component.long_name;
      });
      const formattedAddress =
        place.formatted_address || `${streetNumber} ${route}`.trim();
      setEditData((prev) => ({
        ...prev,
        address: formattedAddress || prev.address,
        city: city || prev.city,
        postal_code: postal_code || prev.postal_code,
      }));
      setError(null);
      setSuccessMessage(null);
    } else {
      console.error("Autocomplete instance is not loaded yet.");
    }
  }, [autocompleteInstance]);

  // --- Render Field Helper (ensure 'fieldName' matches keys in IProfileUpdateData & ICustomerProfile where applicable) ---
  const renderField = (
    label: string,
    fieldName:
      | keyof IProfileUpdateData
      | keyof Pick<ICustomerProfile, "current_location">, // Ensure fieldName is a key of IProfileUpdateData or specific ICustomerProfile fields if they are part of editData conceptually
    IconComponent: React.ElementType,
    isTextarea: boolean = false,
    isAddressAutocomplete: boolean = false
  ) => {
    const displayValue = profile?.[fieldName as keyof ICustomerProfile]; // For display mode
    const editValue = editData[fieldName as keyof IProfileUpdateData] ?? ""; // For edit mode, ensure it's part of editData

    return (
      <div className="form-item profile-field">
        <label htmlFor={isEditMode ? fieldName : undefined}>{label}</label>
        <div className="profile-field-content-flex">
          <IconComponent className="profile-field-icon" />
          {isEditMode ? (
            isAddressAutocomplete && isGoogleMapsLoaded ? (
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  componentRestrictions: { country: "ca" },
                  types: ["address"],
                }} // Example: restrict to Canada
              >
                <input
                  type="text"
                  id={fieldName}
                  name={fieldName}
                  value={editData.address || ""} // Specifically use editData.address for the Autocomplete input
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  } // Update address field
                  className="profile-input"
                  placeholder="Start typing your address..."
                  disabled={isSaving}
                  ref={addressInputRef}
                />
              </Autocomplete>
            ) : isTextarea ? (
              <textarea
                id={fieldName}
                name={fieldName}
                value={editValue}
                onChange={handleEditChange}
                className="profile-input textarea"
                rows={3}
                disabled={isSaving}
              />
            ) : (
              <input
                type="text"
                id={fieldName}
                name={fieldName}
                value={editValue}
                onChange={handleEditChange}
                className="profile-input"
                disabled={isSaving}
              />
            )
          ) : (
            <p className="profile-value">
              {displayValue || <span style={{ color: "#999" }}>Not set</span>}{" "}
              {/* More visible 'Not set' */}
            </p>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render Logic ---
  if (isLoading)
    return (
      <div className="loading-placeholder text-center p-10">
        Loading Profile...
      </div>
    );

  // Error during initial load, and profile hasn't been set by fallback
  if (error && !profile && !isEditMode) {
    return (
      <div className="form-message error text-center p-10">
        <p>{error}</p>
        <button
          onClick={fetchProfile}
          className="profile-button retry profile-section-spacing"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile)
    return (
      <div className="text-center p-10">
        Could not load profile data. Please try logging in again.
      </div>
    );

  // --- Main Profile View ---
  return (
    <div className="profile-manager">
      {/* Non-editable info - direct from 'profile' state */}
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
            <p className="profile-value">
              {profile.phone || "N/A"}{" "}
              {profile.isPhoneVerified ? (
                <span style={{ color: "green", fontSize: "0.8em" }}>
                  {" "}
                  (Verified)
                </span>
              ) : (
                <span style={{ color: "orange", fontSize: "0.8em" }}>
                  {" "}
                  (Not Verified)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div
        className="profile-divider"
        style={{ borderBottom: "1px solid #eee", margin: "20px 0" }}
      ></div>

      <div className="profile-address-info">
        <h2
          className="profile-section-title"
          style={{ fontSize: "1.2em", marginBottom: "1em" }}
        >
          Address Information
        </h2>
        {/* Display error/success messages related to saving */}
        {error && isEditMode && (
          <div className="form-message error" style={{ marginBottom: "1em" }}>
            {error}
          </div>
        )}
        {successMessage && !isEditMode && (
          <div className="form-message success" style={{ marginBottom: "1em" }}>
            {successMessage}
          </div>
        )}

        {renderField("Address", "address", HiOutlineMapPin, false, true)}
        {renderField("City", "city", HiOutlineBuildingOffice2)}
        {renderField("Postal Code", "postal_code", HiOutlineIdentification)}
        {renderField("Order Location", "current_location", HiOutlineMapPin)}
      </div>

      {isEditMode && (
        <div
          className="get-location-action profile-section-spacing"
          style={{ marginTop: "1rem" }}
        >
          <button
            type="button"
            onClick={handleGetcurrent_location}
            className="profile-button location"
            disabled={isSaving || isFetchingLocation}
            style={{
              /* Add your button styles */ padding: "8px 12px",
              marginRight: "10px",
            }}
          >
            {isFetchingLocation ? "Fetching..." : "Use Current Location"}
          </button>
          {locationError && (
            <p
              className="error-text location-error-spacing"
              style={{ color: "red", fontSize: "0.8em", marginTop: "0.5em" }}
            >
              {locationError}
            </p>
          )}
        </div>
      )}

      <div
        className="profile-actions profile-section-spacing"
        style={{ marginTop: "1.5rem", display: "flex", gap: "10px" }}
      >
        {isEditMode ? (
          <>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="profile-button save"
              disabled={isSaving}
              style={{
                /* styles */ padding: "10px 15px",
                backgroundColor: "green",
                color: "white",
              }}
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
              style={{ /* styles */ padding: "10px 15px" }}
            >
              <HiOutlineXMark className="icon" /> Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleEditMode}
              className="profile-button edit"
              disabled={isLoading}
              style={{ /* styles */ padding: "10px 15px" }}
            >
              <HiOutlinePencil className="icon" /> Edit Profile
            </button>
            <DeleteAccountSettings />
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileManager;
