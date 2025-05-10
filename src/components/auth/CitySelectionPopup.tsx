// src/components/auth/CitySelectionPopup.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path if necessary

interface City {
  id: string; // Assuming UUID from your table image
  name: string;
}

interface CitySelectionPopupProps {
  onCitySelected: (city: string) => void;
  isOpen: boolean;
}

const CitySelectionPopup: React.FC<CitySelectionPopupProps> = ({
  onCitySelected,
  isOpen,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCities = async () => {
        setIsLoading(true);
        setError(null);
        // Fetch from your 'cities' table
        const { data, error: dbError } = await supabase
          .from("cities") // Using your table name
          .select("id, name")
          .order("name", { ascending: true });

        if (dbError) {
          console.error("Error fetching cities:", dbError);
          setError("Could not load cities. Please try again later.");
        } else if (data) {
          setCities(data as City[]); // Cast if necessary, Supabase types should infer
        }
        setIsLoading(false);
      };
      fetchCities();
    }
  }, [isOpen]);

  const handleSelectCity = () => {
    if (selectedCity) {
      onCitySelected(selectedCity);
    }
  };

  if (!isOpen) {
    return null;
  }

  // --- Reusing the styles from previous suggestion for the modal ---
  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };
  const modalContentStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    width: "90%",
    maxWidth: "500px",
    textAlign: "center",
  };
  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "16px",
  };
  const buttonStyle: React.CSSProperties = {
    padding: "12px 25px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    opacity: !selectedCity || isLoading ? 0.7 : 1,
  };
  const warningMessageStyle: React.CSSProperties = {
    marginBottom: "20px",
    fontSize: "14px",
    color: "#555",
  };
  const headingStyle: React.CSSProperties = {
    marginBottom: "15px",
    fontSize: "22px",
    color: "#333",
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={headingStyle}>Select Your City</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {isLoading ? (
          <p>Loading cities...</p>
        ) : (
          <>
            <p style={warningMessageStyle}>
              If you do not find your city in the following list, sorry we will
              not be able to deliver meals to you.
            </p>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={selectStyle}
              aria-label="Select your city"
            >
              <option value="" disabled>
                -- Please choose a city --
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSelectCity}
              disabled={!selectedCity || isLoading}
              style={buttonStyle}
            >
              Proceed
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CitySelectionPopup;
