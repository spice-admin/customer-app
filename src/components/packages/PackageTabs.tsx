// src/components/packages/PackageTabs.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  getAllCategories,
  getAllPackages,
} from "../../services/package.service"; // Corrected import path
import type { ICategoryFE, IPackageFE } from "../../types";
import PackageCard from "./PackageCard";

const ALL_CATEGORY_ID = "all"; // Special ID for the "All" tab

const PackageTabs: React.FC = () => {
  const [categories, setCategories] = useState<ICategoryFE[]>([]);
  const [packages, setPackages] = useState<IPackageFE[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>(ALL_CATEGORY_ID);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "[PackageTabs] useEffect: Component Mounting. Starting data fetch..."
    );
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(
          "[PackageTabs] useEffect: Calling Promise.all for categories and packages..."
        );
        const [fetchedCategories, fetchedPackages] = await Promise.all([
          getAllCategories(),
          getAllPackages(),
        ]);

        // --- DETAILED LOGGING OF FETCHED DATA ---
        console.log(
          "[PackageTabs] useEffect: Categories fetched:",
          JSON.stringify(fetchedCategories, null, 2)
        ); // Log fetched categories
        console.log(
          "[PackageTabs] useEffect: Packages fetched:",
          JSON.stringify(fetchedPackages, null, 2)
        ); // Log fetched packages

        // Check if data looks valid before setting state
        if (!Array.isArray(fetchedCategories)) {
          throw new Error("Fetched categories is not an array.");
        }
        if (!Array.isArray(fetchedPackages)) {
          throw new Error("Fetched packages is not an array.");
        }
        // -----------------------------------------

        setCategories(fetchedCategories);
        setPackages(fetchedPackages);
        console.log(
          "[PackageTabs] useEffect: State updated with fetched data."
        );
      } catch (err) {
        console.error("[PackageTabs] useEffect: Error during data fetch:", err);
        setError(
          (err as Error).message ||
            "Could not load packages. Please try again later."
        );
        // Ensure state is empty on error
        setCategories([]);
        setPackages([]);
      } finally {
        console.log("[PackageTabs] useEffect: Setting isLoading to false.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means run once on mount

  // Filter packages based on the active tab
  const filteredPackages = useMemo(() => {
    // Log *before* filtering
    console.log(
      `[PackageTabs] useMemo: Filtering packages. Active Tab: ${activeTabId}. Total packages: ${packages.length}`
    );

    if (activeTabId === ALL_CATEGORY_ID) {
      console.log("[PackageTabs] useMemo: Showing ALL packages.");
      return packages; // Show all packages
    }
    const filtered = packages.filter((pkg) => {
      // Add log inside filter for detailed check
      // console.log(`[PackageTabs] useMemo: Checking package "${pkg.name}" with category ID "${pkg.category?._id}" against active tab "${activeTabId}"`);
      return pkg.category?._id === activeTabId;
    });
    console.log(
      `[PackageTabs] useMemo: Filtered packages count for tab ${activeTabId}: ${filtered.length}`
    );
    return filtered;
  }, [activeTabId, packages]); // Recalculate when tab or packages change

  // Handler for changing tabs
  const handleTabClick = (categoryId: string) => {
    console.log(
      "[PackageTabs] handleTabClick: Setting active tab to:",
      categoryId
    );
    setActiveTabId(categoryId);
  };

  // --- Render Logic ---
  console.log("[PackageTabs] Render: Component rendering. Current State:", {
    isLoading,
    error,
    activeTabId,
    categoriesCount: categories.length,
    packagesCount: packages.length,
    filteredPackagesCount: filteredPackages.length,
  });

  if (isLoading) {
    console.log("[PackageTabs] Render: Showing Loading state.");
    return (
      <div className="loading-placeholder text-center p-10 text-gray-500">
        Loading Packages...
      </div>
    );
  }

  if (error) {
    console.log("[PackageTabs] Render: Showing Error state:", error);
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
          console.log(
            "[PackageTabs] Render: Rendering tab for category:",
            category.name
          );
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
                console.log(
                  "[PackageTabs] Render: Rendering PackageCard for package:",
                  pkg.name
                );
                return <PackageCard key={pkg._id} pkg={pkg} />;
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
