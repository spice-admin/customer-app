// src/components/packages/PackageTabs.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getAllCategories,
  getAllPackages,
} from "../../services/package.service";
import { getMyProfileApi } from "../../services/customer.service";
import type { ICategoryFE, IPackageFE, ICustomerProfile } from "../../types";
import PackageCard from "./PackageCard";

const ALL_CATEGORY_ID = "all";
//const apiUrlFromEnv = import.meta.env.PUBLIC_API_BASE_URL;

const PackageTabs: React.FC = () => {
  const [categories, setCategories] = useState<ICategoryFE[]>([]);
  const [packages, setPackages] = useState<IPackageFE[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>(ALL_CATEGORY_ID);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<ICustomerProfile | null>(null);

  // Fetch all data on component mount
  const fetchData = useCallback(async () => {
    // Wrap in useCallback
    setIsLoading(true);
    setError(null);
    setUserProfile(null); // Reset profile on refetch
    console.log("[PackageTabs] Fetching categories, packages, and profile...");
    try {
      // Fetch all data in parallel
      const [catResult, pkgResult, profileResult] = await Promise.all([
        getAllCategories(), // Assuming this returns array directly on success
        getAllPackages(), // Assuming this returns array directly on success
        getMyProfileApi(), // This returns ApiResponse<ICustomerProfile>
      ]);

      // Check profile response first (as it's needed for subscribe check)
      if (profileResult.success && profileResult.data) {
        console.log("[PackageTabs] Profile fetched successfully.");
        setUserProfile(profileResult.data);
      } else {
        // Handle profile fetch failure - might prevent subscriptions
        console.warn(
          "[PackageTabs] Failed to fetch user profile:",
          profileResult.message
        );
        // Decide if this is a critical error or just prevents subscription
        // setError(`Could not load user profile: ${profileResult.message}`);
        // For now, let it proceed but profile will be null
      }

      // Set categories and packages (assuming they throw on error)
      setCategories(catResult);
      setPackages(pkgResult);
      console.log("[PackageTabs] Categories and Packages state updated.");
    } catch (err) {
      console.error("[PackageTabs] Error during data fetch:", err);
      setError(
        (err as Error).message || "Could not load data. Please try again later."
      );
      setCategories([]); // Ensure empty state on error
      setPackages([]);
      setUserProfile(null);
    } finally {
      console.log("[PackageTabs] Setting isLoading to false.");
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  // Filter packages based on the active tab
  const filteredPackages = useMemo(() => {
    // Log *before* filtering

    if (activeTabId === ALL_CATEGORY_ID) {
      return packages; // Show all packages
    }
    const filtered = packages.filter((pkg) => {
      return pkg.category?._id === activeTabId;
    });

    return filtered;
  }, [activeTabId, packages]); // Recalculate when tab or packages change

  // Handler for changing tabs
  const handleTabClick = (categoryId: string) => {
    setActiveTabId(categoryId);
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="loading-placeholder text-center p-10 text-gray-500">
        Loading Packages...
      </div>
    );
  }

  if (error) {
    return <div className="form-message error text-center p-10">{error}</div>;
  }

  // Handle case where data is loaded but potentially empty
  // Note: We might have categories but no packages, or vice-versa
  // if (categories.length === 0 && packages.length === 0) {
  //     console.log('[PackageTabs] Render: Showing No Data message (both empty).');
  //     return <div className="text-center p-10 text-gray-500">No categories or packages available.</div>;
  // }

  return (
    <div className="tabs-section1" id="suggest-food-items">
      {/* Tab Navigation */}
      <nav>
        <button
          type="button"
          onClick={() => handleTabClick(ALL_CATEGORY_ID)}
          className={activeTabId === ALL_CATEGORY_ID ? "active" : ""}
        >
          💥 All
        </button>

        {categories.map((category) => {
          return (
            <button
              key={category._id}
              type="button"
              onClick={() => handleTabClick(category._id)}
              className={activeTabId === category._id ? "active" : ""}
            >
              {category.name}
            </button>
          );
        })}
      </nav>

      {/* Tab Content Area */}
      <div className="tabContainer">
        <div className="Tabcondent active">
          {filteredPackages.length > 0 ? (
            <div className="packages-grid">
              {filteredPackages.map((pkg) => {
                return (
                  <PackageCard
                    key={pkg._id}
                    pkg={pkg}
                    hasAddressInfo={
                      !!(userProfile?.address && userProfile?.city)
                    }
                  />
                );
              })}
            </div>
          ) : (
            <p className="no-packages-message">
              {/* Check if original packages array had items */}
              {packages.length > 0
                ? `No packages found in the "${
                    categories.find((c) => c._id === activeTabId)?.name ||
                    "selected"
                  }" category.`
                : "No packages available at the moment."}
            </p>
          )}
        </div>
      </div>
      {/* Styles should be in global CSS */}
    </div>
  );
};

export default PackageTabs;
