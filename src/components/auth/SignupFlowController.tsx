// src/components/auth/SignupFlowController.tsx
import React, { useState, useEffect } from "react";
import CitySelectionPopup from "./CitySelectionPopup"; // The component from Step 2
import SignupForm from "./SignUpForm"; // Your existing SignupForm

const localStorageKey = "selectedCityFoodApp"; // Use a unique key

const SignupFlowController: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  // Determine initial state for showing popup based on localStorage
  const [showPopup, setShowPopup] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      // Ensure localStorage is available
      const storedCity = localStorage.getItem(localStorageKey);
      return !storedCity; // Show popup if no city is stored
    }
    return true; // Default to showing popup if localStorage can't be accessed (e.g. SSR)
  });

  useEffect(() => {
    // This effect runs client-side to correctly initialize based on localStorage
    const storedCity = localStorage.getItem(localStorageKey);
    if (storedCity) {
      setSelectedCity(storedCity);
      setShowPopup(false);
    } else {
      setShowPopup(true);
    }
  }, []);

  const handleCitySelected = (city: string) => {
    localStorage.setItem(localStorageKey, city);
    setSelectedCity(city);
    setShowPopup(false);
  };

  if (showPopup) {
    return (
      <CitySelectionPopup onCitySelected={handleCitySelected} isOpen={true} />
    );
  }

  if (selectedCity) {
    // You could pass selectedCity as a prop to SignupForm if it needs to know the city
    // e.g., <SignupForm selectedCity={selectedCity} />
    return <SignupForm />;
  }

  // Optional: Show a loading indicator or null while checking localStorage,
  // though the initial state of showPopup should handle most cases.
  // If typeof window === 'undefined' during useState init, this might briefly show before client-side useEffect runs.
  return <p>Loading application...</p>; // Or your loader component from signup.astro
};

export default SignupFlowController;
